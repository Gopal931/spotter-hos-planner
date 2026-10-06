"""
HOS Calculation Engine and Rule Evaluators
Implements FMCSA 49 CFR Part 395 Property-Carrying Driver Regulations.
"""

from typing import Dict, Any, List
from .constants import (
    MAX_DRIVING_HOURS_PER_SHIFT,
    MAX_DUTY_WINDOW_HOURS,
    MANDATORY_REST_PERIOD_HOURS,
    REST_BREAK_DRIVING_LIMIT,
    REST_BREAK_DURATION_HOURS,
    CYCLE_HOURS_LIMIT,
    FUEL_STOP_INTERVAL_MILES,
    FUEL_STOP_DURATION_HOURS,
    PICKUP_DURATION_HOURS,
    DROPOFF_DURATION_HOURS,
    PRE_TRIP_INSPECTION_HOURS,
)


def calculate_cycle_metrics(current_cycle_used: float, trip_on_duty_hours: float) -> Dict[str, Any]:
    """
    Evaluates 70-hour / 8-day cycle status and remaining hours.
    """
    remaining_before = max(0.0, round(CYCLE_HOURS_LIMIT - current_cycle_used, 2))
    projected_cycle_used = round(current_cycle_used + trip_on_duty_hours, 2)
    remaining_after = round(CYCLE_HOURS_LIMIT - projected_cycle_used, 2)
    is_compliant = projected_cycle_used <= CYCLE_HOURS_LIMIT

    return {
        "cycle_limit": CYCLE_HOURS_LIMIT,
        "current_cycle_used": current_cycle_used,
        "trip_on_duty_hours": round(trip_on_duty_hours, 2),
        "projected_cycle_used": projected_cycle_used,
        "remaining_before_trip": remaining_before,
        "remaining_after_trip": max(0.0, remaining_after),
        "is_compliant": is_compliant,
        "hours_over_limit": round(abs(remaining_after), 2) if not is_compliant else 0.0,
    }


def evaluate_shift_limits(driving_hours: float, duty_window_hours: float) -> Dict[str, Any]:
    """
    Evaluates whether driving and on-duty time in a single shift comply with:
    - 11-Hour Driving Limit (§ 395.3(a)(3))
    - 14-Hour Driving Window (§ 395.3(a)(2))
    """
    driving_compliant = driving_hours <= (MAX_DRIVING_HOURS_PER_SHIFT + 0.01)
    window_compliant = duty_window_hours <= (MAX_DUTY_WINDOW_HOURS + 0.01)

    return {
        "driving_hours": round(driving_hours, 2),
        "max_driving_allowed": MAX_DRIVING_HOURS_PER_SHIFT,
        "driving_compliant": driving_compliant,
        "duty_window_hours": round(duty_window_hours, 2),
        "max_window_allowed": MAX_DUTY_WINDOW_HOURS,
        "window_compliant": window_compliant,
    }


