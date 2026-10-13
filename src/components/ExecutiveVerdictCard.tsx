import React from 'react';
import { ExecutiveSummary } from '../types/audit';
import { AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Building2, Calendar, Search, Clock } from 'lucide-react';

interface ExecutiveVerdictCardProps {
  summary: ExecutiveSummary;
  company: string;
  currentPeriod: string;
  priorPeriod: string;
  onJumpToMethod: (methodId: string) => void;
  onDrillDownBenford?: () => void;
}

export const ExecutiveVerdictCard: React.FC<ExecutiveVerdictCardProps> = ({
  summary,
  company,
  currentPeriod,
  priorPeriod,
  onJumpToMethod,
  onDrillDownBenford,
}) => {
  const isHealthy = summary.verdictBadgeColor === 'green';
  const isModerate = summary.verdictBadgeColor === 'yellow';
  const isHighRisk = summary.verdictBadgeColor === 'red';
  const isWaiting = summary.verdictBadgeColor === 'gray';

  return (
    <section id="executive-verdict" className="w-full">
      <div
        className={`relative overflow-hidden rounded-xl border p-6 transition-all ${
          isHighRisk
            ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60 shadow-md shadow-rose-950/5 dark:shadow-rose-950/30'
            : isModerate
            ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60 shadow-md shadow-amber-950/5 dark:shadow-amber-950/30'
            : isWaiting
            ? 'bg-slate-50/90 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 shadow-sm'
            : 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-md shadow-emerald-950/5 dark:shadow-emerald-950/30'
        }`}
      >
        {/* Top Header metadata bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{company}</h1>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-medium">
                  Audited Entity
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>
                  Comparison: FY{priorPeriod} vs FY{currentPeriod}
                </span>
                <span aria-hidden="true">·</span>
                <span>5-Dimensional Forensic Model</span>
              </div>
            </div>
          </div>

          {/* Quick Score Ratio Chips */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-lg text-xs shadow-sm">
              <span className="text-slate-500 dark:text-slate-400">Model Scores:</span>
              {isWaiting ? (
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  Awaiting CSV Datasets
                </span>
              ) : (
                <>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {summary.goodCount} Good
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">/</span>
                  <span className="font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                    {summary.warningCount} Warning
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">/</span>
                  <span className="font-semibold text-rose-700 dark:text-rose-400 tabular-nums">
                    {summary.badCount} High Risk
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Core Verdict Banner */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Overall Forensic Audit Verdict
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-base font-bold tracking-tight border shadow-sm ${
                  isHighRisk
                    ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-500/40'
                    : isModerate
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-500/40'
                    : isWaiting
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-500/40'
                }`}
              >
                {isHighRisk && <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />}
                {isModerate && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />}
                {isWaiting && <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0" />}
                {isHealthy && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                <span>{summary.verdict}</span>
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl">
              {summary.verdictSubtext}
            </p>

            {/* Visual Risk Distribution Meter */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span>Methodology Consensus Distribution</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                  {isWaiting ? '0% (Awaiting Data)' : `${Math.round((summary.goodCount / summary.totalMethods) * 100)}% Compliance`}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                <div
                  style={{ width: isWaiting ? '0%' : `${(summary.goodCount / summary.totalMethods) * 100}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`${summary.goodCount} Good`}
                />
                <div
                  style={{ width: isWaiting ? '0%' : `${(summary.warningCount / summary.totalMethods) * 100}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`${summary.goodCount} Good`}
                />
                <div
                  style={{ width: `${(summary.warningCount / summary.totalMethods) * 100}%` }}
                  className="bg-amber-500 transition-all duration-500"
                  title={`${summary.warningCount} Warning`}
                />
                <div
                  style={{ width: `${(summary.badCount / summary.totalMethods) * 100}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title={`${summary.badCount} Bad`}
                />
              </div>
            </div>
          </div>

          {/* Key Findings Card */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3 shadow-sm">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 flex items-center justify-between">
              <span>Primary Findings & Attention Vectors</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                {summary.keyRiskFlags.length} flags · {summary.positiveHighlights.length} strengths
              </span>
            </span>

            <div className="space-y-2 text-xs">
              {summary.keyRiskFlags.length > 0 && (
                <div className="space-y-1.5">
                  {summary.keyRiskFlags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              )}

              {summary.positiveHighlights.length > 0 && (
                <div className="space-y-1.5">
                  {summary.positiveHighlights.slice(0, 3).map((high, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{high}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Click any method below to view formulas & data traces</span>
              <button
                onClick={() => onJumpToMethod('beneish')}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-medium inline-flex items-center gap-1"
              >
                <span>Inspect Engines</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Feature 2: Contextual Divergence Explainer in Executive Verdict */}
        {summary.divergence && summary.divergence.hasDivergence && (
          <div className="mt-6 pt-5 border-t border-amber-200/80 dark:border-amber-800/60">
            <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 border border-amber-300 dark:border-amber-500/40 p-4.5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300 tracking-wide uppercase">
                        {summary.divergence.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                        {summary.divergence.badgeText}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                      {summary.divergence.headline}
                    </h3>
                  </div>
                </div>

                {onDrillDownBenford && (
                  <button
                    onClick={onDrillDownBenford}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors whitespace-nowrap"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Filter Anomalous Transactions &rarr;</span>
                  </button>
                )}
              </div>

              {/* Explanatory text */}
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                {summary.divergence.explanation}
              </p>

              {/* Comparison Matrix: Macro vs Micro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Macro Pillar Box */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Financial Statement Macro-Health (Pristine)
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">All Safe Zone</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-slate-600 dark:text-slate-400">
                    <div>Altman Z: <span className="font-bold text-emerald-600 dark:text-emerald-400">{summary.divergence.macroSignals.altmanZ.toFixed(2)}</span> (Safe &gt; 2.60)</div>
                    <div>Piotroski F: <span className="font-bold text-emerald-600 dark:text-emerald-400">{summary.divergence.macroSignals.piotroskiF}/9</span> (Strong)</div>
                    <div>Beneish M: <span className="font-bold text-emerald-600 dark:text-emerald-400">{summary.divergence.macroSignals.beneishM.toFixed(2)}</span> (Low Risk)</div>
                    <div>QoE Ratio: <span className="font-bold text-emerald-600 dark:text-emerald-400">{summary.divergence.macroSignals.qoeRatio.toFixed(2)}x</span> (Cash Backed)</div>
                  </div>
                </div>

                {/* Micro Forensics Pillar Box */}
                <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      Transaction Micro-Forensics (Failing)
                    </span>
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">Nonconformity</span>
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1 pt-1">
                    <div className="flex items-center justify-between">
                      <span>Benford MAD:</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {summary.divergence.microSignals.mad.toFixed(4)} (Threshold &ge; 0.0150)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Distorted Leading Digits:</span>
                      <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
                        Digits {summary.divergence.microSignals.topDistortedDigits.map((d) => d.digit).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Immediate Next-Step Forensic Audit Actions */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Mandatory Forensic Audit Action Steps:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {summary.divergence.actionableAuditSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200"
                    >
                      <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-tight">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
