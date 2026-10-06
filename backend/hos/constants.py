"""
FMCSA Hours of Service (HOS) Constants and Assessment Assumptions
Reference: FMCSA 49 CFR Part 395 & Spotter AI Full Stack Assessment
"""

# FMCSA Record of Duty Status (RODS) Categories
DUTY_STATUS_OFF_DUTY = "OFF_DUTY"
DUTY_STATUS_SLEEPER_BERTH = "SLEEPER_BERTH"
DUTY_STATUS_DRIVING = "DRIVING"
DUTY_STATUS_ON_DUTY_NOT_DRIVING = "ON_DUTY_NOT_DRIVING"

DUTY_STATUSES = [
    DUTY_STATUS_OFF_DUTY,
    DUTY_STATUS_SLEEPER_BERTH,
    DUTY_STATUS_DRIVING,
    DUTY_STATUS_ON_DUTY_NOT_DRIVING,
]

DUTY_STATUS_LABELS = {
    DUTY_STATUS_OFF_DUTY: "Off Duty",
    DUTY_STATUS_SLEEPER_BERTH: "Sleeper Berth",
    DUTY_STATUS_DRIVING: "Driving",
    DUTY_STATUS_ON_DUTY_NOT_DRIVING: "On Duty (Not Driving)",
}

# FMCSA Part 395 Property-Carrying Driver Limits
MAX_DRIVING_HOURS_PER_SHIFT = 11.0     # 11-Hour Driving Limit (§ 395.3(a)(3))
MAX_DUTY_WINDOW_HOURS = 14.0           # 14-Hour Driving Window (§ 395.3(a)(2))
MANDATORY_REST_PERIOD_HOURS = 10.0     # 10 Consecutive Hours Off Duty / Sleeper Berth (§ 395.3(a)(1))
REST_BREAK_DRIVING_LIMIT = 8.0         # 30-min break required after 8 hrs cumulative driving (§ 395.3(a)(3)(ii))
REST_BREAK_DURATION_HOURS = 0.5        # 30-Minute Rest Break
CYCLE_HOURS_LIMIT = 70.0               # 70-Hour / 8-Day Rule (§ 395.3(b)(2))
CYCLE_RESTART_HOURS = 34.0             # 34-Hour Restart (§ 395.3(c))

# Spotter Assessment Assumptions
FUEL_STOP_INTERVAL_MILES = 1000.0      # Fuel at least once every 1,000 miles
FUEL_STOP_DURATION_HOURS = 0.5         # 30 minutes On Duty (Not Driving)
PICKUP_DURATION_HOURS = 1.0            # 1 hour for pickup (On Duty Not Driving)
DROPOFF_DURATION_HOURS = 1.0           # 1 hour for dropoff (On Duty Not Driving)
PRE_TRIP_INSPECTION_HOURS = 0.25       # 15 minutes pre-trip inspection at start of driving shift

# Default fleet metadata for Daily Log generation
DEFAULT_CARRIER_NAME = "Spotter Express Logistics"
DEFAULT_OFFICE_ADDRESS = "100 South State St, Chicago, IL"
DEFAULT_TRUCK_NUMBER = "TRK-5042"
DEFAULT_TRAILER_NUMBER = "TRL-9810"
DEFAULT_SHIPPER_COMMODITY = "Commercial Freight / Dry Van Goods"
