import React from 'react';
import type { TripSummary } from '../types/trip';

interface TripSummaryCardsProps {
  summary: TripSummary;
}

export const TripSummaryCards: React.FC<TripSummaryCardsProps> = ({ summary }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3.5">
        Trip Summary
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Distance */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
          <span className="text-xs text-slate-400 block">Total Distance</span>
          <div className="text-xl font-bold text-white mt-1">
            {summary.total_distance_miles.toLocaleString()} <span className="text-xs font-normal text-slate-400">mi</span>
          </div>
        </div>

        {/* 2. Estimated Travel Time */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
          <span className="text-xs text-slate-400 block">Estimated Travel Time</span>
          <div className="text-xl font-bold text-white mt-1">
            {summary.total_trip_duration_hours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            ({summary.total_driving_time_hours}h drive + stops)
          </span>
        </div>

        {/* 3. Remaining Cycle Hours */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
          <span className="text-xs text-slate-400 block">Remaining Cycle</span>
          <div className="text-xl font-bold text-white mt-1">
            {summary.cycle_remaining_hours} <span className="text-xs font-normal text-slate-400">/ 70 hrs</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {summary.projected_cycle_used}h projected used
          </span>
        </div>

        {/* 4. Fuel Stops */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5">
          <span className="text-xs text-slate-400 block">Fuel Stops</span>
          <div className="text-xl font-bold text-white mt-1">
            {summary.fuel_stops_count} <span className="text-xs font-normal text-slate-400">stops</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Required every 1,000 mi</span>
        </div>

        {/* 5. Trip Status */}
        <div className={`col-span-2 sm:col-span-1 border rounded-lg p-3.5 ${
          summary.is_compliant 
            ? 'bg-emerald-950/20 border-emerald-800/60' 
            : 'bg-amber-950/30 border-amber-800/60'
        }`}>
          <span className="text-xs text-slate-400 block">Trip Status</span>
          <div className={`text-base font-bold mt-1 ${
            summary.is_compliant ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {summary.is_compliant ? '✓ HOS Compliant' : '⚠ Cycle Warning'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
            {summary.is_compliant ? 'All regulations satisfied' : 'Needs 34-hour restart'}
          </span>
        </div>
      </div>
    </div>
  );
};
