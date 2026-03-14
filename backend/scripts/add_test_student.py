"""
Quick script to add the demo test student without re-running the full seed.
Run from backend/ directory:
  python -m scripts.add_test_student
"""
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import asyncpg
import bcrypt
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
DATABASE_URL = os.environ["DATABASE_URL"]


async def main():
    conn = await asyncpg.connect(DATABASE_URL)

    bh3_id = await conn.fetchval("SELECT id FROM hostels WHERE name='BH-3'")
    if not bh3_id:
        print("ERROR: BH-3 hostel not found — run the full seed first.")
        return

    pw_hash = bcrypt.hashpw(b"student123", bcrypt.gensalt()).decode()

    await conn.execute(
        """INSERT INTO users(name, roll_number, email, password_hash, hostel_id,
              branch, academic_year, height_cm, weight_kg, fitness_level,
              dietary_preference, allergens, role)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
           ON CONFLICT(roll_number) DO UPDATE SET password_hash=EXCLUDED.password_hash""",
        "Aditya Kumar", "2021EE10492", "2021ee10492@iitd.ac.in",
        pw_hash, bh3_id, "EE", 3,
        172.0, 68.0, "intermediate", "non-vegetarian", [], "student"
    )
    print("Test student inserted/updated: roll=2021EE10492 password=student123")
    await conn.close()


asyncio.run(main())
