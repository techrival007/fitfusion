import bcrypt
import json
from datetime import date, datetime, timedelta, time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from jose import jwt

from app.database import get_db
from app.auth import require_role, ALGORITHM
from app.config import settings
from app.privacy import encrypt_journal, decrypt_journal
from app.services.environment import get_aqi_info, get_environment_context

router = APIRouter()

DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def _env_stress(aqi: int) -> float:
    if aqi <= 50:
        return 0.0
    if aqi <= 100:
        return 25.0
    if aqi <= 150:
        return 50.0
    if aqi <= 200:
        return 75.0
    return 100.0


def _compute_wellness(
    activity_min: float,
    calories: float,
    mood: float,
    env_stress: float,
    sleep_hrs: float,
) -> dict:
    activity_score = min(100.0, (activity_min / 45.0) * 100.0)
    nutrition_score = min(100.0, (calories / 2000.0) * 100.0)
    mood_score = (mood / 5.0) * 100.0
    sleep_score = min(100.0, (sleep_hrs / 8.0) * 100.0)
    wellness = (
        (activity_score * 0.35)
        + (nutrition_score * 0.25)
        + (mood_score * 0.20)
        + (sleep_score * 0.10)
        + ((100.0 - env_stress) * 0.10)
    )
    return {
        "wellness_score": round(min(100.0, wellness), 1),
        "activity_score": round(activity_score, 1),
        "nutrition_score": round(nutrition_score, 1),
        "mood_score": round(mood_score, 1),
        "env_stress_score": round(env_stress, 1),
        "sleep_hours": round(sleep_hrs, 2),
    }


async def _upsert_wellness(user_id: str, target_date: date, db):
    activity = await db.fetchrow(
        "SELECT COALESCE(SUM(duration_minutes),0) as mins, COALESCE(SUM(calories_burned),0) as cal "
        "FROM activity_logs WHERE user_id=$1 AND date=$2",
        user_id,
        target_date,
    )
    nutrition = await db.fetchrow(
        "SELECT COALESCE(SUM(total_calories),0) as cal FROM nutrition_logs WHERE user_id=$1 AND date=$2",
        user_id,
        target_date,
    )
    mood = await db.fetchrow(
        "SELECT COALESCE(AVG(mood_score),3) as mood FROM mood_logs WHERE user_id=$1 AND date=$2",
        user_id,
        target_date,
    )
    sleep = await db.fetchrow(
        "SELECT COALESCE(MAX(sleep_hours),0) as hrs FROM sleep_logs WHERE user_id=$1 AND date=$2",
        user_id,
        target_date,
    )
    env = await db.fetchrow(
        "SELECT aqi FROM environmental_snapshots WHERE recorded_at::date=$1 ORDER BY recorded_at DESC LIMIT 1",
        target_date,
    )

    aqi = env["aqi"] if env else 50
    env_stress = _env_stress(aqi)
    scores = _compute_wellness(
        float(activity["mins"]),
        float(nutrition["cal"]),
        float(mood["mood"]),
        env_stress,
        float(sleep["hrs"]),
    )

    await db.execute(
        """INSERT INTO wellness_logs(user_id, date, wellness_score, activity_score,
              nutrition_score, mood_score, env_stress_score, sleep_hours)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT(user_id, date) DO UPDATE SET
              wellness_score=EXCLUDED.wellness_score,
              activity_score=EXCLUDED.activity_score,
              nutrition_score=EXCLUDED.nutrition_score,
              mood_score=EXCLUDED.mood_score,
              env_stress_score=EXCLUDED.env_stress_score,
              sleep_hours=EXCLUDED.sleep_hours""",
        user_id,
        target_date,
        scores["wellness_score"],
        scores["activity_score"],
        scores["nutrition_score"],
        scores["mood_score"],
        scores["env_stress_score"],
        scores["sleep_hours"],
    )
    return scores


