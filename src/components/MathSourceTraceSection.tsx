import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator, FileSpreadsheet, ArrowRight, ExternalLink, CheckCircle2, AlertOctagon, Info } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '../utils/math';

export interface SourceFieldMapping {
  name: string;
  fieldKey: string;
  category: string;
  baselineVal?: number;
  targetVal?: number;
  cellRefBaseline?: string; // e.g. "Financials!C10"
  cellRefTarget?: string;   // e.g. "Financials!D10"
  unit?: '$' | '%' | 'count' | 'ratio';
}

export interface StepSubstitution {
  stepNumber: number;
  stepName: string;
  equationTemplate: string;
  substitutedEquation: string;
  evaluatedResult: string | number;
  subWeight?: number;
  contribution?: number;
  diagnosticNote?: string;
}

export interface MathSourceTraceSectionProps {
  modelName: string;
  modelCode: string;
  overallFormulaName: string;
  formulaLatexOrText: string;
  finalScoreLabel: string;
  finalScoreFormatted: string;
  targetPeriod: string;
  baselinePeriod?: string;
  sourceFields: SourceFieldMapping[];
  calculationSteps: StepSubstitution[];
  auditNotes?: string[];
  defaultExpanded?: boolean;
  onJumpToLedger?: () => void;
}

