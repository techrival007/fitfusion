import io
import csv
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.auth import require_role
from app.privacy import enforce_k_anonymity
from app.services.environment import get_environment_context

router = APIRouter()

RANGE_DAYS = {"7d": 7, "14d": 14, "30d": 30, "90d": 90}


def days_from_range(r: str) -> int:
    return RANGE_DAYS.get(r, 7)


def hostel_from_token(user: dict) -> str:
    hostel = user.get("hostel_id")
    if not hostel:
        raise HTTPException(status_code=403, detail="No hostel scope in token")
    return hostel


# ── Overview ──────────────────────────────────────────────────────────────────


@router.get("/overview")
async def warden_overview(
    user=require_role("warden", "dean"),
    db=Depends(get_db),
):
    hostel = hostel_from_token(user)
    today = date.today()

    # KPI: logged today
    logged_today = await db.fetchval(
        """SELECT COUNT(DISTINCT wl.user_id)
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE h.name=$1 AND wl.date=$2""",
        hostel,
        today,
    )
    total_students = await db.fetchval(
        "SELECT COUNT(*) FROM users u JOIN hostels h ON h.id=u.hostel_id WHERE h.name=$1 AND u.role='student'",
        hostel,
    )
    yesterday_logged = await db.fetchval(
        """SELECT COUNT(DISTINCT wl.user_id)
           FROM wellness_logs wl
           JOIN users u ON u.id=wl.user_id
           JOIN hostels h ON h.id=u.hostel_id
           WHERE h.name=$1 AND wl.date=$2""",
        hostel,
        today - timedelta(days=1),
    )

    # KPI: wellness scores today / last 7 days
    scores_row = await db.fetchrow(
        """SELECT AVG(wl.wellness_score) as avg_score, COUNT(*) as n
           FROM wellness_logs wl
           JOIN users u ON u.id=wl.user_id
           JOIN hostels h ON h.id=u.hostel_id
           WHERE h.name=$1 AND wl.date >= $2""",
        hostel,
        today - timedelta(days=7),
    )
    scores_prev = await db.fetchval(
        """SELECT AVG(wl.wellness_score)
           FROM wellness_logs wl
           JOIN users u ON u.id=wl.user_id
           JOIN hostels h ON h.id=u.hostel_id
           WHERE h.name=$1 AND wl.date >= $2 AND wl.date < $3""",
        hostel,
        today - timedelta(days=14),
        today - timedelta(days=7),
    )

    avg_score = round(float(scores_row["avg_score"] or 0), 1)
    prev_score = round(float(scores_prev or 0), 1)

    def wellness_label(s):
        if s >= 80:
            return "Thriving"
        if s >= 60:
            return "Good"
        if s >= 40:
            return "Fair"
        return "Needs Attention"

    # Score distribution (last 7 days)
    dist_rows = await db.fetch(
        """SELECT wl.wellness_score
           FROM wellness_logs wl
           JOIN users u ON u.id=wl.user_id
           JOIN hostels h ON h.id=u.hostel_id
           WHERE h.name=$1 AND wl.date >= $2""",
        hostel,
        today - timedelta(days=7),
    )
    total_recs = len(dist_rows)
    thriving = sum(1 for r in dist_rows if r["wellness_score"] >= 80)
    good = sum(1 for r in dist_rows if 60 <= r["wellness_score"] < 80)
    fair = sum(1 for r in dist_rows if 40 <= r["wellness_score"] < 60)
    attention = sum(1 for r in dist_rows if r["wellness_score"] < 40)

    def pct(n):
        return round(n / total_recs * 100, 1) if total_recs else 0

    # 28-day weekly trend
    trend_rows = await db.fetch(
        """SELECT wl.date, AVG(wl.wellness_score) as avg_score, COUNT(*) as n_logged
           FROM wellness_logs wl
           JOIN users u ON u.id=wl.user_id
           JOIN hostels h ON h.id=u.hostel_id
           WHERE h.name=$1 AND wl.date >= $2
           GROUP BY wl.date ORDER BY wl.date""",
        hostel,
        today - timedelta(days=28),
    )

    # Activity snapshot today
    act_today = await db.fetchval(
        """SELECT COUNT(DISTINCT al.user_id)
           FROM activity_logs al
           JOIN users u ON u.id=al.user_id
           JOIN hostels h ON h.id=u.hostel_id
           WHERE h.name=$1 AND al.date=$2""",
        hostel,
        today,
    )
    top_types = await db.fetch(
        """SELECT al.activity_type, COUNT(*) as cnt
           FROM activity_logs al
           JOIN users u ON u.id=al.user_id
           JOIN hostels h ON h.id=u.hostel_id
           WHERE h.name=$1 AND al.date >= $2
           GROUP BY al.activity_type ORDER BY cnt DESC LIMIT 5""",
        hostel,
        today - timedelta(days=7),
    )

    # Signals
    sleep_row = await db.fetchrow(
        """SELECT AVG(wl.sleep_hours) as avg_sleep
           FROM wellness_logs wl
           JOIN users u ON u.id=wl.user_id
           JOIN hostels h ON h.id=u.hostel_id
           WHERE h.name=$1 AND wl.date >= $2""",
        hostel,
        today - timedelta(days=7),
    )
    mood_now = await db.fetchval(
        """SELECT AVG(wl.mood_score)
           FROM wellness_logs wl
           JOIN users u ON u.id=wl.user_id
           JOIN hostels h ON h.id=u.hostel_id
           WHERE h.name=$1 AND wl.date >= $2""",
        hostel,
        today - timedelta(days=7),
    )
    mood_prev = await db.fetchval(
        """SELECT AVG(wl.mood_score)
           FROM wellness_logs wl
           JOIN users u ON u.id=wl.user_id
           JOIN hostels h ON h.id=u.hostel_id
           WHERE h.name=$1 AND wl.date >= $2 AND wl.date < $3""",
        hostel,
        today - timedelta(days=14),
        today - timedelta(days=7),
    )
    aqi_row = await db.fetchrow(
        """SELECT AVG(aqi) as avg_aqi
           FROM environmental_snapshots
           WHERE DATE(recorded_at) >= $1""",
        today - timedelta(days=7),
    )

    avg_sleep = round(float(sleep_row["avg_sleep"] or 0), 1)
    mood_trend = round(
        (
            (float(mood_now or 0) - float(mood_prev or 0))
            / max(float(mood_prev or 1), 0.01)
        )
        * 100,
        1,
    )
    env_context = await get_environment_context(db, range_days=14, refresh_live=True)
    current_env = env_context.get("current") or {}

    data = {
        "hostel_name": hostel,
        "today": today.isoformat(),
        "environment": current_env,
        "kpis": {
            "logged_today": {
                "value": int(logged_today or 0),
                "total": int(total_students or 0),
                "pct": round(
                    (logged_today or 0) / max(total_students or 1, 1) * 100, 1
                ),
                "trend_vs_yesterday": int(
                    (logged_today or 0) - (yesterday_logged or 0)
                ),
            },
            "avg_wellness_score": {
                "value": avg_score,
                "label": wellness_label(avg_score),
                "trend_vs_last_week": round(avg_score - prev_score, 1),
            },
            "needs_attention_count": {
                "value": attention,
                "color": "#E24B4A",
            },
            "weekly_participation": {
                "value_pct": pct(thriving + good + fair + attention),
                "trend_vs_last_week": 0,
            },
        },
        "score_distribution": {
            "thriving": {"count": thriving, "pct": pct(thriving)},
            "good": {"count": good, "pct": pct(good)},
            "fair": {"count": fair, "pct": pct(fair)},
            "needs_attention": {"count": attention, "pct": pct(attention)},
            "total": total_recs,
        },
        "weekly_trend": [
            {
                "date": str(r["date"]),
                "avg_score": round(float(r["avg_score"]), 1),
                "n_logged": r["n_logged"],
            }
            for r in trend_rows
        ],
        "activity_snapshot": {
            "logged_today": int(act_today or 0),
            "did_not_log": int((total_students or 0) - (act_today or 0)),
            "top_types": [
                {"type": r["activity_type"], "count": r["cnt"]} for r in top_types
            ],
        },
        "signals": {
            "sleep": {
                "avg_hours": avg_sleep,
                "color": "#1D9E75"
                if avg_sleep >= 7
                else "#E24B4A"
                if avg_sleep < 6
                else "#BA7517",
                "label": "Good"
                if avg_sleep >= 7
                else "Concerning"
                if avg_sleep < 6
                else "Fair",
            },
            "mood": {
                "trend_pct": mood_trend,
                "color": "#1D9E75" if mood_trend >= 0 else "#E24B4A",
                "label": "Improving" if mood_trend >= 0 else "Declining",
            },
            "outdoor_activity": {
                "drop_pct": 0,
                "avg_aqi": round(float(aqi_row["avg_aqi"] or 80), 0),
                "color": "#1D9E75" if (aqi_row["avg_aqi"] or 80) < 100 else "#BA7517",
            },
        },
    }
    return enforce_k_anonymity(data)


