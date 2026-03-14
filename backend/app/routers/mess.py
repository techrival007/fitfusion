import io
import csv
import json
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Any

from app.database import get_db
from app.auth import require_role
from app.privacy import enforce_k_anonymity

router = APIRouter()

RANGE_DAYS = {"7d": 7, "14d": 14, "30d": 30, "90d": 90}


def days_from_range(r: str) -> int:
    return RANGE_DAYS.get(r, 7)


def normalize_food_items(raw_items):
    if isinstance(raw_items, str):
        try:
            raw_items = json.loads(raw_items)
        except json.JSONDecodeError:
            raw_items = []

    if not isinstance(raw_items, list):
        return []

    items = []
    for item in raw_items:
        if isinstance(item, dict):
            normalized = dict(item)
            if normalized.get("food_id") is not None:
                normalized["food_id"] = str(normalized["food_id"])
            items.append(normalized)
        elif item:
            items.append({"name": str(item)})
    return items


# ── Overview ──────────────────────────────────────────────────────────────────


@router.get("/overview")
async def mess_overview(user=require_role("mess_manager", "dean"), db=Depends(get_db)):
    today = date.today()

    rating_today = await db.fetchrow(
        """SELECT AVG(nl.meal_rating) as avg_rating, COUNT(*) as n_ratings
           FROM nutrition_logs nl WHERE nl.date=$1""",
        today,
    )
    meals_today = await db.fetchval(
        "SELECT COUNT(*) FROM nutrition_logs WHERE date=$1", today
    )
    skip_today = await db.fetch(
        """SELECT nl.meal_type,
               COUNT(DISTINCT u.id)::float / (SELECT COUNT(*) FROM users WHERE role='student') as skip_pct
           FROM users u
           LEFT JOIN nutrition_logs nl ON nl.user_id=u.id AND nl.date=$1
           WHERE u.role='student'
           GROUP BY nl.meal_type""",
        today,
    )
    worst_week = await db.fetchrow(
        """SELECT nl.meal_type, AVG(nl.meal_rating) as avg_rating,
               EXTRACT(DOW FROM nl.date) as dow
           FROM nutrition_logs nl
           WHERE nl.date >= $1
           GROUP BY nl.meal_type, dow
           ORDER BY avg_rating ASC LIMIT 1""",
        today - timedelta(days=7),
    )
    participation = await db.fetch(
        """SELECT nl.date,
               COUNT(CASE WHEN nl.meal_type='breakfast' THEN 1 END) as breakfast,
               COUNT(CASE WHEN nl.meal_type='lunch'     THEN 1 END) as lunch,
               COUNT(CASE WHEN nl.meal_type='snacks'    THEN 1 END) as snacks,
               COUNT(CASE WHEN nl.meal_type='dinner'    THEN 1 END) as dinner
           FROM nutrition_logs nl
           WHERE nl.date >= $1
           GROUP BY nl.date ORDER BY nl.date""",
        today - timedelta(days=7),
    )
    rating_trend = await db.fetch(
        """SELECT nl.date,
               AVG(CASE WHEN nl.meal_type='breakfast' THEN nl.meal_rating END) as breakfast,
               AVG(CASE WHEN nl.meal_type='lunch'     THEN nl.meal_rating END) as lunch,
               AVG(CASE WHEN nl.meal_type='snacks'    THEN nl.meal_rating END) as snacks,
               AVG(CASE WHEN nl.meal_type='dinner'    THEN nl.meal_rating END) as dinner
           FROM nutrition_logs nl
           WHERE nl.date >= $1
           GROUP BY nl.date ORDER BY nl.date""",
        today - timedelta(days=30),
    )

    highest_skip = {"meal": "breakfast", "pct": 0.0, "color": "#1D9E75"}
    for r in skip_today:
        if (
            r["meal_type"]
            and r["skip_pct"]
            and (1 - r["skip_pct"]) > highest_skip["pct"]
        ):
            pct = round((1 - float(r["skip_pct"])) * 100, 1)
            highest_skip = {
                "meal": r["meal_type"],
                "pct": pct,
                "color": "#E24B4A"
                if pct > 40
                else "#BA7517"
                if pct > 20
                else "#1D9E75",
            }

    data = {
        "kpis": {
            "avg_meal_rating_today": {
                "value": round(float(rating_today["avg_rating"] or 0), 2),
                "n_ratings": int(rating_today["n_ratings"] or 0),
                "trend": 0,
            },
            "total_meals_logged_today": {"value": int(meals_today or 0)},
            "highest_skip_rate_today": highest_skip,
            "worst_rated_meal_week": {
                "meal": worst_week["meal_type"] if worst_week else "N/A",
                "day": int(worst_week["dow"] if worst_week else 0),
                "rating": round(float(worst_week["avg_rating"] or 0), 2)
                if worst_week
                else 0,
            },
        },
        "participation_chart": [
            {
                "day": str(r["date"]),
                "breakfast": r["breakfast"] or 0,
                "lunch": r["lunch"] or 0,
                "snacks": r["snacks"] or 0,
                "dinner": r["dinner"] or 0,
            }
            for r in participation
        ],
        "rating_trend": [
            {
                "date": str(r["date"]),
                "breakfast": round(float(r["breakfast"] or 0), 2),
                "lunch": round(float(r["lunch"] or 0), 2),
                "snacks": round(float(r["snacks"] or 0), 2),
                "dinner": round(float(r["dinner"] or 0), 2),
            }
            for r in rating_trend
        ],
        "insight": "Track meal participation trends to identify low-engagement meal slots.",
    }
    return data


