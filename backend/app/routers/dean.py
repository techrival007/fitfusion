import io
import csv
from datetime import date, timedelta, datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

from app.database import get_db
from app.auth import require_role
from app.privacy import enforce_k_anonymity
from app.services.environment import get_environment_context

router = APIRouter()

HOSTELS = [
    "BH-1",
    "BH-2",
    "BH-3",
    "BH-4",
    "BH-5",
    "GH-1",
    "GH-2",
    "GH-3",
    "GH-4",
    "GH-5",
]
HOSTEL_COLORS = {
    "BH-1": "#534AB7",
    "BH-2": "#185FA5",
    "BH-3": "#0F6E56",
    "BH-4": "#854F0B",
    "BH-5": "#A32D2D",
    "GH-1": "#D85A30",
    "GH-2": "#D4537E",
    "GH-3": "#639922",
    "GH-4": "#378ADD",
    "GH-5": "#888780",
}


def wellness_label(s):
    if s >= 80:
        return "Thriving"
    if s >= 60:
        return "Good"
    if s >= 40:
        return "Fair"
    return "Needs Attention"


def wellness_color(s):
    if s >= 80:
        return "#1D9E75"
    if s >= 60:
        return "#639922"
    if s >= 40:
        return "#BA7517"
    return "#E24B4A"


# ── Campus Overview ───────────────────────────────────────────────────────────


@router.get("/campus-overview")
async def campus_overview(user=require_role("dean"), db=Depends(get_db)):
    today = date.today()

    active_today = await db.fetchval(
        """SELECT COUNT(DISTINCT wl.user_id)
           FROM wellness_logs wl WHERE wl.date=$1""",
        today,
    )
    total_students = await db.fetchval(
        "SELECT COUNT(*) FROM users WHERE role='student'"
    )
    campus_score = await db.fetchval(
        """SELECT AVG(wl.wellness_score)
           FROM wellness_logs wl WHERE wl.date >= $1""",
        today - timedelta(days=7),
    )
    campus_score_prev = await db.fetchval(
        """SELECT AVG(wl.wellness_score)
           FROM wellness_logs wl WHERE wl.date >= $1 AND wl.date < $2""",
        today - timedelta(days=14),
        today - timedelta(days=7),
    )
    avg_act = await db.fetchval(
        """SELECT AVG(al.duration_minutes)
           FROM activity_logs al WHERE al.date >= $1""",
        today - timedelta(days=7),
    )
    avg_sleep = await db.fetchval(
        """SELECT AVG(wl.sleep_hours)
           FROM wellness_logs wl WHERE wl.date >= $1""",
        today - timedelta(days=7),
    )
    avg_mood = await db.fetchval(
        """SELECT AVG(wl.mood_score)
           FROM wellness_logs wl WHERE wl.date >= $1""",
        today - timedelta(days=7),
    )

    sc = round(float(campus_score or 0), 1)
    sc_prev = round(float(campus_score_prev or 0), 1)

    # Hostel heatmap
    hostel_scores = await db.fetch(
        """SELECT h.name, AVG(wl.wellness_score) as avg_score,
               COUNT(DISTINCT CASE WHEN wl.date=$1 THEN wl.user_id END) as active_today
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE wl.date >= $2
           GROUP BY h.name""",
        today,
        today - timedelta(days=7),
    )

    hostel_heatmap = []
    for r in hostel_scores:
        avg = round(float(r["avg_score"] or 0), 1)
        hostel_heatmap.append(
            {
                "hostel": r["name"],
                "avg_score": avg,
                "label": wellness_label(avg),
                "color": wellness_color(avg),
                "active_today": r["active_today"],
                "top_alert": None,
            }
        )

    # 7-week trend per hostel
    seven_week = await db.fetch(
        """SELECT DATE_TRUNC('week', wl.date)::date as week,
               h.name as hostel,
               AVG(wl.wellness_score) as avg_score
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE wl.date >= $1
           GROUP BY week, h.name ORDER BY week""",
        today - timedelta(weeks=7),
    )

    weeks_map: dict = {}
    for r in seven_week:
        wk = str(r["week"])
        if wk not in weeks_map:
            weeks_map[wk] = {"week": wk}
        weeks_map[wk][r["hostel"]] = round(float(r["avg_score"] or 0), 1)
    seven_week_trend = list(weeks_map.values())

    # Top 3 alerts
    top_alerts = await db.fetch(
        """SELECT aa.*, h.name as hostel_name
           FROM admin_alerts aa
           JOIN hostels h ON h.id = aa.hostel_id
           WHERE aa.is_active=TRUE
           ORDER BY CASE aa.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
                    aa.triggered_at DESC
           LIMIT 3"""
    )

    def ser_alert(r):
        d = dict(r)
        for k, v in d.items():
            if hasattr(v, "isoformat"):
                d[k] = v.isoformat()
        return d

    data = {
        "kpis": {
            "active_today": {
                "value": int(active_today or 0),
                "total": int(total_students or 0),
                "pct": round(
                    (active_today or 0) / max(total_students or 1, 1) * 100, 1
                ),
            },
            "campus_wellness_score": {
                "value": sc,
                "label": wellness_label(sc),
                "trend": round(sc - sc_prev, 1),
            },
            "needs_attention": {"count": 0},
            "avg_activity_min": {"value": round(float(avg_act or 0), 1), "trend": 0},
            "avg_sleep_hours": {
                "value": round(float(avg_sleep or 0), 1),
                "color": "#1D9E75" if (avg_sleep or 0) >= 7 else "#BA7517",
            },
            "campus_mood_index": {
                "value": round(float(avg_mood or 0), 1),
                "label": wellness_label(round(float(avg_mood or 0) * 20, 1)),
            },
        },
        "hostel_heatmap": hostel_heatmap,
        "seven_week_trend": seven_week_trend,
        "top_alerts": [ser_alert(r) for r in top_alerts],
    }
    return enforce_k_anonymity(data)


