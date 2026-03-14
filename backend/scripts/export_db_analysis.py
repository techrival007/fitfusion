import asyncio
import json
import sys
from datetime import UTC, date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = ROOT.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import asyncpg

from app.config import settings


TABLE_PURPOSES = {
    "academic_events": "Stores academic calendar events used to correlate wellness changes with exams and campus milestones.",
    "activity_logs": "Captures student exercise sessions, intensity, duration, calories, and indoor/outdoor location.",
    "admin_alerts": "Stores aggregated hostel-level alerts generated from sustained risk patterns.",
    "environmental_snapshots": "Persists campus environmental conditions including AQI, weather, and normalized source payloads.",
    "food_items": "Master catalog of food items and nutrient values used by the mess planner.",
    "hostel_initiatives": "Tracks warden-created wellness initiatives for each hostel.",
    "hostels": "Defines hostel entities, type, capacity, and assigned warden.",
    "journal_entries": "Stores encrypted student journal entries and word counts.",
    "mess_feedback_aggregate": "Stores aggregated mess feedback summaries by date and meal type.",
    "mess_menu": "Stores planned and published mess menus with nutrient estimates.",
    "mood_logs": "Captures mood, stress, and energy check-ins from students.",
    "nutrition_logs": "Captures meal-level nutrition intake, ratings, and mess feedback tags.",
    "sleep_logs": "Captures sleep timing, duration, quality, and disruptions.",
    "users": "Stores all authenticated users including students, wardens, dean, and mess manager.",
    "wellness_logs": "Stores daily computed wellness component scores for each student.",
    "wellness_nudges": "Stores generated wellness nudges and acknowledgement state.",
}

ROLE_CHAT_UI = {
    "student": {
        "title": "Student Wellness Assistant",
        "greeting": "Hi - I can explain your wellness data, environment context, journaling trends, and support options using the current campus analysis.",
        "suggestions": [
            "Summarize my wellness context",
            "How does AQI affect me today?",
            "What should I improve first?",
            "Explain sleep and activity trends",
        ],
    },
    "warden": {
        "title": "Hostel Analytics Assistant",
        "greeting": "Hello - I can interpret hostel-level wellness, alerts, participation, and environmental signals from the current database analysis.",
        "suggestions": [
            "Summarize hostel risks",
            "Explain current environment impact",
            "What should the warden act on next?",
            "How are participation and sleep trending?",
        ],
    },
    "mess_manager": {
        "title": "Mess Analytics Assistant",
        "greeting": "Hello - I can explain meal ratings, nutrient gaps, menu quality, and mess participation using the latest database analysis.",
        "suggestions": [
            "Summarize mess performance",
            "What nutrient gaps stand out?",
            "Which meals are underperforming?",
            "Suggest menu improvements",
        ],
    },
    "dean": {
        "title": "Campus Intelligence Assistant",
        "greeting": "Hello - I can interpret campus wellness, hostel comparisons, academic correlation, and environmental impact using the latest database analysis.",
        "suggestions": [
            "Summarize campus wellness",
            "Where are the biggest campus risks?",
            "Explain academic and environment signals",
            "What actions should leadership prioritize?",
        ],
    },
}

ROLE_TABLES = {
    "student": [
        "users",
        "wellness_logs",
        "activity_logs",
        "nutrition_logs",
        "mood_logs",
        "sleep_logs",
        "journal_entries",
        "wellness_nudges",
        "mess_menu",
        "environmental_snapshots",
    ],
    "warden": [
        "hostels",
        "users",
        "wellness_logs",
        "activity_logs",
        "nutrition_logs",
        "mood_logs",
        "environmental_snapshots",
        "admin_alerts",
        "hostel_initiatives",
    ],
    "mess_manager": [
        "food_items",
        "mess_menu",
        "nutrition_logs",
        "mess_feedback_aggregate",
        "users",
    ],
    "dean": [
        "hostels",
        "users",
        "wellness_logs",
        "activity_logs",
        "nutrition_logs",
        "mood_logs",
        "sleep_logs",
        "environmental_snapshots",
        "admin_alerts",
        "academic_events",
        "hostel_initiatives",
    ],
}


def _json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_safe(v) for v in value]
    if isinstance(value, tuple):
        return [_json_safe(v) for v in value]
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if hasattr(value, "hex") and callable(value.hex):
        try:
            return str(value)
        except Exception:
            return repr(value)
    return value