# ── Ratings ───────────────────────────────────────────────────────────────────


@router.get("/ratings")
async def mess_ratings(
    range: str = Query("7d"),
    meal_type: str = Query("all"),
    day_of_week: str = Query("all"),
    user=require_role("mess_manager", "dean"),
    db=Depends(get_db),
):
    days = days_from_range(range)
    since = date.today() - timedelta(days=days)
    meal_filter = "" if meal_type == "all" else f"AND nl.meal_type = '{meal_type}'"
    dow_filter = (
        ""
        if day_of_week == "all"
        else f"AND EXTRACT(DOW FROM nl.date) = {int(day_of_week)}"
    )

    table = await db.fetch(
        f"""SELECT nl.date, nl.meal_type,
               AVG(nl.meal_rating) as avg_rating, COUNT(*) as n_ratings,
               MODE() WITHIN GROUP (ORDER BY nl.meal_feedback_tag) as top_tag
           FROM nutrition_logs nl
           WHERE nl.date >= $1 {meal_filter} {dow_filter}
           GROUP BY nl.date, nl.meal_type ORDER BY nl.date DESC""",
        since,
    )

    worst = await db.fetch(
        f"""SELECT nl.meal_type, nl.date, AVG(nl.meal_rating) as rating,
               MODE() WITHIN GROUP (ORDER BY nl.meal_feedback_tag) as complaint_tag
           FROM nutrition_logs nl
           WHERE nl.date >= $1 {meal_filter}
           GROUP BY nl.meal_type, nl.date
           ORDER BY rating ASC LIMIT 10""",
        since,
    )
    best = await db.fetch(
        f"""SELECT nl.meal_type, nl.date, AVG(nl.meal_rating) as rating,
               MODE() WITHIN GROUP (ORDER BY nl.meal_feedback_tag) as positive_tag
           FROM nutrition_logs nl
           WHERE nl.date >= $1 {meal_filter}
           GROUP BY nl.meal_type, nl.date
           ORDER BY rating DESC LIMIT 10""",
        since,
    )
    tags = await db.fetch(
        f"""SELECT nl.meal_feedback_tag as tag, COUNT(*) as cnt
           FROM nutrition_logs nl
           WHERE nl.date >= $1 {meal_filter}
           GROUP BY nl.meal_feedback_tag ORDER BY cnt DESC""",
        since,
    )

    POSITIVE_TAGS = {"tasty"}
    return {
        "table": [
            {
                "date": str(r["date"]),
                "day_name": r["date"].strftime("%A"),
                "meal_type": r["meal_type"],
                "avg_rating": round(float(r["avg_rating"] or 0), 2),
                "n_ratings": r["n_ratings"],
                "top_tag": r["top_tag"],
            }
            for r in table
        ],
        "worst_meals": [
            {
                "meal_name": r["meal_type"],
                "date": str(r["date"]),
                "rating": round(float(r["rating"] or 0), 2),
                "complaint_tag": r["complaint_tag"],
            }
            for r in worst
        ],
        "best_meals": [
            {
                "meal_name": r["meal_type"],
                "date": str(r["date"]),
                "rating": round(float(r["rating"] or 0), 2),
                "positive_tag": r["positive_tag"],
            }
            for r in best
        ],
        "tag_frequencies": [
            {
                "tag": r["tag"],
                "count": r["cnt"],
                "type": "positive" if r["tag"] in POSITIVE_TAGS else "negative",
            }
            for r in tags
            if r["tag"]
        ],
    }


