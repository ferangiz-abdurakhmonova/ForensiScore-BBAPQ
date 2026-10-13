import React, { useState } from 'react';
import { AuditEvaluation } from '../types/audit';
import { X, Download, FileText, Printer, Check, Copy } from 'lucide-react';

interface ExportModalProps {
  evaluation: AuditEvaluation;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ evaluation, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadJSON = () => {
    const jsonString = JSON.stringify(evaluation, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${evaluation.company}_AuditScore_Forensic_Report.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSummaryCSV = () => {
    const headers = ['Methodology', 'Category', 'ComputedValue', 'BenchmarkRule', 'Status', 'BadgeText', 'Takeaway'];
    const rows = evaluation.executiveSummary.methodSummaries.map((m) => [
      `"${m.name}"`,
      `"${m.category}"`,
      `"${m.computedValueStr}"`,
      `"${m.benchmarkRule}"`,
      `"${m.status}"`,
      `"${m.badgeText}"`,
      `"${m.plainTakeaway.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${evaluation.company}_AuditScore_Summary_Matrix.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(evaluation, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-6 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Export Forensic Audit Package</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Download complete structured forensic models or summary tables for {evaluation.company}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* JSON Export */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Full Forensic Report (JSON)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Contains complete dataset, 8 Beneish factors, 9 Piotroski criteria, full Benford first-digit frequency arrays, and Altman coefficients.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleDownloadJSON}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON</span>
              </button>
              <button
                onClick={handleCopyJSON}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
                title="Copy JSON to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* CSV Export */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Summary Scorecard (CSV)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Clean spreadsheet matrix containing method names, computed values, benchmark rules, status badges, and forensic takeaways.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleDownloadSummaryCSV}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-900 dark:text-white bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Download CSV Matrix</span>
              </button>
            </div>
          </div>
        </div>

        {/* Print Option */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Printable Executive Audit Dossier</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Produces a formatted high-contrast print layout optimized for PDF generation or physical audit binders.
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap shadow-sm"
          >
            Print / Save PDF
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
