import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { ComplianceReport } from '../types/trip';

interface ComplianceStatusProps {
  compliance: ComplianceReport;
}

export const ComplianceStatus: React.FC<ComplianceStatusProps> = ({ compliance }) => {
  const rules = compliance.rules;

  const items = [
    {
      title: 'Driving hours within limit (11-Hour Rule)',
      desc: rules.rule_11_hr_driving.message,
      isPassed: rules.rule_11_hr_driving.status === 'PASSED',
    },
    {
      title: '30-minute break scheduled',
      desc: rules.rule_30_min_break.message,
      isPassed: rules.rule_30_min_break.status === 'PASSED',
    },
    {
      title: '14-hour window respected',
      desc: rules.rule_14_hr_window.message,
      isPassed: rules.rule_14_hr_window.status === 'PASSED',
    },
    {
      title: 'Cycle limit respected (70-Hour / 8-Day Rule)',
      desc: rules.rule_70_hr_cycle.message,
      isPassed: rules.rule_70_hr_cycle.status === 'PASSED',
    },
    {
      title: 'Fuel stops scheduled (< 1,000 Miles)',
      desc: rules.fuel_stops_rule.message,
      isPassed: rules.fuel_stops_rule.status === 'PASSED',
    },
    {
      title: 'Pickup and dropoff duty time included',
      desc: rules.duty_times_rule.message,
      isPassed: rules.duty_times_rule.status === 'PASSED',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 m-0">
          HOS Compliance Verification
        </h2>
        {compliance.is_overall_compliant ? (
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
            All Checks Passed
          </span>
        ) : (
          <span className="text-xs font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2.5 py-0.5 rounded-full">
            Cycle Warning
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border ${
              item.isPassed
                ? 'bg-slate-950/60 border-slate-800/80'
                : 'bg-amber-950/20 border-amber-800/60'
            }`}
          >
            <div className="flex items-start gap-2">
              {item.isPassed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className={`text-xs font-semibold ${item.isPassed ? 'text-slate-200' : 'text-amber-300'}`}>
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {item.desc}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