# ── Nutrients ─────────────────────────────────────────────────────────────────


@router.get("/nutrients")
async def mess_nutrients(
    range: str = Query("7d"),
    user=require_role("mess_manager", "dean"),
    db=Depends(get_db),
):
    days = days_from_range(range)
    since = date.today() - timedelta(days=days)

    avgs = await db.fetchrow(
        """SELECT AVG(nl.total_calories) as cal, AVG(nl.total_protein) as pro,
                  AVG(nl.total_carbs) as carbs, AVG(nl.total_fat) as fat,
                  AVG(nl.total_fibre) as fibre
           FROM nutrition_logs nl WHERE nl.date >= $1""",
        since,
    )
    macro_trend = await db.fetch(
        """SELECT DATE_TRUNC('week', nl.date)::date as week,
               AVG(nl.total_protein) as protein_g,
               AVG(nl.total_carbs) as carbs_g,
               AVG(nl.total_fat) as fat_g
           FROM nutrition_logs nl WHERE nl.date >= $1
           GROUP BY week ORDER BY week""",
        date.today() - timedelta(weeks=12),
    )

    RDA = {"calories": 2000, "protein": 60, "carbs": 275, "fat": 65, "fibre": 30}

    def gauge(avg, rda, name):
        a = round(float(avg or 0), 1)
        p = round(a / rda * 100, 1)
        status = "ok" if 90 <= p <= 110 else "warning" if p >= 70 else "deficient"
        return {"avg": a, "rda": rda, "pct": p, "status": status}

    gauges = {
        "calories": gauge(avgs["cal"], RDA["calories"], "calories"),
        "protein": gauge(avgs["pro"], RDA["protein"], "protein"),
        "carbs": gauge(avgs["carbs"], RDA["carbs"], "carbs"),
        "fat": gauge(avgs["fat"], RDA["fat"], "fat"),
        "fibre": gauge(avgs["fibre"], RDA["fibre"], "fibre"),
    }

    recs = []
    if gauges["protein"]["status"] == "deficient":
        recs.append(
            {
                "nutrient": "protein",
                "message": "Add dal, paneer or egg options to increase protein content",
            }
        )
    if gauges["fibre"]["status"] == "deficient":
        recs.append(
            {
                "nutrient": "fibre",
                "message": "Include more vegetables and whole grains in the menu",
            }
        )
    if gauges["calories"]["status"] == "deficient":
        recs.append(
            {
                "nutrient": "calories",
                "message": "Students may be undereating — consider increasing portion sizes",
            }
        )

    return {
        "gauges": gauges,
        "macro_trend": [
            {
                "week": str(r["week"]),
                "protein_g": round(float(r["protein_g"] or 0), 1),
                "carbs_g": round(float(r["carbs_g"] or 0), 1),
                "fat_g": round(float(r["fat_g"] or 0), 1),
            }
            for r in macro_trend
        ],
        "recommendations": recs,
    }


# ── Menu ──────────────────────────────────────────────────────────────────────


@router.get("/food-items")
async def get_food_items(
    user=require_role("mess_manager", "dean"),
    db=Depends(get_db),
):
    rows = await db.fetch(
        """SELECT id, name, category, calories_per_100g, protein_per_100g,
                  carbs_per_100g, fat_per_100g, fibre_per_100g, is_veg, allergens
           FROM food_items
           ORDER BY name"""
    )

    return {
        "items": [
            {
                "id": str(r["id"]),
                "name": r["name"],
                "category": r["category"],
                "calories_per_100g": round(float(r["calories_per_100g"] or 0), 1),
                "protein_per_100g": round(float(r["protein_per_100g"] or 0), 1),
                "carbs_per_100g": round(float(r["carbs_per_100g"] or 0), 1),
                "fat_per_100g": round(float(r["fat_per_100g"] or 0), 1),
                "fibre_per_100g": round(float(r["fibre_per_100g"] or 0), 1),
                "is_veg": bool(r["is_veg"]),
                "allergens": r["allergens"] or [],
            }
            for r in rows
        ]
    }


