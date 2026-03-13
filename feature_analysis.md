# UniVitals Feature Analysis & System Design 

Based on the **FitFusion'26** problem statement and the comprehensive guide in the `UNIVITALS_ADMIN_PROMPT.md`, along with research into modern student wellness platforms, here is a detailed analysis of the core features necessary for the final prototype.

## The Core Concept
UniVitals is a **Context-Aware Wellness Intelligence Platform** for university campuses. Unlike standard fitness trackers, it synthesizes the interconnections between physical activity, mess food nutrition, environmental conditions (like AQI), and academic stress to present a holistic health index.

---

## 🏗 System Architecture & Technology Stack
- **Frontend** The final prototype will be built entirely using **React** with **TailwindCSS** for rapid, responsive UI development, and `lucide-react` for scalable SVG icon sets.
- **Routing**: `react-router-dom` to handle role-based navigation and deep linking.
- **Data Visualization**: `recharts` for handling complex wellness trend data securely inside the browser.
- **Design Paradigm**: Strict monochromatic "blueprint" aesthetic. JetBrains Mono font throughout, stark white & dark gray high-contrast, strict 1px borders, and low-opacity geometric SVGs as opposed to generic photography.

---

## Product 1: The Administrative Dashboard

The Admin Dashboard provides powerful, privacy-first analytics to three distinct roles without *ever* exposing identifiable individual data.

### Core Features (From Context)
1. **Three-Tier Access System**
   - **Warden View**: Scoped strictly to one hostel. Tracks sleep deficits, activity droughts, and localized stress.
   - **Mess Manager View**: Campus-wide nutrition. Focuses on mess menu planning, meal skip rates, macronutrient gap analysis, and student feedback.
   - **Dean of Students View**: Campus-wide aggregate data. Correlates wellness scores to academic events (like exams) and environmental changes (like AQI spikes).
2. **K-Anonymized Aggregation**
   - Data is dynamically grouped. Any grouping smaller than 30 students is computationally suppressed, preventing identification through cross-referencing.
3. **Automated "Wellness Alerts"**
   - e.g., "Mood Crisis" (hostel average mood drops < 2.5 for 3 consecutive days) or "Activity Drought" (<35% activity participation).
4. **Academic Correlation Overlay**
   - The ability to map exam schedules over wellness timelines to visualize the exact scale of health deterioration during pre-exam weeks.

### Augmented Features (From Industry Research)
1. **Automated Campaign & Nudge Integration**
   - Allowing admins to run automated targeted campaigns. For example, triggering a "Hydration Reminder" or "Mental Health Workshop Push" directly to students based on aggregated low-wellness patterns.
2. **Resource & Facility Utilization Tracking**
   - Tracking gym density, counselor appointment availability, and common space utilization over time to justify campus-level infrastructural developments.
3. **Emergency Crisis Broadcasts**
   - When environmental conditions trigger Severe thresholds (AQI > 400), a one-click notification system that broadcasts "Stay Indoors" warnings synchronously across all student interfaces.

---

## Product 2: The Student Entry System (Student App)

The student application acts as the lifeblood of the dashboard. It must be engaging enough to convince students to log consistently, without feeling like an administrative chore.

### Core Features (From Context)
1. **Daily Frictionless Logging**
   - **Nutrition**: Drop-down selections of the day’s published mess menu. Captures calories and macros automatically.
   - **Activity**: Granular activity tracking (type, intensity, duration, indoor/outdoor).
   - **Mood & Sleep**: Emoji-based check-ins and sleep cycle estimation.
2. **Private Encrypted Journaling**
   - A highly secure space for students to vent or reflect. This data remains functionally invisible to the system admins, serving strictly as a personal mental outlet.
3. **Personalized Wellness Score**
   - A dynamico algorithm calculating: `(Activity × 0.35) + (Nutrition × 0.30) - (Env Stress × 0.15) - (Mood Deviation × 0.20)`.

### Augmented Features (Empathizing with Students & Industry Tech)
1. **Micro-Gamification & Peer Tiers**
   - Without violating privacy, provide "Anonymous Hostel Leaderboards" (e.g., "BH-1 is currently 15% more active than the campus average"). 
   - Gamified streak systems to build habit retention.
2. **Academic-Mode & Productivity Timers**
   - Combining wellness tracking with study support: integrated Pomodoro timers that encourage students to stretch/hydrate between intense focus blocks. 
3. **"Panic Button" / SOS Hub**
   - A one-tap emergency directory linked directly to campus security, university psychologists, and crisis hotlines, immediately fulfilling student safety needs.
4. **Guided Interventions (Audio/Visual)**
   - When a student's mood or stress spikes, the app proactively surfaces 2-minute interactive breathing exercises or quick stretching routines, rather than waiting for professional intervention.

---

## The Unified Prototype Execution Strategy
To meet the "React & Pure Web" requirement, I will construct a comprehensive Single Page Application (SPA) that combines these components. 

1. **Routing Strategy**: `/student/*` routes will house the frictionless UI for data entry and personal analytics. `/admin/*` routes will showcase the heavy data visualization intended for stakeholders.
2. **Theming Strategy**: A strict design token system adhering to JetBrains Mono, #111827 deep charcoal, and abstract geometric depth instead of standard images.
3. **Mock Data Simulation**: Since a backend cannot be natively spun up on a static web prompt, I will implement robust, context-aware mock services directly within the React state to drive the data visualizations (Charts).
