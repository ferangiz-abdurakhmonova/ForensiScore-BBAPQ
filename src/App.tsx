import React, { useState, useMemo, useCallback } from 'react';
import { FinancialStatement, Transaction, BenfordDrillDownFilter } from './types/audit';
import {
  ACME_FINANCIALS_2023,
  ACME_FINANCIALS_2024,
  ACME_MULTI_PERIODS,
  generateBenfordTransactions,
  PRESET_SCENARIOS,
  PresetScenario,
} from './data/syntheticData';
import { synthesizeAuditEvaluation } from './utils/auditCalculations';
import { TopNav } from './components/TopNav';
import { PeriodSelector } from './components/PeriodSelector';
import { ExecutiveVerdictCard } from './components/ExecutiveVerdictCard';
import { SummaryResultsTable } from './components/SummaryResultsTable';
import { BenfordChartPanel } from './components/BenfordChartPanel';
import { BeneishPanel } from './components/BeneishPanel';
import { AltmanPanel } from './components/AltmanPanel';
import { PiotroskiPanel } from './components/PiotroskiPanel';
import { QoEPanel } from './components/QoEPanel';
import { ForensicRadarChart } from './components/ForensicRadarChart';
import { DataLedgerWorkbench } from './components/DataLedgerWorkbench';
import { ExportModal } from './components/ExportModal';
import { FeedbackModal } from './components/FeedbackModal';
import {
  BarChart3,
  Binary,
  Layers,
  Scale,
  DollarSign,
  Radar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function App() {
  // State for dataset
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    generateBenfordTransactions('ACME Inc', 250, 'benford')
  );
  const [financialStatements, setFinancialStatements] = useState<FinancialStatement[]>(() => ACME_MULTI_PERIODS);
  const [targetPeriod, setTargetPeriod] = useState<string>('2024');
  const [baselinePeriod, setBaselinePeriod] = useState<string>('2023');

  // UI state
  const [activePresetId, setActivePresetId] = useState<string>('acme_healthy');
  const [activeMethodTab, setActiveMethodTab] = useState<string>('radar');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Feature 1: Interactive Drill-Down State for Benford's Law Anomaly
  const [drillDownFilter, setDrillDownFilter] = useState<BenfordDrillDownFilter | null>(null);
  const [ledgerDefaultTab, setLedgerDefaultTab] = useState<'financials' | 'transactions'>('financials');

  // Available unique periods sorted chronologically
  const availablePeriods = useMemo(() => {
    const periods = Array.from(new Set(financialStatements.map((s) => s.Period)));
    return periods.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [financialStatements]);

  // Target (t) and Baseline (t-baseline) financial statements
  const currentFin = useMemo(() => {
    return (
      financialStatements.find((s) => s.Period === targetPeriod) ||
      financialStatements[financialStatements.length - 1]
    );
  }, [financialStatements, targetPeriod]);

  const priorFin = useMemo(() => {
    return (
      financialStatements.find((s) => s.Period === baselinePeriod) ||
      financialStatements[Math.max(0, financialStatements.length - 2)]
    );
  }, [financialStatements, baselinePeriod]);

  // Compute live evaluation across the 5 methodologies dynamically based on target and baseline
  const evaluation = useMemo(() => {
    return synthesizeAuditEvaluation(
      currentFin.Company,
      currentFin.Period,
      priorFin.Period,
      transactions,
      currentFin,
      priorFin
    );
  }, [transactions, currentFin, priorFin]);

  // Handler for "Generate Synthetic Data"
  const handleGenerateSynthetic = useCallback(() => {
    setIsGenerating(true);
    setActivePresetId('acme_healthy');
    setTimeout(() => {
      const newTxs = generateBenfordTransactions('ACME Inc', 250, 'benford');
      setTransactions(newTxs);
      setFinancialStatements(ACME_MULTI_PERIODS);
      setTargetPeriod('2024');
      setBaselinePeriod('2023');
      setIsGenerating(false);
    }, 250);
  }, []);

  const handleLoadPreset = useCallback((preset: PresetScenario) => {
    setActivePresetId(preset.id);
    const txs =
      preset.id === 'starlight_benford'
        ? generateBenfordTransactions('Starlight Trade', 280, 'anomalous')
        : preset.id === 'apex_manipulation'
        ? generateBenfordTransactions('Apex Dynamics', 200, 'benford')
        : preset.id === 'solv_distress'
        ? generateBenfordTransactions('Solvent Dynamics', 180, 'benford')
        : generateBenfordTransactions('ACME Inc', 250, 'benford');

    setTransactions(txs);
    const statements =
      preset.financialStatements && preset.financialStatements.length > 0
        ? [...preset.financialStatements]
        : [preset.fin2023, preset.fin2024];
    setFinancialStatements(statements);
    setTargetPeriod(preset.fin2024.Period);
    setBaselinePeriod(preset.fin2023.Period);
  }, []);

  const handleUpdateFinancialStatements = useCallback((statements: FinancialStatement[]) => {
    setActivePresetId('custom');
    setFinancialStatements(statements);
    if (statements.length >= 2) {
      const sorted = [...statements].sort((a, b) =>
        a.Period.localeCompare(b.Period, undefined, { numeric: true })
      );
      setTargetPeriod(sorted[sorted.length - 1].Period);
      setBaselinePeriod(sorted[sorted.length - 2].Period);
    } else if (statements.length === 1) {
      setTargetPeriod(statements[0].Period);
      setBaselinePeriod(statements[0].Period);
    }
  }, []);

  const handleSelectMethod = (methodId: string) => {
    setActiveMethodTab(methodId);
    // Smooth scroll down to breakdowns section
    const el = document.getElementById('methodology-breakdowns');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Feature 1: Interactive drill-down handler for Benford's Law anomaly
  const handleDrillDownBenford = useCallback(
    (explicitDigits?: number[]) => {
      // 1. Determine digits that contribute most to MAD or exceed anomaly threshold
      let digitsToFilter: number[] = [];

      if (explicitDigits && explicitDigits.length > 0) {
        digitsToFilter = explicitDigits;
      } else {
        // Find digits exceeding deviation threshold or sort by absolute diff
        const topAnomalies = evaluation.benford.digitStats
          .filter((d) => d.absDiffFreq >= 0.025)
          .sort((a, b) => b.absDiffFreq - a.absDiffFreq)
          .map((d) => d.digit);

        if (topAnomalies.length > 0) {
          digitsToFilter = topAnomalies;
        } else {
          // Fallback to top 2 highest deviations
          digitsToFilter = [...evaluation.benford.digitStats]
            .sort((a, b) => b.absDiffFreq - a.absDiffFreq)
            .slice(0, 2)
            .map((d) => d.digit);
        }
      }

      setDrillDownFilter({
        active: true,
        targetDigits: digitsToFilter,
        flagRoundAmounts: true,
        reason: `Flagged leading digits [${digitsToFilter.join(', ')}] with high empirical MAD deviation (${evaluation.benford.mad.toFixed(4)})`,
        sourceMAD: evaluation.benford.mad,
      });

      // Switch ledger to transactions tab
      setLedgerDefaultTab('transactions');

      // Scroll to data ledger workbench
      setTimeout(() => {
        const el = document.getElementById('data-ledger');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    },
    [evaluation.benford]
  );

  const handleClearDrillDownFilter = useCallback(() => {
    setDrillDownFilter(null);
  }, []);

  const handleJumpToLedger = useCallback((tab?: 'financials' | 'transactions') => {
    if (tab) {
      setLedgerDefaultTab(tab);
    }
    const el = document.getElementById('data-ledger');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const scrollToDataLedger = () => {
    handleJumpToLedger();
  };

  const methodsList = [
    {
      id: 'radar',
      name: '5-Method Radar',
      tag: 'Composite Spider',
      icon: Radar,
      badgeColor: evaluation.executiveSummary.verdictBadgeColor,
      summaryVal: `${Math.round((evaluation.executiveSummary.goodCount / 5) * 100)}% Safe`,
    },
    {
      id: 'benford',
      name: "Benford's Law",
      tag: 'Grouped Bars',
      icon: BarChart3,
      badgeColor: evaluation.benford.badgeColor,
      summaryVal: `MAD: ${evaluation.benford.mad.toFixed(4)}`,
    },
    {
      id: 'beneish',
      name: 'Beneish M-Score',
      tag: '8 Factors',
      icon: Layers,
      badgeColor: evaluation.beneish.badgeColor,
      summaryVal: `M: ${evaluation.beneish.mScore.toFixed(2)}`,
    },
    {
      id: 'altman',
      name: 'Altman Z-Score',
      tag: 'Dial Gauge',
      icon: Scale,
      badgeColor: evaluation.altman.badgeColor,
      summaryVal: `Z: ${evaluation.altman.zScore.toFixed(2)}`,
    },
    {
      id: 'piotroski',
      name: 'Piotroski F-Score',
      tag: 'Radial Dial',
      icon: Binary,
      badgeColor: evaluation.piotroski.badgeColor,
      summaryVal: `${evaluation.piotroski.fScore}/9`,
    },
    {
      id: 'qoe',
      name: 'Earnings Quality (QoE)',
      tag: 'Cash Backing',
      icon: DollarSign,
      badgeColor: evaluation.qoe.badgeColor,
      summaryVal: `${evaluation.qoe.qoeRatio.toFixed(2)}x`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 transition-colors">
      {/* Top Navigation */}
      <TopNav
        onGenerateSynthetic={handleGenerateSynthetic}
        onOpenDataLedger={scrollToDataLedger}
        onExportReport={() => setIsExportModalOpen(true)}
        isGenerating={isGenerating}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Section 0: Custom Multi-Period Selector */}
        <PeriodSelector
          availablePeriods={availablePeriods}
          targetPeriod={targetPeriod}
          baselinePeriod={baselinePeriod}
          activePresetId={activePresetId}
          onTargetPeriodChange={setTargetPeriod}
          onBaselinePeriodChange={setBaselinePeriod}
          onSelectPreset={handleLoadPreset}
        />

        {/* Section 1: Executive Verdict Card */}
        <ExecutiveVerdictCard
          summary={evaluation.executiveSummary}
          company={evaluation.company}
          currentPeriod={evaluation.currentPeriod}
          priorPeriod={evaluation.priorPeriod}
          onJumpToMethod={handleSelectMethod}
          onDrillDownBenford={handleDrillDownBenford}
        />

        {/* Section 2: Scorecard Matrix Table */}
        <SummaryResultsTable
          items={evaluation.executiveSummary.methodSummaries}
          selectedMethod={activeMethodTab}
          onSelectMethod={handleSelectMethod}
          onDrillDownBenford={handleDrillDownBenford}
        />

        {/* Section 3: Detailed Methodology Breakdown Engines */}
        <section id="methodology-breakdowns" className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Quantitative Forensic Breakdown Engines
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inspect variable weights, empirical formulas, regression parameters, and individual criterion checks.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 self-start sm:self-auto font-semibold">
              Active: {methodsList.find((m) => m.id === activeMethodTab)?.name}
            </span>
          </div>

          {/* Interactive Method Selection Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {methodsList.map((m) => {
              const isSelected = activeMethodTab === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMethodTab(m.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800/90 border-emerald-500 dark:border-emerald-500/70 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-white/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                      <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">{m.name}</span>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        m.badgeColor === 'green'
                          ? 'bg-emerald-500'
                          : m.badgeColor === 'yellow'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{m.tag}</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-bold tabular-nums">
                      {m.summaryVal}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Method Content Panel */}
          <div className="pt-2">
            {activeMethodTab === 'radar' && (
              <ForensicRadarChart evaluation={evaluation} />
            )}
            {activeMethodTab === 'benford' && (
              <BenfordChartPanel
                result={evaluation.benford}
                transactions={transactions}
                onDrillDownLedger={handleDrillDownBenford}
                onJumpToLedger={() => handleJumpToLedger('transactions')}
              />
            )}
            {activeMethodTab === 'beneish' && (
              <BeneishPanel
                result={evaluation.beneish}
                currentFin={currentFin}
                priorFin={priorFin}
                targetPeriod={targetPeriod}
                baselinePeriod={baselinePeriod}
                onJumpToLedger={() => handleJumpToLedger('financials')}
              />
            )}
            {activeMethodTab === 'altman' && (
              <AltmanPanel
                result={evaluation.altman}
                currentFin={currentFin}
                targetPeriod={targetPeriod}
                onJumpToLedger={() => handleJumpToLedger('financials')}
              />
            )}
            {activeMethodTab === 'piotroski' && (
              <PiotroskiPanel
                result={evaluation.piotroski}
                currentFin={currentFin}
                priorFin={priorFin}
                targetPeriod={targetPeriod}
                baselinePeriod={baselinePeriod}
                onJumpToLedger={() => handleJumpToLedger('financials')}
              />
            )}
            {activeMethodTab === 'qoe' && (
              <QoEPanel
                result={evaluation.qoe}
                currentFin={currentFin}
                priorFin={priorFin}
                targetPeriod={targetPeriod}
                baselinePeriod={baselinePeriod}
                onJumpToLedger={() => handleJumpToLedger('financials')}
              />
            )}
          </div>
        </section>

        {/* Section 4: Data Ledger & CSV Workbench */}
        <DataLedgerWorkbench
          transactions={transactions}
          financialStatements={financialStatements}
          currentFin={currentFin}
          priorFin={priorFin}
          targetPeriod={targetPeriod}
          baselinePeriod={baselinePeriod}
          activePresetId={activePresetId}
          activeDrillDownFilter={drillDownFilter}
          defaultTab={ledgerDefaultTab}
          onClearDrillDownFilter={handleClearDrillDownFilter}
          onSetDrillDownFilter={setDrillDownFilter}
          onUpdateTransactions={setTransactions}
          onUpdateFinancialStatements={handleUpdateFinancialStatements}
          onLoadPreset={(preset) => {
            handleLoadPreset(preset);
            // Clear or adapt drill-down when loading preset
            setDrillDownFilter(null);
            setLedgerDefaultTab('financials');
          }}
          onGenerateSynthetic={() => {
            handleGenerateSynthetic();
            setDrillDownFilter(null);
            setLedgerDefaultTab('financials');
          }}
        />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 mt-16 py-6 text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-400">ForensiScore BBAPQ</span>
            <span aria-hidden="true">·</span>
            <span>Integrated 5D Evaluation: Benford's Law (MAD) · Beneish M-Score · Altman Z-Score · Piotroski F-Score · Quality of Earnings (QoE)</span>
          </div>
          
          {/* Блок с лицензией, GitHub и Feedback */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Licensed under <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noreferrer" className="underline hover:text-emerald-500">AGPLv3</a></span>
            <span aria-hidden="true">·</span>
            <a href="https://github.com/ferangiz-abdurakhmonova/AuditScore-5.1" target="_blank" rel="noreferrer" className="underline hover:text-emerald-500">Source Code</a>
            <span aria-hidden="true">·</span>
            <button onClick={() => setIsFeedbackModalOpen(true)} className="underline hover:text-rose-500 font-semibold cursor-pointer">Report Issue</button>
          </div>
        </div>
      </footer>

      {/* Export Modal */}
      <ExportModal
        evaluation={evaluation}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
}
