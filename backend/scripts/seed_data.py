"""
UniVitals Seed Script — dynamic simulation
Run from backend/ directory:  python -m scripts.seed_data
"""

import asyncio
import json
import math
import random
import sys
import os
from datetime import date, timedelta, datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import asyncpg
import bcrypt as _bcrypt
from app.privacy import encrypt_journal


class _BcryptCompat:
    @staticmethod
    def hash(secret: str) -> str:
        return _bcrypt.hashpw(secret.encode(), _bcrypt.gensalt()).decode()


bcrypt = _BcryptCompat()
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DATABASE_URL = os.environ["DATABASE_URL"]

NUM_STUDENTS = 1000
NUM_HOSTELS = 10
STUDENTS_PER_HOSTEL = 100
DAYS_OF_DATA = 90
BASE_DATE = date.today() - timedelta(days=DAYS_OF_DATA - 1)

EXAM_DAYS = list(range(30, 37)) + list(range(70, 77))
AQI_SPIKE_DAYS = list(range(45, 56))

HOSTELS = [
    {"name": "BH-1", "type": "boys"},
    {"name": "BH-2", "type": "boys"},
    {"name": "BH-3", "type": "boys"},
    {"name": "BH-4", "type": "boys"},
    {"name": "BH-5", "type": "boys"},
    {"name": "GH-1", "type": "girls"},
    {"name": "GH-2", "type": "girls"},
    {"name": "GH-3", "type": "girls"},
    {"name": "GH-4", "type": "girls"},
    {"name": "GH-5", "type": "girls"},
]

# Each hostel has distinct character — makes comparison charts meaningful
HOSTEL_BIASES = {
    "BH-1": {"mood": 0.25, "sleep": 0.30, "activity": 0.20, "calorie": 0.05},
    "BH-2": {"mood": -0.15, "sleep": -0.25, "activity": -0.10, "calorie": -0.05},
    "BH-3": {"mood": 0.10, "sleep": 0.05, "activity": 0.35, "calorie": 0.08},
    "BH-4": {"mood": -0.30, "sleep": -0.10, "activity": 0.05, "calorie": -0.08},
    "BH-5": {"mood": 0.05, "sleep": 0.15, "activity": -0.05, "calorie": 0.03},
    "GH-1": {"mood": 0.20, "sleep": 0.40, "activity": 0.10, "calorie": 0.10},
    "GH-2": {"mood": 0.35, "sleep": 0.20, "activity": 0.25, "calorie": 0.12},
    "GH-3": {"mood": -0.10, "sleep": -0.30, "activity": -0.15, "calorie": -0.10},
    "GH-4": {"mood": 0.15, "sleep": 0.10, "activity": 0.15, "calorie": 0.06},
    "GH-5": {"mood": -0.20, "sleep": -0.15, "activity": -0.20, "calorie": -0.06},
}

# Day-of-week effects  (0=Mon … 6=Sun)
DOW_MOOD = [-0.25, -0.05, 0.05, 0.10, 0.25, 0.45, 0.35]
DOW_SLEEP = [-0.30, -0.10, 0.00, 0.10, 0.20, 0.75, 0.60]
DOW_ACT = [-0.10, 0.00, 0.05, 0.05, 0.15, 0.25, 0.20]  # weekend bonus

BRANCHES = ["CSE", "ECE", "ME", "CE", "EE", "Textile", "Chemical", "Mathematics"]
YEARS = [1, 2, 3, 4]
ACTIVITY_TYPES = ["running", "gym", "sports", "yoga", "cycling", "walking", "swimming"]
MEAL_TYPES = ["breakfast", "lunch", "snacks", "dinner"]
FEEDBACK_TAGS = ["tasty", "cold", "no_variety", "undercooked", "bland"]
INTENSITIES = ["low", "moderate", "high"]

