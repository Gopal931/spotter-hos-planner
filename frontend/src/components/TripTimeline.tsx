import React from 'react';
import type { ScheduleEvent, DutyStatus } from '../types/trip';

interface TripTimelineProps {
  schedule: ScheduleEvent[];
}

export const TripTimeline: React.FC<TripTimelineProps> = ({ schedule }) => {
  const formatTime = (isoString: string) => {
    const dt = new Date(isoString);
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getStatusLabel = (status: DutyStatus) => {
    switch (status) {
      case 'OFF_DUTY':
        return 'Off Duty';
      case 'SLEEPER_BERTH':
        return 'Sleeper Berth';
      case 'DRIVING':
        return 'Driving';
      case 'ON_DUTY_NOT_DRIVING':
        return 'On Duty';
    }
  };

  const getStatusColor = (status: DutyStatus) => {
    switch (status) {
      case 'OFF_DUTY':
        return 'text-slate-400 bg-slate-800 border-slate-700';
      case 'SLEEPER_BERTH':
        return 'text-indigo-300 bg-indigo-950/60 border-indigo-800/60';
      case 'DRIVING':
        return 'text-emerald-300 bg-emerald-950/60 border-emerald-800/60';
      case 'ON_DUTY_NOT_DRIVING':
        return 'text-amber-300 bg-amber-950/60 border-amber-800/60';
    }
  };

  // Group events by calendar date
  const groupedByDay: { [date: string]: ScheduleEvent[] } = {};
  schedule.forEach((ev) => {
    const dayKey = ev.start_time.split('T')[0];
    if (!groupedByDay[dayKey]) {
      groupedByDay[dayKey] = [];
    }
    groupedByDay[dayKey].push(ev);
  });

  const dayKeys = Object.keys(groupedByDay);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 m-0">
            Trip Schedule Timeline
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Chronological breakdown of driving and duty periods by day.</p>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
          {dayKeys.length} Days Total
        </span>
      </div>

      <div className="space-y-6">
        {dayKeys.map((dateStr, dayIdx) => (
          <div key={dateStr} className="border border-slate-800 rounded-lg p-4 bg-slate-950/40">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white m-0">
                Day {dayIdx + 1} <span className="text-xs font-normal text-slate-400 ml-2">({dateStr})</span>
              </h3>
            </div>

            <div className="space-y-2">
              {groupedByDay[dateStr].map((event, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded hover:bg-slate-900/60 transition text-xs gap-2"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-slate-300 min-w-[50px]">
                      {formatTime(event.start_time)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getStatusColor(event.status)}`}>
                      {getStatusLabel(event.status)}
                    </span>
                    <span className="text-slate-200 font-medium">{event.activity}</span>
                  </div>

                  <div className="flex items-center space-x-4 text-slate-400 text-[11px] pl-16 sm:pl-0">
                    <span>{event.location}</span>
                    <span className="text-slate-300 font-medium min-w-[60px] text-right">
                      {event.duration_hours} hrs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
