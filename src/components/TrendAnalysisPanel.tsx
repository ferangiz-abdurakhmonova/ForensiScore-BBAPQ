import React from 'react';
import { AuditEvaluation } from '../types/audit';
import { TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendAnalysisPanelProps {
  evaluations: AuditEvaluation[];
}

export const TrendAnalysisPanel: React.FC<TrendAnalysisPanelProps> = ({ evaluations }) => {
  // Sort evaluations by period
  const sortedEvaluations = [...evaluations].sort((a, b) => a.currentPeriod.localeCompare(b.currentPeriod));

  const data = sortedEvaluations.map((ev) => ({
    period: ev.currentPeriod,
    MScore: ev.beneish.mScore,
    ZScore: ev.altman.zScore,
    FScore: ev.piotroski.fScore,
  }));

  return (
    <div className="p-5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Historical Forensic Trends
        </h3>
      </div>
      
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Trend visualization for M-Score, Z-Score, and F-Score across {data.length} periods.
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="MScore" stroke="#8884d8" name="M-Score" />
            <Line type="monotone" dataKey="ZScore" stroke="#82ca9d" name="Z-Score" />
            <Line type="monotone" dataKey="FScore" stroke="#ffc658" name="F-Score" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedEvaluations.map((ev) => (
          <div key={ev.currentPeriod} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 mb-1">
              <Calendar className="w-3 h-3" />
              <span>FY{ev.currentPeriod}</span>
            </div>
            <div className="text-[10px] space-y-0.5">
              <div>M: {ev.beneish.mScore.toFixed(2)}</div>
              <div>Z: {ev.altman.zScore.toFixed(2)}</div>
              <div>F: {ev.piotroski.fScore}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
