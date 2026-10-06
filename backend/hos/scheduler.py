"""
HOS Trip Scheduler and Daily Driver Log (ELD) Generator
Generates full chronological event timelines and authentic 24-hour ELD log sheets.
"""

from datetime import datetime, timedelta
import math
from typing import List, Dict, Any, Tuple

from .constants import (
    DUTY_STATUS_OFF_DUTY,
    DUTY_STATUS_SLEEPER_BERTH,
    DUTY_STATUS_DRIVING,
    DUTY_STATUS_ON_DUTY_NOT_DRIVING,
    MAX_DRIVING_HOURS_PER_SHIFT,
    MAX_DUTY_WINDOW_HOURS,
    MANDATORY_REST_PERIOD_HOURS,
    REST_BREAK_DRIVING_LIMIT,
    REST_BREAK_DURATION_HOURS,
    FUEL_STOP_INTERVAL_MILES,
    FUEL_STOP_DURATION_HOURS,
    PICKUP_DURATION_HOURS,
    DROPOFF_DURATION_HOURS,
    PRE_TRIP_INSPECTION_HOURS,
    DEFAULT_CARRIER_NAME,
    DEFAULT_OFFICE_ADDRESS,
    DEFAULT_TRUCK_NUMBER,
    DEFAULT_TRAILER_NUMBER,
    DEFAULT_SHIPPER_COMMODITY,
)
from .calculator import calculate_cycle_metrics, validate_hos_compliance


