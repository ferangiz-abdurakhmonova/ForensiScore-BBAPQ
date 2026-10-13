import React from 'react';
import { AltmanResult, FinancialStatement } from '../types/audit';
import { formatNumber, formatCurrency } from '../utils/math';
import { ShieldCheck, AlertTriangle, AlertOctagon, Scale } from 'lucide-react';
import { AltmanGauge } from './AltmanGauge';
import { MathSourceTraceSection, SourceFieldMapping, StepSubstitution } from './MathSourceTraceSection';

interface AltmanPanelProps {
  result: AltmanResult;
  currentFin?: FinancialStatement;
  targetPeriod?: string;
  onJumpToLedger?: () => void;
}

export const AltmanPanel: React.FC<AltmanPanelProps> = ({
  result,
  currentFin,
  targetPeriod = '2024',
  onJumpToLedger,
}) => {
  const isSafe = result.status === 'GOOD';
  const isGrey = result.status === 'WARNING';
  const isDistress = result.status === 'BAD';

  const varsList = Object.values(result.variables);

  const cur = currentFin || ({
    CurrentAssets: 64500000,
    CurrentLiabilities: 28000000,
    TotalAssets: 152000000,
    RetainedEarnings: 38000000,
    EBIT: 22000000,
    TotalLiabilities: 68000000,
  } as FinancialStatement);

  const workingCapital = cur.CurrentAssets - cur.CurrentLiabilities;
  const bookEquity = cur.TotalAssets - cur.TotalLiabilities;

  const sourceFields: SourceFieldMapping[] = [
    { name: 'Current Assets', fieldKey: 'CurrentAssets', category: 'Balance Sheet (Assets)', targetVal: cur.CurrentAssets, cellRefTarget: 'Financials!D9', unit: '$' },
    { name: 'Current Liabilities', fieldKey: 'CurrentLiabilities', category: 'Balance Sheet (Liabilities)', targetVal: cur.CurrentLiabilities, cellRefTarget: 'Financials!D15', unit: '$' },
    { name: 'Total Assets', fieldKey: 'TotalAssets', category: 'Balance Sheet (Assets)', targetVal: cur.TotalAssets, cellRefTarget: 'Financials!D13', unit: '$' },
    { name: 'Retained Earnings', fieldKey: 'RetainedEarnings', category: 'Balance Sheet (Equity)', targetVal: cur.RetainedEarnings, cellRefTarget: 'Financials!D18', unit: '$' },
    { name: 'Operating Income (EBIT)', fieldKey: 'EBIT', category: 'Income Statement', targetVal: cur.EBIT, cellRefTarget: 'Financials!D6', unit: '$' },
    { name: 'Total Liabilities', fieldKey: 'TotalLiabilities', category: 'Balance Sheet (Liabilities)', targetVal: cur.TotalLiabilities, cellRefTarget: 'Financials!D17', unit: '$' },
    { name: 'Book Equity (TA - TL)', fieldKey: 'Equity', category: 'Derived Equity', targetVal: bookEquity, cellRefTarget: 'Derived(D13-D17)', unit: '$' },
    { name: 'Working Capital (CA - CL)', fieldKey: 'WorkingCapital', category: 'Derived Liquidity', targetVal: workingCapital, cellRefTarget: 'Derived(D9-D15)', unit: '$' },
  ];

  const calculationSteps: StepSubstitution[] = [
    {
      stepNumber: 1,
      stepName: 'Liquidity Ratio (X1: Working Capital / Total Assets)',
      equationTemplate: 'X1 = (CurrentAssets - CurrentLiabilities) / TotalAssets',
      substitutedEquation: `(${cur.CurrentAssets.toLocaleString()} - ${cur.CurrentLiabilities.toLocaleString()}) / ${cur.TotalAssets.toLocaleString()} = ${workingCapital.toLocaleString()} / ${cur.TotalAssets.toLocaleString()}`,
      evaluatedResult: result.variables.X1.value.toFixed(4),
      subWeight: 6.56,
      contribution: result.variables.X1.contribution,
      diagnosticNote: 'Largest multiplier in 4-variable model (6.56); directly tests cushion against short-term payment defaults.',
    },
    {
      stepNumber: 2,
      stepName: 'Cumulative Profitability Ratio (X2: Retained Earnings / Total Assets)',
      equationTemplate: 'X2 = RetainedEarnings / TotalAssets',
      substitutedEquation: `${cur.RetainedEarnings.toLocaleString()} / ${cur.TotalAssets.toLocaleString()}`,
      evaluatedResult: result.variables.X2.value.toFixed(4),
      subWeight: 3.26,
      contribution: result.variables.X2.contribution,
      diagnosticNote: 'Measures historical cumulative profitability relative to asset size.',
    },
    {
      stepNumber: 3,
      stepName: 'Operating Productivity Ratio (X3: EBIT / Total Assets)',
      equationTemplate: 'X3 = EBIT / TotalAssets',
      substitutedEquation: `${cur.EBIT.toLocaleString()} / ${cur.TotalAssets.toLocaleString()}`,
      evaluatedResult: result.variables.X3.value.toFixed(4),
      subWeight: 6.72,
      contribution: result.variables.X3.contribution,
      diagnosticNote: 'Capital productivity ratio unburdened by tax regime or interest leverage expenses.',
    },
    {
      stepNumber: 4,
      stepName: 'Solvency Cushion Ratio (X4: Book Equity / Total Liabilities)',
      equationTemplate: 'X4 = (TotalAssets - TotalLiabilities) / TotalLiabilities',
      substitutedEquation: `(${cur.TotalAssets.toLocaleString()} - ${cur.TotalLiabilities.toLocaleString()}) / ${cur.TotalLiabilities.toLocaleString()} = ${bookEquity.toLocaleString()} / ${cur.TotalLiabilities.toLocaleString()}`,
      evaluatedResult: result.variables.X4.value.toFixed(4),
      subWeight: 1.05,
      contribution: result.variables.X4.contribution,
      diagnosticNote: 'Capital structure safety margin before liabilities exceed asset values.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner and Score Metric */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between space-y-4 transition-colors">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Altman Z-Score (Non-Manufacturing 4-Factor)
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
                {formatNumber(result.zScore, 2)}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold border ${
                  result.badgeColor === 'gray'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    : isSafe
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80'
                    : isGrey
                    ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/80'
                    : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/80'
                }`}
              >
                {result.badgeColor === 'gray' && <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />}
                {result.badgeColor !== 'gray' && isSafe && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                {result.badgeColor !== 'gray' && isGrey && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                {result.badgeColor !== 'gray' && isDistress && <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />}
                <span>{result.badgeText}</span>
              </span>
            </div>
          </div>

          {/* Interactive Semicircular Gauge Visualizer */}
          <AltmanGauge
            zScore={result.zScore}
            status={result.status}
            zoneName={result.zoneName}
            badgeColor={result.badgeColor}
          />

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-800/80 pt-3">
            {result.takeaway}
          </p>
        </div>

        {/* Formula Explainer */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between space-y-3 transition-colors">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                Non-Manufacturing 4-Factor Insolvency Specification
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Edward Altman&apos;s revised model (1983/2000) tailored for service, technology, and non-manufacturing
              enterprises by removing asset turnover sensitivity (X5) to prevent bias against service entities.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 font-mono text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed overflow-x-auto">
            Z = 6.56·X₁ + 3.26·X₂ + 6.72·X₃ + 1.05·X₄
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-3">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-300">Dominant Factor:</span>
              <p>X3 (EBIT / Assets, weight: 6.72) evaluates core operating horsepower independent of leverage.</p>
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-300">Liquidity Cushion:</span>
              <p>X1 (Working Capital / Assets, weight: 6.56) penalizes short-term liquidity shortfalls.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Expandable Math & Source Data Trace Section */}
      <MathSourceTraceSection
        modelName="Altman Z-Score (Non-Manufacturing Insolvency)"
        modelCode="Altman Z-Score"
        overallFormulaName="Altman 4-Factor Revised Z'' Model (1983/2000)"
        formulaLatexOrText="Z'' = 6.56(X₁) + 3.26(X₂) + 6.72(X₃) + 1.05(X₄) = 6.56(WC/TA) + 3.26(RE/TA) + 6.72(EBIT/TA) + 1.05(BookEquity/TL)"
        finalScoreLabel="Computed Z-Score"
        finalScoreFormatted={`${formatNumber(result.zScore, 2)} (${result.zoneName})`}
        targetPeriod={targetPeriod}
        sourceFields={sourceFields}
        calculationSteps={calculationSteps}
        auditNotes={[
          'Calibrated for non-manufacturing service and tech businesses to eliminate the capital intensity distortion of asset turnover.',
          'Safe Zone: Z > 2.60 (Minimal default risk). Grey Zone: 1.10 <= Z <= 2.60 (Indeterminate / Vulnerable). Distress Zone: Z < 1.10 (High probability of insolvency).',
          'Working capital is computed as Current Assets minus Current Liabilities ($' + workingCapital.toLocaleString() + ').',
        ]}
        defaultExpanded={false}
        onJumpToLedger={onJumpToLedger}
      />

      {/* Factors Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none transition-colors">
        <div className="py-3 px-4 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Factor Components & Contribution to Bankruptcy Predictor
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Total Z-Score: <span className="font-mono text-slate-900 dark:text-white font-bold">{formatNumber(result.zScore, 2)}</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-950/40">
                <th className="py-2.5 px-4">Factor</th>
                <th className="py-2.5 px-4">Component Name</th>
                <th className="py-2.5 px-3 text-right">Computed Value</th>
                <th className="py-2.5 px-3 text-right">Weight</th>
                <th className="py-2.5 px-3 text-right">Score Contribution</th>
                <th className="py-2.5 px-4 min-w-[240px]">Economic Definition & Balance Sheet Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {varsList.map((v) => (
                <tr key={v.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-800 dark:text-slate-300 transition-colors">
                  <td className="py-3 px-4 font-bold font-mono text-emerald-600 dark:text-emerald-400">{v.code}</td>
                  <td className="py-3 px-4 text-slate-900 dark:text-slate-200 font-medium">
                    <div>{v.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{v.formula}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatNumber(v.value, 3)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {v.weight.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-300 tabular-nums">
                    +{formatNumber(v.contribution, 2)}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {v.meaning}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