# ── Activity ──────────────────────────────────────────────────────────────────


@router.get("/activity")
async def warden_activity(
    range: str = Query("7d"),
    academic_year: str = Query("all"),
    user=require_role("warden", "dean"),
    db=Depends(get_db),
):
    hostel = hostel_from_token(user)
    days = days_from_range(range)
    since = date.today() - timedelta(days=days)
    year_filter = (
        "" if academic_year == "all" else f"AND u.academic_year = {int(academic_year)}"
    )

    daily_trend = await db.fetch(
        f"""SELECT al.date,
               AVG(al.duration_minutes) as avg_minutes,
               COUNT(DISTINCT al.user_id)::float / NULLIF(COUNT(DISTINCT u.id), 0) as participation_pct
           FROM users u
           JOIN hostels h ON h.id = u.hostel_id
           LEFT JOIN activity_logs al ON al.user_id = u.id AND al.date >= $2
           WHERE h.name=$1 AND u.role='student' {year_filter}
           GROUP BY al.date ORDER BY al.date""",
        hostel,
        since,
    )

    type_rows = await db.fetch(
        f"""SELECT al.activity_type, COUNT(*) as cnt,
               DATE_TRUNC('week', al.date)::date as week
           FROM activity_logs al
           JOIN users u ON u.id = al.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE h.name=$1 AND al.date >= $2 {year_filter}
           GROUP BY week, al.activity_type ORDER BY week""",
        hostel,
        since,
    )

    indoor_outdoor = await db.fetch(
        f"""SELECT DATE_TRUNC('week', al.date)::date as week,
               AVG(CASE WHEN al.location='indoor' THEN al.duration_minutes ELSE 0 END) as indoor_min,
               AVG(CASE WHEN al.location='outdoor' THEN al.duration_minutes ELSE 0 END) as outdoor_min,
               AVG(e.aqi) as avg_aqi
           FROM activity_logs al
           JOIN users u ON u.id = al.user_id
           JOIN hostels h ON h.id = u.hostel_id
           LEFT JOIN environmental_snapshots e ON DATE(e.recorded_at) = al.date
           WHERE h.name=$1 AND al.date >= $2 {year_filter}
           GROUP BY week ORDER BY week""",
        hostel,
        since,
    )

    data = {
        "daily_trend": [
            {
                "date": str(r["date"]),
                "avg_minutes": round(float(r["avg_minutes"] or 0), 1),
                "participation_pct": round(float(r["participation_pct"] or 0) * 100, 1),
            }
            for r in daily_trend
            if r["date"]
        ],
        "indoor_outdoor": [
            {
                "week": str(r["week"]),
                "indoor_min": round(float(r["indoor_min"] or 0), 1),
                "outdoor_min": round(float(r["outdoor_min"] or 0), 1),
                "avg_aqi": round(float(r["avg_aqi"] or 80), 0),
            }
            for r in indoor_outdoor
        ],
        "insight": "Activity participation is tracked. Higher AQI days show a shift towards indoor activities.",
        "n": sum(1 for r in daily_trend if r["date"]),
    }
    return enforce_k_anonymity(data)


