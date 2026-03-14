"""
Seeds today's logs + hostel initiatives + mess menu.
Run after seed_data.py:  python -m scripts.seed_admin
"""
import asyncio, os, sys, json, random, math
from datetime import date, timedelta, time, datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import asyncpg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
DATABASE_URL = os.environ["DATABASE_URL"]

ACTIVITY_TYPES = ["running", "gym", "sports", "yoga", "cycling", "walking", "swimming"]
INTENSITIES    = ["low", "moderate", "high"]
MEAL_TYPES     = ["breakfast", "lunch", "snacks", "dinner"]
FEEDBACK_TAGS  = ["tasty", "cold", "no_variety", "undercooked", "bland"]
DOW_MOOD       = [-0.25, -0.05, 0.05, 0.10, 0.25, 0.45, 0.35]
DOW_SLEEP      = [-0.30, -0.10, 0.00, 0.10, 0.20, 0.75, 0.60]

HOSTEL_BIASES = {
    "BH-1": {"mood": 0.25,  "sleep": 0.30,  "activity": 0.20},
    "BH-2": {"mood": -0.15, "sleep": -0.25, "activity": -0.10},
    "BH-3": {"mood": 0.10,  "sleep": 0.05,  "activity": 0.35},
    "BH-4": {"mood": -0.30, "sleep": -0.10, "activity": 0.05},
    "BH-5": {"mood": 0.05,  "sleep": 0.15,  "activity": -0.05},
    "GH-1": {"mood": 0.20,  "sleep": 0.40,  "activity": 0.10},
    "GH-2": {"mood": 0.35,  "sleep": 0.20,  "activity": 0.25},
    "GH-3": {"mood": -0.10, "sleep": -0.30, "activity": -0.15},
    "GH-4": {"mood": 0.15,  "sleep": 0.10,  "activity": 0.15},
    "GH-5": {"mood": -0.20, "sleep": -0.15, "activity": -0.20},
}

# ── Mess Menu: large pool per meal so each day/week genuinely varies ──────────

BREAKFAST_OPTIONS = [
    (["Idli (2 pcs)", "Sambar", "Curd", "Tea"],            420, 18),
    (["Poha", "Boiled egg", "Milk", "Banana"],              410, 20),
    (["Upma", "Tea", "Boiled egg", "Apple"],                430, 19),
    (["Paratha", "Curd", "Tea"],                            480, 15),
    (["Moong dal chilla", "Curd", "Tea", "Banana"],         440, 22),
    (["Idli (2 pcs)", "Sambar", "Boiled egg", "Tea"],       400, 21),
    (["Poha", "Milk", "Apple"],                             350, 12),
    (["Bread (2 slices)", "Boiled egg", "Milk", "Tea"],     440, 24),
    (["Upma", "Curd", "Banana", "Tea"],                     450, 14),
    (["Paratha", "Boiled egg", "Tea", "Apple"],             510, 22),
    (["Moong dal chilla", "Tea", "Banana"],                 380, 19),
    (["Idli (2 pcs)", "Curd", "Tea", "Apple"],              390, 13),
    (["Poha", "Boiled egg", "Tea", "Banana"],               400, 18),
    (["Bread (2 slices)", "Curd", "Tea"],                   360, 12),
]

LUNCH_OPTIONS = [
    (["Rice", "Dal fry", "Aloo sabzi", "Buttermilk", "Roti"],         690, 25),
    (["Rice", "Rajma", "Mixed veg", "Curd", "Roti"],                  720, 28),
    (["Rice", "Sambar", "Paneer sabzi", "Buttermilk", "Roti"],        700, 30),
    (["Khichdi", "Curd", "Aloo sabzi", "Roti"],                       660, 24),
    (["Rice", "Chole", "Mixed veg", "Buttermilk", "Roti"],            730, 27),
    (["Rice", "Dal fry", "Palak paneer", "Curd", "Roti"],             740, 32),
    (["Rice", "Rajma", "Sabzi (seasonal)", "Buttermilk", "Roti"],     710, 26),
    (["Rice", "Egg curry", "Mixed veg", "Curd", "Roti"],              700, 35),
    (["Rice", "Chicken curry", "Dal fry", "Buttermilk", "Roti"],      780, 40),
    (["Rice", "Sambar", "Aloo sabzi", "Curd", "Roti"],                670, 22),
    (["Khichdi", "Rajma", "Buttermilk", "Roti"],                      650, 26),
    (["Rice", "Chole", "Paneer sabzi", "Curd", "Roti"],               760, 33),
    (["Rice", "Dal fry", "Sabzi (seasonal)", "Curd", "Roti"],         680, 24),
    (["Rice", "Palak paneer", "Sambar", "Buttermilk", "Roti"],        720, 29),
]

