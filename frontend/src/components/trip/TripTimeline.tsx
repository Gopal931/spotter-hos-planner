import { Navigation, Bed, Coffee, CheckCircle, MapPin } from 'lucide-react';
import type { ScheduleEvent, DutyStatus } from '../../types/trip';

interface TripTimelineProps {
  schedule: ScheduleEvent[];
}

export const TripTimeline: React.FC<TripTimelineProps> = ({ schedule }) => {
  const formatTime = (isoString: string) => {
    const dt = new Date(isoString);
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDateHeader = (isoString: string) => {
    const dt = new Date(isoString);
    return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: DutyStatus) => {
    switch (status) {
      case 'DRIVING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Navigation className="w-3 h-3 text-emerald-600" />
            Driving
          </span>
        );
      case 'ON_DUTY_NOT_DRIVING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <CheckCircle className="w-3 h-3 text-amber-600" />
            On Duty
          </span>
        );
      case 'SLEEPER_BERTH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Bed className="w-3 h-3 text-indigo-600" />
            Sleeper Berth
          </span>
        );
      case 'OFF_DUTY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Coffee className="w-3 h-3 text-slate-500" />
            Off Duty
          </span>
        );
    }
  };

  // Group events by day
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
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0">
            Trip Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological driving and duty timeline grouped by operating calendar day.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60">
          {dayKeys.length} Days
        </span>
      </div>

      <div className="space-y-8">
        {dayKeys.map((dateStr, dayIndex) => {
          const events = groupedByDay[dateStr];
          return (
            <div key={dateStr} className="space-y-4">
              {/* Day Header */}
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-xs font-bold tracking-wide uppercase">
                  Day {dayIndex + 1}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {formatDateHeader(events[0].start_time)}
                </span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              {/* Vertical Timeline Items */}
              <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-3">
                {events.map((event, idx) => {
                  const isDriving = event.status === 'DRIVING';

                  return (
                    <div key={idx} className="relative group">
                      {/* Timeline Node Dot */}
                      <div
                        className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                          isDriving
                            ? 'border-emerald-500 ring-2 ring-emerald-100'
                            : event.status === 'ON_DUTY_NOT_DRIVING'
                            ? 'border-amber-500 ring-2 ring-amber-100'
                            : 'border-slate-400'
                        }`}
                      />

                      <div className="bg-slate-50/60 border border-slate-200/70 rounded-lg p-3 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start sm:items-center gap-3">
                          <span className="font-mono text-xs font-bold text-slate-800 min-w-[45px]">
                            {formatTime(event.start_time)}
                          </span>

                          {getStatusBadge(event.status)}

                          <div>
                            <div className="text-xs font-semibold text-slate-900">
                              {event.activity}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{event.location}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 pl-14 sm:pl-0 shrink-0">
                          {event.miles > 0 && (
                            <span className="font-medium text-slate-700">
                              {event.miles} mi
                            </span>
                          )}
                          <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {event.duration_hours} hrs
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