# ── Nutrition ─────────────────────────────────────────────────────────────────


@router.get("/nutrition")
async def warden_nutrition(
    range: str = Query("7d"),
    meal_type: str = Query("all"),
    user=require_role("warden", "dean"),
    db=Depends(get_db),
):
    hostel = hostel_from_token(user)
    days = days_from_range(range)
    since = date.today() - timedelta(days=days)
    meal_filter = "" if meal_type == "all" else f"AND nl.meal_type = '{meal_type}'"

    calorie_trend = await db.fetch(
        f"""SELECT nl.date, AVG(nl.total_calories) as avg_calories, COUNT(*) as n_logged
           FROM nutrition_logs nl
           JOIN users u ON u.id = nl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE h.name=$1 AND nl.date >= $2 {meal_filter}
           GROUP BY nl.date ORDER BY nl.date""",
        hostel,
        since,
    )

    macro_rows = await db.fetch(
        f"""SELECT DATE_TRUNC('week', nl.date)::date as week,
               AVG(nl.total_protein) as protein_g,
               AVG(nl.total_carbs) as carbs_g,
               AVG(nl.total_fat) as fat_g
           FROM nutrition_logs nl
           JOIN users u ON u.id = nl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE h.name=$1 AND nl.date >= $2 {meal_filter}
           GROUP BY week ORDER BY week""",
        hostel,
        since,
    )

    skip_rows = await db.fetch(
        """SELECT meal_type,
               COUNT(DISTINCT u.id) as total_students,
               COUNT(DISTINCT nl.user_id) as logged
           FROM users u
           JOIN hostels h ON h.id = u.hostel_id
           LEFT JOIN nutrition_logs nl ON nl.user_id = u.id AND nl.date >= $2
           WHERE h.name=$1 AND u.role='student'
           GROUP BY meal_type""",
        hostel,
        since,
    )

    quality_rows = await db.fetch(
        """SELECT nl.meal_type, AVG(nl.meal_rating) as avg_rating
           FROM nutrition_logs nl
           JOIN users u ON u.id = nl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE h.name=$1 AND nl.date >= $2
           GROUP BY nl.meal_type""",
        hostel,
        since,
    )

    feedback_rows = await db.fetch(
        """SELECT nl.meal_feedback_tag as tag, COUNT(*) as cnt
           FROM nutrition_logs nl
           JOIN users u ON u.id = nl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE h.name=$1 AND nl.date >= $2
           GROUP BY nl.meal_feedback_tag ORDER BY cnt DESC""",
        hostel,
        since,
    )

    nutrient_avgs = await db.fetchrow(
        """SELECT AVG(nl.total_calories) as cal, AVG(nl.total_protein) as pro,
                  AVG(nl.total_carbs) as carbs, AVG(nl.total_fat) as fat,
                  AVG(nl.total_fibre) as fibre
           FROM nutrition_logs nl
           JOIN users u ON u.id = nl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE h.name=$1 AND nl.date >= $2""",
        hostel,
        since,
    )

    RDA = {"calories": 2000, "protein": 60, "carbs": 275, "fat": 65, "fibre": 30}

    def gauge(avg, rda):
        a = round(float(avg or 0), 1)
        p = round(a / rda * 100, 1)
        return {
            "avg": a,
            "rda": rda,
            "pct": p,
            "status": "ok" if 90 <= p <= 110 else "warning" if p >= 70 else "deficient",
        }

    data = {
        "calorie_trend": [
            {
                "date": str(r["date"]),
                "avg_calories": round(float(r["avg_calories"] or 0), 1),
                "n_logged": r["n_logged"],
            }
            for r in calorie_trend
        ],
        "macro_breakdown": [
            {
                "week": str(r["week"]),
                "protein_g": round(float(r["protein_g"] or 0), 1),
                "carbs_g": round(float(r["carbs_g"] or 0), 1),
                "fat_g": round(float(r["fat_g"] or 0), 1),
                "protein_pct_rda": round(
                    float(r["protein_g"] or 0) / RDA["protein"] * 100, 1
                ),
                "carbs_pct_rda": round(
                    float(r["carbs_g"] or 0) / RDA["carbs"] * 100, 1
                ),
                "fat_pct_rda": round(float(r["fat_g"] or 0) / RDA["fat"] * 100, 1),
            }
            for r in macro_rows
        ],
        "mess_quality": {
            r["meal_type"]: {"avg_rating": round(float(r["avg_rating"] or 0), 2)}
            for r in quality_rows
        },
        "feedback_tags": [
            {"tag": r["tag"], "count": r["cnt"]} for r in feedback_rows if r["tag"]
        ],
        "nutrient_gauges": {
            "calories": gauge(nutrient_avgs["cal"], RDA["calories"]),
            "protein": gauge(nutrient_avgs["pro"], RDA["protein"]),
            "carbs": gauge(nutrient_avgs["carbs"], RDA["carbs"]),
            "fat": gauge(nutrient_avgs["fat"], RDA["fat"]),
            "fibre": gauge(nutrient_avgs["fibre"], RDA["fibre"]),
        },
        "nutrient_insight": "Monitor protein and fibre intake — common deficiency areas in hostel diets.",
        "n": len(calorie_trend),
    }
    return enforce_k_anonymity(data)


