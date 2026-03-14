# UniVitals — Full Functional Build Prompt
## Feed this entire file into your AI IDE. Build everything. Do not skip sections.
### FitFusion 2026 · Team Hercules · IIT Delhi

---

## BEFORE YOU WRITE A SINGLE LINE OF CODE

Read this entire document first. Every section exists for a reason. The architecture decisions, the security rules, the data shapes, and the build order are all intentional. Skipping ahead will cause you to build things in the wrong order and break dependencies.

When you are done reading, build in the exact sequence defined in Section 12. Do not reorder.

---

## SECTION 1 — WHAT YOU ARE BUILDING

You are building **UniVitals**, a privacy-first campus wellness intelligence platform for Indian university hostels.

The platform has one shared backend and two frontend products:

**Product 1 — Student Web App** (context only — do NOT build the UI, but DO build the backend and seed data it produces)
Students log daily: nutrition (what they ate from the mess menu), activity (type, duration, intensity, location), mood (1–5 score, emoji, energy, stress, optional journal), and sleep (bedtime, wake time, quality). This data flows into the database and is aggregated for the admin dashboard.

**Product 2 — Admin Dashboard** (BUILD THIS)
Three admin roles see anonymized, aggregated wellness data:
- **Warden** — one hostel (~100 students), sees wellness score distribution, activity trends, mood aggregate, nutrition gaps, auto-triggered alerts, can create initiatives
- **Mess Manager** — campus-wide nutrition data only, sees meal participation, quality ratings, nutrient gaps, manages weekly mess menu with allergen checking
- **Dean of Students** — entire campus, sees all hostels compared, academic calendar correlation with wellness dips, environmental (AQI) impact, long-term trends, generates institutional reports

**The core design principle:** Surface problems early. Enable proactive action. Never expose individuals.

---

## SECTION 2 — TECH STACK

Use exactly this stack. Do not substitute.

```
Backend:        FastAPI (Python 3.11+) — async REST API
Primary DB:     PostgreSQL 15
Secondary DB:   MongoDB
Cache:          Redis
Auth:           JWT via python-jose, HS256
Encryption:     cryptography.Fernet (AES-128-CBC + HMAC-SHA256)
Frontend:       React 18 + TailwindCSS + Recharts
HTTP client:    Axios with JWT interceptor
```

### Project structure

```
univitals/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── privacy.py
│   │   ├── models/
│   │   │   ├── warden.py
│   │   │   ├── mess.py
│   │   │   └── dean.py
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── warden.py
│   │       ├── mess.py
│   │       └── dean.py
│   ├── scripts/
│   │   └── seed_data.py
│   ├── .env
│   └── requirements.txt
└── frontend/
    └── src/
        └── admin/
            ├── pages/
            │   ├── Login.jsx
            │   ├── Unauthorized.jsx
            │   ├── warden/
            │   │   ├── WardenLayout.jsx
            │   │   ├── WardenOverview.jsx
            │   │   ├── ActivityReport.jsx
            │   │   ├── NutritionReport.jsx
            │   │   ├── MoodStressReport.jsx
            │   │   ├── WellnessAlerts.jsx
            │   │   ├── Initiatives.jsx
            │   │   └── WardenExport.jsx
            │   ├── mess/
            │   │   ├── MessLayout.jsx
            │   │   ├── MessOverview.jsx
            │   │   ├── MealRatings.jsx
            │   │   ├── NutrientAnalysis.jsx
            │   │   ├── MenuPlanner.jsx
            │   │   └── FeedbackLog.jsx
            │   └── dean/
            │       ├── DeanLayout.jsx
            │       ├── CampusOverview.jsx
            │       ├── HostelComparison.jsx
            │       ├── AcademicCorrelation.jsx
            │       ├── EnvironmentalImpact.jsx
            │       ├── WellnessTrends.jsx
            │       └── GenerateReport.jsx
            ├── components/
            │   ├── KPICard.jsx
            │   ├── AlertCard.jsx
            │   ├── PrivacyBanner.jsx
            │   ├── RoleBadge.jsx
            │   ├── NutrientGauge.jsx
            │   ├── HostelHeatmapGrid.jsx
            │   ├── InsightCard.jsx
            │   ├── EmptyState.jsx
            │   ├── DateRangeFilter.jsx
            │   └── ExportButton.jsx
            ├── api/
            │   ├── client.js
            │   ├── auth.js
            │   ├── warden.js
            │   ├── mess.js
            │   └── dean.js
            └── context/
                └── AdminAuthContext.jsx
```

---

## SECTION 3 — DATABASE SCHEMA

### 3.1 PostgreSQL (build all tables before running seed)

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- HOSTELS (create first, users reference it)
CREATE TABLE hostels (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(10) NOT NULL,
  type       VARCHAR(10) NOT NULL,
  capacity   INTEGER DEFAULT 100,
  warden_id  UUID
);

-- USERS
CREATE TABLE users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               VARCHAR(100) NOT NULL,
  roll_number        VARCHAR(20) UNIQUE NOT NULL,
  email              VARCHAR(150) UNIQUE NOT NULL,
  password_hash      VARCHAR NOT NULL,
  hostel_id          INTEGER REFERENCES hostels(id),
  branch             VARCHAR(50),
  academic_year      INTEGER CHECK (academic_year IN (1,2,3,4)),
  height_cm          FLOAT,
  weight_kg          FLOAT,
  fitness_level      VARCHAR(20) DEFAULT 'beginner',
  dietary_preference VARCHAR(30),
  allergens          TEXT[],
  role               VARCHAR(20) DEFAULT 'student',
  created_at         TIMESTAMP DEFAULT NOW()
);

ALTER TABLE hostels ADD CONSTRAINT fk_warden
  FOREIGN KEY (warden_id) REFERENCES users(id);

-- WELLNESS LOGS
CREATE TABLE wellness_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  wellness_score    FLOAT,
  activity_score    FLOAT,
  nutrition_score   FLOAT,
  mood_score        FLOAT,
  env_stress_score  FLOAT,
  sleep_hours       FLOAT,
  UNIQUE(user_id, date)
);
CREATE INDEX idx_wl_date ON wellness_logs(date);
CREATE INDEX idx_wl_user ON wellness_logs(user_id);

-- ACTIVITY LOGS
CREATE TABLE activity_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  activity_type    VARCHAR(50),
  duration_minutes INTEGER,
  intensity        VARCHAR(20),
  calories_burned  FLOAT,
  location         VARCHAR(20),
  notes            TEXT
);
CREATE INDEX idx_al_date ON activity_logs(date);
CREATE INDEX idx_al_user ON activity_logs(user_id);

-- NUTRITION LOGS
CREATE TABLE nutrition_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  meal_type         VARCHAR(20),
  food_items        JSONB,
  total_calories    FLOAT,
  total_protein     FLOAT,
  total_carbs       FLOAT,
  total_fat         FLOAT,
  total_fibre       FLOAT,
  meal_rating       INTEGER,
  meal_feedback_tag VARCHAR(30)
);
CREATE INDEX idx_nl_date ON nutrition_logs(date);
CREATE INDEX idx_nl_user ON nutrition_logs(user_id);
CREATE INDEX idx_nl_meal ON nutrition_logs(meal_type);

-- MOOD LOGS — NEVER queried by any admin endpoint. Ever.
CREATE TABLE mood_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  time_of_day  VARCHAR(20),
  mood_emoji   VARCHAR(20),
  mood_score   INTEGER,
  energy_level INTEGER,
  stress_level INTEGER
);

-- SLEEP LOGS
CREATE TABLE sleep_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  sleep_time    TIME,
  wake_time     TIME,
  sleep_hours   FLOAT,
  sleep_quality INTEGER,
  disruptions   INTEGER
);

-- FOOD ITEMS MASTER
CREATE TABLE food_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(100) NOT NULL,
  category          VARCHAR(50),
  calories_per_100g FLOAT,
  protein_per_100g  FLOAT,
  carbs_per_100g    FLOAT,
  fat_per_100g      FLOAT,
  fibre_per_100g    FLOAT,
  is_veg            BOOLEAN DEFAULT TRUE,
  allergens         TEXT[]
);

-- MESS MENU
CREATE TABLE mess_menu (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number        INTEGER,
  day_of_week        INTEGER,
  meal_type          VARCHAR(20),
  food_items         JSONB,
  estimated_calories FLOAT,
  estimated_protein  FLOAT,
  is_published       BOOLEAN DEFAULT FALSE,
  published_at       TIMESTAMP
);

-- ENVIRONMENTAL SNAPSHOTS
CREATE TABLE environmental_snapshots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at           TIMESTAMP NOT NULL,
  aqi                   INTEGER,
  aqi_category          VARCHAR(30),
  temperature_c         FLOAT,
  humidity_percent      FLOAT,
  weather_condition     VARCHAR(50),
  uv_index              FLOAT,
  noise_level_db        FLOAT,
  outdoor_activity_safe BOOLEAN,
  UNIQUE(recorded_at)
);
CREATE INDEX idx_env_at ON environmental_snapshots(recorded_at);

-- ADMIN ALERTS
CREATE TABLE admin_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id       INTEGER REFERENCES hostels(id),
  alert_type      VARCHAR(50),
  severity        VARCHAR(20),
  title           VARCHAR(200),
  description     TEXT,
  metric_value    FLOAT,
  threshold_value FLOAT,
  triggered_at    TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID REFERENCES users(id),
  action_note     TEXT,
  is_active       BOOLEAN DEFAULT TRUE
);

