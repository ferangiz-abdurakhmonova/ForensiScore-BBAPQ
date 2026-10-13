import React, { useState, useRef, useMemo } from 'react';
import { FinancialStatement, Transaction, BenfordDrillDownFilter, BenfordResult } from '../types/audit';
import {
  PRESET_SCENARIOS,
  PresetScenario,
  financialsToCSV,
  parseFinancialsCSV,
  parseTransactionsCSV,
  transactionsToCSV,
} from '../data/syntheticData';
import { formatCurrency, formatNumber, formatPercent, extractFirstDigit } from '../utils/math';
import { evaluateBenford } from '../utils/auditCalculations';
import {
  Upload,
  Download,
  Sparkles,
  FileSpreadsheet,
  AlertCircle,
  Search,
  CheckCircle2,
  Table,
  ArrowUpDown,
  X,
  Filter,
  AlertOctagon,
  HelpCircle,
  Trash2,
} from 'lucide-react';

interface DataLedgerWorkbenchProps {
  transactions: Transaction[];
  financialStatements: FinancialStatement[];
  currentFin: FinancialStatement;
  priorFin: FinancialStatement;
  targetPeriod: string;
  baselinePeriod: string;
  activePresetId?: string;
  activeDrillDownFilter?: BenfordDrillDownFilter | null;
  anomalousDigits?: number[];
  benfordResult?: BenfordResult;
  defaultTab?: 'financials' | 'transactions';
  hasUploadedTransactions?: boolean;
  hasUploadedFinancials?: boolean;
  uploadedTransactionsFileName?: string | null;
  uploadedFinancialsFileName?: string | null;
  onClearTransactions?: () => void;
  onClearFinancials?: () => void;
  onClearCustomData?: (type: 'transactions' | 'financials') => void;
  onClearDrillDownFilter?: () => void;
  onSetDrillDownFilter?: (filter: BenfordDrillDownFilter | null) => void;
  onUpdateTransactions: (txs: Transaction[]) => void;
  onUpdateFinancialStatements: (statements: FinancialStatement[]) => void;
  onLoadPreset: (preset: PresetScenario) => void;
  onGenerateSynthetic: () => void;
  customCompanyName?: string;
  onCustomCompanyNameChange?: (name: string) => void;
}

