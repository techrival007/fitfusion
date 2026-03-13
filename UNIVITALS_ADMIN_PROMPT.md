# UniVitals — Admin Dashboard Build Prompt
### FitFusion 2026 | Team Hercules | IIT Delhi
**Focus:** Admin Dashboard (3-role: Warden / Mess Manager / Dean of Students)
**Student app included as context only — for data connectivity and API reference**

---

## HOW TO READ THIS PROMPT

This prompt is structured in layers:

- **Section 1** — Project context and the real problem you are solving
- **Section 2** — Full system architecture (backend, DB, auth) that both products share
- **Section 3** — Student app context only. Do NOT build the student UI. Understand it so the admin dashboard is coherent and connected to the same data model.
- **Section 4** — The actual build target: the Admin Dashboard, fully specified screen by screen
- **Section 5** — Privacy rules that are non-negotiable and must be enforced at the API layer
- **Section 6** — Mock data and seed script
- **Section 7** — Priority order for what to build first

Read the whole thing before writing a line of code.

---

## SECTION 1 — CONTEXT & PROBLEM ANALYSIS

### 1.1 What UniVitals Is

UniVitals is a context-aware campus wellness intelligence platform for Indian university hostels. It has two products that share one backend:

1. **Student Web App** — students log their daily nutrition, activity, mood, and sleep. They see their personal wellness trends.
2. **Admin Dashboard** — three admin roles (Warden, Mess Manager, Dean) see anonymized, aggregated campus-wide wellness data and act on it.

You are building **Product 2 only** — the Admin Dashboard. The student app data model, APIs, and seed data are provided here as context so the admin dashboard has real data to display.

### 1.2 The Real Problem Admins Face

Indian university administrators are flying blind on student wellness. A warden has 100 students and finds out one is in crisis only when it becomes visible. A mess manager gets verbal complaints but has no data on which meals students are actually skipping or why. A Dean of Students can see exam results but cannot see the wellness trends that predict them.

The admin dashboard solves this by surfacing **early, aggregate signals** — not individual surveillance. The warden should know that 14 students in their hostel have been in the "Needs Attention" wellness band for 5 days, not which 14. The mess manager should know Thursday dinner has a 38% skip rate and a 2.1-star average, not who is skipping it. The Dean should know CSE students' wellness scores drop 18 points in exam weeks, not which student is struggling.

This is the design philosophy: **surface problems early, enable proactive action, never expose individuals.**

### 1.3 The Three Admin Personas

**Warden / House Staff**
- Responsible for one hostel (~100 students)
- Cares about: their hostel's overall wellness, stress spikes, activity levels, sleep deficits
- Action they take: scheduling hostel activities, flagging patterns to counseling cell, posting wellness initiatives
- Comfort with data: moderate — needs clean summaries, not raw numbers

**Mess Manager / Canteen Staff**
- Responsible for campus food operations
- Cares about: which meals students eat, which they skip, nutrition gaps, meal quality ratings
- Action they take: adjusting menus, responding to feedback, improving nutritional balance
- Comfort with data: low-moderate — needs visual, actionable summaries

**Dean of Students Office**
- Responsible for entire campus wellness
- Cares about: campus-wide trends, hostel comparisons, academic calendar correlations, environmental factors
- Action they take: policy decisions, resource allocation, wellness program planning
- Comfort with data: high — can handle dense charts and comparisons

### 1.4 Mock Data Assumptions

All data is simulated. No real students are used.

```
1,000 students across 10 hostels (100 per hostel)
Hostels: BH-1, BH-2, BH-3, BH-4, BH-5 (boys), GH-1, GH-2, GH-3, GH-4, GH-5 (girls)
Branches: CSE, ECE, ME, CE, EE, Textile, Chemical, Mathematics
Academic years: 1st, 2nd, 3rd, 4th
90 days of historical wellness data per student
4 mess meals per day (breakfast, lunch, snacks, dinner)
30 mess food items with full nutritional values
Environmental snapshots every 30 minutes (AQI, temperature, humidity, UV index)
Exam weeks simulated: days 30–37 and 70–77 of the dataset
AQI spike period simulated: days 45–55 (North Indian winter smog)
```

---

## SECTION 2 — SHARED SYSTEM ARCHITECTURE

Both the student app and admin dashboard share this backend. Build it once.

### 2.1 Tech Stack

```
Backend:            FastAPI (Python) — async RESTful APIs
Primary DB:         PostgreSQL — all structured data
Secondary DB:       MongoDB — journal entries (encrypted), unstructured mess data, nudges
Cache:              Redis — environmental snapshots (TTL: 30 min), session tokens
Auth:               JWT with role-based claims
Encryption:         AES-256 (Fernet) for journal entries at rest
Frontend (Admin):   React + TailwindCSS + Recharts
Frontend (Student): React + TailwindCSS [context only — not being built here]
```

### 2.2 PostgreSQL Schema

```sql
-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  roll_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  hostel_id INTEGER REFERENCES hostels(id),
  branch VARCHAR(50),
  academic_year INTEGER CHECK (academic_year IN (1,2,3,4)),
  height_cm FLOAT,
  weight_kg FLOAT,
  fitness_level VARCHAR(20) DEFAULT 'beginner',
  dietary_preference VARCHAR(30),  -- veg / non-veg / vegan
  allergens TEXT[],                -- ['dairy','gluten','nuts']
  role VARCHAR(20) DEFAULT 'student',  -- student / warden / mess_manager / dean
  created_at TIMESTAMP DEFAULT NOW()
);

-- HOSTELS
CREATE TABLE hostels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(10) NOT NULL,       -- BH-1, GH-1, etc.
  type VARCHAR(10) NOT NULL,       -- boys / girls
  capacity INTEGER DEFAULT 100,
  warden_id UUID REFERENCES users(id)
);

-- WELLNESS LOGS (daily computed summary per student)
CREATE TABLE wellness_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  wellness_score FLOAT,
  activity_score FLOAT,
  nutrition_score FLOAT,
  mood_score FLOAT,
  env_stress_score FLOAT,
  sleep_hours FLOAT,
  UNIQUE(user_id, date)
);

-- ACTIVITY LOGS
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activity_type VARCHAR(50),  -- running / gym / sports / yoga / cycling / walking / swimming
  duration_minutes INTEGER,
  intensity VARCHAR(20),      -- low / moderate / high
  calories_burned FLOAT,
  location VARCHAR(20),       -- indoor / outdoor
  notes TEXT
);

-- NUTRITION LOGS
CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type VARCHAR(20),      -- breakfast / lunch / snacks / dinner
  food_items JSONB,           -- [{"food_id": "...", "portion": "normal", "calories": 180}]
  total_calories FLOAT,
  total_protein FLOAT,
  total_carbs FLOAT,
  total_fat FLOAT,
  total_fibre FLOAT,
  meal_rating INTEGER,        -- 1-5 stars
  meal_feedback_tag VARCHAR(30)  -- tasty / cold / no_variety / undercooked / bland
);

-- MOOD LOGS (individual data — NEVER exposed to admin layer)
CREATE TABLE mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_of_day VARCHAR(20),    -- morning / afternoon / evening / night
  mood_emoji VARCHAR(20),     -- great / good / neutral / low / very_low
  mood_score INTEGER,         -- 1-5
  energy_level INTEGER,       -- 1-5
  stress_level INTEGER        -- 1-5
);

-- SLEEP LOGS
CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_time TIME,
  wake_time TIME,
  sleep_hours FLOAT,
  sleep_quality INTEGER,      -- 1-5
  disruptions INTEGER
);

-- FOOD ITEMS MASTER
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),       -- staple / dal / vegetable / dairy / fruit / snack / beverage
  calories_per_100g FLOAT,
  protein_per_100g FLOAT,
  carbs_per_100g FLOAT,
  fat_per_100g FLOAT,
  fibre_per_100g FLOAT,
  is_veg BOOLEAN DEFAULT TRUE,
  allergens TEXT[]
);

-- MESS MENU
CREATE TABLE mess_menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER,
  day_of_week INTEGER,        -- 0=Monday, 6=Sunday
  meal_type VARCHAR(20),
  food_items JSONB,           -- [{"food_id": "...", "quantity_g": 150}]
  estimated_calories FLOAT,
  estimated_protein FLOAT
);

-- ENVIRONMENTAL SNAPSHOTS
CREATE TABLE environmental_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at TIMESTAMP NOT NULL,
  aqi INTEGER,
  aqi_category VARCHAR(30),   -- good / satisfactory / moderate / poor / very_poor / severe
  temperature_c FLOAT,
  humidity_percent FLOAT,
  weather_condition VARCHAR(50),
  uv_index FLOAT,
  noise_level_db FLOAT,
  outdoor_activity_safe BOOLEAN,
  UNIQUE(recorded_at)
);

-- ADMIN ALERTS
CREATE TABLE admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id INTEGER REFERENCES hostels(id),  -- NULL = campus-wide
  alert_type VARCHAR(50),     -- sleep_deficit / activity_drought / nutrition_gap / mood_crisis / environmental
  severity VARCHAR(20),       -- info / warning / critical
  title VARCHAR(200),
  description TEXT,
  metric_value FLOAT,
  threshold_value FLOAT,
  triggered_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- HOSTEL WELLNESS INITIATIVES
CREATE TABLE hostel_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id INTEGER REFERENCES hostels(id),
  created_by UUID REFERENCES users(id),
  title VARCHAR(200),
  description TEXT,
  goal_type VARCHAR(50),      -- activity / nutrition / sleep
  target_value FLOAT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.3 MongoDB Collections

```javascript
// journal_entries — AES-256 encrypted, NEVER in any admin API
{
  _id: ObjectId,
  user_id: "uuid-string",
  date: ISODate,
  entry_text: "encrypted-string",   // Fernet encrypted
  word_count: Number,
  created_at: ISODate
}

