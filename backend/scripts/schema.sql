-- UniVitals PostgreSQL Schema
-- Run: psql -U postgres -d univitals -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- HOSTELS (create first)
CREATE TABLE IF NOT EXISTS hostels (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(10) NOT NULL,
  type      VARCHAR(10) NOT NULL,
  capacity  INTEGER DEFAULT 100,
  warden_id UUID
);

-- USERS
CREATE TABLE IF NOT EXISTS users (
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

ALTER TABLE hostels ADD CONSTRAINT IF NOT EXISTS fk_warden
  FOREIGN KEY (warden_id) REFERENCES users(id);

-- WELLNESS LOGS
CREATE TABLE IF NOT EXISTS wellness_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  wellness_score   FLOAT,
  activity_score   FLOAT,
  nutrition_score  FLOAT,
  mood_score       FLOAT,
  env_stress_score FLOAT,
  sleep_hours      FLOAT,
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_wl_date ON wellness_logs(date);
CREATE INDEX IF NOT EXISTS idx_wl_user ON wellness_logs(user_id);

-- ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
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
CREATE INDEX IF NOT EXISTS idx_al_date ON activity_logs(date);
CREATE INDEX IF NOT EXISTS idx_al_user ON activity_logs(user_id);

-- NUTRITION LOGS
CREATE TABLE IF NOT EXISTS nutrition_logs (
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
CREATE INDEX IF NOT EXISTS idx_nl_date ON nutrition_logs(date);
CREATE INDEX IF NOT EXISTS idx_nl_user ON nutrition_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_nl_meal ON nutrition_logs(meal_type);

-- MOOD LOGS (never queried by any admin endpoint)
CREATE TABLE IF NOT EXISTS mood_logs (
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
CREATE TABLE IF NOT EXISTS sleep_logs (
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
CREATE TABLE IF NOT EXISTS food_items (
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
CREATE TABLE IF NOT EXISTS mess_menu (
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
CREATE TABLE IF NOT EXISTS environmental_snapshots (
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
  real_feel_c           FLOAT,
  visibility_km         FLOAT,
  wind_kph              FLOAT,
  wind_gust_kph         FLOAT,
  pressure_mb           FLOAT,
  cloud_cover_pct       FLOAT,
  precip_1h_mm          FLOAT,
  precipitation_type    VARCHAR(30),
  sleep_risk_score      FLOAT,
  env_stress_score      FLOAT,
  source_payload        JSONB,
  UNIQUE(recorded_at)
);
CREATE INDEX IF NOT EXISTS idx_env_at ON environmental_snapshots(recorded_at);

-- ADMIN ALERTS
CREATE TABLE IF NOT EXISTS admin_alerts (
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
CREATE TABLE IF NOT EXISTS hostel_initiatives (
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
CREATE TABLE IF NOT EXISTS academic_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(200),
  start_date DATE,
  end_date   DATE,
  event_type VARCHAR(30),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- JOURNAL ENTRIES (replaces MongoDB collection — Fernet ciphertext stored as TEXT)
CREATE TABLE IF NOT EXISTS journal_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  entry_text TEXT NOT NULL,
  word_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- WELLNESS NUDGES (replaces MongoDB collection)
CREATE TABLE IF NOT EXISTS wellness_nudges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  generated_at TIMESTAMP DEFAULT NOW(),
  nudge_type   VARCHAR(30),
  message      TEXT,
  trigger      TEXT,
  acknowledged BOOLEAN DEFAULT FALSE
);

-- MESS FEEDBACK AGGREGATE (replaces MongoDB collection)
CREATE TABLE IF NOT EXISTS mess_feedback_aggregate (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date             DATE NOT NULL,
  meal_type        VARCHAR(20),
  feedback_summary JSONB,
  UNIQUE(date, meal_type)
);