export const MathSourceTraceSection: React.FC<MathSourceTraceSectionProps> = ({
  modelName,
  modelCode,
  overallFormulaName,
  formulaLatexOrText,
  finalScoreLabel,
  finalScoreFormatted,
  targetPeriod,
  baselinePeriod,
  sourceFields,
  calculationSteps,
  auditNotes,
  defaultExpanded = false,
  onJumpToLedger,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeSubTab, setActiveSubTab] = useState<'steps' | 'sources' | 'equation'>('steps');

  return (
    <div className="rounded-xl border border-emerald-500/30 dark:border-emerald-500/20 bg-gradient-to-r from-emerald-50/50 via-white to-slate-50/60 dark:from-emerald-950/20 dark:via-slate-900/80 dark:to-slate-950/40 shadow-sm overflow-hidden transition-all">
      {/* Header bar: click to expand / collapse */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-700/60 shadow-xs">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Math &amp; Source Data Trace
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/60">
                {modelCode}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                (Click to {isExpanded ? 'collapse' : 'audit formula & raw cell figures'})
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Verify exact mathematical substitutions and trace computed score terms directly to uploaded rows.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {finalScoreLabel}
            </div>
            <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
              {finalScoreFormatted}
            </div>
          </div>
          <div className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expandable Accordion Body */}
      {isExpanded && (
        <div className="border-t border-emerald-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-5 bg-white dark:bg-slate-900/90">
          {/* Sub Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-xs">
              <button
                type="button"
                onClick={() => setActiveSubTab('steps')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeSubTab === 'steps'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                1. Step-by-Step Number Substitution ({calculationSteps.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('sources')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeSubTab === 'sources'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                2. Raw Source Cell Trace ({sourceFields.length} variables)
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('equation')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeSubTab === 'equation'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                3. Mathematical Definition
              </button>
            </div>

            {onJumpToLedger && (
              <button
                type="button"
                onClick={onJumpToLedger}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Jump to Data Ledger &amp; CSV Workbench &rarr;</span>
              </button>
            )}
          </div>

          {/* TAB 1: Step-by-Step Number Substitution */}
          {activeSubTab === 'steps' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Evaluated using active fiscal statements: FY{baselinePeriod || 'Baseline'} &rarr; FY{targetPeriod}</span>
                <span className="font-mono">Total Variables Evaluated: {calculationSteps.length}</span>
              </div>

              <div className="space-y-2.5">
                {calculationSteps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/90 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900/80 transition-colors space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-bold flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-700/60">
                          {step.stepNumber}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                          {step.stepName}
                        </h5>
                      </div>

                      <div className="flex items-center gap-2">
                        {step.subWeight !== undefined && (
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            Weight: <strong className="text-slate-700 dark:text-slate-300">{step.subWeight > 0 ? `+${step.subWeight}` : step.subWeight}</strong>
                          </span>
                        )}
                        {step.contribution !== undefined && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border border-slate-300 dark:border-slate-700">
                            Contribution: {step.contribution > 0 ? `+${formatNumber(step.contribution, 3)}` : formatNumber(step.contribution, 3)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Equations: Template and Actual Numerical Substitution */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs pt-1">
                      <div className="md:col-span-5 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-slate-600 dark:text-slate-400">
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-sans font-semibold mb-0.5">
                          Formula Template
                        </div>
                        <div className="break-all">{step.equationTemplate}</div>
                      </div>

                      <div className="md:col-span-7 bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 font-mono text-slate-900 dark:text-slate-200">
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-sans font-semibold mb-0.5">
                          Numerical Substitution &amp; Evaluation
                        </div>
                        <div className="break-all font-semibold text-emerald-900 dark:text-emerald-300">
                          {step.substitutedEquation} = <span className="underline decoration-emerald-500 font-bold">{step.evaluatedResult}</span>
                        </div>
                      </div>
                    </div>

                    {step.diagnosticNote && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5 pt-0.5">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{step.diagnosticNote}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Raw Source Cell Trace */}
          {activeSubTab === 'sources' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Raw line-item values pulled from active statement CSV/Excel records</span>
                <span className="font-mono text-[11px]">FY{baselinePeriod || 'Baseline'} vs FY{targetPeriod}</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 uppercase font-sans font-semibold">
                      <th className="py-2.5 px-3">Field Name</th>
                      <th className="py-2.5 px-3">CSV Key</th>
                      <th className="py-2.5 px-3">Statement Category</th>
                      {baselinePeriod && (
                        <>
                          <th className="py-2.5 px-3 text-right">FY{baselinePeriod} (Raw Value)</th>
                          <th className="py-2.5 px-3">Cell Ref</th>
                        </>
                      )}
                      <th className="py-2.5 px-3 text-right">FY{targetPeriod} (Raw Value)</th>
                      <th className="py-2.5 px-3">Cell Ref</th>
                      {baselinePeriod && <th className="py-2.5 px-3 text-right font-sans">Variance</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {sourceFields.map((field) => {
                      const valBase = field.baselineVal;
                      const valTarget = field.targetVal;
                      const diff = valBase !== undefined && valTarget !== undefined ? valTarget - valBase : undefined;
                      const pct = valBase && diff !== undefined && valBase !== 0 ? diff / Math.abs(valBase) : undefined;

                      return (
                        <tr key={field.fieldKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white">
                            {field.name}
                          </td>
                          <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                            {field.fieldKey}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                            {field.category}
                          </td>

                          {baselinePeriod && (
                            <>
                              <td className="py-2.5 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                                {valBase !== undefined
                                  ? field.unit === '$'
                                    ? formatCurrency(valBase)
                                    : field.unit === '%'
                                    ? formatPercent(valBase)
                                    : formatNumber(valBase, 2)
                                  : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-[11px] text-slate-400">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                  {field.cellRefBaseline || `C(${field.fieldKey})`}
                                </span>
                              </td>
                            </>
                          )}

                          <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                            {valTarget !== undefined
                              ? field.unit === '$'
                                ? formatCurrency(valTarget)
                                : field.unit === '%'
                                ? formatPercent(valTarget)
                                : formatNumber(valTarget, 2)
                              : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-400">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                              {field.cellRefTarget || `D(${field.fieldKey})`}
                            </span>
                          </td>

                          {baselinePeriod && (
                            <td className="py-2.5 px-3 text-right tabular-nums font-sans text-[11px] font-semibold">
                              {pct !== undefined ? (
                                <span className={pct > 0 ? 'text-emerald-600 dark:text-emerald-400' : pct < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>
                                  {pct > 0 ? `+${formatPercent(pct, 1)}` : formatPercent(pct, 1)}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Theoretical Definition */}
          {activeSubTab === 'equation' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {overallFormulaName}
                  </span>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    Target Score: {finalScoreFormatted}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 font-bold overflow-x-auto">
                  {formulaLatexOrText}
                </div>
              </div>

              {auditNotes && auditNotes.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-1.5 text-xs">
                  <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Forensic Auditor Methodological Notes:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                    {auditNotes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