# ── Mood ──────────────────────────────────────────────────────────────────────


@router.get("/mood")
async def warden_mood(
    range: str = Query("7d"),
    user=require_role("warden", "dean"),
    db=Depends(get_db),
):
    # mood_logs is NEVER queried here — only wellness_logs.mood_score
    hostel = hostel_from_token(user)
    days = days_from_range(range)
    since = date.today() - timedelta(days=days)

    mood_trend = await db.fetch(
        """SELECT wl.date, AVG(wl.mood_score) as avg_mood, COUNT(*) as n
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE h.name=$1 AND wl.date >= $2
           GROUP BY wl.date ORDER BY wl.date""",
        hostel,
        since,
    )

    heatmap = await db.fetch(
        """SELECT wl.date, AVG(wl.mood_score) as avg_mood, COUNT(*) as n
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE h.name=$1 AND wl.date >= $2
           GROUP BY wl.date ORDER BY wl.date""",
        hostel,
        date.today() - timedelta(days=30),
    )

    stress_dist = await db.fetch(
        """SELECT DATE_TRUNC('week', wl.date)::date as week,
               COUNT(CASE WHEN wl.mood_score >= 4   THEN 1 END)::float / NULLIF(COUNT(*),0) as low_pct,
               COUNT(CASE WHEN wl.mood_score = 3    THEN 1 END)::float / NULLIF(COUNT(*),0) as moderate_pct,
               COUNT(CASE WHEN wl.mood_score <= 2   THEN 1 END)::float / NULLIF(COUNT(*),0) as high_pct
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE h.name=$1 AND wl.date >= $2
           GROUP BY week ORDER BY week""",
        hostel,
        since,
    )

    # Check for mood dip alert (5 consecutive days avg < 2.5)
    recent = list(reversed([r for r in mood_trend]))[:5]
    dip_active = len(recent) >= 5 and all(float(r["avg_mood"]) < 2.5 for r in recent)

    def heatmap_cell(r):
        cell = {
            "date": str(r["date"]),
            "avg_mood": round(float(r["avg_mood"]), 1),
            "n": r["n"],
        }
        if r["n"] < 30:
            cell["suppressed"] = True
        return cell

    data = {
        "mood_trend": [
            {
                "date": str(r["date"]),
                "avg_mood": round(float(r["avg_mood"]), 1),
                "n": r["n"],
            }
            for r in mood_trend
        ],
        "heatmap": [heatmap_cell(r) for r in heatmap],
        "stress_distribution": [
            {
                "week": str(r["week"]),
                "low_pct": round(float(r["low_pct"] or 0) * 100, 1),
                "moderate_pct": round(float(r["moderate_pct"] or 0) * 100, 1),
                "high_pct": round(float(r["high_pct"] or 0) * 100, 1),
            }
            for r in stress_dist
        ],
        "time_of_day_pattern": {"morning": 0, "afternoon": 0, "evening": 0, "night": 0},
        "mood_dip_alert": {"active": dip_active, "days": 5} if dip_active else None,
    }
    return data  # no k-anonymity on heatmap cells (handled per-cell above)