// wellness_nudges
{
  _id: ObjectId,
  user_id: "uuid-string",
  generated_at: ISODate,
  nudge_type: "activity | nutrition | mental | environmental | sleep",
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

### 2.4 JWT Role Claims Structure

```python
# Token payload
{
  "sub": "user_uuid",
  "role": "student | warden | mess_manager | dean",
  "hostel_id": "BH-1",      # wardens only — enforces scope to one hostel
  "name": "Radhika Goel",
  "exp": unix_timestamp,
  "iat": unix_timestamp
}

# FastAPI RBAC dependency
from functools import wraps
from fastapi import Depends, HTTPException
from app.auth import decode_jwt, oauth2_scheme

def require_role(*allowed_roles):
    def dependency(token: str = Depends(oauth2_scheme)):
        payload = decode_jwt(token)
        if payload.get("role") not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return payload
    return Depends(dependency)

# Usage
@router.get("/admin/warden/overview")
async def warden_overview(user=require_role("warden", "dean")):
    ...
```

### 2.5 Wellness Score Formula

```
wellness_score = (activity_score × 0.35) + (nutrition_score × 0.30)
                 - (env_stress_score × 0.15) - (mood_deviation_score × 0.20)

activity_score:
  - 0–100, normalized from daily active minutes
  - 45 min/day = 100, 0 min = 0, linear between

nutrition_score:
  - 0–100, based on % of daily calorie target logged
  - 100% of target = 100, <50% or >150% penalized

env_stress_score:
  - 0–100 derived from AQI
  - AQI 0–50 (Good) = 0 stress, AQI 300+ (Hazardous) = 100 stress
  - Linear interpolation between

mood_deviation_score:
  - |today_mood_score - rolling_7day_avg_mood| × 20
  - Clamped to 0–100

Final score label:
  80–100 = Thriving (green)
  60–79  = Good (yellow-green)
  40–59  = Fair (amber)
  0–39   = Needs Attention (red)
```

### 2.6 K-Anonymity Enforcement

```python
K_ANONYMITY_THRESHOLD = 30

def enforce_k_anonymity(data: dict) -> dict:
    """
    Suppress any group with fewer than K_ANONYMITY_THRESHOLD members.
    Replace suppressed values with None and add a flag.
    """
    result = {}
    for key, value in data.items():
        if isinstance(value, dict) and value.get("count", 0) < K_ANONYMITY_THRESHOLD:
            result[key] = {"suppressed": True, "reason": "Group size below minimum threshold"}
        else:
            result[key] = value
    return result

# Apply to ALL admin aggregation queries before returning response
# No exceptions. Ever.
```

---

## SECTION 3 — STUDENT APP CONTEXT (DO NOT BUILD — READ FOR CONNECTIVITY)

The student app exists and produces data that the admin dashboard reads. Here is what the student app does, so your admin data makes sense.

### What students log daily:

**Nutrition:** Students log what they ate from the mess menu (breakfast, lunch, snacks, dinner). Each meal entry produces: total calories, protein, carbs, fat, fibre, and a meal quality rating (1–5 stars + tag: tasty/cold/no variety/undercooked/bland). This is what the Mess Manager dashboard reads.

**Activity:** Students log activity type (running, gym, sports, yoga, etc.), duration in minutes, intensity (low/moderate/high), and location (indoor/outdoor). This is what the Warden and Dean activity reports read.

**Mood:** Students log a 1–5 mood score via an emoji picker (Great/Good/Neutral/Low/Very Low), plus self-reported energy level and stress level. They can optionally write a journal entry which is AES-256 encrypted and NEVER visible to any admin role. The aggregate of mood scores (never individual) is what the Warden and Dean mood reports read.

**Sleep:** Students log bedtime, wake time, and sleep quality (1–5). Sleep hours are auto-calculated. The aggregate of sleep hours and quality (never individual) is what the Warden and Dean wellness reports read.

**Wellness score:** Computed daily per student from the formula in Section 2.5. Stored in `wellness_logs` table. Aggregated into hostel and campus averages for admin display.

### Student app API routes that produce admin data:

```
POST /api/logs/nutrition     → feeds mess manager dashboard
POST /api/logs/activity      → feeds warden + dean activity reports
POST /api/logs/mood          → feeds warden + dean mood reports (aggregate only)
POST /api/logs/sleep         → feeds warden + dean wellness reports (aggregate only)
POST /api/mess/rating        → feeds mess manager ratings dashboard
GET  /api/dashboard/score    → per-student score stored to wellness_logs table
```

The admin dashboard reads aggregations of the data these endpoints produce. There is no direct link from any admin API to an individual student's mood, journal, or personal score. All admin APIs query aggregations with k-anonymity enforced.

---

## SECTION 4 — THE BUILD TARGET: ADMIN DASHBOARD

### 4.1 Entry Point and Role Routing

**URL:** `/admin/login`

Single login form. Fields: Email, Password. On successful login, the JWT role claim determines where the user is routed:

```
role: "warden"        → /admin/warden/overview
role: "mess_manager"  → /admin/mess/overview
role: "dean"          → /admin/dean/overview
```

Attempting to access a URL outside your role returns a 403 page with a clear message and a "Go to your dashboard" button.

**Persistent UI elements on every admin page:**

```
Top bar:
  Left:  UniVitals logo + "Admin" badge
  Right: User name + role badge (color-coded: blue=warden, orange=mess, purple=dean) + logout

Left sidebar:
  Role-specific navigation links
  Bottom: "Data last refreshed: N minutes ago"

Persistent banner (below top bar, every page):
  Light gray background, small text:
  "All data is anonymized and aggregated. Individual student data is never displayed.
   Minimum group size for any metric: 30 students."
```

---

### 4.2 WARDEN DASHBOARD

**Scope:** One hostel only, set by the `hostel_id` in the warden's JWT. Warden cannot see data for any other hostel. All queries are scoped by `hostel_id` at the database level, not just the UI.

#### 4.2.1 Sidebar Navigation

```
Overview          (default)
Activity Report
Nutrition Report
Mood & Stress
Wellness Alerts
Initiatives
Export
```

---

#### 4.2.2 Page: Warden Overview

**Header:**
- Hostel name (e.g., "BH-3 — Boys Hostel 3")
- Today's date
- "Showing data for your hostel only"

**Row 1 — KPI Cards (4 cards, equal width):**

```
Card 1: Students logged today
  Value: e.g., "67 / 100"
  Subtext: "67% participation today"
  Trend: vs yesterday (arrow up/down + number)

Card 2: Average wellness score
  Value: e.g., "63.4"
  Color: amber (60-79 range)
  Subtext: "Good range"
  Trend: vs last week average

Card 3: Needs Attention
  Value: e.g., "11"
  Color: red if >10% of hostel, amber if 5-10%, green if <5%
  Subtext: "students below 40 score this week"
  Note: count only, no names, no identification

Card 4: Weekly participation rate
  Value: e.g., "72%"
  Subtext: "of hostel logged data this week"
  Trend: vs last week
```

**Row 2 — Wellness Score Distribution (full width):**

Horizontal stacked bar chart showing count of students in each band:
- Thriving (80–100): green segment
- Good (60–79): yellow-green segment
- Fair (40–59): amber segment
- Needs Attention (<40): red segment

Below the chart:
- If "Needs Attention" count > 15% of hostel: show an amber callout card:
  "A notable portion of your hostel is in the low wellness range this week. Consider a hostel-wide check-in or activity initiative."
- CTA button: "Create a wellness initiative" → links to Initiatives page

**Row 3 — Two columns:**

Left column (60%): Weekly wellness score trend
- Line chart: hostel average wellness score for the past 4 weeks (28 days), one point per day
- Horizontal dashed reference line at 60 (minimum "Good" threshold)
- Shaded region if exam week overlaps the visible range (labeled "Exam week")
- Y-axis: 0–100
- Hover tooltip: date + average score + number of students who logged that day

Right column (40%): Today's activity snapshot
- Donut chart: % of hostel that logged activity today vs did not
- Below donut: small list of top 3 activity types logged today with counts
  e.g., "Running: 14 students | Gym: 9 students | Sports: 7 students"

**Row 4 — Top Stress Indicators (full width):**

Title: "This week's key signals"

3 signal cards in a row. Each card has an icon-style indicator (colored dot), a short headline, and a one-line context:

```
Signal 1 — Sleep:
  Color: red if avg < 6hrs, amber if 6-7hrs, green if >7hrs
  "Average sleep: 6.1 hours"
  "Below the 7-hour recommended threshold"

Signal 2 — Mood:
  Color: based on average mood score trend vs last week
  "Mood trending down 12% vs last week"
  "Likely correlated with upcoming exams"

Signal 3 — Outdoor activity:
  Color: based on AQI impact
  "Outdoor activity down 28% this week"
  "AQI has been elevated (avg 162)"
```

---

#### 4.2.3 Page: Activity Report

**Filters (top bar):**
- Date range: This week / Last 2 weeks / This month / Last month / Custom date picker
- Academic year filter (optional): All / 1st / 2nd / 3rd / 4th year

**Chart 1 — Daily active minutes trend:**
- Line chart: hostel average active minutes per day over selected period
- Reference line at 45 min/day (WHO recommendation)
- Tooltip: date + avg minutes + % of hostel who logged activity that day

**Chart 2 — Activity type breakdown:**
- Stacked bar chart, one bar per week
- Segments: Running / Gym / Sports / Yoga / Cycling / Walking / Other
- Shows which activity types are most popular and how this shifts over time

**Chart 3 — Indoor vs outdoor split:**
- Simple dual bar chart (indoor minutes vs outdoor minutes per week)
- Overlaid with AQI line (secondary y-axis)
- This makes the AQI → outdoor activity drop relationship visible

**Chart 4 — Participation rate trend:**
- Line chart: % of hostel students who logged any activity each day
- Reference line at 50% (target participation)

**Insight card (auto-generated):**
- One plain-language observation based on the data
- Examples:
  - "Activity participation drops significantly on Sundays in your hostel (avg 22% vs 58% on weekdays)."
  - "Outdoor activity fell 40% during the AQI spike from [date] to [date]."
  - "Activity in your hostel is 11% above campus average this month."

---

#### 4.2.4 Page: Nutrition Report

**Filters:** Date range, meal type (All / Breakfast / Lunch / Snacks / Dinner)

**Chart 1 — Average daily calorie intake:**
- Line chart: hostel average total daily calories logged over selected period
- Reference band: 1,800–2,500 kcal healthy range shown as shaded region
- Hover: date + avg calories + how many students logged nutrition that day

**Chart 2 — Macro breakdown (weekly averages):**
- Grouped bar chart: one group per week, bars for Protein / Carbs / Fat
- Below each bar: grams + % of RDA
- Highlight in red any macro that is consistently below RDA

**Chart 3 — Meal skip rates:**
- Grouped bar chart: one group per meal type (Breakfast / Lunch / Snacks / Dinner)
- Bar height = % of students who did NOT log that meal
- Color: green if <20% skip, amber if 20–40%, red if >40%

**Mess quality rating (this hostel's students):**
- Average star rating per meal type (Breakfast / Lunch / Snacks / Dinner)
- Trend line: how average rating has changed over the past month
- Most common feedback tags this month: badge-style display

**Nutrient deficiency card:**
- Compare hostel average intakes vs RDA for: Calories, Protein, Carbs, Fat, Fibre
- Progress bar style: green if within 90–110% of RDA, amber if 70–90% or 110–130%, red otherwise
- Auto-generated note: "Fibre intake in your hostel is 35% below RDA. Mess items high in fibre include dal, rajma, and mixed vegetables."

---

#### 4.2.5 Page: Mood & Stress

**Permanent privacy statement at top of page (bold, distinct styling):**
```
Privacy note: Mood data shown here is aggregated across your entire hostel.
No individual student's mood, energy, or stress scores are visible at any point.
Individual journal entries are never accessible to any admin role.
Minimum group size enforced: 30 students.
```

**Chart 1 — Mood trend over time:**
- Line chart: hostel average mood score (1–5) over selected date range
- Shaded bands: 4–5 = positive (light green), 3–4 = neutral (light gray), 1–3 = concerning (light red)
- Annotate exam weeks as vertical dashed lines labeled "Exam week"
- Tooltip: date + average mood score + number of students who logged mood that day

**Chart 2 — Mood heatmap calendar:**
- 30-day calendar grid (each cell = one day)
- Cell color = hostel average mood score for that day
- Color scale: deep green (5.0) → neutral gray (3.0) → deep red (1.0)
- Cells with fewer than 30 data points shown as striped/hatched with tooltip "Insufficient data"

**Chart 3 — Stress level distribution (weekly):**
- Stacked bar chart per week
- Segments: Low stress (1–2) / Moderate (3) / High (4–5) as % of responses
- Shows whether stress is increasing or decreasing over time

**Chart 4 — Time-of-day mood pattern:**
- Small grouped bar chart: Morning / Afternoon / Evening / Night
- Shows which time of day students tend to feel worst (aggregate)
- Note: "Students in your hostel tend to feel lowest in the mornings" (auto-generated from data)

**Mood dip alert logic:**
- If hostel average mood drops below 2.5 for 3 consecutive days:
  - Show an amber alert card: "Hostel mood has been in the low range for [N] days. Consider organizing a social activity or study break event."
  - Button: "Create an initiative" → links to Initiatives page

---

#### 4.2.6 Page: Wellness Alerts

All alerts are aggregate-level only. Zero individual identification.

**Active alerts section:**
Each alert is a card with:
- Severity badge: Info (blue) / Warning (amber) / Critical (red)
- Alert type icon
- Headline: short, plain language
- Detail: one sentence explaining the metric and threshold
- Triggered date
- "Acknowledge" button → records timestamp and warden's user ID
- "Mark action taken" button with optional text note

**Alert types and trigger conditions:**

```
SLEEP DEFICIT (warning)
  Trigger: Hostel average sleep < 6.5 hours for 5+ consecutive days
  Headline: "Sleep deficit persisting in your hostel"
  Detail: "Average sleep hours have been {value} for the past {N} days (threshold: 6.5 hrs)"

ACTIVITY DROUGHT (warning)
  Trigger: < 35% of hostel logged any activity for 5+ consecutive days
  Headline: "Activity participation has dropped significantly"
  Detail: "Only {value}% of your hostel has logged activity in the past {N} days"

NUTRITION GAP (info)
  Trigger: Hostel average calories < 1,600 kcal for 3+ consecutive days
  Headline: "Students may be undereating this week"
  Detail: "Average logged calorie intake is {value} kcal — below 1,600 kcal threshold for {N} days"

MOOD CRISIS (critical)
  Trigger: Hostel average mood score < 2.5 for 3+ consecutive days
  Headline: "Sustained low mood in your hostel"
  Detail: "Average mood score has been below 2.5 for {N} consecutive days"
  Action suggestion: "Consider notifying the student wellness cell or scheduling a hostel activity."

HIGH STRESS WEEK (warning)
  Trigger: > 50% of mood responses in "high stress" band (4–5) for 3+ consecutive days
  Headline: "High stress levels being reported"
  Detail: "{value}% of mood check-ins this week rated stress as high"

ENVIRONMENTAL (info)
  Trigger: AQI > 150 for current day
  Headline: "Outdoor activity not recommended today"
  Detail: "Current AQI is {value} ({category}). Advise students to exercise indoors."
```

**Alert history section:**
- Accordion list of past alerts (last 60 days)
- Shows: type, triggered date, acknowledged date, action taken note
- Filter by: type / severity / date range

---

#### 4.2.7 Page: Initiatives

Warden can create hostel-wide wellness initiatives. These appear as a banner in all students' apps in that hostel.

**Active initiatives:**
- List of currently running initiatives
- Each initiative card shows: title, goal type, target, start/end date, participation rate
- Participation rate = % of hostel who met the goal at least 3 days in the initiative period (aggregate, anonymous)

**Create initiative form:**
```
Title: [text input]
Description: [textarea]
Goal type: Activity / Nutrition / Sleep (pill selector)
Goal target:
  Activity: "Log at least ___ minutes of activity per day"
  Nutrition: "Log at least ___ meals per day"
  Sleep: "Log at least ___ hours of sleep per day"
Duration: Start date → End date
```

**Past initiatives:**
- Table: title, dates, participation rate, goal met %
- Shows which initiative types get the best engagement

---

#### 4.2.8 Page: Export

```
Report type selector:
  - Weekly wellness summary
  - Monthly wellness summary
  - Activity report
  - Nutrition report

Date range: date picker

Format: CSV / PDF

All exports:
  - No names, no roll numbers, no emails
  - Only: hostel + academic year groupings + metric values
  - Groups with < 30 students are suppressed (shown as "N/A — insufficient data")
  - Export timestamp and "anonymized by UniVitals v1.0" footer

Download button → generates file, shows download link
Recent exports: list of the last 10 generated exports with download links
```

---

### 4.3 MESS MANAGER DASHBOARD

**Scope:** Campus-wide nutrition data. No hostel-specific breakdown. No individual student data. Focus entirely on food patterns, quality, and nutrition gaps.

#### 4.3.1 Sidebar Navigation

```
Overview          (default)
Meal Ratings
Nutrient Analysis
Menu Planner
Feedback Log
```

---

#### 4.3.2 Page: Mess Manager Overview

**Header:**
- "Campus Mess Analytics"
- Today's date
- "Showing campus-wide aggregated data"

**Row 1 — KPI Cards (4 cards):**

```
Card 1: Today's average meal rating
  Value: star display (e.g., 3.4 / 5)
  Subtext: "Based on N ratings so far today"
  Trend: vs yesterday

Card 2: Total meals logged today
  Value: count (e.g., 1,847)
  Subtext: "Across all meal types"

Card 3: Highest skip rate today
  Value: e.g., "Breakfast — 44%"
  Color: red if skip > 40%, amber if 20–40%, green if < 20%
  Subtext: "of students did not log breakfast"

Card 4: Worst-rated meal this week
  Value: meal name + day (e.g., "Wednesday Dinner")
  Subtext: star rating shown
```

**Chart 1 — Meal participation by day (this week):**
- Grouped bar chart: 4 bars per day (Breakfast / Lunch / Snacks / Dinner)
- Bar height = number of students who logged that meal
- Color per meal type is consistent throughout the dashboard
- Shows which meals students eat vs skip and how this shifts day to day

**Chart 2 — Rating trend by meal type:**
- 4-line chart (one per meal type): average rating over the past 30 days
- Y-axis: 1–5 stars
- Horizontal dashed reference line at 3.0 (acceptable threshold)
- When any line drops below 3.0 for 3+ consecutive days, that line is highlighted red

**Insight card:**
Auto-generated plain English finding:
- "Thursday dinner has the lowest participation rate this week (38% skip) and the worst rating (2.1 stars). Consider reviewing the Thursday menu."
- "Breakfast ratings have improved 0.8 stars since the menu change on [date]."

---

#### 4.3.3 Page: Meal Ratings

**Filters:** Date range / Meal type / Day of week

**Table — All meals, all days:**

```
Columns: Date | Day | Meal Type | Avg Rating | # Ratings | Top Tag | 2nd Tag
Sorting: by any column
Row color: green if rating ≥ 4, white if 2.5–4, light red if < 2.5
```

**Worst-rated meals (this month):**
- Top 10 list: meal name, day, date, rating, most common complaint tag
- Cards with red-tinted background

**Best-rated meals (this month):**
- Top 10 list: meal name, day, date, rating, most common positive tag
- Cards with green-tinted background

**Feedback tag cloud:**
- Word cloud or badge list of the most common feedback tags this month
- Tag size / weight proportional to frequency
- Tags: Tasty / Good / Okay / Cold / Bland / No variety / Undercooked / Too spicy / Too oily / Fresh
- Color: green for positive tags, red for negative tags

---

#### 4.3.4 Page: Nutrient Analysis

**Purpose:** Show what the campus is eating nutritionally vs what they should be eating.

**Header note:**
"Based on aggregated logged nutrition data from students campus-wide."

**Nutrient target gauge panel:**

For each of 5 key nutrients, show a horizontal progress bar with RDA reference:

```
Calories:   [██████████░░░░░░░░░░░░░░] 1,840 / 2,000 kcal avg   (92%) ✓
Protein:    [████████░░░░░░░░░░░░░░░░]   48 / 60g avg            (80%) ⚠
Carbs:      [████████████░░░░░░░░░░░░]  220 / 275g avg           (80%) ⚠
Fat:        [████████████████░░░░░░░░]   62 / 65g avg            (95%) ✓
Fibre:      [████░░░░░░░░░░░░░░░░░░░░]   11 / 30g avg            (37%) ✗
```

Color coding:
- 90–110% of RDA: green (✓)
- 70–90% or 110–130%: amber (⚠)
- Below 70% or above 130%: red (✗)

Below each bar: "Campus average is [N]% below/above the recommended daily intake."

**Weekly macro trend:**
- Multi-line chart: Protein / Carbs / Fat averaged per week over 12 weeks
- Shows whether nutrition quality is improving or deteriorating over time

**Nutrient gap recommendations:**
Auto-generated actionable suggestions based on current gaps:
```
If fibre < 70% of RDA:
  "Campus fibre intake is significantly below recommended levels.
   High-fibre mess items to consider adding: rajma, chole, mixed dal, green vegetables, fruit."

If protein < 80% of RDA:
  "Protein intake is below target. Consider increasing frequency of: dal, paneer,
   eggs, curd, or rajma in the weekly menu."
```

**Hostel-wise deficiency overview (Dean-level view only — not available to mess manager):**
Anonymized comparison: which hostel populations have the worst nutrient gaps. (Shown on Dean's environmental impact page, not here.)

---

#### 4.3.5 Page: Menu Planner

**Purpose:** Plan the upcoming week's mess menu with live nutritional calculations.

**Weekly grid:**

```
         Monday    Tuesday   Wednesday   Thursday   Friday    Saturday   Sunday
Breakfast  [edit]   [edit]    [edit]      [edit]    [edit]    [edit]     [edit]
Lunch      [edit]   [edit]    [edit]      [edit]    [edit]    [edit]     [edit]
Snacks     [edit]   [edit]    [edit]      [edit]    [edit]    [edit]     [edit]
Dinner     [edit]   [edit]    [edit]      [edit]    [edit]    [edit]     [edit]
```

Clicking any cell opens a side panel:
- Search food items from the master food_items database
- Select item + quantity (grams)
- Add multiple items per meal
- Live nutritional totals shown as items are added:
  "This meal: 680 kcal | 28g protein | 85g carbs | 18g fat | 7g fibre"

**Daily nutritional summary bar:**
Below each day column: daily total calories (summing all 4 meals)
Color indicator: green if 1,800–2,400 kcal, amber if slightly outside, red if far outside

**Allergen conflict checker:**
After building a meal:
- Auto-scan: does any item in this meal match a flagged allergen in the student population?
- Show: "Warning: Tuesday lunch contains dairy. 31 students have dairy allergy flagged in their profile."
- Does not name the students. Count only.

**Dietary coverage check:**
- Show veg vs non-veg item count per day
- "Monday: 5 veg options, 1 non-veg option" — ensures vegetarian students are always covered

**Save and publish:**
- "Save as draft" — visible only to mess manager
- "Publish for this week" — publishes to student app mess menu
- Published menus trigger the student app's "today's mess menu" preview on their home dashboard

---

#### 4.3.6 Page: Feedback Log

**Purpose:** Ongoing log of aggregated student feedback on meals.

**Date range filter + meal type filter**

**Summary table:**

```
Columns: Date | Meal | Avg Rating | # Ratings | Positive Tags | Negative Tags | Notes
```

**Feedback trend chart:**
- Line chart: ratio of positive tags vs negative tags per week over the past 3 months
- Shows whether overall mess quality perception is trending up or down

**Common complaints breakdown:**
- Horizontal bar chart showing frequency of each negative tag across the selected period:
  Cold | Bland | No variety | Undercooked | Too spicy | Too oily
- This tells the mess manager what the primary complaint category is

**Export:**
- CSV or PDF of the feedback log
- No individual student attribution in any export

---

### 4.4 DEAN DASHBOARD

**Scope:** Entire campus. All hostels. All branches. All academic years. Cross-dimensional comparisons. Policy-level decision support.

#### 4.4.1 Sidebar Navigation

```
Campus Overview     (default)
Hostel Comparison
Academic Correlation
Environmental Impact
Wellness Trends
Generate Report
```

---

#### 4.4.2 Page: Campus Overview

**Header:**
- "Campus Wellness — [Current Month, Year]"
- Live timestamp: "Data last updated: 4 minutes ago"

**Row 1 — Campus KPI Cards (6 cards):**

```
Card 1: Students active today
  Value: "612 / 1,000"
  Subtext: "61.2% logged data today"

Card 2: Campus wellness score
  Value: e.g., "67.3"
  Color coded by range
  Trend arrow: vs last week

Card 3: Needs Attention
  Value: e.g., "94"
  Subtext: "students in low wellness band this week"
  No names. No hostel attribution on this card.

Card 4: Average daily activity
  Value: e.g., "38 min"
  Subtext: "vs 45 min recommendation"

Card 5: Average sleep
  Value: e.g., "6.4 hrs"
  Subtext: "vs 7–9 hrs recommendation"
  Color: red if < 6.5, amber if 6.5–7, green if > 7

Card 6: Campus mood index
  Value: e.g., "3.2 / 5"
  Subtext: "Neutral-Good range"
```

**Hostel wellness heatmap:**

10 hostel tiles arranged in a 2×5 grid (boys hostels on left, girls on right):

```
BH-1 [score]   GH-1 [score]
BH-2 [score]   GH-2 [score]
BH-3 [score]   GH-3 [score]
BH-4 [score]   GH-4 [score]
BH-5 [score]   GH-5 [score]
```

Each tile: hostel name, average wellness score this week, color-coded background.
Clicking a tile shows a small popover with: score trend (up/down), # active students today, top alert if any.
Note: Dean can see hostel-level data but not individual student data within hostels.

**7-week campus wellness trend:**
- Multi-line chart: one line per hostel, showing their average wellness score week by week
- Lines are labeled (BH-1, GH-1 etc.) — hostel names are visible to Dean
- Shows which hostels are diverging or converging over time
- Tooltip: hover on any point to see hostel name + week + score

**Top 3 active campus alerts:**
- Cards showing the 3 most critical active alerts across all hostels
- Each card: hostel name, alert type, severity badge, brief description
- "View all alerts" link

---

#### 4.4.3 Page: Hostel Comparison

**Purpose:** Compare all 10 hostels across wellness dimensions to identify patterns.

**Metric selector (top):**
Choose what to compare: Wellness Score / Activity / Nutrition / Sleep / Mood / Stress Level

**Chart 1 — Bar chart comparison:**
- 10 bars (one per hostel), sorted descending by selected metric
- Color: green top 3, gray middle 4, amber bottom 3
- Campus average shown as horizontal reference line

**Chart 2 — Radar chart:**
- 10 hostels on the same radar chart, but display max 3 at a time to avoid clutter
- Hostel selector: checkboxes to choose which hostels to compare
- 5 axes: Activity / Nutrition / Sleep / Mood / Overall Wellness
- Each hostel = one polygon in a distinct color

**Chart 3 — Academic year breakdown within hostels:**
- For a selected hostel, show how wellness metrics differ by academic year (1st–4th year)
- Grouped bar chart: 4 year groups per metric
- Insight: "1st year students in BH-3 have significantly lower wellness scores than 4th year students, driven by lower sleep hours"

**Boys vs Girls hostel comparison:**
- Simple dual summary card:
  Boys hostels (BH-1 to BH-5) average: [score, activity, sleep]
  Girls hostels (GH-1 to GH-5) average: [score, activity, sleep]
- Note: "Differences reflect aggregate patterns, not individual behavior"

---

#### 4.4.4 Page: Academic Correlation

**Purpose:** Show how the academic calendar drives wellness patterns. The most strategic page for the Dean.

**Academic calendar setup:**
- Input panel (top of page): "Define academic events"
  - Add event: [Event name] + [Start date] + [End date] + [Type: Exam/Assignment/Holiday/Event]
  - Mock calendar pre-loaded: mid-semester exams (week 5), end-semester exams (week 11), a cultural event (week 7)

**Chart 1 — Wellness score vs academic calendar (full width):**
- Area chart: campus average wellness score over the full semester (90 days)
- Academic events shown as vertical shaded bands with labels
- Clear visual of how wellness dips align with exam/assignment periods

**Key finding cards (auto-generated from data):**
3 card strip below the main chart. Examples:

```
Card 1 — Exam impact:
  "Campus wellness score drops an average of 17.4 points during exam weeks.
   This is consistent across all 10 hostels."

Card 2 — Recovery rate:
  "Wellness scores recover to pre-exam baseline within 5 days after exams end."

Card 3 — Sleep impact:
  "Average sleep hours decline from 6.8 to 5.7 during exam weeks
   — the sharpest single metric decline."
```

**Branch-wise breakdown:**
- Line chart: wellness score trend for each branch (CSE / ECE / ME / etc.) over the semester
- Filter: show all branches or select specific ones
- CSE and ECE typically show steepest exam-week declines — the chart should make this visible

**Mood + stress correlation with exams:**
- Two-axis chart: mood score (left axis) + self-reported stress level (right axis) over time
- Exam periods highlighted
- "Stress peaks 3 days before exam start and remains elevated for 2 days post-exam" (auto-insight)

**Recommendations panel:**
Based on the correlations, show suggested actions:
```
"Consider scheduling wellness workshops or de-stress events in the week before exams."
"Early-evening fitness events have historically maintained activity levels during exam weeks."
"Mess menus during exam weeks should prioritize high-protein, easy-to-eat options (low skip rate)."
```

---

#### 4.4.5 Page: Environmental Impact

**Purpose:** Show how AQI, temperature, and weather affect campus wellness.

**Current environmental status panel:**
4 live stat cards:
- AQI: number + CPCB color-coded category badge
- Temperature: °C + feels like
- Humidity: %
- UV Index: number + risk label

**Chart 1 — AQI trend (90 days):**
- Line chart: daily AQI reading over the full dataset period
- Background color bands: CPCB categories (Good=green band, Moderate=yellow, Poor=orange, etc.)
- Tooltip: AQI value + category + date

**Chart 2 — AQI vs outdoor activity correlation:**
- Scatter plot: X-axis = daily AQI, Y-axis = campus average outdoor activity minutes
- Expected negative correlation (higher AQI → less outdoor activity)
- Regression line overlaid
- Auto-insight: "For every 50-point increase in AQI above 100, outdoor activity drops by approximately 32%"

**Chart 3 — Environmental stress score over time:**
- Line chart: the `env_stress_score` component of the wellness formula over 90 days
- Peaks correspond to AQI spike periods and heat waves

**Chart 4 — Activity type shift during poor air quality:**
- Paired bar chart: compare average indoor vs outdoor activity split during:
  - Normal AQI days (< 100)
  - Elevated AQI days (100–200)
  - High AQI days (> 200)
- Shows that students substitute indoor for outdoor when AQI is high, but total activity still drops

**Recommendations panel:**
```
"AQI has exceeded 150 on [N] days this semester. Consider permanent indoor fitness infrastructure."
"UV index regularly peaks above 8 between 11am–3pm. Advise students to avoid midday outdoor activity."
"During the AQI spike period (days 45–55), wellness scores dropped an average of 9.2 points campus-wide."
```

---

#### 4.4.6 Page: Wellness Trends

**Purpose:** Long-term strategic view. Semester-on-semester patterns.

**Filters:** Academic year group / Branch / Hostel type (boys/girls) / Date range

**Chart 1 — Semester wellness trajectory:**
- Line chart: campus average wellness score from day 1 to day 90 of the semester
- If mock data simulates "last semester" as a comparison, overlay it
- Label key events: orientation week, first exam, mid-semester break, final exams, end of semester

**Chart 2 — Branch-wise wellness ranking:**
- Horizontal bar chart: one bar per branch, showing average wellness score for the semester
- Sorted descending
- Insight: which branches have the highest and lowest wellness averages

**Chart 3 — Academic year comparison:**
- Grouped bar chart: for each metric (Wellness / Activity / Sleep / Nutrition), show averages for each year (1st–4th)
- Common finding: 1st-year students often struggle more with sleep and nutrition adjustment
- 4th-year students often show higher stress before placements

**Chart 4 — Gender-hostel wellness comparison:**
- Simple summary comparing boys hostel aggregate vs girls hostel aggregate
- Metrics: Wellness Score, Activity, Sleep, Nutrition, Mood

**Longitudinal insight card:**
The most important insight from the semester's data in plain language.
Example: "This semester, campus wellness peaked in week 3 (score: 71.2) and hit its lowest point in week 10 (exam week, score: 54.8). Sleep is the metric most strongly correlated with overall wellness in your campus (correlation: 0.73)."

---

#### 4.4.7 Page: Generate Report

**Purpose:** Produce formal downloadable reports for institutional use.

**Report type selector:**
```
○ Monthly wellness summary — All hostels, all metrics, one month
○ Semester wellness report — Full 90-day analysis, all dimensions
○ Hostel-specific brief — One hostel, full analysis
○ Environmental impact report — AQI and weather correlation analysis
○ Nutrition and mess report — Campus nutrition gaps, mess quality analysis
○ Academic correlation report — Exam-week wellness impact analysis
```

**Scope options (depends on report type):**
- Hostel: All / Select specific hostels
- Date range: date picker
- Academic year: All / Select

**Privacy reminder (always visible):**
"Generated reports contain only anonymized, aggregated data. No individual student names, roll numbers, or identifying information are included. Groups below 30 students are suppressed."

**Format:** PDF / CSV

**Generate button** → shows spinner → "Report generated. Download ready."

**Recent reports table:**
```
Columns: Report type | Date generated | Scope | Format | Download
Last 20 reports listed
```

---

## SECTION 5 — ADMIN API ENDPOINTS

### 5.1 Auth

```
POST   /api/admin/auth/login
       Body: { email, password }
       Returns: { token, role, name, hostel_id }
```

### 5.2 Warden Endpoints

All warden endpoints require `role: "warden"` or `role: "dean"` in JWT.
All queries are automatically scoped to the warden's `hostel_id` from their JWT claim.

```
GET    /api/admin/warden/overview
       Query: hostel_id (from JWT, not user-supplied)
       Returns: KPI cards data, score distribution, weekly trend, top signals

GET    /api/admin/warden/activity
       Query: range (7d|14d|30d), academic_year (optional)
       Returns: daily activity trend, type breakdown, indoor/outdoor split, participation trend

GET    /api/admin/warden/nutrition
       Query: range, meal_type (optional)
       Returns: calorie trend, macro breakdown, skip rates, ratings, nutrient gaps

GET    /api/admin/warden/mood
       Query: range
       Returns: mood trend, heatmap, stress distribution, time-of-day pattern
       NOTE: only aggregate scores. No individual mood data ever returned.

GET    /api/admin/warden/alerts
       Returns: active alerts for this hostel + alert history

POST   /api/admin/warden/alerts/:alert_id/acknowledge
       Body: { note: optional string }

GET    /api/admin/warden/initiatives
       Returns: active and past initiatives for this hostel

POST   /api/admin/warden/initiatives
       Body: { title, description, goal_type, target_value, start_date, end_date }

GET    /api/admin/warden/export
       Query: report_type, range, format (csv|pdf)
       Returns: file download
```

### 5.3 Mess Manager Endpoints

All require `role: "mess_manager"` or `role: "dean"` in JWT.

```
GET    /api/admin/mess/overview
       Returns: KPI cards, meal participation chart, rating trend, insight card

GET    /api/admin/mess/ratings
       Query: range, meal_type, day_of_week
       Returns: ratings table, worst/best meals, tag cloud

GET    /api/admin/mess/nutrients
       Query: range
       Returns: nutrient gauges vs RDA, macro trend, recommendations

GET    /api/admin/mess/menu
       Query: week_number
       Returns: full weekly menu grid with nutritional totals

POST   /api/admin/mess/menu
       Body: { week_number, day_of_week, meal_type, food_items: [{food_id, quantity_g}] }
       Returns: created menu entry + nutritional calculations + allergen conflicts

PUT    /api/admin/mess/menu/:menu_id
       Body: same as POST
       Returns: updated entry

POST   /api/admin/mess/menu/publish
       Body: { week_number }
       Returns: { published: true } — makes menu visible in student app

GET    /api/admin/mess/feedback
       Query: range, meal_type
       Returns: feedback log table, trend chart, tag frequency breakdown
```

### 5.4 Dean Endpoints

All require `role: "dean"` in JWT.

```
GET    /api/admin/dean/campus-overview
       Returns: all 6 KPI cards, hostel heatmap data, 7-week trend, top 3 alerts

GET    /api/admin/dean/hostel-comparison
       Query: metric (wellness|activity|nutrition|sleep|mood), range
       Returns: bar chart data, radar chart data, academic year breakdown, gender comparison

GET    /api/admin/dean/academic-correlation
       Query: range
       Returns: wellness + calendar overlay data, branch breakdown, mood/stress correlation, recommendations

GET    /api/admin/dean/environmental-impact
       Query: range
       Returns: AQI trend, AQI vs activity scatter, env stress trend, activity shift data

GET    /api/admin/dean/wellness-trends
       Query: range, branch, hostel_type, academic_year
       Returns: semester trajectory, branch ranking, year comparison, gender comparison

POST   /api/admin/dean/academic-calendar
       Body: { events: [{ name, start_date, end_date, type }] }

POST   /api/admin/dean/generate-report
       Body: { report_type, scope, date_range, format }
       Returns: { report_id, download_url }

GET    /api/admin/dean/reports
       Returns: list of generated reports with download links
```

---

## SECTION 6 — MOCK DATA SEED SCRIPT

Write `seed_data.py`. Run once on first setup. Must generate all data before the admin dashboard can show anything meaningful.

```python
# seed_data.py

import random
import uuid
from datetime import datetime, timedelta, date, time
import json

# ── CONFIGURATION ──────────────────────────────────────────────────
NUM_STUDENTS = 1000
NUM_HOSTELS = 10
STUDENTS_PER_HOSTEL = 100
DAYS_OF_DATA = 90
EXAM_DAYS = list(range(30, 37)) + list(range(70, 77))   # days into dataset
AQI_SPIKE_DAYS = list(range(45, 56))                    # simulated winter smog
BASE_DATE = date.today() - timedelta(days=DAYS_OF_DATA)

HOSTELS = [
    {"name": "BH-1", "type": "boys"}, {"name": "BH-2", "type": "boys"},
    {"name": "BH-3", "type": "boys"}, {"name": "BH-4", "type": "boys"},
    {"name": "BH-5", "type": "boys"}, {"name": "GH-1", "type": "girls"},
    {"name": "GH-2", "type": "girls"}, {"name": "GH-3", "type": "girls"},
    {"name": "GH-4", "type": "girls"}, {"name": "GH-5", "type": "girls"},
]
BRANCHES = ["CSE", "ECE", "ME", "CE", "EE", "Textile", "Chemical", "Mathematics"]
YEARS = [1, 2, 3, 4]

FOOD_ITEMS = [
    {"name": "Dal fry", "cat": "dal", "cal": 180, "pro": 9, "carb": 28, "fat": 4, "fibre": 6, "veg": True},
    {"name": "Roti", "cat": "staple", "cal": 70, "pro": 3, "carb": 15, "fat": 0.5, "fibre": 2, "veg": True},
    {"name": "Rice (1 serving)", "cat": "staple", "cal": 130, "pro": 2.7, "carb": 28, "fat": 0.3, "fibre": 0.4, "veg": True},
    {"name": "Paneer sabzi", "cat": "vegetable", "cal": 220, "pro": 14, "carb": 8, "fat": 16, "fibre": 2, "veg": True},
    {"name": "Aloo sabzi", "cat": "vegetable", "cal": 150, "pro": 3, "carb": 25, "fat": 5, "fibre": 3, "veg": True},
    {"name": "Rajma", "cat": "dal", "cal": 200, "pro": 12, "carb": 30, "fat": 4, "fibre": 8, "veg": True},
    {"name": "Chole", "cat": "dal", "cal": 210, "pro": 11, "carb": 32, "fat": 5, "fibre": 9, "veg": True},
    {"name": "Mixed veg", "cat": "vegetable", "cal": 120, "pro": 3, "carb": 18, "fat": 4, "fibre": 5, "veg": True},
    {"name": "Palak paneer", "cat": "vegetable", "cal": 240, "pro": 15, "carb": 9, "fat": 17, "fibre": 3, "veg": True},
    {"name": "Egg curry", "cat": "non-veg", "cal": 180, "pro": 13, "carb": 5, "fat": 12, "fibre": 1, "veg": False},
    {"name": "Chicken curry", "cat": "non-veg", "cal": 250, "pro": 22, "carb": 6, "fat": 15, "fibre": 1, "veg": False},
    {"name": "Sambar", "cat": "dal", "cal": 90, "pro": 5, "carb": 14, "fat": 2, "fibre": 4, "veg": True},
    {"name": "Idli (2 pcs)", "cat": "staple", "cal": 140, "pro": 4, "carb": 28, "fat": 1, "fibre": 2, "veg": True},
    {"name": "Poha", "cat": "staple", "cal": 180, "pro": 3, "carb": 35, "fat": 4, "fibre": 2, "veg": True},
    {"name": "Upma", "cat": "staple", "cal": 190, "pro": 4, "carb": 32, "fat": 6, "fibre": 3, "veg": True},
    {"name": "Curd (1 bowl)", "cat": "dairy", "cal": 100, "pro": 8, "carb": 6, "fat": 4, "fibre": 0, "veg": True},
    {"name": "Buttermilk", "cat": "dairy", "cal": 40, "pro": 2, "carb": 4, "fat": 1, "fibre": 0, "veg": True},
    {"name": "Banana", "cat": "fruit", "cal": 90, "pro": 1, "carb": 23, "fat": 0.3, "fibre": 2.6, "veg": True},
    {"name": "Apple", "cat": "fruit", "cal": 80, "pro": 0.4, "carb": 21, "fat": 0.2, "fibre": 3.5, "veg": True},
    {"name": "Boiled egg", "cat": "non-veg", "cal": 78, "pro": 6, "carb": 0.6, "fat": 5, "fibre": 0, "veg": False},
    {"name": "Tea (1 cup)", "cat": "beverage", "cal": 40, "pro": 1, "carb": 6, "fat": 1, "fibre": 0, "veg": True},
    {"name": "Milk (1 glass)", "cat": "dairy", "cal": 150, "pro": 8, "carb": 12, "fat": 8, "fibre": 0, "veg": True},
    {"name": "Bread (2 slices)", "cat": "staple", "cal": 140, "pro": 5, "carb": 26, "fat": 2, "fibre": 2, "veg": True},
    {"name": "Sabzi (seasonal)", "cat": "vegetable", "cal": 100, "pro": 2.5, "carb": 15, "fat": 3.5, "fibre": 4, "veg": True},
    {"name": "Khichdi", "cat": "staple", "cal": 200, "pro": 7, "carb": 35, "fat": 5, "fibre": 3, "veg": True},
    {"name": "Paratha (1 pc)", "cat": "staple", "cal": 180, "pro": 4, "carb": 28, "fat": 7, "fibre": 2, "veg": True},
    {"name": "Halwa", "cat": "snack", "cal": 280, "pro": 3, "carb": 42, "fat": 12, "fibre": 1, "veg": True},
    {"name": "Biscuits (4 pcs)", "cat": "snack", "cal": 200, "pro": 3, "carb": 30, "fat": 8, "fibre": 1, "veg": True},
    {"name": "Namkeen (1 bowl)", "cat": "snack", "cal": 160, "pro": 4, "carb": 18, "fat": 9, "fibre": 2, "veg": True},
    {"name": "Moong dal chilla", "cat": "staple", "cal": 160, "pro": 10, "carb": 22, "fat": 4, "fibre": 5, "veg": True},
]

def generate_aqi(day_index):
    if day_index in AQI_SPIKE_DAYS:
        return random.randint(180, 280)
    return random.randint(45, 140)

def is_exam_day(day_index):
    return day_index in EXAM_DAYS

def generate_wellness_score(day_index, is_exam, aqi, base_mood):
    """Simulate realistic wellness scores with exam and AQI effects."""
    activity = random.gauss(45, 15)
    if is_exam:
        activity *= 0.65       # activity drops during exams
    activity = max(0, min(90, activity))
    activity_score = min(100, (activity / 45) * 100)

    calorie_pct = random.gauss(0.92, 0.12)
    if is_exam:
        calorie_pct *= 0.88    # students eat less during exams
    nutrition_score = max(0, min(100, 100 - abs(1.0 - calorie_pct) * 80))

    env_stress = min(100, max(0, (aqi - 50) / 2.5))

    mood = base_mood + random.gauss(0, 0.4)
    if is_exam:
        mood -= 1.2
    mood = max(1, min(5, mood))
    mood_deviation = abs(mood - base_mood) * 20
    mood_deviation = min(100, mood_deviation)

    score = (activity_score * 0.35) + (nutrition_score * 0.30) \
            - (env_stress * 0.15) - (mood_deviation * 0.20)
    return round(max(0, min(100, score)), 2), mood, activity

# Generate and insert all data using your DB connection
# Each student gets 90 days of: wellness_log, activity_log, nutrition_log, mood_log, sleep_log
# Also generate: environmental_snapshots, mess_menu, admin_alerts (threshold-based)
```

### Alert auto-generation logic (run after seeding daily data):

```python
def generate_admin_alerts(hostel_id, wellness_logs, activity_logs, mood_logs, sleep_logs):
    """
    After seeding 90 days of data, scan for threshold violations and
    insert into admin_alerts table.
    """
    alerts = []

    # Check rolling 5-day windows for each alert type
    for day in range(5, 90):
        window = wellness_logs[day-5:day]

        avg_sleep = sum(w["sleep_hours"] for w in window) / 5
        if avg_sleep < 6.5:
            alerts.append({
                "hostel_id": hostel_id,
                "alert_type": "sleep_deficit",
                "severity": "warning",
                "title": "Sleep deficit persisting",
                "metric_value": avg_sleep,
                "threshold_value": 6.5,
                "triggered_at": BASE_DATE + timedelta(days=day)
            })

        avg_mood = sum(w["mood_score"] for w in window) / 5
        if avg_mood < 2.5:
            alerts.append({
                "hostel_id": hostel_id,
                "alert_type": "mood_crisis",
                "severity": "critical",
                "title": "Sustained low mood",
                "metric_value": avg_mood,
                "threshold_value": 2.5,
                "triggered_at": BASE_DATE + timedelta(days=day)
            })

    return alerts
```

---

## SECTION 7 — FRONTEND COMPONENT STRUCTURE

```
src/admin/
  ├── pages/
  │   ├── Login.jsx
  │   ├── Unauthorized.jsx
  │   ├── warden/
  │   │   ├── WardenLayout.jsx          ← sidebar + persistent banner
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
  │   ├── KPICard.jsx                   ← reusable metric card
  │   ├── AlertCard.jsx                 ← alert with severity badge + ack button
  │   ├── PrivacyBanner.jsx             ← persistent anonymization notice
  │   ├── RoleBadge.jsx                 ← warden/mess/dean color badge
  │   ├── NutrientGauge.jsx             ← horizontal bar with RDA reference
  │   ├── HostelHeatmapGrid.jsx         ← 10-tile hostel grid (Dean page)
  │   ├── InsightCard.jsx               ← auto-generated plain language finding
  │   ├── ExportButton.jsx
  │   └── DateRangeFilter.jsx
  ├── api/
  │   ├── warden.js                     ← all warden API calls
  │   ├── mess.js
  │   ├── dean.js
  │   └── auth.js
  └── context/
      └── AdminAuthContext.jsx          ← JWT storage, role, redirect logic
```

---

## SECTION 8 — KEY IMPLEMENTATION RULES

**1. Role scope is enforced at the API layer, not the UI.**
The warden seeing only their hostel is not a frontend filter — the backend query uses `hostel_id` from the JWT claim. Even if someone manipulates the URL, the API returns 403.

**2. Mood and journal data are never in any admin API response.**
The fields `mood_emoji`, `mood_score`, `energy_level`, `stress_level`, and all journal entries are excluded from every admin endpoint by design. The admin mood report reads only the hostel-level aggregate computed from `wellness_logs.mood_score` — not from the `mood_logs` table directly.

**3. K-anonymity is enforced before any data leaves the database.**
The `enforce_k_anonymity()` function runs on every aggregation query. Groups with fewer than 30 data points return a suppressed placeholder, not zero or an empty string.

**4. The privacy banner is a component, not a page-level note.**
`<PrivacyBanner />` is imported into every admin layout (WardenLayout, MessLayout, DeanLayout). It cannot be toggled off. It is always visible.

**5. Alert counts are counts, not lists.**
The warden's "Needs Attention" KPI card shows a number (e.g., "11 students"). There is no endpoint, no list, no table, and no detail page that reveals which 11 students those are. The number exists to prompt action (create an initiative, reach out to counseling) — not investigation.

**6. All charts use Recharts.**
Use `ResponsiveContainer` wrapping all chart components. Charts must render cleanly at both 1280px and 768px viewport widths.

**7. AQI color coding follows CPCB (Indian standard), not AirNow (US standard).**
```
0–50:    Good           #55a84f (green)
51–100:  Satisfactory   #a3c853 (light green)
101–200: Moderate       #fff833 (yellow)
201–300: Poor           #f29c33 (orange)
301–400: Very Poor      #e93f33 (red)
401+:    Severe         #af2d24 (dark red)
```

**8. Empty states are required for every chart.**
When no data exists for a selected date range, show a friendly empty state with an illustration placeholder and message: "No data available for this period." Not a blank chart. Not an error.

---

## SECTION 9 — BUILD PRIORITY ORDER

Build in this exact sequence. Do not skip ahead.

```
Phase 1 — Backend foundation
  1. PostgreSQL schema creation (all tables from Section 2.2)
  2. seed_data.py — run it, verify 90 days of data for 1,000 students exists
  3. FastAPI auth system (JWT, role claims, RBAC middleware)
  4. Admin login endpoint + role routing

Phase 2 — Warden dashboard (highest judging value for role-specific UX)
  5. Warden overview page (KPIs + score distribution + weekly trend + signals)
  6. Warden activity report
  7. Warden nutrition report
  8. Warden mood & stress report
  9. Warden wellness alerts (with acknowledge functionality)
  10. Warden initiatives (create + view)

Phase 3 — Mess manager dashboard
  11. Mess overview
  12. Meal ratings page
  13. Nutrient analysis page
  14. Menu planner (with allergen checker)
  15. Feedback log

Phase 4 — Dean dashboard
  16. Campus overview (hostel heatmap + KPIs + 7-week trend)
  17. Hostel comparison (bar chart + radar chart)
  18. Academic correlation (with calendar input)
  19. Environmental impact
  20. Wellness trends
  21. Generate report (PDF/CSV export)

Phase 5 — Polish
  22. Export functionality for warden
  23. All empty states
  24. Responsive layout at 768px
  25. README with architecture documentation
```

---

*End of UniVitals Admin Dashboard Build Prompt*
*Team Hercules | FitFusion 2026 | Cognizance, IIT Roorkee*
*Student app included as context only — not the build target of this prompt*
