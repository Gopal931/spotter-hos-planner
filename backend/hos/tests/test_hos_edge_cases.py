"""
Comprehensive HOS Edge Cases Test Suite
Specifically covers all assessment test scenarios:
- Test 1: Cycle used = 0 hrs
- Test 2: Cycle used = 69 hrs
- Test 3: Cycle used = 70 hrs
- Test 4: Long haul divided into legal shifts
- Test 5: >8 cumulative driving hours triggers 30-min break
- Test 6: >1,000 miles triggers fuel stop
- Test 7: Multi-day trip strictly balances to 24.0 hours per day
"""

import pytest
from datetime import datetime
from hos.scheduler import HOSTripScheduler
from hos.calculator import calculate_cycle_metrics
from hos.constants import (
    DUTY_STATUS_DRIVING,
    DUTY_STATUS_ON_DUTY_NOT_DRIVING,
    DUTY_STATUS_SLEEPER_BERTH,
    DUTY_STATUS_OFF_DUTY,
)


class TestHOSEdgeCases:
    @pytest.fixture
    def default_cities(self):
        curr = {"name": "New York, NY", "lat": 40.7128, "lng": -74.006}
        pickup = {"name": "Philadelphia, PA", "lat": 39.9526, "lng": -75.1652}
        dropoff = {"name": "Chicago, IL", "lat": 41.8781, "lng": -87.6298}
        return curr, pickup, dropoff

    def test_edge_case_1_zero_cycle_hours(self, default_cities):
        """Test 1: Cycle used = 0 hours, short trip."""
        curr, pickup, dropoff = default_cities
        leg1 = {"distance_miles": 50.0, "duration_hours": 1.0, "coordinates": [[40.7, -74.0], [40.0, -75.1]]}
        leg2 = {"distance_miles": 100.0, "duration_hours": 2.0, "coordinates": [[40.0, -75.1], [41.8, -87.6]]}

        scheduler = HOSTripScheduler(
            current_loc=curr,
            pickup_loc=pickup,
            dropoff_loc=dropoff,
            leg1_route=leg1,
            leg2_route=leg2,
            current_cycle_used=0.0,
            start_datetime=datetime(2026, 10, 7, 6, 0, 0),
        )
        plan = scheduler.plan_trip()
        summary = plan["summary"]

        assert summary["current_cycle_used"] == 0.0
        assert summary["is_compliant"] is True
        assert summary["cycle_remaining_hours"] > 60.0

    def test_edge_case_2_cycle_used_69_hours(self, default_cities):
        """Test 2: Cycle used = 69 hours -> very limited remaining availability."""
        curr, pickup, dropoff = default_cities
        leg1 = {"distance_miles": 60.0, "duration_hours": 1.2, "coordinates": [[40.7, -74.0], [40.0, -75.1]]}
        leg2 = {"distance_miles": 120.0, "duration_hours": 2.4, "coordinates": [[40.0, -75.1], [41.8, -87.6]]}

        scheduler = HOSTripScheduler(
            current_loc=curr,
            pickup_loc=pickup,
            dropoff_loc=dropoff,
            leg1_route=leg1,
            leg2_route=leg2,
            current_cycle_used=69.0,
            start_datetime=datetime(2026, 10, 7, 6, 0, 0),
        )
        plan = scheduler.plan_trip()
        summary = plan["summary"]

        # Trip requires > 1 hr on-duty (inspection + drive + pickup + dropoff = ~5.8h)
        # So projected used will exceed 70.0 hours
        assert summary["current_cycle_used"] == 69.0
        assert summary["is_compliant"] is False
        assert summary["cycle_remaining_hours"] == 0.0
        assert plan["compliance"]["rules"]["rule_70_hr_cycle"]["status"] == "WARNING"

    def test_edge_case_3_cycle_used_70_hours(self, default_cities):
        """Test 3: Cycle used = 70 hours -> driver cannot drive without restart."""
        curr, pickup, dropoff = default_cities
        leg1 = {"distance_miles": 20.0, "duration_hours": 0.5, "coordinates": [[40.7, -74.0], [40.0, -75.1]]}
        leg2 = {"distance_miles": 30.0, "duration_hours": 0.7, "coordinates": [[40.0, -75.1], [41.8, -87.6]]}

        scheduler = HOSTripScheduler(
            current_loc=curr,
            pickup_loc=pickup,
            dropoff_loc=dropoff,
            leg1_route=leg1,
            leg2_route=leg2,
            current_cycle_used=70.0,
            start_datetime=datetime(2026, 10, 7, 6, 0, 0),
        )
        plan = scheduler.plan_trip()
        summary = plan["summary"]

        assert summary["is_compliant"] is False
        assert summary["cycle_remaining_hours"] == 0.0
        assert "exceeds" in plan["compliance"]["rules"]["rule_70_hr_cycle"]["message"]

    def test_edge_case_4_long_route_divided_into_legal_shifts(self, default_cities):
        """Test 4: Long haul (16 drive hrs) divided into legal shifts <= 11 hrs each."""
        curr, pickup, dropoff = default_cities
        leg1 = {"distance_miles": 100.0, "duration_hours": 2.0, "coordinates": [[40.7, -74.0], [40.0, -75.1]]}
        leg2 = {"distance_miles": 800.0, "duration_hours": 14.0, "coordinates": [[40.0, -75.1], [41.8, -87.6]]}

        scheduler = HOSTripScheduler(
            current_loc=curr,
            pickup_loc=pickup,
            dropoff_loc=dropoff,
            leg1_route=leg1,
            leg2_route=leg2,
            current_cycle_used=20.0,
            start_datetime=datetime(2026, 10, 7, 6, 0, 0),
        )
        plan = scheduler.plan_trip()

        # Must have at least one 10-hour sleeper berth reset
        rest_events = [e for e in plan["schedule"] if e["status"] == DUTY_STATUS_SLEEPER_BERTH]
        assert len(rest_events) >= 1
        assert rest_events[0]["duration_hours"] == 10.0

    def test_edge_case_5_more_than_8_hours_triggers_break(self, default_cities):
        """Test 5: >8 cumulative driving hours triggers 30-min break."""
        curr, pickup, dropoff = default_cities
        leg1 = {"distance_miles": 50.0, "duration_hours": 1.0, "coordinates": [[40.7, -74.0], [40.0, -75.1]]}
        leg2 = {"distance_miles": 550.0, "duration_hours": 9.5, "coordinates": [[40.0, -75.1], [41.8, -87.6]]}

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
        assert plan["summary"]["breaks_count"] >= 1
        break_stops = [s for s in plan["stops"] if s["type"] == "break"]
        assert len(break_stops) >= 1

    def test_edge_case_6_fuel_stop_over_1000_miles(self, default_cities):
        """Test 6: Trip > 1,000 miles schedules fuel stop."""
        curr, pickup, dropoff = default_cities
        leg1 = {"distance_miles": 200.0, "duration_hours": 3.6, "coordinates": [[40.7, -74.0], [40.0, -75.1]]}
        leg2 = {"distance_miles": 1100.0, "duration_hours": 20.0, "coordinates": [[40.0, -75.1], [41.8, -87.6]]}

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
        fuel_stops = [s for s in plan["stops"] if s["type"] == "fuel"]
        assert len(fuel_stops) >= 1

    def test_edge_case_7_multi_day_each_totals_24_hours(self, default_cities):
        """Test 7: Every single day in a multi-day trip totals exactly 24.0 hours."""
        curr, pickup, dropoff = default_cities
        leg1 = {"distance_miles": 350.0, "duration_hours": 6.5, "coordinates": [[40.7, -74.0], [40.0, -75.1]]}
        leg2 = {"distance_miles": 950.0, "duration_hours": 17.0, "coordinates": [[40.0, -75.1], [41.8, -87.6]]}

        scheduler = HOSTripScheduler(
            current_loc=curr,
            pickup_loc=pickup,
            dropoff_loc=dropoff,
            leg1_route=leg1,
            leg2_route=leg2,
            current_cycle_used=15.0,
            start_datetime=datetime(2026, 10, 7, 6, 0, 0),
        )
        plan = scheduler.plan_trip()
        daily_logs = plan["daily_logs"]

        assert len(daily_logs) >= 2
        for log in daily_logs:
            duty = log["duty_totals"]
            total = duty["off_duty"] + duty["sleeper_berth"] + duty["driving"] + duty["on_duty_not_driving"]
            assert pytest.approx(total, 0.01) == 24.0
            assert len(log["grid_segments"]) > 0