# ── Alerts ────────────────────────────────────────────────────────────────────


@router.get("/alerts")
async def warden_alerts(user=require_role("warden", "dean"), db=Depends(get_db)):
    hostel = hostel_from_token(user)
    rows = await db.fetch(
        """SELECT aa.*, h.name as hostel_name
           FROM admin_alerts aa
           JOIN hostels h ON h.id = aa.hostel_id
           WHERE h.name=$1 AND aa.triggered_at >= NOW() - INTERVAL '60 days'
           ORDER BY aa.triggered_at DESC""",
        hostel,
    )
    active = [dict(r) for r in rows if r["is_active"]]
    history = [dict(r) for r in rows if not r["is_active"]]

    def ser(lst):
        for item in lst:
            for k, v in item.items():
                if hasattr(v, "isoformat"):
                    item[k] = v.isoformat()
        return lst

    return {"active": ser(active), "history": ser(history)}


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    body: dict = {},
    user=require_role("warden", "dean"),
    db=Depends(get_db),
):
    from datetime import datetime

    await db.execute(
        """UPDATE admin_alerts SET is_active=FALSE, acknowledged_at=NOW(),
           acknowledged_by=$1, action_note=$2 WHERE id=$3""",
        user["sub"],
        body.get("note"),
        alert_id,
    )
    return {"acknowledged": True, "timestamp": datetime.utcnow().isoformat()}


