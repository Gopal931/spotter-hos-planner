import React from 'react';
import type { DailyLogSheet, DutyStatus } from '../../types/trip';

interface ELDGraphProps {
  currentLog: DailyLogSheet;
}

export const ELDGraph: React.FC<ELDGraphProps> = ({ currentLog }) => {
  const svgWidth = 960;
  const svgHeight = 220;
  const leftMargin = 150;  // Room for duty labels
  const rightMargin = 80;   // Room for row totals
  const gridWidth = svgWidth - leftMargin - rightMargin; // 730px
  const gridTop = 28;
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

  // Continuous step line path
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
          d += ` L ${startX} ${currentY}`;
        }
        d += ` L ${endX} ${currentY}`;
      }
    }
    return d;
  };

  return (
    <div className="eld-svg-wrapper overflow-x-auto py-2 select-none print:overflow-visible print:py-0">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="eld-graph-svg w-full min-w-[760px] print:min-w-0 print:w-full h-auto"
      >
        {/* Background Grid Box */}
        <rect
          x={leftMargin}
          y={gridTop}
          width={gridWidth}
          height={gridHeight}
          fill="#f8fafc"
          stroke="#94a3b8"
          strokeWidth="1.5"
        />

        {/* 4 Status Rows Dividing Lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`row-${i}`}
            x1={leftMargin}
            y1={gridTop + i * rowHeight}
            x2={leftMargin + gridWidth}
            y2={gridTop + i * rowHeight}
            stroke="#cbd5e1"
            strokeWidth={i === 0 || i === 4 ? '1.5' : '1'}
          />
        ))}

        {/* Status Labels on Left */}
        <text
          x={leftMargin - 12}
          y={statusYMap.OFF_DUTY + 4}
          textAnchor="end"
          fill="#334155"
          fontSize="11"
          fontWeight="700"
        >
          1. Off Duty
        </text>
        <text
          x={leftMargin - 12}
          y={statusYMap.SLEEPER_BERTH + 4}
          textAnchor="end"
          fill="#334155"
          fontSize="11"
          fontWeight="700"
        >
          2. Sleeper Berth
        </text>
        <text
          x={leftMargin - 12}
          y={statusYMap.DRIVING + 4}
          textAnchor="end"
          fill="#334155"
          fontSize="11"
          fontWeight="700"
        >
          3. Driving
        </text>
        <text
          x={leftMargin - 12}
          y={statusYMap.ON_DUTY_NOT_DRIVING + 4}
          textAnchor="end"
          fill="#334155"
          fontSize="11"
          fontWeight="700"
        >
          4. On Duty (Not Driving)
        </text>

        {/* Total Column Header on Right */}
        <text
          x={leftMargin + gridWidth + 36}
          y={gridTop - 10}
          textAnchor="middle"
          fill="#475569"
          fontSize="10"
          fontWeight="bold"
        >
          TOTAL
        </text>
        <text
          x={leftMargin + gridWidth + 36}
          y={gridTop - 1}
          textAnchor="middle"
          fill="#475569"
          fontSize="9"
          fontWeight="bold"
        >
          HOURS
        </text>

        {/* Total Values Per Row */}
        <text
          x={leftMargin + gridWidth + 36}
          y={statusYMap.OFF_DUTY + 5}
          textAnchor="middle"
          fill="#0f172a"
          fontSize="12"
          fontWeight="bold"
        >
          {currentLog.duty_totals.off_duty.toFixed(1)}
        </text>
        <text
          x={leftMargin + gridWidth + 36}
          y={statusYMap.SLEEPER_BERTH + 5}
          textAnchor="middle"
          fill="#0f172a"
          fontSize="12"
          fontWeight="bold"
        >
          {currentLog.duty_totals.sleeper_berth.toFixed(1)}
        </text>
        <text
          x={leftMargin + gridWidth + 36}
          y={statusYMap.DRIVING + 5}
          textAnchor="middle"
          fill="#0f172a"
          fontSize="12"
          fontWeight="bold"
        >
          {currentLog.duty_totals.driving.toFixed(1)}
        </text>
        <text
          x={leftMargin + gridWidth + 36}
          y={statusYMap.ON_DUTY_NOT_DRIVING + 5}
          textAnchor="middle"
          fill="#0f172a"
          fontSize="12"
          fontWeight="bold"
        >
          {currentLog.duty_totals.on_duty_not_driving.toFixed(1)}
        </text>

        {/* Sum Divider & Total Sum = 24.0 */}
        <line
          x1={leftMargin + gridWidth + 10}
          y1={gridTop + gridHeight}
          x2={leftMargin + gridWidth + 65}
          y2={gridTop + gridHeight}
          stroke="#94a3b8"
          strokeWidth="1.5"
        />
        <text
          x={leftMargin + gridWidth + 36}
          y={gridTop + gridHeight + 16}
          textAnchor="middle"
          fill="#2563eb"
          fontSize="11"
          fontWeight="bold"
        >
          = 24.0
        </text>

        {/* 24-Hour Vertical Rules and Sub-ticks */}
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
              <text
                x={x}
                y={gridTop - 8}
                textAnchor="middle"
                fill="#475569"
                fontSize="10"
                fontWeight="600"
              >
                {label}
              </text>

              {/* Full Vertical Line */}
              <line
                x1={x}
                y1={gridTop}
                x2={x}
                y2={gridTop + gridHeight}
                stroke={h === 0 || h === 12 || h === 24 ? '#64748b' : '#e2e8f0'}
                strokeWidth={h === 0 || h === 12 || h === 24 ? '1.5' : '1'}
              />

              {/* Bottom Hour Label */}
              <text
                x={x}
                y={gridTop + gridHeight + 14}
                textAnchor="middle"
                fill="#64748b"
                fontSize="9"
              >
                {label}
              </text>

              {/* 15m, 30m, 45m ticks */}
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
                        stroke={isHalf ? '#cbd5e1' : '#e2e8f0'}
                        strokeWidth="1"
                      />
                    );
                  });
                })}
            </g>
          );
        })}

        {/* Blue ELD Duty Step Line */}
        <path
          d={generateStepLinePath()}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