FOOD_ITEMS = [
    {
        "name": "Dal fry",
        "cat": "dal",
        "cal": 180,
        "pro": 9,
        "carb": 28,
        "fat": 4,
        "fibre": 6,
        "veg": True,
        "allergens": [],
    },
    {
        "name": "Roti",
        "cat": "staple",
        "cal": 70,
        "pro": 3,
        "carb": 15,
        "fat": 0.5,
        "fibre": 2,
        "veg": True,
        "allergens": ["gluten"],
    },
    {
        "name": "Rice",
        "cat": "staple",
        "cal": 130,
        "pro": 2.7,
        "carb": 28,
        "fat": 0.3,
        "fibre": 0.4,
        "veg": True,
        "allergens": [],
    },
    {
        "name": "Paneer sabzi",
        "cat": "vegetable",
        "cal": 220,
        "pro": 14,
        "carb": 8,
        "fat": 16,
        "fibre": 2,
        "veg": True,
        "allergens": ["dairy"],
    },
    {
        "name": "Aloo sabzi",
        "cat": "vegetable",
        "cal": 150,
        "pro": 3,
        "carb": 25,
        "fat": 5,
        "fibre": 3,
        "veg": True,
        "allergens": [],
    },
    {
        "name": "Rajma",
        "cat": "dal",
        "cal": 200,
        "pro": 12,
        "carb": 30,
        "fat": 4,
        "fibre": 8,
        "veg": True,
        "allergens": [],
    },
    {
        "name": "Chole",
        "cat": "dal",
        "cal": 210,
        "pro": 11,
        "carb": 32,
        "fat": 5,
        "fibre": 9,
        "veg": True,
        "allergens": [],
    },
    {
        "name": "Mixed veg",
        "cat": "vegetable",
        "cal": 120,
        "pro": 3,
        "carb": 18,
        "fat": 4,
        "fibre": 5,
        "veg": True,
        "allergens": [],
    },
    {
        "name": "Palak paneer",
        "cat": "vegetable",
        "cal": 240,
        "pro": 15,
        "carb": 9,
        "fat": 17,
        "fibre": 3,
        "veg": True,
        "allergens": ["dairy"],
    },
    {
        "name": "Egg curry",
        "cat": "non-veg",
        "cal": 180,
        "pro": 13,
        "carb": 5,
        "fat": 12,
        "fibre": 1,
        "veg": False,
        "allergens": ["eggs"],
    },
    {
        "name": "Chicken curry",
        "cat": "non-veg",
        "cal": 250,
        "pro": 22,
        "carb": 6,
        "fat": 15,
        "fibre": 1,
        "veg": False,
        "allergens": [],
    },
    {
        "name": "Sambar",
        "cat": "dal",
        "cal": 90,
        "pro": 5,
        "carb": 14,
        "fat": 2,
        "fibre": 4,
        "veg": True,
        "allergens": [],
    },
    {
        "name": "Idli (2 pcs)",
        "cat": "staple",
        "cal": 140,
        "pro": 4,
        "carb": 28,
        "fat": 1,
        "fibre": 2,
        "veg": True,
        "allergens": [],
    },
    {
        "name": "Poha",
        "cat": "staple",
        "cal": 180,
        "pro": 3,
        "carb": 35,
        "fat": 4,
        "fibre": 2,
        "veg": True,
        "allergens": [],
    },
    {
        "name": "Upma",
        "cat": "staple",
        "cal": 190,
        "pro": 4,
        "carb": 32,
        "fat": 6,
        "fibre": 3,
        "veg": True,
        "allergens": ["gluten"],
    },
    {
        "name": "Curd",
        "cat": "dairy",
        "cal": 100,
        "pro": 8,
        "carb": 6,
        "fat": 4,
        "fibre": 0,
        "veg": True,
        "allergens": ["dairy"],
    },
    {
        "name": "Buttermilk",
        "cat": "dairy",
        "cal": 40,
        "pro": 2,
        "carb": 4,
        "fat": 1,
        "fibre": 0,
        "veg": True,
        "allergens": ["dairy"],
    },
    {
        "name": "Banana",
        "cat": "fruit",
        "cal": 90,
        "pro": 1,
        "carb": 23,
        "fat": 0.3,
        "fibre": 2.6,
        "veg": True,
        "allergens": [],
    },
    {
        "name": "Apple",
        "cat": "fruit",
        "cal": 80,
        "pro": 0.4,
        "carb": 21,
        "fat": 0.2,
        "fibre": 3.5,
        "veg": True,
        "allergens": [],
    },
    {
        "name": "Boiled egg",
        "cat": "non-veg",
        "cal": 78,
        "pro": 6,
        "carb": 0.6,
        "fat": 5,
        "fibre": 0,
        "veg": False,
        "allergens": ["eggs"],
    },
    {
        "name": "Tea",
        "cat": "beverage",
        "cal": 40,
        "pro": 1,
        "carb": 6,
        "fat": 1,
        "fibre": 0,
        "veg": True,
        "allergens": ["dairy"],
    },
    {
        "name": "Milk",
        "cat": "dairy",
        "cal": 150,
        "pro": 8,
        "carb": 12,
        "fat": 8,
        "fibre": 0,
        "veg": True,
        "allergens": ["dairy"],
    },
    {
        "name": "Bread (2 slices)",
        "cat": "staple",
        "cal": 140,
        "pro": 5,
        "carb": 26,
        "fat": 2,
        "fibre": 2,
        "veg": True,
        "allergens": ["gluten"],
    },
    {
        "name": "Sabzi (seasonal)",
        "cat": "vegetable",
        "cal": 100,
        "pro": 2.5,
        "carb": 15,
        "fat": 3.5,
        "fibre": 4,
        "veg": True,
        "allergens": [],
    },
    {
        "name": "Khichdi",
        "cat": "staple",
        "cal": 200,
        "pro": 7,
        "carb": 35,
        "fat": 5,
        "fibre": 3,
        "veg": True,
        "allergens": [],
    },
    {
        "name": "Paratha",
        "cat": "staple",
        "cal": 180,
        "pro": 4,
        "carb": 28,
        "fat": 7,
        "fibre": 2,
        "veg": True,
        "allergens": ["gluten", "dairy"],
    },
    {
        "name": "Halwa",
        "cat": "snack",
        "cal": 280,
        "pro": 3,
        "carb": 42,
        "fat": 12,
        "fibre": 1,
        "veg": True,
        "allergens": ["dairy", "gluten"],
    },
    {
        "name": "Biscuits",
        "cat": "snack",
        "cal": 200,
        "pro": 3,
        "carb": 30,
        "fat": 8,
        "fibre": 1,
        "veg": True,
        "allergens": ["gluten", "dairy"],
    },
    {
        "name": "Namkeen",
        "cat": "snack",
        "cal": 160,
        "pro": 4,
        "carb": 18,
        "fat": 9,
        "fibre": 2,
        "veg": True,
        "allergens": ["gluten"],
    },
    {
        "name": "Moong dal chilla",
        "cat": "staple",
        "cal": 160,
        "pro": 10,
        "carb": 22,
        "fat": 4,
        "fibre": 5,
        "veg": True,
        "allergens": [],
    },
]