async def _get_table_names(conn: asyncpg.Connection) -> list[str]:
    rows = await conn.fetch(
        """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
        """
    )
    return [r["table_name"] for r in rows]


async def _get_columns(conn: asyncpg.Connection) -> dict[str, list[dict[str, Any]]]:
    rows = await conn.fetch(
        """
        SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
        """
    )
    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        grouped.setdefault(row["table_name"], []).append(
            {
                "name": row["column_name"],
                "data_type": row["data_type"],
                "udt_name": row["udt_name"],
                "nullable": row["is_nullable"] == "YES",
                "default": row["column_default"],
            }
        )
    return grouped


async def _get_primary_keys(conn: asyncpg.Connection) -> dict[str, list[str]]:
    rows = await conn.fetch(
        """
        SELECT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY'
        ORDER BY tc.table_name, kcu.ordinal_position
        """
    )
    grouped: dict[str, list[str]] = {}
    for row in rows:
        grouped.setdefault(row["table_name"], []).append(row["column_name"])
    return grouped


async def _get_foreign_keys(
    conn: asyncpg.Connection,
) -> dict[str, list[dict[str, Any]]]:
    rows = await conn.fetch(
        """
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema = tc.table_schema
        WHERE tc.table_schema = 'public' AND tc.constraint_type = 'FOREIGN KEY'
        ORDER BY tc.table_name, kcu.column_name
        """
    )
    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        grouped.setdefault(row["table_name"], []).append(
            {
                "column": row["column_name"],
                "references_table": row["foreign_table_name"],
                "references_column": row["foreign_column_name"],
            }
        )
    return grouped


async def _get_indexes(conn: asyncpg.Connection) -> dict[str, list[str]]:
    rows = await conn.fetch(
        """
        SELECT tablename, indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
        """
    )
    grouped: dict[str, list[str]] = {}
    for row in rows:
        grouped.setdefault(row["tablename"], []).append(row["indexname"])
    return grouped


async def _get_row_count(conn: asyncpg.Connection, table: str) -> int:
    value = await conn.fetchval(f'SELECT COUNT(*) FROM "{table}"')
    return int(value or 0)


async def _get_table_time_ranges(
    conn: asyncpg.Connection, table: str, columns: list[dict[str, Any]]
) -> dict[str, dict[str, Any]]:
    candidates = [
        "date",
        "created_at",
        "recorded_at",
        "triggered_at",
        "acknowledged_at",
        "generated_at",
        "published_at",
        "start_date",
        "end_date",
    ]
    present = [c for c in candidates if any(col["name"] == c for col in columns)]
    result: dict[str, dict[str, Any]] = {}
    for column in present:
        row = await conn.fetchrow(
            f'SELECT MIN("{column}") AS min_value, MAX("{column}") AS max_value FROM "{table}"'
        )
        result[column] = {
            "min": _json_safe(row["min_value"]) if row else None,
            "max": _json_safe(row["max_value"]) if row else None,
        }
    return result


async def _build_table_analysis(conn: asyncpg.Connection) -> dict[str, Any]:
    tables = await _get_table_names(conn)
    columns_map = await _get_columns(conn)
    pks = await _get_primary_keys(conn)
    fks = await _get_foreign_keys(conn)
    indexes = await _get_indexes(conn)

    table_analysis: dict[str, Any] = {}
    for table in tables:
        columns = columns_map.get(table, [])
        table_analysis[table] = {
            "purpose": TABLE_PURPOSES.get(table, "Operational application table."),
            "row_count": await _get_row_count(conn, table),
            "columns": columns,
            "primary_key": pks.get(table, []),
            "foreign_keys": fks.get(table, []),
            "indexes": indexes.get(table, []),
            "time_ranges": await _get_table_time_ranges(conn, table, columns),
        }
    return table_analysis


