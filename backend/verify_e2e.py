import urllib.request
import json
import sys

BASE_URL = 'http://127.0.0.1:8000/api'

def post_json(url, payload):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def get_json(url):
    with urllib.request.urlopen(url) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

print("=== STARTING FULL END-TO-END AUDIT TESTS ===")

# TEST 1: Health check
status, health = get_json(f"{BASE_URL}/health/")
print(f"\n[E2E 1] Health Check: status={status}, response={health}")
assert status == 200 and health.get("status") in ["online", "healthy"]

# TEST 2: Validation on invalid cycle hours (e.g. -5, > 70)
status, err_neg = post_json(f"{BASE_URL}/trips/plan/", {
    "current_location": "New York, NY",
    "pickup_location": "Philadelphia, PA",
    "dropoff_location": "Baltimore, MD",
    "cycle_used_hours": -2.0
})
print(f"\n[E2E 2a] Negative Cycle Hours: status={status}, error={err_neg}")
assert status == 400 and ("cycle_used_hours" in err_neg.get("details", {}) or "cycle_used_hours" in err_neg)

status, err_high = post_json(f"{BASE_URL}/trips/plan/", {
    "current_location": "New York, NY",
    "pickup_location": "Philadelphia, PA",
    "dropoff_location": "Baltimore, MD",
    "cycle_used_hours": 75.0
})
print(f"[E2E 2b] Cycle Hours > 70: status={status}, error={err_high}")
assert status == 400 and ("cycle_used_hours" in err_high.get("details", {}) or "cycle_used_hours" in err_high)

# TEST 3: Validation on empty locations
status, err_empty = post_json(f"{BASE_URL}/trips/plan/", {
    "current_location": "",
    "pickup_location": "Philadelphia, PA",
    "dropoff_location": "Baltimore, MD",
    "cycle_used_hours": 10.0
})
print(f"[E2E 2c] Empty Location: status={status}, error={err_empty}")
assert status == 400 and ("current_location" in err_empty.get("details", {}) or "current_location" in err_empty)

# TEST 4: Cycle Hours = 70.0 (Zero hours remaining)
status, data_c70 = post_json(f"{BASE_URL}/trips/plan/", {
    "current_location": "New York, NY",
    "pickup_location": "Philadelphia, PA",
    "dropoff_location": "Baltimore, MD",
    "cycle_used_hours": 70.0
})
print(f"\n[E2E 3] Cycle Hours = 70.0: status={status}")
print(f"  Compliant: {data_c70['compliance']['is_overall_compliant']}")
print(f"  Rule 70hr status: {data_c70['compliance']['rules']['rule_70_hr_cycle']['status']}")
print(f"  Summary cycle remaining: {data_c70['summary']['cycle_remaining_hours']}")
print(f"  Summary projected used: {data_c70['summary']['projected_cycle_used']}")
assert data_c70['compliance']['is_overall_compliant'] is False
assert data_c70['compliance']['rules']['rule_70_hr_cycle']['status'] == "WARNING"
assert data_c70['summary']['cycle_remaining_hours'] == 0.0

# TEST 5: Cycle Hours = 69.0 (Only 1 hour remaining, trip needs 5+ hours)
status, data_c69 = post_json(f"{BASE_URL}/trips/plan/", {
    "current_location": "New York, NY",
    "pickup_location": "Philadelphia, PA",
    "dropoff_location": "Baltimore, MD",
    "cycle_used_hours": 69.0
})
print(f"\n[E2E 4] Cycle Hours = 69.0: status={status}")
print(f"  Compliant: {data_c69['compliance']['is_overall_compliant']}")
print(f"  Rule 70hr status: {data_c69['compliance']['rules']['rule_70_hr_cycle']['status']}")
print(f"  Summary projected used: {data_c69['summary']['projected_cycle_used']}")
print(f"  Rule 70hr message: {data_c69['compliance']['rules']['rule_70_hr_cycle']['message']}")
assert data_c69['compliance']['is_overall_compliant'] is False
assert data_c69['compliance']['rules']['rule_70_hr_cycle']['status'] == "WARNING"

# TEST 6: Standard Short Trip (NYC -> Philly -> Baltimore, ~190 miles)
status, data_short = post_json(f"{BASE_URL}/trips/plan/", {
    "current_location": "New York, NY",
    "pickup_location": "Philadelphia, PA",
    "dropoff_location": "Baltimore, MD",
    "cycle_used_hours": 15.0
})
print(f"\n[E2E 5] Short Trip (NYC -> Philly -> Baltimore): status={status}")
print(f"  Distance: {data_short['summary']['total_distance_miles']} mi")
print(f"  Driving Time: {data_short['summary']['total_driving_time_hours']} h")
print(f"  Total Duration: {data_short['summary']['total_trip_duration_hours']} h")
print(f"  Compliant: {data_short['compliance']['is_overall_compliant']}")
print(f"  Events Count: {len(data_short['schedule'])}")

# Verify 1 hour pickup and 1 hour dropoff activities
activities = {e['activity']: e['duration_hours'] for e in data_short['schedule']}
print(f"  Activities found: {list(activities.keys())}")
pickup_event = next((e for e in data_short['schedule'] if "Pickup" in e['activity']), None)
dropoff_event = next((e for e in data_short['schedule'] if "Delivery" in e['activity'] or "Dropoff" in e['activity']), None)
print(f"  Pickup event: {pickup_event['activity']} duration: {pickup_event['duration_hours']}h")
print(f"  Dropoff event: {dropoff_event['activity']} duration: {dropoff_event['duration_hours']}h")
assert pickup_event['duration_hours'] == 1.0, "Pickup must be exactly 1 hour"
assert dropoff_event['duration_hours'] == 1.0, "Dropoff must be exactly 1 hour"