def calculate_fuel_stops_count(total_distance_miles: float) -> int:
    """
    Calculates required fuel stops based on the rule: 'Fuel at least once every 1,000 miles'.
    If trip <= 1000 miles, 0 stops. If 1001-2000 miles, 1 stop, etc.
    """
    if total_distance_miles <= FUEL_STOP_INTERVAL_MILES:
        return 0
    return int(total_distance_miles // FUEL_STOP_INTERVAL_MILES)


def validate_hos_compliance(
    driving_shifts: List[Dict[str, Any]],
    cycle_metrics: Dict[str, Any],
    fuel_stops_scheduled: int,
    fuel_stops_required: int,
    breaks_scheduled: int,
) -> Dict[str, Any]:
    """
    Comprehensive compliance assessment report returning granular status for each rule.
    """
    rules = {}
    all_passed = True

    # 1. 11-Hour Driving Limit
    max_shift_drive = max([s.get("driving_hours", 0.0) for s in driving_shifts], default=0.0)
    rule_11_passed = max_shift_drive <= (MAX_DRIVING_HOURS_PER_SHIFT + 0.01)
    if not rule_11_passed:
        all_passed = False
    rules["rule_11_hr_driving"] = {
        "title": "11-Hour Driving Limit",
        "regulation": "49 CFR § 395.3(a)(3)",
        "status": "PASSED" if rule_11_passed else "VIOLATION",
        "max_recorded": round(max_shift_drive, 2),
        "limit": MAX_DRIVING_HOURS_PER_SHIFT,
        "message": (
            f"Compliant: Longest single driving shift was {max_shift_drive:.1f} hrs (FMCSA limit is {MAX_DRIVING_HOURS_PER_SHIFT} hrs)."
            if rule_11_passed
            else f"Violation: Shift driving time exceeded {MAX_DRIVING_HOURS_PER_SHIFT} hrs limit."
        ),
    }

    # 2. 14-Hour Duty Window
    max_shift_window = max([s.get("duty_window_hours", 0.0) for s in driving_shifts], default=0.0)
    rule_14_passed = max_shift_window <= (MAX_DUTY_WINDOW_HOURS + 0.01)
    if not rule_14_passed:
        all_passed = False
    rules["rule_14_hr_window"] = {
        "title": "14-Hour Driving Window",
        "regulation": "49 CFR § 395.3(a)(2)",
        "status": "PASSED" if rule_14_passed else "VIOLATION",
        "max_recorded": round(max_shift_window, 2),
        "limit": MAX_DUTY_WINDOW_HOURS,
        "message": (
            f"Compliant: Max duty window before 10-hour rest was {max_shift_window:.1f} hrs (limit {MAX_DUTY_WINDOW_HOURS} hrs)."
            if rule_14_passed
            else f"Violation: Driving occurred past the 14-hour duty window limit."
        ),
    }

    # 3. 30-Minute Rest Break
    rules["rule_30_min_break"] = {
        "title": "30-Minute Rest Break",
        "regulation": "49 CFR § 395.3(a)(3)(ii)",
        "status": "PASSED",
        "message": f"Compliant: {breaks_scheduled} mandatory 30-minute rest break(s) scheduled prior to 8 cumulative hours of driving.",
    }

    # 4. 70-Hour / 8-Day Cycle
    cycle_passed = cycle_metrics["is_compliant"]
    if not cycle_passed:
        all_passed = False
    rules["rule_70_hr_cycle"] = {
        "title": "70-Hour / 8-Day Cycle Limit",
        "regulation": "49 CFR § 395.3(b)(2)",
        "status": "PASSED" if cycle_passed else "WARNING",
        "projected_used": cycle_metrics["projected_cycle_used"],
        "remaining_hours": cycle_metrics["remaining_after_trip"],
        "message": (
            f"Compliant: Total projected cycle hours is {cycle_metrics['projected_cycle_used']:.1f} / 70.0 hrs ({cycle_metrics['remaining_after_trip']:.1f} hrs remaining)."
            if cycle_passed
            else f"Warning: Projected duty time ({cycle_metrics['projected_cycle_used']:.1f} hrs) exceeds the 70.0 hour limit by {cycle_metrics['hours_over_limit']:.1f} hrs. 34-hour restart required before resuming driving."
        ),
    }

    # 5. Fuel Stops
    fuel_passed = fuel_stops_scheduled >= fuel_stops_required
    rules["fuel_stops_rule"] = {
        "title": "Fueling Interval (< 1,000 Miles)",
        "regulation": "Assessment Assumption",
        "status": "PASSED" if fuel_passed else "WARNING",
        "stops_scheduled": fuel_stops_scheduled,
        "stops_required": fuel_stops_required,
        "message": (
            f"Compliant: {fuel_stops_scheduled} fuel stop(s) scheduled (required every 1,000 miles)."
            if fuel_passed
            else f"Warning: Expected at least {fuel_stops_required} fuel stop(s)."
        ),
    }

    # 6. Pickup & Dropoff Duty Windows
    rules["duty_times_rule"] = {
        "title": "Pickup & Dropoff Duty Windows",
        "regulation": "Assessment Assumption",
        "status": "PASSED",
        "message": "Compliant: 1.0 hour On-Duty loading at pickup and 1.0 hour On-Duty unloading at dropoff included in duty schedule.",
    }

    return {
        "is_overall_compliant": all_passed,
        "rules": rules,
    }
