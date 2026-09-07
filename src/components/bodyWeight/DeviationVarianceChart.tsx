import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { BodyWeightRecord, StandardBodyWeightItem } from '../../types';
import { BASE_WEEKLY_STANDARDS, calculateDeviation } from './growthStandards';
import { AlertTriangle, CheckCircle2, ShieldAlert, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DeviationVarianceChartProps {
  records: BodyWeightRecord[];
  customStandards?: StandardBodyWeightItem[];
  selectedHouse: string;
}

export const DeviationVarianceChart: React.FC<DeviationVarianceChartProps> = ({
  records,
  customStandards = [],
  selectedHouse
}) => {
  const [metricMode, setMetricMode] = useState<'percent' | 'grams'>('percent');
  const [genderFilter, setGenderFilter] = useState<'female' | 'male'>('female');

  // Sorted records by week
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => a.week - b.week);
  }, [records]);

  // Compute deviation for each logged record
  const deviationData = useMemo(() => {
    return sortedRecords.map(rec => {
      const custom = customStandards.find(c => c.ageWeek === rec.week);
      const base = BASE_WEEKLY_STANDARDS.find(b => b.ageWeek === rec.week);

      const femaleStd = custom?.femaleStandardGrams || base?.femaleStandardGrams || 3500;
      const maleStd = custom?.maleStandardGrams || base?.maleStandardGrams || 4300;

      const femaleDev = calculateDeviation(rec.femaleAvgWeightGrams, femaleStd);
      const maleDev = calculateDeviation(rec.maleAvgWeightGrams, maleStd);

      const activeDev = genderFilter === 'female' ? femaleDev : maleDev;
      const actualWeight = genderFilter === 'female' ? rec.femaleAvgWeightGrams : rec.maleAvgWeightGrams;
      const stdWeight = genderFilter === 'female' ? femaleStd : maleStd;

      return {
        id: rec.id,
        week: rec.week,
        label: `Wk ${rec.week}`,
        date: rec.date,
        actualWeight,
        stdWeight,
        diffGrams: activeDev.diffGrams,
        pctDiff: activeDev.pctDiff,
        value: metricMode === 'percent' ? activeDev.pctDiff : activeDev.diffGrams,
        status: activeDev.status,
        statusLabel: activeDev.statusLabel,
        colorHex: activeDev.colorHex,
        badgeClass: activeDev.badgeClass,
        uniformityPct: rec.uniformityPct || 85,
        notes: rec.notes
      };
    });
  }, [sortedRecords, customStandards, genderFilter, metricMode]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs min-w-[220px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <span className="font-bold text-white text-sm">{data.label} ({data.date})</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${data.badgeClass}`}>
              {data.status === 'optimal' ? 'On Target' : data.status === 'mild_divergence' ? 'Mild Deviation' : 'Critical Deviation'}
            </span>
          </div>

          <div className="space-y-1 text-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-400">Actual Weight:</span>
              <span className="font-bold text-white">{data.actualWeight.toLocaleString()} g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Standard:</span>
              <span className="font-semibold text-slate-300">{data.stdWeight.toLocaleString()} g</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Variance Delta:</span>
              <span className={`font-bold ${data.diffGrams >= 0 ? (data.pctDiff > 5 ? 'text-rose-400' : 'text-emerald-400') : (data.pctDiff < -5 ? 'text-rose-400' : 'text-amber-400')}`}>
                {data.diffGrams > 0 ? '+' : ''}{data.diffGrams} g ({data.pctDiff > 0 ? '+' : ''}{data.pctDiff}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Flock Uniformity:</span>
              <span className="font-semibold text-teal-300">{data.uniformityPct}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Early Developmental Deviation & Variance Delta ({selectedHouse})
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time variance monitor detecting growth stalling or excessive flesh accretion before production impact.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Gender Filter */}
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-xs font-bold text-slate-600">
            <button
              onClick={() => setGenderFilter('female')}
              className={`px-3 py-1.5 rounded-lg transition ${genderFilter === 'female' ? 'bg-rose-500 text-white shadow-xs' : 'hover:text-rose-700'}`}
            >
              Females (Layers)
            </button>
            <button
              onClick={() => setGenderFilter('male')}
              className={`px-3 py-1.5 rounded-lg transition ${genderFilter === 'male' ? 'bg-teal-600 text-white shadow-xs' : 'hover:text-teal-700'}`}
            >
              Males (Cockerels)
            </button>
          </div>

          {/* Metric Toggle */}
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-xs font-bold text-slate-600">
            <button
              onClick={() => setMetricMode('percent')}
              className={`px-2.5 py-1.5 rounded-lg transition ${metricMode === 'percent' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              % Variance
            </button>
            <button
              onClick={() => setMetricMode('grams')}
              className={`px-2.5 py-1.5 rounded-lg transition ${metricMode === 'grams' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Δ Grams
            </button>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualizing Divergence */}
      {deviationData.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          No sample weighing records found for {selectedHouse}. Record weekly sample weights to view variance trajectory.
        </div>
      ) : (
        <div className="h-[280px] sm:h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deviationData} margin={{ top: 20, right: 15, left: -5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                unit={metricMode === 'percent' ? '%' : 'g'}
                domain={metricMode === 'percent' ? [-10, 10] : ['auto', 'auto']}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Zero baseline */}
              <ReferenceLine y={0} stroke="#334155" strokeWidth={1.5} />

              {/* Threshold lines for percent mode */}
              {metricMode === 'percent' && (
                <>
                  <ReferenceLine y={5} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '+5% Critical High', fill: '#f43f5e', fontSize: 10, position: 'right' }} />
                  <ReferenceLine y={2.5} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '+2.5% Optimal Upper', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                  <ReferenceLine y={-2.5} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '-2.5% Optimal Lower', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                  <ReferenceLine y={-5} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '-5% Critical Low', fill: '#f43f5e', fontSize: 10, position: 'right' }} />
                </>
              )}

              <Bar dataKey="value" name={metricMode === 'percent' ? 'Variance %' : 'Variance (g)'} radius={[4, 4, 0, 0]}>
                {deviationData.map((entry, index) => {
                  let fillColor = '#10b981'; // Green (optimal within ±2.5%)
                  if (Math.abs(entry.pctDiff) > 5.0) {
                    fillColor = '#ef4444'; // Red (critical divergence >5%)
                  } else if (Math.abs(entry.pctDiff) > 2.5) {
                    fillColor = '#f59e0b'; // Amber (mild divergence)
                  }
                  return <Cell key={`cell-${index}`} fill={fillColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Threshold Legend Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
          <span className="w-3.5 h-3.5 bg-emerald-500 rounded-md"></span>
          <div>
            <span className="font-bold text-emerald-950 block">Optimal Corridor (±2.5%)</span>
            <span className="text-[11px] text-emerald-700">Flock is on track; maintain current feed schedule.</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
          <span className="w-3.5 h-3.5 bg-amber-500 rounded-md"></span>
          <div>
            <span className="font-bold text-amber-950 block">Mild Drift (±2.5% to ±5%)</span>
            <span className="text-[11px] text-amber-700">Early drift detected. Minor feed adjustments advised.</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80">
          <span className="w-3.5 h-3.5 bg-rose-500 rounded-md"></span>
          <div>
            <span className="font-bold text-rose-950 block">Critical Divergence (&gt;±5%)</span>
            <span className="text-[11px] text-rose-700">High risk of lay delay, prolapse, or male infertility.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
