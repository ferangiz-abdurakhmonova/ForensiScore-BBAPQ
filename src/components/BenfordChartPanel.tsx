import React, { useState, useMemo } from 'react';
import { BenfordResult, Transaction } from '../types/audit';
import { formatCurrency, formatNumber, formatPercent } from '../utils/math';
import {
  BarChart3,
  Info,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  SlidersHorizontal,
  FileSpreadsheet,
  Search,
  ExternalLink,
  Filter,
} from 'lucide-react';
import {
  MathSourceTraceSection,
  SourceFieldMapping,
  StepSubstitution,
} from './MathSourceTraceSection';

interface BenfordChartPanelProps {
  result: BenfordResult;
  transactions?: Transaction[];
  onDrillDownLedger?: (targetDigits?: number[]) => void;
  onJumpToLedger?: () => void;
}

export const BenfordChartPanel: React.FC<BenfordChartPanelProps> = ({
  result,
  transactions = [],
  onDrillDownLedger,
  onJumpToLedger,
}) => {
  const [activeDigit, setActiveDigit] = useState<number | null>(null);
  const [anomalyThreshold, setAnomalyThreshold] = useState<number>(0.035); // 3.5% deviation threshold
  const [txSearch, setTxSearch] = useState('');
  const [selectedDigitFilter, setSelectedDigitFilter] = useState<number | 'all'>('all');
  const [txPage, setTxPage] = useState(1);
  const PAGE_SIZE = 8;

  // Maximum frequency for scaling SVG/HTML bars (digit 1 is ~30.1%, so max ~35-45%)
  const maxFreq = Math.max(
    0.35,
    ...result.digitStats.map((d) => Math.max(d.observedFreq, d.expectedFreq))
  );

  // Identify anomalous digits based on current threshold
  const anomalousDigits = useMemo(() => {
    return result.digitStats.filter((d) => d.absDiffFreq >= anomalyThreshold);
  }, [result.digitStats, anomalyThreshold]);

  const anomalousDigitSet = useMemo(() => {
    return new Set(anomalousDigits.map((d) => d.digit));
  }, [anomalousDigits]);

  // Helper to extract first non-zero leading digit
  const getLeadingDigit = (amount: number): number | null => {
    const cleaned = String(Math.abs(amount)).replace(/[^1-9]/, '');
    return cleaned.length > 0 ? parseInt(cleaned.charAt(0), 10) : null;
  };

  // Sum of absolute deltas across digits 1 through 9
  const sumOfDeltas = useMemo(() => {
    return result.digitStats.reduce((sum, d) => sum + d.absDiffFreq, 0);
  }, [result.digitStats]);

  // Formatted summation string across digits 1 through 9
  const summationString = useMemo(() => {
    const deltas = result.digitStats.map((d) => formatPercent(d.absDiffFreq, 2)).join(' + ');
    return `MAD = (1/9) × [${deltas}] = (1/9) × ${formatNumber(sumOfDeltas, 4)} = ${formatNumber(result.mad, 4)}`;
  }, [result.digitStats, sumOfDeltas, result.mad]);

  // Find max deviation digit
  const maxDeviationStat = useMemo(() => {
    return [...result.digitStats].sort((a, b) => b.absDiffFreq - a.absDiffFreq)[0];
  }, [result.digitStats]);

  // Source Fields Mapping for Trace tab
  const sourceFields: SourceFieldMapping[] = useMemo(() => {
    return [
      {
        name: 'Total Valid Transactions Evaluated',
        fieldKey: 'totalValidTransactions',
        category: 'Ledger Population',
        targetVal: result.totalValidTransactions,
        cellRefTarget: `Transactions(1..${result.totalValidTransactions})`,
        unit: 'count',
      },
      {
        name: 'Mean Absolute Deviation (MAD Score)',
        fieldKey: 'mad',
        category: 'Forensic Metric',
        targetVal: result.mad,
        cellRefTarget: 'Derived: (1/9)Σ|Obs-Exp|',
        unit: 'ratio',
      },
      {
        name: 'Chi-Square Test Statistic (χ²)',
        fieldKey: 'chiSquare',
        category: 'Goodness of Fit',
        targetVal: result.chiSquare,
        cellRefTarget: 'Derived: Σ[(Obs-Exp)² / Exp]',
        unit: 'ratio',
      },
      {
        name: 'Chi-Square Degrees of Freedom',
        fieldKey: 'degreesOfFreedom',
        category: 'Statistical Degrees',
        targetVal: result.degreesOfFreedom,
        cellRefTarget: 'k - 1 = 9 - 1 = 8',
        unit: 'count',
      },
      {
        name: 'Statistical p-Value',
        fieldKey: 'pValue',
        category: 'Significance',
        targetVal: result.pValue,
        cellRefTarget: 'p(χ² >= stat, df=8)',
        unit: 'ratio',
      },
      {
        name: 'Maximum Deviating Digit',
        fieldKey: `digit_${maxDeviationStat.digit}`,
        category: 'Worst Anomaly',
        targetVal: maxDeviationStat.observedFreq,
        cellRefTarget: `Digit ${maxDeviationStat.digit} (Spread: ${formatPercent(maxDeviationStat.diffFreq, 1)})`,
        unit: '%',
      },
      {
        name: 'Anomalous Digits Exceeding Cutoff',
        fieldKey: 'anomalousCount',
        category: 'Threshold Violations',
        targetVal: anomalousDigits.length,
        cellRefTarget: `Cutoff ±${(anomalyThreshold * 100).toFixed(1)}%`,
        unit: 'count',
      },
    ];
  }, [result, maxDeviationStat, anomalousDigits.length, anomalyThreshold]);

  // Calculation Steps for Math Trace
  const calculationSteps: StepSubstitution[] = useMemo(() => {
    const steps: StepSubstitution[] = result.digitStats.map((stat) => {
      const isAnomalous = stat.absDiffFreq >= anomalyThreshold;
      return {
        stepNumber: stat.digit,
        stepName: `Digit ${stat.digit} Absolute Deviation |P_obs(${stat.digit}) - P_exp(${stat.digit})|`,
        equationTemplate: `|P_obs(${stat.digit}) - P_exp(${stat.digit})| where P_exp(${stat.digit}) = log₁₀(1 + 1/${stat.digit})`,
        substitutedEquation: `|${formatPercent(stat.observedFreq, 2)} - ${formatPercent(stat.expectedFreq, 2)}| = |${(stat.observedFreq).toFixed(4)} - ${(stat.expectedFreq).toFixed(4)}|`,
        evaluatedResult: formatNumber(stat.absDiffFreq, 4),
        subWeight: 1 / 9,
        contribution: stat.absDiffFreq / 9,
        diagnosticNote: isAnomalous
          ? `ANOMALOUS SPIKE: Observed ${formatPercent(stat.observedFreq, 1)} vs Expected ${formatPercent(stat.expectedFreq, 1)} (${stat.diffFreq > 0 ? '+' : ''}${formatPercent(stat.diffFreq, 1)} spread, count: ${stat.observedCount}).`
          : `Conformant: Observed ${formatPercent(stat.observedFreq, 1)} conforms to Benford expectation ${formatPercent(stat.expectedFreq, 1)}.`,
      };
    });

    // Step 10: Full Average & MAD score
    steps.push({
      stepNumber: 10,
      stepName: 'Mean Absolute Deviation (MAD) Final Aggregation',
      equationTemplate: 'MAD = (1/9) × Σ_{d=1..9} |P_obs(d) - P_exp(d)|',
      substitutedEquation: `(1/9) × (${result.digitStats.map((d) => (d.absDiffFreq).toFixed(4)).join(' + ')}) = (1/9) × ${formatNumber(sumOfDeltas, 4)}`,
      evaluatedResult: formatNumber(result.mad, 4),
      subWeight: 1.0,
      contribution: result.mad,
      diagnosticNote: `Nigrini (2012) Audit Benchmark: Close conformity < 0.006; Acceptable conformity 0.006 - 0.012; Non-conformity >= 0.015. Result: ${result.badgeText}.`,
    });

    return steps;
  }, [result.digitStats, anomalyThreshold, sumOfDeltas, result.mad, result.badgeText]);

  // Extract anomalous / flagged transactions
  const flaggedTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    return transactions
      .map((tx) => {
        const leadingDigit = getLeadingDigit(tx.Amount);
        const isAnomalousDigit = leadingDigit !== null && anomalousDigitSet.has(leadingDigit);
        const isRound = Math.abs(tx.Amount) >= 500 && Math.abs(tx.Amount) % 500 === 0;
        
        let reason = '';
        if (isAnomalousDigit && leadingDigit !== null) {
          const stat = result.digitStats.find((s) => s.digit === leadingDigit);
          const spread = stat ? (stat.diffFreq > 0 ? `+${formatPercent(stat.diffFreq, 1)}` : formatPercent(stat.diffFreq, 1)) : '';
          reason = `Non-conforming Leading Digit ${leadingDigit} (${spread} abnormal deviation)`;
        } else if (isRound) {
          reason = `Excessive round-dollar voucher ($${Math.abs(tx.Amount).toLocaleString()})`;
        }

        return {
          ...tx,
          leadingDigit,
          isAnomalousDigit,
          isRound,
          reason,
        };
      })
      .filter((tx) => tx.isAnomalousDigit || tx.isRound);
  }, [transactions, anomalousDigitSet, result.digitStats]);

  // Filtered transactions for the sample table
  const filteredFlaggedTxs = useMemo(() => {
    return flaggedTransactions.filter((tx) => {
      if (selectedDigitFilter !== 'all' && tx.leadingDigit !== selectedDigitFilter) {
        return false;
      }
      if (txSearch) {
        const query = txSearch.toLowerCase();
        const matchesId = tx.TransactionID.toLowerCase().includes(query);
        const matchesDesc = tx.Description.toLowerCase().includes(query);
        const matchesVendor = (tx.Vendor || '').toLowerCase().includes(query);
        return matchesId || matchesDesc || matchesVendor;
      }
      return true;
    });
  }, [flaggedTransactions, selectedDigitFilter, txSearch]);

  const totalFlaggedPages = Math.ceil(filteredFlaggedTxs.length / PAGE_SIZE) || 1;
  const paginatedFlaggedTxs = useMemo(() => {
    const start = (txPage - 1) * PAGE_SIZE;
    return filteredFlaggedTxs.slice(start, start + PAGE_SIZE);
  }, [filteredFlaggedTxs, txPage]);

  return (
    <div className="space-y-6">
      {/* Header and KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MAD */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-1 transition-colors">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Mean Absolute Deviation (MAD)
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {formatNumber(result.mad, 4)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Rule: &lt; 0.006 (Good), &lt; 0.012 (Acc), &ge; 0.015 (Bad)
          </p>
        </div>

        {/* Chi-Square */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-1 transition-colors">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Chi-Square (χ² Statistic)
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {formatNumber(result.chiSquare, 2)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Degrees of freedom: df = {result.degreesOfFreedom}
          </p>
        </div>

        {/* p-value */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-1 transition-colors">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Statistical p-Value
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {result.pValue < 0.0001 ? '< 0.0001' : formatNumber(result.pValue, 4)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {result.pValue < 0.05 ? 'Significant non-conformity (p < 0.05)' : 'Conforms to natural logs (p ≥ 0.05)'}
          </p>
        </div>

        {/* Status Badge Card - Clickable for Drill Down if Anomaly Detected */}
        <div
          onClick={() => {
            if (result.status === 'BAD' || result.mad >= 0.015) {
              onDrillDownLedger?.(anomalousDigits.map((d) => d.digit));
            }
          }}
          className={`p-4 rounded-xl border space-y-1 shadow-sm dark:shadow-none transition-all ${
            result.status === 'BAD' || result.mad >= 0.015
              ? 'cursor-pointer hover:ring-2 hover:ring-rose-500/50 hover:shadow-md'
              : ''
          } ${
            result.badgeColor === 'green'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200'
              : result.badgeColor === 'yellow'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60 text-amber-800 dark:text-amber-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Conformity Rating
            </span>
            {(result.status === 'BAD' || result.mad >= 0.015) && (
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-700">
                Drill-Down &rarr;
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            {result.badgeColor === 'green' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
            {result.badgeColor === 'yellow' && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />}
            {result.badgeColor === 'red' && <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />}
            <span className="text-sm font-bold tracking-tight">{result.badgeText}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {anomalousDigits.length > 0
              ? `${anomalousDigits.length} anomalous digit${anomalousDigits.length > 1 ? 's' : ''} flagged (${anomalousDigits.map((d) => d.digit).join(', ')})`
              : 'No anomalous digit spikes detected'}
          </p>
        </div>
      </div>

      {/* Grouped Bar Chart Section */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-4 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Grouped Benford Distribution Chart (Digits 1 through 9)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Side-by-side grouped bars comparing Observed Frequency vs. Theoretical Logarithmic Expectation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Legend */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Observed (Normal)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
                <span className="text-rose-700 dark:text-rose-300 font-medium">Observed (Anomalous)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600 inline-block border border-slate-400 dark:border-slate-500" />
                <span className="text-slate-500 dark:text-slate-400 font-medium">Expected Benford</span>
              </div>
            </div>

            {/* Threshold Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg">
              <SlidersHorizontal className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Anomaly Cutoff:</span>
              <select
                value={anomalyThreshold}
                onChange={(e) => setAnomalyThreshold(parseFloat(e.target.value))}
                aria-label="Anomaly Cutoff Threshold"
                className="bg-transparent text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-bold focus:outline-none cursor-pointer"
              >
                <option value={0.025} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">± 2.5% (Strict)</option>
                <option value={0.035} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">± 3.5% (Standard)</option>
                <option value={0.05} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">± 5.0% (Relaxed)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grouped Bar Chart Area */}
        <div className="relative pt-8 pb-4">
          {/* Y-axis grid lines */}
          <div className="absolute inset-x-0 top-8 bottom-12 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="border-b border-slate-400 dark:border-slate-600 w-full" />
            <div className="border-b border-slate-400 dark:border-slate-600 w-full" />
            <div className="border-b border-slate-400 dark:border-slate-600 w-full" />
            <div className="border-b border-slate-400 dark:border-slate-600 w-full" />
          </div>

          {/* Grouped Bars Container */}
          <div className="grid grid-cols-9 gap-2 sm:gap-4 h-64 items-end border-b border-slate-200 dark:border-slate-800 pb-2 relative z-10">
            {result.digitStats.map((stat) => {
              const obsHeightPercent = Math.min(100, (stat.observedFreq / maxFreq) * 100);
              const expHeightPercent = Math.min(100, (stat.expectedFreq / maxFreq) * 100);
              const isHovered = activeDigit === stat.digit;
              const isAnomalous = stat.absDiffFreq >= anomalyThreshold;

              return (
                <div
                  key={stat.digit}
                  onMouseEnter={() => setActiveDigit(stat.digit)}
                  onMouseLeave={() => setActiveDigit(null)}
                  onClick={() => onDrillDownLedger?.([stat.digit])}
                  className="flex flex-col items-center h-full justify-end cursor-pointer group"
                >
                  {/* Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute top-0 transform -translate-y-2 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-lg shadow-xl z-20 pointer-events-none border border-slate-700 whitespace-nowrap">
                      <div className="font-bold text-emerald-400">Digit {stat.digit}</div>
                      <div>Observed: {formatPercent(stat.observedFreq)} ({stat.observedCount} txs)</div>
                      <div>Expected: {formatPercent(stat.expectedFreq)}</div>
                      <div className={isAnomalous ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        Spread: {stat.diffFreq > 0 ? '+' : ''}{formatPercent(stat.diffFreq)}
                      </div>
                    </div>
                  )}

                  {/* Grouped Bars side by side */}
                  <div className="flex items-end justify-center gap-1 w-full h-full">
                    {/* Observed Bar */}
                    <div
                      style={{ height: `${obsHeightPercent}%` }}
                      className={`w-1/2 rounded-t transition-all duration-300 ${
                        isAnomalous
                          ? 'bg-rose-500 hover:bg-rose-600 shadow-sm shadow-rose-500/30'
                          : 'bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-500/20'
                      }`}
                      title={`Digit ${stat.digit} Observed: ${formatPercent(stat.observedFreq)}`}
                    />

                    {/* Expected Bar */}
                    <div
                      style={{ height: `${expHeightPercent}%` }}
                      className={`w-1/2 rounded-t transition-all duration-300 ${
                        isHovered
                          ? 'bg-slate-400 dark:bg-slate-400 border-t border-slate-500 dark:border-slate-300'
                          : 'bg-slate-300 dark:bg-slate-700/80 border-t border-slate-400 dark:border-slate-600'
                      }`}
                      title={`Digit ${stat.digit} Expected: ${formatPercent(stat.expectedFreq)}`}
                    />
                  </div>

                  {/* X-axis Digit Label & Delta */}
                  <div className="mt-2 text-center w-full">
                    <span
                      className={`text-xs font-mono font-bold block ${
                        isAnomalous
                          ? 'text-rose-600 dark:text-rose-400'
                          : isHovered
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {stat.digit}
                    </span>
                    <span
                      className={`block text-[10px] font-mono tabular-nums ${
                        isAnomalous
                          ? 'text-rose-600 dark:text-rose-400 font-bold'
                          : stat.diffFreq > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {stat.diffFreq > 0 ? '+' : ''}
                      {formatPercent(stat.diffFreq, 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend / Info footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <span>
              Grouped comparison contrasts actual transaction frequency (colored) against natural logarithmic distribution P(d) = log₁₀(1 + 1/d).
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            Total Analyzed: <strong className="text-slate-900 dark:text-white">{result.totalValidTransactions}</strong> Transactions
          </span>
        </div>
      </div>

      {/* Interactive Expandable Math & Source Data Trace Section */}
      <MathSourceTraceSection
        modelName="Benford's Law (First-Digit Anomaly Detection)"
        modelCode="Benford MAD"
        overallFormulaName="Nigrini (2012) Mean Absolute Deviation (MAD) Specification"
        formulaLatexOrText="MAD = (1/9) · Σ_{d=1..9} |P_observed(d) - P_expected(d)|  where P_expected(d) = log₁₀(1 + 1/d)"
        finalScoreLabel="Computed MAD Score"
        finalScoreFormatted={`${formatNumber(result.mad, 4)} (${result.badgeText})`}
        targetPeriod="Active Ledger"
        sourceFields={sourceFields}
        calculationSteps={calculationSteps}
        auditNotes={[
          'Exact Formula: MAD = (1/9) * Σ |P_observed(d) - P_expected(d)| across digits 1 through 9.',
          `Full Summation String: ${summationString}`,
          'Nigrini Forensic Standard: MAD < 0.006 (Close Conformity); 0.006 to 0.012 (Acceptable Conformity); 0.012 to 0.015 (Marginal); >= 0.015 (Non-Conforming / Synthetic Pattern).',
          `Chi-Square Goodness-of-Fit: χ² = ${formatNumber(result.chiSquare, 2)} with df = ${result.degreesOfFreedom}, p-value = ${result.pValue < 0.0001 ? '< 0.0001' : formatNumber(result.pValue, 4)}.`,
        ]}
        defaultExpanded={false}
        onJumpToLedger={onJumpToLedger}
      />

      {/* Digit Breakdown Detailed Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none transition-colors">
        <div className="py-2.5 px-4 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            First-Digit Frequency Distribution Matrix
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Threshold: ±{(anomalyThreshold * 100).toFixed(1)}%
          </span>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-950/40">
              <th className="py-2.5 px-4">Digit (d)</th>
              <th className="py-2.5 px-4 text-right">Observed Count</th>
              <th className="py-2.5 px-4 text-right">Observed %</th>
              <th className="py-2.5 px-4 text-right">Expected %</th>
              <th className="py-2.5 px-4 text-right">Spread (Obs - Exp)</th>
              <th className="py-2.5 px-4 text-right">|Deviation|</th>
              <th className="py-2.5 px-4 text-center">Anomaly Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
            {result.digitStats.map((stat) => {
              const isAnomalous = stat.absDiffFreq >= anomalyThreshold;
              return (
                <tr
                  key={stat.digit}
                  onClick={() => onDrillDownLedger?.([stat.digit])}
                  className={`cursor-pointer transition-colors ${
                    isAnomalous
                      ? 'bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-900 dark:text-rose-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-300'
                  }`}
                  title={`Click to filter raw transactions starting with Digit ${stat.digit}`}
                >
                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Digit {stat.digit}</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-600 dark:text-slate-500 font-sans font-normal underline">
                      Filter
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{stat.observedCount}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                    {formatPercent(stat.observedFreq)}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-slate-500 dark:text-slate-400">
                    {formatPercent(stat.expectedFreq)}
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right tabular-nums ${
                      isAnomalous
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : stat.diffFreq > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {stat.diffFreq > 0 ? '+' : ''}
                    {formatPercent(stat.diffFreq)}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-bold">
                    {formatPercent(stat.absDiffFreq)}
                  </td>
                  <td className="py-2.5 px-4 text-center font-sans">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        isAnomalous
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60'
                      }`}
                    >
                      {isAnomalous ? 'ANOMALOUS (DRILL DOWN)' : 'CONFORMANT'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Flagged & Anomalous Transactions Inspector Table */}
      {flaggedTransactions.length > 0 && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 overflow-hidden bg-white dark:bg-slate-900/80 shadow-sm transition-colors space-y-3 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Flagged &amp; Anomalous Transactions Inspector ({filteredFlaggedTxs.length} items)
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Exact source vouchers flagged due to non-conforming leading digits or unnatural round sums.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Digit Filter Chips */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => { setSelectedDigitFilter('all'); setTxPage(1); }}
                  className={`px-2 py-1 rounded font-semibold text-[11px] transition-colors ${
                    selectedDigitFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All ({flaggedTransactions.length})
                </button>
                {anomalousDigits.map((d) => (
                  <button
                    key={d.digit}
                    type="button"
                    onClick={() => { setSelectedDigitFilter(d.digit); setTxPage(1); }}
                    className={`px-2 py-1 rounded font-mono font-bold text-[11px] transition-colors ${
                      selectedDigitFilter === d.digit
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    }`}
                  >
                    Digit {d.digit}
                  </button>
                ))}
              </div>

              {/* Quick Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ID / vendor..."
                  value={txSearch}
                  onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
                  className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-44"
                />
              </div>

              <button
                type="button"
                onClick={() => { setTxSearch(''); setSelectedDigitFilter('all'); setTxPage(1); }}
                className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950 transition-colors"
              >
                Reset
              </button>

              {onJumpToLedger && (
                <button
                  type="button"
                  onClick={onJumpToLedger}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Full Ledger &rarr;</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 uppercase font-semibold">
                  <th className="py-2 px-3">Transaction ID</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Description / Vendor</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                  <th className="py-2 px-3 text-center">Leading Digit</th>
                  <th className="py-2 px-3">Diagnostic Rationale</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
                {paginatedFlaggedTxs.map((tx) => (
                  <tr
                    key={tx.TransactionID}
                    className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors"
                  >
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                      {tx.TransactionID}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                      {tx.Date}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200 max-w-[200px] truncate">
                      {tx.Description}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                      {formatCurrency(tx.Amount)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-xs border border-rose-300 dark:border-rose-700">
                        {tx.leadingDigit}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-sans text-[11px] text-rose-700 dark:text-rose-400">
                      {tx.reason}
                    </td>
                    <td className="py-2 px-3 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          if (tx.leadingDigit !== null) {
                            onDrillDownLedger?.([tx.leadingDigit]);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalFlaggedPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>
                Showing page {txPage} of {totalFlaggedPages} ({filteredFlaggedTxs.length} flagged vouchers)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={txPage <= 1}
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40 font-semibold"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={txPage >= totalFlaggedPages}
                  onClick={() => setTxPage((p) => Math.min(totalFlaggedPages, p + 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40 font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
