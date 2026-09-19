import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { BodyWeightRecord, StandardBodyWeightItem, Flock } from '../../types';
import { BASE_WEEKLY_STANDARDS } from './growthStandards';
import { Building2, Layers } from 'lucide-react';

interface MultiHouseComparisonChartProps {
  bodyWeights: BodyWeightRecord[];
  flocks: Flock[];
  customStandards?: StandardBodyWeightItem[];
}

const HOUSE_COLORS: Record<string, string> = {
  'House 1': '#0d9488', // teal
  'House 2': '#0284c7', // sky blue
  'House 3': '#8b5cf6', // purple
  'House 4': '#f59e0b', // amber
  'House 5': '#ec4899', // pink
  'House 6': '#10b981'  // emerald
};

export const MultiHouseComparisonChart: React.FC<MultiHouseComparisonChartProps> = ({
  bodyWeights,
  flocks,
  customStandards = []
}) => {
  const [selectedGender, setSelectedGender] = useState<'female' | 'male'>('female');

  // Find all distinct weeks present across all houses
  const weeks = useMemo(() => {
    const weekSet = new Set<number>();
    bodyWeights.forEach(b => weekSet.add(b.week));
    // Also include weeks from standards
    BASE_WEEKLY_STANDARDS.forEach(s => {
      if (s.ageWeek >= 20 && s.ageWeek <= 55) weekSet.add(s.ageWeek);
    });
    return Array.from(weekSet).sort((a, b) => a - b);
  }, [bodyWeights]);

  // Combine data per week across houses
  const chartData = useMemo(() => {
    return weeks.map(wk => {
      const baseStd = BASE_WEEKLY_STANDARDS.find(s => s.ageWeek === wk);
      const customStd = customStandards.find(s => s.ageWeek === wk);

      const stdTarget = selectedGender === 'female'
        ? (customStd?.femaleStandardGrams || baseStd?.femaleStandardGrams || null)
        : (customStd?.maleStandardGrams || baseStd?.maleStandardGrams || null);

      const row: Record<string, any> = {
        ageWeek: wk,
        label: `Wk ${wk}`,
        standardTarget: stdTarget
      };

      flocks.forEach(flock => {
        const record = bodyWeights.find(b => b.houseNumber === flock.houseNumber && b.week === wk);
        if (record) {
          row[flock.houseNumber] = selectedGender === 'female' ? record.femaleAvgWeightGrams : record.maleAvgWeightGrams;
        } else {
          row[flock.houseNumber] = null;
        }
      });

      return row;
    });
  }, [weeks, bodyWeights, flocks, customStandards, selectedGender]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
              <Building2 className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Multi-House Growth Curve Comparison
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-house growth trajectories overlaid against breed standard target curve.
          </p>
        </div>

        <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-xs font-bold text-slate-600">
          <button
            onClick={() => setSelectedGender('female')}
            className={`px-3 py-1.5 rounded-lg transition ${selectedGender === 'female' ? 'bg-rose-500 text-white shadow-xs' : 'hover:text-rose-700'}`}
          >
            Females (Layers)
          </button>
          <button
            onClick={() => setSelectedGender('male')}
            className={`px-3 py-1.5 rounded-lg transition ${selectedGender === 'male' ? 'bg-teal-600 text-white shadow-xs' : 'hover:text-teal-700'}`}
          >
            Males (Breeders)
          </button>
        </div>
      </div>

      <div className="h-[320px] sm:h-[360px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 15, left: -5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} unit="g" domain={['auto', 'auto']} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px'
              }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />

            {/* Standard Reference Target */}
            <Line
              type="monotone"
              dataKey="standardTarget"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="4 4"
              name="Breed Target Benchmark"
              dot={false}
            />

            {/* House Lines */}
            {flocks.map(flock => (
              <Line
                key={flock.id}
                type="monotone"
                dataKey={flock.houseNumber}
                name={`${flock.houseNumber} (${flock.breed})`}
                stroke={HOUSE_COLORS[flock.houseNumber] || '#64748b'}
                strokeWidth={2.5}
                connectNulls
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
