# Spotter HOS Trip Planner & ELD Log Generator

A production-grade Full Stack web application built for **Spotter AI's Full Stack Developer Assessment**. The system calculates commercial truck routes, applies Federal Motor Carrier Safety Administration (**FMCSA 49 CFR Part 395**) Hours of Service regulations, generates compliant driving/rest schedules, and renders official 24-hour **Driver's Daily Log / ELD sheets**.

---

## 1. Project Overview
Long-haul property-carrying commercial vehicle drivers are legally required to log their duty status and comply with strict FMCSA Hours of Service (HOS) rules. 

This application provides a SaaS dashboard for dispatchers and drivers:
1. Accepts **Current Location**, **Pickup Location**, **Dropoff Location**, and **Current Cycle Used (Hours)**.
2. Geocodes locations and generates real-world highway driving routes, distances, and travel times via OpenStreetMap / OSRM.
3. Automatically computes compliant driving schedules incorporating mandatory 30-minute breaks, 10-hour sleeper berth resets, 1-hour loading/unloading duty windows, and fuel stops every 1,000 miles.
4. Generates authentic FMCSA **24-Hour Driver Daily Log / ELD graph sheets** where each calendar day strictly balances to 24.0 hours across the 4 standard duty categories.

---

## 2. Key Features
- **Interactive Routing & Geocoding**: Calculates real highway distance and multi-point route geometry between Origin, Shipper, and Receiver.
- **Dynamic Leaflet Map**: Interactive map displaying colored routes (`Leg 1: Current → Pickup` in cyan, `Leg 2: Pickup → Dropoff` in purple) and custom SVG map markers for Origin, Pickup, Dropoff, Fuel Stops, 30-min Breaks, and 10-hr Rest stops.
- **FMCSA Part 395 Rules Engine**: Evaluates the 11-hour driving limit, 14-hour duty window, 30-minute rest break after 8 hours of driving, and the 70-hour / 8-day rolling cycle.
- **Fuel Stop Scheduling**: Automatically injects 30-minute On-Duty fueling stops before crossing 1,000 cumulative miles.
- **Official ELD 24-Hour Graph Sheet (RODS)**:
  - Generates authentic 24-hour visual grids with 15-minute, 30-minute, and 1-hour ticks.
  - Draws continuous step-line graph across all 4 duty statuses:
    1. *Off Duty*
    2. *Sleeper Berth*
    3. *Driving*
    4. *On Duty (Not Driving)*
  - Subtotals each row with mathematical verification ensuring the sum strictly equals **24.00 hours**.
  - City, state, and activity remarks for every duty status change.
  - Driver 70-Hour / 8-Day recap calculations.
  - Multi-day pagination tabs (`Day 1`, `Day 2`, etc.) and instant browser print/PDF export.
- **Quick Demo Scenarios**: Pre-configured route presets for fast demonstration:
  - East Coast to Midwest (`New York, NY → Philadelphia, PA → Chicago, IL`)
  - Long Haul Cross-Country (`Los Angeles, CA → Phoenix, AZ → Dallas, TX`)
  - Pacific Northwest Regional (`Seattle, WA → Tacoma, WA → Portland, OR`)
  - High Cycle Warning (`Miami, FL → Atlanta, GA → Nashville, TN`, 62 hrs used)

---

## 3. Tech Stack
- **Frontend**:
  - React 19
  - TypeScript
  - Vite
  - Tailwind CSS v4
  - Leaflet & React-Leaflet
  - Lucide React (Icons)
- **Backend**:
  - Python 3.13
  - Django 6.1
  - Django REST Framework (DRF)
  - django-cors-headers
  - Requests & Pytest
  - Gunicorn (WSGI production server)
- **Mapping & Routing**:
  - OpenStreetMap (Tile layer & Geocoding)
  - OSRM (Open Source Routing Machine) highway route service

---

## 4. Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React + Vite + TS                    │
│   (Tailwind CSS, Lucide Icons, Leaflet / React-Leaflet)│
│                                                        │
│  ┌───────────────┐ ┌────────────────┐ ┌──────────────┐ │
│  │ Trip Input &  │ │ Interactive    │ │ 24-Hr ELD Log│ │
│  │ Presets Card  │ │ Route Map      │ │ Sheet Canvas │ │
│  └───────┬───────┘ └────────▲───────┘ └──────▲───────┘ │
└──────────┼──────────────────┼────────────────┼─────────┘
           │ HTTP POST        │ JSON response  │
           ▼                  │                │
