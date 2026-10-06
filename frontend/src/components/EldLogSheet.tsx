import React, { useState } from 'react';
import { FileText, Printer, CheckCircle } from 'lucide-react';
import type { DailyLogSheet, DutyStatus } from '../types/trip';

interface EldLogSheetProps {
  dailyLogs: DailyLogSheet[];
}

export const EldLogSheet: React.FC<EldLogSheetProps> = ({ dailyLogs }) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  if (!dailyLogs || dailyLogs.length === 0) {
    return null;
  }

  const currentLog = dailyLogs[selectedDayIdx] || dailyLogs[0];

  // Grid SVG dimensions and constants
  const svgWidth = 960;
  const svgHeight = 220;
  const leftMargin = 140; // Space for status labels
  const rightMargin = 80;  // Space for total hours
  const gridWidth = svgWidth - leftMargin - rightMargin; // 740px
  const gridTop = 30;
  const rowHeight = 36;
  const rowCount = 4;
  const gridHeight = rowHeight * rowCount; // 144px

  const statusYMap: Record<DutyStatus, number> = {
    OFF_DUTY: gridTop + rowHeight * 0.5,
    SLEEPER_BERTH: gridTop + rowHeight * 1.5,
    DRIVING: gridTop + rowHeight * 2.5,
    ON_DUTY_NOT_DRIVING: gridTop + rowHeight * 3.5,
  };

  const hourToX = (hour: number) => {
    return leftMargin + (hour / 24.0) * gridWidth;
  };

  // Generate SVG path for the continuous step line
  const generateStepLinePath = () => {
    const segments = currentLog.grid_segments;
    if (!segments || segments.length === 0) return '';

    let d = '';
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const startX = hourToX(seg.start_hour);
      const endX = hourToX(seg.end_hour);
      const currentY = statusYMap[seg.status];

      if (i === 0) {
        d += `M ${startX} ${currentY} L ${endX} ${currentY}`;
      } else {
        const prevSeg = segments[i - 1];
        const prevY = statusYMap[prevSeg.status];
        if (prevY !== currentY) {
          // Vertical transition line
          d += ` L ${startX} ${currentY}`;
        }
        // Horizontal status line
        d += ` L ${endX} ${currentY}`;
      }
    }
    return d;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl print:bg-white print:text-black print:p-0 print:border-none">
      {/* Component Title & Day Selector Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-800/80 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white m-0">
                Driver's Daily Log / ELD 24-Hour Graph Sheet
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official FMCSA Part 395 24-Hour Record of Duty Status (RODS) with 15-Minute Grid & Remarks
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Day Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-850">
            {dailyLogs.map((log, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDayIdx(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedDayIdx === idx
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Day {log.day_number}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
            title="Print or Save PDF"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>
        </div>
      </div>

      {/* FMCSA Official Paper Log Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 print:border-black print:bg-white text-slate-100 print:text-black">
        {/* Log Sheet Header */}
        <div className="border-b-2 border-slate-700 pb-4 mb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
            <div>
              <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                U.S. DEPARTMENT OF TRANSPORTATION — FEDERAL MOTOR CARRIER SAFETY ADMINISTRATION
              </div>
              <h3 className="text-lg font-black tracking-tight text-white print:text-black m-0">
                DRIVER'S DAILY LOG <span className="text-xs font-normal text-slate-400">(ONE CALENDAR DAY — 24 HOURS)</span>
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                <span className="text-slate-400 block text-[10px]">LOG DATE:</span>
                <span className="font-bold text-indigo-300 print:text-black">{currentLog.date}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                <span className="text-slate-400 block text-[10px]">TOTAL MILES TODAY:</span>
                <span className="font-bold text-emerald-400 print:text-black">{currentLog.total_miles_today} mi</span>
              </div>
            </div>
          </div>

          {/* Carrier & Vehicle Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">CARRIER NAME:</span>
              <span className="font-semibold text-slate-200 print:text-black">{currentLog.carrier_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">MAIN OFFICE ADDRESS:</span>
              <span className="font-semibold text-slate-200 print:text-black">{currentLog.main_office_address}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">HOME TERMINAL:</span>
              <span className="font-semibold text-slate-200 print:text-black">{currentLog.home_terminal}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">TRUCK / TRAILER #:</span>
              <span className="font-semibold text-slate-200 print:text-black">
                {currentLog.truck_number} / {currentLog.trailer_number}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">SHIPPING DOCUMENT / BOL:</span>
              <span className="font-semibold text-slate-200 print:text-black">{currentLog.shipping_doc}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">COMMODITY:</span>
              <span className="font-semibold text-slate-200 print:text-black">{currentLog.commodity}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">ORIGIN / DESTINATION:</span>
              <span className="font-semibold text-slate-200 print:text-black">
                {currentLog.from_location} → {currentLog.to_location}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">DRIVER SIGNATURE:</span>
              <span className="italic font-serif text-slate-300 print:text-black">Electronic Signature Certified (ELD)</span>
            </div>
          </div>
        </div>

        {/* The 24-Hour Graph Grid SVG */}
        <div className="overflow-x-auto my-4 py-2 bg-slate-900/60 rounded-xl border border-slate-800 print:bg-white print:border-black">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full min-w-[760px] h-auto select-none"
          >
            {/* Background Grid Box */}
            <rect
              x={leftMargin}
              y={gridTop}
              width={gridWidth}
              height={gridHeight}
              fill="#090d16"
              stroke="#475569"
              strokeWidth="1.5"
            />

            {/* 4 Status Rows Background & Horizontal Dividing Lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={`row-line-${i}`}
                x1={leftMargin}
                y1={gridTop + i * rowHeight}
                x2={leftMargin + gridWidth}
                y2={gridTop + i * rowHeight}
                stroke="#334155"
                strokeWidth={i === 0 || i === 4 ? '1.5' : '1'}
              />
            ))}

            {/* Status Labels on Left */}
            <text x={leftMargin - 10} y={statusYMap.OFF_DUTY + 4} textAnchor="end" fill="#94a3b8" fontSize="11" fontWeight="600">
              1. Off Duty
            </text>
            <text x={leftMargin - 10} y={statusYMap.SLEEPER_BERTH + 4} textAnchor="end" fill="#94a3b8" fontSize="11" fontWeight="600">
              2. Sleeper Berth
            </text>
            <text x={leftMargin - 10} y={statusYMap.DRIVING + 4} textAnchor="end" fill="#94a3b8" fontSize="11" fontWeight="600">
              3. Driving
            </text>
            <text x={leftMargin - 10} y={statusYMap.ON_DUTY_NOT_DRIVING + 4} textAnchor="end" fill="#94a3b8" fontSize="11" fontWeight="600">
              4. On Duty (Not Driving)
            </text>

            {/* Total Column Header on Right */}
            <text x={leftMargin + gridWidth + 35} y={gridTop - 10} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
              TOTAL
            </text>
            <text x={leftMargin + gridWidth + 35} y={gridTop - 1} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">
              HOURS
            </text>

            {/* Total Values per row */}
            <text x={leftMargin + gridWidth + 35} y={statusYMap.OFF_DUTY + 5} textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
              {currentLog.duty_totals.off_duty.toFixed(1)}
            </text>
            <text x={leftMargin + gridWidth + 35} y={statusYMap.SLEEPER_BERTH + 5} textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
              {currentLog.duty_totals.sleeper_berth.toFixed(1)}
            </text>
            <text x={leftMargin + gridWidth + 35} y={statusYMap.DRIVING + 5} textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
              {currentLog.duty_totals.driving.toFixed(1)}
            </text>
            <text x={leftMargin + gridWidth + 35} y={statusYMap.ON_DUTY_NOT_DRIVING + 5} textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
              {currentLog.duty_totals.on_duty_not_driving.toFixed(1)}
            </text>

            {/* Sum Total Badge */}
            <line
              x1={leftMargin + gridWidth + 10}
              y1={gridTop + gridHeight}
              x2={leftMargin + gridWidth + 65}
              y2={gridTop + gridHeight}
              stroke="#64748b"
              strokeWidth="1.5"
            />
            <text x={leftMargin + gridWidth + 35} y={gridTop + gridHeight + 16} textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">
              = 24.0
            </text>

            {/* Vertical Hour and Sub-hour ticks across 24 Hours */}
            {Array.from({ length: 25 }).map((_, h) => {
              const x = hourToX(h);
              const label =
                h === 0 || h === 24
                  ? 'Mid'
                  : h === 12
                  ? 'Noon'
                  : h > 12
                  ? `${h - 12}`
                  : `${h}`;

              return (
                <g key={`hour-${h}`}>
                  {/* Top Hour Label */}
                  <text x={x} y={gridTop - 8} textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="600">
                    {label}
                  </text>

                  {/* Hour Full Vertical Line */}
                  <line
                    x1={x}
                    y1={gridTop}
                    x2={x}
                    y2={gridTop + gridHeight}
                    stroke={h === 0 || h === 12 || h === 24 ? '#64748b' : '#334155'}
                    strokeWidth={h === 0 || h === 12 || h === 24 ? '1.5' : '1'}
                  />

                  {/* Bottom Hour Label */}
                  <text x={x} y={gridTop + gridHeight + 14} textAnchor="middle" fill="#cbd5e1" fontSize="9">
                    {label}
                  </text>

                  {/* 15-minute, 30-minute, 45-minute sub-ticks across rows */}
                  {h < 24 &&
                    [1, 2, 3].map((quarter) => {
                      const qX = hourToX(h + quarter * 0.25);
                      const isHalf = quarter === 2;
                      const tickSize = isHalf ? 8 : 4;

                      return [0, 1, 2, 3].map((rowIdx) => {
                        const rowCenter = gridTop + (rowIdx + 0.5) * rowHeight;
                        return (
                          <line
                            key={`tick-${h}-${quarter}-${rowIdx}`}
                            x1={qX}
                            y1={rowCenter - tickSize}
                            x2={qX}
                            y2={rowCenter + tickSize}
                            stroke={isHalf ? '#475569' : '#334155'}
                            strokeWidth="1"
                          />
                        );
                      });
                    })}
                </g>
              );
            })}

            {/* The Continuous ELD Step Line Graph */}
            <path
              d={generateStepLinePath()}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Remarks Section */}
        <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/40 my-3">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 m-0">
              Remarks (Duty Status Transitions & Location Annotations)
            </h4>
            <span className="text-[11px] text-slate-400">Time standard of home terminal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {currentLog.remarks.map((rem, idx) => (
              <div
                key={idx}
                className="text-xs p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-start gap-2.5"
              >
                <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[11px]">
                  {rem.time_str}
                </span>
                <div>
                  <div className="font-semibold text-slate-200">{rem.location}</div>
                  <div className="text-[11px] text-slate-400">{rem.activity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 70-Hour / 8-Day Driver Recap Table */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Driver 70-Hour / 8-Day Recap
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">A. Total On-Duty Hours Today (Lines 3 & 4):</span>
              <span className="text-sm font-bold text-white">{currentLog.recap.on_duty_hours_today} hrs</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">B. Total Accumulated in Last 8 Days:</span>
              <span className="text-sm font-bold text-indigo-300">{currentLog.recap.total_hours_last_8_days} / 70.0 hrs</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">C. Available On-Duty Hours Tomorrow:</span>
              <span className="text-sm font-bold text-emerald-400">{currentLog.recap.hours_available_tomorrow} hrs</span>
            </div>
          </div>
        </div>

        {/* Certification Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>I certify these entries are true and correct pursuant to 49 CFR Part 395.8</span>
          </div>
          <div>
            Retain original copy for 8 days in vehicle; submit to motor carrier within 13 days.
          </div>
        </div>
      </div>
    </div>
  );
};