-- HOSTEL WELLNESS INITIATIVES
CREATE TABLE hostel_initiatives (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id    INTEGER REFERENCES hostels(id),
  created_by   UUID REFERENCES users(id),
  title        VARCHAR(200),
  description  TEXT,
  goal_type    VARCHAR(50),
  target_value FLOAT,
  start_date   DATE,
  end_date     DATE,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ACADEMIC CALENDAR EVENTS
CREATE TABLE academic_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(200),
  start_date DATE,
  end_date   DATE,
  event_type VARCHAR(30),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 MongoDB Collections

```javascript
// journal_entries — AES-256 encrypted, ZERO admin access
{
  _id: ObjectId,
  user_id: "uuid-string",
  date: ISODate,
  entry_text: "gAAAAABh...",   // Fernet ciphertext
  word_count: Number,
  created_at: ISODate
}

// wellness_nudges
{
  _id: ObjectId,
  user_id: "uuid-string",
  generated_at: ISODate,
  nudge_type: String,          // activity|nutrition|mental|environmental|sleep
  message: String,
  trigger: String,
  acknowledged: Boolean
}

// mess_feedback_unstructured
{
  _id: ObjectId,
  date: ISODate,
  meal_type: String,
  feedback_summary: {
    total_ratings: Number,
    avg_rating: Number,
    tag_counts: { tasty: 0, cold: 0, no_variety: 0, undercooked: 0, bland: 0 }
  }
}
```

### 3.3 Redis

Cache environmental snapshots with 30-minute TTL:
```python
KEY_PATTERN = "env:snapshot:{date}"   # e.g. env:snapshot:2026-03-14
TTL = 1800  # seconds
```

---

## SECTION 4 — SEED DATA

Write `backend/scripts/seed_data.py`. This script must be run once before any frontend work. Every chart in the admin dashboard depends on this data.

### Configuration

```python
NUM_STUDENTS = 1000
NUM_HOSTELS = 10
STUDENTS_PER_HOSTEL = 100
DAYS_OF_DATA = 90
BASE_DATE = date.today() - timedelta(days=90)

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

BRANCHES = ["CSE", "ECE", "ME", "CE", "EE", "Textile", "Chemical", "Mathematics"]
YEARS = [1, 2, 3, 4]
ACTIVITY_TYPES = ["running", "gym", "sports", "yoga", "cycling", "walking", "swimming"]
MEAL_TYPES = ["breakfast", "lunch", "snacks", "dinner"]
FEEDBACK_TAGS = ["tasty", "cold", "no_variety", "undercooked", "bland"]
```

### Per-student per-day simulation logic

```python
def simulate_student_day(day_index, base_mood, branch):
    is_exam = day_index in EXAM_DAYS
    aqi = generate_aqi(day_index)

    # Activity — drops during exams
    activity_base = random.gauss(45, 15)
    if is_exam:
        activity_base *= 0.65
    activity_minutes = round(max(0, min(90, activity_base)), 1)

    # Outdoor vs indoor split — shifts with AQI
    if aqi > 200:
        outdoor_pct = random.uniform(0.05, 0.15)
    elif aqi > 100:
        outdoor_pct = random.uniform(0.20, 0.40)
    else:
        outdoor_pct = random.uniform(0.50, 0.80)

    outdoor_min = activity_minutes * outdoor_pct
    indoor_min  = activity_minutes * (1 - outdoor_pct)
    activity_type = random.choice(ACTIVITY_TYPES)
    location = "outdoor" if outdoor_min > indoor_min else "indoor"

    # Nutrition — students undereat during exams
    calorie_ratio = random.gauss(0.92, 0.12)
    if is_exam:
        calorie_ratio *= 0.88
    total_calories = 2000 * max(0.4, calorie_ratio)
    total_protein  = total_calories * 0.15 / 4
    total_carbs    = total_calories * 0.55 / 4
    total_fat      = total_calories * 0.30 / 9
    total_fibre    = random.gauss(12, 4) if not is_exam else random.gauss(9, 3)

    # Sleep — less during exams
    sleep_base = random.gauss(7.0, 1.0)
    if is_exam:
        sleep_base -= random.uniform(0.8, 1.5)
    sleep_hours = round(max(3.5, min(10.5, sleep_base)), 1)

    # Mood — personal baseline with exam dip; CSE/ECE show steeper dip
    mood = base_mood + random.gauss(0, 0.4)
    if is_exam:
        exam_penalty = 1.5 if branch in ["CSE", "ECE"] else 1.1
        mood -= exam_penalty
    mood_score   = max(1, min(5, round(mood, 1)))
    stress_level = min(5, max(1, round(5 - mood + random.gauss(0, 0.3), 1)))
    energy_level = min(5, max(1, round(mood * 0.8 + random.gauss(0, 0.4), 1)))

    # Wellness score
    activity_score      = min(100.0, (activity_minutes / 45.0) * 100.0)
    nutrition_score     = max(0.0, min(100.0, 100.0 - abs(1.0 - calorie_ratio) * 80.0))
    env_stress_score    = min(100.0, max(0.0, (aqi - 50) / 2.5))
    mood_deviation      = min(100.0, abs(mood_score - base_mood) * 20.0)
    wellness_score = round(max(0.0, min(100.0,
        activity_score    * 0.35
        + nutrition_score * 0.30
        - env_stress_score * 0.15
        - mood_deviation  * 0.20
    )), 2)

    # Meal logging (simulate skips — breakfast most skipped during exams)
    meal_logs = []
    for meal in MEAL_TYPES:
        skip_prob = 0.15
        if meal == "breakfast": skip_prob = 0.30 if is_exam else 0.20
        if is_exam:              skip_prob += 0.10
        if random.random() > skip_prob:
            meal_logs.append({
                "meal_type":        meal,
                "total_calories":   total_calories / len(MEAL_TYPES) * random.gauss(1.0, 0.2),
                "total_protein":    total_protein  / len(MEAL_TYPES),
                "total_carbs":      total_carbs    / len(MEAL_TYPES),
                "total_fat":        total_fat      / len(MEAL_TYPES),
                "total_fibre":      total_fibre    / len(MEAL_TYPES),
                "meal_rating":      max(1, min(5, round(mood_score - random.uniform(0, 1.5) + 1))),
                "meal_feedback_tag": random.choice(FEEDBACK_TAGS),
            })

    return {
        "activity_minutes": activity_minutes,
        "activity_type":    activity_type,
        "location":         location,
        "outdoor_min":      outdoor_min,
        "indoor_min":       indoor_min,
        "total_calories":   round(total_calories, 1),
        "total_protein":    round(total_protein, 1),
        "total_carbs":      round(total_carbs, 1),
        "total_fat":        round(total_fat, 1),
        "total_fibre":      round(total_fibre, 1),
        "sleep_hours":      sleep_hours,
        "mood_score":       mood_score,
        "stress_level":     stress_level,
        "energy_level":     energy_level,
        "aqi":              aqi,
        "wellness_score":   wellness_score,
        "activity_score":   round(activity_score, 2),
        "nutrition_score":  round(nutrition_score, 2),
        "env_stress_score": round(env_stress_score, 2),
        "meal_logs":        meal_logs,
    }

def generate_aqi(day_index):
    if day_index in AQI_SPIKE_DAYS:
        return random.randint(180, 280)
    return random.randint(45, 140)
```

### Admin accounts to create (seed these users)

```python
ADMIN_ACCOUNTS = [
  # One warden per hostel
  {"name": "Warden BH-1", "email": "warden.bh1@iitd.ac.in", "role": "warden", "hostel": "BH-1"},
  {"name": "Warden BH-2", "email": "warden.bh2@iitd.ac.in", "role": "warden", "hostel": "BH-2"},
  {"name": "Warden BH-3", "email": "warden.bh3@iitd.ac.in", "role": "warden", "hostel": "BH-3"},
  {"name": "Warden BH-4", "email": "warden.bh4@iitd.ac.in", "role": "warden", "hostel": "BH-4"},
  {"name": "Warden BH-5", "email": "warden.bh5@iitd.ac.in", "role": "warden", "hostel": "BH-5"},
  {"name": "Warden GH-1", "email": "warden.gh1@iitd.ac.in", "role": "warden", "hostel": "GH-1"},
  {"name": "Warden GH-2", "email": "warden.gh2@iitd.ac.in", "role": "warden", "hostel": "GH-2"},
  {"name": "Warden GH-3", "email": "warden.gh3@iitd.ac.in", "role": "warden", "hostel": "GH-3"},
  {"name": "Warden GH-4", "email": "warden.gh4@iitd.ac.in", "role": "warden", "hostel": "GH-4"},
  {"name": "Warden GH-5", "email": "warden.gh5@iitd.ac.in", "role": "warden", "hostel": "GH-5"},
  # Mess and Dean
  {"name": "Mess Manager", "email": "mess@iitd.ac.in",  "role": "mess_manager", "hostel": None},
  {"name": "Dean of Students", "email": "dean@iitd.ac.in", "role": "dean",        "hostel": None},
]
# All admin passwords: "admin123" (bcrypt hashed)
```

### 30 food items to seed

```python
FOOD_ITEMS = [
  {"name": "Dal fry",          "cat": "dal",       "cal": 180, "pro": 9,   "carb": 28, "fat": 4,   "fibre": 6,   "veg": True,  "allergens": []},
  {"name": "Roti",             "cat": "staple",    "cal": 70,  "pro": 3,   "carb": 15, "fat": 0.5, "fibre": 2,   "veg": True,  "allergens": ["gluten"]},
  {"name": "Rice",             "cat": "staple",    "cal": 130, "pro": 2.7, "carb": 28, "fat": 0.3, "fibre": 0.4, "veg": True,  "allergens": []},
  {"name": "Paneer sabzi",     "cat": "vegetable", "cal": 220, "pro": 14,  "carb": 8,  "fat": 16,  "fibre": 2,   "veg": True,  "allergens": ["dairy"]},
  {"name": "Aloo sabzi",       "cat": "vegetable", "cal": 150, "pro": 3,   "carb": 25, "fat": 5,   "fibre": 3,   "veg": True,  "allergens": []},
  {"name": "Rajma",            "cat": "dal",       "cal": 200, "pro": 12,  "carb": 30, "fat": 4,   "fibre": 8,   "veg": True,  "allergens": []},
  {"name": "Chole",            "cat": "dal",       "cal": 210, "pro": 11,  "carb": 32, "fat": 5,   "fibre": 9,   "veg": True,  "allergens": []},
  {"name": "Mixed veg",        "cat": "vegetable", "cal": 120, "pro": 3,   "carb": 18, "fat": 4,   "fibre": 5,   "veg": True,  "allergens": []},
  {"name": "Palak paneer",     "cat": "vegetable", "cal": 240, "pro": 15,  "carb": 9,  "fat": 17,  "fibre": 3,   "veg": True,  "allergens": ["dairy"]},
  {"name": "Egg curry",        "cat": "non-veg",   "cal": 180, "pro": 13,  "carb": 5,  "fat": 12,  "fibre": 1,   "veg": False, "allergens": ["eggs"]},
  {"name": "Chicken curry",    "cat": "non-veg",   "cal": 250, "pro": 22,  "carb": 6,  "fat": 15,  "fibre": 1,   "veg": False, "allergens": []},
  {"name": "Sambar",           "cat": "dal",       "cal": 90,  "pro": 5,   "carb": 14, "fat": 2,   "fibre": 4,   "veg": True,  "allergens": []},
  {"name": "Idli (2 pcs)",     "cat": "staple",    "cal": 140, "pro": 4,   "carb": 28, "fat": 1,   "fibre": 2,   "veg": True,  "allergens": []},
  {"name": "Poha",             "cat": "staple",    "cal": 180, "pro": 3,   "carb": 35, "fat": 4,   "fibre": 2,   "veg": True,  "allergens": []},
  {"name": "Upma",             "cat": "staple",    "cal": 190, "pro": 4,   "carb": 32, "fat": 6,   "fibre": 3,   "veg": True,  "allergens": ["gluten"]},
  {"name": "Curd",             "cat": "dairy",     "cal": 100, "pro": 8,   "carb": 6,  "fat": 4,   "fibre": 0,   "veg": True,  "allergens": ["dairy"]},
  {"name": "Buttermilk",       "cat": "dairy",     "cal": 40,  "pro": 2,   "carb": 4,  "fat": 1,   "fibre": 0,   "veg": True,  "allergens": ["dairy"]},
  {"name": "Banana",           "cat": "fruit",     "cal": 90,  "pro": 1,   "carb": 23, "fat": 0.3, "fibre": 2.6, "veg": True,  "allergens": []},
  {"name": "Apple",            "cat": "fruit",     "cal": 80,  "pro": 0.4, "carb": 21, "fat": 0.2, "fibre": 3.5, "veg": True,  "allergens": []},
  {"name": "Boiled egg",       "cat": "non-veg",   "cal": 78,  "pro": 6,   "carb": 0.6,"fat": 5,   "fibre": 0,   "veg": False, "allergens": ["eggs"]},
  {"name": "Tea",              "cat": "beverage",  "cal": 40,  "pro": 1,   "carb": 6,  "fat": 1,   "fibre": 0,   "veg": True,  "allergens": ["dairy"]},
  {"name": "Milk",             "cat": "dairy",     "cal": 150, "pro": 8,   "carb": 12, "fat": 8,   "fibre": 0,   "veg": True,  "allergens": ["dairy"]},
  {"name": "Bread (2 slices)", "cat": "staple",    "cal": 140, "pro": 5,   "carb": 26, "fat": 2,   "fibre": 2,   "veg": True,  "allergens": ["gluten"]},
  {"name": "Sabzi (seasonal)", "cat": "vegetable", "cal": 100, "pro": 2.5, "carb": 15, "fat": 3.5, "fibre": 4,   "veg": True,  "allergens": []},
  {"name": "Khichdi",          "cat": "staple",    "cal": 200, "pro": 7,   "carb": 35, "fat": 5,   "fibre": 3,   "veg": True,  "allergens": []},
  {"name": "Paratha",          "cat": "staple",    "cal": 180, "pro": 4,   "carb": 28, "fat": 7,   "fibre": 2,   "veg": True,  "allergens": ["gluten", "dairy"]},
  {"name": "Halwa",            "cat": "snack",     "cal": 280, "pro": 3,   "carb": 42, "fat": 12,  "fibre": 1,   "veg": True,  "allergens": ["dairy", "gluten"]},
  {"name": "Biscuits",         "cat": "snack",     "cal": 200, "pro": 3,   "carb": 30, "fat": 8,   "fibre": 1,   "veg": True,  "allergens": ["gluten", "dairy"]},
  {"name": "Namkeen",          "cat": "snack",     "cal": 160, "pro": 4,   "carb": 18, "fat": 9,   "fibre": 2,   "veg": True,  "allergens": ["gluten"]},
  {"name": "Moong dal chilla", "cat": "staple",    "cal": 160, "pro": 10,  "carb": 22, "fat": 4,   "fibre": 5,   "veg": True,  "allergens": []},
]
```

### Alert auto-generation (run AFTER inserting all wellness data)

```python
def generate_alerts(hostel_id, hostel_daily_aggregates):
    """
    hostel_daily_aggregates: list of 90 dicts with daily hostel averages.
    Returns list of alert dicts to insert into admin_alerts.
    """
    alerts = []
    WINDOW = 5  # consecutive days

    for day in range(WINDOW, 90):
        window = hostel_daily_aggregates[day - WINDOW:day]
        triggered_at = BASE_DATE + timedelta(days=day)

        avg_sleep  = sum(d["avg_sleep"]        for d in window) / WINDOW
        avg_mood   = sum(d["avg_mood"]         for d in window) / WINDOW
        avg_cal    = sum(d["avg_calories"]      for d in window) / WINDOW
        avg_act_p  = sum(d["activity_pct"]     for d in window) / WINDOW
        avg_stress = sum(d["high_stress_pct"]  for d in window) / WINDOW
        aqi_today  = hostel_daily_aggregates[day]["avg_aqi"]

        if avg_sleep < 6.5:
            alerts.append({"hostel_id": hostel_id, "alert_type": "sleep_deficit",
                "severity": "warning", "title": "Sleep deficit persisting",
                "description": f"Average sleep has been {avg_sleep:.1f} hrs for {WINDOW} days (threshold: 6.5 hrs)",
                "metric_value": avg_sleep, "threshold_value": 6.5, "triggered_at": triggered_at})

        if avg_mood < 2.5:
            alerts.append({"hostel_id": hostel_id, "alert_type": "mood_crisis",
                "severity": "critical", "title": "Sustained low mood in your hostel",
                "description": f"Average mood score has been below 2.5 for {WINDOW} consecutive days",
                "metric_value": avg_mood, "threshold_value": 2.5, "triggered_at": triggered_at})

        if avg_act_p < 0.35:
            alerts.append({"hostel_id": hostel_id, "alert_type": "activity_drought",
                "severity": "warning", "title": "Activity participation has dropped significantly",
                "description": f"Only {avg_act_p*100:.0f}% of hostel logged activity in the past {WINDOW} days",
                "metric_value": avg_act_p * 100, "threshold_value": 35, "triggered_at": triggered_at})

        if avg_cal < 1600:
            alerts.append({"hostel_id": hostel_id, "alert_type": "nutrition_gap",
                "severity": "info", "title": "Students may be undereating",
                "description": f"Average logged calorie intake is {avg_cal:.0f} kcal — below 1,600 kcal threshold",
                "metric_value": avg_cal, "threshold_value": 1600, "triggered_at": triggered_at})

        if avg_stress > 0.50:
            alerts.append({"hostel_id": hostel_id, "alert_type": "high_stress",
                "severity": "warning", "title": "High stress levels being reported",
                "description": f"{avg_stress*100:.0f}% of mood check-ins this week rated stress as high",
                "metric_value": avg_stress * 100, "threshold_value": 50, "triggered_at": triggered_at})

        if aqi_today > 150:
            alerts.append({"hostel_id": hostel_id, "alert_type": "environmental",
                "severity": "info", "title": "Outdoor activity not recommended today",
                "description": f"Current AQI is {aqi_today} (Poor). Advise students to exercise indoors.",
                "metric_value": aqi_today, "threshold_value": 150, "triggered_at": triggered_at})

    # Deduplicate: keep only first occurrence of each type per hostel
    seen = set()
    unique = []
    for a in alerts:
        key = (a["hostel_id"], a["alert_type"])
        if key not in seen:
            seen.add(key)
            unique.append(a)
    return unique
```

---

## SECTION 5 — SECURITY LAYER

These 5 rules are non-negotiable. Build them before any endpoint that returns data.

### Rule 1 — JWT with role and hostel scope

```python
# app/auth.py
import os
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = os.environ["JWT_SECRET"]
ALGORITHM  = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/auth/login")

def create_token(user: dict) -> str:
    payload = {
        "sub":  str(user["id"]),
        "role": user["role"],
        "name": user["name"],
        "iat":  datetime.utcnow(),
        "exp":  datetime.utcnow() + timedelta(hours=24),
    }
    if user["role"] == "warden":
        payload["hostel_id"] = user["hostel_name"]   # e.g. "BH-3"
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def require_role(*roles: str):
    async def dep(payload: dict = Depends(decode_token)):
        if payload.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return payload
    return Depends(dep)
```

### Rule 2 — Hostel scope from JWT (NEVER from request)

```python
# In every warden endpoint — hostel_name comes from token, not URL/body
@router.get("/api/admin/warden/overview")
async def warden_overview(user=require_role("warden", "dean"), db=Depends(get_db)):
    hostel_name = user["hostel_id"]   # always from JWT
    # Use hostel_name in all SQL WHERE clauses
    ...
```

### Rule 3 — K-anonymity on every admin response

```python
# app/privacy.py
K = 30  # minimum group size

def enforce_k_anonymity(obj):
    if isinstance(obj, dict):
        n = obj.get("count") or obj.get("n") or obj.get("total")
        if n is not None and isinstance(n, (int, float)) and n < K:
            return {"suppressed": True, "reason": f"Group size below minimum threshold ({K})", "count": None}
        return {k: enforce_k_anonymity(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [enforce_k_anonymity(i) for i in obj]
    return obj

# Call at the end of EVERY admin endpoint before return:
# return enforce_k_anonymity(data)
```

### Rule 4 — AES-256 journal encryption

```python
# app/privacy.py (continued)
from cryptography.fernet import Fernet

_fernet = Fernet(os.environ["JOURNAL_ENCRYPTION_KEY"].encode())

def encrypt_journal(text: str) -> str:
    return _fernet.encrypt(text.encode()).decode()

def decrypt_journal(ciphertext: str, requesting_user_id: str, entry_user_id: str) -> str:
    if requesting_user_id != entry_user_id:
        raise PermissionError("Journal entries are private to their author")
    return _fernet.decrypt(ciphertext.encode()).decode()
```

### Rule 5 — mood_logs NEVER in admin queries

```python
# CORRECT — admin mood data comes from wellness_logs.mood_score only
ADMIN_MOOD_QUERY = """
    SELECT wl.date, AVG(wl.mood_score) as avg_mood, COUNT(*) as n
    FROM wellness_logs wl
    JOIN users u  ON u.id       = wl.user_id
    JOIN hostels h ON h.id      = u.hostel_id
    WHERE h.name = $1
      AND wl.date >= NOW() - INTERVAL '{days} days'
    GROUP BY wl.date ORDER BY wl.date
"""
# mood_logs table is NEVER referenced in any admin router or query.
```

---

## SECTION 6 — WELLNESS SCORE FORMULA

Implement this exactly. Used both in seed_data.py and in the live score computation endpoint.

```python
def compute_wellness_score(
    activity_minutes: float,
    calorie_ratio: float,     # actual_calories / target_calories
    aqi: int,
    mood_score: float,
    rolling_7day_mood_avg: float,
) -> dict:
    activity_score      = min(100.0, (activity_minutes / 45.0) * 100.0)
    nutrition_score     = max(0.0, min(100.0, 100.0 - abs(1.0 - calorie_ratio) * 80.0))
    env_stress_score    = min(100.0, max(0.0, (aqi - 50) / 2.5))
    mood_deviation_score = min(100.0, abs(mood_score - rolling_7day_mood_avg) * 20.0)

    score = (
          activity_score      * 0.35
        + nutrition_score     * 0.30
        - env_stress_score    * 0.15
        - mood_deviation_score * 0.20
    )
    score = round(max(0.0, min(100.0, score)), 2)

    if score >= 80:   label = "Thriving"
    elif score >= 60: label = "Good"
    elif score >= 40: label = "Fair"
    else:             label = "Needs Attention"

    return {
        "wellness_score": score, "label": label,
        "components": {
            "activity_score": round(activity_score, 2),
            "nutrition_score": round(nutrition_score, 2),
            "env_stress_score": round(env_stress_score, 2),
            "mood_deviation_score": round(mood_deviation_score, 2),
        }
    }
```

**Wellness score label colors:**
```javascript
const WELLNESS_COLORS = {
  "Thriving":        "#1D9E75",   // green
  "Good":            "#639922",   // yellow-green
  "Fair":            "#BA7517",   // amber
  "Needs Attention": "#E24B4A",   // red
};
```

---

## SECTION 7 — CPCB AQI COLOR SCALE

Use the Indian CPCB standard everywhere AQI is shown. Not US AirNow.

```javascript
const CPCB_AQI_SCALE = [
  { max: 50,       color: "#55a84f", label: "Good",         bgColor: "#EAF3DE" },
  { max: 100,      color: "#a3c853", label: "Satisfactory", bgColor: "#F1EFE8" },
  { max: 200,      color: "#fff833", label: "Moderate",     bgColor: "#FAEEDA" },
  { max: 300,      color: "#f29c33", label: "Poor",         bgColor: "#FAECE7" },
  { max: 400,      color: "#e93f33", label: "Very Poor",    bgColor: "#FCEBEB" },
  { max: Infinity, color: "#af2d24", label: "Severe",       bgColor: "#FCEBEB" },
];

function getAQIInfo(aqi) {
  return CPCB_AQI_SCALE.find(s => aqi <= s.max);
}
```

---

## SECTION 8 — ALL API ENDPOINTS

Implement every endpoint listed. All admin endpoints call `enforce_k_anonymity()` before returning.

### 8.1 Auth

```
POST /api/admin/auth/login
  Body:    { email: string, password: string }
  Returns: { token: string, role: string, name: string, hostel_id: string|null }
  Logic:   bcrypt.verify(password, hash) → create_token(user)
```

### 8.2 Warden endpoints (role: warden | dean)

All queries scope to warden's hostel_id from JWT.

```
GET /api/admin/warden/overview
  Returns:
    hostel_name, today (date string)
    kpis:
      logged_today:           { value, total, pct, trend_vs_yesterday }
      avg_wellness_score:     { value, label, trend_vs_last_week }
      needs_attention_count:  { value, color }
      weekly_participation:   { value_pct, trend_vs_last_week }
    score_distribution:
      thriving / good / fair / needs_attention: { count, pct }
    weekly_trend: [{ date, avg_score, n_logged }]   — 28 days
    activity_snapshot:
      logged_today, did_not_log
      top_types: [{ type, count }]
    signals:
      sleep:            { avg_hours, color, label }
      mood:             { trend_pct, color, label }
      outdoor_activity: { drop_pct, avg_aqi, color }

GET /api/admin/warden/activity?range=7d|14d|30d&academic_year=all|1|2|3|4
  Returns:
    daily_trend: [{ date, avg_minutes, participation_pct }]
    type_breakdown: [{ week, running, gym, sports, yoga, cycling, walking, other }]
    indoor_outdoor: [{ week, indoor_min, outdoor_min, avg_aqi }]
    participation_trend: [{ date, pct }]
    insight: string

GET /api/admin/warden/nutrition?range=7d|14d|30d&meal_type=all|breakfast|lunch|snacks|dinner
  Returns:
    calorie_trend: [{ date, avg_calories, n_logged }]
    macro_breakdown: [{ week, protein_g, carbs_g, fat_g, protein_pct_rda, carbs_pct_rda, fat_pct_rda }]
    meal_skip_rates: { breakfast, lunch, snacks, dinner }   — each as pct
    mess_quality: { breakfast, lunch, snacks, dinner }      — each { avg_rating, trend_30d }
    feedback_tags: [{ tag, count }]
    nutrient_gauges: { calories, protein, carbs, fat, fibre }  — each { avg, rda, pct, status }
    nutrient_insight: string

GET /api/admin/warden/mood?range=7d|14d|30d
  Returns:   (wellness_logs only — mood_logs never queried)
    mood_trend: [{ date, avg_mood, n }]
    heatmap: [{ date, avg_mood, n, suppressed? }]   — 30 days
    stress_distribution: [{ week, low_pct, moderate_pct, high_pct }]
    time_of_day_pattern: { morning, afternoon, evening, night }
    mood_dip_alert: { active: bool, days: int } | null

GET /api/admin/warden/alerts
  Returns:
    active: [Alert]
    history: [Alert]   — last 60 days

POST /api/admin/warden/alerts/{alert_id}/acknowledge
  Body:    { note?: string }
  Returns: { acknowledged: true, timestamp: string }

GET /api/admin/warden/initiatives
  Returns:
    active: [Initiative]
    past: [Initiative]

POST /api/admin/warden/initiatives
  Body:    { title, description, goal_type, target_value, start_date, end_date }
  Returns: created Initiative

GET /api/admin/warden/export?report_type=weekly|monthly|activity|nutrition&range=7d|30d&format=csv
  Returns: CSV file download (Content-Disposition: attachment)
  K-anonymity: groups < 30 → "N/A — insufficient data"
```

### 8.3 Mess manager endpoints (role: mess_manager | dean)

```
GET /api/admin/mess/overview
  Returns:
    kpis:
      avg_meal_rating_today: { value, n_ratings, trend }
      total_meals_logged_today: { value }
      highest_skip_rate_today: { meal, pct, color }
      worst_rated_meal_week: { meal, day, rating }
    participation_chart: [{ day, breakfast, lunch, snacks, dinner }]   — 7 days
    rating_trend: [{ date, breakfast, lunch, snacks, dinner }]         — 30 days
    insight: string

GET /api/admin/mess/ratings?range=7d|30d&meal_type=all|...&day_of_week=all|0-6
  Returns:
    table: [{ date, day_name, meal_type, avg_rating, n_ratings, top_tag, second_tag }]
    worst_meals: [{ meal_name, day, date, rating, complaint_tag }]   — top 10
    best_meals:  [{ meal_name, day, date, rating, positive_tag }]   — top 10
    tag_frequencies: [{ tag, count, type: positive|negative }]

GET /api/admin/mess/nutrients?range=7d|30d
  Returns:
    gauges: { calories, protein, carbs, fat, fibre }
      each: { avg, rda, pct, status: ok|warning|deficient }
    macro_trend: [{ week, protein_g, carbs_g, fat_g }]   — 12 weeks
    recommendations: [{ nutrient, message }]

GET /api/admin/mess/menu?week_number=N
  Returns:
    grid: {
      monday:    { breakfast: Slot|null, lunch: Slot|null, snacks: Slot|null, dinner: Slot|null },
      tuesday:   { ... },
      ...
      sunday:    { ... }
    }
    daily_totals: { monday: { calories, protein }, ... }
    is_published: bool

POST /api/admin/mess/menu
  Body:    { week_number, day_of_week, meal_type, food_items: [{food_id, quantity_g}] }
  Returns:
    menu_entry: Slot
    nutrition_totals: { calories, protein, carbs, fat, fibre }
    allergen_conflicts: [{ allergen, affected_count }]   — count only, never names

PUT /api/admin/mess/menu/{menu_id}
  Body:    same as POST
  Returns: updated Slot with nutrition_totals and allergen_conflicts

POST /api/admin/mess/menu/publish
  Body:    { week_number }
  Returns: { published: true, week_number, published_at }

GET /api/admin/mess/feedback?range=7d|30d|90d&meal_type=all|...
  Returns:
    table: [{ date, meal_type, avg_rating, n_ratings, positive_tags, negative_tags }]
    ratio_trend: [{ week, positive_ratio, negative_ratio }]   — 12 weeks
    complaint_breakdown: { cold, bland, no_variety, undercooked, too_spicy, too_oily }
```

### 8.4 Dean endpoints (role: dean)

```
GET /api/admin/dean/campus-overview
  Returns:
    kpis:
      active_today:          { value, total, pct }
      campus_wellness_score: { value, label, trend }
      needs_attention:       { count }
      avg_activity_min:      { value, trend }
      avg_sleep_hours:       { value, color }
      campus_mood_index:     { value, label }
    hostel_heatmap: [{ hostel, avg_score, label, color, active_today, top_alert }]
    seven_week_trend: [{ week, BH-1, BH-2, BH-3, BH-4, BH-5, GH-1, GH-2, GH-3, GH-4, GH-5 }]
    top_alerts: [Alert]   — top 3 most critical campus-wide

GET /api/admin/dean/hostel-comparison?metric=wellness_score|activity|nutrition|sleep|mood|stress&range=30d
  Returns:
    bar_data: [{ hostel, value, rank, campus_avg }]   — sorted descending
    radar_data: [{ axis, hostel_values_map }]
    year_breakdown: { hostel: { year1, year2, year3, year4 } }
    gender_comparison: { boys: { score, activity, sleep }, girls: { ... } }

GET /api/admin/dean/academic-correlation?range=90d
  Returns:
    daily_wellness: [{ date, avg_score, avg_sleep, avg_activity, is_exam_day, event_name? }]
    branch_trends: [{ date, CSE, ECE, ME, CE, EE, Textile, Chemical, Mathematics }]
    mood_stress_correlation: [{ date, avg_mood, avg_stress }]
    finding_cards: [{ title, stat, text }]   — 3 auto-generated
    recommendations: [string]   — 3 action suggestions

POST /api/admin/dean/academic-calendar
  Body:    { events: [{ name, start_date, end_date, type }] }
  Returns: { saved: true, count: N }

GET /api/admin/dean/environmental-impact?range=90d
  Returns:
    current: { aqi, aqi_category, aqi_color, temperature_c, humidity_pct, uv_index }
    aqi_trend: [{ date, aqi, category, color }]
    scatter_data: [{ aqi, outdoor_minutes }]
    regression: { slope, intercept, r_squared }
    env_stress_trend: [{ date, env_stress_score }]
    activity_shift: [
      { aqi_tier: "normal|elevated|high", indoor_min, outdoor_min, total_min }
    ]
    recommendations: [string]

GET /api/admin/dean/wellness-trends?branch=all&hostel_type=all|boys|girls&academic_year=all|1|2|3|4&range=90d
  Returns:
    semester_trajectory: [{ day, avg_score, avg_activity, avg_sleep }]
    branch_ranking: [{ branch, avg_score }]   — sorted descending
    year_comparison: { year1, year2, year3, year4 }
      each: { wellness, activity, sleep, nutrition }
    gender_comparison: { boys: {...}, girls: {...} }
    longitudinal_insight: string

POST /api/admin/dean/generate-report
  Body:    { report_type, scope: { hostels?, academic_year? }, date_range: { start, end }, format: csv }
  Returns: CSV file download
  K-anonymity enforced: groups < 30 → "N/A — insufficient data"

GET /api/admin/dean/reports
  Returns: [{ report_id, report_type, generated_at, format, download_url }]   — last 20
```

---

## SECTION 9 — FRONTEND: ALL PAGES AND COMPONENTS

### 9.1 Shared UI (build these first, they are used everywhere)

#### AdminAuthContext.jsx

```jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(localStorage.getItem("admin_token"));
  const navigate          = useNavigate();

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        logout();
      } else {
        setUser(payload);
      }
    }
  }, [token]);

  function login(tokenStr) {
    localStorage.setItem("admin_token", tokenStr);
    setToken(tokenStr);
    const payload = JSON.parse(atob(tokenStr.split(".")[1]));
    setUser(payload);
    const routes = { warden: "/admin/warden/overview", mess_manager: "/admin/mess/overview", dean: "/admin/dean/overview" };
    navigate(routes[payload.role] || "/admin/login");
  }

  function logout() {
    localStorage.removeItem("admin_token");
    setToken(null);
    setUser(null);
    navigate("/admin/login");
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

#### api/client.js

```javascript
import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000" });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("admin_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("admin_token");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);

