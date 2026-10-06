export type DutyStatus = 
  | 'OFF_DUTY'
  | 'SLEEPER_BERTH'
  | 'DRIVING'
  | 'ON_DUTY_NOT_DRIVING';

export interface LocationCoordinate {
  name: string;
  display_name?: string;
  lat: number;
  lng: number;
}

export interface Waypoint {
  type: 'origin' | 'pickup' | 'dropoff';
  name: string;
  lat: number;
  lng: number;
}

export interface RouteStop {
  type: 'pickup' | 'dropoff' | 'fuel' | 'rest' | 'break';
  name: string;
  lat: number;
  lng: number;
  arrival_time: string;
  departure_time: string;
  activity: string;
}

export interface RouteLeg {
  from: string;
  to: string;
  distance_miles: number;
  duration_hours: number;
  coordinates: [number, number][];
}

export interface TripRoute {
  total_distance_miles: number;
  total_driving_time_hours: number;
  leg1: RouteLeg;
  leg2: RouteLeg;
  waypoints: Waypoint[];
  stops: RouteStop[];
}

export interface TripSummary {
  total_distance_miles: number;
  total_driving_time_hours: number;
  total_trip_duration_hours: number;
  total_on_duty_hours: number;
  current_cycle_used: number;
  projected_cycle_used: number;
  cycle_remaining_hours: number;
  fuel_stops_count: number;
  rest_stops_count: number;
  breaks_count: number;
  is_compliant: boolean;
  status_message: string;
}

export interface ComplianceRuleDetail {
  title: string;
  regulation: string;
  status: 'PASSED' | 'WARNING' | 'VIOLATION';
  message: string;
  [key: string]: any;
}

export interface ComplianceReport {
  is_overall_compliant: boolean;
  rules: {
    rule_11_hr_driving: ComplianceRuleDetail;
    rule_14_hr_window: ComplianceRuleDetail;
    rule_30_min_break: ComplianceRuleDetail;
    rule_70_hr_cycle: ComplianceRuleDetail;
    fuel_stops_rule: ComplianceRuleDetail;
    duty_times_rule: ComplianceRuleDetail;
  };
}

export interface ScheduleEvent {
  event_id: number;
  start_time: string;
  end_time: string;
  duration_hours: number;
  status: DutyStatus;
  activity: string;
  location: string;
  lat: number;
  lng: number;
  miles: number;
}

export interface GridSegment {
  status: DutyStatus;
  activity: string;
  location: string;
  start_hour: number;
  end_hour: number;
  duration: number;
}

export interface LogRemark {
  hour: number;
  time_str: string;
  location: string;
  activity: string;
  status: DutyStatus;
}

export interface DailyLogSheet {
  day_number: number;
  date: string;
  carrier_name: string;
  main_office_address: string;
  home_terminal: string;
  truck_number: string;
  trailer_number: string;
  total_miles_today: number;
  shipping_doc: string;
  commodity: string;
  from_location: string;
  to_location: string;
  duty_totals: {
    off_duty: number;
    sleeper_berth: number;
    driving: number;
    on_duty_not_driving: number;
    total_hours: number;
  };
  grid_segments: GridSegment[];
  remarks: LogRemark[];
  recap: {
    on_duty_hours_today: number;
    total_hours_last_8_days: number;
    hours_available_tomorrow: number;
  };
}

export interface TripPlanResponse {
  success: boolean;
  inputs: {
    current_location: LocationCoordinate;
    pickup_location: LocationCoordinate;
    dropoff_location: LocationCoordinate;
    cycle_used_hours: number;
  };
  summary: TripSummary;
  compliance: ComplianceReport;
  route: TripRoute;
  schedule: ScheduleEvent[];
  daily_logs: DailyLogSheet[];
  error?: string;
}

export interface TripPlanRequest {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  cycle_used_hours: number;
}