export const DataLedgerWorkbench: React.FC<DataLedgerWorkbenchProps> = ({
  transactions,
  financialStatements,
  currentFin,
  priorFin,
  targetPeriod,
  baselinePeriod,
  activePresetId,
  activeDrillDownFilter,
  anomalousDigits,
  benfordResult,
  defaultTab = 'financials',
  hasUploadedTransactions,
  hasUploadedFinancials,
  uploadedTransactionsFileName,
  uploadedFinancialsFileName,
  onClearTransactions,
  onClearFinancials,
  onClearCustomData,
  onClearDrillDownFilter,
  onSetDrillDownFilter,
  onUpdateTransactions,
  onUpdateFinancialStatements,
  onLoadPreset,
  onGenerateSynthetic,
  customCompanyName = 'Custom Company',
  onCustomCompanyNameChange,
}) => {
  const [activeTab, setActiveTab] = useState<'financials' | 'transactions'>(defaultTab);
  const [txSearch, setTxSearch] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [internalTxFileName, setInternalTxFileName] = useState<string | null>(null);
  const [internalFinFileName, setInternalFinFileName] = useState<string | null>(null);

  const isTxUploaded = hasUploadedTransactions ?? (internalTxFileName !== null);
  const isFinUploaded = hasUploadedFinancials ?? (internalFinFileName !== null);
  const currentTxFileName = uploadedTransactionsFileName ?? internalTxFileName;
  const currentFinFileName = uploadedFinancialsFileName ?? internalFinFileName;

  // Sync tab if defaultTab changes (e.g. from drilldown trigger)
  React.useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  React.useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => {
        setUploadSuccess(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);

  const txFileInputRef = useRef<HTMLInputElement>(null);
  const finFileInputRef = useRef<HTMLInputElement>(null);

  // Helper to extract first leading digit
  const getLeadingDigit = (amount: number): number | null => {
    return extractFirstDigit(amount);
  };

  // Helper to check for excessive round amount
  const isExcessiveRoundAmount = (amount: number): boolean => {
    const abs = Math.abs(amount);
    return abs >= 100 && (abs % 500 === 0 || abs % 1000 === 0);
  };

  // Effective Benford analysis for the active transactions population
  const effectiveBenford = useMemo(() => {
    if (benfordResult) return benfordResult;
    return evaluateBenford(transactions);
  }, [benfordResult, transactions]);

  // Overall MAD risk threshold (0.0150 per Nigrini audit standard)
  const isCompanyMadAtRisk = effectiveBenford.mad >= 0.0150;

  // Identify why a transaction is flagged
  const getTransactionFlags = (tx: Transaction): string[] => {
    // If the overall company MAD is in the green/acceptable zone, all transactions are conforming
    if (!isCompanyMadAtRisk) {
      return [];
    }

    const flags: string[] = [];
    const firstDigit = getLeadingDigit(tx.Amount);
    
    // Condition 1: Digit frequency exceeds expected Benford frequency (diffFreq > 0)
    const stat = firstDigit !== null ? effectiveBenford.digitStats.find((s) => s.digit === firstDigit) : null;
    const exceedsExpected = stat ? stat.diffFreq > 0 : false;

    // Condition 2: Overall company MAD is in risk zone (isCompanyMadAtRisk === true)
    if (firstDigit !== null && exceedsExpected) {
      flags.push(`Non-conforming Leading Digit ${firstDigit}`);
    }

    if (isExcessiveRoundAmount(tx.Amount)) {
      flags.push('Excessive Round Amount');
    }

    return flags;
  };

  // Filter pipeline for transactions
  const PAGE_SIZE = 12;
  const filteredTxs = transactions.filter((t) => {
    const matchesSearch =
      t.Company.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.Date.includes(txSearch) ||
      t.Amount.toString().includes(txSearch);

    if (!matchesSearch) return false;

    // Apply active drill-down filter if enabled
    if (activeDrillDownFilter?.active) {
      const digit = getLeadingDigit(t.Amount);
      const isDigitFlagged = digit !== null && activeDrillDownFilter.targetDigits.includes(digit);
      const isRoundFlagged = activeDrillDownFilter.flagRoundAmounts && isExcessiveRoundAmount(t.Amount);

      return isDigitFlagged || isRoundFlagged;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredTxs.length / PAGE_SIZE) || 1;
  const paginatedTxs = filteredTxs.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE);

  // Clear custom data handler
  const handleClearCustomData = (type: 'transactions' | 'financials') => {
    if (type === 'transactions') {
      if (txFileInputRef.current) {
        txFileInputRef.current.value = '';
      }
      setInternalTxFileName(null);
      onClearTransactions?.();
      onClearCustomData?.('transactions');
      onCustomCompanyNameChange?.('Custom Company');
      setUploadErrors([]);
      setUploadSuccess('Uploaded transactions removed. Empty ledger state restored.');
    } else {
      if (finFileInputRef.current) {
        finFileInputRef.current.value = '';
      }
      setInternalFinFileName(null);
      onClearFinancials?.();
      onClearCustomData?.('financials');
      onCustomCompanyNameChange?.('Custom Company');
      setUploadErrors([]);
      setUploadSuccess('Uploaded financial statements removed. Empty statements state restored.');
    }
  };

  // File upload handlers
  const handleTransactionsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErrors([]);
    setUploadSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { data, errors } = parseTransactionsCSV(text);
      if (errors.length > 0 && data.length === 0) {
        setUploadErrors(errors);
      } else {
        if (errors.length > 0) setUploadErrors(errors);
        setInternalTxFileName(file.name);
        onUpdateTransactions(data);
        setUploadSuccess(`Successfully loaded ${data.length} transactions from "${file.name}".`);
      }
    };
    reader.readAsText(file);
    if (txFileInputRef.current) txFileInputRef.current.value = '';
  };

  const handleFinancialsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErrors([]);
    setUploadSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { data, errors } = parseFinancialsCSV(text);
      if (data.length < 2) {
        setUploadErrors([
          ...errors,
          'Multi-period analysis requires at least 2 financial statement periods. Found: ' +
            data.length,
        ]);
      } else {
        if (errors.length > 0) setUploadErrors(errors);
        // Sort chronologically if period is year
        data.sort((a, b) => a.Period.localeCompare(b.Period));
        setInternalFinFileName(file.name);
        onUpdateFinancialStatements(data);
        const last = data[data.length - 1];
        setUploadSuccess(
          `Successfully loaded ${data.length} periods for ${last.Company} (${data.map(d => 'FY' + d.Period).join(', ')}).`
        );
      }
    };
    reader.readAsText(file);
    if (finFileInputRef.current) finFileInputRef.current.value = '';
  };

  const handleDownloadSampleTxs = () => {
    const csv = transactionsToCSV(transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeCompany = (currentFin?.Company && currentFin.Company !== 'Entity' ? currentFin.Company : customCompanyName || 'Custom_Company').replace(/\s+/g, '_');
    link.setAttribute('download', `${safeCompany}_Transactions_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSampleFins = () => {
    const csv = financialsToCSV(financialStatements);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeCompany = (currentFin?.Company && currentFin.Company !== 'Entity' ? currentFin.Company : customCompanyName || 'Custom_Company').replace(/\s+/g, '_');
    link.setAttribute('download', `${safeCompany}_MultiPeriod_Financials_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Financial fields list for side-by-side view
  const financialFields: Array<{
    key: keyof Omit<FinancialStatement, 'Company' | 'Period'>;
    label: string;
    category: string;
  }> = [
    { key: 'Sales', label: 'Revenue / Sales', category: 'Income Statement' },
    { key: 'COGS', label: 'Cost of Goods Sold (COGS)', category: 'Income Statement' },
    { key: 'SGA', label: 'Selling, General & Admin (SGA)', category: 'Income Statement' },
    { key: 'EBIT', label: 'Operating Profit (EBIT)', category: 'Income Statement' },
    { key: 'NetIncome', label: 'Net Income', category: 'Income Statement' },
    { key: 'CFO', label: 'Cash Flow from Operations (CFO)', category: 'Cash Flow' },
    { key: 'CurrentAssets', label: 'Current Assets', category: 'Balance Sheet (Assets)' },
    { key: 'Receivables', label: 'Accounts Receivable', category: 'Balance Sheet (Assets)' },
    { key: 'Inventory', label: 'Inventory', category: 'Balance Sheet (Assets)' },
    { key: 'PPE', label: 'Property, Plant & Equip (PPE)', category: 'Balance Sheet (Assets)' },
    { key: 'TotalAssets', label: 'Total Assets', category: 'Balance Sheet (Assets)' },
    { key: 'Depreciation', label: 'Depreciation Expense', category: 'Operating Expenses' },
    { key: 'CurrentLiabilities', label: 'Current Liabilities', category: 'Balance Sheet (Liab & Eq)' },
    { key: 'LongTermDebt', label: 'Long Term Debt', category: 'Balance Sheet (Liab & Eq)' },
    { key: 'TotalLiabilities', label: 'Total Liabilities', category: 'Balance Sheet (Liab & Eq)' },
    { key: 'RetainedEarnings', label: 'Retained Earnings', category: 'Balance Sheet (Liab & Eq)' },
    { key: 'SharesOutstanding', label: 'Common Shares Outstanding', category: 'Equity' },
  ];

  return (
    <section id="data-ledger" className="w-full space-y-5 scroll-mt-24 relative z-10">
      {/* Top Banner and Quick Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Data Ledger & Audit Controls
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Generate synthetic test cases, upload custom company CSV files, or inspect raw figures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onGenerateSynthetic}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/70 border border-emerald-300 dark:border-emerald-700/60 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Generate Synthetic Data (Company Alpha)</span>
          </button>
        </div>
      </div>

      {/* Preset Scenario Quick Switcher */}
      <div className="space-y-2.5 relative z-30 isolate">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Quick Preset Scenarios (Forensic Stress-Testing)</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Click to auto-populate multi-year statements & transactions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 relative z-30">
          {PRESET_SCENARIOS.map((preset) => {
            const isCurrent = activePresetId === preset.id;
            const isCustom = preset.id === 'custom';
            const displayName = isCustom ? (customCompanyName || 'Custom Company') : preset.name;
            const displayCompany = isCustom ? (customCompanyName || 'Custom Company') : preset.company;

            return (
              <div
                key={preset.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onLoadPreset(preset);
                  setUploadSuccess(
                    isCustom
                      ? `Activated preset "${displayName}". Upload CSV datasets or edit company name.`
                      : `Applied preset scenario "${preset.name}". All 5 forensic engines recalculated.`
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onLoadPreset(preset);
                  }
                }}
                className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 select-none flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500/80 shadow-sm ring-1 ring-emerald-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400/60 dark:hover:border-emerald-500/40 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1.5">
                    {isCustom && isCurrent ? (
                      <div className="flex-1 mr-1" onClick={(e) => e.stopPropagation()}>
                        <label
                          htmlFor="custom-company-name-input"
                          className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1"
                        >
                          Company Name:
                        </label>
                        <input
                          id="custom-company-name-input"
                          type="text"
                          value={customCompanyName}
                          onChange={(e) => onCustomCompanyNameChange?.(e.target.value)}
                          placeholder="Custom Company"
                          className="w-full px-2 py-1 text-xs font-bold rounded-md border border-emerald-500 dark:border-emerald-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                        {displayName}
                      </div>
                    )}

                    {isCurrent ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white shrink-0 shadow-xs">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                        {preset.shortTag}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="font-mono text-[9px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[110px]" title={displayCompany}>
                    {displayCompany}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium group-hover:underline">
                    {isCurrent ? (isCustom ? 'Edit' : 'Active') : 'Load →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback Messages */}
      {uploadSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
          <button onClick={() => setUploadSuccess(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-white cursor-pointer" aria-label="Dismiss message">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {uploadErrors.length > 0 && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-200 space-y-1">
          <div className="flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>CSV Parsing Errors ({uploadErrors.length}):</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700 dark:text-rose-300/90 pl-1">
            {uploadErrors.slice(0, 4).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload and Download Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CSV 1: Transactions Upload */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between space-y-3 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">CSV 1: Transactions Ledger</span>
              <div className="flex items-center gap-2">
                {isTxUploaded && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="max-w-[130px] truncate">{currentTxFileName || 'Custom File'}</span>
                  </span>
                )}
                <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">{transactions.length} Records</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              Used for Benford&apos;s Law first-digit distribution. Required columns:{' '}
              <span className="font-mono text-slate-800 dark:text-slate-300">Company, Date, Amount</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
            <input
              type="file"
              ref={txFileInputRef}
              accept=".csv"
              onChange={handleTransactionsUpload}
              className="hidden"
            />
            <button
              onClick={() => txFileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>Upload Transactions CSV</span>
            </button>

            {isTxUploaded && (
              <button
                type="button"
                onClick={() => handleClearCustomData('transactions')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-200 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 transition-colors cursor-pointer shadow-xs"
                title="Clear uploaded transactions file and reset state"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Clear</span>
              </button>
            )}

            <button
              onClick={handleDownloadSampleTxs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Download Sample CSV</span>
            </button>
          </div>
        </div>

        {/* CSV 2: Multi-Period Financials Upload */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between space-y-3 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">CSV 2: Multi-Period Financial Statements</span>
              <div className="flex items-center gap-2">
                {isFinUploaded && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="max-w-[130px] truncate">{currentFinFileName || 'Custom File'}</span>
                  </span>
                )}
                <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                  {financialStatements.length > 0 && baselinePeriod !== 'N/A' && targetPeriod !== 'N/A'
                    ? `FY${baselinePeriod} vs FY${targetPeriod} (${financialStatements.length} Periods)`
                    : '0 Periods (Empty State)'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              Required for Beneish, Altman, Piotroski, and QoE models. Supports arbitrary multi-year statements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
            <input
              type="file"
              ref={finFileInputRef}
              accept=".csv"
              onChange={handleFinancialsUpload}
              className="hidden"
            />
            <button
              onClick={() => finFileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>Upload Financials CSV</span>
            </button>

            {isFinUploaded && (
              <button
                type="button"
                onClick={() => handleClearCustomData('financials')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-200 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 transition-colors cursor-pointer shadow-xs"
                title="Clear uploaded financial statements file and reset state"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Clear</span>
              </button>
            )}

            <button
              onClick={handleDownloadSampleFins}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Download Template CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs and Data Preview Section */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none transition-colors">
        {/* Tab Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('financials')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'financials'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {financialStatements.length > 0 && baselinePeriod !== 'N/A' && targetPeriod !== 'N/A'
                ? `Multi-Period Financial Statements (FY${baselinePeriod} vs FY${targetPeriod})`
                : 'Multi-Period Financial Statements (0 Periods)'}
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Raw Transactions Ledger ({transactions.length} rows)
            </button>
          </div>

          {activeTab === 'transactions' && (
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search amount or date..."
                value={txSearch}
                onChange={(e) => {
                  setTxSearch(e.target.value);
                  setTxPage(1);
                }}
                className="w-full pl-8 pr-3 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Financial Statements Comparative View */}
        {activeTab === 'financials' && (
          activePresetId === 'custom' && (!isFinUploaded || financialStatements.length === 0) ? (
            <div className="py-16 px-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No Custom Financial Statements Available
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  No multi-period financial statements have been uploaded for {customCompanyName || 'Custom Company'} yet. Upload a CSV file or download the template below to get started.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => finFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Financials CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSampleFins}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Download Template CSV</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-950/50">
                    <th className="py-2.5 px-4">Financial Statement Line Item</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4 text-right">FY{baselinePeriod}</th>
                    <th className="py-2.5 px-4 text-right">FY{targetPeriod}</th>
                    <th className="py-2.5 px-4 text-right">Change ($)</th>
                    <th className="py-2.5 px-4 text-right">Change (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
                  {financialFields.map((field) => {
                    const val23 = priorFin[field.key] ?? 0;
                    const val24 = currentFin[field.key] ?? 0;
                    const diff = val24 - val23;
                    const pct = val23 !== 0 ? diff / Math.abs(val23) : 0;
                    const isPositive = diff > 0;

                    return (
                      <tr key={field.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-800 dark:text-slate-300 transition-colors">
                        <td className="py-2.5 px-4 font-sans font-medium text-slate-900 dark:text-white">{field.label}</td>
                        <td className="py-2.5 px-4 font-sans text-slate-500 dark:text-slate-400 text-[11px]">{field.category}</td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-500 dark:text-slate-400">
                          {formatCurrency(val23)}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-900 dark:text-white font-semibold">
                          {formatCurrency(val24)}
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right tabular-nums font-semibold ${
                            isPositive ? 'text-emerald-600 dark:text-emerald-400' : diff < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right tabular-nums font-semibold ${
                            isPositive ? 'text-emerald-600 dark:text-emerald-400' : diff < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {diff > 0 ? `+${formatPercent(pct, 1)}` : formatPercent(pct, 1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Tab 2: Transactions Ledger View */}
        {activeTab === 'transactions' && (
          activePresetId === 'custom' && (!isTxUploaded || transactions.length === 0) ? (
            <div className="py-16 px-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No Custom Transactions Available
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  No transactions ledger has been uploaded for {customCompanyName || 'Custom Company'} yet. Upload a CSV file or download the template below to get started.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => txFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Transactions CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSampleTxs}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Download Sample CSV</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4">
            {/* Active Drill-Down Filter Notification Banner */}
            {activeDrillDownFilter?.active && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200">
                <div className="flex items-start sm:items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <span className="font-bold">Active Benford Forensic Filter: </span>
                    <span>
                      Isolating non-conforming leading digit ({activeDrillDownFilter.targetDigits.join(', ')})
                      {activeDrillDownFilter.flagRoundAmounts ? ' and excessive round vouchers ($500/$1,000 multiples)' : ''}
                      {activeDrillDownFilter.sourceMAD ? ` (Triggered by MAD ${activeDrillDownFilter.sourceMAD.toFixed(4)} >= 0.0150)` : ''}.
                    </span>
                    <span className="block sm:inline sm:ml-2 text-[11px] text-rose-700 dark:text-rose-300">
                      Found {filteredTxs.length} suspicious entries out of {transactions.length} total.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onClearDrillDownFilter?.()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/40 text-[11px] font-semibold transition-colors"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear Filter ({transactions.length} txs)</span>
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-950/50">
                    <th className="py-2.5 px-4">Transaction ID</th>
                    <th className="py-2.5 px-4">Entity</th>
                    <th className="py-2.5 px-4">Disbursement Date</th>
                    <th className="py-2.5 px-4 text-right">Amount ($)</th>
                    <th className="py-2.5 px-4 text-center">First Digit (d)</th>
                    <th className="py-2.5 px-4">Forensic Indicator / Reason Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
                  {paginatedTxs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400 font-sans">
                        No transactions match the current filter or search criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedTxs.map((tx) => {
                      const firstDigit = getLeadingDigit(tx.Amount);
                      const flags = getTransactionFlags(tx);
                      const isFlagged = flags.length > 0;

                      return (
                        <tr
                          key={tx.id}
                          className={`transition-colors ${
                            isFlagged
                              ? 'bg-rose-50/40 hover:bg-rose-50/80 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-slate-900 dark:text-slate-200'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-800 dark:text-slate-300'
                          }`}
                        >
                          <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{tx.id}</td>
                          <td className="py-2.5 px-4 font-sans text-slate-900 dark:text-white">{tx.Company}</td>
                          <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{tx.Date}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                            ${formatNumber(tx.Amount, 2)}
                          </td>
                          <td className="py-2.5 px-4 text-center tabular-nums">
                            <span
                              className={`inline-block font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                isCompanyMadAtRisk && firstDigit !== null && (effectiveBenford.digitStats.find((s) => s.digit === firstDigit)?.diffFreq ?? 0) > 0
                                  ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                                  : 'text-emerald-700 dark:text-emerald-400'
                              }`}
                            >
                              {firstDigit ?? '-'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-sans">
                            {flags.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {flags.map((flag, i) => (
                                  <span
                                    key={i}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                      flag.includes('Non-conforming')
                                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${flag.includes('Non-conforming') ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                    <span>{flag}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Conforming</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 rounded-b-lg">
              <div>
                Showing {(txPage - 1) * PAGE_SIZE + (filteredTxs.length > 0 ? 1 : 0)} to{' '}
                {Math.min(txPage * PAGE_SIZE, filteredTxs.length)} of {filteredTxs.length} entries
                {activeDrillDownFilter?.active && (
                  <span className="ml-2 font-semibold text-rose-600 dark:text-rose-400">
                    (Filtered from {transactions.length} total)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={txPage <= 1}
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-2 text-slate-800 dark:text-slate-300 font-mono">
                  {txPage} / {totalPages}
                </span>
                <button
                  disabled={txPage >= totalPages}
                  onClick={() => setTxPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
    </section>
  );
};
