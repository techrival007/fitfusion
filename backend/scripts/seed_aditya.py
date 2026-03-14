"""
Seed today's logs + journals + nudges for student 2021EE10492 (Aditya Kumar).
Run from backend/ directory:  python -m scripts.seed_aditya
"""
import asyncio, os, sys, base64
from datetime import date, timedelta, time, datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import asyncpg
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DATABASE_URL           = os.environ["DATABASE_URL"]
JOURNAL_ENCRYPTION_KEY = os.environ["JOURNAL_ENCRYPTION_KEY"]


def _encrypt(text: str) -> str:
    nonce = os.urandom(12)
    key   = base64.b64decode(JOURNAL_ENCRYPTION_KEY)
    ct    = AESGCM(key).encrypt(nonce, text.encode("utf-8"), None)
    return base64.b64encode(nonce).decode() + ":" + base64.b64encode(ct).decode()


JOURNAL_ENTRIES = [
    (0, "Went for a 40-minute run at the athletics track this morning. Felt surprisingly energetic despite the mid-sem pressure. AQI was decent so I could exercise outdoors. Need to stay consistent with sleep this week."),
    (1, "Skipped breakfast again because I woke up late after studying till 2 am. Nutrition has been off lately and I can feel it in my energy levels by afternoon. Going to set a hard cutoff at midnight from tomorrow."),
    (2, "Had a good gym session - chest and shoulders. My bench press is finally improving. Ate three proper meals today which felt like an achievement. Mood was solid, probably the best day this week."),
    (3, "AQI spiked today, stayed indoors. Did a yoga session in the room instead. Feeling stressed about the end-sem syllabus but trying to keep it balanced. Journaling helps."),
    (5, "Talked to my family over the weekend which lifted my mood considerably. Slept 8.5 hours - first proper sleep in a while. Played badminton for an hour in the evening. These kinds of days make the grind worth it."),
    (7, "Productive study day but forgot to log lunch. Nutrition has been inconsistent. My wellness score is probably taking a hit because of that. Reminder to myself: food is fuel, not optional."),
    (10, "Lab assignment submitted. Finally some mental breathing room. Went cycling along the Hauz Khas route with two friends. 55 minutes, felt excellent. Ate well, slept 7.5 hours. Streak feels real now."),
    (14, "Feeling a bit low today, hard to pinpoint why. Stress levels high. Did a short 20-minute walk just to get outside. Skipped the gym. Going to try breathing exercises before bed tonight."),
    (18, "Completed a 5k run in under 28 minutes - personal best this semester. Mood has been consistently better since I started sleeping by 11:30 pm. The correlation is obvious in hindsight."),
    (22, "Warden put up a new running initiative for BH-3. Signed up. Having a group accountability structure might help during exam weeks when motivation dips. Also tried making a meal plan for the week."),
]

NUDGES = [
    ("sleep",       "Your sleep average over the past week is 6.4 hrs. Try maintaining a consistent 11:30 pm bedtime to reach 7-8 hrs. Consistent sleep improves focus and mood significantly."),
    ("activity",    "Great job maintaining your activity streak! You've been active for 7 consecutive days. Keep it going - try a new activity type today to challenge different muscle groups."),
    ("nutrition",   "You skipped breakfast on 3 of the last 7 days. Breakfast improves cognitive performance during morning lectures. Even a banana and milk takes 2 minutes."),
    ("environment", "Today's AQI is in the Satisfactory range - good conditions for outdoor exercise. Consider a run or sports session before 6 pm when UV is lower."),
]

TODAY_ACTIVITY = {
    "activity_type": "running",
    "duration_minutes": 42,
    "intensity": "moderate",
    "calories_burned": 310.0,
    "location": "outdoor",
    "notes": "Morning run, athletics track",
}

TODAY_MEALS = [
    {"meal_type": "breakfast", "total_calories": 410.0, "total_protein": 18.0, "total_carbs": 58.0, "total_fat": 10.5, "total_fibre": 5.0, "meal_rating": 4, "meal_feedback_tag": "tasty"},
    {"meal_type": "lunch",     "total_calories": 680.0, "total_protein": 27.0, "total_carbs": 95.0, "total_fat": 18.0, "total_fibre": 8.5, "meal_rating": 3, "meal_feedback_tag": "no_variety"},
    {"meal_type": "dinner",    "total_calories": 590.0, "total_protein": 24.0, "total_carbs": 78.0, "total_fat": 15.0, "total_fibre": 7.0, "meal_rating": 4, "meal_feedback_tag": "tasty"},
]

TODAY_MOOD = {
    "time_of_day": "morning",
    "mood_emoji": "🙂",
    "mood_score": 4,
    "energy_level": 4,
    "stress_level": 2,
}

TODAY_SLEEP = {
    "sleep_time": time(23, 20),
    "wake_time":  time(6, 45),
    "sleep_hours": 7.4,
    "sleep_quality": 4,
    "disruptions": 1,
}