# ── Auth ──────────────────────────────────────────────────────────────────────


class StudentLoginRequest(BaseModel):
    roll_number: str
    password: str


@router.post("/auth/login")
async def student_login(body: StudentLoginRequest, db=Depends(get_db)):
    row = await db.fetchrow(
        """SELECT u.id, u.name, u.email, u.roll_number, u.password_hash, u.role,
                  u.branch, u.academic_year, u.hostel_id, h.name as hostel_name
           FROM users u
           LEFT JOIN hostels h ON h.id = u.hostel_id
           WHERE u.roll_number=$1 AND u.role='student'""",
        body.roll_number,
    )
    if not row or not bcrypt.checkpw(
        body.password.encode(), row["password_hash"].encode()
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = dict(row)
    payload = {
        "sub": str(user["id"]),
        "role": "student",
        "name": user["name"],
        "hostel_id": user["hostel_name"],
        "hostel_db_id": user["hostel_id"],
        "roll_number": user["roll_number"],
        "branch": user["branch"],
        "year": user["academic_year"],
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=48),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)
    return {
        "token": token,
        "name": user["name"],
        "roll_number": user["roll_number"],
        "hostel": user["hostel_name"],
        "branch": user["branch"],
        "year": user["academic_year"],
    }


# ── Dashboard ─────────────────────────────────────────────────────────────────


@router.get("/dashboard")
async def student_dashboard(user=require_role("student"), db=Depends(get_db)):
    uid = user["sub"]
    today = date.today()

    today_wl = await db.fetchrow(
        "SELECT * FROM wellness_logs WHERE user_id=$1 AND date=$2", uid, today
    )
    activity_today = await db.fetchrow(
        "SELECT COALESCE(SUM(duration_minutes),0) as mins FROM activity_logs WHERE user_id=$1 AND date=$2",
        uid,
        today,
    )
    nutrition_today = await db.fetchrow(
        "SELECT COALESCE(SUM(total_calories),0) as cal FROM nutrition_logs WHERE user_id=$1 AND date=$2",
        uid,
        today,
    )
    mood_today = await db.fetchrow(
        "SELECT mood_score FROM mood_logs WHERE user_id=$1 AND date=$2 ORDER BY id DESC LIMIT 1",
        uid,
        today,
    )

    week_history = await db.fetch(
        """SELECT wl.date, wl.wellness_score,
                  COALESCE((SELECT SUM(al.duration_minutes) FROM activity_logs al WHERE al.user_id=$1 AND al.date=wl.date),0) as activity_minutes,
                  COALESCE((SELECT SUM(nl.total_calories) FROM nutrition_logs nl WHERE nl.user_id=$1 AND nl.date=wl.date),0) as calories,
                  COALESCE((SELECT AVG(ml.mood_score) FROM mood_logs ml WHERE ml.user_id=$1 AND ml.date=wl.date),3) as mood,
                  wl.sleep_hours
           FROM wellness_logs wl WHERE wl.user_id=$1 AND wl.date >= $2
           ORDER BY wl.date""",
        uid,
        today - timedelta(days=7),
    )

    env_context = await get_environment_context(db, range_days=14, refresh_live=True)
    env_payload = env_context.get("current") or {}

    nudge = await db.fetchrow(
        "SELECT nudge_type, message FROM wellness_nudges WHERE user_id=$1 AND acknowledged=false ORDER BY generated_at DESC LIMIT 1",
        uid,
    )

    streak = await db.fetchval(
        """WITH consecutive AS (
             SELECT date, ROW_NUMBER() OVER (ORDER BY date DESC) as rn
             FROM wellness_logs WHERE user_id=$1 AND date <= $2
           )
           SELECT COUNT(*) FROM consecutive WHERE date = $2 - INTERVAL '1 day' * (rn - 1)""",
        uid,
        today,
    )

    today_scores = {
        "wellness_score": float(today_wl["wellness_score"]) if today_wl else 0,
        "activity_score": float(today_wl["activity_score"]) if today_wl else 0,
        "nutrition_score": float(today_wl["nutrition_score"]) if today_wl else 0,
        "mood_score": float(today_wl["mood_score"]) if today_wl else 0,
        "env_stress_score": float(today_wl["env_stress_score"]) if today_wl else 0,
        "sleep_hours": float(today_wl["sleep_hours"]) if today_wl else 0,
        "activity_minutes": int(activity_today["mins"]),
        "calories": round(float(nutrition_today["cal"])),
        "mood": float(mood_today["mood_score"]) if mood_today else 3.0,
    }

    return {
        "today": today_scores,
        "week_history": [
            {
                "date": str(r["date"]),
                "wellness_score": round(float(r["wellness_score"]), 1),
                "wellnessScore": round(float(r["wellness_score"]), 1),
                "activity_minutes": int(r["activity_minutes"]),
                "calories": round(float(r["calories"])),
                "mood": round(float(r["mood"]), 1),
                "sleep": round(float(r["sleep_hours"] or 0), 1),
            }
            for r in week_history
        ],
        "environment": {
            "aqi": env_payload.get("aqi", 50),
            "aqi_category": env_payload.get("aqi_category", "Moderate"),
            "aqi_color": env_payload.get(
                "aqi_color", get_aqi_info(env_payload.get("aqi", 50))["color"]
            ),
            "temperature_c": env_payload.get("temperature_c", 28.0),
            "humidity_pct": env_payload.get("humidity_pct", 55),
            "uv_index": env_payload.get("uv_index", 5),
            "weather_text": env_payload.get("weather_text"),
            "outdoor_safe": bool(env_payload.get("outdoor_safe", True)),
            "sleep_risk": env_payload.get("sleep_risk", 0),
            "env_stress_score": env_payload.get("env_stress_score", 0),
            "activity_recommendation": env_payload.get("activity_recommendation"),
        },
        "hourly_environment": env_context.get("hourly", [])[:12],
        "daily_environment": env_context.get("daily", [])[:5],
        "nudge": {
            "type": nudge["nudge_type"],
            "nudge_type": nudge["nudge_type"],
            "message": nudge["message"],
        }
        if nudge
        else None,
        "streak_days": int(streak or 1),
    }


