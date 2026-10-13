import React, { useState } from 'react';
import { AuditEvaluation } from '../types/audit';
import { formatNumber } from '../utils/math';
import { Radar, ShieldCheck, AlertTriangle, Info } from 'lucide-react';

interface ForensicRadarChartProps {
  evaluation: AuditEvaluation;
}

interface RadarMetric {
  id: string;
  name: string;
  shortLabel: string;
  rawValStr: string;
  normalizedScore: number; // 0 to 100
  safeBenchmarkNormalized: number; // 0 to 100
  benchmarkStr: string;
  status: 'GOOD' | 'ACCEPTABLE' | 'MODERATE' | 'WARNING' | 'BAD';
  badgeColor: 'green' | 'yellow' | 'red';
}

export const ForensicRadarChart: React.FC<ForensicRadarChartProps> = ({ evaluation }) => {
  const [hoveredMetric, setHoveredMetric] = useState<RadarMetric | null>(null);

  // Normalize each method onto a 0-100 scale where higher is safer
  const metrics: RadarMetric[] = [
    // 1. Benford's Law (MAD)
    // MAD < 0.006 -> 85-100%, 0.006-0.012 -> 70-85%, 0.012-0.015 -> 50-70%, >= 0.015 -> 10-50%
    (() => {
      const mad = evaluation.benford.mad;
      let norm = 100;
      if (mad <= 0.006) {
        norm = 100 - (mad / 0.006) * 15; // 85 to 100
      } else if (mad <= 0.012) {
        norm = 85 - ((mad - 0.006) / 0.006) * 15; // 70 to 85
      } else if (mad <= 0.015) {
        norm = 70 - ((mad - 0.012) / 0.003) * 20; // 50 to 70
      } else {
        norm = Math.max(10, 50 - ((mad - 0.015) / 0.015) * 40); // 10 to 50
      }
      return {
        id: 'benford',
        name: "Benford's Law",
        shortLabel: 'Authenticity',
        rawValStr: `MAD = ${formatNumber(mad, 4)}`,
        normalizedScore: Math.round(norm),
        safeBenchmarkNormalized: 80,
        benchmarkStr: 'MAD < 0.006',
        status: evaluation.benford.status,
        badgeColor: evaluation.benford.badgeColor,
      };
    })(),

    // 2. Beneish M-Score
    // M <= -2.22 is safe. M = -3.0 -> 100%, M = -2.22 -> 75%, M = -1.5 -> 35%, M >= -1.0 -> 10%
    (() => {
      const m = evaluation.beneish.mScore;
      let norm = 75;
      if (m <= -2.22) {
        // Safe: -2.22 to -3.50+
        norm = Math.min(100, 75 + ((-2.22 - m) / 1.28) * 25);
      } else {
        // Risky: -2.22 to 0.00
        norm = Math.max(10, 75 - ((m - -2.22) / 2.0) * 65);
      }
      return {
        id: 'beneish',
        name: 'Beneish M-Score',
        shortLabel: 'Earnings Integrity',
        rawValStr: `M = ${formatNumber(m, 2)}`,
        normalizedScore: Math.round(norm),
        safeBenchmarkNormalized: 75,
        benchmarkStr: 'M ≤ -2.22',
        status: evaluation.beneish.status,
        badgeColor: evaluation.beneish.badgeColor,
      };
    })(),

    // 3. Altman Z-Score
    // Z > 2.60 Safe (75-100%), 1.10-2.60 Grey (35-75%), < 1.10 Distress (10-35%)
    (() => {
      const z = evaluation.altman.zScore;
      let norm = 50;
      if (z >= 2.60) {
        norm = Math.min(100, 75 + ((z - 2.60) / 1.4) * 25);
      } else if (z >= 1.10) {
        norm = 35 + ((z - 1.10) / 1.5) * 40;
      } else {
        norm = Math.max(10, (Math.max(0, z) / 1.10) * 35);
      }
      return {
        id: 'altman',
        name: 'Altman Z-Score',
        shortLabel: 'Solvency Margin',
        rawValStr: `Z = ${formatNumber(z, 2)}`,
        normalizedScore: Math.round(norm),
        safeBenchmarkNormalized: 75,
        benchmarkStr: 'Z > 2.60',
        status: evaluation.altman.status,
        badgeColor: evaluation.altman.badgeColor,
      };
    })(),

    // 4. Piotroski F-Score
    // 0 to 9 -> (F / 9) * 100%
    (() => {
      const f = evaluation.piotroski.fScore;
      const norm = Math.round((f / 9) * 100);
      return {
        id: 'piotroski',
        name: 'Piotroski F-Score',
        shortLabel: 'Fundamental Health',
        rawValStr: `F = ${f}/9`,
        normalizedScore: norm,
        safeBenchmarkNormalized: 78, // 7/9
        benchmarkStr: 'F ≥ 7 / 9',
        status: evaluation.piotroski.status,
        badgeColor: evaluation.piotroski.badgeColor,
      };
    })(),

    // 5. Earnings Quality (QoE)
    // QoE >= 1.0 Safe (75-100%), < 1.0 Accrual (10-75%)
    (() => {
      const qoe = evaluation.qoe.qoeRatio;
      let norm = 50;
      if (qoe >= 1.0) {
        norm = Math.min(100, 75 + Math.min(1, (qoe - 1.0) / 0.8) * 25);
      } else {
        norm = Math.max(10, Math.max(0, qoe) * 75);
      }
      return {
        id: 'qoe',
        name: 'Earnings Quality (QoE)',
        shortLabel: 'Cash Backing',
        rawValStr: `QoE = ${formatNumber(qoe, 2)}x`,
        normalizedScore: Math.round(norm),
        safeBenchmarkNormalized: 75,
        benchmarkStr: 'QoE ≥ 1.00x',
        status: evaluation.qoe.status,
        badgeColor: evaluation.qoe.badgeColor,
      };
    })(),
  ];

  // SVG Radar Geometry Calculations
  const size = 380;
  const center = size / 2;
  const radius = 135;
  const numAxes = metrics.length;
  const angleStep = (2 * Math.PI) / numAxes;

  // Function to calculate (x, y) coordinates for a given index and value (0-100)
  const getCoordinates = (index: number, value: number) => {
    // Start at top (-PI/2) and rotate clockwise
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Build grid polygon points for concentric rings (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [20, 40, 60, 80, 100];
  const gridPolygons = gridLevels.map((lvl) => {
    const points = Array.from({ length: numAxes })
      .map((_, i) => {
        const { x, y } = getCoordinates(i, lvl);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    return { level: lvl, points };
  });

  // Safe benchmark polygon points
  const safeBenchmarkPoints = metrics
    .map((m, i) => {
      const { x, y } = getCoordinates(i, m.safeBenchmarkNormalized);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Company actual score polygon points
  const companyPoints = metrics
    .map((m, i) => {
      const { x, y } = getCoordinates(i, m.normalizedScore);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const overallBadgeColor = evaluation.executiveSummary.verdictBadgeColor;
  const polygonColor =
    overallBadgeColor === 'green'
      ? { stroke: '#10B981', fill: 'rgba(16, 185, 129, 0.25)', dot: '#34D399' }
      : overallBadgeColor === 'yellow'
      ? { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.25)', dot: '#FBBF24' }
      : { stroke: '#EF4444', fill: 'rgba(239, 68, 68, 0.25)', dot: '#F87171' };

  return (
    <div className="p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-4 transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
            <Radar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              5-Method Forensic Radar Profile
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Normalized comparative polygon mapping company risk against the Institutional Safe Benchmark.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span
              className="w-3.5 h-3.5 rounded border"
              style={{ backgroundColor: polygonColor.fill, borderColor: polygonColor.stroke }}
            />
            <span className="text-slate-700 dark:text-slate-200">{evaluation.company} Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-amber-500 dark:border-amber-400" />
            <span className="text-slate-500 dark:text-slate-400">Safe Baseline (75%)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas & Interactive Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radar SVG Container */}
        <div className="lg:col-span-7 flex justify-center relative">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full max-w-[380px] h-auto drop-shadow-md select-none"
          >
            {/* Background concentric web polygons */}
            {gridPolygons.map(({ level, points }) => (
              <polygon
                key={level}
                points={points}
                fill="none"
                className={
                  level === 80
                    ? 'stroke-slate-400/60 dark:stroke-slate-500/50'
                    : 'stroke-slate-300/50 dark:stroke-slate-700/40'
                }
                strokeWidth={level === 80 ? '1.5' : '1'}
                strokeDasharray={level === 80 ? '3 3' : undefined}
              />
            ))}

            {/* Radial Spoke Lines */}
            {metrics.map((_, i) => {
              const { x, y } = getCoordinates(i, 100);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  className="stroke-slate-300 dark:stroke-slate-700/60"
                  strokeWidth="1"
                />
              );
            })}

            {/* Safe Baseline Overlay Polygon */}
            <polygon
              points={safeBenchmarkPoints}
              fill="rgba(245, 158, 11, 0.08)"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Company Score Polygon */}
            <polygon
              points={companyPoints}
              fill={polygonColor.fill}
              stroke={polygonColor.stroke}
              strokeWidth="2.5"
              className="transition-all duration-500 ease-out"
            />

            {/* Vertices Dots & Clickable Hit Areas */}
            {metrics.map((m, i) => {
              const { x, y } = getCoordinates(i, m.normalizedScore);
              const isHovered = hoveredMetric?.id === m.id;

              return (
                <g
                  key={m.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredMetric(m)}
                  onMouseLeave={() => setHoveredMetric(null)}
                >
                  {/* Outer glow ring when hovered */}
                  {isHovered && (
                    <circle
                      cx={x}
                      cy={y}
                      r="9"
                      fill="none"
                      stroke={polygonColor.dot}
                      strokeWidth="2"
                      opacity="0.8"
                    />
                  )}
                  {/* Vertex circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? '6' : '4.5'}
                    fill={polygonColor.dot}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="transition-all duration-200"
                  />
                  {/* Hit target for touch/mouse */}
                  <circle cx={x} cy={y} r="16" fill="transparent" />
                </g>
              );
            })}

            {/* Axis Labels */}
            {metrics.map((m, i) => {
              const { x, y, angle } = getCoordinates(i, 118);
              const isHovered = hoveredMetric?.id === m.id;

              // Text anchor adjustment depending on quadrant
              let textAnchor: 'middle' | 'start' | 'end' = 'middle';
              if (Math.cos(angle) > 0.25) textAnchor = 'start';
              else if (Math.cos(angle) < -0.25) textAnchor = 'end';

              return (
                <text
                  key={m.id}
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  fontSize="10"
                  fontWeight={isHovered ? '700' : '600'}
                  className={`cursor-pointer transition-colors font-sans ${
                    isHovered
                      ? 'fill-emerald-600 dark:fill-emerald-400'
                      : 'fill-slate-600 dark:fill-slate-300'
                  }`}
                  onMouseEnter={() => setHoveredMetric(m)}
                  onMouseLeave={() => setHoveredMetric(null)}
                >
                  {m.shortLabel}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Interactive Vertex Details & Normalized Scoreboard */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {hoveredMetric ? hoveredMetric.name : 'Hover Vertices for Details'}
              </span>
              {hoveredMetric && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    hoveredMetric.badgeColor === 'green'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : hoveredMetric.badgeColor === 'yellow'
                      ? 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {hoveredMetric.status}
                </span>
              )}
            </div>

            {hoveredMetric ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-slate-500 dark:text-slate-400">Normalized Index:</span>
                  <span className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {hoveredMetric.normalizedScore}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Calculated Metric:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{hoveredMetric.rawValStr}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Safe Target Rule:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">{hoveredMetric.benchmarkStr}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                The spider chart normalizes diverse units (Z-score ratios, M-score indices, MAD frequencies, and F-score counts)
                onto an aligned 0–100% solvency and integrity plane. Scores outside the amber dashed ring denote safe territory.
              </p>
            )}
          </div>

          {/* Quick 5-Method Score List */}
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {metrics.map((m) => {
              const isSelected = hoveredMetric?.id === m.id;
              return (
                <div
                  key={m.id}
                  onMouseEnter={() => setHoveredMetric(m)}
                  onMouseLeave={() => setHoveredMetric(null)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 border-emerald-500 text-slate-900 dark:text-white shadow-sm'
                      : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span className="font-medium">{m.name}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">{m.rawValStr}</span>
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        m.badgeColor === 'green'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : m.badgeColor === 'yellow'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {m.normalizedScore}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
