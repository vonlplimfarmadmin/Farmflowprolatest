import React from 'react';
import { MedAdministrationRecord, MedProduct, StandardMedProgramItem, Flock } from '../../types';
import { Syringe, ShieldCheck, CheckCircle2, Clock, AlertCircle, Pill, Activity } from 'lucide-react';

interface VaccinesMedicineReportSectionProps {
  administrations: MedAdministrationRecord[];
  products: MedProduct[];
  standardProgram: StandardMedProgramItem[];
  flocks: Flock[];
}

export const VaccinesMedicineReportSection: React.FC<VaccinesMedicineReportSectionProps> = ({
  administrations,
  products,
  standardProgram,
  flocks
}) => {
  // Aggregate stats
  const totalDosesAdministered = administrations.reduce((acc, a) => acc + (a.totalDosesAdministered || (a.unitsUsed * 1000) || 0), 0);
  const totalUnitsUsed = administrations.reduce((acc, a) => acc + (a.unitsUsed || 0), 0);

  const vaccineEvents = administrations.filter(a => a.productType === 'Vaccine').length;
  const medEvents = administrations.filter(a => a.productType !== 'Vaccine').length;

  const lowStockCount = products.filter(p => (p.currentStockUnits || 0) <= (p.minAlertUnits || 5)).length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 print:grid-cols-4 print:gap-2">
        <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-2xl print:bg-white print:border-slate-300">
          <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider block">Total Doses Given</span>
          <span className="text-2xl sm:text-3xl font-black text-teal-950 mt-1 block">
            {totalDosesAdministered.toLocaleString()}
          </span>
          <span className="text-[11px] text-teal-700 font-semibold mt-0.5 block">
            Across {administrations.length} treatment applications
          </span>
        </div>

        <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl print:bg-white print:border-slate-300">
          <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">Vaccination Sessions</span>
          <span className="text-2xl sm:text-3xl font-black text-indigo-950 mt-1 block">
            {vaccineEvents} <span className="text-xs font-bold text-indigo-700">Events</span>
          </span>
          <span className="text-[11px] text-indigo-700 font-semibold mt-0.5 block">
            Routine viral & bacterial immunization
          </span>
        </div>

        <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl print:bg-white print:border-slate-300">
          <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">Meds & Supplements</span>
          <span className="text-2xl sm:text-3xl font-black text-purple-950 mt-1 block">
            {medEvents} <span className="text-xs font-bold text-purple-700">Logs</span>
          </span>
          <span className="text-[11px] text-purple-700 font-semibold mt-0.5 block">
            Vitamins, electrolytes & dewormers
          </span>
        </div>

        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl print:bg-white print:border-slate-300">
          <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">Standard Schedule</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1 block">
            {standardProgram.length} <span className="text-xs font-bold text-emerald-700">Protocols</span>
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
            {lowStockCount > 0 ? `${lowStockCount} items low stock` : 'Inventory fully supplied'}
          </span>
        </div>
      </div>

      {/* Main Administered Treatments Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs print:border-slate-800 print:rounded-none">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:bg-slate-100 print:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Syringe className="w-4 h-4 text-teal-600 print:hidden" />
            Vaccine & Medication Administration History
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            {administrations.length} {administrations.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 print:bg-slate-200 print:border-slate-800 text-[11px]">
                <th className="py-2.5 px-3 whitespace-nowrap">Admin Date</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap">House</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Product Name</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap">Type</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Route / Method</th>
                <th className="py-2.5 px-2.5 whitespace-nowrap text-right">Units</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right text-teal-950 font-black bg-teal-50/50">Total Doses</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Peripherals / Equipment</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Administered By</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 print:divide-slate-300">
              {administrations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    No medication or vaccination logs match the selected period.
                  </td>
                </tr>
              ) : (
                administrations.map((a) => {
                  const doses = a.totalDosesAdministered || (a.unitsUsed * 1000);
                  const isVaccine = a.productType === 'Vaccine';

                  return (
                    <tr key={a.id} className="hover:bg-slate-50 transition print:hover:bg-transparent">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {a.date}
                      </td>
                      <td className="py-2.5 px-2.5 font-bold text-slate-800 whitespace-nowrap">
                        {a.houseNumber}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {a.productName}
                      </td>
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wide border print:border-none print:p-0 ${
                          isVaccine 
                            ? 'bg-teal-50 text-teal-800 border-teal-200' 
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}>
                          {a.productType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {a.method}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-slate-600">
                        {a.unitsUsed}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-teal-950 bg-teal-50/30 whitespace-nowrap">
                        {doses.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-xs truncate" title={a.peripheralsUsed}>
                        {a.peripheralsUsed || 'Standard equipment'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 truncate max-w-[120px]" title={a.administeredBy || a.loggedBy}>
                        {a.administeredBy || a.loggedBy || 'Veterinary Crew'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 print:border-none print:p-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 print:hidden" />
                          Completed
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {administrations.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-900 print:bg-slate-900 print:text-white text-[11px]">
                  <td className="py-3 px-3 uppercase tracking-wider" colSpan={5}>
                    Total Treatments Administered ({administrations.length} Records)
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono text-slate-300">
                    {totalUnitsUsed} units
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-teal-300 font-black">
                    {totalDosesAdministered.toLocaleString()} doses
                  </td>
                  <td className="py-3 px-3 text-slate-400" colSpan={3}>
                    Vaccines: {vaccineEvents} | Meds/Supplements: {medEvents}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Standard Vaccination Protocol Reference Checklist */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 overflow-hidden shadow-xs print:border-slate-800 print:rounded-none">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-forest-800 print:hidden" />
          Standard Breeder Vaccination & Prophylaxis Protocol Reference
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                <th className="py-2 px-3">Age (Wks/Days)</th>
                <th className="py-2 px-3">Product Name</th>
                <th className="py-2 px-3">Disease Target</th>
                <th className="py-2 px-3">Application Route</th>
                <th className="py-2 px-3 text-center">Compliance</th>
                <th className="py-2 px-3">Veterinary Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {standardProgram.map((item) => {
                // Check if recorded in administrations
                const isGiven = administrations.some(a => 
                  a.productName.toLowerCase().includes(item.productName.toLowerCase().slice(0, 8))
                );

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      Week {item.ageWeek} {item.ageDays ? `(Day ${item.ageDays})` : ''}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-800 whitespace-nowrap">
                      {item.productName}
                    </td>
                    <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                      {item.diseaseTarget}
                    </td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                      {item.method}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        isGiven 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : item.mandatory
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isGiven ? 'Verified Logged' : item.mandatory ? 'Scheduled Mandatory' : 'Elective Booster'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px]">
                      {item.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