ADMIN_ACCOUNTS = [
    {
        "name": "Warden BH-1",
        "email": "warden.bh1@iitd.ac.in",
        "role": "warden",
        "hostel": "BH-1",
    },
    {
        "name": "Warden BH-2",
        "email": "warden.bh2@iitd.ac.in",
        "role": "warden",
        "hostel": "BH-2",
    },
    {
        "name": "Warden BH-3",
        "email": "warden.bh3@iitd.ac.in",
        "role": "warden",
        "hostel": "BH-3",
    },
    {
        "name": "Warden BH-4",
        "email": "warden.bh4@iitd.ac.in",
        "role": "warden",
        "hostel": "BH-4",
    },
    {
        "name": "Warden BH-5",
        "email": "warden.bh5@iitd.ac.in",
        "role": "warden",
        "hostel": "BH-5",
    },
    {
        "name": "Warden GH-1",
        "email": "warden.gh1@iitd.ac.in",
        "role": "warden",
        "hostel": "GH-1",
    },
    {
        "name": "Warden GH-2",
        "email": "warden.gh2@iitd.ac.in",
        "role": "warden",
        "hostel": "GH-2",
    },
    {
        "name": "Warden GH-3",
        "email": "warden.gh3@iitd.ac.in",
        "role": "warden",
        "hostel": "GH-3",
    },
    {
        "name": "Warden GH-4",
        "email": "warden.gh4@iitd.ac.in",
        "role": "warden",
        "hostel": "GH-4",
    },
    {
        "name": "Warden GH-5",
        "email": "warden.gh5@iitd.ac.in",
        "role": "warden",
        "hostel": "GH-5",
    },
    {
        "name": "Mess Manager",
        "email": "mess@iitd.ac.in",
        "role": "mess_manager",
        "hostel": None,
    },
    {
        "name": "Dean of Students",
        "email": "dean@iitd.ac.in",
        "role": "dean",
        "hostel": None,
    },
]


def generate_aqi(day_index: int) -> int:
    """Smooth AQI with spikes and gradual seasonal drift."""
    if day_index in AQI_SPIKE_DAYS:
        base = random.randint(160, 260)
        # Within spike, AQI rises then falls
        spike_pos = day_index - 45
        envelope = math.sin(spike_pos / 10 * math.pi)
        return int(base * max(0.6, envelope))
    # Gentle sinusoidal seasonal trend + noise
    seasonal = 80 + 30 * math.sin(day_index / 45 * math.pi)
    noise = random.gauss(0, 18)
    return max(30, min(160, int(seasonal + noise)))


def get_aqi_category(aqi: int) -> str:
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Satisfactory"
    if aqi <= 200:
        return "Moderate"
    if aqi <= 300:
        return "Poor"
    if aqi <= 400:
        return "Very Poor"
    return "Severe"


def make_student_profile(branch: str, year: int) -> dict:
    """Assign a stable personality to each student once."""
    # Senior years sleep less, CSE/ECE students more stressed
    sleep_base = random.gauss(7.1, 0.9) - (year - 1) * 0.12
    mood_base = random.gauss(3.3, 0.65)
    if branch in ["CSE", "ECE"]:
        mood_base -= 0.15
        sleep_base -= 0.2
    activity_prob = random.uniform(
        0.35, 0.92
    )  # probability of exercising on a given day
    cal_ratio = random.gauss(0.89, 0.13)  # personal calorie adherence tendency
    # Night-owl vs early bird (affects whether they skip breakfast)
    is_night_owl = random.random() < 0.40
    return {
        "mood_base": mood_base,
        "sleep_base": sleep_base,
        "activity_prob": activity_prob,
        "cal_ratio": cal_ratio,
        "is_night_owl": is_night_owl,
    }


