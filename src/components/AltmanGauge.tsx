import React from 'react';
import { formatNumber } from '../utils/math';

interface AltmanGaugeProps {
  zScore: number;
  status: 'GOOD' | 'WARNING' | 'BAD';
  zoneName: string;
}

export const AltmanGauge: React.FC<AltmanGaugeProps> = ({ zScore, status, zoneName }) => {
  // Semicircular Gauge (180 degrees, from -180° to 0° or -90° to 90°)
  // Range: 0.0 to 4.0
  // Distress: 0.0 to 1.10  (0% to 27.5% of range -> 0° to 49.5°)
  // Grey:     1.10 to 2.60 (27.5% to 65% of range -> 49.5° to 117°)
  // Safe:     2.60 to 4.00 (65% to 100% of range -> 117° to 180°)

  const clampedZ = Math.max(0, Math.min(4.0, zScore));
  const normalizedFraction = clampedZ / 4.0;
  // Needle angle from -90° (at 0.0) to +90° (at 4.0)
  const needleAngle = -90 + normalizedFraction * 180;

  const color =
    status === 'GOOD'
      ? {
          stroke: '#10B981',
          badgeBg: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
        }
      : status === 'WARNING'
      ? {
          stroke: '#F59E0B',
          badgeBg: 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
        }
      : {
          stroke: '#EF4444',
          badgeBg: 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/60',
        };

  return (
    <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50/80 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800/80 transition-colors">
      <div className="relative w-56 h-32 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 200 115" className="w-full h-full">
          {/* Arc path definitions: radius 80, center (100, 100) */}
          {/* Outer track background */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Distress Zone Arc: 0.0 to 1.10 (fraction: 0.275) */}
          <path
            d="M 20 100 A 80 80 0 0 1 48 39"
            fill="none"
            stroke="#EF4444"
            strokeWidth="16"
            strokeDasharray="4 2"
            opacity="0.85"
          />

          {/* Grey Zone Arc: 1.10 to 2.60 (fraction: 0.275 to 0.65) */}
          <path
            d="M 48 39 A 80 80 0 0 1 136 27"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="16"
            strokeDasharray="4 2"
            opacity="0.85"
          />

          {/* Safe Zone Arc: 2.60 to 4.00 (fraction: 0.65 to 1.0) */}
          <path
            d="M 136 27 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#10B981"
            strokeWidth="16"
            opacity="0.85"
          />

          {/* Center Hub */}
          <circle cx="100" cy="100" r="8" className="fill-slate-400 dark:fill-slate-600 stroke-white dark:stroke-slate-900" strokeWidth="2" />

          {/* Needle */}
          <g transform={`rotate(${needleAngle}, 100, 100)`} className="transition-transform duration-700 ease-out">
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="28"
              className="stroke-slate-800 dark:stroke-slate-100"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="100" cy="28" r="3" fill={color.stroke} />
          </g>
        </svg>

        {/* Numeric Readout at bottom center */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatNumber(zScore, 2)}
          </span>
        </div>
      </div>

      {/* Zone Indicators & Subtitle */}
      <div className="w-full flex items-center justify-between text-[10px] font-mono font-semibold px-2 mt-1">
        <span className="text-rose-600 dark:text-rose-400">&lt; 1.10 Distress</span>
        <span className="text-amber-600 dark:text-amber-400">1.10–2.60 Grey</span>
        <span className="text-emerald-600 dark:text-emerald-400">&gt; 2.60 Safe</span>
      </div>

      <div className="mt-2.5">
        <span
          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${color.badgeBg}`}
        >
          {zoneName}
        </span>
      </div>
    </div>
  );
};