┌──────────────────────────────────────────────┴─────────┐
│               Django REST Framework API                │
│                                                        │
│  [ api/trips/plan/ ]  ───►  TripPlanView               │
│                                  │                     │
│    ┌─────────────────────────────┴────────────────┐    │
│    │                                              │    │
│    ▼                                              ▼    │
│  Routing & Geocoding Service           HOS Calculation │
│  (OSRM / OpenStreetMap / Fallback)     & Scheduling    │
│                                        Engine          │
│                                        (Part 395 Rules)│
└────────────────────────────────────────────────────────┘
```

The core business logic is strictly isolated in `backend/hos/`:
- `constants.py`: FMCSA Part 395 thresholds, duty statuses, and assessment assumptions.
- `calculator.py`: Pure mathematical evaluation of shift limits, cycle metrics, and compliance checks.
- `scheduler.py`: Chronological trip event simulator and 24-hour ELD log sheet calendar segmentation.
- `routing.py`: Geocoding and OSRM highway routing with offline fallback dictionary.
- `serializers.py`: DRF input validation and custom error formatting.

---

## 5. Assessment Assumptions
The application strictly respects the assumptions specified in the assessment:
1. **Property-Carrying Driver**: Regulated under 49 CFR Part 395 for property carriers (not passenger carriers).
2. **70 Hours / 8 Days Cycle**: Drivers operate under the 70-hour / 8-day rolling schedule (§ 395.3(b)(2)).
3. **No Adverse Driving Conditions**: Standard driving conditions assumed (§ 395.1(b)(1) adverse exceptions omitted).
4. **Fuel Interval**: Fuel at least once every 1,000 miles. Each fueling stop is modeled as **30 minutes On Duty (Not Driving)**.
5. **Pickup Window**: **1.0 hour On Duty (Not Driving)** for cargo loading and inspection at shipper.
6. **Dropoff Window**: **1.0 hour On Duty (Not Driving)** for cargo unloading and paperwork at receiver.
7. **Pre-Trip Inspection**: **15 minutes On Duty (Not Driving)** at the start of each driving shift.
8. **Calendar Day Normalization**: Calendar days run 00:00 to 24:00 home terminal time. Pre-departure and post-arrival off-duty hours are populated so that every generated log sheet sums up to **24.0 hours**.

---

## 6. FMCSA Hours of Service Rules Implemented
| Rule | Regulation | Implementation in Engine |
|---|---|---|
| **11-Hour Driving Limit** | 49 CFR § 395.3(a)(3) | Driving is capped at 11 cumulative hours per shift. Exceeding triggers a 10-hour rest period. |
| **14-Hour Driving Window** | 49 CFR § 395.3(a)(2) | CMV driving cannot occur past the 14th consecutive hour after coming on duty until 10 hours rest is completed. |
| **30-Minute Rest Break** | 49 CFR § 395.3(a)(3)(ii) | A mandatory 30-minute consecutive break from driving is scheduled before 8 cumulative hours of driving. |
| **10 Consecutive Hours Rest** | 49 CFR § 395.3(a)(1) | Mandatory 10 consecutive hours off duty / sleeper berth completely resets the 11-hour and 14-hour clocks. |
| **70-Hour / 8-Day Cycle** | 49 CFR § 395.3(b)(2) | Tracks cumulative on-duty hours against the 70.0 hour limit. Flags compliance warnings if exceeded. |
| **34-Hour Restart** | 49 CFR § 395.3(c) | Documented and surfaced in compliance alerts when total cycle hours would exceed 70.0 hours. |

---

## 7. API Documentation

### Health Check
`GET /api/health/`

**Response:**
```json
{
  "status": "online",
  "service": "Spotter HOS Trip Planner API",
  "version": "1.0.0"
}
```

### Plan Trip & Generate HOS Logs
`POST /api/trips/plan/`

**Request Body:**
```json
{
  "current_location": "New York, NY",
  "pickup_location": "Philadelphia, PA",
  "dropoff_location": "Chicago, IL",
  "cycle_used_hours": 30.0,
  "start_time": "2026-10-07T06:00:00"
}
```

**Response Payload (200 OK):**
```json
{
  "success": true,
  "inputs": {
    "current_location": {"name": "New York, NY", "lat": 40.7128, "lng": -74.006},
    "pickup_location": {"name": "Philadelphia, PA", "lat": 39.9526, "lng": -75.1652},
    "dropoff_location": {"name": "Chicago, IL", "lat": 41.8781, "lng": -87.6298},
    "cycle_used_hours": 30.0
  },
  "summary": {
    "total_distance_miles": 854.2,
    "total_driving_time_hours": 15.5,
    "total_trip_duration_hours": 31.7,
    "total_on_duty_hours": 21.25,
    "current_cycle_used": 30.0,
    "projected_cycle_used": 51.25,
    "cycle_remaining_hours": 18.75,
    "fuel_stops_count": 0,
    "rest_stops_count": 1,
    "breaks_count": 1,
    "is_compliant": true,
    "status_message": "Trip is fully HOS compliant."
  },
  "compliance": {
    "is_overall_compliant": true,
    "rules": {
      "rule_11_hr_driving": {"title": "11-Hour Driving Limit", "status": "PASSED"},
      "rule_14_hr_window": {"title": "14-Hour Driving Window", "status": "PASSED"},
      "rule_30_min_break": {"title": "30-Minute Rest Break", "status": "PASSED"},
      "rule_70_hr_cycle": {"title": "70-Hour / 8-Day Cycle Limit", "status": "PASSED"},
      "fuel_stops_rule": {"title": "Fueling Interval (< 1,000 Miles)", "status": "PASSED"},
      "duty_times_rule": {"title": "Pickup & Dropoff Duty Windows", "status": "PASSED"}
    }
  },
  "route": { ... },
  "schedule": [ ... ],
  "daily_logs": [
    {
      "day_number": 1,
      "date": "2026-10-07",
      "carrier_name": "Spotter Express Logistics",
      "total_miles_today": 499.7,
      "duty_totals": {
        "off_duty": 6.5,
        "sleeper_berth": 5.25,
        "driving": 11.0,
        "on_duty_not_driving": 1.25,
        "total_hours": 24.0
      },
      "grid_segments": [ ... ],
      "remarks": [ ... ],
      "recap": {
        "on_duty_hours_today": 12.25,
        "total_hours_last_8_days": 42.25,
        "hours_available_tomorrow": 27.75
      }
    }
  ]
}
```

---

## 8. Setup Instructions

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ (tested on Node v22)
- npm 9+

### Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```
Backend API will be running at `http://127.0.0.1:8000/`.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend development server will be running at `http://127.0.0.1:5173/`.