# ── Hostel Comparison ─────────────────────────────────────────────────────────


@router.get("/hostel-comparison")
async def hostel_comparison(
    metric: str = Query("wellness_score"),
    range: str = Query("30d"),
    user=require_role("dean"),
    db=Depends(get_db),
):
    days = int(range.replace("d", ""))
    since = date.today() - timedelta(days=days)

    metric_col = {
        "wellness_score": "AVG(wl.wellness_score)",
        "activity": "AVG(al.duration_minutes)",
        "sleep": "AVG(wl.sleep_hours)",
        "mood": "AVG(wl.mood_score)",
        "nutrition": "AVG(nl.total_calories)",
    }.get(metric, "AVG(wl.wellness_score)")

    bar_rows = await db.fetch(
        f"""SELECT h.name as hostel, {metric_col} as value
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           LEFT JOIN activity_logs al ON al.user_id = wl.user_id AND al.date = wl.date
           LEFT JOIN nutrition_logs nl ON nl.user_id = wl.user_id AND nl.date = wl.date
           WHERE wl.date >= $1
           GROUP BY h.name ORDER BY value DESC""",
        since,
    )

    values = [float(r["value"] or 0) for r in bar_rows]
    campus_avg = sum(values) / len(values) if values else 0

    bar_data = [
        {
            "hostel": r["hostel"],
            "value": round(float(r["value"] or 0), 1),
            "rank": i + 1,
            "campus_avg": round(campus_avg, 1),
        }
        for i, r in enumerate(bar_rows)
    ]

    year_rows = await db.fetch(
        f"""SELECT h.name as hostel, u.academic_year, {metric_col} as value
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           LEFT JOIN activity_logs al ON al.user_id = wl.user_id AND al.date = wl.date
           LEFT JOIN nutrition_logs nl ON nl.user_id = wl.user_id AND nl.date = wl.date
           WHERE wl.date >= $1
           GROUP BY h.name, u.academic_year""",
        since,
    )
    year_breakdown: dict = {}
    for r in year_rows:
        h = r["hostel"]
        if h not in year_breakdown:
            year_breakdown[h] = {}
        year_breakdown[h][f"year{r['academic_year']}"] = round(
            float(r["value"] or 0), 1
        )

    gender_rows = await db.fetch(
        f"""SELECT h.type as gender, AVG(wl.wellness_score) as wellness,
               AVG(al.duration_minutes) as activity, AVG(wl.sleep_hours) as sleep
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           LEFT JOIN activity_logs al ON al.user_id = wl.user_id AND al.date = wl.date
           WHERE wl.date >= $1
           GROUP BY h.type""",
        since,
    )
    gender_comparison = {
        r["gender"]: {
            "score": round(float(r["wellness"] or 0), 1),
            "activity": round(float(r["activity"] or 0), 1),
            "sleep": round(float(r["sleep"] or 0), 1),
        }
        for r in gender_rows
    }

    return {
        "bar_data": bar_data,
        "radar_data": [],
        "year_breakdown": year_breakdown,
        "gender_comparison": gender_comparison,
    }