# Verify 24-hr daily log total
for log in data_short['daily_logs']:
    totals = log['duty_totals']
    print(f"  Day {log['day_number']} ({log['date']}): Total={totals['total_hours']}h | Off={totals['off_duty']}h | SB={totals['sleeper_berth']}h | Drive={totals['driving']}h | OnDuty={totals['on_duty_not_driving']}h")
    assert round(totals['total_hours'], 2) == 24.0, f"Day {log['day_number']} total must equal 24.0h"

# TEST 7: Haul with > 8 hours driving leg requiring mandatory 30-min break
# New York, NY -> Philadelphia, PA -> Atlanta, GA (Philly to Atlanta is ~770 mi, >12h drive)
status, data_med = post_json(f"{BASE_URL}/trips/plan/", {
    "current_location": "New York, NY",
    "pickup_location": "Philadelphia, PA",
    "dropoff_location": "Atlanta, GA",
    "cycle_used_hours": 10.0
})
print(f"\n[E2E 6] Trip with >8h driving leg (triggering 30m break): status={status}")
print(f"  Distance: {data_med['summary']['total_distance_miles']} mi")
print(f"  Driving Time: {data_med['summary']['total_driving_time_hours']} h")
breaks = [e for e in data_med['schedule'] if "30-Minute Rest Break" in e['activity'] or "Rest Break" in e['activity']]
print(f"  30-min breaks scheduled: {len(breaks)}")
for b in breaks:
    print(f"    Break: {b['activity']} - duration: {b['duration_hours']} h at {b['location']}")
assert len(breaks) >= 1, "Must have at least one 30-minute break scheduled for >8h driving"
assert breaks[0]['duration_hours'] == 0.5, "Rest break must be 0.5 hours (30 min)"

# TEST 8: Cross-Country Long Haul (> 1,000 miles triggering fuel stops and 10h resets)
# Dallas, TX -> Memphis, TN -> Boston, MA (~1,800 miles)
status, data_long = post_json(f"{BASE_URL}/trips/plan/", {
    "current_location": "Dallas, TX",
    "pickup_location": "Memphis, TN",
    "dropoff_location": "Boston, MA",
    "cycle_used_hours": 10.0
})
print(f"\n[E2E 7] Long Haul (>1,000 miles): status={status}")
print(f"  Distance: {data_long['summary']['total_distance_miles']} mi")
print(f"  Driving Time: {data_long['summary']['total_driving_time_hours']} h")
print(f"  Fuel Stops Reported: {data_long['summary']['fuel_stops_count']}")
fuel_events = [e for e in data_long['schedule'] if "fuel" in e['activity'].lower()]
print(f"  Fuel Events Scheduled: {len(fuel_events)}")
for f in fuel_events:
    print(f"    Fuel Stop: at {f['location']}, duration: {f['duration_hours']} h, status: {f['status']}")
assert data_long['summary']['fuel_stops_count'] >= 1
assert len(fuel_events) >= 1
assert fuel_events[0]['duration_hours'] == 0.5
assert fuel_events[0]['status'] == 'ON_DUTY_NOT_DRIVING'

# Check 10-hour rest resets scheduled between shifts
rests_10h = [e for e in data_long['schedule'] if "10-Hour" in e['activity']]
print(f"  10-Hour Resets Scheduled: {len(rests_10h)}")
for r in rests_10h:
    print(f"    10h Rest: {r['activity']}, duration: {r['duration_hours']} h, status: {r['status']}")
assert len(rests_10h) >= 1
assert rests_10h[0]['duration_hours'] == 10.0
assert rests_10h[0]['status'] in ['OFF_DUTY', 'SLEEPER_BERTH']

# Check daily logs for all days
print(f"  Daily Logs Generated: {len(data_long['daily_logs'])} days")
for log in data_long['daily_logs']:
    totals = log['duty_totals']
    print(f"    Day {log['day_number']} ({log['date']}): Total = {totals['total_hours']}h (Off: {totals['off_duty']}h, SB: {totals['sleeper_berth']}h, Drive: {totals['driving']}h, OnDuty: {totals['on_duty_not_driving']}h)")
    # STRICT 24.00 HOUR ASSERTION
    assert round(totals['total_hours'], 2) == 24.0, f"Day {log['day_number']} total must be exactly 24.0h"
    # Ensure no negative durations
    assert totals['off_duty'] >= 0
    assert totals['sleeper_berth'] >= 0
    assert totals['driving'] >= 0
    assert totals['on_duty_not_driving'] >= 0

# Check route polyline and waypoint markers
route_data = data_long['route']
print(f"\n[E2E 8] Route Coordinates & Markers:")
leg1_coords = len(route_data['leg1'].get('coordinates', []))
leg2_coords = len(route_data['leg2'].get('coordinates', []))
print(f"  Leg1 Coordinates Count: {leg1_coords}")
print(f"  Leg2 Coordinates Count: {leg2_coords}")
assert leg1_coords > 0
assert leg2_coords > 0

waypoints = [w['type'] for w in route_data.get('waypoints', [])]
print(f"  Waypoints Present: {waypoints}")
assert 'origin' in waypoints
assert 'pickup' in waypoints
assert 'dropoff' in waypoints

stops = [s['type'] for s in route_data.get('stops', [])]
print(f"  Route Stops Types Present: {set(stops)}")
assert 'fuel' in stops
assert 'rest' in stops

print("\n=======================================================")
print(">>> ALL E2E REQUIREMENTS VERIFIED AND PROVEN 100%! <<<")
print("=======================================================")
