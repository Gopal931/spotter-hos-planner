"""
Unit tests for HOS regulations and calculation engine.
Verifies compliance with FMCSA 49 CFR Part 395 and Spotter assessment assumptions.
"""

import pytest
from datetime import datetime
from hos.constants import (
    MAX_DRIVING_HOURS_PER_SHIFT,
    MAX_DUTY_WINDOW_HOURS,
    MANDATORY_REST_PERIOD_HOURS,
    CYCLE_HOURS_LIMIT,
    FUEL_STOP_INTERVAL_MILES,
    DUTY_STATUS_DRIVING,
    DUTY_STATUS_ON_DUTY_NOT_DRIVING,
    DUTY_STATUS_OFF_DUTY,
    DUTY_STATUS_SLEEPER_BERTH,
)
from hos.calculator import (
    calculate_cycle_metrics,
    calculate_fuel_stops_count,
    evaluate_shift_limits,
    validate_hos_compliance,
)
from hos.scheduler import HOSTripScheduler


class TestHOSCalculator:
    """Tests for pure math and rule evaluators."""

    def test_cycle_metrics_within_limit(self):
        metrics = calculate_cycle_metrics(current_cycle_used=30.0, trip_on_duty_hours=20.0)
        assert metrics["projected_cycle_used"] == 50.0
        assert metrics["remaining_after_trip"] == 20.0
        assert metrics["is_compliant"] is True
        assert metrics["hours_over_limit"] == 0.0

    def test_cycle_metrics_exceeding_70_hours(self):
        metrics = calculate_cycle_metrics(current_cycle_used=60.0, trip_on_duty_hours=15.0)
        assert metrics["projected_cycle_used"] == 75.0
        assert metrics["remaining_after_trip"] == 0.0
        assert metrics["is_compliant"] is False
        assert metrics["hours_over_limit"] == 5.0

    def test_fuel_stops_count(self):
        # Under 1,000 miles: 0 stops
        assert calculate_fuel_stops_count(450.0) == 0
        assert calculate_fuel_stops_count(1000.0) == 0
        # Over 1,000 miles: at least 1 stop per 1,000 miles
        assert calculate_fuel_stops_count(1200.0) == 1
        assert calculate_fuel_stops_count(2500.0) == 2

    def test_shift_limits_compliant(self):
        result = evaluate_shift_limits(driving_hours=10.5, duty_window_hours=13.5)
        assert result["driving_compliant"] is True
        assert result["window_compliant"] is True

    def test_shift_limits_violation(self):
        result = evaluate_shift_limits(driving_hours=11.5, duty_window_hours=14.5)
        assert result["driving_compliant"] is False
        assert result["window_compliant"] is False


class TestHOSTripScheduler:
    """Tests for full trip simulation and 24-hour ELD log balancing."""

    @pytest.fixture
    def sample_trip_setup(self):
        curr_loc = {"name": "New York, NY", "lat": 40.7128, "lng": -74.006}
        pickup_loc = {"name": "Philadelphia, PA", "lat": 39.9526, "lng": -75.1652}
        dropoff_loc = {"name": "Chicago, IL", "lat": 41.8781, "lng": -87.6298}

        # Route coordinates dummy lists
        leg1 = {
            "distance_miles": 95.0,
            "duration_hours": 1.9,
            "coordinates": [[40.7128, -74.006], [39.9526, -75.1652]],
        }
        leg2 = {
            "distance_miles": 760.0,
            "duration_hours": 13.8,
            "coordinates": [[39.9526, -75.1652], [41.8781, -87.6298]],
        }
        return curr_loc, pickup_loc, dropoff_loc, leg1, leg2

    def test_trip_simulation_and_24hr_log_balance(self, sample_trip_setup):
        curr, pickup, dropoff, leg1, leg2 = sample_trip_setup
        scheduler = HOSTripScheduler(
            current_loc=curr,
            pickup_loc=pickup,
            dropoff_loc=dropoff,
            leg1_route=leg1,
            leg2_route=leg2,
            current_cycle_used=25.0,
            start_datetime=datetime(2026, 10, 7, 6, 0, 0),
        )

        plan = scheduler.plan_trip()

        # 1. Summary checks
        summary = plan["summary"]
        assert summary["total_distance_miles"] == 855.0
        assert summary["total_driving_time_hours"] == 15.7
        assert summary["is_compliant"] is True

        # 2. Verify rest breaks were scheduled since drive time > 11 hrs
        assert summary["rest_stops_count"] >= 1

        # 3. Verify each daily log sheet strictly totals 24.0 hours
        daily_logs = plan["daily_logs"]
        assert len(daily_logs) >= 2  # 15.7 drive hours + loading + 10hr rest spans at least 2 calendar days

        for log in daily_logs:
            duty_totals = log["duty_totals"]
            total_sum = (
                duty_totals["off_duty"]
                + duty_totals["sleeper_berth"]
                + duty_totals["driving"]
                + duty_totals["on_duty_not_driving"]
            )
            # Must strictly equal 24.0 hours (within floating-point precision 0.05)
            assert pytest.approx(total_sum, 0.05) == 24.0, (
                f"Day {log['day_number']} total ({total_sum}) does not equal 24.0 hours!"
            )

    def test_fuel_stop_scheduled_for_long_haul(self):
        curr = {"name": "Los Angeles, CA", "lat": 34.0522, "lng": -118.2437}
        pickup = {"name": "Phoenix, AZ", "lat": 33.4484, "lng": -112.0740}
        dropoff = {"name": "Dallas, TX", "lat": 32.7767, "lng": -96.7970}

        leg1 = {"distance_miles": 370.0, "duration_hours": 6.7, "coordinates": [[34.0, -118.2], [33.4, -112.0]]}
        leg2 = {"distance_miles": 1070.0, "duration_hours": 19.4, "coordinates": [[33.4, -112.0], [32.7, -96.7]]}

        scheduler = HOSTripScheduler(
            current_loc=curr,
            pickup_loc=pickup,
            dropoff_loc=dropoff,
            leg1_route=leg1,
            leg2_route=leg2,
            current_cycle_used=10.0,
            start_datetime=datetime(2026, 10, 7, 6, 0, 0),
        )

        plan = scheduler.plan_trip()
        assert plan["summary"]["fuel_stops_count"] >= 1
        # Check fuel stop event in schedule
        fuel_events = [e for e in plan["schedule"] if "Refueling Vehicle" in e["activity"]]
        assert len(fuel_events) >= 1