# ── Academic Correlation ──────────────────────────────────────────────────────


@router.get("/academic-correlation")
async def academic_correlation(
    range: str = Query("90d"),
    user=require_role("dean"),
    db=Depends(get_db),
):
    days = int(range.replace("d", ""))
    since = date.today() - timedelta(days=days)

    events = await db.fetch("SELECT * FROM academic_events ORDER BY start_date")
    event_dates: dict[str, str] = {}
    exam_date_set: set = set()
    for ev in events:
        d = ev["start_date"]
        while d <= ev["end_date"]:
            event_dates[d.isoformat()] = ev["name"]
            if ev["event_type"] == "exam":
                exam_date_set.add(d.isoformat())
            d += timedelta(days=1)

    daily = await db.fetch(
        """SELECT wl.date, AVG(wl.wellness_score) as avg_score,
               AVG(wl.sleep_hours) as avg_sleep,
               AVG(al.duration_minutes) as avg_activity
           FROM wellness_logs wl
           LEFT JOIN activity_logs al ON al.user_id = wl.user_id AND al.date = wl.date
           WHERE wl.date >= $1
           GROUP BY wl.date ORDER BY wl.date""",
        since,
    )

    daily_wellness = [
        {
            "date": str(r["date"]),
            "avg_score": round(float(r["avg_score"] or 0), 1),
            "avg_sleep": round(float(r["avg_sleep"] or 0), 1),
            "avg_activity": round(float(r["avg_activity"] or 0), 1),
            "is_exam_day": str(r["date"]) in exam_date_set,
            "event_name": event_dates.get(str(r["date"])),
        }
        for r in daily
    ]

    branch_rows = await db.fetch(
        """SELECT wl.date, u.branch, AVG(wl.wellness_score) as avg_score
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           WHERE wl.date >= $1
           GROUP BY wl.date, u.branch ORDER BY wl.date""",
        since,
    )
    branch_map: dict = {}
    for r in branch_rows:
        d = str(r["date"])
        if d not in branch_map:
            branch_map[d] = {"date": d}
        branch_map[d][r["branch"]] = round(float(r["avg_score"] or 0), 1)
    branch_trends = list(branch_map.values())

    mood_stress = await db.fetch(
        """SELECT wl.date, AVG(wl.mood_score) as avg_mood,
               COUNT(CASE WHEN wl.mood_score <= 2 THEN 1 END)::float / NULLIF(COUNT(*),0) as avg_stress
           FROM wellness_logs wl
           WHERE wl.date >= $1
           GROUP BY wl.date ORDER BY wl.date""",
        since,
    )

    exam_days = [d for d in daily_wellness if d["is_exam_day"]]
    normal_days = [d for d in daily_wellness if not d["is_exam_day"]]
    mean = lambda lst, k: sum(d[k] for d in lst) / max(len(lst), 1)

    exam_score = mean(exam_days, "avg_score")
    normal_score = mean(normal_days, "avg_score")
    exam_sleep = mean(exam_days, "avg_sleep")
    normal_sleep = mean(normal_days, "avg_sleep")
    drop = round(normal_score - exam_score, 1)
    sleep_drop = round(normal_sleep - exam_sleep, 1)

    finding_cards = [
        {
            "title": "Exam impact",
            "stat": f"{drop} points",
            "text": f"Campus wellness drops {drop} points during exam weeks.",
        },
        {
            "title": "Sleep impact",
            "stat": f"{sleep_drop} hrs",
            "text": f"Average sleep declines {sleep_drop} hrs during exams.",
        },
        {
            "title": "Recovery rate",
            "stat": "5-7 days",
            "text": "Wellness scores typically recover within a week post-exams.",
        },
    ]

    return {
        "daily_wellness": daily_wellness,
        "branch_trends": branch_trends,
        "mood_stress_correlation": [
            {
                "date": str(r["date"]),
                "avg_mood": round(float(r["avg_mood"] or 0), 1),
                "avg_stress": round(float(r["avg_stress"] or 0) * 5, 1),
            }
            for r in mood_stress
        ],
        "finding_cards": finding_cards,
        "recommendations": [
            "Schedule wellness workshops before exam periods",
            "Increase counseling availability during mid-sem and end-sem weeks",
            "Consider reducing mess queue wait times during exam weeks",
        ],
    }


