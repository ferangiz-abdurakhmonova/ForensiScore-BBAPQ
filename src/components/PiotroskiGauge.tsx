import React from 'react';

interface PiotroskiGaugeProps {
  score: number; // 0 to 9
  maxScore?: number;
  status: 'GOOD' | 'MODERATE' | 'BAD';
  badgeText: string;
}

export const PiotroskiGauge: React.FC<PiotroskiGaugeProps> = ({
  score,
  maxScore = 9,
  status,
  badgeText,
}) => {
  // 9 segmented curved steps along a 240-degree arc
  // Angles from 150° (bottom-left) to 390° (bottom-right)
  const segments = Array.from({ length: maxScore }).map((_, i) => i + 1);

  const getSegmentColor = (segmentIndex: number) => {
    // 1-3: Rose (Weak)
    // 4-6: Amber (Moderate)
    // 7-9: Emerald (Strong)
    if (segmentIndex <= 3) return { active: '#EF4444', glow: 'rgba(239, 68, 68, 0.4)' };
    if (segmentIndex <= 6) return { active: '#F59E0B', glow: 'rgba(245, 158, 11, 0.4)' };
    return { active: '#10B981', glow: 'rgba(16, 185, 129, 0.4)' };
  };

  const statusColor =
    status === 'GOOD'
      ? { badgeBg: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60' }
      : status === 'MODERATE'
      ? { badgeBg: 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60' }
      : { badgeBg: 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/60' };

  return (
    <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50/80 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800/80 transition-colors">
      <div className="relative w-56 h-36 flex items-center justify-center">
        {/* SVG Radial Gauge */}
        <svg viewBox="0 0 200 130" className="w-full h-full">
          {segments.map((segNum, idx) => {
            // Arc of 220 degrees from angle 160° to 380°
            // 9 segments -> each segment spans ~20 degrees with 4 degree gap
            const totalArc = 220;
            const startAngle = 160;
            const segSpan = totalArc / maxScore; // ~24.4 deg
            const segGap = 4; // 4 deg gap
            const segStart = startAngle + idx * segSpan;
            const segEnd = segStart + (segSpan - segGap);

            const toRad = (deg: number) => (deg * Math.PI) / 180;
            const r = 70;
            const cx = 100;
            const cy = 85;

            const x1 = cx + r * Math.cos(toRad(segStart));
            const y1 = cy + r * Math.sin(toRad(segStart));
            const x2 = cx + r * Math.cos(toRad(segEnd));
            const y2 = cy + r * Math.sin(toRad(segEnd));

            const isPassed = segNum <= score;
            const segColors = getSegmentColor(segNum);

            return (
              <g key={segNum}>
                {/* Background track segment */}
                <path
                  d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                  fill="none"
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Active illuminated segment */}
                {isPassed && (
                  <path
                    d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                    fill="none"
                    stroke={segColors.active}
                    strokeWidth="12"
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                    style={{
                      filter: `drop-shadow(0 0 4px ${segColors.glow})`,
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
              {score}
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">/ 9</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
            {Math.round((score / maxScore) * 100)}% Criteria Met
          </span>
        </div>
      </div>

      {/* Segment Legend */}
      <div className="w-full flex items-center justify-between text-[10px] font-mono font-semibold px-2 mt-0.5">
        <span className="text-rose-600 dark:text-rose-400">0–3 Weak</span>
        <span className="text-amber-600 dark:text-amber-400">4–6 Neutral</span>
        <span className="text-emerald-600 dark:text-emerald-400">7–9 Strong</span>
      </div>

      <div className="mt-2.5">
        <span
          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${statusColor.badgeBg}`}
        >
          {badgeText}
        </span>
      </div>
    </div>
  );
};
