import React from 'react';
import { QoEResult, FinancialStatement } from '../types/audit';
import { formatCurrency, formatNumber, formatPercent, formatRatio } from '../utils/math';
import { ShieldCheck, AlertOctagon, DollarSign, Activity, FileCheck2, Scale } from 'lucide-react';
import { MathSourceTraceSection, SourceFieldMapping, StepSubstitution } from './MathSourceTraceSection';

interface QoEPanelProps {
  result: QoEResult;
  currentFin?: FinancialStatement;
  priorFin?: FinancialStatement;
  targetPeriod?: string;
  baselinePeriod?: string;
  onJumpToLedger?: () => void;
}

export const QoEPanel: React.FC<QoEPanelProps> = ({
  result,
  currentFin,
  priorFin,
  targetPeriod = '2024',
  baselinePeriod = '2023',
  onJumpToLedger,
}) => {
  const isGray = result.badgeColor === 'gray';
  const isGood = !isGray && result.status === 'GOOD';

  const cur = currentFin || ({
    CFO: result.cfo,
    NetIncome: result.netIncome,
    Sales: 188000000,
    TotalAssets: 152000000,
    CurrentAssets: 64500000,
    CurrentLiabilities: 28000000,
  } as FinancialStatement);

  const pri = priorFin || ({
    CFO: 13500000,
    NetIncome: 11800000,
    Sales: 165000000,
    TotalAssets: 138000000,
    CurrentAssets: 59000000,
    CurrentLiabilities: 27000000,
  } as FinancialStatement);

  const totalAccruals = cur.NetIncome - cur.CFO;
  const accrualIntensity = cur.TotalAssets > 0 ? totalAccruals / cur.TotalAssets : 0;
  const cashMargin = cur.Sales > 0 ? cur.CFO / cur.Sales : 0;
  const netProfitMargin = cur.Sales > 0 ? cur.NetIncome / cur.Sales : 0;

  const sourceFields: SourceFieldMapping[] = [
    {
      name: 'Cash Flow from Operations (CFO)',
      fieldKey: 'CFO',
      category: 'Statement of Cash Flows',
      baselineVal: pri.CFO,
      targetVal: cur.CFO,
      cellRefBaseline: 'Financials!C8',
      cellRefTarget: 'Financials!D8',
      unit: '$',
    },
    {
      name: 'Reported Net Income (GAAP)',
      fieldKey: 'NetIncome',
      category: 'Income Statement',
      baselineVal: pri.NetIncome,
      targetVal: cur.NetIncome,
      cellRefBaseline: 'Financials!C7',
      cellRefTarget: 'Financials!D7',
      unit: '$',
    },
    {
      name: 'Derived Total Accruals (NI - CFO)',
      fieldKey: 'Accruals',
      category: 'Accrual Accounting Adjustment',
      baselineVal: pri.NetIncome - pri.CFO,
      targetVal: totalAccruals,
      cellRefBaseline: 'Derived(C7 - C8)',
      cellRefTarget: 'Derived(D7 - D8)',
      unit: '$',
    },
    {
      name: 'Total Revenue / Sales',
      fieldKey: 'Sales',
      category: 'Income Statement',
      baselineVal: pri.Sales,
      targetVal: cur.Sales,
      cellRefBaseline: 'Financials!C3',
      cellRefTarget: 'Financials!D3',
      unit: '$',
    },
    {
      name: 'Total Balance Sheet Assets',
      fieldKey: 'TotalAssets',
      category: 'Balance Sheet (Assets)',
      baselineVal: pri.TotalAssets,
      targetVal: cur.TotalAssets,
      cellRefBaseline: 'Financials!C13',
      cellRefTarget: 'Financials!D13',
      unit: '$',
    },
  ];

  const calculationSteps: StepSubstitution[] = [
    {
      stepNumber: 1,
      stepName: 'Operating Cash Flow Coverage Ratio (QoE Ratio)',
      equationTemplate: 'QoE = CFO / NetIncome',
      substitutedEquation: `${cur.CFO.toLocaleString()} / ${cur.NetIncome.toLocaleString()}`,
      evaluatedResult: `${formatRatio(result.qoeRatio, 3)}x`,
      subWeight: 1.0,
      contribution: result.qoeRatio,
      diagnosticNote:
        result.qoeRatio >= 1.0
          ? 'Passed: Operating cash collections exceed reported accounting profit (high quality earnings).'
          : 'Warning: Reported net income exceeds cash collections, indicating reliance on uncollected accruals.',
    },
    {
      stepNumber: 2,
      stepName: 'Total Accounting Accruals (NI - CFO)',
      equationTemplate: 'Accruals = NetIncome - CFO',
      substitutedEquation: `${cur.NetIncome.toLocaleString()} - ${cur.CFO.toLocaleString()}`,
      evaluatedResult: totalAccruals > 0 ? `+${totalAccruals.toLocaleString()}` : totalAccruals.toLocaleString(),
      subWeight: 0,
      contribution: totalAccruals,
      diagnosticNote:
        totalAccruals <= 0
          ? 'Accrual cushion: Operating cash flows outpace paper earnings (negative total accruals is protective).'
          : 'Accrual inflation: Paper net income outpaces cash inflows by $' + totalAccruals.toLocaleString(),
    },
    {
      stepNumber: 3,
      stepName: 'Operating Cash Flow Conversion Margin (CFO / Sales)',
      equationTemplate: 'CashMargin = CFO / Sales',
      substitutedEquation: `${cur.CFO.toLocaleString()} / ${cur.Sales.toLocaleString()}`,
      evaluatedResult: formatPercent(cashMargin, 2),
      subWeight: 0,
      contribution: cashMargin,
      diagnosticNote: `For every $100 of revenue, the entity collected $${(cashMargin * 100).toFixed(2)} in cold liquid cash (vs Net Margin: ${formatPercent(netProfitMargin, 2)}).`,
    },
    {
      stepNumber: 4,
      stepName: 'Accrual Intensity Relative to Total Assets',
      equationTemplate: 'AccrualIntensity = (NetIncome - CFO) / TotalAssets',
      substitutedEquation: `(${cur.NetIncome.toLocaleString()} - ${cur.CFO.toLocaleString()}) / ${cur.TotalAssets.toLocaleString()} = ${totalAccruals.toLocaleString()} / ${cur.TotalAssets.toLocaleString()}`,
      evaluatedResult: formatPercent(accrualIntensity, 2),
      subWeight: 0,
      contribution: accrualIntensity,
      diagnosticNote: 'Normalized accrual drag against corporate asset base. Absolute values exceeding ±5% require substantive audit voucher verification.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner and Score Metric */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between space-y-4 transition-colors">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quality of Earnings Ratio (QoE)
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
                {isGray ? 'N/A' : `${formatRatio(result.qoeRatio, 2)}x`}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold border ${
                  isGray
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    : isGood
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80'
                    : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/80'
                }`}
              >
                {isGray ? (
                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                ) : isGood ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span>{result.badgeText}</span>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Benchmark Cutoff: 1.00x</span>
              <span className="font-mono text-slate-800 dark:text-slate-300 font-semibold">
                {isGray ? 'Awaiting financial statements' : isGood ? 'Exceeds 1.00x Target' : 'Falls below 1.00x Threshold'}
              </span>
            </div>
            {/* Visual Gauge */}
            <div className="relative h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
              <div className="w-[50%] bg-rose-500/85" title="Accrual-Driven / Weak (< 1.00x)" />
              <div className="w-[50%] bg-emerald-500/85" title="High Quality / Cash Backed (>= 1.00x)" />
              <div className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-slate-900 dark:bg-white z-10" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.00x (No cash backing)</span>
              <span className="text-slate-900 dark:text-white font-bold">1.00x Benchmark</span>
              <span>2.00x+ (Surplus cash)</span>
            </div>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-800/80 pt-3">
            {result.takeaway}
          </p>
        </div>

        {/* Core Calculation Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Operating Cash Flow */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between space-y-2 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Operating Cash Flow (CFO)
              </span>
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(result.cfo)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Actual organic cash collected
              </div>
            </div>
          </div>

          {/* Net Income */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between space-y-2 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Reported Net Income (NI)
              </span>
              <FileCheck2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(result.netIncome)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Accrual-based GAAP earnings
              </div>
            </div>
          </div>

          {/* Total Accruals */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between space-y-2 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Accruals (NI - CFO)
              </span>
              <Activity className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <div
                className={`text-xl font-bold font-mono tabular-nums ${
                  result.accruals > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {result.accruals > 0 ? `+${formatCurrency(result.accruals)}` : formatCurrency(result.accruals)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {result.accruals > 0 ? 'Paper profits (non-cash)' : 'Cash exceeds net income'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Expandable Math & Source Data Trace Section */}
      <MathSourceTraceSection
        modelName="Quality of Earnings / Cash Conversion (QoE)"
        modelCode="QoE Ratio"
        overallFormulaName="Operating Cash Flow Backing & Total Accrual Mechanics"
        formulaLatexOrText="QoE = Cash Flow from Operations (CFO) / Reported Net Income (NI)  |  Total Accruals = Net Income - CFO"
        finalScoreLabel="Computed QoE Ratio"
        finalScoreFormatted={`${formatRatio(result.qoeRatio, 2)}x (${result.badgeText})`}
        targetPeriod={targetPeriod}
        baselinePeriod={baselinePeriod}
        sourceFields={sourceFields}
        calculationSteps={calculationSteps}
        auditNotes={[
          'Benchmark Cutoff: QoE >= 1.00x indicates high-quality earnings backed by tangible operating cash flow.',
          'Total Accruals = Net Income - CFO ($' + totalAccruals.toLocaleString() + '). When positive, net income is driven by uncollected receivables or capitalized costs.',
          'Accrual Intensity = ' + formatPercent(accrualIntensity, 2) + ' of total assets. Forensic red flags trigger if accruals persistently outpace cash over consecutive multi-period reporting cycles.',
        ]}
        defaultExpanded={false}
        onJumpToLedger={onJumpToLedger}
      />

      {/* Forensic Deep Dive on Accruals */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none space-y-3 transition-colors">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Forensic Cash Flow Conversion Mechanics
        </h4>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {result.interpretation}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">High Quality Indicator (QoE &ge; 1.0):</span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              When CFO exceeds Net Income, the company&apos;s revenues are being converted directly into liquid bank balances.
              Non-cash charges like depreciation and amortization are covered by core operating collections without relying on vendor credit expansion.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-rose-600 dark:text-rose-400">Red Flag Anomaly (QoE &lt; 1.0):</span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              A chronic disconnect where accounting profit grows while operating cash flow lags indicates aggressive revenue recognition
              (uncollected accounts receivable), unsold inventory buildup, or deferred operational expenses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
