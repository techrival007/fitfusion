from __future__ import annotations

import json
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import Any

import httpx

from app.config import settings
from app.database import get_redis


AQI_SCALE = [
    {"max": 50, "label": "Good", "color": "#55a84f", "bg": "#f0fdf4"},
    {"max": 100, "label": "Satisfactory", "color": "#a3c853", "bg": "#f7fee7"},
    {"max": 200, "label": "Moderate", "color": "#f59e0b", "bg": "#fefce8"},
    {"max": 300, "label": "Poor", "color": "#f29c33", "bg": "#fff7ed"},
    {"max": 400, "label": "Very Poor", "color": "#e93f33", "bg": "#fef2f2"},
    {"max": float("inf"), "label": "Severe", "color": "#af2d24", "bg": "#fee2e2"},
]

AQI_RISK_COPY = {
    "Good": "Excellent day for outdoor movement.",
    "Satisfactory": "Outdoor activity is generally safe.",
    "Moderate": "Prefer lighter outdoor activity and watch exertion.",
    "Poor": "Limit outdoor workouts and favor indoor exercise.",
    "Very Poor": "Avoid strenuous outdoor activity today.",
    "Severe": "Stay indoors and minimize outdoor exertion.",
}


def get_aqi_info(aqi: float | int | None) -> dict[str, Any]:
    if aqi is None:
        return AQI_SCALE[2]
    for item in AQI_SCALE:
        if aqi <= item["max"]:
            return item
    return AQI_SCALE[-1]


def is_outdoor_safe(
    aqi: float | int | None,
    temp_c: float | None = None,
    precip_probability: float | None = None,
) -> bool:
    if aqi is not None and aqi > 150:
        return False
    if temp_c is not None and temp_c >= 38:
        return False
    if precip_probability is not None and precip_probability >= 65:
        return False
    return True


def compute_sleep_risk(
    *,
    aqi: float | None,
    humidity_pct: float | None,
    temp_c: float | None,
    wind_kph: float | None,
) -> float:
    risk = 0.0
    if aqi is not None:
        risk += min(45.0, max(0.0, (aqi - 50) / 3.5))
    if humidity_pct is not None:
        risk += max(0.0, humidity_pct - 65) * 0.5
    if temp_c is not None:
        risk += max(0.0, temp_c - 28) * 3.0
    if wind_kph is not None:
        risk += max(0.0, wind_kph - 20) * 0.8
    return round(min(100.0, risk), 1)


def compute_env_stress(
    *,
    aqi: float | None,
    temp_c: float | None,
    humidity_pct: float | None,
    uv_index: float | None,
) -> float:
    stress = 0.0
    if aqi is not None:
        stress += min(55.0, max(0.0, (aqi - 50) / 2.8))
    if temp_c is not None:
        stress += max(0.0, temp_c - 32) * 4.0
    if humidity_pct is not None:
        stress += max(0.0, humidity_pct - 70) * 0.4
    if uv_index is not None:
        stress += max(0.0, uv_index - 6) * 4.5
    return round(min(100.0, stress), 1)


