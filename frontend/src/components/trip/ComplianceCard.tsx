import { Check, AlertTriangle } from 'lucide-react';
import type { ComplianceReport } from '../../types/trip';

interface ComplianceCardProps {
  compliance: ComplianceReport;
}

export const ComplianceCard: React.FC<ComplianceCardProps> = ({ compliance }) => {
  const rules = compliance.rules;

  const checks = [
    {
      title: '11-Hour Driving Limit',
      regulation: '49 CFR § 395.3(a)(3)',
      desc: rules.rule_11_hr_driving.message,
      isPassed: rules.rule_11_hr_driving.status === 'PASSED',
    },
    {
      title: '14-Hour Driving Window',
      regulation: '49 CFR § 395.3(a)(2)',
      desc: rules.rule_14_hr_window.message,
      isPassed: rules.rule_14_hr_window.status === 'PASSED',
    },
    {
      title: '30-Minute Rest Break',
      regulation: '49 CFR § 395.3(a)(3)(ii)',
      desc: rules.rule_30_min_break.message,
      isPassed: rules.rule_30_min_break.status === 'PASSED',
    },
    {
      title: '70-Hour / 8-Day Cycle Limit',
      regulation: '49 CFR § 395.3(b)(2)',
      desc: rules.rule_70_hr_cycle.message,
      isPassed: rules.rule_70_hr_cycle.status === 'PASSED',
    },
    {
      title: 'Fuel Interval Scheduling',
      regulation: 'Every 1,000 Miles Rule',
      desc: rules.fuel_stops_rule.message,
      isPassed: rules.fuel_stops_rule.status === 'PASSED',
    },
    {
      title: 'Pickup & Dropoff Duty Windows',
      regulation: '1.0 Hour Load / 1.0 Hour Unload',
      desc: rules.duty_times_rule.message,
      isPassed: rules.duty_times_rule.status === 'PASSED',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            HOS Compliance
          </span>
          <div className="flex items-center gap-2">
            {compliance.is_overall_compliant ? (
              <>
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-bold text-slate-900 m-0">
                  No violations detected
                </h3>
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-bold text-amber-900 m-0">
                  Attention required
                </h3>
              </>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {compliance.is_overall_compliant
              ? 'The planned trip respects the configured FMCSA Hours of Service limits.'
              : 'Trip duty hours exceed available cycle limit. A 34-hour restart is required before resuming driving.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 px-3 py-1 rounded-md bg-slate-50 border border-slate-200 font-medium">
            Property-Carrying Rules
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {checks.map((check, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-lg border transition-colors ${
              check.isPassed
                ? 'bg-slate-50/50 border-slate-200/80'
                : 'bg-amber-50/60 border-amber-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  check.isPassed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {check.isPassed ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {check.title}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
                  {check.regulation}
                </span>
                <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                  {check.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
