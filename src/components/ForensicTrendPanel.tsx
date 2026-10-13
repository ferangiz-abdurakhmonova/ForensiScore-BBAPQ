import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FinancialStatement } from '../types/audit';
import { synthesizeAuditEvaluation } from '../utils/auditCalculations';

interface ForensicTrendPanelProps {
  financialStatements: FinancialStatement[];
}

export const ForensicTrendPanel: React.FC<ForensicTrendPanelProps> = ({
  financialStatements,
}) => {
  const trendData = useMemo(() => {
    // Group statements by period and calculate scores
    const periods = Array.from(new Set(financialStatements.map((s) => s.Period))).sort();
    
    return periods.map((period) => {
      // Find statement for period
      const statement = financialStatements.find(s => s.Period === period);
      // We need a baseline, let's just use the period before or first as baseline
      const baseline = financialStatements.find(s => s.Period === periods[0]) || statement!;
      
      const evaluation = synthesizeAuditEvaluation(statement!, baseline, []);
      
      return {
        period,
        mScore: evaluation.beneish.score,
        zScore: evaluation.altman.score,
        fScore: evaluation.piotroski.score,
      };
    });
  }, [financialStatements]);

  return (
    <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Historical Forensic Trends</h2>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="period" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
            />
            <Legend />
            <Line type="monotone" dataKey="mScore" name="Beneish M-Score" stroke="#ef4444" strokeWidth={2} />
            <Line type="monotone" dataKey="zScore" name="Altman Z-Score" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="fScore" name="Piotroski F-Score" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