@router.get("/menu")
async def get_menu(
    week_number: int = Query(...),
    user=require_role("mess_manager", "dean"),
    db=Depends(get_db),
):
    rows = await db.fetch(
        "SELECT * FROM mess_menu WHERE week_number=$1 ORDER BY day_of_week, meal_type",
        week_number,
    )

    DAYS = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
    ]
    MEALS = ["breakfast", "lunch", "snacks", "dinner"]
    grid: dict[str, dict[str, Any | None]] = {d: {m: None for m in MEALS} for d in DAYS}
    daily_totals: dict[str, dict[str, float]] = {
        d: {"calories": 0.0, "protein": 0.0} for d in DAYS
    }

    for r in rows:
        day = DAYS[r["day_of_week"]] if r["day_of_week"] < 7 else "monday"
        meal = r["meal_type"]
        if meal in MEALS:
            slot = {
                "id": str(r["id"]),
                "food_items": normalize_food_items(r["food_items"]),
                "estimated_calories": r["estimated_calories"],
                "estimated_protein": r["estimated_protein"],
                "is_published": r["is_published"],
            }
            grid[day][meal] = slot
            daily_totals[day]["calories"] += float(r["estimated_calories"] or 0)
            daily_totals[day]["protein"] += float(r["estimated_protein"] or 0)

    is_published = any(r["is_published"] for r in rows)
    return {"grid": grid, "daily_totals": daily_totals, "is_published": is_published}


class MenuSlot(BaseModel):
    week_number: int
    day_of_week: int
    meal_type: str
    food_items: List[dict]


@router.post("/menu")
async def create_menu_slot(
    body: MenuSlot,
    user=require_role("mess_manager", "dean"),
    db=Depends(get_db),
):
    food_ids = [fi.get("food_id") for fi in body.food_items if fi.get("food_id")]
    food_rows = (
        await db.fetch("SELECT * FROM food_items WHERE id = ANY($1::uuid[])", food_ids)
        if food_ids
        else []
    )

    total_cal = total_pro = total_carbs = total_fat = total_fibre = 0.0
    allergen_map: dict[str, int] = {}

    for fi in body.food_items:
        fid = fi.get("food_id")
        qty = float(fi.get("quantity_g", 100))
        food = next((dict(r) for r in food_rows if str(r["id"]) == fid), None)
        if food:
            factor = qty / 100
            total_cal += food["calories_per_100g"] * factor
            total_pro += food["protein_per_100g"] * factor
            total_carbs += food["carbs_per_100g"] * factor
            total_fat += food["fat_per_100g"] * factor
            total_fibre += food["fibre_per_100g"] * factor
            for allergen in food["allergens"] or []:
                allergen_map[allergen] = allergen_map.get(allergen, 0) + 1

    # Count students per allergen
    allergen_conflicts = []
    for allergen in allergen_map:
        cnt = await db.fetchval(
            "SELECT COUNT(*) FROM users WHERE role='student' AND $1=ANY(allergens)",
            allergen,
        )
        if cnt:
            allergen_conflicts.append(
                {"allergen": allergen, "affected_count": int(cnt)}
            )

    row = await db.fetchrow(
        """INSERT INTO mess_menu(week_number, day_of_week, meal_type, food_items,
           estimated_calories, estimated_protein)
           VALUES($1,$2,$3,$4,$5,$6) RETURNING *""",
        body.week_number,
        body.day_of_week,
        body.meal_type,
        json.dumps(body.food_items),
        round(total_cal, 1),
        round(total_pro, 1),
    )

    slot = dict(row)
    for k, v in slot.items():
        if hasattr(v, "isoformat"):
            slot[k] = v.isoformat()

    return {
        "menu_entry": slot,
        "nutrition_totals": {
            "calories": round(total_cal, 1),
            "protein": round(total_pro, 1),
            "carbs": round(total_carbs, 1),
            "fat": round(total_fat, 1),
            "fibre": round(total_fibre, 1),
        },
        "allergen_conflicts": allergen_conflicts,
    }


