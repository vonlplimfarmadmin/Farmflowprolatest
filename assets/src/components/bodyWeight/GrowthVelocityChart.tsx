import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { BodyWeightRecord, StandardBodyWeightItem } from '../../types';
import { BASE_WEEKLY_STANDARDS } from './growthStandards';
import { Activity, Gauge } from 'lucide-react';

interface GrowthVelocityChartProps {
  records: BodyWeightRecord[];
  customStandards?: StandardBodyWeightItem[];
  selectedHouse: string;
}

export const GrowthVelocityChart: React.FC<GrowthVelocityChartProps> = ({
  records,
  selectedHouse
}) => {
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => a.week - b.week);
  }, [records]);

  // Build weekly velocity dataset
  const velocityData = useMemo(() => {
    return sortedRecords.map((rec, idx) => {
      const baseStd = BASE_WEEKLY_STANDARDS.find(b => b.ageWeek === rec.week);
      const femaleTargetGain = baseStd?.femaleTargetWeeklyGain || 50;
      const maleTargetGain = baseStd?.maleTargetWeeklyGain || 60;

      // Calculate actual gain from previous record if not explicitly stored
      let actualGainFemale = rec.weeklyGainFemale ?? 0;
      let actualGainMale = rec.weeklyGainMale ?? 0;

      if ((!actualGainFemale || actualGainFemale === 0) && idx > 0) {
        const prev = sortedRecords[idx - 1];
        actualGainFemale = rec.femaleAvgWeightGrams - prev.femaleAvgWeightGrams;
        actualGainMale = rec.maleAvgWeightGrams - prev.maleAvgWeightGrams;
      }

      return {
        id: rec.id,
        week: rec.week,
        label: `Wk ${rec.week}`,
        date: rec.date,
        actualGainFemale,
        targetGainFemale: femaleTargetGain,
        actualGainMale,
        targetGainMale: maleTargetGain,
        femaleGainDiff: actualGainFemale - femaleTargetGain,
        maleGainDiff: actualGainMale - maleTargetGain
      };
    });
  }, [sortedRecords]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs min-w-[210px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 font-bold">
            <span>{data.label} Velocity ({data.date})</span>
          </div>
          <div className="space-y-1.5">
            <div className="bg-rose-950/40 p-2 rounded-xl border border-rose-900/50">
              <div className="flex justify-between text-rose-300 font-bold">
                <span>Female Gain:</span>
                <span>+{data.actualGainFemale} g/wk</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Target Gain:</span>
                <span>+{data.targetGainFemale} g/wk</span>
              </div>
            </div>

            <div className="bg-teal-950/40 p-2 rounded-xl border border-teal-900/50">
              <div className="flex justify-between text-teal-300 font-bold">
                <span>Male Gain:</span>
                <span>+{data.actualGainMale} g/wk</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Target Gain:</span>
                <span>+{data.targetGainMale} g/wk</span>
              </div>
            </div>
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
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              <Activity className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Weekly Weight Gain Velocity & Growth Rate ({selectedHouse})
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Weekly incremental gain (g/week) vs standard growth acceleration targets across developmental cycles.
          </p>
        </div>
      </div>

      {velocityData.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          No sequential weighing records to compute weekly gain velocity.
        </div>
      ) : (
        <div className="h-[280px] sm:h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={velocityData} margin={{ top: 20, right: 15, left: -5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} unit="g" tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />

              <Bar dataKey="actualGainFemale" name="Female Actual Gain (g/wk)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actualGainMale" name="Male Actual Gain (g/wk)" fill="#0284c7" radius={[4, 4, 0, 0]} />

              <Line type="monotone" dataKey="targetGainFemale" stroke="#fb7185" strokeWidth={2} strokeDasharray="3 3" name="Female Target Gain" dot={false} />
              <Line type="monotone" dataKey="targetGainMale" stroke="#38bdf8" strokeWidth={2} strokeDasharray="3 3" name="Male Target Gain" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