class AccuWeatherClient:
    base_url = "https://dataservice.accuweather.com"

    def __init__(self) -> None:
        self.api_key = settings.accuweather_api_key
        self.language = settings.accuweather_language

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    async def _request(self, path: str, *, params: dict[str, Any] | None = None) -> Any:
        if not self.api_key:
            raise RuntimeError("AccuWeather API key not configured")

        request_params = {"language": self.language, "apikey": self.api_key}
        if params:
            request_params.update({k: v for k, v in params.items() if v is not None})

        async with httpx.AsyncClient(base_url=self.base_url, timeout=20.0) as client:
            response = await client.get(
                path,
                params=request_params,
                headers={"Accept-Encoding": "gzip,deflate"},
            )
            response.raise_for_status()
            return response.json()

    async def resolve_location(self) -> dict[str, Any]:
        if settings.accuweather_location_key:
            return {"Key": settings.accuweather_location_key}

        if settings.accuweather_geoposition:
            data = await self._request(
                "/locations/v1/cities/geoposition/search",
                params={"q": settings.accuweather_geoposition, "details": "true"},
            )
            return data

        data = await self._request(
            "/locations/v1/cities/search",
            params={"q": settings.accuweather_location_query, "details": "true"},
        )
        if data:
            return data[0]

        data = await self._request(
            "/locations/v1/search",
            params={"q": settings.accuweather_location_query, "details": "true"},
        )
        if data:
            return data[0]

        raise RuntimeError("No AccuWeather location match found")

    async def get_current_conditions(self, location_key: str) -> dict[str, Any] | None:
        data = await self._request(
            f"/currentconditions/v1/{location_key}",
            params={"details": "true"},
        )
        return data[0] if data else None

    async def get_hourly_forecast(
        self, location_key: str, hours: int = 12
    ) -> list[dict[str, Any]]:
        hours = 12 if hours <= 12 else 24 if hours <= 24 else 72 if hours <= 72 else 120
        return await self._request(
            f"/forecasts/v1/hourly/{hours}hour/{location_key}",
            params={"details": "true", "metric": "true"},
        )

    async def get_daily_forecast(
        self, location_key: str, days: int = 5
    ) -> dict[str, Any]:
        if days <= 1:
            bucket = "1day"
        elif days <= 5:
            bucket = "5day"
        elif days <= 10:
            bucket = "10day"
        else:
            bucket = "15day"
        return await self._request(
            f"/forecasts/v1/daily/{bucket}/{location_key}",
            params={"details": "true", "metric": "true"},
        )

    async def get_air_quality_index(self, location_key: str) -> dict[str, Any] | None:
        data = await self._request(f"/indices/v1/daily/1day/{location_key}/-10")
        return data[0] if data else None

    async def get_uv_index(self, location_key: str) -> dict[str, Any] | None:
        data = await self._request(f"/indices/v1/daily/1day/{location_key}/-15")
        return data[0] if data else None

    async def get_alerts(self, location_key: str) -> list[dict[str, Any]]:
        return await self._request(f"/alerts/v1/{location_key}")


