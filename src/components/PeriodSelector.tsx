import React from 'react';
import { Calendar, ArrowRight, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { PRESET_SCENARIOS, PresetScenario } from '../data/syntheticData';

interface PeriodSelectorProps {
  availablePeriods: string[];
  targetPeriod: string;
  baselinePeriod: string;
  activePresetId?: string;
  onTargetPeriodChange: (period: string) => void;
  onBaselinePeriodChange: (period: string) => void;
  onSelectPreset?: (preset: PresetScenario) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  availablePeriods,
  targetPeriod,
  baselinePeriod,
  activePresetId,
  onTargetPeriodChange,
  onBaselinePeriodChange,
  onSelectPreset,
}) => {
  // Calculate span
  const targetYearNum = parseInt(targetPeriod, 10);
  const baselineYearNum = parseInt(baselinePeriod, 10);
  const isNumericYears = !isNaN(targetYearNum) && !isNaN(baselineYearNum);

  const yearDiff = isNumericYears ? targetYearNum - baselineYearNum : 0;
  const isInverse = isNumericYears && yearDiff < 0;
  const isSame = targetPeriod === baselinePeriod;

  let spanDescription = '';
  if (isSame) {
    spanDescription = 'Single-Period Snapshot (No Delta)';
  } else if (isNumericYears) {
    const absDiff = Math.abs(yearDiff);
    spanDescription = `${absDiff}-Year ${absDiff === 1 ? 'Annual Step' : 'Comparative Span'}`;
  } else {
    spanDescription = `${baselinePeriod} to ${targetPeriod}`;
  }

  return (
    <div className="w-full p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
      {/* Label and Context */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Comparative Period Window
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              Live Recomputation
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Select arbitrary fiscal years to stress-test multi-year earnings velocity and balance sheet decay.
          </p>
        </div>
      </div>

      {/* Selectors and Span Badge */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Baseline Period (t-baseline) Dropdown */}
        <div className="flex flex-col">
          <label htmlFor="baseline-period-select" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Baseline Period (t-baseline)
          </label>
          <div className="relative">
            <select
              id="baseline-period-select"
              aria-label="Baseline Period (t-baseline)"
              value={baselinePeriod}
              onChange={(e) => onBaselinePeriodChange(e.target.value)}
              className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:border-emerald-500 cursor-pointer pr-8 shadow-sm"
            >
              {availablePeriods.length === 0 ? (
                <option value="N/A" className="bg-white dark:bg-slate-900 text-slate-500 font-mono">
                  N/A (Awaiting CSV)
                </option>
              ) : (
                availablePeriods.map((period) => (
                  <option key={period} value={period} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono">
                    FY{period} {period === targetPeriod ? '(Current Target)' : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="hidden sm:flex items-center pt-4 text-slate-400 dark:text-slate-500">
          <ArrowRight className="w-4 h-4" />
        </div>

        {/* Target Period (t) Dropdown */}
        <div className="flex flex-col">
          <label htmlFor="target-period-select" className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Target Period (t)
          </label>
          <div className="relative">
            <select
              id="target-period-select"
              aria-label="Target Period (t)"
              value={targetPeriod}
              onChange={(e) => onTargetPeriodChange(e.target.value)}
              className="bg-white dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs px-3 py-1.5 rounded-lg border border-emerald-500 dark:border-emerald-700/60 hover:border-emerald-600 dark:hover:border-emerald-500 focus:outline-none focus:border-emerald-500 cursor-pointer pr-8 shadow-sm"
            >
              {availablePeriods.length === 0 ? (
                <option value="N/A" className="bg-white dark:bg-slate-900 text-slate-500 font-mono">
                  N/A (Awaiting CSV)
                </option>
              ) : (
                availablePeriods.map((period) => (
                  <option key={period} value={period} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono">
                    FY{period} {period === baselinePeriod ? '(Current Baseline)' : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Dynamic Span Alert / Badge */}
        <div className="pt-4 self-end sm:self-auto">
          {availablePeriods.length === 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Awaiting Financials CSV</span>
            </div>
          ) : isSame ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 shadow-sm">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Identical Periods: Baseline & Target match</span>
            </div>
          ) : isInverse ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>
                FY{baselinePeriod} &rarr; FY{targetPeriod} (Reverse Flow)
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                FY{baselinePeriod} &rarr; FY{targetPeriod} ({spanDescription})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Forensic Stress-Test Quick Presets */}
      {onSelectPreset && (
        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Presets:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {PRESET_SCENARIOS.map((preset) => {
              const isCurrent = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
                    isCurrent
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-400 dark:hover:border-emerald-700'
                  }`}
                  title={`${preset.name} - ${preset.description}`}
                >
                  {preset.shortTag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