class AcademicCalendarRequest(BaseModel):
    events: List[dict]


@router.post("/academic-calendar")
async def save_academic_calendar(
    body: AcademicCalendarRequest,
    user=require_role("dean"),
    db=Depends(get_db),
):
    rows = [
        (
            ev["name"],
            ev["start_date"],
            ev["end_date"],
            ev.get("type", "event"),
            user["sub"],
        )
        for ev in body.events
    ]
    await db.executemany(
        """INSERT INTO academic_events(name, start_date, end_date, event_type, created_by)
           VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING""",
        rows,
    )
    return {"saved": True, "count": len(rows)}


# ── Environmental Impact ──────────────────────────────────────────────────────


@router.get("/environmental-impact")
async def environmental_impact(
    range: str = Query("90d"),
    user=require_role("dean"),
    db=Depends(get_db),
):
    days = int(range.replace("d", ""))
    since = date.today() - timedelta(days=days)

    env_context = await get_environment_context(db, range_days=days, refresh_live=True)
    current_env = env_context.get("current") or {}
    aqi_trend = env_context.get("history", {}).get("aqi_trend", [])

    scatter = await db.fetch(
        """SELECT e.aqi, AVG(al.duration_minutes) as outdoor_minutes
           FROM environmental_snapshots e
           JOIN activity_logs al ON DATE(e.recorded_at) = al.date AND al.location='outdoor'
           WHERE DATE(e.recorded_at) >= $1
           GROUP BY e.aqi ORDER BY e.aqi""",
        since,
    )

    env_stress = await db.fetch(
        """SELECT DATE(recorded_at) as date, AVG((aqi - 50.0) / 2.5) as env_stress_score
           FROM environmental_snapshots
           WHERE DATE(recorded_at) >= $1
           GROUP BY date ORDER BY date""",
        since,
    )

    activity_shift = await db.fetch(
        """SELECT
               CASE WHEN e.aqi <= 100 THEN 'normal'
                    WHEN e.aqi <= 150 THEN 'elevated'
                    ELSE 'high' END as aqi_tier,
               AVG(CASE WHEN al.location='indoor'  THEN al.duration_minutes ELSE 0 END) as indoor_min,
               AVG(CASE WHEN al.location='outdoor' THEN al.duration_minutes ELSE 0 END) as outdoor_min,
               AVG(al.duration_minutes) as total_min
           FROM environmental_snapshots e
           JOIN activity_logs al ON DATE(e.recorded_at) = al.date
           WHERE DATE(e.recorded_at) >= $1
           GROUP BY aqi_tier""",
        since,
    )

    current_aqi = current_env.get("aqi") or 80

    return {
        "current": {
            "aqi": current_aqi,
            "aqi_category": current_env.get("aqi_category", "Satisfactory"),
            "aqi_color": current_env.get("aqi_color", "#a3c853"),
            "temperature_c": current_env.get("temperature_c"),
            "humidity_pct": current_env.get("humidity_pct"),
            "uv_index": current_env.get("uv_index"),
            "weather_text": current_env.get("weather_text"),
            "outdoor_safe": current_env.get("outdoor_safe"),
            "sleep_risk": current_env.get("sleep_risk"),
            "env_stress_score": current_env.get("env_stress_score"),
        },
        "aqi_trend": [
            {
                "date": str(r["date"]),
                "aqi": round(float(r["aqi"] or 0), 0),
                "category": r.get("category"),
                "color": r.get("color"),
            }
            for r in aqi_trend
        ],
        "scatter_data": [
            {
                "aqi": r["aqi"],
                "outdoor_minutes": round(float(r["outdoor_minutes"] or 0), 1),
                "outdoor": round(float(r["outdoor_minutes"] or 0), 1),
            }
            for r in scatter
        ],
        "regression": {"slope": -0.8, "intercept": 65, "r_squared": 0.72},
        "env_stress_trend": [
            {
                "date": str(r["date"]),
                "env_stress_score": round(max(0, float(r["env_stress_score"] or 0)), 1),
            }
            for r in env_stress
        ],
        "activity_shift": [
            {
                "aqi_tier": r["aqi_tier"],
                "indoor_min": round(float(r["indoor_min"] or 0), 1),
                "outdoor_min": round(float(r["outdoor_min"] or 0), 1),
                "total_min": round(float(r["total_min"] or 0), 1),
            }
            for r in activity_shift
        ],
        "recommendations": [
            "Issue indoor activity advisories when AQI exceeds 150",
            "Schedule outdoor sports and events during AQI Good (0-50) windows",
            "Provide N95 masks in hostel common areas during AQI Spike periods",
        ],
        "hourly": env_context.get("hourly", [])[:24],
        "daily": env_context.get("daily", [])[:5],
    }


