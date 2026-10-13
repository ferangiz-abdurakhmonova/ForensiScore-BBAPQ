import React from 'react';
import { ShieldCheck, Download, Sparkles, FileSpreadsheet, RefreshCw, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface TopNavProps {
  onGenerateSynthetic: () => void;
  onOpenDataLedger: () => void;
  onExportReport: () => void;
  isGenerating?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  onGenerateSynthetic,
  onOpenDataLedger,
  onExportReport,
  isGenerating,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              ForensiScore BBAPQ
              <span className="text-[9px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 px-1.5 py-0.5 rounded">v0.1.0-beta · Public Prototype</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Benford's Law (MAD) · Beneish M-Score · Altman Z-Score · Piotroski F-Score · Quality of Earnings (QoE)
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400 shrink-0">
          <a href="#executive-verdict" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
            Executive Verdict
          </a>
          <a href="#summary-table" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
            Scorecard Matrix
          </a>
          <a href="#methodology-breakdowns" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
            Evaluation Engines
          </a>
          <button
            onClick={onOpenDataLedger}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Data Ledger & CSVs</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions + Theme Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle dark/light theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Generate Synthetic Data Button */}
          <button
            onClick={onGenerateSynthetic}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700/50 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
            title="Preload ACME Inc synthetic transactions and multi-period statements"
          >
            {isGenerating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="hidden sm:inline">Generate Synthetic Data</span>
            <span className="sm:hidden">Synthetic</span>
          </button>

          {/* Export Results Button */}
          <button
            onClick={onExportReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span>Export Results</span>
          </button>
          
        </div>
      </div>
    </header>
  );
};
