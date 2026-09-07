import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { BodyWeightRecord } from '../../types';
import { Target, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface UniformityTrendChartProps {
  records: BodyWeightRecord[];
  selectedHouse: string;
}

export const UniformityTrendChart: React.FC<UniformityTrendChartProps> = ({
  records,
  selectedHouse
}) => {
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => a.week - b.week);
  }, [records]);

  const uniformityData = useMemo(() => {
    return sortedRecords.map(rec => ({
      id: rec.id,
      week: rec.week,
      label: `Wk ${rec.week}`,
      date: rec.date,
      uniformityPct: rec.uniformityPct || 85,
      sampleSize: rec.sampleSize || 100,
      notes: rec.notes
    }));
  }, [sortedRecords]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isOptimal = data.uniformityPct >= 85;
      const isAcceptable = data.uniformityPct >= 80 && data.uniformityPct < 85;

      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs min-w-[200px] space-y-1.5">
          <div className="flex justify-between border-b border-slate-700 pb-1 font-bold">
            <span>{data.label} ({data.date})</span>
            <span className={isOptimal ? 'text-emerald-400' : isAcceptable ? 'text-amber-400' : 'text-rose-400'}>
              {isOptimal ? 'Good Uniformity' : isAcceptable ? 'Moderate' : 'Poor Uniformity'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Uniformity (±10%):</span>
            <span className="font-bold text-lg text-emerald-400">{data.uniformityPct}%</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-300">
            <span>Sample Count:</span>
            <span>{data.sampleSize} birds</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
              <Target className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Flock Uniformity & CV% Trajectory ({selectedHouse})
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Percentage of sample birds falling within ±10% of flock average body weight (Target ≥ 85%).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200">
            Target: ≥ 85%
          </span>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold rounded-lg border border-amber-200">
            Action: &lt; 80%
          </span>
        </div>
      </div>

      {uniformityData.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          No uniformity records available for {selectedHouse}.
        </div>
      ) : (
        <div className="h-[280px] sm:h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={uniformityData} margin={{ top: 20, right: 15, left: -5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                unit="%" 
                domain={[60, 100]}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Shaded Target Area */}
              <ReferenceArea y1={85} y2={100} fill="#10b981" fillOpacity={0.06} />
              <ReferenceArea y1={0} y2={80} fill="#ef4444" fillOpacity={0.05} />

              <ReferenceLine y={85} stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: 'Target Benchmark (85%)', fill: '#10b981', fontSize: 10, position: 'right' }} />
              <ReferenceLine y={80} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: 'Warning Limit (80%)', fill: '#f59e0b', fontSize: 10, position: 'right' }} />

              <Line
                type="monotone"
                dataKey="uniformityPct"
                stroke="#0d9488"
                strokeWidth={3}
                name="Uniformity %"
                dot={{ r: 5, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#0d9488', stroke: '#ccfbf1', strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