def normalize_current_environment(
    conditions: dict[str, Any] | None,
    aq_index: dict[str, Any] | None,
    uv_index_payload: dict[str, Any] | None,
    location: dict[str, Any] | None,
) -> dict[str, Any]:
    temp_c = (
        conditions.get("Temperature", {}).get("Metric", {}).get("Value")
        if conditions
        else None
    )
    humidity = conditions.get("RelativeHumidity") if conditions else None
    uv_index = conditions.get("UVIndexFloat") if conditions else None
    if uv_index in (None, {}):
        uv_index = conditions.get("UVIndex") if conditions else None
    if uv_index in (None, {}) and uv_index_payload:
        uv_index = uv_index_payload.get("Value")

    aqi_value = None
    aqi_category = None
    aqi_text = None
    if aq_index:
        aqi_value = aq_index.get("Value")
        aqi_category = aq_index.get("Category")
        aqi_text = aq_index.get("Text")
    aqi_info = get_aqi_info(aqi_value)

    precip_probability = None
    resolved_location = _fallback_location(location)
    normalized = {
        "source": "accuweather" if conditions or aq_index else "fallback",
        "location": resolved_location,
        "observed_at": conditions.get("LocalObservationDateTime")
        if conditions
        else None,
        "weather_text": conditions.get("WeatherText") if conditions else None,
        "weather_icon": conditions.get("WeatherIcon") if conditions else None,
        "is_daytime": conditions.get("IsDayTime") if conditions else True,
        "temperature_c": round(float(temp_c), 1) if temp_c is not None else None,
        "real_feel_c": _metric_value(conditions, "RealFeelTemperature"),
        "real_feel_shade_c": _metric_value(conditions, "RealFeelTemperatureShade"),
        "apparent_temperature_c": _metric_value(conditions, "ApparentTemperature"),
        "humidity_pct": int(humidity) if humidity is not None else None,
        "dew_point_c": _metric_value(conditions, "DewPoint"),
        "wind_kph": _nested_metric_value(conditions, ["Wind", "Speed"]),
        "wind_gust_kph": _nested_metric_value(conditions, ["WindGust", "Speed"]),
        "wind_direction": ((conditions.get("Wind") or {}).get("Direction") or {}).get(
            "Localized"
        )
        if conditions
        else None,
        "wind_direction_degrees": (
            (conditions.get("Wind") or {}).get("Direction") or {}
        ).get("Degrees")
        if conditions
        else None,
        "visibility_km": _metric_value(conditions, "Visibility"),
        "pressure_mb": _metric_value(conditions, "Pressure"),
        "cloud_cover_pct": conditions.get("CloudCover") if conditions else None,
        "precip_1h_mm": _metric_value(conditions, "Precip1hr"),
        "has_precipitation": conditions.get("HasPrecipitation")
        if conditions
        else False,
        "precipitation_type": conditions.get("PrecipitationType")
        if conditions
        else None,
        "uv_index": round(float(uv_index), 1) if uv_index not in (None, {}) else None,
        "uv_text": conditions.get("UVIndexText")
        if conditions
        else uv_index_payload.get("Category")
        if uv_index_payload
        else None,
        "aqi": round(float(aqi_value), 0) if aqi_value is not None else None,
        "aqi_category": aqi_category or aqi_info["label"],
        "aqi_color": aqi_info["color"],
        "aqi_bg": aqi_info["bg"],
        "aqi_text": aqi_text,
        "dominant_pollutant": None,
        "pollutants": [],
        "outdoor_safe": is_outdoor_safe(aqi_value, temp_c, precip_probability),
        "sleep_risk": compute_sleep_risk(
            aqi=float(aqi_value) if aqi_value is not None else None,
            humidity_pct=float(humidity) if humidity is not None else None,
            temp_c=float(temp_c) if temp_c is not None else None,
            wind_kph=_nested_metric_value(conditions, ["Wind", "Speed"]),
        ),
        "env_stress_score": compute_env_stress(
            aqi=float(aqi_value) if aqi_value is not None else None,
            temp_c=float(temp_c) if temp_c is not None else None,
            humidity_pct=float(humidity) if humidity is not None else None,
            uv_index=float(uv_index) if uv_index not in (None, {}) else None,
        ),
        "activity_recommendation": AQI_RISK_COPY.get(
            aqi_category or aqi_info["label"],
            "Adjust activity intensity based on conditions.",
        ),
    }
    return normalized