def simulate_student_day(day_index: int, profile: dict, branch: str, hostel_name: str):
    day_date = BASE_DATE + timedelta(days=day_index)
    dow = day_date.weekday()  # 0=Mon … 6=Sun
    is_exam = day_index in EXAM_DAYS
    is_weekend = dow >= 5

    bias = HOSTEL_BIASES.get(hostel_name, {})

    # ── Semester trajectory: slight sine arc (better mid-sem, dips at exams) ─
    sem_trend = 0.15 * math.sin(day_index / DAYS_OF_DATA * math.pi)

    # ── AQI ──────────────────────────────────────────────────────────────────
    aqi = generate_aqi(day_index)

    # ── Mood ─────────────────────────────────────────────────────────────────
    mood = (
        profile["mood_base"]
        + bias.get("mood", 0)
        + DOW_MOOD[dow]
        + sem_trend
        + random.gauss(0, 0.35)
    )
    if is_exam:
        penalty = 1.6 if branch in ["CSE", "ECE"] else 1.2
        mood -= penalty * random.uniform(0.7, 1.3)
    # Gradual mood recovery after exams
    if 37 <= day_index <= 44 or 77 <= day_index <= 84:
        mood += (day_index % 8) * 0.05
    mood_score = max(1.0, min(5.0, round(mood, 1)))
    stress_level = max(1, min(5, round(5.0 - mood_score + random.gauss(0, 0.35))))
    energy_level = max(1, min(5, round(mood_score * 0.75 + random.gauss(0.3, 0.4))))

    # ── Sleep ─────────────────────────────────────────────────────────────────
    sleep = (
        profile["sleep_base"]
        + bias.get("sleep", 0)
        + DOW_SLEEP[dow]
        + random.gauss(0, 0.55)
    )
    if is_exam:
        sleep -= random.uniform(0.9, 1.8)
    if is_weekend:
        sleep += random.uniform(0.2, 0.6)  # catch-up sleep on weekends
    sleep_hours = round(max(3.5, min(10.5, sleep)), 1)

    # ── Activity ──────────────────────────────────────────────────────────────
    effective_prob = profile["activity_prob"] * (0.60 if is_exam else 1.0)
    effective_prob *= 1.0 + DOW_ACT[dow]
    effective_prob += bias.get("activity", 0) * 0.3
    if random.random() < effective_prob:
        act_base = random.gauss(48, 16)
        if is_exam:
            act_base *= random.uniform(0.50, 0.75)
        if aqi > 200:
            act_base *= random.uniform(0.60, 0.80)
        activity_minutes = round(max(10, min(95, act_base)), 1)
    else:
        activity_minutes = 0.0

    if aqi > 200:
        outdoor_pct = random.uniform(0.05, 0.18)
    elif aqi > 130:
        outdoor_pct = random.uniform(0.20, 0.42)
    elif is_weekend:
        outdoor_pct = random.uniform(0.55, 0.85)
    else:
        outdoor_pct = random.uniform(0.40, 0.75)

    outdoor_min = activity_minutes * outdoor_pct
    indoor_min = activity_minutes * (1 - outdoor_pct)
    location = "outdoor" if outdoor_min >= indoor_min else "indoor"
    activity_type = random.choice(ACTIVITY_TYPES)

    # Vary cal_ratio by day — personal habit + day context
    cal_ratio = (
        profile["cal_ratio"]
        + bias.get("calorie", 0)
        + random.gauss(0, 0.10)
        + (0.05 if is_weekend else 0)
    )
    if is_exam:
        cal_ratio *= random.uniform(0.78, 0.93)
    cal_ratio = max(0.35, cal_ratio)
    total_calories = 2000 * cal_ratio
    total_protein = total_calories * random.uniform(0.13, 0.17) / 4
    total_carbs = total_calories * random.uniform(0.50, 0.60) / 4
    total_fat = total_calories * random.uniform(0.28, 0.33) / 9
    total_fibre = max(2, random.gauss(13 if not is_exam else 9, 3.5))

    # ── Scores ────────────────────────────────────────────────────────────────
    activity_score = min(100.0, (activity_minutes / 45.0) * 100.0)
    nutrition_score = max(0.0, min(100.0, 100.0 - abs(1.0 - cal_ratio) * 75.0))
    env_stress_score = min(100.0, max(0.0, (aqi - 50) / 2.5))
    mood_deviation = min(100.0, abs(mood_score - 3.0) * 18.0)
    wellness_score = round(
        max(
            0.0,
            min(
                100.0,
                activity_score * 0.35
                + nutrition_score * 0.30
                - env_stress_score * 0.15
                - mood_deviation * 0.20,
            ),
        ),
        2,
    )

    # ── Meals ─────────────────────────────────────────────────────────────────
    meal_logs = []
    for meal in MEAL_TYPES:
        # Night-owls skip breakfast more; exams make everyone skip more
        skip = 0.18
        if meal == "breakfast":
            skip = 0.40 if profile["is_night_owl"] else 0.22
        if is_exam:
            skip += random.uniform(0.05, 0.15)
        if is_weekend and meal == "breakfast":
            skip += 0.08  # brunch culture on weekends
        if random.random() > skip:
            # Meal portion varies independently from total (some meals bigger)
            portion_factor = random.gauss(1.0, 0.22)
            meal_cal = round(total_calories / 4 * portion_factor, 1)
            # Rating correlates with mood but has its own noise
            base_rating = mood_score - random.uniform(0, 1.2) + 0.8
            rating = max(1, min(5, round(base_rating + random.gauss(0, 0.4))))
            meal_logs.append(
                {
                    "meal_type": meal,
                    "total_calories": meal_cal,
                    "total_protein": round(
                        total_protein / 4 * random.gauss(1.0, 0.15), 1
                    ),
                    "total_carbs": round(total_carbs / 4 * random.gauss(1.0, 0.12), 1),
                    "total_fat": round(total_fat / 4 * random.gauss(1.0, 0.18), 1),
                    "total_fibre": round(total_fibre / 4 * random.gauss(1.0, 0.20), 1),
                    "meal_rating": rating,
                    "meal_feedback_tag": random.choice(FEEDBACK_TAGS),
                }
            )

    return {
        "activity_minutes": activity_minutes,
        "activity_type": activity_type,
        "location": location,
        "outdoor_min": outdoor_min,
        "indoor_min": indoor_min,
        "total_calories": round(total_calories, 1),
        "total_protein": round(total_protein, 1),
        "total_carbs": round(total_carbs, 1),
        "total_fat": round(total_fat, 1),
        "total_fibre": round(total_fibre, 1),
        "sleep_hours": sleep_hours,
        "mood_score": mood_score,
        "stress_level": stress_level,
        "energy_level": energy_level,
        "aqi": aqi,
        "wellness_score": wellness_score,
        "activity_score": round(activity_score, 2),
        "nutrition_score": round(nutrition_score, 2),
        "env_stress_score": round(env_stress_score, 2),
        "meal_logs": meal_logs,
    }


def generate_alerts(hostel_id: int, hostel_name: str, hostel_daily: list) -> list:
    alerts = []
    WINDOW = 5
    seen = set()
    bias = HOSTEL_BIASES.get(hostel_name, {})

    for day in range(WINDOW, DAYS_OF_DATA):
        window = hostel_daily[day - WINDOW : day]
        triggered_at = BASE_DATE + timedelta(days=day)

        avg_sleep = sum(d["avg_sleep"] for d in window) / WINDOW
        avg_mood = sum(d["avg_mood"] for d in window) / WINDOW
        avg_cal = sum(d["avg_calories"] for d in window) / WINDOW
        avg_act_p = sum(d["activity_pct"] for d in window) / WINDOW
        avg_stress = sum(d["high_stress_pct"] for d in window) / WINDOW
        aqi_today = hostel_daily[day]["avg_aqi"]

        def add(alert_type, severity, title, desc, metric, threshold):
            key = (hostel_id, alert_type)
            if key not in seen:
                seen.add(key)
                alerts.append(
                    {
                        "hostel_id": hostel_id,
                        "alert_type": alert_type,
                        "severity": severity,
                        "title": title,
                        "description": desc,
                        "metric_value": metric,
                        "threshold_value": threshold,
                        "triggered_at": triggered_at,
                        "is_active": True,
                    }
                )

        # Thresholds slightly vary by hostel character so not all fire together
        sleep_threshold = 6.5 + bias.get("sleep", 0) * 0.1
        mood_threshold = 2.5 - bias.get("mood", 0) * 0.05

        if avg_sleep < sleep_threshold:
            add(
                "sleep_deficit",
                "warning",
                "Sleep deficit persisting",
                f"Average sleep {avg_sleep:.1f} hrs over {WINDOW} days (threshold: {sleep_threshold:.1f} hrs)",
                avg_sleep,
                sleep_threshold,
            )

        if avg_mood < mood_threshold:
            add(
                "mood_crisis",
                "critical",
                "Sustained low mood detected",
                f"Avg mood below {mood_threshold:.1f} for {WINDOW} consecutive days",
                avg_mood,
                mood_threshold,
            )

        if avg_act_p < 0.38:
            add(
                "activity_drought",
                "warning",
                "Activity participation has dropped",
                f"Only {avg_act_p * 100:.0f}% of hostel logged activity in past {WINDOW} days",
                avg_act_p * 100,
                38,
            )

        if avg_cal < 1550:
            add(
                "nutrition_gap",
                "info",
                "Students may be undereating",
                f"Average calorie intake {avg_cal:.0f} kcal — below 1,550 kcal threshold",
                avg_cal,
                1550,
            )

        if avg_stress > 0.48:
            add(
                "high_stress",
                "warning",
                "Elevated stress levels reported",
                f"{avg_stress * 100:.0f}% of check-ins rated high stress this week",
                avg_stress * 100,
                48,
            )

        if aqi_today > 150:
            add(
                "environmental",
                "info",
                "Outdoor activity not recommended today",
                f"AQI is {aqi_today} (Moderate–Poor). Advise students to exercise indoors.",
                aqi_today,
                150,
            )

    return alerts


