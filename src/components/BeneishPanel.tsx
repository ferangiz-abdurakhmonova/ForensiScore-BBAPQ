import React from 'react';
import { BeneishResult, FinancialStatement } from '../types/audit';
import { formatNumber } from '../utils/math';
import { ShieldCheck, AlertOctagon, HelpCircle, Layers } from 'lucide-react';
import { MathSourceTraceSection, SourceFieldMapping, StepSubstitution } from './MathSourceTraceSection';

interface BeneishPanelProps {
  result: BeneishResult;
  currentFin?: FinancialStatement;
  priorFin?: FinancialStatement;
  targetPeriod?: string;
  baselinePeriod?: string;
  onJumpToLedger?: () => void;
}

export const BeneishPanel: React.FC<BeneishPanelProps> = ({
  result,
  currentFin,
  priorFin,
  targetPeriod = '2024',
  baselinePeriod = '2023',
  onJumpToLedger,
}) => {
  const isManipulator = result.mScore > -2.22;
  const varsList = Object.values(result.variables);

  const cur = currentFin || ({
    Receivables: 15200000,
    Sales: 188000000,
    COGS: 122000000,
    CurrentAssets: 64500000,
    PPE: 78000000,
    TotalAssets: 152000000,
    Depreciation: 8500000,
    SGA: 28000000,
    NetIncome: 14200000,
    CFO: 16800000,
    TotalLiabilities: 68000000,
  } as FinancialStatement);

  const pri = priorFin || ({
    Receivables: 14500000,
    Sales: 165000000,
    COGS: 108000000,
    CurrentAssets: 59000000,
    PPE: 72000000,
    TotalAssets: 138000000,
    Depreciation: 7800000,
    SGA: 25500000,
    NetIncome: 11800000,
    CFO: 13500000,
    TotalLiabilities: 62000000,
  } as FinancialStatement);

  // Source Field Mapping
  const sourceFields: SourceFieldMapping[] = [
    { name: 'Accounts Receivable', fieldKey: 'Receivables', category: 'Balance Sheet (Assets)', baselineVal: pri.Receivables, targetVal: cur.Receivables, cellRefBaseline: 'Financials!C10', cellRefTarget: 'Financials!D10', unit: '$' },
    { name: 'Revenue / Sales', fieldKey: 'Sales', category: 'Income Statement', baselineVal: pri.Sales, targetVal: cur.Sales, cellRefBaseline: 'Financials!C3', cellRefTarget: 'Financials!D3', unit: '$' },
    { name: 'Cost of Goods Sold (COGS)', fieldKey: 'COGS', category: 'Income Statement', baselineVal: pri.COGS, targetVal: cur.COGS, cellRefBaseline: 'Financials!C4', cellRefTarget: 'Financials!D4', unit: '$' },
    { name: 'Current Assets', fieldKey: 'CurrentAssets', category: 'Balance Sheet (Assets)', baselineVal: pri.CurrentAssets, targetVal: cur.CurrentAssets, cellRefBaseline: 'Financials!C9', cellRefTarget: 'Financials!D9', unit: '$' },
    { name: 'Property, Plant & Equipment', fieldKey: 'PPE', category: 'Balance Sheet (Assets)', baselineVal: pri.PPE, targetVal: cur.PPE, cellRefBaseline: 'Financials!C12', cellRefTarget: 'Financials!D12', unit: '$' },
    { name: 'Total Assets', fieldKey: 'TotalAssets', category: 'Balance Sheet (Assets)', baselineVal: pri.TotalAssets, targetVal: cur.TotalAssets, cellRefBaseline: 'Financials!C13', cellRefTarget: 'Financials!D13', unit: '$' },
    { name: 'Depreciation Expense', fieldKey: 'Depreciation', category: 'Operating Expenses', baselineVal: pri.Depreciation, targetVal: cur.Depreciation, cellRefBaseline: 'Financials!C14', cellRefTarget: 'Financials!D14', unit: '$' },
    { name: 'Selling, General & Admin (SGA)', fieldKey: 'SGA', category: 'Income Statement', baselineVal: pri.SGA, targetVal: cur.SGA, cellRefBaseline: 'Financials!C5', cellRefTarget: 'Financials!D5', unit: '$' },
    { name: 'Net Income', fieldKey: 'NetIncome', category: 'Income Statement', baselineVal: pri.NetIncome, targetVal: cur.NetIncome, cellRefBaseline: 'Financials!C7', cellRefTarget: 'Financials!D7', unit: '$' },
    { name: 'Cash Flow from Operations (CFO)', fieldKey: 'CFO', category: 'Cash Flow', baselineVal: pri.CFO, targetVal: cur.CFO, cellRefBaseline: 'Financials!C8', cellRefTarget: 'Financials!D8', unit: '$' },
    { name: 'Total Liabilities', fieldKey: 'TotalLiabilities', category: 'Balance Sheet (Liabilities)', baselineVal: pri.TotalLiabilities, targetVal: cur.TotalLiabilities, cellRefBaseline: 'Financials!C17', cellRefTarget: 'Financials!D17', unit: '$' },
  ];

  const recSalesCur = cur.Sales > 0 ? cur.Receivables / cur.Sales : 0;
  const recSalesPri = pri.Sales > 0 ? pri.Receivables / pri.Sales : 0;
  const gmCur = cur.Sales > 0 ? (cur.Sales - cur.COGS) / cur.Sales : 0;
  const gmPri = pri.Sales > 0 ? (pri.Sales - pri.COGS) / pri.Sales : 0;
  const nonCurrNonPPECur = cur.TotalAssets > 0 ? 1 - (cur.CurrentAssets + cur.PPE) / cur.TotalAssets : 0;
  const nonCurrNonPPEPri = pri.TotalAssets > 0 ? 1 - (pri.CurrentAssets + pri.PPE) / pri.TotalAssets : 0;
  const deprRateCur = cur.PPE + cur.Depreciation > 0 ? cur.Depreciation / (cur.PPE + cur.Depreciation) : 0;
  const deprRatePri = pri.PPE + pri.Depreciation > 0 ? pri.Depreciation / (pri.PPE + pri.Depreciation) : 0;
  const sgaRateCur = cur.Sales > 0 ? cur.SGA / cur.Sales : 0;
  const sgaRatePri = pri.Sales > 0 ? pri.SGA / pri.Sales : 0;
  const accruals = cur.NetIncome - cur.CFO;
  const levRateCur = cur.TotalAssets > 0 ? cur.TotalLiabilities / cur.TotalAssets : 0;
  const levRatePri = pri.TotalAssets > 0 ? pri.TotalLiabilities / pri.TotalAssets : 0;

  const calculationSteps: StepSubstitution[] = [
    {
      stepNumber: 1,
      stepName: 'Days Sales in Receivables Index (DSRI)',
      equationTemplate: 'DSRI = (Receivables_t / Sales_t) / (Receivables_{t-1} / Sales_{t-1})',
      substitutedEquation: `(${cur.Receivables.toLocaleString()} / ${cur.Sales.toLocaleString()}) / (${pri.Receivables.toLocaleString()} / ${pri.Sales.toLocaleString()}) = ${recSalesCur.toFixed(5)} / ${recSalesPri.toFixed(5)}`,
      evaluatedResult: result.variables.DSRI ? result.variables.DSRI.value.toFixed(3) : '1.000',
      subWeight: 0.920,
      contribution: result.variables.DSRI ? result.variables.DSRI.contribution : 0,
      diagnosticNote: result.variables.DSRI?.flagged ? 'Receivables growth materially outpacing sales indicates premature revenue booking.' : 'Receivables velocity aligned with sales.',
    },
    {
      stepNumber: 2,
      stepName: 'Gross Margin Index (GMI)',
      equationTemplate: 'GMI = [(Sales_{t-1} - COGS_{t-1}) / Sales_{t-1}] / [(Sales_t - COGS_t) / Sales_t]',
      substitutedEquation: `[(${pri.Sales.toLocaleString()} - ${pri.COGS.toLocaleString()}) / ${pri.Sales.toLocaleString()}] / [(${cur.Sales.toLocaleString()} - ${cur.COGS.toLocaleString()}) / ${cur.Sales.toLocaleString()}] = ${gmPri.toFixed(4)} / ${gmCur.toFixed(4)}`,
      evaluatedResult: result.variables.GMI ? result.variables.GMI.value.toFixed(3) : '1.000',
      subWeight: 0.528,
      contribution: result.variables.GMI ? result.variables.GMI.contribution : 0,
      diagnosticNote: result.variables.GMI?.flagged ? 'Gross margin eroded from prior period, creating pressure to inflate figures.' : 'Stable gross margin.',
    },
    {
      stepNumber: 3,
      stepName: 'Asset Quality Index (AQI)',
      equationTemplate: 'AQI = [1 - (CA_t + PPE_t) / TA_t] / [1 - (CA_{t-1} + PPE_{t-1}) / TA_{t-1}]',
      substitutedEquation: `[1 - (${cur.CurrentAssets.toLocaleString()} + ${cur.PPE.toLocaleString()}) / ${cur.TotalAssets.toLocaleString()}] / [1 - (${pri.CurrentAssets.toLocaleString()} + ${pri.PPE.toLocaleString()}) / ${pri.TotalAssets.toLocaleString()}] = ${Math.max(0, nonCurrNonPPECur).toFixed(4)} / ${Math.max(0.001, nonCurrNonPPEPri).toFixed(4)}`,
      evaluatedResult: result.variables.AQI ? result.variables.AQI.value.toFixed(3) : '1.000',
      subWeight: 0.404,
      contribution: result.variables.AQI ? result.variables.AQI.contribution : 0,
      diagnosticNote: 'Measures proportion of assets that are non-current and non-tangible (deferred costs capitalized into assets).',
    },
    {
      stepNumber: 4,
      stepName: 'Sales Growth Index (SGI)',
      equationTemplate: 'SGI = Sales_t / Sales_{t-1}',
      substitutedEquation: `${cur.Sales.toLocaleString()} / ${pri.Sales.toLocaleString()}`,
      evaluatedResult: result.variables.SGI ? result.variables.SGI.value.toFixed(3) : '1.000',
      subWeight: 0.892,
      contribution: result.variables.SGI ? result.variables.SGI.contribution : 0,
      diagnosticNote: 'Sales expansion ratio; high growth firms face greater earnings maintenance incentives.',
    },
    {
      stepNumber: 5,
      stepName: 'Depreciation Index (DEPI)',
      equationTemplate: 'DEPI = [Depr_{t-1} / (PPE_{t-1} + Depr_{t-1})] / [Depr_t / (PPE_t + Depr_t)]',
      substitutedEquation: `[${pri.Depreciation.toLocaleString()} / (${pri.PPE.toLocaleString()} + ${pri.Depreciation.toLocaleString()})] / [${cur.Depreciation.toLocaleString()} / (${cur.PPE.toLocaleString()} + ${cur.Depreciation.toLocaleString()})] = ${deprRatePri.toFixed(4)} / ${deprRateCur.toFixed(4)}`,
      evaluatedResult: result.variables.DEPI ? result.variables.DEPI.value.toFixed(3) : '1.000',
      subWeight: 0.115,
      contribution: result.variables.DEPI ? result.variables.DEPI.contribution : 0,
      diagnosticNote: 'Ratios > 1.0 indicate slowed depreciation schedules to boost reported net income.',
    },
    {
      stepNumber: 6,
      stepName: 'Sales General & Admin Expenses Index (SGAI)',
      equationTemplate: 'SGAI = (SGA_t / Sales_t) / (SGA_{t-1} / Sales_{t-1})',
      substitutedEquation: `(${cur.SGA.toLocaleString()} / ${cur.Sales.toLocaleString()}) / (${pri.SGA.toLocaleString()} / ${pri.Sales.toLocaleString()}) = ${sgaRateCur.toFixed(4)} / ${sgaRatePri.toFixed(4)}`,
      evaluatedResult: result.variables.SGAI ? result.variables.SGAI.value.toFixed(3) : '1.000',
      subWeight: -0.172,
      contribution: result.variables.SGAI ? result.variables.SGAI.contribution : 0,
      diagnosticNote: 'Tracks administrative overhead efficiency relative to sales volume.',
    },
    {
      stepNumber: 7,
      stepName: 'Total Accruals to Total Assets (TATA)',
      equationTemplate: 'TATA = (NetIncome_t - CFO_t) / TotalAssets_t',
      substitutedEquation: `(${cur.NetIncome.toLocaleString()} - ${cur.CFO.toLocaleString()}) / ${cur.TotalAssets.toLocaleString()} = ${accruals.toLocaleString()} / ${cur.TotalAssets.toLocaleString()}`,
      evaluatedResult: result.variables.TATA ? result.variables.TATA.value.toFixed(4) : '0.0000',
      subWeight: 4.679,
      contribution: result.variables.TATA ? result.variables.TATA.contribution : 0,
      diagnosticNote: 'The heaviest weighting factor (+4.679); positive values reflect paper accrual earnings unbacked by cash.',
    },
    {
      stepNumber: 8,
      stepName: 'Leverage Index (LVGI)',
      equationTemplate: 'LVGI = (TotalLiabilities_t / TA_t) / (TotalLiabilities_{t-1} / TA_{t-1})',
      substitutedEquation: `(${cur.TotalLiabilities.toLocaleString()} / ${cur.TotalAssets.toLocaleString()}) / (${pri.TotalLiabilities.toLocaleString()} / ${pri.TotalAssets.toLocaleString()}) = ${levRateCur.toFixed(4)} / ${levRatePri.toFixed(4)}`,
      evaluatedResult: result.variables.LVGI ? result.variables.LVGI.value.toFixed(3) : '1.000',
      subWeight: -0.327,
      contribution: result.variables.LVGI ? result.variables.LVGI.contribution : 0,
      diagnosticNote: 'Debt gearing change; higher liabilities relative to assets increase financial vulnerability.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner and Score Metric */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between space-y-4 transition-colors">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Beneish M-Score
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
                {formatNumber(result.mScore, 3)}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold border ${
                  isManipulator
                    ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/80'
                    : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80'
                }`}
              >
                {isManipulator ? (
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <span>{result.badgeText}</span>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Threshold Line: -2.22</span>
              <span className="font-mono font-medium">
                {isManipulator ? 'Diverged above limit' : 'Safe zone below limit'}
              </span>
            </div>
            {/* Visual Gauge */}
            <div className="relative h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
              <div className="w-[60%] bg-emerald-500/85" title="Safe Region (M <= -2.22)" />
              <div className="w-[40%] bg-rose-500/85" title="Manipulation Risk (M > -2.22)" />
              {/* Threshold line mark */}
              <div className="absolute left-[60%] top-0 bottom-0 w-0.5 bg-slate-900 dark:bg-white z-10" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-4.00 (Very Safe)</span>
              <span className="text-slate-900 dark:text-white font-bold">-2.22 (Threshold)</span>
              <span>0.00 (Severe Anomaly)</span>
            </div>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-800/80 pt-3">
            {result.takeaway}
          </p>
        </div>

        {/* Formula Explainer */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between space-y-3 transition-colors">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                8-Factor Probabilistic Model Specification
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Developed by Prof. Messod Beneish to mathematically capture the financial statement distortions
              commonly created prior to major corporate earnings restatements.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 font-mono text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed overflow-x-auto">
            M = -4.84 + 0.92·DSRI + 0.528·GMI + 0.404·AQI + 0.892·SGI + 0.115·DEPI - 0.172·SGAI + 4.679·TATA - 0.327·LVGI
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-3">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-300">Largest Positive Driver:</span>
              <p>TATA (weight: +4.679) heavily penalizes accruals exceeding operating cash flows.</p>
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-300">Revenue Quality Factor:</span>
              <p>DSRI (+0.92) captures premature or unbilled revenue acceleration.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Expandable Math & Source Data Trace Section */}
      <MathSourceTraceSection
        modelName="Beneish M-Score (Earnings Manipulation)"
        modelCode="M-Score"
        overallFormulaName="Beneish 8-Factor Probit Model"
        formulaLatexOrText="M = -4.840 + 0.920(DSRI) + 0.528(GMI) + 0.404(AQI) + 0.892(SGI) + 0.115(DEPI) - 0.172(SGAI) + 4.679(TATA) - 0.327(LVGI)"
        finalScoreLabel="Computed M-Score"
        finalScoreFormatted={`${formatNumber(result.mScore, 3)} (${isManipulator ? 'Manipulation Risk' : 'Safe Non-Manipulator'})`}
        targetPeriod={targetPeriod}
        baselinePeriod={baselinePeriod}
        sourceFields={sourceFields}
        calculationSteps={calculationSteps}
        auditNotes={[
          'The constant intercept of -4.840 establishes the baseline non-manipulator prior log-odds.',
          'Total Accruals to Total Assets (TATA) carries the heaviest positive weighting (4.679); companies with positive net income but weak cash flows will rapidly breach the -2.22 cutoff.',
          'Days Sales in Receivables Index (DSRI) weight (0.920) directly detects revenue acceleration or uncollected channel-stuffing.',
        ]}
        defaultExpanded={false}
        onJumpToLedger={onJumpToLedger}
      />

      {/* 8 Factors Breakdown Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none transition-colors">
        <div className="py-3 px-4 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Detailed 8-Variable Breakdown & Score Contributions
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Weighted Score Total: <span className="font-mono text-slate-900 dark:text-white font-bold">{formatNumber(result.mScore, 3)}</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-950/40">
                <th className="py-2.5 px-4">Factor</th>
                <th className="py-2.5 px-4">Metric Name</th>
                <th className="py-2.5 px-3 text-right">Computed Index</th>
                <th className="py-2.5 px-3 text-right">Model Weight</th>
                <th className="py-2.5 px-3 text-right">Score Contribution</th>
                <th className="py-2.5 px-4 min-w-[220px]">Benchmark & Anomaly Diagnostic</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {varsList.map((v) => {
                return (
                  <tr
                    key={v.code}
                    className={`transition-colors ${
                      v.flagged
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {v.code}
                    </td>
                    <td className="py-3 px-4 text-slate-900 dark:text-slate-200 font-medium">
                      <div>{v.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{v.formula}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatNumber(v.value, 3)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      {v.weight > 0 ? `+${v.weight.toFixed(3)}` : v.weight.toFixed(3)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono font-bold tabular-nums ${
                        v.contribution > 0.5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {v.contribution > 0 ? `+${v.contribution.toFixed(3)}` : v.contribution.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-xs leading-relaxed">
                      <div className="text-slate-800 dark:text-slate-300">{v.interpretation}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{v.benchmark}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.flagged
                            ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60'
                        }`}
                      >
                        {v.flagged ? 'FLAGGED' : 'NORMAL'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