# ── Wellness history ───────────────────────────────────────────────────────────


@router.get("/wellness/history")
async def wellness_history(
    days: int = Query(30, ge=7, le=90),
    user=require_role("student"),
    db=Depends(get_db),
):
    uid = user["sub"]
    since = date.today() - timedelta(days=days)
    rows = await db.fetch(
        """SELECT wl.date, wl.wellness_score, wl.sleep_hours,
                  COALESCE((SELECT SUM(al.duration_minutes) FROM activity_logs al WHERE al.user_id=$1 AND al.date=wl.date),0) as activity_minutes,
                  COALESCE((SELECT SUM(nl.total_calories)   FROM nutrition_logs nl WHERE nl.user_id=$1 AND nl.date=wl.date),0) as calories,
                  COALESCE((SELECT AVG(ml.mood_score)       FROM mood_logs ml   WHERE ml.user_id=$1 AND ml.date=wl.date),3)   as mood
           FROM wellness_logs wl WHERE wl.user_id=$1 AND wl.date >= $2
           ORDER BY wl.date""",
        uid,
        since,
    )
    return [
        {
            "date": str(r["date"]),
            "wellnessScore": round(float(r["wellness_score"]), 1),
            "activityMin": int(r["activity_minutes"]),
            "calories": round(float(r["calories"])),
            "sleep": round(float(r["sleep_hours"] or 0), 1),
            "mood": round(float(r["mood"]), 1),
        }
        for r in rows
    ]


# ── Today's mess menu ─────────────────────────────────────────────────────────


