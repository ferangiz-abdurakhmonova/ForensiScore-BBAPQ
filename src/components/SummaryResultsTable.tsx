import React from 'react';
import { MethodSummaryItem } from '../types/audit';
import { CheckCircle2, AlertTriangle, AlertOctagon, ChevronRight, HelpCircle, Clock } from 'lucide-react';

interface SummaryResultsTableProps {
  items: MethodSummaryItem[];
  selectedMethod: string;
  onSelectMethod: (methodId: string) => void;
  onDrillDownBenford?: () => void;
}

export const SummaryResultsTable: React.FC<SummaryResultsTableProps> = ({
  items,
  selectedMethod,
  onSelectMethod,
  onDrillDownBenford,
}) => {
  return (
    <section id="summary-table" className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Methodology Scorecard & Benchmark Matrix
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            5 quantitative forensic evaluation frameworks with explicit Good vs. Bad decision rules.
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>Select any row to jump directly into the full mathematical breakdown</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none backdrop-blur-sm transition-colors">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/70">
              <th className="py-3 px-4">Evaluation Methodology</th>
              <th className="py-3 px-4">Computed Value</th>
              <th className="py-3 px-4">Benchmark Decision Rule</th>
              <th className="py-3 px-4">Status & Risk Badge</th>
              <th className="py-3 px-4 min-w-[280px]">Plain-Language Forensic Takeaway</th>
              <th className="py-3 px-3 text-right">Breakdown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {items.map((item) => {
              const isSelected = selectedMethod === item.id;
              const isGreen = item.badgeColor === 'green';
              const isYellow = item.badgeColor === 'yellow';
              const isRed = item.badgeColor === 'red';
              const isGray = item.badgeColor === 'gray';

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectMethod(item.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800/80 font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Methodology Name */}
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-slate-900 dark:text-slate-100">{item.name}</span>
                      <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">{item.category}</span>
                    </div>
                  </td>

                  {/* Computed Value */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-200 tabular-nums whitespace-nowrap">
                    <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-200">
                      {item.computedValueStr}
                    </span>
                  </td>

                  {/* Benchmark Rule */}
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">{item.benchmarkRule}</span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {item.id === 'benford' && item.badgeColor === 'red' && onDrillDownBenford ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDrillDownBenford();
                        }}
                        title="Click to drill down into anomalous transaction records"
                        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/60 transition-colors shadow-sm cursor-pointer"
                      >
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
                        <span>{item.badgeText}</span>
                        <span className="text-[10px] underline ml-1 text-rose-700 dark:text-rose-300">Drill Down &rarr;</span>
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                          isGreen
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                            : isYellow
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                            : isGray
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/60'
                        }`}
                      >
                        {isGreen && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                        {isYellow && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                        {isRed && <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                        {isGray && <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
                        <span>{item.badgeText}</span>
                      </span>
                    )}
                  </td>

                  {/* Plain-Language Takeaway */}
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                    <div className="flex items-center justify-between gap-2">
                      <span>{item.plainTakeaway}</span>
                      {item.id === 'benford' && item.badgeColor === 'red' && onDrillDownBenford && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDrillDownBenford();
                          }}
                          className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 dark:hover:bg-rose-800 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 transition-colors"
                        >
                          View Flagged Ledger
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Actions / View Details */}
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                        isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
