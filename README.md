# UniVitals — Campus Wellness Intelligence Platform

FitFusion 2026 · Team Hercules · IIT Roorkee

A context-aware campus wellness platform with two products: an admin analytics dashboard (Warden / Mess Manager / Dean) and a student wellness portal.

## Stack

- **Frontend:** React 18, Vite, TailwindCSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **Routing:** React Router DOM v6
- **Data:** Client-side mock data (no backend required)

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173` (or next available port).

## Demo Credentials

**Admin**

| Role | Email | Password |
|------|-------|----------|
| Warden (BH-3) | warden@bh3.edu | warden123 |
| Mess Manager | mess@campus.edu | mess123 |
| Dean of Students | dean@campus.edu | dean123 |

**Student**

| Roll Number | Password |
|-------------|----------|
| 2021EE10492 | student123 |

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/admin/login` | Admin login |
| `/admin/warden` | Warden dashboard (7 pages) |
| `/admin/mess` | Mess Manager dashboard (5 pages) |
| `/admin/dean` | Dean dashboard (6 pages) |
| `/student/login` | Student login |
| `/student` | Student portal (8 pages) |

## Features

**Admin Dashboard**
- Role-based access: Warden sees only their hostel; Dean sees all
- Wellness score distribution, 28-day trends, activity/nutrition/mood reports
- Hostel heatmap, academic correlation, environmental AQI impact
- Alert system with k-anonymity (min group size: 30 students)
- Menu planner, nutrient gap analysis, meal ratings for Mess Manager
- AI analytics assistant (pre-scripted, context-aware)

**Student Portal**
- Daily wellness score (sleep 30% + activity 25% + nutrition 20% + mood 15% + consistency 10%)
- Logging: nutrition, activity, mood, sleep, encrypted journal
- Achievements, streaks, anonymous leaderboard
- SOS Hub with 24/7 crisis resources
- AI wellness assistant (pre-scripted, context-aware)
- Environment card (AQI, temperature, outdoor safety)

## Design System

- **Font:** JetBrains Mono (monospace throughout)
- **Palette:** `#111827` (primary), `#F3F4F6` (bg), `#E5E7EB` (border), `#FFFFFF` (card)
- **Style:** 1px borders, blueprint aesthetic, abstract SVG geometric patterns
- **Responsive:** Mobile-first with slide-in sidebar on all breakpoints

## Privacy

All admin views show aggregated data only. No individual student records are ever surfaced. Mood journals are simulated as client-side encrypted. Minimum cohort size for any metric: 30 students.