@router.get("/mess/menu/today")
async def today_menu(user=require_role("student"), db=Depends(get_db)):
    today = date.today()
    iso_week = today.isocalendar()[1]
    dow = today.weekday() + 1  # 1=Monday…7=Sunday (seed uses 1-7)

    def normalize_items(raw_items):
        items = raw_items
        if isinstance(items, str):
            try:
                items = json.loads(items)
            except json.JSONDecodeError:
                items = []
        if not isinstance(items, list):
            return []

        normalized_items = []
        for item in items:
            if isinstance(item, dict):
                normalized_items.append(
                    {
                        "name": item.get("name"),
                        "food_id": item.get("food_id"),
                        "quantity_g": item.get("quantity_g", 100),
                        "calories_per_100g": item.get("calories_per_100g", 0),
                        "protein_per_100g": item.get("protein_per_100g", 0),
                        "carbs_per_100g": item.get("carbs_per_100g", 0),
                        "fat_per_100g": item.get("fat_per_100g", 0),
                    }
                )
            elif item:
                normalized_items.append({"name": str(item)})
        return normalized_items

    rows = await db.fetch(
        """SELECT mm.meal_type, mm.food_items, mm.estimated_calories, mm.estimated_protein
           FROM mess_menu mm
           WHERE mm.week_number=$1 AND mm.day_of_week=$2 AND mm.is_published=true
           ORDER BY mm.meal_type""",
        iso_week,
        dow,
    )

    menu = {}
    for r in rows:
        menu[r["meal_type"]] = normalize_items(r["food_items"])

    if not menu:
        fallback = await db.fetch(
            """SELECT mm.meal_type, mm.food_items
                FROM mess_menu mm WHERE mm.is_published=true
                ORDER BY mm.week_number DESC, mm.day_of_week LIMIT 4""",
        )
        for r in fallback:
            if r["meal_type"] not in menu:
                menu[r["meal_type"]] = normalize_items(r["food_items"])

    return menu


# ── Leaderboard ───────────────────────────────────────────────────────────────


@router.get("/leaderboard")
async def hostel_leaderboard(user=require_role("student"), db=Depends(get_db)):
    today = date.today()
    rows = await db.fetch(
        """SELECT h.name as hostel_name, ROUND(AVG(wl.wellness_score)::numeric, 1) as avg_score,
                  COUNT(DISTINCT wl.user_id) as student_count
           FROM wellness_logs wl
           JOIN users u ON u.id = wl.user_id
           JOIN hostels h ON h.id = u.hostel_id
           WHERE wl.date >= $1
           GROUP BY h.name ORDER BY avg_score DESC""",
        today - timedelta(days=7),
    )
    return [
        {
            "hostelName": r["hostel_name"],
            "avgScore": float(r["avg_score"]),
            "count": r["student_count"],
        }
        for r in rows
    ]


# ── Log: Activity ─────────────────────────────────────────────────────────────


class ActivityLogRequest(BaseModel):
    activity_type: str
    duration_minutes: int
    intensity: str
    location: str
    notes: Optional[str] = None
    calories_burned: Optional[float] = None


@router.post("/log/activity")
async def log_activity(
    body: ActivityLogRequest, user=require_role("student"), db=Depends(get_db)
):
    uid = user["sub"]
    today = date.today()
    MET = {"low": 3.0, "moderate": 6.0, "high": 9.0}.get(body.intensity, 6.0)
    cal = body.calories_burned or round(MET * 60 * (body.duration_minutes / 60))

    row = await db.fetchrow(
        """INSERT INTO activity_logs(user_id, date, activity_type, duration_minutes,
              intensity, calories_burned, location, notes)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id""",
        uid,
        today,
        body.activity_type,
        body.duration_minutes,
        body.intensity,
        cal,
        body.location,
        body.notes,
    )
    scores = await _upsert_wellness(uid, today, db)
    return {"id": str(row["id"]), "calories_burned": cal, "wellness": scores}


# ── Log: Nutrition ────────────────────────────────────────────────────────────


