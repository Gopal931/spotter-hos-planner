import React, { useState, useEffect } from 'react';
import { Printer, CheckCircle, FileText } from 'lucide-react';
import { ELDGraph } from './ELDGraph';
import type { DailyLogSheet } from '../../types/trip';

interface DailyLogsProps {
  dailyLogs: DailyLogSheet[];
}

export const DailyLogs: React.FC<DailyLogsProps> = ({ dailyLogs }) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPrintingAll(false);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  if (!dailyLogs || dailyLogs.length === 0) {
    return null;
  }

  const currentLog = dailyLogs[selectedDayIdx] || dailyLogs[0];

  const handlePrintCurrent = () => {
    setIsPrintingAll(false);
    setTimeout(() => {
      window.print();
    }, 60);
  };

  const handlePrintAll = () => {
    setIsPrintingAll(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'DRIVING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Driving
          </span>
        );
      case 'ON_DUTY_NOT_DRIVING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            On Duty
          </span>
        );
      case 'SLEEPER_BERTH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Sleeper Berth
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Off Duty
          </span>
        );
    }
  };

  const renderLogSheet = (log: DailyLogSheet) => {
    return (
      <div className="border border-slate-300 rounded-xl p-5 bg-white shadow-xs print:border-slate-400 print:shadow-none print:p-2 print:m-0">
        {/* Paper Log Header Info */}
        <div className="pb-3 mb-3 border-b border-slate-200 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">
                U.S. DEPARTMENT OF TRANSPORTATION — FEDERAL MOTOR CARRIER SAFETY ADMINISTRATION
              </div>
              <div className="font-bold text-slate-900 text-sm">
                DRIVER'S DAILY LOG <span className="font-normal text-xs text-slate-500">(24 HOURS) — 49 CFR § 395.8</span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                Day {log.day_number} of {dailyLogs.length}
              </span>
              <div className="text-[11px] font-semibold text-slate-700 mt-0.5">
                Date: {log.date}
              </div>
            </div>
          </div>

          {/* Form Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 text-[11px] text-slate-700">
            <div className="bg-slate-50/80 p-1.5 rounded border border-slate-200/80">
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Carrier Name</span>
              <span className="font-semibold text-slate-900 truncate block">{log.carrier_name || 'Apex Logistics Fleet LLC'}</span>
            </div>
            <div className="bg-slate-50/80 p-1.5 rounded border border-slate-200/80">
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Truck / Trailer</span>
              <span className="font-semibold text-slate-900 truncate block">{log.truck_number} / {log.trailer_number}</span>
            </div>
            <div className="bg-slate-50/80 p-1.5 rounded border border-slate-200/80">
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Miles Today</span>
              <span className="font-bold text-slate-900 block">{log.total_miles_today} mi</span>
            </div>
            <div className="bg-slate-50/80 p-1.5 rounded border border-slate-200/80">
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Shipping Doc / B/L</span>
              <span className="font-semibold text-slate-900 truncate block">{log.shipping_doc || 'BOL-984210'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-700">
            <div className="bg-slate-50/80 p-1.5 rounded border border-slate-200/80">
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Origin (From)</span>
              <span className="font-medium text-slate-800 truncate block">{log.from_location}</span>
            </div>
            <div className="bg-slate-50/80 p-1.5 rounded border border-slate-200/80">
              <span className="text-[9px] font-bold text-slate-400 block uppercase">Destination (To)</span>
              <span className="font-medium text-slate-800 truncate block">{log.to_location}</span>
            </div>
          </div>
        </div>

        {/* 24-Hour ELD Graph Grid */}
        <ELDGraph currentLog={log} />

        {/* Summary of Daily Totals */}
        <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="font-bold text-slate-900">Total Hours:</span>
            <span>Driving: <strong className="text-blue-700">{log.duty_totals.driving.toFixed(1)}h</strong></span>
            <span>On Duty: <strong className="text-amber-700">{log.duty_totals.on_duty_not_driving.toFixed(1)}h</strong></span>
            <span>Sleeper: <strong className="text-indigo-700">{log.duty_totals.sleeper_berth.toFixed(1)}h</strong></span>
            <span>Off Duty: <strong className="text-slate-700">{log.duty_totals.off_duty.toFixed(1)}h</strong></span>
          </div>

          <div className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300 text-[11px]">
            Daily Total: 24.0 Hours
          </div>
        </div>

        {/* Remarks Section */}
        <div className="mt-3.5 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200 bg-slate-50/80">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 m-0">
              Remarks & Duty Status Changes
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">Home terminal standard time</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-1.5 px-3 w-20">Time</th>
                  <th className="py-1.5 px-3 w-32">Status</th>
                  <th className="py-1.5 px-3 w-48">Location</th>
                  <th className="py-1.5 px-3">Activity / Annotation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {log.remarks.map((rem, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-1.5 px-3 font-mono font-bold text-slate-900">{rem.time_str}</td>
                    <td className="py-1.5 px-3">{getStatusPill(rem.status)}</td>
                    <td className="py-1.5 px-3 font-medium text-slate-800">{rem.location}</td>
                    <td className="py-1.5 px-3 text-slate-600">{rem.activity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 70-Hour / 8-Day Driver Recap */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-200">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Driver 70-Hour / 8-Day Recap
          </h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-[9px] font-semibold text-slate-500 block uppercase">On-Duty Today (Lines 3 & 4)</span>
              <span className="text-xs font-bold text-slate-900">{log.recap.on_duty_hours_today} hrs</span>
            </div>
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-[9px] font-semibold text-slate-500 block uppercase">Last 8 Days Cycle</span>
              <span className="text-xs font-bold text-blue-700">{log.recap.total_hours_last_8_days} / 70.0 hrs</span>
            </div>
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-[9px] font-semibold text-slate-500 block uppercase">Available Tomorrow</span>
              <span className="text-xs font-bold text-emerald-700">{log.recap.hours_available_tomorrow} hrs</span>
            </div>
          </div>
        </div>

        {/* Certification & Signature Footer */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-200 text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5 mb-2 text-slate-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>I certify that these entries are true and correct pursuant to 49 CFR § 395.8.</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-1 border-t border-dashed border-slate-200 text-[10px]">
            <div>
              <span className="text-slate-400">Driver Signature:</span>
              <div className="font-mono text-slate-800 font-semibold border-b border-slate-400 pb-0.5 mt-0.5">
                Commercial Driver #8492
              </div>
            </div>
            <div>
              <span className="text-slate-400">Date Verified:</span>
              <div className="font-mono text-slate-800 font-semibold border-b border-slate-400 pb-0.5 mt-0.5">
                {log.date}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs daily-logs-card">
      {/* Interactive Header & Actions (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-100 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0">
            Daily Driver Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            FMCSA 49 CFR Part 395 24-hour Electronic Logging Device (ELD) record of duty status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Day Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            {dailyLogs.map((log, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDayIdx(idx)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  selectedDayIdx === idx
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Day {log.day_number}
              </button>
            ))}
          </div>

          {/* Print Current Sheet */}
          <button
            type="button"
            onClick={handlePrintCurrent}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition"
            title={`Print or Save PDF for Day ${currentLog.day_number}`}
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>Print Log (Day {currentLog.day_number})</span>
          </button>

          {/* Print All Sheets (if multi-day) */}
          {dailyLogs.length > 1 && (
            <button
              type="button"
              onClick={handlePrintAll}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center gap-1.5 cursor-pointer transition"
              title={`Print all ${dailyLogs.length} daily log sheets`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Print All Days ({dailyLogs.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Per-Day Screen Metrics Bar (Hidden on Print) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 no-print">
        <div>
          <span className="text-[11px] font-medium text-slate-500 block">Date</span>
          <span className="text-sm font-bold text-slate-900">{currentLog.date}</span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-500 block">Total Driving</span>
          <span className="text-sm font-bold text-blue-700">
            {currentLog.duty_totals.driving.toFixed(1)} hrs
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-500 block">Total On Duty</span>
          <span className="text-sm font-bold text-amber-700">
            {currentLog.duty_totals.on_duty_not_driving.toFixed(1)} hrs
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-500 block">Total Off Duty</span>
          <span className="text-sm font-bold text-slate-700">
            {(currentLog.duty_totals.off_duty + currentLog.duty_totals.sleeper_berth).toFixed(1)} hrs
          </span>
        </div>
      </div>

      {/* Daily Driver Log Sheets (Always directly rendered in DOM) */}
      <div className="daily-logs-print-area">
        {(isPrintingAll ? dailyLogs : [currentLog]).map((log, idx) => (
          <div key={log.day_number || idx} className="a4-log-page mb-6 print:mb-0">
            {renderLogSheet(log)}
          </div>
        ))}
      </div>
    </div>
  );
};
