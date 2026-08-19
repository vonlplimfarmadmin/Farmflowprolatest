import React from 'react';
import { DepletionRecord, Flock } from '../../types';
import { Skull, TrendingDown, HeartHandshake, ShieldAlert, Activity } from 'lucide-react';

interface MortalityReportSectionProps {
  depletions: DepletionRecord[];
  flocks: Flock[];
  getFlockStats: (houseNumber: string, targetDate?: string) => any;
}

export const MortalityReportSection: React.FC<MortalityReportSectionProps> = ({
  depletions,
  flocks,
  getFlockStats
}) => {
  // Aggregate counts
  const totalMales = depletions.reduce((acc, d) => acc + (d.maleCount || 0), 0);
  const totalFemales = depletions.reduce((acc, d) => acc + (d.femaleCount || 0), 0);
  const grandTotalDepletions = totalMales + totalFemales;

  // Breakdown by Category
  const naturalMortality = depletions
    .filter(d => d.category === 'Mortality')
    .reduce((acc, d) => acc + d.maleCount + d.femaleCount, 0);

  const spotCulls = depletions
    .filter(d => d.category === 'Spot Cull')
    .reduce((acc, d) => acc + d.maleCount + d.femaleCount, 0);

  const missex = depletions
    .filter(d => d.category === 'Missex')
    .reduce((acc, d) => acc + d.maleCount + d.femaleCount, 0);

  const spentCull = depletions
    .filter(d => d.category === 'Spent Cull')
    .reduce((acc, d) => acc + d.maleCount + d.femaleCount, 0);

  // Total current population across active flocks
  const totalActiveMales = flocks.reduce((acc, f) => acc + (f.currentMales || 0), 0);
  const totalActiveFemales = flocks.reduce((acc, f) => acc + (f.currentFemales || 0), 0);
  const totalActivePop = totalActiveMales + totalActiveFemales;

  const totalInitialMales = flocks.reduce((acc, f) => acc + (f.initialMales || 0), 0);
  const totalInitialFemales = flocks.reduce((acc, f) => acc + (f.initialFemales || 0), 0);
  const totalInitialPop = totalInitialMales + totalInitialFemales;

  const cumulativeLivability = totalInitialPop > 0 
    ? (totalActivePop / totalInitialPop) * 100 
    : 100;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 print:grid-cols-4 print:gap-2">
        <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl print:bg-white print:border-slate-300">
          <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider block">Total Depletions</span>
          <span className="text-2xl sm:text-3xl font-black text-rose-950 mt-1 block">
            {grandTotalDepletions.toLocaleString()} <span className="text-xs font-bold text-rose-700">Birds</span>
          </span>
          <span className="text-[11px] text-rose-700 font-semibold mt-0.5 block">
            Females: {totalFemales.toLocaleString()} &bull; Males: {totalMales.toLocaleString()}
          </span>
        </div>

        <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl print:bg-white print:border-slate-300">
          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">Natural Mortality</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            {naturalMortality.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-600 font-semibold mt-0.5 block">
            {grandTotalDepletions > 0 ? ((naturalMortality / grandTotalDepletions) * 100).toFixed(1) : 0}% of all depletions
          </span>
        </div>

        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl print:bg-white print:border-slate-300">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">Culls & Missex</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-950 mt-1 block">
            {(spotCulls + missex + spentCull).toLocaleString()}
          </span>
          <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">
            Spot: {spotCulls} | Missex: {missex} | Spent: {spentCull}
          </span>
        </div>

        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl print:bg-white print:border-slate-300">
          <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">Flock Livability</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1 block">
            {cumulativeLivability.toFixed(2)}%
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
            Active Stock: {totalActivePop.toLocaleString()} Birds
          </span>
        </div>
      </div>

      {/* Main Depletions Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs print:border-slate-800 print:rounded-none">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:bg-slate-100 print:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Skull className="w-4 h-4 text-rose-600 print:hidden" />
            Mortality & Depletion Incident Log
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            {depletions.length} {depletions.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 print:bg-slate-200 print:border-slate-800 text-[11px]">
                <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap">House</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap">Side / Pen</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Category</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right text-teal-900 font-bold bg-teal-50/40">Males</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right text-rose-900 font-bold bg-rose-50/40">Females</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right text-slate-950 font-black bg-slate-100">Total Lost</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Reason / Post-Mortem Symptoms</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap">Source</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 print:divide-slate-300">
              {depletions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    No mortality or depletion records found matching criteria.
                  </td>
                </tr>
              ) : (
                depletions.map((d) => {
                  const rowTotal = (d.maleCount || 0) + (d.femaleCount || 0);
                  const isMortality = d.category === 'Mortality';

                  return (
                    <tr key={d.id} className="hover:bg-slate-50 transition print:hover:bg-transparent">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {d.date}
                      </td>
                      <td className="py-2.5 px-2.5 font-bold text-slate-800 whitespace-nowrap">
                        {d.houseNumber}
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">
                        {d.penName || d.side || 'All'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wide border print:border-none print:p-0 ${
                          isMortality 
                            ? 'bg-rose-50 text-rose-800 border-rose-200' 
                            : d.category === 'Spot Cull'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : d.category === 'Missex'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}>
                          {d.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-teal-800 font-bold bg-teal-50/20">
                        {d.maleCount || 0}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-rose-800 font-bold bg-rose-50/20">
                        {d.femaleCount || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 bg-slate-100/50">
                        {rowTotal}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate" title={d.reasonDetails}>
                        {d.reasonDetails || (isMortality ? 'Routine daily mortality found on slat/floor' : 'Standard flock selection culling')}
                      </td>
                      <td className="py-2.5 px-2.5 text-[11px] text-slate-500 capitalize">
                        {d.sourceModule === 'flockman' ? "Flockman's Log" : 'Mortality Mgmt'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[110px]" title={d.loggedBy}>
                        {d.loggedBy || 'Flockman'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {depletions.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-900 print:bg-slate-900 print:text-white text-[11px]">
                  <td className="py-3 px-3 uppercase tracking-wider" colSpan={4}>
                    Total Birds Depleted ({depletions.length} events)
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-teal-300 font-bold">
                    {totalMales.toLocaleString()}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-rose-300 font-bold">
                    {totalFemales.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-300 font-black">
                    {grandTotalDepletions.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-slate-400" colSpan={3}>
                    Natural Deaths: {naturalMortality} | Culls: {spotCulls + spentCull} | Missex: {missex}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