class NutritionLogRequest(BaseModel):
    meal_type: str
    food_items: list
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fibre: float = 0.0
    meal_rating: Optional[int] = None
    meal_feedback_tag: Optional[str] = None


@router.post("/log/nutrition")
async def log_nutrition(
    body: NutritionLogRequest, user=require_role("student"), db=Depends(get_db)
):
    uid = user["sub"]
    today = date.today()

    food_json = json.dumps(body.food_items)

    existing = await db.fetchval(
        "SELECT id FROM nutrition_logs WHERE user_id=$1 AND date=$2 AND meal_type=$3",
        uid,
        today,
        body.meal_type,
    )
    if existing:
        await db.execute(
            """UPDATE nutrition_logs SET food_items=$1, total_calories=$2, total_protein=$3,
                  total_carbs=$4, total_fat=$5, total_fibre=$6, meal_rating=$7, meal_feedback_tag=$8
               WHERE id=$9""",
            food_json,
            body.total_calories,
            body.total_protein,
            body.total_carbs,
            body.total_fat,
            body.total_fibre,
            body.meal_rating,
            body.meal_feedback_tag,
            existing,
        )
        row_id = existing
    else:
        row_id = await db.fetchval(
            """INSERT INTO nutrition_logs(user_id, date, meal_type, food_items, total_calories,
                  total_protein, total_carbs, total_fat, total_fibre, meal_rating, meal_feedback_tag)
               VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id""",
            uid,
            today,
            body.meal_type,
            food_json,
            body.total_calories,
            body.total_protein,
            body.total_carbs,
            body.total_fat,
            body.total_fibre,
            body.meal_rating,
            body.meal_feedback_tag,
        )

    scores = await _upsert_wellness(uid, today, db)
    return {"id": str(row_id), "wellness": scores}


# ── Log: Mood & Sleep ─────────────────────────────────────────────────────────


class MoodSleepRequest(BaseModel):
    mood_score: int
    time_of_day: str
    energy_level: int
    stress_level: int
    sleep_time: time
    wake_time: time
    sleep_hours: float
    sleep_quality: int


@router.post("/log/mood-sleep")
async def log_mood_sleep(
    body: MoodSleepRequest, user=require_role("student"), db=Depends(get_db)
):
    uid = user["sub"]
    today = date.today()

    MOOD_EMOJIS = {5: "😄", 4: "🙂", 3: "😐", 2: "😔", 1: "😞"}
    existing_mood = await db.fetchval(
        "SELECT id FROM mood_logs WHERE user_id=$1 AND date=$2", uid, today
    )
    if existing_mood:
        await db.execute(
            "UPDATE mood_logs SET mood_score=$1, energy_level=$2, stress_level=$3, time_of_day=$4, mood_emoji=$5 WHERE id=$6",
            body.mood_score,
            body.energy_level,
            body.stress_level,
            body.time_of_day,
            MOOD_EMOJIS.get(body.mood_score, "😐"),
            existing_mood,
        )
    else:
        await db.execute(
            """INSERT INTO mood_logs(user_id, date, time_of_day, mood_emoji, mood_score, energy_level, stress_level)
               VALUES($1,$2,$3,$4,$5,$6,$7)""",
            uid,
            today,
            body.time_of_day,
            MOOD_EMOJIS.get(body.mood_score, "😐"),
            body.mood_score,
            body.energy_level,
            body.stress_level,
        )

    existing_sleep = await db.fetchval(
        "SELECT id FROM sleep_logs WHERE user_id=$1 AND date=$2", uid, today
    )
    if existing_sleep:
        await db.execute(
            "UPDATE sleep_logs SET sleep_hours=$1, sleep_quality=$2, sleep_time=$3, wake_time=$4 WHERE id=$5",
            body.sleep_hours,
            body.sleep_quality,
            body.sleep_time,
            body.wake_time,
            existing_sleep,
        )
    else:
        await db.execute(
            """INSERT INTO sleep_logs(user_id, date, sleep_time, wake_time, sleep_hours, sleep_quality)
               VALUES($1,$2,$3,$4,$5,$6)""",
            uid,
            today,
            body.sleep_time,
            body.wake_time,
            body.sleep_hours,
            body.sleep_quality,
        )

    scores = await _upsert_wellness(uid, today, db)
    return {"wellness": scores}


