import React from 'react';
import { Route, Clock, BatteryCharging, Fuel, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { TripSummary as TripSummaryType } from '../../types/trip';

interface TripSummaryProps {
  summary: TripSummaryType;
}

export const TripSummary: React.FC<TripSummaryProps> = ({ summary }) => {
  // Format driving time to e.g. 15h 20m
  const formatHoursMinutes = (hoursFloat: number) => {
    const hours = Math.floor(hoursFloat);
    const minutes = Math.round((hoursFloat - hours) * 60);
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {/* 1. Distance */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Distance
          </span>
          <Route className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {summary.total_distance_miles.toLocaleString()} <span className="text-xs font-normal text-slate-500">mi</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Total highway route
          </span>
        </div>
      </div>

      {/* 2. Driving Time */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Driving Time
          </span>
          <Clock className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatHoursMinutes(summary.total_driving_time_hours)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {summary.total_trip_duration_hours}h total elapsed
          </span>
        </div>
      </div>

      {/* 3. Cycle Remaining */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Cycle Remaining
          </span>
          <BatteryCharging className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {summary.cycle_remaining_hours.toFixed(1)} <span className="text-xs font-normal text-slate-500">hrs</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {summary.projected_cycle_used.toFixed(1)} / 70.0 hrs used
          </span>
        </div>
      </div>

      {/* 4. Fuel Stops */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Fuel Stops
          </span>
          <Fuel className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {summary.fuel_stops_count}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            1 per 1,000 miles rule
          </span>
        </div>
      </div>

      {/* 5. Compliance Status */}
      <div className={`col-span-2 md:col-span-1 border rounded-xl p-4 shadow-xs flex flex-col justify-between ${
        summary.is_compliant 
          ? 'bg-emerald-50/50 border-emerald-200' 
          : 'bg-amber-50/50 border-amber-200'
      }`}>
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Compliance
          </span>
          {summary.is_compliant ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          )}
        </div>
        <div>
          <div className={`text-xl font-bold tracking-tight ${
            summary.is_compliant ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {summary.is_compliant ? 'Compliant' : 'Attention Required'}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {summary.is_compliant ? 'FMCSA limits respected' : 'Exceeds 70-hour cycle'}
          </span>
        </div>
      </div>
    </div>
  );
};