SNACKS_OPTIONS = [
    (["Tea", "Biscuits"],               210, 4),
    (["Tea", "Namkeen"],                200, 5),
    (["Milk", "Biscuits"],              350, 11),
    (["Tea", "Halwa"],                  320, 5),
    (["Tea", "Namkeen"],                200, 5),
    (["Milk", "Biscuits"],              350, 11),
    (["Tea", "Biscuits"],               210, 4),
    (["Buttermilk", "Namkeen"],         200, 6),
    (["Milk", "Banana"],                240, 9),
    (["Tea", "Halwa"],                  320, 5),
    (["Milk", "Biscuits", "Banana"],    440, 13),
    (["Tea", "Namkeen", "Apple"],       280, 6),
]

DINNER_OPTIONS = [
    (["Roti", "Dal fry", "Aloo sabzi", "Rice", "Curd"],               650, 23),
    (["Roti", "Paneer sabzi", "Sambar", "Rice", "Buttermilk"],        700, 30),
    (["Roti", "Egg curry", "Mixed veg", "Rice", "Curd"],              660, 33),
    (["Roti", "Chole", "Sabzi (seasonal)", "Rice", "Buttermilk"],     720, 27),
    (["Roti", "Chicken curry", "Dal fry", "Rice", "Curd"],            780, 42),
    (["Roti", "Palak paneer", "Aloo sabzi", "Rice", "Buttermilk"],    710, 28),
    (["Roti", "Rajma", "Mixed veg", "Rice", "Curd"],                  690, 27),
    (["Roti", "Dal fry", "Paneer sabzi", "Rice", "Curd"],             730, 32),
    (["Roti", "Sambar", "Aloo sabzi", "Rice", "Buttermilk"],          640, 22),
    (["Roti", "Egg curry", "Palak paneer", "Rice", "Curd"],           700, 36),
    (["Roti", "Chicken curry", "Mixed veg", "Rice", "Buttermilk"],    760, 40),
    (["Roti", "Chole", "Dal fry", "Rice", "Curd"],                    700, 28),
    (["Roti", "Rajma", "Sabzi (seasonal)", "Rice", "Buttermilk"],     670, 25),
    (["Roti", "Khichdi", "Mixed veg", "Curd"],                        640, 24),
]

MEAL_POOLS = {
    "breakfast": BREAKFAST_OPTIONS,
    "lunch":     LUNCH_OPTIONS,
    "snacks":    SNACKS_OPTIONS,
    "dinner":    DINNER_OPTIONS,
}

# ── Hostel initiatives: large pool, each hostel picks unique subset ───────────

