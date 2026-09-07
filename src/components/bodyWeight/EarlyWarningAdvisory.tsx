import React from 'react';
import {
  GrowthTrajectoryAssessment
} from './growthStandards';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Scale,
  HeartHandshake,
  ShieldCheck
} from 'lucide-react';

interface EarlyWarningAdvisoryProps {
  assessment: GrowthTrajectoryAssessment | null;
  selectedHouse: string;
}

export const EarlyWarningAdvisory: React.FC<EarlyWarningAdvisoryProps> = ({
  assessment,
  selectedHouse
}) => {
  if (!assessment) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs text-center text-slate-500 text-xs">
        No recent weighing records available for {selectedHouse} to generate developmental diagnostics.
      </div>
    );
  }

  const {
    currentWeek,
    femaleActual,
    femaleStandard,
    femaleDeviation,
    maleActual,
    maleStandard,
    maleDeviation,
    uniformityPct,
    uniformityStatus,
    maleToFemaleRatio,
    ratioStatus,
    riskAlerts,
    recommendations
  } = assessment;

  const isOptimalOverall = femaleDeviation.status === 'optimal' && maleDeviation.status === 'optimal' && uniformityStatus !== 'poor';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-100">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Developmental Deviation Diagnostics & Advisory (Wk {currentWeek} • {selectedHouse})
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated biometric evaluation based on standard Cobb/Ross management guidelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOptimalOverall ? (
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 font-bold rounded-xl border border-emerald-200 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Optimal Growth Trajectory</span>
            </span>
          ) : (
            <span className="px-3 py-1.5 bg-amber-50 text-amber-800 font-bold rounded-xl border border-amber-200 text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Deviations Detected</span>
            </span>
          )}
        </div>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Female Status */}
        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-950 uppercase tracking-wider text-[11px]">Female Flock Status</span>
            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${femaleDeviation.badgeClass}`}>
              {femaleDeviation.statusLabel}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-rose-950">{femaleActual.toLocaleString()} g</span>
            <span className="text-slate-500 text-[11px]">(Std: {femaleStandard.toLocaleString()} g)</span>
          </div>
          <p className="text-slate-600 text-[11px]">
            Variance: <strong className={femaleDeviation.diffGrams >= 0 ? 'text-emerald-700' : 'text-amber-700'}>
              {femaleDeviation.diffGrams > 0 ? '+' : ''}{femaleDeviation.diffGrams} g ({femaleDeviation.pctDiff > 0 ? '+' : ''}{femaleDeviation.pctDiff}%)
            </strong>
          </p>
        </div>

        {/* Male Status */}
        <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-teal-950 uppercase tracking-wider text-[11px]">Male Cockerel Status</span>
            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${maleDeviation.badgeClass}`}>
              {maleDeviation.statusLabel}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-teal-950">{maleActual.toLocaleString()} g</span>
            <span className="text-slate-500 text-[11px]">(Std: {maleStandard.toLocaleString()} g)</span>
          </div>
          <p className="text-slate-600 text-[11px]">
            Variance: <strong className={maleDeviation.diffGrams >= 0 ? 'text-emerald-700' : 'text-amber-700'}>
              {maleDeviation.diffGrams > 0 ? '+' : ''}{maleDeviation.diffGrams} g ({maleDeviation.pctDiff > 0 ? '+' : ''}{maleDeviation.pctDiff}%)
            </strong>
          </p>
        </div>

        {/* Mating Synchrony / Male-to-Female Ratio */}
        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-950 uppercase tracking-wider text-[11px]">Male:Female Ratio</span>
            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
              ratioStatus === 'optimal' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {ratioStatus === 'optimal' ? 'Synchronized (1.20-1.25x)' : ratioStatus === 'male_heavy' ? 'Males Heavy (>1.28x)' : 'Males Light (<1.18x)'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-purple-950">{maleToFemaleRatio}x</span>
            <span className="text-slate-500 text-[11px]">Target: 1.22x</span>
          </div>
          <p className="text-slate-600 text-[11px]">
            Uniformity: <strong className={uniformityStatus === 'optimal' ? 'text-emerald-700' : 'text-amber-700'}>{uniformityPct}%</strong>
          </p>
        </div>
      </div>

      {/* Risk Alerts (if any) */}
      {riskAlerts.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Developmental Deviation Warnings:</span>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc text-xs text-rose-900">
            {riskAlerts.map((alert, i) => (
              <li key={i}>{alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actionable Manager Recommendations */}
      <div className="bg-teal-950 text-white rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
          <Lightbulb className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Recommended Feed & Management Actions:</span>
        </div>
        <ul className="space-y-2 text-xs text-slate-200">
          {recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-teal-400 font-bold">✓</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