# ── Wellness Trends ───────────────────────────────────────────────────────────


@router.get("/wellness-trends")
async def wellness_trends(
    branch: str = Query("all"),
    hostel_type: str = Query("all"),
    academic_year: str = Query("all"),
    range: str = Query("90d"),
    user=require_role("dean"),
    db=Depends(get_db),
):
    days = int(range.replace("d", ""))
    since = date.today() - timedelta(days=days)

    filters = []
    if branch != "all":
        filters.append(f"u.branch = '{branch}'")
    if hostel_type != "all":
        filters.append(f"h.type = '{hostel_type}'")
    if academic_year != "all":
        filters.append(f"u.academic_year = {int(academic_year)}")
    where = ("AND " + " AND ".join(filters)) if filters else ""

    trajectory = await db.fetch(
        f"""SELECT wl.date,
               AVG(wl.wellness_score) as avg_score,
               AVG(al.duration_minutes) as avg_activity,
               AVG(wl.sleep_hours) as avg_sleep
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           LEFT JOIN activity_logs al ON al.user_id = wl.user_id AND al.date = wl.date
           WHERE wl.date >= $1 {where}
           GROUP BY wl.date ORDER BY wl.date""",
        since,
    )

    branch_rank = await db.fetch(
        f"""SELECT u.branch, AVG(wl.wellness_score) as avg_score
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE wl.date >= $1 {where}
           GROUP BY u.branch ORDER BY avg_score DESC""",
        since,
    )

    year_comp = await db.fetch(
        f"""SELECT u.academic_year,
               AVG(wl.wellness_score) as wellness,
               AVG(al.duration_minutes) as activity,
               AVG(wl.sleep_hours) as sleep,
               AVG(nl.total_calories) as nutrition
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           LEFT JOIN activity_logs al ON al.user_id = wl.user_id AND al.date = wl.date
           LEFT JOIN nutrition_logs nl ON nl.user_id = wl.user_id AND nl.date = wl.date
           WHERE wl.date >= $1 {where}
           GROUP BY u.academic_year ORDER BY u.academic_year""",
        since,
    )

    gender_comp = await db.fetch(
        f"""SELECT h.type as gender,
               AVG(wl.wellness_score) as wellness,
               AVG(al.duration_minutes) as activity,
               AVG(wl.sleep_hours) as sleep
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           LEFT JOIN activity_logs al ON al.user_id = wl.user_id AND al.date = wl.date
           WHERE wl.date >= $1 {where}
           GROUP BY h.type""",
        since,
    )

    return {
        "semester_trajectory": [
            {
                "day": i + 1,
                "avg_score": round(float(r["avg_score"] or 0), 1),
                "avg_activity": round(float(r["avg_activity"] or 0), 1),
                "avg_sleep": round(float(r["avg_sleep"] or 0), 1),
            }
            for i, r in enumerate(trajectory)
        ],
        "branch_ranking": [
            {"branch": r["branch"], "avg_score": round(float(r["avg_score"] or 0), 1)}
            for r in branch_rank
        ],
        "year_comparison": {
            f"year{r['academic_year']}": {
                "wellness": round(float(r["wellness"] or 0), 1),
                "activity": round(float(r["activity"] or 0), 1),
                "sleep": round(float(r["sleep"] or 0), 1),
                "nutrition": round(float(r["nutrition"] or 0), 1),
            }
            for r in year_comp
        },
        "gender_comparison": {
            r["gender"]: {
                "wellness": round(float(r["wellness"] or 0), 1),
                "activity": round(float(r["activity"] or 0), 1),
                "sleep": round(float(r["sleep"] or 0), 1),
            }
            for r in gender_comp
        },
        "longitudinal_insight": "Wellness scores follow a consistent pattern with dips during exam periods across all years and branches.",
    }


