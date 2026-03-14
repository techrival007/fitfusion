from fastapi import APIRouter, Depends, Query

from app.database import get_db
from app.services.environment import get_environment_context

router = APIRouter()


@router.get("/current")
async def current_environment(db=Depends(get_db)):
    context = await get_environment_context(db, range_days=7, refresh_live=True)
    return {
        "current": context["current"],
        "hourly": context["hourly"][:12] if context["hourly"] else [],
        "daily": context["daily"][:5] if context["daily"] else [],
        "alerts": context["alerts"] or [],
        "location": context["location"],
        "source": context["source"],
    }


@router.get("/hourly")
async def hourly_environment(
    hours: int = Query(24, ge=1, le=72),
    db=Depends(get_db),
):
    context = await get_environment_context(db, range_days=7, refresh_live=True)
    return {
        "hours": hours,
        "items": (context["hourly"] or [])[:hours],
        "current": context["current"],
        "location": context["location"],
    }


@router.get("/daily")
async def daily_environment(
    days: int = Query(5, ge=1, le=15),
    db=Depends(get_db),
):
    context = await get_environment_context(
        db, range_days=max(days, 7), refresh_live=True
    )
    return {
        "days": days,
        "items": (context["daily"] or [])[:days],
        "current": context["current"],
        "location": context["location"],
    }


@router.get("/history")
async def environment_history(
    range: str = Query("90d"),
    db=Depends(get_db),
):
    days = int(range.replace("d", "")) if range.endswith("d") else 90
    context = await get_environment_context(
        db, range_days=min(max(days, 7), 120), refresh_live=True
    )
    return {
        "range": range,
        "current": context["current"],
        "aqi_trend": context["history"]["aqi_trend"],
        "location": context["location"],
    }


@router.get("/insights")
async def environment_insights(
    scope: str = Query("student"),
    db=Depends(get_db),
):
    context = await get_environment_context(db, range_days=30, refresh_live=True)
    current = context["current"] or {}
    trend = context["history"].get("aqi_trend", [])
    recent = trend[-7:]
    high_aqi_days = sum(1 for item in trend if (item.get("aqi") or 0) > 150)
    avg_aqi = round(
        sum((item.get("aqi") or 0) for item in recent) / max(len(recent), 1), 1
    )
    insights = {
        "student": [
            f"AQI is {current.get('aqi', 'N/A')} today; {current.get('activity_recommendation', 'adjust activity intensity as needed')}",
            f"Sleep risk is {current.get('sleep_risk', 0)} out of 100 based on air quality, heat, and humidity.",
            f"Average AQI over the last 7 days is {avg_aqi}; plan outdoor workouts in lower-AQI windows.",
        ],
        "warden": [
            f"There were {high_aqi_days} days above AQI 150 in the selected history window.",
            f"Current environmental stress score is {current.get('env_stress_score', 0)}; consider indoor programming when this is elevated.",
            f"Latest conditions: {current.get('temperature_c', 'N/A')} C, humidity {current.get('humidity_pct', 'N/A')}%, UV {current.get('uv_index', 'N/A')}.",
        ],
        "dean": [
            f"Campus conditions crossed AQI 150 on {high_aqi_days} tracked days, which supports indoor infrastructure planning.",
            f"The latest air-quality category is {current.get('aqi_category', 'Unknown')} with environmental stress {current.get('env_stress_score', 0)}.",
            f"Recent 7-day average AQI is {avg_aqi}; use this baseline in wellness and activity correlation reviews.",
        ],
    }
    return {
        "scope": scope,
        "current": current,
        "insights": insights.get(scope, insights["student"]),
        "location": context["location"],
    }


@router.get("/location")
async def environment_location(db=Depends(get_db)):
    context = await get_environment_context(db, range_days=7, refresh_live=True)
    return {
        "location": context["location"],
        "source": context["source"],
    }