# ── Journal (AES-256-GCM) ─────────────────────────────────────────────────────


class JournalWriteRequest(BaseModel):
    entry_text: str


@router.post("/journal")
async def save_journal_entry(
    body: JournalWriteRequest, user=require_role("student"), db=Depends(get_db)
):
    if not body.entry_text.strip():
        raise HTTPException(status_code=400, detail="Entry cannot be empty")

    uid = user["sub"]
    today = date.today()
    word_count = len(body.entry_text.strip().split())
    ciphertext = encrypt_journal(body.entry_text)

    row_id = await db.fetchval(
        """INSERT INTO journal_entries(user_id, date, entry_text, word_count)
           VALUES($1,$2,$3,$4) RETURNING id""",
        uid,
        today,
        ciphertext,
        word_count,
    )
    return {"id": str(row_id), "date": str(today), "word_count": word_count}


@router.put("/journal/{entry_id}")
async def update_journal_entry(
    entry_id: str,
    body: JournalWriteRequest,
    user=require_role("student"),
    db=Depends(get_db),
):
    if not body.entry_text.strip():
        raise HTTPException(status_code=400, detail="Entry cannot be empty")

    uid = user["sub"]
    row = await db.fetchrow("SELECT user_id FROM journal_entries WHERE id=$1", entry_id)
    if not row:
        raise HTTPException(status_code=404, detail="Entry not found")
    if str(row["user_id"]) != uid:
        raise HTTPException(status_code=403, detail="Not your entry")

    word_count = len(body.entry_text.strip().split())
    ciphertext = encrypt_journal(body.entry_text)
    await db.execute(
        "UPDATE journal_entries SET entry_text=$1, word_count=$2, created_at=NOW() WHERE id=$3",
        ciphertext,
        word_count,
        entry_id,
    )
    return {"id": entry_id, "word_count": word_count}


@router.get("/journal")
async def list_journal_entries(user=require_role("student"), db=Depends(get_db)):
    uid = user["sub"]
    rows = await db.fetch(
        "SELECT id, date, word_count FROM journal_entries WHERE user_id=$1 ORDER BY date DESC LIMIT 30",
        uid,
    )
    return [
        {"id": str(r["id"]), "date": str(r["date"]), "word_count": r["word_count"]}
        for r in rows
    ]


@router.get("/journal/{entry_id}")
async def get_journal_entry(
    entry_id: str, user=require_role("student"), db=Depends(get_db)
):
    uid = user["sub"]
    row = await db.fetchrow(
        "SELECT id, user_id, date, entry_text, word_count FROM journal_entries WHERE id=$1",
        entry_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Entry not found")
    plaintext = decrypt_journal(row["entry_text"], uid, str(row["user_id"]))
    return {
        "id": str(row["id"]),
        "date": str(row["date"]),
        "word_count": row["word_count"],
        "text": plaintext,
    }


@router.delete("/journal/{entry_id}")
async def delete_journal_entry(
    entry_id: str, user=require_role("student"), db=Depends(get_db)
):
    uid = user["sub"]
    row = await db.fetchrow("SELECT user_id FROM journal_entries WHERE id=$1", entry_id)
    if not row:
        raise HTTPException(status_code=404, detail="Entry not found")
    if str(row["user_id"]) != uid:
        raise HTTPException(status_code=403, detail="Not your entry")
    await db.execute("DELETE FROM journal_entries WHERE id=$1", entry_id)
    return {"deleted": True}