---

## 9. Testing Instructions

The test suite thoroughly validates HOS rules, edge cases, 24-hour log balancing, and DRF endpoints.

To run the backend tests:
```bash
cd backend
pytest -v
```

**Test Coverage Highlights:**
- `test_cycle_metrics_within_limit`: Validates remaining hours on 70-hour cycle.
- `test_cycle_metrics_exceeding_70_hours`: Validates violation flag and hours over limit.
- `test_fuel_stops_count`: Validates fueling intervals (<1,000 miles vs >1,000 miles).
- `test_shift_limits_compliant` / `test_shift_limits_violation`: Tests 11-hour driving and 14-hour window boundaries.
- `test_trip_simulation_and_24hr_log_balance`: Validates that every generated daily log sheet mathematically sums to **24.0 hours**.
- `test_fuel_stop_scheduled_for_long_haul`: Verifies that fuel stops are injected on trips exceeding 1,000 miles.
- `test_plan_trip_valid_request`: End-to-end API validation.
- `test_plan_trip_negative_cycle_hours_validation` & `test_plan_trip_over_70_cycle_hours_validation`: Validates input constraint handling.

To build and check frontend types:
```bash
cd frontend
npm run build
```

---

## 10. Deployment Instructions

### Frontend (Vercel)
1. Fork or push this repository to GitHub.
2. In Vercel, select **Import Project** and select this repo.
3. Configure settings:
   - Root Directory: `frontend`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Set Environment Variable:
   - `VITE_API_BASE_URL`: URL of your hosted backend (e.g. `https://spotter-hos-api.onrender.com/api`).
5. Deploy.

### Backend (Render / Railway)
1. Create a **New Web Service** pointing to the repository.
2. Configure settings:
   - Root Directory: `backend`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt && python manage.py migrate`
   - Start Command: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
3. Set Environment Variables:
   - `DJANGO_SECRET_KEY`: `<generate-a-secure-key>`
   - `DJANGO_DEBUG`: `False`
   - `ALLOWED_HOSTS`: `*`
   - `CORS_ALLOWED_ORIGINS`: `https://your-frontend-app.vercel.app`
4. Deploy.

---

## 11. Known Limitations & Engineering Assumptions
- **Public OSRM Rate Limiting**: The app uses public OpenStreetMap and OSRM endpoints. To guarantee 100% uptime in high-traffic or offline environments, a fallback geographic routing model is implemented with geodesic coordinates and standard truck highway cruising speeds (55 mph).
- **Adverse Driving & Sleeper Berth Split**: Adverse driving condition extensions and split-sleeper berth exceptions (8/2 or 7/3) were omitted per the explicit assessment instructions to keep HOS rules standard and focused on the core 11hr/14hr/70hr rules.