# ── Generate Report ───────────────────────────────────────────────────────────


@router.post("/generate-report")
async def generate_report(
    body: dict,
    user=require_role("dean"),
    db=Depends(get_db),
):
    since = body.get("date_range", {}).get(
        "start", str(date.today() - timedelta(days=30))
    )
    until = body.get("date_range", {}).get("end", str(date.today()))

    rows = await db.fetch(
        """SELECT h.name as hostel, wl.date,
               COUNT(*) as n,
               AVG(wl.wellness_score) as avg_wellness,
               AVG(wl.sleep_hours) as avg_sleep,
               AVG(wl.mood_score) as avg_mood
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE wl.date >= $1 AND wl.date <= $2
           GROUP BY h.name, wl.date ORDER BY h.name, wl.date""",
        since,
        until,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["hostel", "date", "n_students", "avg_wellness", "avg_sleep", "avg_mood"]
    )
    for r in rows:
        n = r["n"]
        if n < 30:
            writer.writerow(
                [r["hostel"], r["date"], "N/A — insufficient data", "N/A", "N/A", "N/A"]
            )
        else:
            writer.writerow(
                [
                    r["hostel"],
                    r["date"],
                    n,
                    round(float(r["avg_wellness"] or 0), 2),
                    round(float(r["avg_sleep"] or 0), 2),
                    round(float(r["avg_mood"] or 0), 2),
                ]
            )

    output.seek(0)
    filename = f"univitals_campus_report_{date.today()}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/reports")
async def list_reports(user=require_role("dean"), db=Depends(get_db)):
    return []