@router.put("/menu/{menu_id}")
async def update_menu_slot(
    menu_id: str,
    body: MenuSlot,
    user=require_role("mess_manager", "dean"),
    db=Depends(get_db),
):
    food_ids = [fi.get("food_id") for fi in body.food_items if fi.get("food_id")]
    food_rows = (
        await db.fetch("SELECT * FROM food_items WHERE id = ANY($1::uuid[])", food_ids)
        if food_ids
        else []
    )

    total_cal = total_pro = 0.0
    allergen_map: dict[str, int] = {}
    for fi in body.food_items:
        fid = fi.get("food_id")
        qty = float(fi.get("quantity_g", 100))
        food = next((dict(r) for r in food_rows if str(r["id"]) == fid), None)
        if food:
            factor = qty / 100
            total_cal += food["calories_per_100g"] * factor
            total_pro += food["protein_per_100g"] * factor
            for a in food["allergens"] or []:
                allergen_map[a] = allergen_map.get(a, 0) + 1

    allergen_conflicts = []
    for allergen in allergen_map:
        cnt = await db.fetchval(
            "SELECT COUNT(*) FROM users WHERE role='student' AND $1=ANY(allergens)",
            allergen,
        )
        if cnt:
            allergen_conflicts.append(
                {"allergen": allergen, "affected_count": int(cnt)}
            )

    row = await db.fetchrow(
        """UPDATE mess_menu SET food_items=$1, estimated_calories=$2, estimated_protein=$3
           WHERE id=$4 RETURNING *""",
        json.dumps(body.food_items),
        round(total_cal, 1),
        round(total_pro, 1),
        menu_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Menu entry not found")

    slot = dict(row)
    for k, v in slot.items():
        if hasattr(v, "isoformat"):
            slot[k] = v.isoformat()

    return {
        "menu_entry": slot,
        "nutrition_totals": {
            "calories": round(total_cal, 1),
            "protein": round(total_pro, 1),
        },
        "allergen_conflicts": allergen_conflicts,
    }


class PublishMenu(BaseModel):
    week_number: int


@router.post("/menu/publish")
async def publish_menu(
    body: PublishMenu,
    user=require_role("mess_manager", "dean"),
    db=Depends(get_db),
):
    from datetime import datetime

    await db.execute(
        "UPDATE mess_menu SET is_published=TRUE, published_at=NOW() WHERE week_number=$1",
        body.week_number,
    )
    return {
        "published": True,
        "week_number": body.week_number,
        "published_at": datetime.utcnow().isoformat(),
    }


# ── Feedback ──────────────────────────────────────────────────────────────────


@router.get("/feedback")
async def mess_feedback(
    range: str = Query("7d"),
    meal_type: str = Query("all"),
    user=require_role("mess_manager", "dean"),
    db=Depends(get_db),
):
    days = days_from_range(range)
    since = date.today() - timedelta(days=days)
    meal_filter = "" if meal_type == "all" else f"AND nl.meal_type = '{meal_type}'"

    table = await db.fetch(
        f"""SELECT nl.date, nl.meal_type,
               AVG(nl.meal_rating) as avg_rating,
               COUNT(*) as n_ratings,
               ARRAY_AGG(DISTINCT nl.meal_feedback_tag) as tags
           FROM nutrition_logs nl
           WHERE nl.date >= $1 {meal_filter}
           GROUP BY nl.date, nl.meal_type ORDER BY nl.date DESC""",
        since,
    )
    ratio_trend = await db.fetch(
        f"""SELECT DATE_TRUNC('week', nl.date)::date as week,
               COUNT(CASE WHEN nl.meal_feedback_tag='tasty' THEN 1 END)::float / NULLIF(COUNT(*),0) as positive_ratio,
               COUNT(CASE WHEN nl.meal_feedback_tag!='tasty' THEN 1 END)::float / NULLIF(COUNT(*),0) as negative_ratio
           FROM nutrition_logs nl
           WHERE nl.date >= $1 {meal_filter}
           GROUP BY week ORDER BY week""",
        date.today() - timedelta(weeks=12),
    )
    complaint = await db.fetch(
        f"""SELECT nl.meal_feedback_tag as tag, COUNT(*) as cnt
           FROM nutrition_logs nl
           WHERE nl.date >= $1 AND nl.meal_feedback_tag != 'tasty' {meal_filter}
           GROUP BY nl.meal_feedback_tag ORDER BY cnt DESC""",
        since,
    )

    POSITIVE = {"tasty"}
    return {
        "table": [
            {
                "date": str(r["date"]),
                "meal_type": r["meal_type"],
                "avg_rating": round(float(r["avg_rating"] or 0), 2),
                "n_ratings": r["n_ratings"],
                "positive_tags": [t for t in (r["tags"] or []) if t in POSITIVE],
                "negative_tags": [
                    t for t in (r["tags"] or []) if t and t not in POSITIVE
                ],
            }
            for r in table
        ],
        "ratio_trend": [
            {
                "week": str(r["week"]),
                "positive_ratio": round(float(r["positive_ratio"] or 0) * 100, 1),
                "negative_ratio": round(float(r["negative_ratio"] or 0) * 100, 1),
            }
            for r in ratio_trend
        ],
        "complaint_breakdown": {r["tag"]: r["cnt"] for r in complaint if r["tag"]},
    }
