import React from 'react';
import { PiotroskiResult, FinancialStatement } from '../types/audit';
import { ShieldCheck, AlertTriangle, AlertOctagon, Check, X } from 'lucide-react';
import { PiotroskiGauge } from './PiotroskiGauge';
import { MathSourceTraceSection, SourceFieldMapping, StepSubstitution } from './MathSourceTraceSection';

interface PiotroskiPanelProps {
  result: PiotroskiResult;
  currentFin?: FinancialStatement;
  priorFin?: FinancialStatement;
  targetPeriod?: string;
  baselinePeriod?: string;
  onJumpToLedger?: () => void;
}

export const PiotroskiPanel: React.FC<PiotroskiPanelProps> = ({
  result,
  currentFin,
  priorFin,
  targetPeriod = '2024',
  baselinePeriod = '2023',
  onJumpToLedger,
}) => {
  const isGood = result.fScore >= 7;
  const isModerate = result.fScore >= 4 && result.fScore <= 6;
  const isBad = result.fScore <= 3;

  const categories = ['Profitability', 'Leverage & Liquidity', 'Operating Efficiency'] as const;

  const cur = currentFin || ({
    NetIncome: 14200000,
    CFO: 16800000,
    TotalAssets: 152000000,
    LongTermDebt: 34000000,
    CurrentAssets: 64500000,
    CurrentLiabilities: 28000000,
    SharesOutstanding: 10000000,
    Sales: 188000000,
    COGS: 122000000,
  } as FinancialStatement);

  const pri = priorFin || ({
    NetIncome: 11800000,
    CFO: 13500000,
    TotalAssets: 138000000,
    LongTermDebt: 36000000,
    CurrentAssets: 59000000,
    CurrentLiabilities: 27000000,
    SharesOutstanding: 10000000,
    Sales: 165000000,
    COGS: 108000000,
  } as FinancialStatement);

  const roaCur = cur.TotalAssets > 0 ? cur.NetIncome / cur.TotalAssets : 0;
  const roaPri = pri.TotalAssets > 0 ? pri.NetIncome / pri.TotalAssets : 0;
  const levCur = cur.TotalAssets > 0 ? cur.LongTermDebt / cur.TotalAssets : 0;
  const levPri = pri.TotalAssets > 0 ? pri.LongTermDebt / pri.TotalAssets : 0;
  const crCur = cur.CurrentLiabilities > 0 ? cur.CurrentAssets / cur.CurrentLiabilities : 0;
  const crPri = pri.CurrentLiabilities > 0 ? pri.CurrentAssets / pri.CurrentLiabilities : 0;
  const gmCur = cur.Sales > 0 ? (cur.Sales - cur.COGS) / cur.Sales : 0;
  const gmPri = pri.Sales > 0 ? (pri.Sales - pri.COGS) / pri.Sales : 0;
  const atCur = cur.TotalAssets > 0 ? cur.Sales / cur.TotalAssets : 0;
  const atPri = pri.TotalAssets > 0 ? pri.Sales / pri.TotalAssets : 0;

  const sourceFields: SourceFieldMapping[] = [
    { name: 'Net Income', fieldKey: 'NetIncome', category: 'Income Statement', baselineVal: pri.NetIncome, targetVal: cur.NetIncome, cellRefBaseline: 'Financials!C7', cellRefTarget: 'Financials!D7', unit: '$' },
    { name: 'Cash Flow from Operations (CFO)', fieldKey: 'CFO', category: 'Cash Flow', baselineVal: pri.CFO, targetVal: cur.CFO, cellRefBaseline: 'Financials!C8', cellRefTarget: 'Financials!D8', unit: '$' },
    { name: 'Total Assets', fieldKey: 'TotalAssets', category: 'Balance Sheet (Assets)', baselineVal: pri.TotalAssets, targetVal: cur.TotalAssets, cellRefBaseline: 'Financials!C13', cellRefTarget: 'Financials!D13', unit: '$' },
    { name: 'Long Term Debt', fieldKey: 'LongTermDebt', category: 'Balance Sheet (Liabilities)', baselineVal: pri.LongTermDebt, targetVal: cur.LongTermDebt, cellRefBaseline: 'Financials!C16', cellRefTarget: 'Financials!D16', unit: '$' },
    { name: 'Current Assets', fieldKey: 'CurrentAssets', category: 'Balance Sheet (Assets)', baselineVal: pri.CurrentAssets, targetVal: cur.CurrentAssets, cellRefBaseline: 'Financials!C9', cellRefTarget: 'Financials!D9', unit: '$' },
    { name: 'Current Liabilities', fieldKey: 'CurrentLiabilities', category: 'Balance Sheet (Liabilities)', baselineVal: pri.CurrentLiabilities, targetVal: cur.CurrentLiabilities, cellRefBaseline: 'Financials!C15', cellRefTarget: 'Financials!D15', unit: '$' },
    { name: 'Common Shares Outstanding', fieldKey: 'SharesOutstanding', category: 'Equity', baselineVal: pri.SharesOutstanding, targetVal: cur.SharesOutstanding, cellRefBaseline: 'Financials!C19', cellRefTarget: 'Financials!D19', unit: 'count' },
    { name: 'Revenue / Sales', fieldKey: 'Sales', category: 'Income Statement', baselineVal: pri.Sales, targetVal: cur.Sales, cellRefBaseline: 'Financials!C3', cellRefTarget: 'Financials!D3', unit: '$' },
    { name: 'Cost of Goods Sold (COGS)', fieldKey: 'COGS', category: 'Income Statement', baselineVal: pri.COGS, targetVal: cur.COGS, cellRefBaseline: 'Financials!C4', cellRefTarget: 'Financials!D4', unit: '$' },
  ];

  const calculationSteps: StepSubstitution[] = [
    {
      stepNumber: 1,
      stepName: 'Signal 1: Positive Net Income (ROA > 0)',
      equationTemplate: 'S1 = (NetIncome_t / TotalAssets_t) > 0 ? 1 : 0',
      substitutedEquation: `(${cur.NetIncome.toLocaleString()} / ${cur.TotalAssets.toLocaleString()}) = ${(roaCur * 100).toFixed(2)}% > 0%`,
      evaluatedResult: roaCur > 0 ? '+1 Point' : '0 Points',
      subWeight: 1,
      contribution: roaCur > 0 ? 1 : 0,
      diagnosticNote: 'Basic operating profitability threshold.',
    },
    {
      stepNumber: 2,
      stepName: 'Signal 2: Positive Operating Cash Flow (CFO > 0)',
      equationTemplate: 'S2 = CFO_t > 0 ? 1 : 0',
      substitutedEquation: `CFO = $${cur.CFO.toLocaleString()} > $0`,
      evaluatedResult: cur.CFO > 0 ? '+1 Point' : '0 Points',
      subWeight: 1,
      contribution: cur.CFO > 0 ? 1 : 0,
      diagnosticNote: 'Organic cash generation test.',
    },
    {
      stepNumber: 3,
      stepName: 'Signal 3: Delta ROA Improvement (ROA_t > ROA_{t-1})',
      equationTemplate: 'S3 = (ROA_t - ROA_{t-1}) > 0 ? 1 : 0',
      substitutedEquation: `${(roaCur * 100).toFixed(2)}% vs ${(roaPri * 100).toFixed(2)}%`,
      evaluatedResult: roaCur > roaPri ? '+1 Point' : '0 Points',
      subWeight: 1,
      contribution: roaCur > roaPri ? 1 : 0,
      diagnosticNote: 'Year-over-year asset efficiency trend.',
    },
    {
      stepNumber: 4,
      stepName: 'Signal 4: Quality Accrual Backing (CFO > Net Income)',
      equationTemplate: 'S4 = CFO_t > NetIncome_t ? 1 : 0',
      substitutedEquation: `$${cur.CFO.toLocaleString()} > $${cur.NetIncome.toLocaleString()}`,
      evaluatedResult: cur.CFO > cur.NetIncome ? '+1 Point' : '0 Points',
      subWeight: 1,
      contribution: cur.CFO > cur.NetIncome ? 1 : 0,
      diagnosticNote: 'Ensures accounting profit is supported by real operating collections.',
    },
    {
      stepNumber: 5,
      stepName: 'Signal 5: Long-Term Deleveraging (LTD_t / TA_t < LTD_{t-1} / TA_{t-1})',
      equationTemplate: 'S5 = (LTD_t / TA_t) < (LTD_{t-1} / TA_{t-1}) ? 1 : 0',
      substitutedEquation: `(${cur.LongTermDebt.toLocaleString()} / ${cur.TotalAssets.toLocaleString()}) = ${(levCur * 100).toFixed(2)}% vs ${(levPri * 100).toFixed(2)}%`,
      evaluatedResult: levCur < levPri ? '+1 Point' : '0 Points',
      subWeight: 1,
      contribution: levCur < levPri ? 1 : 0,
      diagnosticNote: 'Financial gearing trajectory.',
    },
    {
      stepNumber: 6,
      stepName: 'Signal 6: Liquidity Expansion (CurrentRatio_t > CurrentRatio_{t-1})',
      equationTemplate: 'S6 = (CA_t / CL_t) > (CA_{t-1} / CL_{t-1}) ? 1 : 0',
      substitutedEquation: `(${cur.CurrentAssets.toLocaleString()} / ${cur.CurrentLiabilities.toLocaleString()}) = ${crCur.toFixed(2)}x vs ${crPri.toFixed(2)}x`,
      evaluatedResult: crCur > crPri ? '+1 Point' : '0 Points',
      subWeight: 1,
      contribution: crCur > crPri ? 1 : 0,
      diagnosticNote: 'Short-term obligations coverage.',
    },
    {
      stepNumber: 7,
      stepName: 'Signal 7: No Dilutive Stock Issuance (Shares_t <= Shares_{t-1})',
      equationTemplate: 'S7 = SharesOutstanding_t <= SharesOutstanding_{t-1} ? 1 : 0',
      substitutedEquation: `${cur.SharesOutstanding.toLocaleString()} <= ${pri.SharesOutstanding.toLocaleString()}`,
      evaluatedResult: cur.SharesOutstanding <= pri.SharesOutstanding ? '+1 Point' : '0 Points',
      subWeight: 1,
      contribution: cur.SharesOutstanding <= pri.SharesOutstanding ? 1 : 0,
      diagnosticNote: 'Confirms operations were not financed through dilutive equity offerings.',
    },
    {
      stepNumber: 8,
      stepName: 'Signal 8: Gross Margin Expansion (GM_t > GM_{t-1})',
      equationTemplate: 'S8 = [(Sales_t - COGS_t)/Sales_t] > [(Sales_{t-1} - COGS_{t-1})/Sales_{t-1}] ? 1 : 0',
      substitutedEquation: `${(gmCur * 100).toFixed(2)}% vs ${(gmPri * 100).toFixed(2)}%`,
      evaluatedResult: gmCur > gmPri ? '+1 Point' : '0 Points',
      subWeight: 1,
      contribution: gmCur > gmPri ? 1 : 0,
      diagnosticNote: 'Core commercial margin and pricing leverage.',
    },
    {
      stepNumber: 9,
      stepName: 'Signal 9: Asset Turnover Improvement (Sales_t / TA_t > Sales_{t-1} / TA_{t-1})',
      equationTemplate: 'S9 = (Sales_t / TA_t) > (Sales_{t-1} / TA_{t-1}) ? 1 : 0',
      substitutedEquation: `(${cur.Sales.toLocaleString()} / ${cur.TotalAssets.toLocaleString()}) = ${atCur.toFixed(2)}x vs ${atPri.toFixed(2)}x`,
      evaluatedResult: atCur > atPri ? '+1 Point' : '0 Points',
      subWeight: 1,
      contribution: atCur > atPri ? 1 : 0,
      diagnosticNote: 'Asset revenue generation efficiency.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner and Score Metric */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between space-y-4 transition-colors">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Piotroski F-Score (Fundamental Strength)
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
                {result.fScore} <span className="text-lg text-slate-500 font-normal">/ {result.maxScore}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold border ${
                  isGood
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80'
                    : isModerate
                    ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/80'
                    : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/80'
                }`}
              >
                {isGood && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                {isModerate && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                {isBad && <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />}
                <span>{result.badgeText}</span>
              </span>
            </div>
          </div>

          {/* Interactive Radial Segmented Gauge Visualizer */}
          <PiotroskiGauge
            score={result.fScore}
            maxScore={result.maxScore}
            status={result.status}
            badgeText={result.badgeText}
          />

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-800/80 pt-3">
            {result.takeaway}
          </p>
        </div>

        {/* Overview Box */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between space-y-3 transition-colors">
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
              Prof. Joseph Piotroski&apos;s 9-Point Value Accounting Framework
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Each criterion represents a discrete binary test (+1 point for pass, 0 for fail) evaluating
              year-over-year momentum in accounting profit, liquidity buffers, and operating efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {categories.map((cat) => {
              const catSignals = result.signals.filter((s) => s.category === cat);
              const passed = catSignals.filter((s) => s.pass).length;
              return (
                <div key={cat} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{cat}</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {passed} / {catSignals.length}{' '}
                    <span className="text-xs font-normal text-slate-500">passed</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2">
            Companies with F-Scores between 7 and 9 historically demonstrate significant outperformance
            and lower risk of accounting surprises.
          </div>
        </div>
      </div>

      {/* Interactive Expandable Math & Source Data Trace Section */}
      <MathSourceTraceSection
        modelName="Piotroski F-Score (Fundamental Momentum)"
        modelCode="F-Score"
        overallFormulaName="Piotroski 9-Criteria Binary Composite Model"
        formulaLatexOrText="F-Score = Σ [S₁ + S₂ + S₃ + S₄ + S₅ + S₆ + S₇ + S₈ + S₉] ∈ [0, 9]"
        finalScoreLabel="Computed F-Score"
        finalScoreFormatted={`${result.fScore} / 9 (${result.badgeText})`}
        targetPeriod={targetPeriod}
        baselinePeriod={baselinePeriod}
        sourceFields={sourceFields}
        calculationSteps={calculationSteps}
        auditNotes={[
          'All 9 conditions are evaluated independently as binary variables (1 if true, 0 if false).',
          'Scores 7-9 designate high-conviction fundamental momentum and pristine reporting quality.',
          'Scores 0-3 reflect systemic fundamental decline across liquidity and profitability.',
        ]}
        defaultExpanded={false}
        onJumpToLedger={onJumpToLedger}
      />

      {/* 9 Signals Grouped Breakdown */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const catSignals = result.signals.filter((s) => s.category === cat);
          return (
            <div key={cat} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none transition-colors">
              <div className="py-2.5 px-4 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{cat}</h4>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Passed: {catSignals.filter((s) => s.pass).length} of {catSignals.length}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {catSignals.map((signal) => (
                  <div
                    key={signal.id}
                    className={`p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors ${
                      signal.pass
                        ? 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                        : 'bg-rose-50/50 dark:bg-rose-950/10 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                          signal.pass
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {signal.pass ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{signal.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {signal.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{signal.rationale}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Condition: {signal.condition}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 sm:self-center ml-9 sm:ml-0">
                      <div className="text-right">
                        <div className="text-[11px] font-mono text-slate-800 dark:text-slate-300">
                          {signal.formattedComparison}
                        </div>
                        <div className="text-[10px] text-slate-500">Empirical Metric</div>
                      </div>

                      <div
                        className={`px-2.5 py-1 rounded text-xs font-bold font-mono border whitespace-nowrap ${
                          signal.pass
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                            : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/60'
                        }`}
                      >
                        {signal.pass ? '+1 Point' : '0 Points'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
