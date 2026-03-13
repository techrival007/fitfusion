

## Team Name: Hercules
## Contact No.: 9359812368

## Name City Branch E-mail Institute
## Name
## Cognizance
## ID
## Radhika
## Goel
## Delhi

Electrical  radhikagoel477@gmail.com IIT
## Delhi
cogni2058319
Harsh Parihar Delhi Textile harshis.add@gmail.com IIT Delhi cogni2058323
## Rakshit Modi Delhi Computer
## Science
modirakshit16@gmail.com IIT Delhi cogni2058523
## Dinu Goyal Delhi Computer
science
goyaldinu321@gmail.com IIT Delhi cogni2057918




UniVitals: A Context-Aware Wellness Intelligence Platform for Smart Campuses
## Proposed Solution
UniVitals is a wellness application that works on various platforms. It combines nutrition,
physical activity, mental well-being, and environmental conditions into a single, context-
aware campus fitness system. Unlike traditional fitness trackers that look at data
separately, UniVitals connects different campus data to provide personalized, privacy-
friendly recommendations. It also generates anonymized insights to help with wellness
planning at the institution level.
## System Architecture & Technical Stack
UniVitals will be developed as a mobile and web application using:
Frontend: Expo (React Native) for student and administrator interfaces
Backend: FastAPI (Python) for high-performance, asynchronous RESTful services
## Database Architecture:
- PostgreSQL for structured data such as user profiles, activity logs, and nutrition data
- MongoDB for unstructured data like mess menus and optional reflections
Caching Layer: Redis for real-time environmental updates
External APIs: AQI and weather APIs
The system uses a modular service-based architecture. It separates the User Interaction
Layer, Wellness Intelligence Engine, Environmental Data Processor, and Privacy & Access
Control Layer. This design ensures scalability, reliability, and secure data separation.
Documentation includes detailed High-Level Design (HLD) and Low-Level Design (LLD)
shown through UML class and sequence diagrams. These follow Object-Oriented Analysis
and Design (OOAD) principles.
UI/UX Design Approach
High-fidelity user interface prototypes are created in Figma for both student and
administrator dashboards. The design focuses on easy navigation, smooth interaction, and
clear data visualization.
Key interfaces include:
- Student Dashboard (wellness score, behavioral trends, contextual nudges)

- Admin Analytics Dashboard (group insights at the hostel level and time-based trend
reports)
## - Nutrition Logging Interface
## - Activity Tracking Module
Micro-interaction design elements, like emoji-based mood input, reduce user effort while
keeping them engaged.
## Data Processing & Intelligence Engine
UniVitals integrates five main data streams:
- Nutrition logging on campus
- Records of physical activity
- Emoji-based mood check-ins
- Patterns in sleep and activity consistency
- Environmental indicators (AQI, weather, occupancy)
A Behavioral Deviation Engine looks for changes from individual baseline trends, like drops
in activity, nutritional issues, or sleep problems. Instead of diagnosing mental conditions,
the system spots wellness issues and offers supportive suggestions such as breathing
exercises, indoor workout ideas, or links to counseling resources.
The platform calculates a dynamic wellness score using contextual weighting:
Score = (Activity + Nutrition) - (Environmental_Stress + Mood_Deviation)
Environmental indicators refresh every 30 minutes to keep recommendations accurate.
## Privacy & Security Framework
UniVitals follows a privacy-by-design approach:
- AES-256 encryption for sensitive information
- Role-Based Access Control (RBAC)
- Aggregated reporting using k-anonymity (with a minimum of 30 users per group)
- No admin access to individual mood logs or reflections
Administrators can only see anonymized summaries, such as campus-wide stress trends
and wellness indices for hostels.

## Assumptions
The prototype simulates:
- 1,000 active users (approximately 100 users per hostel)
- 10 hostels
- 4 daily mess menus
- Environmental updates every 30 minutes
All datasets are mock-generated to adhere to confidentiality guidelines.