async def _build_global_summary(
    conn: asyncpg.Connection, table_analysis: dict[str, Any]
) -> dict[str, Any]:
    role_rows = await conn.fetch(
        "SELECT role, COUNT(*) AS count FROM users GROUP BY role ORDER BY role"
    )
    hostel_rows = await conn.fetch(
        "SELECT type, COUNT(*) AS count FROM hostels GROUP BY type ORDER BY type"
    )
    active_alerts = await conn.fetchval(
        "SELECT COUNT(*) FROM admin_alerts WHERE is_active = TRUE"
    )
    env_row = await conn.fetchrow(
        """
        SELECT recorded_at, aqi, aqi_category, temperature_c, humidity_percent, uv_index
        FROM environmental_snapshots
        ORDER BY recorded_at DESC
        LIMIT 1
        """
    )
    return {
        "table_count": len(table_analysis),
        "total_rows": sum(info["row_count"] for info in table_analysis.values()),
        "role_counts": {row["role"]: int(row["count"]) for row in role_rows},
        "hostel_type_counts": {row["type"]: int(row["count"]) for row in hostel_rows},
        "active_alert_count": int(active_alerts or 0),
        "latest_environment": _json_safe(dict(env_row)) if env_row else None,
    }


async def _student_summary(conn: asyncpg.Connection) -> dict[str, Any]:
    student = await conn.fetchrow(
        """
        SELECT u.id, h.name AS hostel_name, u.branch, u.academic_year
        FROM users u
        LEFT JOIN hostels h ON h.id = u.hostel_id
        WHERE u.role = 'student'
        ORDER BY CASE WHEN u.roll_number = '2021EE10492' THEN 0 ELSE 1 END, u.created_at
        LIMIT 1
        """
    )
    if not student:
        return {
            "scope": "Student self-serve wellness context",
            "accessible_tables": ROLE_TABLES["student"],
            "chat_ui": ROLE_CHAT_UI["student"],
        }

    uid = student["id"]
    latest_wellness = await conn.fetchrow(
        """
        SELECT date, wellness_score, activity_score, nutrition_score, mood_score, env_stress_score, sleep_hours
        FROM wellness_logs
        WHERE user_id = $1
        ORDER BY date DESC
        LIMIT 1
        """,
        uid,
    )
    counts = {
        "activity_logs": await conn.fetchval(
            "SELECT COUNT(*) FROM activity_logs WHERE user_id = $1", uid
        ),
        "nutrition_logs": await conn.fetchval(
            "SELECT COUNT(*) FROM nutrition_logs WHERE user_id = $1", uid
        ),
        "mood_logs": await conn.fetchval(
            "SELECT COUNT(*) FROM mood_logs WHERE user_id = $1", uid
        ),
        "sleep_logs": await conn.fetchval(
            "SELECT COUNT(*) FROM sleep_logs WHERE user_id = $1", uid
        ),
        "journal_entries": await conn.fetchval(
            "SELECT COUNT(*) FROM journal_entries WHERE user_id = $1", uid
        ),
        "nudges": await conn.fetchval(
            "SELECT COUNT(*) FROM wellness_nudges WHERE user_id = $1", uid
        ),
    }
    latest_environment = await conn.fetchrow(
        """
        SELECT recorded_at, aqi, aqi_category, temperature_c, humidity_percent, uv_index, outdoor_activity_safe
        FROM environmental_snapshots
        ORDER BY recorded_at DESC
        LIMIT 1
        """
    )
    return {
        "scope": "Student self-serve wellness context based on personal logs plus campus environment.",
        "persona_scope": {
            "hostel": student["hostel_name"],
            "branch": student["branch"],
            "academic_year": student["academic_year"],
        },
        "accessible_tables": ROLE_TABLES["student"],
        "latest_personal_snapshot": _json_safe(dict(latest_wellness))
        if latest_wellness
        else None,
        "log_counts": {k: int(v or 0) for k, v in counts.items()},
        "latest_environment": _json_safe(dict(latest_environment))
        if latest_environment
        else None,
        "chat_ui": ROLE_CHAT_UI["student"],
    }


