import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Brush
} from 'recharts';
import { BodyWeightRecord, StandardBodyWeightItem } from '../../types';
import { BASE_WEEKLY_STANDARDS, calculateDeviation } from './growthStandards';
import { TrendingUp, ShieldAlert, Sparkles, Filter, Eye, Layers } from 'lucide-react';

interface GrowthCurveChartProps {
  records: BodyWeightRecord[];
  customStandards?: StandardBodyWeightItem[];
  selectedHouse: string;
}

export const GrowthCurveChart: React.FC<GrowthCurveChartProps> = ({
  records,
  customStandards = [],
  selectedHouse
}) => {
  const [genderFilter, setGenderFilter] = useState<'both' | 'female' | 'male'>('both');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'rearing' | 'prelay' | 'peak' | 'postpeak'>('all');
  const [showToleranceBands, setShowToleranceBands] = useState(true);
  const [showBrush, setShowBrush] = useState(false);

  // Map of actual records by week
  const recordsByWeek = useMemo(() => {
    const map = new Map<number, BodyWeightRecord>();
    records.forEach(r => {
      map.set(r.week, r);
    });
    return map;
  }, [records]);

  // Combine standard curve with actual records
  const chartData = useMemo(() => {
    return BASE_WEEKLY_STANDARDS.map(base => {
      // Check if custom standard exists
      const custom = customStandards.find(c => c.ageWeek === base.ageWeek);
      const femaleStd = custom?.femaleStandardGrams || base.femaleStandardGrams;
      const maleStd = custom?.maleStandardGrams || base.maleStandardGrams;
      
      const femaleTolMin = custom?.toleranceMinGrams || Math.round(femaleStd * 0.95);
      const femaleTolMax = custom?.toleranceMaxGrams || Math.round(femaleStd * 1.05);
      const maleTolMin = Math.round(maleStd * 0.95);
      const maleTolMax = Math.round(maleStd * 1.05);

      const actual = recordsByWeek.get(base.ageWeek);

      const femaleActual = actual?.femaleAvgWeightGrams ?? null;
      const maleActual = actual?.maleAvgWeightGrams ?? null;

      const femaleDev = femaleActual !== null ? calculateDeviation(femaleActual, femaleStd) : null;
      const maleDev = maleActual !== null ? calculateDeviation(maleActual, maleStd) : null;

      return {
        ageWeek: base.ageWeek,
        label: `Wk ${base.ageWeek}`,
        phase: base.phase,
        femaleStd,
        maleStd,
        femaleTolMin,
        femaleTolMax,
        femaleToleranceRange: [femaleTolMin, femaleTolMax],
        maleTolMin,
        maleTolMax,
        maleToleranceRange: [maleTolMin, maleTolMax],
        femaleActual,
        maleActual,
        femaleDiff: femaleDev ? femaleDev.diffGrams : null,
        femalePctDiff: femaleDev ? femaleDev.pctDiff : null,
        maleDiff: maleDev ? maleDev.diffGrams : null,
        malePctDiff: maleDev ? maleDev.pctDiff : null,
        uniformityPct: actual?.uniformityPct ?? null,
        sampleSize: actual?.sampleSize ?? null,
        date: actual?.date ?? null,
        notes: actual?.notes ?? null
      };
    }).filter(item => {
      if (phaseFilter === 'all') return true;
      if (phaseFilter === 'rearing') return item.ageWeek <= 18;
      if (phaseFilter === 'prelay') return item.ageWeek >= 19 && item.ageWeek <= 24;
      if (phaseFilter === 'peak') return item.ageWeek >= 25 && item.ageWeek <= 40;
      if (phaseFilter === 'postpeak') return item.ageWeek >= 41;
      return true;
    });
  }, [customStandards, recordsByWeek, phaseFilter]);

  // Custom high contrast tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const hasActual = data.femaleActual !== null || data.maleActual !== null;

      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 text-xs min-w-[240px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <div>
              <span className="font-bold text-sm text-white">{data.label}</span>
              <span className="text-[10px] text-slate-400 block">{data.phase} Phase</span>
            </div>
            {data.date && (
              <span className="text-[10px] font-mono bg-slate-800 text-teal-300 px-2 py-0.5 rounded-md border border-slate-700">
                {data.date}
              </span>
            )}
          </div>

          {/* Female Specs */}
          {(genderFilter === 'both' || genderFilter === 'female') && (
            <div className="bg-rose-950/40 p-2 rounded-xl border border-rose-900/50 space-y-1">
              <div className="flex items-center justify-between text-rose-300 font-bold">
                <span>Female Target:</span>
                <span>{data.femaleStd.toLocaleString()} g</span>
              </div>
              {data.femaleActual !== null ? (
                <div className="flex items-center justify-between font-bold">
                  <span className="text-white">Female Actual:</span>
                  <span className="text-rose-400 text-sm">{data.femaleActual.toLocaleString()} g</span>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 italic">No sample logged for this week</div>
              )}
              {data.femaleDiff !== null && (
                <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-rose-900/40">
                  <span className="text-slate-400">Deviation:</span>
                  <span className={`font-bold ${data.femaleDiff >= 0 ? (data.femalePctDiff > 5 ? 'text-rose-400' : 'text-emerald-400') : (data.femalePctDiff < -5 ? 'text-rose-400' : 'text-amber-400')}`}>
                    {data.femaleDiff > 0 ? '+' : ''}{data.femaleDiff} g ({data.femalePctDiff > 0 ? '+' : ''}{data.femalePctDiff}%)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Male Specs */}
          {(genderFilter === 'both' || genderFilter === 'male') && (
            <div className="bg-teal-950/40 p-2 rounded-xl border border-teal-900/50 space-y-1">
              <div className="flex items-center justify-between text-teal-300 font-bold">
                <span>Male Target:</span>
                <span>{data.maleStd.toLocaleString()} g</span>
              </div>
              {data.maleActual !== null ? (
                <div className="flex items-center justify-between font-bold">
                  <span className="text-white">Male Actual:</span>
                  <span className="text-teal-400 text-sm">{data.maleActual.toLocaleString()} g</span>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 italic">No sample logged for this week</div>
              )}
              {data.maleDiff !== null && (
                <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-teal-900/40">
                  <span className="text-slate-400">Deviation:</span>
                  <span className={`font-bold ${data.maleDiff >= 0 ? (data.malePctDiff > 5 ? 'text-rose-400' : 'text-emerald-400') : (data.malePctDiff < -5 ? 'text-rose-400' : 'text-amber-400')}`}>
                    {data.maleDiff > 0 ? '+' : ''}{data.maleDiff} g ({data.malePctDiff > 0 ? '+' : ''}{data.malePctDiff}%)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Uniformity & Sample Count */}
          {hasActual && (
            <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1 border-t border-slate-800">
              {data.uniformityPct && (
                <span>Uniformity: <strong className="text-emerald-400">{data.uniformityPct}%</strong></span>
              )}
              {data.sampleSize && (
                <span>Sample: <strong className="text-slate-200">{data.sampleSize} birds</strong></span>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-100">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Flock Growth Curves vs Breed Target Standard ({selectedHouse})
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous target standard trajectory with ±5% acceptable tolerance corridor & actual weekly sample plots.
          </p>
        </div>

        {/* Filter Badges & View Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Gender Filter Buttons */}
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-xs font-bold text-slate-600">
            <button
              onClick={() => setGenderFilter('both')}
              className={`px-2.5 py-1.5 rounded-lg transition ${genderFilter === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Both Sexes
            </button>
            <button
              onClick={() => setGenderFilter('female')}
              className={`px-2.5 py-1.5 rounded-lg transition ${genderFilter === 'female' ? 'bg-rose-500 text-white shadow-xs' : 'hover:text-rose-700'}`}
            >
              Females
            </button>
            <button
              onClick={() => setGenderFilter('male')}
              className={`px-2.5 py-1.5 rounded-lg transition ${genderFilter === 'male' ? 'bg-teal-600 text-white shadow-xs' : 'hover:text-teal-700'}`}
            >
              Males
            </button>
          </div>

          {/* Phase Filter */}
          <select
            value={phaseFilter}
            onChange={(e: any) => setPhaseFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-teal-500 outline-hidden"
          >
            <option value="all">All Phases (Wk 1-65)</option>
            <option value="rearing">Rearing (Wk 1-18)</option>
            <option value="prelay">Pre-Lay Transition (Wk 19-24)</option>
            <option value="peak">Peak Lay (Wk 25-40)</option>
            <option value="postpeak">Post-Peak (Wk 41-65)</option>
          </select>

          {/* Tolerance Band Toggle */}
          <button
            onClick={() => setShowToleranceBands(!showToleranceBands)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
              showToleranceBands 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
            title="Toggle ±5% Tolerance Envelope"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">±5% Corridor</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Growth Curve (Recharts) */}
      <div className="h-[340px] sm:h-[380px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 5 }}>
            <defs>
              {/* Female Tolerance Corridor Fill */}
              <linearGradient id="femaleCorridorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
              </linearGradient>

              {/* Male Tolerance Corridor Fill */}
              <linearGradient id="maleCorridorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            
            <XAxis 
              dataKey="label" 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#e2e8f0' }}
            />
            
            <YAxis 
              stroke="#94a3b8" 
              fontSize={11} 
              unit="g" 
              domain={['auto', 'auto']}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
            />

            {/* Reference milestone lines */}
            {phaseFilter === 'all' && (
              <>
                <ReferenceLine x="Wk 18" stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Photostimulation', fill: '#64748b', fontSize: 10, position: 'insideTopLeft' }} />
                <ReferenceLine x="Wk 24" stroke="#e11d48" strokeDasharray="3 3" label={{ value: 'Onset of Lay (5%)', fill: '#e11d48', fontSize: 10, position: 'insideTopLeft' }} />
                <ReferenceLine x="Wk 31" stroke="#0d9488" strokeDasharray="3 3" label={{ value: 'Peak Production', fill: '#0d9488', fontSize: 10, position: 'insideTopLeft' }} />
              </>
            )}

            {/* Female Tolerance Bands (±5%) */}
            {showToleranceBands && (genderFilter === 'both' || genderFilter === 'female') && (
              <Area
                type="monotone"
                dataKey="femaleToleranceRange"
                stroke="none"
                fill="url(#femaleCorridorGrad)"
                name="Female ±5% Target Corridor"
                legendType="none"
              />
            )}

            {/* Male Tolerance Bands (±5%) */}
            {showToleranceBands && (genderFilter === 'both' || genderFilter === 'male') && (
              <Area
                type="monotone"
                dataKey="maleToleranceRange"
                stroke="none"
                fill="url(#maleCorridorGrad)"
                name="Male ±5% Target Corridor"
                legendType="none"
              />
            )}

            {/* Standard Lines (Dashed Guide Curves) */}
            {(genderFilter === 'both' || genderFilter === 'female') && (
              <Line
                type="monotone"
                dataKey="femaleStd"
                stroke="#fda4af"
                strokeWidth={2}
                strokeDasharray="4 4"
                name="Female Target (Std)"
                dot={false}
                activeDot={false}
              />
            )}

            {(genderFilter === 'both' || genderFilter === 'male') && (
              <Line
                type="monotone"
                dataKey="maleStd"
                stroke="#7dd3fc"
                strokeWidth={2}
                strokeDasharray="4 4"
                name="Male Target (Std)"
                dot={false}
                activeDot={false}
              />
            )}

            {/* Actual Lines (Bold Solid Curves with sample dots) */}
            {(genderFilter === 'both' || genderFilter === 'female') && (
              <Line
                type="monotone"
                dataKey="femaleActual"
                stroke="#e11d48"
                strokeWidth={3}
                name="Female Actual (g)"
                connectNulls
                dot={{ r: 5, fill: '#e11d48', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#e11d48', stroke: '#ffe4e6', strokeWidth: 3 }}
              />
            )}

            {(genderFilter === 'both' || genderFilter === 'male') && (
              <Line
                type="monotone"
                dataKey="maleActual"
                stroke="#0284c7"
                strokeWidth={3}
                name="Male Actual (g)"
                connectNulls
                dot={{ r: 5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#0284c7', stroke: '#e0f2fe', strokeWidth: 3 }}
              />
            )}

            {showBrush && phaseFilter === 'all' && (
              <Brush dataKey="label" height={28} stroke="#0d9488" fill="#f8fafc" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Guide Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-rose-600 rounded-full inline-block"></span>
            <span className="font-semibold text-slate-700">Female Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-sky-600 rounded-full inline-block"></span>
            <span className="font-semibold text-slate-700">Male Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-slate-400 border-b border-dashed inline-block"></span>
            <span className="text-slate-500">Target Standard Benchmark</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 bg-rose-100 border border-rose-300 rounded-xs inline-block"></span>
            <span className="text-slate-500">±5% Tolerable Envelope</span>
          </div>
        </div>

        <button
          onClick={() => setShowBrush(!showBrush)}
          className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
        >
          {showBrush ? 'Hide Zoom Slider' : 'Show Zoom Slider'}
        </button>
      </div>
    </div>
  );
};