class HOSTripScheduler:
    """
    Simulates a compliant commercial truck trip according to FMCSA HOS rules.
    """

    def __init__(
        self,
        current_loc: Dict[str, Any],
        pickup_loc: Dict[str, Any],
        dropoff_loc: Dict[str, Any],
        leg1_route: Dict[str, Any],
        leg2_route: Dict[str, Any],
        current_cycle_used: float = 0.0,
        start_datetime: datetime = None,
        truck_speed_mph: float = 55.0,
    ):
        self.current_loc = current_loc
        self.pickup_loc = pickup_loc
        self.dropoff_loc = dropoff_loc
        self.leg1_route = leg1_route
        self.leg2_route = leg2_route
        self.current_cycle_used = current_cycle_used
        self.truck_speed_mph = truck_speed_mph

        if start_datetime is None:
            # Default to 06:00 AM on today's date
            now = datetime.now()
            self.start_datetime = datetime(now.year, now.month, now.day, 6, 0, 0)
        else:
            self.start_datetime = start_datetime

        self.events: List[Dict[str, Any]] = []
        self.stops: List[Dict[str, Any]] = []
        self.driving_shifts: List[Dict[str, Any]] = []

    def plan_trip(self) -> Dict[str, Any]:
        """
        Executes chronological scheduling of the entire trip.
        """
        total_dist_leg1 = self.leg1_route["distance_miles"]
        total_drive_leg1 = self.leg1_route["duration_hours"]
        total_dist_leg2 = self.leg2_route["distance_miles"]
        total_drive_leg2 = self.leg2_route["duration_hours"]

        total_distance = round(total_dist_leg1 + total_dist_leg2, 1)
        total_driving_time = round(total_drive_leg1 + total_drive_leg2, 2)

        # Off-duty segment prior to trip start (00:00 to start_time on Day 1)
        day1_midnight = datetime(
            self.start_datetime.year, self.start_datetime.month, self.start_datetime.day, 0, 0, 0
        )
        if self.start_datetime > day1_midnight:
            pre_start_hours = (self.start_datetime - day1_midnight).total_seconds() / 3600.0
            self._add_event(
                start=day1_midnight,
                duration_hours=pre_start_hours,
                status=DUTY_STATUS_OFF_DUTY,
                activity="Off Duty Prior to Shift",
                location=self.current_loc["name"],
                lat=self.current_loc["lat"],
                lng=self.current_loc["lng"],
                miles=0.0,
            )

        current_time = self.start_datetime

        # Simulation trackers
        shift_drive_hours = 0.0
        shift_duty_window_hours = 0.0
        driving_since_break = 0.0
        miles_since_fuel = 0.0
        total_trip_on_duty = 0.0
        breaks_count = 0
        fuel_stops_count = 0

        current_shift_record = {
            "shift_number": 1,
            "driving_hours": 0.0,
            "duty_window_hours": 0.0,
        }

        # 1. Pre-trip inspection at current location
        current_time = self._add_event(
            start=current_time,
            duration_hours=PRE_TRIP_INSPECTION_HOURS,
            status=DUTY_STATUS_ON_DUTY_NOT_DRIVING,
            activity="Pre-Trip Vehicle Inspection",
            location=self.current_loc["name"],
            lat=self.current_loc["lat"],
            lng=self.current_loc["lng"],
            miles=0.0,
        )
        shift_duty_window_hours += PRE_TRIP_INSPECTION_HOURS
        total_trip_on_duty += PRE_TRIP_INSPECTION_HOURS

        # 2. Drive Leg 1: Current -> Pickup
        (
            current_time,
            shift_drive_hours,
            shift_duty_window_hours,
            driving_since_break,
            miles_since_fuel,
            total_trip_on_duty,
            b_cnt,
            f_cnt,
        ) = self._simulate_driving_leg(
            from_loc=self.current_loc,
            to_loc=self.pickup_loc,
            leg_distance=total_dist_leg1,
            leg_duration=total_drive_leg1,
            route_coords=self.leg1_route.get("coordinates", []),
            start_time=current_time,
            shift_drive_hours=shift_drive_hours,
            shift_duty_window_hours=shift_duty_window_hours,
            driving_since_break=driving_since_break,
            miles_since_fuel=miles_since_fuel,
            total_trip_on_duty=total_trip_on_duty,
            current_shift_record=current_shift_record,
        )
        breaks_count += b_cnt
        fuel_stops_count += f_cnt

        # 3. Pickup Duty Time (1 hour On Duty Not Driving)
        # Check if remaining duty window allows 1 hour loading, else driver rests first
        if (shift_duty_window_hours + PICKUP_DURATION_HOURS) > MAX_DUTY_WINDOW_HOURS and shift_duty_window_hours > 0:
            # Take rest before loading if window would be breached
            current_time, shift_drive_hours, shift_duty_window_hours, driving_since_break = self._take_10hr_rest(
                current_time=current_time,
                location=self.pickup_loc["name"],
                lat=self.pickup_loc["lat"],
                lng=self.pickup_loc["lng"],
                current_shift_record=current_shift_record,
            )

        current_time = self._add_event(
            start=current_time,
            duration_hours=PICKUP_DURATION_HOURS,
            status=DUTY_STATUS_ON_DUTY_NOT_DRIVING,
            activity="Freight Pickup & Loading Inspection",
            location=self.pickup_loc["name"],
            lat=self.pickup_loc["lat"],
            lng=self.pickup_loc["lng"],
            miles=0.0,
        )
        shift_duty_window_hours += PICKUP_DURATION_HOURS
        total_trip_on_duty += PICKUP_DURATION_HOURS
        # Loading is non-driving on-duty, so it also satisfies/resets the 30-min break clock!
        driving_since_break = 0.0

        self.stops.append({
            "type": "pickup",
            "name": self.pickup_loc["name"],
            "lat": self.pickup_loc["lat"],
            "lng": self.pickup_loc["lng"],
            "arrival_time": current_time - timedelta(hours=PICKUP_DURATION_HOURS),
            "departure_time": current_time,
            "activity": "Loading Cargo (1.0 hr)",
        })

        # 4. Drive Leg 2: Pickup -> Dropoff
        (
            current_time,
            shift_drive_hours,
            shift_duty_window_hours,
            driving_since_break,
            miles_since_fuel,
            total_trip_on_duty,
            b_cnt,
            f_cnt,
        ) = self._simulate_driving_leg(
            from_loc=self.pickup_loc,
            to_loc=self.dropoff_loc,
            leg_distance=total_dist_leg2,
            leg_duration=total_drive_leg2,
            route_coords=self.leg2_route.get("coordinates", []),
            start_time=current_time,
            shift_drive_hours=shift_drive_hours,
            shift_duty_window_hours=shift_duty_window_hours,
            driving_since_break=driving_since_break,
            miles_since_fuel=miles_since_fuel,
            total_trip_on_duty=total_trip_on_duty,
            current_shift_record=current_shift_record,
        )
        breaks_count += b_cnt
        fuel_stops_count += f_cnt

        # 5. Dropoff Duty Time (1 hour On Duty Not Driving)
        current_time = self._add_event(
            start=current_time,
            duration_hours=DROPOFF_DURATION_HOURS,
            status=DUTY_STATUS_ON_DUTY_NOT_DRIVING,
            activity="Freight Delivery & Unloading Inspection",
            location=self.dropoff_loc["name"],
            lat=self.dropoff_loc["lat"],
            lng=self.dropoff_loc["lng"],
            miles=0.0,
        )
        shift_duty_window_hours += DROPOFF_DURATION_HOURS
        total_trip_on_duty += DROPOFF_DURATION_HOURS

        self.stops.append({
            "type": "dropoff",
            "name": self.dropoff_loc["name"],
            "lat": self.dropoff_loc["lat"],
            "lng": self.dropoff_loc["lng"],
            "arrival_time": current_time - timedelta(hours=DROPOFF_DURATION_HOURS),
            "departure_time": current_time,
            "activity": "Unloading Cargo (1.0 hr)",
        })

        # 6. Post-trip inspection & closing shift
        current_time = self._add_event(
            start=current_time,
            duration_hours=0.25,
            status=DUTY_STATUS_ON_DUTY_NOT_DRIVING,
            activity="Post-Trip Vehicle Inspection & Paperwork",
            location=self.dropoff_loc["name"],
            lat=self.dropoff_loc["lat"],
            lng=self.dropoff_loc["lng"],
            miles=0.0,
        )
        shift_duty_window_hours += 0.25
        total_trip_on_duty += 0.25
        current_shift_record["driving_hours"] = round(shift_drive_hours, 2)
        current_shift_record["duty_window_hours"] = round(shift_duty_window_hours, 2)
        self.driving_shifts.append(current_shift_record)

        # 7. Off-duty until end of the calendar day (to ensure 24-hr log balance)
        final_day_midnight = datetime(
            current_time.year, current_time.month, current_time.day, 0, 0, 0
        ) + timedelta(days=1)
        remaining_day_hours = (final_day_midnight - current_time).total_seconds() / 3600.0
        if remaining_day_hours > 0:
            self._add_event(
                start=current_time,
                duration_hours=remaining_day_hours,
                status=DUTY_STATUS_OFF_DUTY,
                activity="Off Duty Post-Delivery",
                location=self.dropoff_loc["name"],
                lat=self.dropoff_loc["lat"],
                lng=self.dropoff_loc["lng"],
                miles=0.0,
            )
            current_time = final_day_midnight

        # 8. Generate Daily Log Sheets (Split by 24-Hour Calendar Days)
        daily_logs = self._generate_daily_logs()

        # 9. Evaluate compliance
        cycle_metrics = calculate_cycle_metrics(
            current_cycle_used=self.current_cycle_used,
            trip_on_duty_hours=total_trip_on_duty,
        )
        required_fuel_stops = int(total_distance // FUEL_STOP_INTERVAL_MILES) if total_distance > FUEL_STOP_INTERVAL_MILES else 0

        compliance_report = validate_hos_compliance(
            driving_shifts=self.driving_shifts,
            cycle_metrics=cycle_metrics,
            fuel_stops_scheduled=fuel_stops_count,
            fuel_stops_required=required_fuel_stops,
            breaks_scheduled=breaks_count,
        )

        total_elapsed_hours = (current_time - self.start_datetime).total_seconds() / 3600.0

        return {
            "summary": {
                "total_distance_miles": total_distance,
                "total_driving_time_hours": total_driving_time,
                "total_trip_duration_hours": round(total_elapsed_hours, 2),
                "total_on_duty_hours": round(total_trip_on_duty, 2),
                "current_cycle_used": self.current_cycle_used,
                "projected_cycle_used": cycle_metrics["projected_cycle_used"],
                "cycle_remaining_hours": cycle_metrics["remaining_after_trip"],
                "fuel_stops_count": fuel_stops_count,
                "rest_stops_count": len([e for e in self.events if e["status"] == DUTY_STATUS_SLEEPER_BERTH]),
                "breaks_count": breaks_count,
                "is_compliant": compliance_report["is_overall_compliant"],
                "status_message": (
                    "Trip is fully HOS compliant."
                    if compliance_report["is_overall_compliant"]
                    else "HOS Warning: Check cycle or window constraints."
                ),
            },
            "compliance": compliance_report,
            "schedule": self.events,
            "stops": self.stops,
            "daily_logs": daily_logs,
        }

    def _simulate_driving_leg(
        self,
        from_loc: Dict[str, Any],
        to_loc: Dict[str, Any],
        leg_distance: float,
        leg_duration: float,
        route_coords: List[List[float]],
        start_time: datetime,
        shift_drive_hours: float,
        shift_duty_window_hours: float,
        driving_since_break: float,
        miles_since_fuel: float,
        total_trip_on_duty: float,
        current_shift_record: Dict[str, Any],
    ) -> Tuple[datetime, float, float, float, float, float, int, int]:
        """
        Simulates driving along a leg with chunking for breaks, fuel, and 10-hour rest resets.
        """
        current_time = start_time
        remaining_leg_miles = leg_distance
        remaining_leg_drive = leg_duration
        breaks_count = 0
        fuel_stops_count = 0

        while remaining_leg_drive > 0.001:
            # Maximum driving duration allowed in this slice
            max_drive_before_11hr = MAX_DRIVING_HOURS_PER_SHIFT - shift_drive_hours
            max_drive_before_14hr = MAX_DUTY_WINDOW_HOURS - shift_duty_window_hours
            max_drive_before_rest = max(0.0, min(max_drive_before_11hr, max_drive_before_14hr))

            # If no driving window or driving hours left in this shift, take 10-hour rest!
            if max_drive_before_rest <= 0.05:
                # Interpolate location where rest occurs
                progress_ratio = 1.0 - (remaining_leg_miles / max(1.0, leg_distance))
                rest_lat, rest_lng = self._get_interp_point(route_coords, progress_ratio)
                rest_loc_name = f"Highway Rest Area (near {to_loc['name']})"

                current_time, shift_drive_hours, shift_duty_window_hours, driving_since_break = self._take_10hr_rest(
                    current_time=current_time,
                    location=rest_loc_name,
                    lat=rest_lat,
                    lng=rest_lng,
                    current_shift_record=current_shift_record,
                )
                continue

            # Limit driving before 8-hour 30-min break threshold
            max_drive_before_break = max(0.0, REST_BREAK_DRIVING_LIMIT - driving_since_break)

            # Limit driving before 1,000 miles fuel stop
            miles_until_fuel = max(0.0, FUEL_STOP_INTERVAL_MILES - miles_since_fuel)
            hours_until_fuel = miles_until_fuel / max(1.0, self.truck_speed_mph)

            # Determine drive slice duration
            drive_slice = min(
                remaining_leg_drive,
                max_drive_before_rest,
                max_drive_before_break if max_drive_before_break > 0 else remaining_leg_drive,
                hours_until_fuel if hours_until_fuel > 0 else remaining_leg_drive,
            )

            # Avoid infinitesimal steps
            drive_slice = max(0.1, min(drive_slice, remaining_leg_drive))

            # Calculate miles for this slice
            slice_ratio = drive_slice / remaining_leg_drive
            slice_miles = round(remaining_leg_miles * slice_ratio, 1)

            # Interpolate coordinates for end of slice
            current_progress = 1.0 - ((remaining_leg_miles - slice_miles) / max(1.0, leg_distance))
            slice_lat, slice_lng = self._get_interp_point(route_coords, current_progress)
            slice_loc_name = f"In Transit towards {to_loc['name']}"

            # Log driving event
            current_time = self._add_event(
                start=current_time,
                duration_hours=drive_slice,
                status=DUTY_STATUS_DRIVING,
                activity=f"Driving towards {to_loc['name']}",
                location=slice_loc_name,
                lat=slice_lat,
                lng=slice_lng,
                miles=slice_miles,
            )

            shift_drive_hours += drive_slice
            shift_duty_window_hours += drive_slice
            driving_since_break += drive_slice
            miles_since_fuel += slice_miles
            total_trip_on_duty += drive_slice
            remaining_leg_drive = max(0.0, round(remaining_leg_drive - drive_slice, 2))
            remaining_leg_miles = max(0.0, round(remaining_leg_miles - slice_miles, 1))

            # Check if 1,000-mile Fuel Stop is due
            if miles_since_fuel >= FUEL_STOP_INTERVAL_MILES or (miles_until_fuel <= 10 and remaining_leg_miles > 50):
                fuel_loc_name = f"Travel Plaza Fuel Station (en route to {to_loc['name']})"
                current_time = self._add_event(
                    start=current_time,
                    duration_hours=FUEL_STOP_DURATION_HOURS,
                    status=DUTY_STATUS_ON_DUTY_NOT_DRIVING,
                    activity="Refueling Vehicle (1,000-mile interval)",
                    location=fuel_loc_name,
                    lat=slice_lat,
                    lng=slice_lng,
                    miles=0.0,
                )
                shift_duty_window_hours += FUEL_STOP_DURATION_HOURS
                total_trip_on_duty += FUEL_STOP_DURATION_HOURS
                miles_since_fuel = 0.0
                fuel_stops_count += 1
                # Fueling stop counts as non-driving and satisfies 30-min break if >= 30 mins
                driving_since_break = 0.0

                self.stops.append({
                    "type": "fuel",
                    "name": fuel_loc_name,
                    "lat": slice_lat,
                    "lng": slice_lng,
                    "arrival_time": current_time - timedelta(hours=FUEL_STOP_DURATION_HOURS),
                    "departure_time": current_time,
                    "activity": "Refuel Stop (0.5 hr)",
                })

            # Check if 8-hour 30-min Rest Break is due
            elif driving_since_break >= (REST_BREAK_DRIVING_LIMIT - 0.05):
                break_loc_name = f"Rest Area (en route to {to_loc['name']})"
                current_time = self._add_event(
                    start=current_time,
                    duration_hours=REST_BREAK_DURATION_HOURS,
                    status=DUTY_STATUS_OFF_DUTY,
                    activity="Mandatory 30-Minute Rest Break (§ 395.3(a)(3)(ii))",
                    location=break_loc_name,
                    lat=slice_lat,
                    lng=slice_lng,
                    miles=0.0,
                )
                shift_duty_window_hours += REST_BREAK_DURATION_HOURS
                driving_since_break = 0.0
                breaks_count += 1

                self.stops.append({
                    "type": "break",
                    "name": break_loc_name,
                    "lat": slice_lat,
                    "lng": slice_lng,
                    "arrival_time": current_time - timedelta(hours=REST_BREAK_DURATION_HOURS),
                    "departure_time": current_time,
                    "activity": "30-Min Rest Break",
                })

        return (
            current_time,
            shift_drive_hours,
            shift_duty_window_hours,
            driving_since_break,
            miles_since_fuel,
            total_trip_on_duty,
            breaks_count,
            fuel_stops_count,
        )

    def _take_10hr_rest(
        self,
        current_time: datetime,
        location: str,
        lat: float,
        lng: float,
        current_shift_record: Dict[str, Any],
    ) -> Tuple[datetime, float, float, float]:
        """
        Inserts mandatory 10 consecutive hours off duty/sleeper berth, resetting driving clocks.
        """
        # Save previous shift
        current_shift_record["driving_hours"] = round(current_shift_record.get("driving_hours", 0.0), 2)
        current_shift_record["duty_window_hours"] = round(current_shift_record.get("duty_window_hours", 0.0), 2)
        self.driving_shifts.append(dict(current_shift_record))

        # Insert 10-hour rest period in Sleeper Berth
        current_time = self._add_event(
            start=current_time,
            duration_hours=MANDATORY_REST_PERIOD_HOURS,
            status=DUTY_STATUS_SLEEPER_BERTH,
            activity="Mandatory 10-Hour Rest Period (Clock Reset)",
            location=location,
            lat=lat,
            lng=lng,
            miles=0.0,
        )

        self.stops.append({
            "type": "rest",
            "name": location,
            "lat": lat,
            "lng": lng,
            "arrival_time": current_time - timedelta(hours=MANDATORY_REST_PERIOD_HOURS),
            "departure_time": current_time,
            "activity": "10-Hour Sleep / Rest",
        })

        # New shift starts with pre-trip inspection
        current_time = self._add_event(
            start=current_time,
            duration_hours=PRE_TRIP_INSPECTION_HOURS,
            status=DUTY_STATUS_ON_DUTY_NOT_DRIVING,
            activity="Pre-Trip Vehicle Inspection (New Shift)",
            location=location,
            lat=lat,
            lng=lng,
            miles=0.0,
        )

        # Reset shift clocks
        current_shift_record["shift_number"] = len(self.driving_shifts) + 1
        current_shift_record["driving_hours"] = 0.0
        current_shift_record["duty_window_hours"] = PRE_TRIP_INSPECTION_HOURS

        return current_time, 0.0, PRE_TRIP_INSPECTION_HOURS, 0.0

    def _get_interp_point(self, coords: List[List[float]], ratio: float) -> Tuple[float, float]:
        """Helper to safely interpolate point from coordinate list."""
        if not coords:
            return 0.0, 0.0
        ratio = max(0.0, min(1.0, ratio))
        idx = int(ratio * (len(coords) - 1))
        return coords[idx][0], coords[idx][1]

    def _add_event(
        self,
        start: datetime,
        duration_hours: float,
        status: str,
        activity: str,
        location: str,
        lat: float,
        lng: float,
        miles: float,
    ) -> datetime:
        """
        Appends an event and returns its end datetime.
        """
        end = start + timedelta(hours=duration_hours)
        self.events.append({
            "event_id": len(self.events) + 1,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "duration_hours": round(duration_hours, 2),
            "status": status,
            "activity": activity,
            "location": location,
            "lat": lat,
            "lng": lng,
            "miles": round(miles, 1),
        })
        return end

    def _generate_daily_logs(self) -> List[Dict[str, Any]]:
        """
        Slices all timeline events strictly into 24-hour calendar days (00:00 to 24:00).
        Guarantees that each day's duty status row totals sum exactly to 24.0 hours.
        """
        if not self.events:
            return []

        # Find earliest start date and latest end date
        first_dt = datetime.fromisoformat(self.events[0]["start_time"])
        last_dt = datetime.fromisoformat(self.events[-1]["end_time"])

        cur_day_start = datetime(first_dt.year, first_dt.month, first_dt.day, 0, 0, 0)
        if last_dt.hour == 0 and last_dt.minute == 0 and last_dt.second == 0:
            final_day_end = last_dt
        else:
            final_day_end = datetime(last_dt.year, last_dt.month, last_dt.day, 0, 0, 0) + timedelta(days=1)

        daily_logs = []
        day_index = 1
        accumulated_cycle = self.current_cycle_used

        while cur_day_start < final_day_end:
            cur_day_end = cur_day_start + timedelta(days=1)
            date_str = cur_day_start.strftime("%Y-%m-%d")

            # Slice events falling within [cur_day_start, cur_day_end)
            day_slices = []
            day_miles = 0.0
            day_remarks = []

            for ev in self.events:
                ev_start = datetime.fromisoformat(ev["start_time"])
                ev_end = datetime.fromisoformat(ev["end_time"])

                # Check overlap
                overlap_start = max(cur_day_start, ev_start)
                overlap_end = min(cur_day_end, ev_end)

                if overlap_start < overlap_end:
                    slice_duration = (overlap_end - overlap_start).total_seconds() / 3600.0
                    start_hour_of_day = (overlap_start - cur_day_start).total_seconds() / 3600.0
                    end_hour_of_day = (overlap_end - cur_day_start).total_seconds() / 3600.0

                    # Prorate miles if driving
                    ev_dur = max(0.001, (ev_end - ev_start).total_seconds() / 3600.0)
                    slice_miles = round(ev["miles"] * (slice_duration / ev_dur), 1)
                    if ev["status"] == DUTY_STATUS_DRIVING:
                        day_miles += slice_miles

                    day_slices.append({
                        "status": ev["status"],
                        "activity": ev["activity"],
                        "location": ev["location"],
                        "start_hour": round(start_hour_of_day, 3),
                        "end_hour": round(end_hour_of_day, 3),
                        "duration": round(slice_duration, 3),
                    })

                    # Add remark for duty transition
                    day_remarks.append({
                        "hour": round(start_hour_of_day, 2),
                        "time_str": overlap_start.strftime("%H:%M"),
                        "location": ev["location"],
                        "activity": ev["activity"],
                        "status": ev["status"],
                    })

            if not day_slices:
                cur_day_start = cur_day_end
                continue

            # Calculate duty status subtotals
            status_totals = {
                DUTY_STATUS_OFF_DUTY: 0.0,
                DUTY_STATUS_SLEEPER_BERTH: 0.0,
                DUTY_STATUS_DRIVING: 0.0,
                DUTY_STATUS_ON_DUTY_NOT_DRIVING: 0.0,
            }

            for sl in day_slices:
                status_totals[sl["status"]] += sl["duration"]

            # Exact floating point adjustment to ensure 24.00 sum
            computed_sum = sum(status_totals.values())
            diff = 24.0 - computed_sum
            if abs(diff) > 0.0001:
                # Absorb residual difference into off-duty
                status_totals[DUTY_STATUS_OFF_DUTY] = round(status_totals[DUTY_STATUS_OFF_DUTY] + diff, 2)
            else:
                for k in status_totals:
                    status_totals[k] = round(status_totals[k], 2)

            # Cycle calculation for 70hr/8day recap
            day_on_duty = round(status_totals[DUTY_STATUS_DRIVING] + status_totals[DUTY_STATUS_ON_DUTY_NOT_DRIVING], 2)
            accumulated_cycle = round(accumulated_cycle + day_on_duty, 2)
            available_tomorrow = max(0.0, round(70.0 - accumulated_cycle, 2))

            daily_logs.append({
                "day_number": day_index,
                "date": date_str,
                "carrier_name": DEFAULT_CARRIER_NAME,
                "main_office_address": DEFAULT_OFFICE_ADDRESS,
                "home_terminal": self.current_loc.get("display_name", self.current_loc["name"]),
                "truck_number": DEFAULT_TRUCK_NUMBER,
                "trailer_number": DEFAULT_TRAILER_NUMBER,
                "total_miles_today": round(day_miles, 1),
                "shipping_doc": f"BOL-{104920 + day_index}",
                "commodity": DEFAULT_SHIPPER_COMMODITY,
                "from_location": self.current_loc["name"],
                "to_location": self.dropoff_loc["name"],
                "duty_totals": {
                    "off_duty": status_totals[DUTY_STATUS_OFF_DUTY],
                    "sleeper_berth": status_totals[DUTY_STATUS_SLEEPER_BERTH],
                    "driving": status_totals[DUTY_STATUS_DRIVING],
                    "on_duty_not_driving": status_totals[DUTY_STATUS_ON_DUTY_NOT_DRIVING],
                    "total_hours": 24.0,
                },
                "grid_segments": day_slices,
                "remarks": day_remarks,
                "recap": {
                    "on_duty_hours_today": day_on_duty,
                    "total_hours_last_8_days": accumulated_cycle,
                    "hours_available_tomorrow": available_tomorrow,
                },
            })

            cur_day_start = cur_day_end
            day_index += 1

        return daily_logs