async def _warden_summary(conn: asyncpg.Connection) -> dict[str, Any]:
    hostel = await conn.fetchrow(
        "SELECT id, name FROM hostels WHERE name = 'BH-3' ORDER BY id LIMIT 1"
    )
    if not hostel:
        hostel = await conn.fetchrow("SELECT id, name FROM hostels ORDER BY id LIMIT 1")
    if not hostel:
        return {
            "scope": "Hostel-level aggregated wellness context.",
            "accessible_tables": ROLE_TABLES["warden"],
            "chat_ui": ROLE_CHAT_UI["warden"],
        }

    hid = hostel["id"]
    student_count = await conn.fetchval(
        "SELECT COUNT(*) FROM users WHERE hostel_id = $1 AND role = 'student'",
        hid,
    )
    kpis = await conn.fetchrow(
        """
        SELECT
          AVG(wl.wellness_score) FILTER (WHERE wl.date >= CURRENT_DATE - INTERVAL '7 days') AS avg_wellness,
          AVG(wl.sleep_hours) FILTER (WHERE wl.date >= CURRENT_DATE - INTERVAL '7 days') AS avg_sleep,
          AVG(wl.mood_score) FILTER (WHERE wl.date >= CURRENT_DATE - INTERVAL '7 days') AS avg_mood
        FROM users u
        LEFT JOIN wellness_logs wl ON wl.user_id = u.id
        WHERE u.hostel_id = $1
        """,
        hid,
    )
    kpi_dict = _json_safe(dict(kpis)) if kpis else {}
    kpi_dict["students"] = int(student_count or 0)
    alerts = await conn.fetchrow(
        """
        SELECT
          COUNT(*) FILTER (WHERE is_active = TRUE) AS active_count,
          MAX(triggered_at) AS latest_triggered_at
        FROM admin_alerts
        WHERE hostel_id = $1
        """,
        hid,
    )
    env = await conn.fetchrow(
        """
        SELECT recorded_at, aqi, aqi_category, temperature_c, humidity_percent, uv_index
        FROM environmental_snapshots
        ORDER BY recorded_at DESC
        LIMIT 1
        """
    )
    return {
        "scope": "Hostel-level aggregated wellness oversight for a single hostel.",
        "hostel": hostel["name"],
        "accessible_tables": ROLE_TABLES["warden"],
        "hostel_kpis": kpi_dict,
        "alert_summary": _json_safe(dict(alerts)) if alerts else None,
        "latest_environment": _json_safe(dict(env)) if env else None,
        "chat_ui": ROLE_CHAT_UI["warden"],
    }


async def _mess_summary(conn: asyncpg.Connection) -> dict[str, Any]:
    ratings = await conn.fetchrow(
        """
        SELECT
          AVG(meal_rating) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '7 days') AS avg_rating_7d,
          COUNT(*) FILTER (WHERE date = CURRENT_DATE) AS meals_logged_today,
          AVG(total_protein) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '30 days') AS avg_protein_30d,
          AVG(total_fibre) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '30 days') AS avg_fibre_30d
        FROM nutrition_logs
        """
    )
    menu = await conn.fetchrow(
        """
        SELECT
          COUNT(*) AS total_slots,
          COUNT(*) FILTER (WHERE is_published = TRUE) AS published_slots,
          MAX(week_number) AS latest_week
        FROM mess_menu
        """
    )
    tags = await conn.fetch(
        """
        SELECT meal_feedback_tag, COUNT(*) AS count
        FROM nutrition_logs
        WHERE meal_feedback_tag IS NOT NULL
        GROUP BY meal_feedback_tag
        ORDER BY count DESC
        LIMIT 5
        """
    )
    return {
        "scope": "Campus mess operations context spanning meal quality, menu planning, and nutrient delivery.",
        "accessible_tables": ROLE_TABLES["mess_manager"],
        "mess_kpis": _json_safe(dict(ratings)) if ratings else None,
        "menu_summary": _json_safe(dict(menu)) if menu else None,
        "top_feedback_tags": _json_safe([dict(r) for r in tags]),
        "chat_ui": ROLE_CHAT_UI["mess_manager"],
    }