def normalize_hourly_forecast(
    entries: list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    result = []
    for item in entries or []:
        temp_c = _metric_value(item, "Temperature")
        aqi_safe = is_outdoor_safe(None, temp_c, item.get("PrecipitationProbability"))
        result.append(
            {
                "forecast_at": item.get("DateTime"),
                "epoch_time": item.get("EpochDateTime"),
                "is_daylight": item.get("IsDaylight"),
                "icon_phrase": item.get("IconPhrase"),
                "weather_icon": item.get("WeatherIcon"),
                "temperature_c": temp_c,
                "real_feel_c": _metric_value(item, "RealFeelTemperature"),
                "humidity_pct": item.get("RelativeHumidity"),
                "dew_point_c": _metric_value(item, "DewPoint"),
                "wind_kph": _nested_metric_value(item, ["Wind", "Speed"]),
                "wind_gust_kph": _nested_metric_value(item, ["WindGust", "Speed"]),
                "visibility_km": _metric_value(item, "Visibility"),
                "uv_index": item.get("UVIndexFloat") or item.get("UVIndex"),
                "uv_text": item.get("UVIndexText"),
                "precip_probability_pct": item.get("PrecipitationProbability"),
                "rain_probability_pct": item.get("RainProbability"),
                "thunder_probability_pct": item.get("ThunderstormProbability"),
                "snow_probability_pct": item.get("SnowProbability"),
                "ice_probability_pct": item.get("IceProbability"),
                "has_precipitation": item.get("HasPrecipitation"),
                "precipitation_type": item.get("PrecipitationType"),
                "precipitation_intensity": item.get("PrecipitationIntensity"),
                "total_liquid_mm": _metric_value(item, "TotalLiquid"),
                "rain_mm": _metric_value(item, "Rain"),
                "snow_cm": _metric_value(item, "Snow"),
                "ice_mm": _metric_value(item, "Ice"),
                "cloud_cover_pct": item.get("CloudCover"),
                "solar_irradiance": item.get("SolarIrradiance"),
                "brightness_index": item.get("AccuLumenBrightnessIndex"),
                "outdoor_safe": aqi_safe,
            }
        )
    return result


def normalize_daily_forecast(payload: dict[str, Any] | None) -> list[dict[str, Any]]:
    result = []
    for item in (payload or {}).get("DailyForecasts", []):
        air_and_pollen = item.get("AirAndPollen") or []
        air_quality = next(
            (
                entry
                for entry in air_and_pollen
                if entry.get("Name", "").lower().startswith("air")
            ),
            None,
        )
        uv_index_entry = next(
            (
                entry
                for entry in air_and_pollen
                if entry.get("Name", "").lower().startswith("uv")
            ),
            None,
        )
        day = item.get("Day") or {}
        night = item.get("Night") or {}
        temp_max = _nested_metric_value(item, ["Temperature", "Maximum"])
        result.append(
            {
                "date": item.get("Date"),
                "epoch_date": item.get("EpochDate"),
                "sunrise_at": ((item.get("Sun") or {}).get("Rise")),
                "sunset_at": ((item.get("Sun") or {}).get("Set")),
                "temp_min_c": _nested_metric_value(item, ["Temperature", "Minimum"]),
                "temp_max_c": temp_max,
                "real_feel_min_c": _nested_metric_value(
                    item, ["RealFeelTemperature", "Minimum"]
                ),
                "real_feel_max_c": _nested_metric_value(
                    item, ["RealFeelTemperature", "Maximum"]
                ),
                "hours_of_sun": item.get("HoursOfSun"),
                "day_phrase": day.get("LongPhrase") or day.get("IconPhrase"),
                "night_phrase": night.get("LongPhrase") or night.get("IconPhrase"),
                "day_precip_probability_pct": day.get("PrecipitationProbability"),
                "night_precip_probability_pct": night.get("PrecipitationProbability"),
                "day_rain_probability_pct": day.get("RainProbability"),
                "night_rain_probability_pct": night.get("RainProbability"),
                "day_wind_kph": _nested_metric_value(day, ["Wind", "Speed"]),
                "night_wind_kph": _nested_metric_value(night, ["Wind", "Speed"]),
                "day_wind_gust_kph": _nested_metric_value(day, ["WindGust", "Speed"]),
                "night_wind_gust_kph": _nested_metric_value(
                    night, ["WindGust", "Speed"]
                ),
                "day_total_liquid_mm": _metric_value(day, "TotalLiquid"),
                "night_total_liquid_mm": _metric_value(night, "TotalLiquid"),
                "day_humidity_avg_pct": _nested_number(
                    day, ["RelativeHumidity", "Average"]
                ),
                "night_humidity_avg_pct": _nested_number(
                    night, ["RelativeHumidity", "Average"]
                ),
                "day_uv_max": _nested_number(day, ["UVIndexFloat", "Maximum"]),
                "night_uv_max": _nested_number(night, ["UVIndexFloat", "Maximum"]),
                "air_quality": {
                    "name": air_quality.get("Name") if air_quality else None,
                    "aqi": air_quality.get("Value") if air_quality else None,
                    "category": air_quality.get("Category") if air_quality else None,
                    "category_value": air_quality.get("CategoryValue")
                    if air_quality
                    else None,
                    "type": air_quality.get("Type") if air_quality else None,
                },
                "uv_air_and_pollen": {
                    "value": uv_index_entry.get("Value") if uv_index_entry else None,
                    "category": uv_index_entry.get("Category")
                    if uv_index_entry
                    else None,
                },
                "outdoor_safe": is_outdoor_safe(
                    air_quality.get("Value") if air_quality else None,
                    temp_max,
                    day.get("PrecipitationProbability"),
                ),
            }
        )
    return result


async def load_live_environment_payload() -> dict[str, Any] | None:
    client = AccuWeatherClient()
    if not client.enabled:
        return None

    cache_key = "accuweather:environment:payload"
    redis = await get_redis()
    if redis:
        cached = await redis.get(cache_key)
        if cached:
            return json.loads(cached)

    location = await client.resolve_location()
    location_key = location.get("Key") or settings.accuweather_location_key
    if not location_key:
        raise RuntimeError("AccuWeather location key could not be resolved")

    conditions, hourly, daily, aq_index, uv_index, alerts = await _gather_payloads(
        client, location_key
    )
    current = normalize_current_environment(conditions, aq_index, uv_index, location)
    payload = {
        "location": current["location"],
        "current": current,
        "hourly": normalize_hourly_forecast(hourly),
        "daily": normalize_daily_forecast(daily),
        "alerts": alerts or [],
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }

    if redis:
        await redis.setex(
            cache_key, settings.environment_cache_minutes * 60, json.dumps(payload)
        )
    return payload


async def _gather_payloads(client: AccuWeatherClient, location_key: str):
    conditions = await client.get_current_conditions(location_key)
    hourly = await client.get_hourly_forecast(location_key, 24)
    daily = await client.get_daily_forecast(location_key, 5)
    aq_index = await client.get_air_quality_index(location_key)
    uv_index = await client.get_uv_index(location_key)
    try:
        alerts = await client.get_alerts(location_key)
    except Exception:
        alerts = []
    return conditions, hourly, daily, aq_index, uv_index, alerts


def build_history_from_snapshots(snapshot_rows: list[Any]) -> dict[str, Any]:
    daily_rows = defaultdict(list)
    for row in snapshot_rows:
        recorded = row["recorded_at"]
        day_key = recorded.date().isoformat()
        daily_rows[day_key].append(row)

    trend = []
    for day_key in sorted(daily_rows.keys()):
        rows = daily_rows[day_key]
        aqi_avg = _mean([r["aqi"] for r in rows])
        temp_avg = _mean([r["temperature_c"] for r in rows])
        humidity_avg = _mean([r["humidity_percent"] for r in rows])
        uv_avg = _mean([r["uv_index"] for r in rows])
        aqi_info = get_aqi_info(aqi_avg)
        trend.append(
            {
                "date": day_key,
                "aqi": round(aqi_avg, 0) if aqi_avg is not None else None,
                "category": aqi_info["label"],
                "color": aqi_info["color"],
                "temperature_c": round(temp_avg, 1) if temp_avg is not None else None,
                "humidity_pct": round(humidity_avg, 1)
                if humidity_avg is not None
                else None,
                "uv_index": round(uv_avg, 1) if uv_avg is not None else None,
            }
        )
    return {"aqi_trend": trend}


async def persist_environment_payload(db, payload: dict[str, Any]) -> dict[str, Any]:
    current = payload["current"]
    observed_at = current.get("observed_at") or payload.get("fetched_at")
    recorded_at = _parse_datetime(observed_at)
    if recorded_at is None:
        recorded_at = datetime.now(timezone.utc)

    await db.execute(
        """INSERT INTO environmental_snapshots(
               recorded_at, aqi, aqi_category, temperature_c, humidity_percent,
               weather_condition, uv_index, noise_level_db, outdoor_activity_safe,
               real_feel_c, visibility_km, wind_kph, wind_gust_kph,
               pressure_mb, cloud_cover_pct, precip_1h_mm, precipitation_type,
               sleep_risk_score, env_stress_score, source_payload
           )
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb)
           ON CONFLICT(recorded_at) DO UPDATE SET
               aqi=EXCLUDED.aqi,
               aqi_category=EXCLUDED.aqi_category,
               temperature_c=EXCLUDED.temperature_c,
               humidity_percent=EXCLUDED.humidity_percent,
               weather_condition=EXCLUDED.weather_condition,
               uv_index=EXCLUDED.uv_index,
               outdoor_activity_safe=EXCLUDED.outdoor_activity_safe,
               real_feel_c=EXCLUDED.real_feel_c,
               visibility_km=EXCLUDED.visibility_km,
               wind_kph=EXCLUDED.wind_kph,
               wind_gust_kph=EXCLUDED.wind_gust_kph,
               pressure_mb=EXCLUDED.pressure_mb,
               cloud_cover_pct=EXCLUDED.cloud_cover_pct,
               precip_1h_mm=EXCLUDED.precip_1h_mm,
               precipitation_type=EXCLUDED.precipitation_type,
               sleep_risk_score=EXCLUDED.sleep_risk_score,
               env_stress_score=EXCLUDED.env_stress_score,
               source_payload=EXCLUDED.source_payload""",
        recorded_at,
        _to_int(current.get("aqi")),
        current.get("aqi_category"),
        current.get("temperature_c"),
        current.get("humidity_pct"),
        current.get("weather_text"),
        current.get("uv_index"),
        None,
        current.get("outdoor_safe"),
        current.get("real_feel_c"),
        current.get("visibility_km"),
        current.get("wind_kph"),
        current.get("wind_gust_kph"),
        current.get("pressure_mb"),
        current.get("cloud_cover_pct"),
        current.get("precip_1h_mm"),
        current.get("precipitation_type"),
        current.get("sleep_risk"),
        current.get("env_stress_score"),
        json.dumps(payload),
    )
    return payload


async def get_environment_context(
    db, *, range_days: int = 90, refresh_live: bool = True
) -> dict[str, Any]:
    payload = None
    latest_existing = await db.fetchrow(
        """SELECT recorded_at, aqi, aqi_category, temperature_c, humidity_percent, uv_index,
                  weather_condition, outdoor_activity_safe, real_feel_c, visibility_km,
                  wind_kph, wind_gust_kph, pressure_mb, cloud_cover_pct, precip_1h_mm,
                  precipitation_type, sleep_risk_score, env_stress_score, source_payload
           FROM environmental_snapshots
           ORDER BY recorded_at DESC LIMIT 1"""
    )
    if refresh_live:
        latest_age_ok = False
        if latest_existing and latest_existing["recorded_at"]:
            latest_age_ok = datetime.utcnow() - latest_existing[
                "recorded_at"
            ] < timedelta(minutes=settings.environment_cache_minutes)
        if latest_age_ok:
            payload = None
        else:
            try:
                live_payload = await load_live_environment_payload()
                if live_payload:
                    payload = await persist_environment_payload(db, live_payload)
            except Exception:
                payload = None

    rows = await db.fetch(
        """SELECT recorded_at, aqi, aqi_category, temperature_c, humidity_percent, uv_index,
                  weather_condition, outdoor_activity_safe, real_feel_c, visibility_km,
                  wind_kph, wind_gust_kph, pressure_mb, cloud_cover_pct, precip_1h_mm,
                  precipitation_type, sleep_risk_score, env_stress_score, source_payload
           FROM environmental_snapshots
           WHERE recorded_at >= $1
           ORDER BY recorded_at ASC""",
        datetime.utcnow() - timedelta(days=range_days),
    )

    latest = rows[-1] if rows else None
    current = (
        payload["current"]
        if payload
        else snapshot_to_current(latest)
        if latest
        else None
    )
    history = build_history_from_snapshots(rows)
    return {
        "current": current,
        "history": history,
        "hourly": payload["hourly"] if payload else latest_payload(latest, "hourly"),
        "daily": payload["daily"] if payload else latest_payload(latest, "daily"),
        "alerts": payload["alerts"] if payload else latest_payload(latest, "alerts"),
        "location": payload["location"]
        if payload
        else latest_payload(latest, "location") or _fallback_location(),
        "source": current.get("source") if current else "database",
    }


def snapshot_to_current(row: Any | None) -> dict[str, Any] | None:
    if not row:
        return None
    aqi = row["aqi"]
    aqi_info = get_aqi_info(aqi)
    humidity_pct = row["humidity_percent"]
    temperature_c = row["temperature_c"]
    uv_index = row["uv_index"]
    wind_kph = row["wind_kph"]
    sleep_risk = row["sleep_risk_score"]
    if sleep_risk is None:
        sleep_risk = compute_sleep_risk(
            aqi=float(aqi) if aqi is not None else None,
            humidity_pct=float(humidity_pct) if humidity_pct is not None else None,
            temp_c=float(temperature_c) if temperature_c is not None else None,
            wind_kph=float(wind_kph) if wind_kph is not None else None,
        )
    env_stress_score = row["env_stress_score"]
    if env_stress_score is None:
        env_stress_score = compute_env_stress(
            aqi=float(aqi) if aqi is not None else None,
            temp_c=float(temperature_c) if temperature_c is not None else None,
            humidity_pct=float(humidity_pct) if humidity_pct is not None else None,
            uv_index=float(uv_index) if uv_index is not None else None,
        )
    return {
        "source": "database",
        "observed_at": row["recorded_at"].isoformat()
        if hasattr(row["recorded_at"], "isoformat")
        else None,
        "aqi": aqi,
        "aqi_category": row["aqi_category"] or aqi_info["label"],
        "aqi_color": aqi_info["color"],
        "aqi_bg": aqi_info["bg"],
        "temperature_c": temperature_c,
        "humidity_pct": humidity_pct,
        "uv_index": uv_index,
        "weather_text": row["weather_condition"],
        "outdoor_safe": row["outdoor_activity_safe"],
        "real_feel_c": row["real_feel_c"],
        "visibility_km": row["visibility_km"],
        "wind_kph": wind_kph,
        "wind_gust_kph": row["wind_gust_kph"],
        "pressure_mb": row["pressure_mb"],
        "cloud_cover_pct": row["cloud_cover_pct"],
        "precip_1h_mm": row["precip_1h_mm"],
        "precipitation_type": row["precipitation_type"],
        "sleep_risk": sleep_risk,
        "env_stress_score": env_stress_score,
        "activity_recommendation": AQI_RISK_COPY.get(
            row["aqi_category"] or aqi_info["label"],
            "Adjust activity intensity based on conditions.",
        ),
    }


def latest_payload(row: Any | None, key: str):
    if not row:
        return [] if key in {"hourly", "daily", "alerts"} else None
    source_payload = row["source_payload"]
    if not source_payload:
        return [] if key in {"hourly", "daily", "alerts"} else None
    payload = (
        source_payload
        if isinstance(source_payload, dict)
        else json.loads(source_payload)
    )
    return payload.get(key)


def _fallback_location(location: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "key": location.get("Key") if location else settings.accuweather_location_key,
        "name": location.get("LocalizedName")
        if location
        else settings.accuweather_location_query,
        "country": (location.get("Country") or {}).get("ID") if location else None,
        "admin_area": (location.get("AdministrativeArea") or {}).get("ID")
        if location
        else None,
        "latitude": (location.get("GeoPosition") or {}).get("Latitude")
        if location
        else None,
        "longitude": (location.get("GeoPosition") or {}).get("Longitude")
        if location
        else None,
    }


def _metric_value(item: dict[str, Any] | None, key: str) -> float | None:
    metric = ((item or {}).get(key) or {}).get("Metric")
    value = metric.get("Value") if metric else None
    if value in (None, {}):
        return None
    return round(float(value), 1)


def _nested_metric_value(item: dict[str, Any] | None, path: list[str]) -> float | None:
    node: Any = item or {}
    for key in path:
        node = (node or {}).get(key)
    metric = (node or {}).get("Metric")
    value = metric.get("Value") if metric else None
    if value in (None, {}):
        return None
    return round(float(value), 1)


def _nested_number(item: dict[str, Any] | None, path: list[str]) -> float | None:
    node: Any = item or {}
    for key in path:
        node = (node or {}).get(key)
    if node in (None, {}):
        return None
    return round(float(node), 1)


def _mean(values: list[Any]) -> float | None:
    nums = [float(v) for v in values if v is not None]
    if not nums:
        return None
    return sum(nums) / len(nums)


def _parse_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if parsed.tzinfo:
            return parsed.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed
    except ValueError:
        return None


def _to_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return None