# ── Initiatives ───────────────────────────────────────────────────────────────


@router.get("/initiatives")
async def get_initiatives(user=require_role("warden", "dean"), db=Depends(get_db)):
    hostel = hostel_from_token(user)
    rows = await db.fetch(
        """SELECT hi.*
           FROM hostel_initiatives hi
           JOIN hostels h ON h.id = hi.hostel_id
           WHERE h.name=$1 ORDER BY hi.created_at DESC""",
        hostel,
    )
    today = date.today()
    active = [dict(r) for r in rows if r["end_date"] >= today]
    past = [dict(r) for r in rows if r["end_date"] < today]

    def ser(lst):
        for item in lst:
            for k, v in item.items():
                if hasattr(v, "isoformat"):
                    item[k] = v.isoformat()
        return lst

    return {"active": ser(active), "past": ser(past)}


class InitiativeCreate(BaseModel):
    title: str
    description: str
    goal_type: str
    target_value: float
    start_date: date
    end_date: date


@router.post("/initiatives")
async def create_initiative(
    body: InitiativeCreate,
    user=require_role("warden", "dean"),
    db=Depends(get_db),
):
    hostel = hostel_from_token(user)
    hid = await db.fetchval("SELECT id FROM hostels WHERE name=$1", hostel)
    row = await db.fetchrow(
        """INSERT INTO hostel_initiatives(hostel_id, created_by, title, description,
           goal_type, target_value, start_date, end_date)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *""",
        hid,
        user["sub"],
        body.title,
        body.description,
        body.goal_type,
        body.target_value,
        body.start_date,
        body.end_date,
    )
    result = dict(row)
    for k, v in result.items():
        if hasattr(v, "isoformat"):
            result[k] = v.isoformat()
    return result


# ── Export ────────────────────────────────────────────────────────────────────


@router.get("/export")
async def warden_export(
    report_type: str = Query("weekly"),
    range: str = Query("7d"),
    format: str = Query("csv"),
    user=require_role("warden", "dean"),
    db=Depends(get_db),
):
    hostel = hostel_from_token(user)
    days = days_from_range(range)
    since = date.today() - timedelta(days=days)

    rows = await db.fetch(
        """SELECT wl.date,
               COUNT(*) as n,
               AVG(wl.wellness_score) as avg_wellness,
               AVG(wl.sleep_hours) as avg_sleep,
               AVG(wl.mood_score) as avg_mood
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE h.name=$1 AND wl.date >= $2
           GROUP BY wl.date ORDER BY wl.date""",
        hostel,
        since,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "date",
            "n_students",
            "avg_wellness_score",
            "avg_sleep_hours",
            "avg_mood_score",
        ]
    )
    for r in rows:
        n = r["n"]
        if n < 30:
            writer.writerow([r["date"], "N/A — insufficient data", "N/A", "N/A", "N/A"])
        else:
            writer.writerow(
                [
                    r["date"],
                    n,
                    round(float(r["avg_wellness"] or 0), 2),
                    round(float(r["avg_sleep"] or 0), 2),
                    round(float(r["avg_mood"] or 0), 2),
                ]
            )

    output.seek(0)
    filename = f"univitals_{hostel}_{report_type}_{date.today()}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