async def _dean_summary(conn: asyncpg.Connection) -> dict[str, Any]:
    total_students = await conn.fetchval(
        "SELECT COUNT(*) FROM users WHERE role = 'student'"
    )
    total_wardens = await conn.fetchval(
        "SELECT COUNT(*) FROM users WHERE role = 'warden'"
    )
    campus = await conn.fetchrow(
        """
        SELECT
          AVG(wl.wellness_score) FILTER (WHERE wl.date >= CURRENT_DATE - INTERVAL '7 days') AS avg_wellness_7d,
          AVG(wl.sleep_hours) FILTER (WHERE wl.date >= CURRENT_DATE - INTERVAL '7 days') AS avg_sleep_7d,
          AVG(wl.mood_score) FILTER (WHERE wl.date >= CURRENT_DATE - INTERVAL '7 days') AS avg_mood_7d
        FROM users u
        LEFT JOIN wellness_logs wl ON wl.user_id = u.id
        """
    )
    campus_dict = _json_safe(dict(campus)) if campus else {}
    campus_dict["total_students"] = int(total_students or 0)
    campus_dict["total_wardens"] = int(total_wardens or 0)
    alerts = await conn.fetchrow(
        """
        SELECT
          COUNT(*) AS total_alerts,
          COUNT(*) FILTER (WHERE is_active = TRUE) AS active_alerts
        FROM admin_alerts
        """
    )
    hostel_scores = await conn.fetch(
        """
        SELECT h.name, AVG(wl.wellness_score) AS avg_score
        FROM hostels h
        JOIN users u ON u.hostel_id = h.id
        JOIN wellness_logs wl ON wl.user_id = u.id
        WHERE wl.date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY h.name
        ORDER BY avg_score DESC
        LIMIT 5
        """
    )
    env = await conn.fetchrow(
        """
        SELECT recorded_at, aqi, aqi_category, temperature_c, humidity_percent, uv_index
        FROM environmental_snapshots
        ORDER BY recorded_at DESC
        LIMIT 1
        """
    )
    academic = await conn.fetchrow(
        "SELECT COUNT(*) AS event_count, MAX(end_date) AS latest_event_end FROM academic_events"
    )
    return {
        "scope": "Campus-wide aggregated intelligence across hostels, wellness, academics, and environment.",
        "accessible_tables": ROLE_TABLES["dean"],
        "campus_kpis": campus_dict,
        "alert_summary": _json_safe(dict(alerts)) if alerts else None,
        "top_hostels_7d": _json_safe([dict(r) for r in hostel_scores]),
        "latest_environment": _json_safe(dict(env)) if env else None,
        "academic_summary": _json_safe(dict(academic)) if academic else None,
        "chat_ui": ROLE_CHAT_UI["dean"],
    }


async def build_analysis() -> dict[str, Any]:
    conn = await asyncpg.connect(settings.database_url)
    try:
        table_analysis = await _build_table_analysis(conn)
        analysis = {
            "generated_at": datetime.now(UTC).isoformat(),
            "database": {
                "engine": "PostgreSQL",
                "schema": "public",
                "name": settings.database_url.rsplit("/", 1)[-1],
            },
            "global_summary": await _build_global_summary(conn, table_analysis),
            "tables": table_analysis,
            "roles": {
                "student": await _student_summary(conn),
                "warden": await _warden_summary(conn),
                "mess_manager": await _mess_summary(conn),
                "dean": await _dean_summary(conn),
            },
        }
        return _json_safe(analysis)
    finally:
        await conn.close()


def build_role_file(analysis: dict[str, Any], role: str) -> dict[str, Any]:
    role_data = (analysis.get("roles") or {}).get(role, {})
    accessible_tables = role_data.get("accessible_tables", [])
    relevant_tables = {
        table: analysis.get("tables", {}).get(table)
        for table in accessible_tables
        if table in (analysis.get("tables") or {})
    }
    return {
        "generated_at": analysis.get("generated_at"),
        "database": analysis.get("database"),
        "global_summary": analysis.get("global_summary"),
        "role": role,
        "role_summary": role_data,
        "relevant_tables": relevant_tables,
    }


async def main() -> None:
    analysis = await build_analysis()
    target_dir = WORKSPACE_ROOT / "src" / "diff"
    target_dir.mkdir(parents=True, exist_ok=True)
    outputs = {
        "json_analysis.json": analysis,
        "global_analysis.json": {
            "generated_at": analysis.get("generated_at"),
            "database": analysis.get("database"),
            "global_summary": analysis.get("global_summary"),
            "tables": analysis.get("tables"),
        },
        "student_analysis.json": build_role_file(analysis, "student"),
        "warden_analysis.json": build_role_file(analysis, "warden"),
        "mess_manager_analysis.json": build_role_file(analysis, "mess_manager"),
        "dean_analysis.json": build_role_file(analysis, "dean"),
    }
    for filename, payload in outputs.items():
        target_file = target_dir / filename
        target_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        print(f"Wrote analysis to {target_file}")


if __name__ == "__main__":
    asyncio.run(main())