async def run_seed():
    print("Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)

    print("Clearing existing data...")
    await conn.execute("""
        TRUNCATE TABLE
            admin_alerts, hostel_initiatives, academic_events,
            mess_menu, mess_feedback_aggregate, wellness_nudges,
            journal_entries, sleep_logs, mood_logs, nutrition_logs,
            activity_logs, wellness_logs, food_items,
            environmental_snapshots
        RESTART IDENTITY CASCADE
    """)

    await conn.execute("ALTER TABLE hostels DROP CONSTRAINT IF EXISTS fk_warden")
    await conn.execute("DELETE FROM admin_alerts")
    await conn.execute("DELETE FROM hostel_initiatives")
    await conn.execute("DELETE FROM users")
    await conn.execute("DELETE FROM hostels")

    print("Seeding hostels...")
    hostel_ids = {}
    for h in HOSTELS:
        row = await conn.fetchrow(
            "INSERT INTO hostels(name, type) VALUES($1, $2) RETURNING id",
            h["name"],
            h["type"],
        )
        hostel_ids[h["name"]] = row["id"]

    print("Seeding food items...")
    food_item_rows = {}
    for fi in FOOD_ITEMS:
        row = await conn.fetchrow(
            """INSERT INTO food_items(name, category, calories_per_100g, protein_per_100g,
               carbs_per_100g, fat_per_100g, fibre_per_100g, is_veg, allergens)
               VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id""",
            fi["name"],
            fi["cat"],
            float(fi["cal"]),
            float(fi["pro"]),
            float(fi["carb"]),
            float(fi["fat"]),
            float(fi["fibre"]),
            fi["veg"],
            fi["allergens"],
        )
        food_item_rows[fi["name"]] = {"id": str(row["id"]), **fi}

    pw_hash = bcrypt.hash("admin123")

    print("Seeding admin accounts...")
    admin_user_ids = {}
    for acc in ADMIN_ACCOUNTS:
        roll = f"ADMIN-{acc['email'].split('@')[0].upper()}"
        row = await conn.fetchrow(
            """INSERT INTO users(name, roll_number, email, password_hash, role)
               VALUES($1,$2,$3,$4,$5) RETURNING id""",
            acc["name"],
            roll,
            acc["email"],
            pw_hash,
            acc["role"],
        )
        admin_user_ids[acc["email"]] = {"id": str(row["id"]), "hostel": acc["hostel"]}

    for acc in ADMIN_ACCOUNTS:
        if acc["role"] == "warden" and acc["hostel"]:
            uid = admin_user_ids[acc["email"]]["id"]
            hid = hostel_ids[acc["hostel"]]
            await conn.execute("UPDATE hostels SET warden_id=$1 WHERE id=$2", uid, hid)
            await conn.execute("UPDATE users SET hostel_id=$1 WHERE id=$2", hid, uid)

    await conn.execute("""
        ALTER TABLE hostels ADD CONSTRAINT fk_warden
          FOREIGN KEY (warden_id) REFERENCES users(id)
    """)

    print("Seeding 1000 students...")
    student_rows = []
    allergen_pool = [[], [], ["dairy"], ["gluten"], ["eggs"], ["dairy", "gluten"], []]
    for h_idx, hostel in enumerate(HOSTELS):
        hid = hostel_ids[hostel["name"]]
        for s in range(STUDENTS_PER_HOSTEL):
            branch = random.choice(BRANCHES)
            year = random.choice(YEARS)
            roll = f"{2020 + (4 - year)}{branch[:2].upper()}{h_idx * 100 + s + 1:04d}"
            email = f"{roll.lower()}@iitd.ac.in"
            student_rows.append(
                (
                    f"Student {h_idx * 100 + s + 1}",
                    roll,
                    email,
                    pw_hash,
                    hid,
                    branch,
                    year,
                    round(random.gauss(165, 10), 1),
                    round(random.gauss(65, 12), 1),
                    random.choice(["beginner", "intermediate", "advanced"]),
                    random.choice(["vegetarian", "non-vegetarian", "vegan"]),
                    random.choice(allergen_pool),
                    "student",
                )
            )

    await conn.executemany(
        """INSERT INTO users(name, roll_number, email, password_hash, hostel_id,
           branch, academic_year, height_cm, weight_kg, fitness_level,
           dietary_preference, allergens, role)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
           ON CONFLICT DO NOTHING""",
        student_rows,
    )

    test_pw_hash = bcrypt.hash("student123")
    bh3_id = hostel_ids.get("BH-3")
    await conn.execute(
        """INSERT INTO users(name, roll_number, email, password_hash, hostel_id,
              branch, academic_year, height_cm, weight_kg, fitness_level,
              dietary_preference, allergens, role)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
           ON CONFLICT DO NOTHING""",
        "Aditya Kumar",
        "2021EE10492",
        "2021ee10492@iitd.ac.in",
        test_pw_hash,
        bh3_id,
        "EE",
        3,
        172.0,
        68.0,
        "intermediate",
        "non-vegetarian",
        [],
        "student",
    )

    students = await conn.fetch(
        "SELECT id, hostel_id, branch, academic_year FROM users WHERE role='student'"
    )
    print(f"  {len(students)} students")

    hostel_students: dict[int, list] = {}
    for s in students:
        hostel_students.setdefault(s["hostel_id"], []).append(s)

    # ── Assign persistent profiles per student ────────────────────────────────
    profiles = {}
    for hid, stu_list in hostel_students.items():
        for stu in stu_list:
            profiles[str(stu["id"])] = make_student_profile(
                stu["branch"], stu["academic_year"]
            )

    print("Seeding environmental snapshots...")
    env_rows = []
    for day_idx in range(DAYS_OF_DATA):
        aqi = generate_aqi(day_idx)
        cat = get_aqi_category(aqi)
        rec_at = datetime.combine(
            BASE_DATE + timedelta(days=day_idx), datetime.min.time()
        ).replace(hour=8)
        # Temperature follows a seasonal sine + noise
        temp = round(
            26 + 6 * math.sin(day_idx / 60 * math.pi) + random.gauss(0, 2.5), 1
        )
        humid = round(max(20, min(90, random.gauss(52, 14))), 1)
        env_rows.append(
            (
                rec_at,
                aqi,
                cat,
                temp,
                humid,
                random.choice(["Sunny", "Cloudy", "Hazy", "Partly Cloudy", "Clear"]),
                round(random.uniform(2, 10), 1),
                round(random.uniform(35, 80), 1),
                aqi <= 100,
            )
        )
    await conn.executemany(
        """INSERT INTO environmental_snapshots
           (recorded_at, aqi, aqi_category, temperature_c, humidity_percent,
             weather_condition, uv_index, noise_level_db, outdoor_activity_safe)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING""",
        env_rows,
    )

    print("Seeding published mess menu...")
    menu_plan = {
        1: {
            "breakfast": ["Idli (2 pcs)", "Sambar", "Tea", "Banana"],
            "lunch": ["Rice", "Roti", "Dal fry", "Mixed veg", "Curd"],
            "snacks": ["Poha", "Tea"],
            "dinner": ["Rice", "Paratha", "Paneer sabzi", "Curd"],
        },
        2: {
            "breakfast": ["Poha", "Tea", "Banana"],
            "lunch": ["Rice", "Roti", "Rajma", "Aloo sabzi", "Curd"],
            "snacks": ["Halwa", "Tea"],
            "dinner": ["Khichdi", "Palak paneer", "Curd"],
        },
        3: {
            "breakfast": ["Upma", "Tea", "Curd"],
            "lunch": ["Rice", "Roti", "Chole", "Sabzi (seasonal)"],
            "snacks": ["Moong dal chilla", "Milk"],
            "dinner": ["Rice", "Roti", "Egg curry", "Curd"],
        },
        4: {
            "breakfast": ["Bread (2 slices)", "Dal fry", "Tea", "Banana"],
            "lunch": ["Rice", "Roti", "Paneer sabzi", "Mixed veg"],
            "snacks": ["Paratha", "Tea"],
            "dinner": ["Khichdi", "Sabzi (seasonal)", "Curd"],
        },
        5: {
            "breakfast": ["Idli (2 pcs)", "Sambar", "Tea", "Curd"],
            "lunch": ["Rice", "Roti", "Rajma", "Aloo sabzi"],
            "snacks": ["Halwa", "Milk"],
            "dinner": ["Rice", "Paratha", "Palak paneer", "Curd"],
        },
        6: {
            "breakfast": ["Upma", "Curd", "Tea"],
            "lunch": ["Rice", "Roti", "Chicken curry", "Mixed veg"],
            "snacks": ["Moong dal chilla", "Tea"],
            "dinner": ["Rice", "Roti", "Chole", "Curd"],
        },
        7: {
            "breakfast": ["Poha", "Milk", "Banana"],
            "lunch": ["Rice", "Roti", "Paneer sabzi", "Sabzi (seasonal)"],
            "snacks": ["Namkeen", "Tea"],
            "dinner": ["Khichdi", "Egg curry", "Curd"],
        },
    }
    current_week = date.today().isocalendar()[1]
    menu_rows = []
    for week_number in [current_week, current_week + 1]:
        for day_of_week, meals in menu_plan.items():
            for meal_type, item_names in meals.items():
                food_items = [
                    {
                        "food_id": food_item_rows[name]["id"],
                        "name": name,
                        "quantity_g": 100,
                        "calories_per_100g": food_item_rows[name]["cal"],
                        "protein_per_100g": food_item_rows[name]["pro"],
                    }
                    for name in item_names
                    if name in food_item_rows
                ]
                estimated_calories = round(
                    sum(
                        food_item_rows[name]["cal"]
                        for name in item_names
                        if name in food_item_rows
                    ),
                    1,
                )
                estimated_protein = round(
                    sum(
                        food_item_rows[name]["pro"]
                        for name in item_names
                        if name in food_item_rows
                    ),
                    1,
                )
                menu_rows.append(
                    (
                        week_number,
                        day_of_week,
                        meal_type,
                        json.dumps(food_items),
                        estimated_calories,
                        estimated_protein,
                        True,
                    )
                )
    await conn.executemany(
        """INSERT INTO mess_menu(
               week_number, day_of_week, meal_type, food_items,
               estimated_calories, estimated_protein, is_published
           ) VALUES($1,$2,$3,$4,$5,$6,$7)""",
        menu_rows,
    )

    print("Seeding logs for all students across 90 days...")
    wl_rows, al_rows, nl_rows, sl_rows, ml_rows = [], [], [], [], []
    hostel_daily_agg: dict[int, list] = {hid: [] for hid in hostel_ids.values()}

    for day_idx in range(DAYS_OF_DATA):
        day_date = BASE_DATE + timedelta(days=day_idx)
        dow = day_date.weekday()

        for hid, stu_list in hostel_students.items():
            hostel_name = next(
                h["name"] for h in HOSTELS if hostel_ids[h["name"]] == hid
            )
            day_sleeps, day_moods, day_cals, day_acts, day_stresses = [], [], [], [], []

            for stu in stu_list:
                uid = stu["id"]
                profile = profiles[str(uid)]
                d = simulate_student_day(day_idx, profile, stu["branch"], hostel_name)

                wl_rows.append(
                    (
                        uid,
                        day_date,
                        d["wellness_score"],
                        d["activity_score"],
                        d["nutrition_score"],
                        d["mood_score"],
                        d["env_stress_score"],
                        d["sleep_hours"],
                    )
                )

                if d["activity_minutes"] > 0:
                    al_rows.append(
                        (
                            uid,
                            day_date,
                            d["activity_type"],
                            int(d["activity_minutes"]),
                            random.choice(INTENSITIES),
                            round(d["activity_minutes"] * random.uniform(6, 9), 1),
                            d["location"],
                        )
                    )

                for ml in d["meal_logs"]:
                    nl_rows.append(
                        (
                            uid,
                            day_date,
                            ml["meal_type"],
                            None,
                            ml["total_calories"],
                            ml["total_protein"],
                            ml["total_carbs"],
                            ml["total_fat"],
                            ml["total_fibre"],
                            ml["meal_rating"],
                            ml["meal_feedback_tag"],
                        )
                    )

                bedtime = datetime.combine(day_date, datetime.min.time()).replace(
                    hour=22 if dow >= 4 else 23, minute=random.randint(0, 59)
                )
                waketime = datetime.combine(
                    day_date + timedelta(days=1), datetime.min.time()
                ).replace(hour=7 if dow >= 4 else 6, minute=random.randint(0, 59))
                sl_rows.append(
                    (
                        uid,
                        day_date,
                        bedtime.time(),
                        waketime.time(),
                        d["sleep_hours"],
                        random.randint(1, 5),
                        random.randint(0, 3),
                    )
                )

                ml_rows.append(
                    (
                        uid,
                        day_date,
                        random.choice(["morning", "evening", "night"]),
                        "neutral",
                        int(d["mood_score"]),
                        int(d["energy_level"]),
                        int(d["stress_level"]),
                    )
                )

                day_sleeps.append(d["sleep_hours"])
                day_moods.append(d["mood_score"])
                day_cals.append(d["total_calories"])
                day_acts.append(1 if d["activity_minutes"] > 0 else 0)
                day_stresses.append(1 if d["stress_level"] >= 4 else 0)

            n = len(stu_list)
            hostel_daily_agg[hid].append(
                {
                    "avg_sleep": sum(day_sleeps) / n,
                    "avg_mood": sum(day_moods) / n,
                    "avg_calories": sum(day_cals) / n,
                    "activity_pct": sum(day_acts) / n,
                    "high_stress_pct": sum(day_stresses) / n,
                    "avg_aqi": generate_aqi(day_idx),
                }
            )

    BATCH = 2000

    print("  Inserting wellness_logs...")
    for i in range(0, len(wl_rows), BATCH):
        await conn.executemany(
            """INSERT INTO wellness_logs(user_id, date, wellness_score, activity_score,
               nutrition_score, mood_score, env_stress_score, sleep_hours)
               VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING""",
            wl_rows[i : i + BATCH],
        )

    print("  Inserting activity_logs...")
    for i in range(0, len(al_rows), BATCH):
        await conn.executemany(
            """INSERT INTO activity_logs(user_id, date, activity_type, duration_minutes,
               intensity, calories_burned, location) VALUES($1,$2,$3,$4,$5,$6,$7)""",
            al_rows[i : i + BATCH],
        )

    print("  Inserting nutrition_logs...")
    for i in range(0, len(nl_rows), BATCH):
        await conn.executemany(
            """INSERT INTO nutrition_logs(user_id, date, meal_type, food_items,
               total_calories, total_protein, total_carbs, total_fat, total_fibre,
               meal_rating, meal_feedback_tag) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)""",
            nl_rows[i : i + BATCH],
        )

    print("  Inserting sleep_logs...")
    for i in range(0, len(sl_rows), BATCH):
        await conn.executemany(
            """INSERT INTO sleep_logs(user_id, date, sleep_time, wake_time,
               sleep_hours, sleep_quality, disruptions) VALUES($1,$2,$3,$4,$5,$6,$7)""",
            sl_rows[i : i + BATCH],
        )

    print("  Inserting mood_logs...")
    for i in range(0, len(ml_rows), BATCH):
        await conn.executemany(
            """INSERT INTO mood_logs(user_id, date, time_of_day, mood_emoji,
               mood_score, energy_level, stress_level) VALUES($1,$2,$3,$4,$5,$6,$7)""",
            ml_rows[i : i + BATCH],
        )

    print("Generating alerts...")
    alert_rows = []
    for hostel in HOSTELS:
        hid = hostel_ids[hostel["name"]]
        alerts = generate_alerts(hid, hostel["name"], hostel_daily_agg[hid])
        for a in alerts:
            alert_rows.append(
                (
                    a["hostel_id"],
                    a["alert_type"],
                    a["severity"],
                    a["title"],
                    a["description"],
                    a["metric_value"],
                    a["threshold_value"],
                    a["triggered_at"],
                    a["is_active"],
                )
            )

    await conn.executemany(
        """INSERT INTO admin_alerts(hostel_id, alert_type, severity, title, description,
           metric_value, threshold_value, triggered_at, is_active)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)""",
        alert_rows,
    )

    print(
        "Seeding hostel initiatives, nudges, journal entries, and feedback aggregates..."
    )
    today = date.today()
    bh3_warden_id = admin_user_ids["warden.bh3@iitd.ac.in"]["id"]
    bh3_hostel_id = hostel_ids["BH-3"]
    gh2_warden_id = admin_user_ids["warden.gh2@iitd.ac.in"]["id"]
    gh2_hostel_id = hostel_ids["GH-2"]
    test_student_id = await conn.fetchval(
        "SELECT id FROM users WHERE roll_number=$1",
        "2021EE10492",
    )

    await conn.executemany(
        """INSERT INTO hostel_initiatives(hostel_id, created_by, title, description,
           goal_type, target_value, start_date, end_date)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8)""",
        [
            (
                bh3_hostel_id,
                bh3_warden_id,
                "Morning Movement Week",
                "A 7-day push to improve daily movement before breakfast.",
                "activity",
                30,
                today - timedelta(days=5),
                today + timedelta(days=2),
            ),
            (
                gh2_hostel_id,
                gh2_warden_id,
                "Sleep Recovery Sprint",
                "Encourage lights-out discipline and quieter hostel evenings.",
                "sleep",
                7,
                today - timedelta(days=20),
                today - timedelta(days=10),
            ),
        ],
    )

    if test_student_id:
        await conn.executemany(
            """INSERT INTO wellness_nudges(user_id, generated_at, nudge_type, message, trigger, acknowledged)
               VALUES($1,$2,$3,$4,$5,$6)""",
            [
                (
                    test_student_id,
                    datetime.combine(
                        today - timedelta(days=1), datetime.min.time()
                    ).replace(hour=8, minute=30),
                    "sleep",
                    "You are doing well overall, but adding 20 more minutes of sleep can improve recovery.",
                    "sleep_deficit",
                    False,
                ),
                (
                    test_student_id,
                    datetime.combine(
                        today - timedelta(days=3), datetime.min.time()
                    ).replace(hour=18, minute=0),
                    "activity",
                    "AQI is manageable today - a brisk 20-minute outdoor walk is a good option.",
                    "aqi_window",
                    True,
                ),
            ],
        )
        await conn.executemany(
            """INSERT INTO journal_entries(user_id, date, entry_text, word_count)
               VALUES($1,$2,$3,$4)""",
            [
                (
                    test_student_id,
                    today - timedelta(days=2),
                    encrypt_journal(
                        "Felt more focused after sleeping early and finishing my walk before breakfast."
                    ),
                    12,
                ),
                (
                    test_student_id,
                    today - timedelta(days=6),
                    encrypt_journal(
                        "The hostel felt calmer today, and I managed meals on time without skipping dinner."
                    ),
                    14,
                ),
            ],
        )

    await conn.executemany(
        """INSERT INTO mess_feedback_aggregate(date, meal_type, feedback_summary)
           VALUES($1,$2,$3) ON CONFLICT(date, meal_type) DO NOTHING""",
        [
            (
                today - timedelta(days=offset),
                meal,
                json.dumps(
                    {
                        "top_tag": random.choice(FEEDBACK_TAGS),
                        "positive_ratio": round(random.uniform(0.35, 0.62), 2),
                        "negative_ratio": round(random.uniform(0.18, 0.41), 2),
                    }
                ),
            )
            for offset in range(7)
            for meal in MEAL_TYPES
        ],
    )

    print("Seeding academic events...")
    dean_id = None
    for acc in ADMIN_ACCOUNTS:
        if acc["role"] == "dean":
            dean_id = admin_user_ids[acc["email"]]["id"]
    if dean_id:
        await conn.executemany(
            """INSERT INTO academic_events(name, start_date, end_date, event_type, created_by)
               VALUES($1,$2,$3,$4,$5)""",
            [
                (
                    "Mid-semester Examinations",
                    BASE_DATE + timedelta(days=30),
                    BASE_DATE + timedelta(days=36),
                    "exam",
                    dean_id,
                ),
                (
                    "End-semester Examinations",
                    BASE_DATE + timedelta(days=70),
                    BASE_DATE + timedelta(days=76),
                    "exam",
                    dean_id,
                ),
                (
                    "AQI Alert Period",
                    BASE_DATE + timedelta(days=45),
                    BASE_DATE + timedelta(days=55),
                    "environmental",
                    dean_id,
                ),
                (
                    "Fresher Orientation",
                    BASE_DATE + timedelta(days=5),
                    BASE_DATE + timedelta(days=7),
                    "event",
                    dean_id,
                ),
                (
                    "Sports Day",
                    BASE_DATE + timedelta(days=60),
                    BASE_DATE + timedelta(days=61),
                    "event",
                    dean_id,
                ),
            ],
        )

    cnt = await conn.fetchval("SELECT COUNT(*) FROM users WHERE role='student'")
    wl = await conn.fetchval("SELECT COUNT(*) FROM wellness_logs")
    aa = await conn.fetchval("SELECT COUNT(*) FROM admin_alerts")
    print(f"\nVerification:")
    print(f"  Students:      {cnt}")
    print(f"  Wellness logs: {wl}")
    print(f"  Admin alerts:  {aa}")

    await conn.close()
    print("\nSeed complete.")


if __name__ == "__main__":
    asyncio.run(run_seed())
