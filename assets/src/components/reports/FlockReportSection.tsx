import React from 'react';
import { Flock } from '../../types';
import { Bird, ShieldCheck, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';
import { calculateFlockAgeFromLoadingDate } from '../../utils/dateCalculations';

interface FlockReportSectionProps {
  flocks: Flock[];
  getFlockStats: (houseNumber: string) => { currentMales: number; currentFemales: number; totalCurrent: number; livabilityPct?: number } | null | any;
  selectedHouse: string;
}

export const FlockReportSection: React.FC<FlockReportSectionProps> = ({
  flocks,
  getFlockStats,
  selectedHouse
}) => {
  const filteredFlocks = flocks.filter(f => selectedHouse === 'All' || f.houseNumber === selectedHouse);

  const totalInitialMales = filteredFlocks.reduce((acc, f) => acc + (f.initialMales || 0), 0);
  const totalInitialFemales = filteredFlocks.reduce((acc, f) => acc + (f.initialFemales || 0), 0);
  const totalCurrentMales = filteredFlocks.reduce((acc, f) => {
    const s = getFlockStats(f.houseNumber);
    return acc + (s ? s.currentMales : f.currentMales || 0);
  }, 0);
  const totalCurrentFemales = filteredFlocks.reduce((acc, f) => {
    const s = getFlockStats(f.houseNumber);
    return acc + (s ? s.currentFemales : f.currentFemales || 0);
  }, 0);

  const totalInitialBirds = totalInitialMales + totalInitialFemales;
  const totalCurrentBirds = totalCurrentMales + totalCurrentFemales;
  const overallLivability = totalInitialBirds > 0 ? (totalCurrentBirds / totalInitialBirds) * 100 : 0;
  const overallMatingRatio = totalCurrentMales > 0 ? (totalCurrentFemales / totalCurrentMales) : 0;

  return (
    <div className="space-y-6">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Active Flocks
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5 block">
            {filteredFlocks.length} Houses
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Selected: {selectedHouse}
          </span>
        </div>

        <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl">
          <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
            Current Population
          </span>
          <span className="text-xl sm:text-2xl font-black text-teal-950 font-mono mt-0.5 block">
            {totalCurrentBirds.toLocaleString()}
          </span>
          <span className="text-[10px] text-teal-700 mt-1 block font-medium">
            ♂ {totalCurrentMales.toLocaleString()} | ♀ {totalCurrentFemales.toLocaleString()}
          </span>
        </div>

        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Overall Livability
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-950 font-mono mt-0.5 block">
            {overallLivability.toFixed(1)}%
          </span>
          <span className="text-[10px] text-emerald-700 mt-1 block font-medium">
            Lost: {(totalInitialBirds - totalCurrentBirds).toLocaleString()} birds
          </span>
        </div>

        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
            Mating Ratio (F : M)
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-950 font-mono mt-0.5 block">
            1 : {overallMatingRatio.toFixed(1)}
          </span>
          <span className="text-[10px] text-amber-700 mt-1 block font-medium">
            Standard: 1 : 9.5 - 10.0
          </span>
        </div>
      </div>

      {/* Main Tabular View */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bird className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-black uppercase tracking-wider">
              Flock Demographics & Pen Distribution Master List
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-300">
            {filteredFlocks.length} Active Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">House</th>
                <th className="py-2.5 px-3">Breed</th>
                <th className="py-2.5 px-3">Loading Date</th>
                <th className="py-2.5 px-3">Age (Wks + Days)</th>
                <th className="py-2.5 px-3 text-right">Initial ♂</th>
                <th className="py-2.5 px-3 text-right">Initial ♀</th>
                <th className="py-2.5 px-3 text-right font-bold text-teal-900">Current ♂</th>
                <th className="py-2.5 px-3 text-right font-bold text-teal-900">Current ♀</th>
                <th className="py-2.5 px-3 text-right font-black text-slate-900">Total Live</th>
                <th className="py-2.5 px-3 text-right">Livability %</th>
                <th className="py-2.5 px-3 text-right">Ratio (1:X)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFlocks.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-slate-400 text-xs italic">
                    No flock records found matching current filter scope.
                  </td>
                </tr>
              ) : (
                filteredFlocks.map(flock => {
                  const stats = getFlockStats(flock.houseNumber);
                  const currMales = stats ? stats.currentMales : flock.currentMales || 0;
                  const currFemales = stats ? stats.currentFemales : flock.currentFemales || 0;
                  const totalLive = currMales + currFemales;
                  const initTotal = (flock.initialMales || 0) + (flock.initialFemales || 0);
                  const livability = initTotal > 0 ? (totalLive / initTotal) * 100 : 100;
                  const ratio = currMales > 0 ? (currFemales / currMales) : 0;
                  const age = calculateFlockAgeFromLoadingDate(flock.loadingDateFemale || flock.loadingDateMale);

                  return (
                    <React.Fragment key={flock.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {flock.houseNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {flock.breed}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {flock.loadingDateFemale || flock.loadingDateMale || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {age ? `${age.ageWeeks}w + ${age.ageDays}d` : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {(flock.initialMales || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {(flock.initialFemales || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-800 bg-teal-50/40">
                          {currMales.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-800 bg-teal-50/40">
                          {currFemales.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 bg-slate-50">
                          {totalLive.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          {livability.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-amber-800">
                          1 : {ratio.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                            {flock.status || 'Active'}
                          </span>
                        </td>
                      </tr>

                      {/* Optional Pen Allocations breakdown if configured */}
                      {flock.pens && flock.pens.length > 0 && (
                        <tr className="bg-slate-50/50 text-[11px] text-slate-600">
                          <td colSpan={12} className="py-1.5 px-6 border-b border-slate-100">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-bold text-slate-700">Pen Distribution:</span>
                              {flock.pens.map(pen => (
                                <span key={pen.id} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-mono">
                                  {pen.name} ({pen.side}): ♂ {pen.males} | ♀ {pen.females}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            {filteredFlocks.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300">
                  <td className="py-2.5 px-3 font-black">TOTALS</td>
                  <td className="py-2.5 px-3">{filteredFlocks.length} Houses</td>
                  <td className="py-2.5 px-3">-</td>
                  <td className="py-2.5 px-3">-</td>
                  <td className="py-2.5 px-3 text-right font-mono">{totalInitialMales.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{totalInitialFemales.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-teal-900">{totalCurrentMales.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-teal-900">{totalCurrentFemales.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-black">{totalCurrentBirds.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-800">{overallLivability.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-900">1 : {overallMatingRatio.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-center">Active</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