INITIATIVE_POOL = [
    {
        "title": "Morning Fitness Challenge",
        "description": "Students log at least 30 minutes of morning activity 5 days a week. Top 3 performers each week receive recognition.",
        "goal_type": "activity", "target_value": 30.0,
        "offset_start": -7,  "offset_end": 23,
    },
    {
        "title": "Sleep Hygiene Drive",
        "description": "Campaign to achieve average 7+ hrs sleep. Lights-off at 11:30 pm in common areas. Weekly hostel-level progress shared.",
        "goal_type": "sleep", "target_value": 7.0,
        "offset_start": -14, "offset_end": 16,
    },
    {
        "title": "Stress Awareness Week",
        "description": "Mental wellness initiative with campus yoga, counseling drop-ins, and mood check-in challenges during exam prep.",
        "goal_type": "mood", "target_value": 3.5,
        "offset_start": -30, "offset_end": -23,
    },
    {
        "title": "Hydration & Nutrition Month",
        "description": "Focus on logging all 3 main meals and drinking adequate water. Mess manager informed for improved variety.",
        "goal_type": "nutrition", "target_value": 1800.0,
        "offset_start": -45, "offset_end": -16,
    },
    {
        "title": "Step Count Challenge",
        "description": "Encourage 8,000+ steps daily using any tracker. Group walks organized every Tuesday and Thursday evening.",
        "goal_type": "activity", "target_value": 45.0,
        "offset_start": -3,  "offset_end": 27,
    },
    {
        "title": "AQI-Safe Indoor Fitness Week",
        "description": "During elevated AQI period, hostel organizes indoor workout sessions — HIIT, jump rope, and bodyweight circuits.",
        "goal_type": "activity", "target_value": 25.0,
        "offset_start": -55, "offset_end": -44,
    },
    {
        "title": "Mood Check-in Streak",
        "description": "Students earn points for logging mood every day for a week. Aim: early detection of stress before exam season.",
        "goal_type": "mood", "target_value": 3.0,
        "offset_start": -10, "offset_end": 20,
    },
    {
        "title": "Protein Intake Campaign",
        "description": "Awareness on protein intake goals for students — targeting 60g daily. Mess manager provided with feedback.",
        "goal_type": "nutrition", "target_value": 60.0,
        "offset_start": -20, "offset_end": 10,
    },
    {
        "title": "Early Sleep Experiment",
        "description": "Two-week challenge: sleep by 11 pm and wake by 6:30 am. Participants track sleep quality and share results.",
        "goal_type": "sleep", "target_value": 7.5,
        "offset_start": -5,  "offset_end": 9,
    },
    {
        "title": "Post-Exam Recovery Drive",
        "description": "After end-sem exams, structured recovery plan: outdoor walks, nutrition logging, and peer wellness check-ins.",
        "goal_type": "activity", "target_value": 30.0,
        "offset_start": -14, "offset_end": 7,
    },
    {
        "title": "Weekend Sports Tournament",
        "description": "Inter-floor badminton and cricket matches every weekend for 3 weeks. Open to all fitness levels.",
        "goal_type": "activity", "target_value": 60.0,
        "offset_start": -2,  "offset_end": 19,
    },
    {
        "title": "Exam Nutrition Support",
        "description": "Healthy snack boxes distributed during exam week. Mess provides lighter, high-protein evening meal options.",
        "goal_type": "nutrition", "target_value": 1600.0,
        "offset_start": -33, "offset_end": -23,
    },
]


def sim_day_today(branch: str, hostel_name: str, year: int) -> dict:
    """Simulate today's data for a student using the same dynamic model as seed_data."""
    bias = HOSTEL_BIASES.get(hostel_name, {})
    dow  = date.today().weekday()

    mood_base = random.gauss(3.3, 0.65)
    if branch in ["CSE", "ECE"]:
        mood_base -= 0.15
    mood = (mood_base + bias.get("mood", 0) + DOW_MOOD[dow] + random.gauss(0, 0.35))
    mood_score   = max(1, min(5, round(mood, 1)))
    stress_level = max(1, min(5, round(5 - mood_score + random.gauss(0, 0.35))))
    energy_level = max(1, min(5, round(mood_score * 0.75 + random.gauss(0.3, 0.4))))

    sleep_base = random.gauss(6.8, 0.9) - (year - 1) * 0.12
    sleep_hrs  = round(max(4.0, min(10.0,
        sleep_base + bias.get("sleep", 0) + DOW_SLEEP[dow] + random.gauss(0, 0.5)
    )), 1)

    activity_prob = random.uniform(0.4, 0.90) + bias.get("activity", 0) * 0.3
    if random.random() < activity_prob:
        activity_min  = round(max(10, min(95, random.gauss(48, 16))), 1)
        calories_burned = round(activity_min * random.uniform(6, 9), 1)
        location = "outdoor" if random.random() > 0.45 else "indoor"
    else:
        activity_min = 0.0
        calories_burned = 0.0
        location = "indoor"

    cal_ratio     = random.gauss(0.89, 0.12)
    total_calories = 2000 * max(0.4, cal_ratio)
    is_night_owl  = random.random() < 0.40
    aqi           = random.randint(60, 120)
    env_stress    = min(100.0, max(0.0, (aqi - 50) / 2.5))
    activity_s    = min(100.0, (activity_min / 45.0) * 100.0)
    nutrition_s   = min(100.0, max(0.0, 100.0 - abs(1.0 - cal_ratio) * 75.0))
    mood_dev      = min(100.0, abs(mood_score - 3.0) * 18.0)
    wellness      = round(max(0.0, min(100.0,
        activity_s * 0.35 + nutrition_s * 0.30
        - env_stress * 0.15 - mood_dev * 0.20
    )), 2)

    meals = []
    for mt in MEAL_TYPES:
        skip = 0.40 if (mt == "breakfast" and is_night_owl) else 0.18
        if random.random() > skip:
            pf = random.gauss(1.0, 0.22)
            meals.append({
                "meal_type":         mt,
                "total_calories":    round(total_calories / 4 * pf, 1),
                "total_protein":     round(total_calories * 0.15 / 16 * random.gauss(1, 0.15), 1),
                "total_carbs":       round(total_calories * 0.55 / 16 * random.gauss(1, 0.12), 1),
                "total_fat":         round(total_calories * 0.30 / 36 * random.gauss(1, 0.18), 1),
                "total_fibre":       round(max(1, random.gauss(3.2, 1.0)), 1),
                "meal_rating":       max(1, min(5, round(mood_score - random.uniform(0, 1.2) + 0.8 + random.gauss(0, 0.3)))),
                "meal_feedback_tag": random.choice(FEEDBACK_TAGS),
            })

    return {
        "activity_min": activity_min, "activity_type": random.choice(ACTIVITY_TYPES),
        "intensity":    random.choice(INTENSITIES),
        "location":     location, "calories_burned": calories_burned,
        "sleep_hrs":    sleep_hrs, "mood": mood_score,
        "stress":       stress_level, "energy": energy_level,
        "wellness":     wellness, "activity_s": round(activity_s, 2),
        "nutrition_s":  round(nutrition_s, 2), "env_stress": round(env_stress, 2),
        "meals":        meals,
    }