export default api;
```

#### PrivacyBanner.jsx (import into EVERY layout — never omit)

```jsx
export function PrivacyBanner() {
  return (
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-2 text-xs text-gray-500 flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
      All data is anonymized and aggregated. Individual student data is never displayed.
      Minimum group size for any metric: <strong>30 students</strong>.
    </div>
  );
}
```

#### KPICard.jsx

```jsx
export function KPICard({ label, value, subtext, color = "default", trend }) {
  const colors = {
    green:   "text-green-600",
    amber:   "text-amber-600",
    red:     "text-red-600",
    default: "text-gray-900",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-semibold ${colors[color]}`}>{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      {trend !== undefined && (
        <p className={`text-xs mt-1 ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)} vs last week
        </p>
      )}
    </div>
  );
}
```

#### AlertCard.jsx

```jsx
const SEVERITY = {
  critical: { bg: "bg-red-50",    border: "border-red-200",   badge: "bg-red-100 text-red-700",    dot: "bg-red-500" },
  warning:  { bg: "bg-amber-50",  border: "border-amber-200", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  info:     { bg: "bg-blue-50",   border: "border-blue-200",  badge: "bg-blue-100 text-blue-700",   dot: "bg-blue-500" },
};

export function AlertCard({ alert, onAcknowledge }) {
  const s = SEVERITY[alert.severity];
  return (
    <div className={`${s.bg} ${s.border} border rounded-xl p-4 mb-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`w-2 h-2 rounded-full ${s.dot} mt-1.5 flex-shrink-0`} />
          <div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.badge}`}>
              {alert.severity.toUpperCase()}
            </span>
            <p className="font-medium text-sm mt-1">{alert.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{alert.description}</p>
            <p className="text-xs text-gray-400 mt-1">
              Triggered: {new Date(alert.triggered_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        {alert.is_active && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-white flex-shrink-0"
          >
            Acknowledge
          </button>
        )}
      </div>
    </div>
  );
}
```

#### NutrientGauge.jsx

```jsx
const RDA = { calories: 2000, protein: 60, carbs: 275, fat: 65, fibre: 30 };
const UNITS = { calories: "kcal", protein: "g", carbs: "g", fat: "g", fibre: "g" };

export function NutrientGauge({ nutrient, avg }) {
  const rda = RDA[nutrient];
  const pct = Math.round((avg / rda) * 100);
  const color = pct >= 90 && pct <= 110 ? "bg-green-500"
              : pct >= 70              ? "bg-amber-500"
                                       : "bg-red-500";
  const icon = pct >= 90 && pct <= 110 ? "✓" : pct >= 70 ? "⚠" : "✗";

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="capitalize font-medium">{nutrient}</span>
        <span className="text-gray-500">
          {Math.round(avg)} / {rda} {UNITS[nutrient]} ({pct}%) {icon}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}
```

#### EmptyState.jsx

```jsx
export function EmptyState({ message = "No data available for this period" }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-gray-300">
      <div className="text-5xl mb-3">—</div>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
```

#### DateRangeFilter.jsx

```jsx
const PRESETS = ["7d", "14d", "30d", "90d"];

export function DateRangeFilter({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {PRESETS.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            value === p
              ? "bg-gray-900 text-white border-gray-900"
              : "border-gray-200 text-gray-500 hover:border-gray-400"
          }`}
        >
          {p === "7d" ? "This week" : p === "14d" ? "2 weeks" : p === "30d" ? "1 month" : "3 months"}
        </button>
      ))}
    </div>
  );
}
```

#### HostelHeatmapGrid.jsx (Dean only)

```jsx
function getWellnessColor(score) {
  if (score >= 80) return "#1D9E75";
  if (score >= 60) return "#639922";
  if (score >= 40) return "#BA7517";
  return "#E24B4A";
}

export function HostelHeatmapGrid({ data, onSelect }) {
  const boys  = ["BH-1","BH-2","BH-3","BH-4","BH-5"];
  const girls = ["GH-1","GH-2","GH-3","GH-4","GH-5"];

  function Tile({ hostel }) {
    const d = data[hostel] || {};
    const color = getWellnessColor(d.avg_score);
    return (
      <div
        onClick={() => onSelect(hostel, d)}
        className="p-3 rounded-xl cursor-pointer border transition-all hover:shadow-md"
        style={{ backgroundColor: color + "20", borderColor: color + "40" }}
      >
        <p className="text-xs font-medium text-gray-600">{hostel}</p>
        <p className="text-xl font-semibold" style={{ color }}>
          {d.avg_score?.toFixed(1) ?? "—"}
        </p>
        <p className="text-xs text-gray-400">{d.active_today ?? 0} active today</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">{boys.map(h  => <Tile key={h} hostel={h} />)}</div>
      <div className="space-y-2">{girls.map(h => <Tile key={h} hostel={h} />)}</div>
    </div>
  );
}
```

### 9.2 Layout components

#### WardenLayout.jsx

```jsx
import { NavLink, Outlet } from "react-router-dom";
import { PrivacyBanner } from "../../components/PrivacyBanner";
import { useAuth } from "../../context/AdminAuthContext";

const NAV = [
  { to: "/admin/warden/overview",   label: "Overview" },
  { to: "/admin/warden/activity",   label: "Activity report" },
  { to: "/admin/warden/nutrition",  label: "Nutrition report" },
  { to: "/admin/warden/mood",       label: "Mood & stress" },
  { to: "/admin/warden/alerts",     label: "Wellness alerts" },
  { to: "/admin/warden/initiatives",label: "Initiatives" },
  { to: "/admin/warden/export",     label: "Export" },
];

export default function WardenLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900">UniVitals</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Warden</span>
          <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-700">Log out</button>
        </div>
      </header>
      <PrivacyBanner />
      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-52 bg-white border-r border-gray-200 p-4 flex flex-col gap-1">
          {NAV.map(n => (
            <NavLink
              key={n.to} to={n.to}
              className={({ isActive }) =>
                `text-sm px-3 py-2 rounded-lg transition-colors ${
                  isActive ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-500 hover:text-gray-800"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
          <div className="mt-auto pt-4 text-xs text-gray-400 px-3">
            Data refreshed 3 min ago
          </div>
        </nav>
        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

Build `MessLayout.jsx` and `DeanLayout.jsx` with the same structure, replacing nav links and role badge colors (orange for mess, purple for dean).

### 9.3 Warden pages — component specifications

#### WardenOverview.jsx

Fetches `/api/admin/warden/overview`. Renders in this exact order:

1. **Page header** — hostel name (large), today's date (small), "Showing data for your hostel only"
2. **KPI cards row** — 4 `KPICard` components side by side
3. **Score distribution bar** — Recharts `BarChart` horizontal, 4 stacked segments
4. **Auto callout card** — only shows if `needs_attention.pct > 15`. Amber background, warning icon, CTA button linking to initiatives
5. **Two-column row** — left 60%: 28-day line chart; right 40%: activity donut + top types list
6. **Signal cards row** — 3 cards with colored dot, headline, context line

**28-day line chart (Recharts):**
```jsx
<ResponsiveContainer width="100%" height={220}>
  <LineChart data={weeklyTrend}>
    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
    <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} />
    <YAxis domain={[0, 100]} />
    <Tooltip />
    <ReferenceLine y={60} stroke="#9ca3af" strokeDasharray="4 4" label={{ value: "Good threshold", position: "right", fontSize: 10 }} />
    {/* Add ReferenceArea for exam weeks if data includes is_exam_week flag */}
    <Line type="monotone" dataKey="avg_score" stroke="#534AB7" strokeWidth={2} dot={false} />
  </LineChart>
</ResponsiveContainer>
```

**Activity donut:**
```jsx
<ResponsiveContainer width="100%" height={160}>
  <PieChart>
    <Pie data={[
      { name: "Logged", value: activitySnapshot.logged_today },
      { name: "Did not log", value: activitySnapshot.did_not_log },
    ]} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
      <Cell fill="#534AB7" />
      <Cell fill="#E5E7EB" />
    </Pie>
  </PieChart>
</ResponsiveContainer>
```

#### ActivityReport.jsx

Fetches `/api/admin/warden/activity` with range and academic_year params. Renders:

1. **Filters row** — `DateRangeFilter` + academic year pill buttons
2. **Daily active minutes** — `LineChart` with reference at 45
3. **Activity type stacked bar** — `BarChart` with 7 colored segments
4. **Indoor vs outdoor** — `ComposedChart` with dual bars + AQI `Line` on secondary Y axis
5. **Participation rate** — `LineChart` with reference at 50%
6. **Insight card** — plain language string from API

#### NutritionReport.jsx

Fetches `/api/admin/warden/nutrition`. Renders:

1. **Filters** — date range + meal type selector
2. **Calorie intake line chart** — with `ReferenceArea` for 1800–2500 band
3. **Macro breakdown grouped bar** — red fill if any bar's `*_pct_rda` < 80
4. **Meal skip rates** — grouped bar, color per bar based on skip %
5. **Mess quality section** — 4 star ratings in a row + feedback tag badges
6. **Nutrient deficiency panel** — 5 `NutrientGauge` components

**Skip rate bar color:**
```javascript
function skipBarColor(pct) {
  if (pct < 20) return "#1D9E75";
  if (pct < 40) return "#BA7517";
  return "#E24B4A";
}
```

#### MoodStressReport.jsx

Fetches `/api/admin/warden/mood`. **Always render the privacy statement first:**

```jsx
<div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
  <p className="text-sm font-medium text-purple-800 mb-1">Privacy note</p>
  <p className="text-xs text-purple-700 leading-relaxed">
    Mood data shown here is aggregated across your entire hostel. No individual student's
    mood, energy, or stress scores are visible. Individual journal entries are never
    accessible to any admin role. Minimum group size enforced: 30 students.
  </p>
</div>
```

Then render:
1. Mood trend line chart — 3 `ReferenceArea` bands (positive/neutral/concerning)
2. 30-day heatmap calendar grid — CSS grid, color per cell from `getMoodColor(score)`, hatched pattern if `suppressed === true`
3. Weekly stress distribution stacked bar
4. Time-of-day grouped bar
5. Mood dip alert card (if `mood_dip_alert.active`)

**Heatmap calendar cell:**
```jsx
function MoodCell({ day }) {
  if (day.suppressed) {
    return (
      <div className="w-full aspect-square rounded bg-gray-100 flex items-center justify-center"
           title="Insufficient data (< 30 students)">
        <span className="text-gray-300 text-xs">—</span>
      </div>
    );
  }
  return (
    <div className="w-full aspect-square rounded" title={`${day.date}: ${day.avg_mood?.toFixed(1)}`}
         style={{ backgroundColor: getMoodColor(day.avg_mood) }} />
  );
}
```

#### WellnessAlerts.jsx

Fetches `/api/admin/warden/alerts`. Renders:

1. **Active alerts section** — maps `data.active` → `AlertCard` components with acknowledge button
2. **Alert history accordion** — collapsible list, filter controls (type / severity / date)

#### Initiatives.jsx

1. **Create form** — title input, description textarea, goal type pill selector (Activity/Nutrition/Sleep), target number input, date range pickers, submit button
2. **Active initiatives** — card grid with title, goal, date range, participation % bar
3. **Past initiatives** — table with all fields

#### WardenExport.jsx

Simple form: report type radio, date range, format (CSV only for hackathon), generate button → download link. Show last 10 exports in a table.

### 9.4 Mess manager pages

#### MessOverview.jsx

Fetches `/api/admin/mess/overview`. 4 KPI cards + participation grouped bar (7 days) + rating trend 4-line chart (30 days) + insight card.

**Rating trend — highlight lines below 3.0:**
```jsx
// In the Recharts LineChart, use custom dot or stroke color per line based on latest value
<Line dataKey="dinner" stroke={latestRatings.dinner < 3.0 ? "#E24B4A" : "#534AB7"} strokeWidth={2} />
```

#### MealRatings.jsx

Fetches `/api/admin/mess/ratings`. Filters at top (date range, meal type, day of week). Then:

1. Sortable table — click column headers to sort. Row background by rating.
2. Worst 10 + Best 10 side by side cards
3. Feedback tag badges — sorted by frequency, color by type

#### NutrientAnalysis.jsx

Fetches `/api/admin/mess/nutrients`. Renders 5 `NutrientGauge` + 12-week macro `LineChart` + recommendations list.

#### MenuPlanner.jsx

This is the most complex component. Build it carefully.

```jsx
// State
const [weekNumber, setWeekNumber] = useState(currentWeek());
const [menuGrid, setMenuGrid] = useState({});
const [editingSlot, setEditingSlot] = useState(null);  // { day, meal }
const [selectedItems, setSelectedItems] = useState([]);  // [{food_id, quantity_g}]
const [foodItemsDB, setFoodItemsDB] = useState({});      // id → food item data
const [allergenConflicts, setAllergenConflicts] = useState([]);
const [nutritionTotals, setNutritionTotals] = useState(null);

// Grid renders 4 rows × 7 columns
// Each cell: shows current food items or "+ Add"
// Click → opens side panel for that (day, meal)

// Side panel:
// - Search food items (filter foodItemsDB by name)
// - Select item → add to selectedItems with quantity input
// - Live nutritional totals (calculateMealNutrition())
// - Allergen conflicts (shown after any save)

// Save button → POST /api/admin/mess/menu
// Publish button → POST /api/admin/mess/menu/publish

function calculateMealNutrition(items, db) {
  return items.reduce((t, item) => {
    const f = db[item.food_id];
    if (!f) return t;
    const factor = item.quantity_g / 100;
    return {
      calories: t.calories + f.calories_per_100g * factor,
      protein:  t.protein  + f.protein_per_100g  * factor,
      carbs:    t.carbs    + f.carbs_per_100g    * factor,
      fat:      t.fat      + f.fat_per_100g      * factor,
      fibre:    t.fibre    + f.fibre_per_100g    * factor,
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 });
}
```

**Allergen conflict display:**
```jsx
{allergenConflicts.map(c => (
  <div key={c.allergen} className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
    <p className="text-xs font-medium text-amber-800">
      Warning: This meal contains <strong>{c.allergen}</strong>.
      {c.affected_count} students have this allergen flagged.
    </p>
  </div>
))}
```

#### FeedbackLog.jsx

Fetches `/api/admin/mess/feedback`. Filters + table + ratio trend line chart + complaints horizontal bar chart.

### 9.5 Dean pages

#### CampusOverview.jsx

Fetches `/api/admin/dean/campus-overview`. 6 KPI cards in a 3×2 grid + `HostelHeatmapGrid` + 7-week `LineChart` (one `Line` per hostel, 10 lines) + top 3 `AlertCard`.

**7-week multi-hostel chart:**
```jsx
const HOSTEL_COLORS = {
  "BH-1": "#534AB7", "BH-2": "#185FA5", "BH-3": "#0F6E56",
  "BH-4": "#854F0B", "BH-5": "#A32D2D",
  "GH-1": "#D85A30", "GH-2": "#D4537E", "GH-3": "#639922",
  "GH-4": "#378ADD", "GH-5": "#888780",
};

<LineChart data={sevenWeekTrend}>
  {Object.keys(HOSTEL_COLORS).map(h => (
    <Line key={h} type="monotone" dataKey={h} stroke={HOSTEL_COLORS[h]}
          strokeWidth={1.5} dot={false} />
  ))}
</LineChart>
```

#### HostelComparison.jsx

Fetches `/api/admin/dean/hostel-comparison?metric=X`. Metric pill selector at top. Then:

1. **Bar chart** — 10 bars sorted descending, `ReferenceLine` at campus average
2. **Radar chart** — with hostel checkbox selector (max 3 shown simultaneously)
3. **Year breakdown** — grouped bar for selected hostel
4. **Gender comparison card** — side-by-side stats

**Recharts radar:**
```jsx
<RadarChart data={radarData} cx="50%" cy="50%" outerRadius={120}>
  <PolarGrid />
  <PolarAngleAxis dataKey="axis" />
  {selectedHostels.map(h => (
    <Radar key={h} name={h} dataKey={h}
           stroke={HOSTEL_COLORS[h]} fill={HOSTEL_COLORS[h]} fillOpacity={0.1} />
  ))}
  <Legend />
</RadarChart>
```

#### AcademicCorrelation.jsx

Fetches `/api/admin/dean/academic-correlation`. 

1. **Calendar input panel** — form to add events (name, start date, end date, type). Pre-populated with mock exam weeks.
2. **Area chart** — `AreaChart` with exam `ReferenceArea` bands
3. **3 finding cards** — strip of auto-generated insight cards
4. **Branch trends** — `LineChart` with 8 branch `Line` elements, filterable
5. **Mood + stress dual axis** — `ComposedChart` with `Line` for mood (left Y) and `Line` for stress (right Y)
6. **Recommendations** — bulleted list of 3 action suggestions

#### EnvironmentalImpact.jsx

Fetches `/api/admin/dean/environmental-impact`.

1. **Live status panel** — 4 cards: AQI (with CPCB color badge), Temperature, Humidity, UV Index
2. **AQI trend** — `ComposedChart` with `ReferenceArea` bands per CPCB category + `Line` for AQI
3. **Scatter plot** — AQI vs outdoor minutes, `ScatterChart`, regression line drawn as `Line` using computed points
4. **Env stress line chart**
5. **Activity shift paired bar** — 3 groups (Normal/Elevated/High AQI), 2 bars each (indoor/outdoor)
6. **Recommendations** — 3 strings from API

#### WellnessTrends.jsx

Fetches `/api/admin/dean/wellness-trends` with filter params. Renders:

1. **Filter row** — branch, hostel type, academic year selectors
2. **Semester trajectory** — `LineChart` day 1–90 with event labels
3. **Branch ranking** — `BarChart` horizontal, 8 bars sorted descending
4. **Year comparison** — grouped `BarChart` 4 metrics × 4 years
5. **Gender comparison** — simple summary cards
6. **Longitudinal insight** — large text card with the API-generated string

#### GenerateReport.jsx

1. **Report type** — 6 radio options
2. **Scope** — hostel multi-select + academic year filter + date range
3. **Format** — CSV (only for hackathon)
4. **Generate button** → calls `/api/admin/dean/generate-report` → triggers download
5. **Recent reports table** — last 20 with download links

---

## SECTION 10 — AUTO-INSIGHT GENERATION

All insight cards and finding cards are auto-generated from data patterns. Implement these functions client-side.

### Activity insight

```javascript
function generateActivityInsight(data) {
  const sundays = data.filter(d => new Date(d.date).getDay() === 0);
  const weekdays = data.filter(d => new Date(d.date).getDay() !== 0);
  const sundayAvg  = sundays.length  ? sundays.reduce((s, d)  => s + d.participation_pct, 0) / sundays.length  : null;
  const weekdayAvg = weekdays.length ? weekdays.reduce((s, d) => s + d.participation_pct, 0) / weekdays.length : null;

  if (sundayAvg !== null && weekdayAvg !== null && sundayAvg < weekdayAvg * 0.5) {
    return `Activity participation drops significantly on Sundays in your hostel (avg ${Math.round(sundayAvg)}% vs ${Math.round(weekdayAvg)}% on weekdays). Consider scheduling a Sunday morning activity.`;
  }

  const highAQIDays = data.filter(d => d.avg_aqi > 150);
  if (highAQIDays.length > 5) {
    const normalOutdoor  = data.filter(d => d.avg_aqi <= 150).reduce((s, d) => s + d.outdoor_min, 0) / Math.max(1, data.filter(d => d.avg_aqi <= 150).length);
    const highAQIOutdoor = highAQIDays.reduce((s, d) => s + d.outdoor_min, 0) / highAQIDays.length;
    const drop = Math.round((1 - highAQIOutdoor / normalOutdoor) * 100);
    return `Outdoor activity fell ${drop}% during the elevated AQI period. Students shifted to indoor activities but total active minutes still declined.`;
  }

  return `Activity participation is on track this period. Maintain current engagement.`;
}
```

### Academic correlation finding cards

```javascript
function generateFindingCards(dailyData, events) {
  const examDays   = dailyData.filter(d => d.is_exam_day);
  const normalDays = dailyData.filter(d => !d.is_exam_day);

  const mean = arr => arr.reduce((s, v) => s + v, 0) / Math.max(arr.length, 1);

  const examWellness   = mean(examDays.map(d   => d.avg_score));
  const normalWellness = mean(normalDays.map(d => d.avg_score));
  const drop           = normalWellness - examWellness;

  const examSleep   = mean(examDays.map(d   => d.avg_sleep));
  const normalSleep = mean(normalDays.map(d => d.avg_sleep));

  // Recovery: days after exam until score returns to normalWellness * 0.95
  let recoveryDays = 0;
  const postExam = dailyData.filter(d => !d.is_exam_day).slice(-20);
  for (let i = 0; i < postExam.length; i++) {
    if (postExam[i].avg_score >= normalWellness * 0.95) {
      recoveryDays = i + 1;
      break;
    }
  }

  return [
    {
      title: "Exam impact",
      stat:  `${drop.toFixed(1)} points`,
      text:  `Campus wellness score drops an average of ${drop.toFixed(1)} points during exam weeks. This is consistent across all 10 hostels.`,
    },
    {
      title: "Recovery rate",
      stat:  `${recoveryDays || "5+"} days`,
      text:  `Wellness scores recover to pre-exam baseline within ${recoveryDays || 5} days after exams end.`,
    },
    {
      title: "Sleep impact",
      stat:  `${(normalSleep - examSleep).toFixed(1)} hrs`,
      text:  `Average sleep declines from ${normalSleep.toFixed(1)} to ${examSleep.toFixed(1)} hours during exam weeks — the sharpest single metric decline.`,
    },
  ];
}
```

### Mess insight

```javascript
function generateMessInsight(participationData, ratingData) {
  const MEALS = ["breakfast", "lunch", "snacks", "dinner"];
  const DAYS  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  let worstMeal = null, worstScore = -Infinity;
  MEALS.forEach(meal => {
    DAYS.forEach((day, dayIdx) => {
      const participation = participationData.find(d => d.day_index === dayIdx)?.[meal] || 0;
      const rating        = ratingData.find(d => d.day_index === dayIdx)?.[meal] || 3;
      const skipPct       = 100 - participation;
      const score         = skipPct / 100 + (3 - rating) / 2;
      if (score > worstScore) { worstScore = score; worstMeal = { meal, day, skipPct: Math.round(skipPct), rating: rating.toFixed(1) }; }
    });
  });

  if (worstMeal && worstMeal.skipPct > 25 && parseFloat(worstMeal.rating) < 3.0) {
    return `${worstMeal.day} ${worstMeal.meal} has the lowest participation this week (${worstMeal.skipPct}% skip) and the worst rating (${worstMeal.rating} stars). Consider reviewing the ${worstMeal.day} ${worstMeal.meal} menu.`;
  }
  return "Meal quality metrics are within acceptable range this week.";
}
```

---

## SECTION 11 — .ENV FILE TEMPLATE

```bash
# backend/.env

# PostgreSQL
DATABASE_URL=postgresql://univitals_user:password@localhost:5432/univitals

# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=univitals

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=replace-with-256-bit-random-secret-never-commit-this

# Encryption — generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
JOURNAL_ENCRYPTION_KEY=replace-with-fernet-key

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## SECTION 12 — BUILD ORDER (FOLLOW THIS EXACTLY)

Do not skip steps. Do not build frontend before backend is verified.

### PHASE 1 — BACKEND FOUNDATION

```
Step 1:   Create .env with all variables
Step 2:   Create PostgreSQL schema (all 12 tables, in order)
Step 3:   Write seed_data.py (full implementation using simulation logic from Section 4)
Step 4:   Run seed_data.py — verify with these queries:
            SELECT COUNT(*) FROM users WHERE role='student';       -- must be 1000
            SELECT COUNT(*) FROM wellness_logs;                    -- must be 90000
            SELECT COUNT(*) FROM admin_alerts;                     -- must be > 0 per hostel
            SELECT MIN(wellness_score), MAX(wellness_score) FROM wellness_logs;
Step 5:   app/auth.py — create_token(), decode_token(), require_role()
Step 6:   app/privacy.py — enforce_k_anonymity(), encrypt_journal(), decrypt_journal()
Step 7:   app/database.py — PostgreSQL + MongoDB + Redis connection pools
Step 8:   POST /api/admin/auth/login endpoint
Step 9:   Test auth:
            - Login as warden_bh3@iitd.ac.in → JWT contains hostel_id: "BH-3" ✓
            - Login as dean@iitd.ac.in → JWT contains role: "dean", no hostel_id ✓
            - Warden calls dean endpoint → 403 ✓
            - Dean calls warden endpoint → 200 ✓
```

### PHASE 2 — WARDEN BACKEND + FRONTEND

```
Step 10:  GET /api/admin/warden/overview
Step 11:  GET /api/admin/warden/activity
Step 12:  GET /api/admin/warden/nutrition
Step 13:  GET /api/admin/warden/mood  (wellness_logs only — verify mood_logs not touched)
Step 14:  GET /api/admin/warden/alerts
Step 15:  POST /api/admin/warden/alerts/:id/acknowledge
Step 16:  GET + POST /api/admin/warden/initiatives
Step 17:  GET /api/admin/warden/export (CSV)

Step 18:  AdminAuthContext.jsx + api/client.js with JWT interceptor
Step 19:  Login.jsx + Unauthorized.jsx
Step 20:  WardenLayout.jsx (sidebar + topbar + PrivacyBanner)
Step 21:  Shared components: KPICard, AlertCard, NutrientGauge, EmptyState, DateRangeFilter
Step 22:  WardenOverview.jsx (all 6 UI elements)
Step 23:  ActivityReport.jsx (4 charts + insight)
Step 24:  NutritionReport.jsx (4 charts + gauges)
Step 25:  MoodStressReport.jsx (privacy statement first, then 4 charts + dip card)
Step 26:  WellnessAlerts.jsx (active cards + acknowledge + history accordion)
Step 27:  Initiatives.jsx (create form + active cards + past table)
Step 28:  WardenExport.jsx
```

### PHASE 3 — MESS MANAGER BACKEND + FRONTEND

```
Step 29:  GET /api/admin/mess/overview
Step 30:  GET /api/admin/mess/ratings
Step 31:  GET /api/admin/mess/nutrients
Step 32:  GET + POST + PUT /api/admin/mess/menu (with allergen checker in POST/PUT response)
Step 33:  POST /api/admin/mess/menu/publish
Step 34:  GET /api/admin/mess/feedback

Step 35:  MessLayout.jsx
Step 36:  MessOverview.jsx
Step 37:  MealRatings.jsx (sortable table + worst/best + tag cloud)
Step 38:  NutrientAnalysis.jsx (5 gauges + macro trend + recommendations)
Step 39:  MenuPlanner.jsx (7×4 grid + side panel + allergen display + publish)
Step 40:  FeedbackLog.jsx
```

### PHASE 4 — DEAN BACKEND + FRONTEND

```
Step 41:  GET /api/admin/dean/campus-overview
Step 42:  GET /api/admin/dean/hostel-comparison
Step 43:  GET /api/admin/dean/academic-correlation
Step 44:  POST /api/admin/dean/academic-calendar
Step 45:  GET /api/admin/dean/environmental-impact
Step 46:  GET /api/admin/dean/wellness-trends
Step 47:  POST /api/admin/dean/generate-report + GET /api/admin/dean/reports

Step 48:  DeanLayout.jsx
Step 49:  HostelHeatmapGrid.jsx component
Step 50:  CampusOverview.jsx (6 KPIs + heatmap + 7-week multi-line + top 3 alerts)
Step 51:  HostelComparison.jsx (metric selector + bar + radar + year breakdown + gender)
Step 52:  AcademicCorrelation.jsx (calendar input + area chart + finding cards + branch chart + dual-axis)
Step 53:  EnvironmentalImpact.jsx (live panel + AQI trend + scatter + shift bars + recommendations)
Step 54:  WellnessTrends.jsx (trajectory + branch ranking + year comparison + insight)
Step 55:  GenerateReport.jsx (type selector + scope + generate → download)
```

### PHASE 5 — POLISH

```
Step 56:  Add EmptyState to all chart components when data.length === 0
Step 57:  Verify responsive layout at 768px (all charts use ResponsiveContainer)
Step 58:  Apply CPCB AQI colors to all AQI displays
Step 59:  Write README with: system overview, setup instructions, API list, privacy framework, wellness formula, team credits
Step 60:  Final end-to-end test: login as each role, verify all pages load with data, verify 403 on wrong role, verify privacy banner always visible
```

---

## SECTION 13 — ROUTING CONFIGURATION

```jsx
// App.jsx router setup
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  if (!user)             return <Navigate to="/admin/login" />;
  if (user.role !== role && user.role !== "dean") return <Navigate to="/admin/unauthorized" />;
  return children;
}

<BrowserRouter>
  <AdminAuthProvider>
    <Routes>
      <Route path="/admin/login"        element={<Login />} />
      <Route path="/admin/unauthorized" element={<Unauthorized />} />

      <Route path="/admin/warden" element={<ProtectedRoute role="warden"><WardenLayout /></ProtectedRoute>}>
        <Route path="overview"    element={<WardenOverview />} />
        <Route path="activity"    element={<ActivityReport />} />
        <Route path="nutrition"   element={<NutritionReport />} />
        <Route path="mood"        element={<MoodStressReport />} />
        <Route path="alerts"      element={<WellnessAlerts />} />
        <Route path="initiatives" element={<Initiatives />} />
        <Route path="export"      element={<WardenExport />} />
      </Route>

      <Route path="/admin/mess" element={<ProtectedRoute role="mess_manager"><MessLayout /></ProtectedRoute>}>
        <Route path="overview"   element={<MessOverview />} />
        <Route path="ratings"    element={<MealRatings />} />
        <Route path="nutrients"  element={<NutrientAnalysis />} />
        <Route path="planner"    element={<MenuPlanner />} />
        <Route path="feedback"   element={<FeedbackLog />} />
      </Route>

      <Route path="/admin/dean" element={<ProtectedRoute role="dean"><DeanLayout /></ProtectedRoute>}>
        <Route path="overview"      element={<CampusOverview />} />
        <Route path="comparison"    element={<HostelComparison />} />
        <Route path="correlation"   element={<AcademicCorrelation />} />
        <Route path="environment"   element={<EnvironmentalImpact />} />
        <Route path="trends"        element={<WellnessTrends />} />
        <Route path="reports"       element={<GenerateReport />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin/login" />} />
    </Routes>
  </AdminAuthProvider>
</BrowserRouter>
```

---

## SECTION 14 — REQUIREMENTS FILES

### backend/requirements.txt

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
asyncpg==0.29.0
motor==3.3.2
redis==5.0.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
cryptography==42.0.0
pydantic==2.5.3
pydantic-settings==2.1.0
python-multipart==0.0.6
httpx==0.26.0
faker==22.0.0
```

### frontend/package.json dependencies

```json
{
  "dependencies": {
    "react":           "^18.2.0",
    "react-dom":       "^18.2.0",
    "react-router-dom":"^6.22.0",
    "recharts":        "^2.10.3",
    "axios":           "^1.6.5",
    "tailwindcss":     "^3.4.1"
  }
}
```

---

## SECTION 15 — IMPLEMENTATION RULES (READ BEFORE CODING)

1. **Role scope is enforced at the database query layer, not the UI.** The warden seeing only BH-3 is because every SQL query has `WHERE h.name = $1` with the value coming from the JWT token. If a warden crafts a URL with a different hostel, the API still returns BH-3 data.

2. **mood_logs is never queried in any admin router.** Admin mood data always comes from `wellness_logs.mood_score`. This is structural exclusion, not a convention.

3. **enforce_k_anonymity() is the last call before every admin endpoint returns.** It is not optional. It is not only for certain endpoints. It is called on every admin response, every time.

4. **PrivacyBanner is imported into WardenLayout, MessLayout, and DeanLayout.** It is not a page-level component. It is a layout-level component. It is always visible. It cannot be toggled.

5. **All Recharts charts use ResponsiveContainer.** No hardcoded widths.

6. **EmptyState is shown when data.length === 0 or data is null.** No blank charts. No console errors. Always a graceful empty state.

7. **Needs Attention KPI card shows a count only.** There is no endpoint, no list, no drill-down that shows which students are in the Needs Attention band. The count is all there is.

8. **AQI colors follow the CPCB scale from Section 7.** Not CSS color names. Not arbitrary hex values. The exact hex values from the CPCB scale.

9. **All exports have k-anonymity enforced.** Groups < 30 appear as "N/A — insufficient data" in CSV output. No exceptions.

10. **The allergen conflict checker returns counts, never names or IDs.** The API returns `{ allergen: "dairy", affected_count: 31 }`. Nothing else.

---

## SECTION 16 — VERIFICATION TESTS

Run these after completing each phase to confirm correctness.

### After Phase 1

```bash
# 1. Seed counts
psql -c "SELECT COUNT(*) FROM users WHERE role='student';"          # → 1000
psql -c "SELECT COUNT(DISTINCT user_id) FROM wellness_logs;"        # → 1000
psql -c "SELECT COUNT(*) FROM wellness_logs;"                       # → 90000
psql -c "SELECT COUNT(*) FROM admin_alerts;"                        # → > 0

# 2. Exam week effect visible
psql -c "
  SELECT EXTRACT(DOY FROM date) as day, ROUND(AVG(wellness_score)::numeric,2) as score
  FROM wellness_logs GROUP BY day ORDER BY day;
" | grep -E "^(3[0-6]|7[0-6])\b"   # these should show lower scores

# 3. AQI spike visible
psql -c "
  SELECT DATE(recorded_at), ROUND(AVG(aqi)::numeric) as avg_aqi
  FROM environmental_snapshots GROUP BY DATE(recorded_at) ORDER BY DATE(recorded_at);
" | tail -20   # days 45-55 from base should show AQI 180-280

# 4. Auth
curl -s -X POST localhost:8000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"warden.bh3@iitd.ac.in","password":"admin123"}' \
  | python3 -c "import sys,json,base64; t=json.load(sys.stdin)['token']; p=json.loads(base64.b64decode(t.split('.')[1]+'==')); print(p)"
# → must contain "role":"warden" and "hostel_id":"BH-3"

# 5. Role enforcement
WARDEN_TOKEN=$(curl -s -X POST localhost:8000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"warden.bh3@iitd.ac.in","password":"admin123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $WARDEN_TOKEN" \
  localhost:8000/api/admin/dean/campus-overview
# → must return 403

# 6. K-anonymity
curl -s -H "Authorization: Bearer $WARDEN_TOKEN" \
  "localhost:8000/api/admin/warden/mood?range=7d" | python3 -m json.tool | grep suppressed
# → should show suppressed: true for any group with n < 30
```

### After Phase 2 (Warden UI)

- Open warden dashboard. All 4 KPI cards show numbers (not 0, not null).
- Wellness distribution bar shows 4 colored segments summing to ~100%.
- 28-day trend chart shows a visible dip around exam weeks.
- Navigate to mood page — privacy statement is the first thing visible.
- Navigate to alerts page — at least one alert is in the active section.
- Create an initiative — form submits, new initiative appears in active list.

### After Phase 3 (Mess UI)

- Mess overview page: 4 KPI cards populated, participation chart shows 7 days of bars.
- Menu planner: click a cell, side panel opens, search for "dal fry", add it with 150g, nutrition totals update immediately.
- After saving a meal with paneer or milk, allergen conflict shows "31 students have dairy allergy".

### After Phase 4 (Dean UI)

- Campus overview: hostel heatmap shows 10 colored tiles.
- Academic correlation: area chart shows two visible dips aligned with exam week bands.
- Environmental impact: scatter plot shows negative correlation (higher AQI → lower outdoor minutes).
- Generate report: clicking generate triggers a CSV download.

---

*End of UniVitals AI IDE Build Prompt*
*Team Hercules — FitFusion 2026 — Cognizance, IIT Roorkee*
*Feed this entire file to the AI IDE. It contains everything needed to build the complete functional admin dashboard.*
