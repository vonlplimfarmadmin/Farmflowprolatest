import React from 'react';
import { EggProductionRecord, StandardHendayItem } from '../../types';
import { Egg, TrendingUp, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface EggProductionReportSectionProps {
  records: EggProductionRecord[];
  standardHenday: StandardHendayItem[];
  flocks: any[];
}

export const EggProductionReportSection: React.FC<EggProductionReportSectionProps> = ({
  records,
  standardHenday,
  flocks
}) => {
  // Compute aggregates
  const totalTEP = records.reduce((acc, r) => acc + (r.tep || 0), 0);
  const totalHENest = records.reduce((acc, r) => acc + (r.heNest || 0), 0);
  const totalHEFloor = records.reduce((acc, r) => acc + (r.heFloor || 0), 0);
  const totalHE = records.reduce((acc, r) => acc + (r.totalHE || 0), 0);
  const totalNHE = records.reduce((acc, r) => acc + (r.totalNHE || 0), 0);
  
  // Specific NHE categories
  const totalSmall = records.reduce((acc, r) => acc + (r.small || 0), 0);
  const totalThin = records.reduce((acc, r) => acc + (r.thinShell || 0), 0);
  const totalMisshape = records.reduce((acc, r) => acc + (r.misshape || 0), 0);
  const totalDY = records.reduce((acc, r) => acc + (r.doubleYolk || 0), 0);
  const totalBroken = records.reduce((acc, r) => acc + (r.broken || 0), 0);
  const totalSpoiled = records.reduce((acc, r) => acc + (r.spoiled || 0), 0);
  const totalOthers = records.reduce((acc, r) => acc + (r.others || 0), 0);

  const overallHEPct = totalTEP > 0 ? (totalHE / totalTEP) * 100 : 0;
  const overallNHEPct = totalTEP > 0 ? (totalNHE / totalTEP) * 100 : 0;

  // Average Hen-day
  const recordsWithHD = records.filter(r => (r.hendayPct || 0) > 0);
  const avgHD = recordsWithHD.length > 0 
    ? recordsWithHD.reduce((acc, r) => acc + (r.hendayPct || 0), 0) / recordsWithHD.length 
    : 0;

  // Total female bird-days
  const totalFemalePop = records.reduce((acc, r) => acc + (r.femalePopulationAtDate || 0), 0);
  const avgDailyTEP = records.length > 0 ? Math.round(totalTEP / records.length) : 0;

  return (
    <div className="space-y-6">
      {/* Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 print:grid-cols-4 print:gap-2">
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl print:bg-white print:border-slate-300">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">Total Egg Prod (TEP)</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-950 mt-1 block">
            {totalTEP.toLocaleString()}
          </span>
          <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">
            ~{Math.round(totalTEP / 30).toLocaleString()} Trays (30s) &bull; Avg {avgDailyTEP.toLocaleString()}/day
          </span>
        </div>

        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl print:bg-white print:border-slate-300">
          <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">Hatching Eggs (HE)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-950">
              {totalHE.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-700">({overallHEPct.toFixed(1)}%)</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
            Nest: {totalHENest.toLocaleString()} | Floor: {totalHEFloor.toLocaleString()}
          </span>
        </div>

        <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl print:bg-white print:border-slate-300">
          <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider block">Non-Hatching (NHE)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-rose-950">
              {totalNHE.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-rose-700">({overallNHEPct.toFixed(1)}%)</span>
          </div>
          <span className="text-[11px] text-rose-700 font-semibold mt-0.5 block">
            Cracked/Broken: {totalBroken} | Spoiled: {totalSpoiled}
          </span>
        </div>

        <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-2xl print:bg-white print:border-slate-300">
          <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider block">Average Hen-Day (HD%)</span>
          <span className="text-2xl sm:text-3xl font-black text-teal-950 mt-1 block">
            {avgHD.toFixed(1)}%
          </span>
          <span className="text-[11px] text-teal-700 font-semibold mt-0.5 block">
            Standard Benchmark: ~82.0%
          </span>
        </div>
      </div>

      {/* Main Tabular Report Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs print:border-slate-800 print:rounded-none">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:bg-slate-100 print:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Egg className="w-4 h-4 text-amber-600 print:hidden" />
            Detailed Egg Production & Hatching Quality Log
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            {records.length} {records.length === 1 ? 'Entry' : 'Entries'} Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 print:bg-slate-200 print:border-slate-800 text-[11px]">
                <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap">House</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right">Females</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right text-emerald-800 font-bold bg-emerald-50/50">HE Nest</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right text-emerald-800 font-bold bg-emerald-50/50">HE Floor</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right text-emerald-900 font-black bg-emerald-100/60">Total HE</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right text-emerald-800 bg-emerald-50/50">HE %</th>
                <th className="py-2.5 px-2 text-right text-slate-500 font-normal">Small</th>
                <th className="py-2.5 px-2 text-right text-slate-500 font-normal">Thin</th>
                <th className="py-2.5 px-2 text-right text-slate-500 font-normal">Missh</th>
                <th className="py-2.5 px-2 text-right text-slate-500 font-normal">D-Yolk</th>
                <th className="py-2.5 px-2 text-right text-slate-500 font-normal">Brk</th>
                <th className="py-2.5 px-2 text-right text-slate-500 font-normal">Spoil</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right text-rose-900 font-black bg-rose-50/60">Total NHE</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right text-rose-800 bg-rose-50/60">NHE %</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right text-amber-950 font-black bg-amber-100/60">TEP</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right text-teal-900 font-black bg-teal-50/60">HD %</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right">Avg Wt</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-slate-600">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 print:divide-slate-300">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={19} className="py-10 text-center text-slate-400">
                    No egg production records match the selected date and house filter.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const hePct = r.tep && r.tep > 0 ? ((r.totalHE || 0) / r.tep) * 100 : 0;
                  const nhePct = r.tep && r.tep > 0 ? ((r.totalNHE || 0) / r.tep) * 100 : 0;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition print:hover:bg-transparent">
                      <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {r.date}
                      </td>
                      <td className="py-2 px-2.5 font-bold text-slate-800 whitespace-nowrap">
                        {r.houseNumber}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-600">
                        {r.femalePopulationAtDate ? r.femalePopulationAtDate.toLocaleString() : '-'}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-emerald-800 bg-emerald-50/30">
                        {(r.heNest || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-emerald-800 bg-emerald-50/30">
                        {(r.heFloor || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-950 bg-emerald-100/40">
                        {(r.totalHE || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-semibold text-emerald-800 bg-emerald-50/30">
                        {hePct.toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-500">{r.small || 0}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-500">{r.thinShell || 0}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-500">{r.misshape || 0}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-500">{r.doubleYolk || 0}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-500">{r.broken || 0}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-500">{r.spoiled || 0}</td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-rose-950 bg-rose-50/40">
                        {(r.totalNHE || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-semibold text-rose-800 bg-rose-50/40">
                        {nhePct.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-amber-950 bg-amber-100/40">
                        {(r.tep || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-black text-teal-900 bg-teal-50/40">
                        {r.hendayPct ? `${r.hendayPct.toFixed(1)}%` : '-'}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-600">
                        {r.sampleEggWeightGrams ? `${r.sampleEggWeightGrams.toFixed(1)}g` : '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-600 truncate max-w-[100px]" title={r.loggedBy}>
                        {r.loggedBy || 'Flockman'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Grand Totals Row */}
            {records.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-900 print:bg-slate-900 print:text-white text-[11px]">
                  <td className="py-3 px-3 uppercase tracking-wider" colSpan={2}>
                    Grand Totals ({records.length} days)
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-slate-300">
                    {totalFemalePop > 0 ? Math.round(totalFemalePop / records.length).toLocaleString() : '-'}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-emerald-300">
                    {totalHENest.toLocaleString()}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-emerald-300">
                    {totalHEFloor.toLocaleString()}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-emerald-400 font-black">
                    {totalHE.toLocaleString()}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-emerald-300">
                    {overallHEPct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-slate-300">{totalSmall}</td>
                  <td className="py-3 px-2 text-right font-mono text-slate-300">{totalThin}</td>
                  <td className="py-3 px-2 text-right font-mono text-slate-300">{totalMisshape}</td>
                  <td className="py-3 px-2 text-right font-mono text-slate-300">{totalDY}</td>
                  <td className="py-3 px-2 text-right font-mono text-slate-300">{totalBroken}</td>
                  <td className="py-3 px-2 text-right font-mono text-slate-300">{totalSpoiled}</td>
                  <td className="py-3 px-2.5 text-right font-mono text-rose-300 font-black">
                    {totalNHE.toLocaleString()}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-rose-300">
                    {overallNHEPct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-300 font-black">
                    {totalTEP.toLocaleString()}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-teal-300 font-black">
                    {avgHD.toFixed(1)}%
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-slate-300">-</td>
                  <td className="py-3 px-3 text-slate-400">All Staff</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