def compute_wellness(activity_min, calories, mood_score, sleep_hrs, aqi=92):
    env_stress = min(100.0, max(0.0, (aqi - 50) / 2.5))
    activity_s  = min(100.0, (activity_min / 45.0) * 100.0)
    nutrition_s = min(100.0, (calories / 2000.0) * 100.0)
    mood_s      = (mood_score / 5.0) * 100.0
    sleep_s     = min(100.0, (sleep_hrs / 8.0) * 100.0)
    score = (activity_s * 0.35 + nutrition_s * 0.25 + mood_s * 0.20
             + sleep_s * 0.10 + (100.0 - env_stress) * 0.10)
    return round(min(100.0, score), 1), round(activity_s, 1), round(nutrition_s, 1), round(mood_s, 1), round(env_stress, 1)


async def run():
    conn = await asyncpg.connect(DATABASE_URL)

    uid = await conn.fetchval("SELECT id FROM users WHERE roll_number='2021EE10492'")
    if not uid:
        print("ERROR: Student 2021EE10492 not found. Run seed_data.py first.")
        await conn.close()
        return
    print(f"Found Aditya Kumar: {uid}")

    today = date.today()

    # -- Today's activity
    await conn.execute(
        """INSERT INTO activity_logs(user_id, date, activity_type, duration_minutes,
           intensity, calories_burned, location, notes)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING""",
        uid, today,
        TODAY_ACTIVITY["activity_type"], TODAY_ACTIVITY["duration_minutes"],
        TODAY_ACTIVITY["intensity"], TODAY_ACTIVITY["calories_burned"],
        TODAY_ACTIVITY["location"], TODAY_ACTIVITY["notes"],
    )
    print("  activity logged")

    # -- Today's meals
    for m in TODAY_MEALS:
        await conn.execute(
            """INSERT INTO nutrition_logs(user_id, date, meal_type, food_items, total_calories,
               total_protein, total_carbs, total_fat, total_fibre, meal_rating, meal_feedback_tag)
               VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
               ON CONFLICT DO NOTHING""",
            uid, today, m["meal_type"], None,
            m["total_calories"], m["total_protein"], m["total_carbs"],
            m["total_fat"], m["total_fibre"], m["meal_rating"], m["meal_feedback_tag"],
        )
    print("  nutrition logged (3 meals)")

    # -- Today's mood
    await conn.execute(
        """INSERT INTO mood_logs(user_id, date, time_of_day, mood_emoji, mood_score, energy_level, stress_level)
           VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING""",
        uid, today,
        TODAY_MOOD["time_of_day"], TODAY_MOOD["mood_emoji"],
        TODAY_MOOD["mood_score"], TODAY_MOOD["energy_level"], TODAY_MOOD["stress_level"],
    )
    print("  mood logged")

    # -- Today's sleep
    await conn.execute(
        """INSERT INTO sleep_logs(user_id, date, sleep_time, wake_time, sleep_hours, sleep_quality, disruptions)
           VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING""",
        uid, today,
        TODAY_SLEEP["sleep_time"], TODAY_SLEEP["wake_time"],
        TODAY_SLEEP["sleep_hours"], TODAY_SLEEP["sleep_quality"], 1,
    )
    print("  sleep logged")

    # -- Compute + upsert today's wellness log
    total_cal = sum(m["total_calories"] for m in TODAY_MEALS)
    ws, a_s, n_s, m_s, e_s = compute_wellness(
        TODAY_ACTIVITY["duration_minutes"], total_cal,
        TODAY_MOOD["mood_score"], TODAY_SLEEP["sleep_hours"]
    )
    await conn.execute(
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
        uid, today, ws, a_s, n_s, m_s, e_s, TODAY_SLEEP["sleep_hours"],
    )
    print(f"  wellness upserted: score={ws}")

    # -- Journal entries (past days)
    await conn.execute("DELETE FROM journal_entries WHERE user_id=$1", uid)
    for days_ago, text in JOURNAL_ENTRIES:
        entry_date = today - timedelta(days=days_ago)
        ciphertext = _encrypt(text)
        word_count = len(text.split())
        await conn.execute(
            """INSERT INTO journal_entries(user_id, date, entry_text, word_count, created_at)
               VALUES($1,$2,$3,$4,$5)""",
            uid, entry_date, ciphertext, word_count,
            datetime.combine(entry_date, datetime.min.time()).replace(hour=21),
        )
    print(f"  {len(JOURNAL_ENTRIES)} journal entries inserted")

    # -- Wellness nudges
    await conn.execute("DELETE FROM wellness_nudges WHERE user_id=$1", uid)
    nudge_types = ["sleep", "activity", "nutrition", "environment"]
    for i, (nudge_type, message) in enumerate(NUDGES):
        acknowledged = i > 0
        generated_at = datetime.now() - timedelta(days=i)
        await conn.execute(
            """INSERT INTO wellness_nudges(user_id, nudge_type, message, trigger, acknowledged, generated_at)
               VALUES($1,$2,$3,$4,$5,$6)""",
            uid, nudge_type, message, nudge_type, acknowledged, generated_at,
        )
    print(f"  {len(NUDGES)} nudges inserted (1 unacknowledged)")

    await conn.close()
    print("\nDone. Re-run export_db_analysis to refresh JSON files.")


if __name__ == "__main__":
    asyncio.run(run())