def pick_weekly_menu(week_offset: int, rng_seed: int) -> dict[str, list]:
    """Pick a non-repeating menu for a given week using a seeded RNG."""
    rng = random.Random(rng_seed + week_offset * 37)
    menu = {}
    for dow in range(7):
        menu[dow] = {}
        for meal_type, pool in MEAL_POOLS.items():
            # Rotate through pool based on week, vary by day
            idx = (week_offset * 3 + dow * 2 + hash(meal_type)) % len(pool)
            items, cal, pro = pool[idx]
            cal_var = cal * rng.uniform(0.93, 1.07)
            pro_var = pro * rng.uniform(0.90, 1.10)
            menu[dow][meal_type] = (items, round(cal_var, 1), round(pro_var, 1))
    return menu


BATCH = 2000


async def run():
    conn = await asyncpg.connect(DATABASE_URL)
    today = date.today()

    # ── Today's data for all students ─────────────────────────────────────────
    print("Fetching students...")
    students = await conn.fetch(
        """SELECT u.id, u.branch, u.academic_year, h.name as hostel_name
           FROM users u JOIN hostels h ON h.id = u.hostel_id
           WHERE u.role='student'"""
    )
    print(f"  {len(students)} students")

    wl_rows, al_rows, nl_rows, sl_rows, ml_rows = [], [], [], [], []
    skipped = 0

    for stu in students:
        uid = stu["id"]
        if await conn.fetchval("SELECT id FROM wellness_logs WHERE user_id=$1 AND date=$2", uid, today):
            skipped += 1
            continue

        d   = sim_day_today(stu["branch"], stu["hostel_name"], stu["academic_year"])
        dow = today.weekday()

        wl_rows.append((uid, today, d["wellness"], d["activity_s"],
                        d["nutrition_s"], d["mood"], d["env_stress"], d["sleep_hrs"]))

        if d["activity_min"] > 0:
            al_rows.append((uid, today, d["activity_type"], int(d["activity_min"]),
                            d["intensity"], d["calories_burned"], d["location"]))

        for m in d["meals"]:
            nl_rows.append((uid, today, m["meal_type"], None,
                            m["total_calories"], m["total_protein"],
                            m["total_carbs"], m["total_fat"], m["total_fibre"],
                            m["meal_rating"], m["meal_feedback_tag"]))

        bedtime  = time(22 if dow >= 4 else 23, random.randint(0, 59))
        waketime = time(7  if dow >= 4 else 6,  random.randint(0, 59))
        sl_rows.append((uid, today, bedtime, waketime,
                        d["sleep_hrs"], random.randint(2, 5), random.randint(0, 2)))

        ml_rows.append((uid, today, random.choice(["morning", "evening", "night"]),
                        "neutral", int(d["mood"]), int(d["energy"]), int(d["stress"])))

    print(f"  Skipped {skipped} (already have today's data), inserting {len(wl_rows)}...")

    for i in range(0, len(wl_rows), BATCH):
        await conn.executemany(
            """INSERT INTO wellness_logs(user_id, date, wellness_score, activity_score,
               nutrition_score, mood_score, env_stress_score, sleep_hours)
               VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING""",
            wl_rows[i:i+BATCH]
        )
    for i in range(0, len(al_rows), BATCH):
        await conn.executemany(
            "INSERT INTO activity_logs(user_id, date, activity_type, duration_minutes, intensity, calories_burned, location) VALUES($1,$2,$3,$4,$5,$6,$7)",
            al_rows[i:i+BATCH]
        )
    for i in range(0, len(nl_rows), BATCH):
        await conn.executemany(
            "INSERT INTO nutrition_logs(user_id, date, meal_type, food_items, total_calories, total_protein, total_carbs, total_fat, total_fibre, meal_rating, meal_feedback_tag) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
            nl_rows[i:i+BATCH]
        )
    for i in range(0, len(sl_rows), BATCH):
        await conn.executemany(
            "INSERT INTO sleep_logs(user_id, date, sleep_time, wake_time, sleep_hours, sleep_quality, disruptions) VALUES($1,$2,$3,$4,$5,$6,$7)",
            sl_rows[i:i+BATCH]
        )
    for i in range(0, len(ml_rows), BATCH):
        await conn.executemany(
            "INSERT INTO mood_logs(user_id, date, time_of_day, mood_emoji, mood_score, energy_level, stress_level) VALUES($1,$2,$3,$4,$5,$6,$7)",
            ml_rows[i:i+BATCH]
        )
    print(f"  Today's data inserted.")

    # ── Hostel initiatives: each hostel gets a unique 4-initiative mix ────────
    print("\nSeeding hostel initiatives...")
    await conn.execute("DELETE FROM hostel_initiatives")
    hostels = await conn.fetch("SELECT id, name, warden_id FROM hostels ORDER BY name")
    init_rows = []

    pool_copy = INITIATIVE_POOL[:]
    for h in hostels:
        if not h["warden_id"]:
            continue
        # Each hostel draws 4 initiatives uniquely (rotate pool)
        random.shuffle(pool_copy)
        chosen = pool_copy[:4]
        for ini in chosen:
            init_rows.append((
                h["id"], h["warden_id"], ini["title"], ini["description"],
                ini["goal_type"], ini["target_value"],
                today + timedelta(days=ini["offset_start"]),
                today + timedelta(days=ini["offset_end"]),
            ))

    await conn.executemany(
        """INSERT INTO hostel_initiatives(hostel_id, created_by, title, description,
           goal_type, target_value, start_date, end_date)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8)""",
        init_rows
    )
    print(f"  {len(init_rows)} initiatives across {len(hostels)} hostels (unique per hostel)")

    # ── Mess menu: genuine weekly variation, each week different ──────────────
    print("\nSeeding mess menu...")
    await conn.execute("DELETE FROM mess_menu")

    current_week = today.isocalendar()[1]
    rng_seed     = current_week * 13  # deterministic but varies by real week

    menu_rows = []
    for week_offset in range(-3, 2):  # 3 past + current + 1 upcoming
        week_num     = current_week + week_offset
        if week_num < 1: week_num += 52
        weekly_plan  = pick_weekly_menu(week_offset, rng_seed)
        is_published = week_offset < 1

        for dow in range(7):
            for meal_type in MEAL_TYPES:
                items, cal, pro = weekly_plan[dow][meal_type]
                menu_rows.append((
                    week_num, dow, meal_type,
                    json.dumps([{"name": item} for item in items]),
                    cal, pro, is_published,
                ))

    await conn.executemany(
        """INSERT INTO mess_menu(week_number, day_of_week, meal_type, food_items,
           estimated_calories, estimated_protein, is_published)
           VALUES($1,$2,$3,$4,$5,$6,$7)""",
        menu_rows
    )
    print(f"  {len(menu_rows)} menu slots (5 weeks, varied per week)")

    # ── Verify ────────────────────────────────────────────────────────────────
    wl_today = await conn.fetchval("SELECT COUNT(*) FROM wellness_logs WHERE date=$1", today)
    inits    = await conn.fetchval("SELECT COUNT(*) FROM hostel_initiatives")
    menus    = await conn.fetchval("SELECT COUNT(*) FROM mess_menu WHERE is_published=TRUE")

    print(f"\nVerification:")
    print(f"  Wellness logs today: {wl_today}")
    print(f"  Hostel initiatives:  {inits}")
    print(f"  Published menu slots:{menus}")

    await conn.close()
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(run())
