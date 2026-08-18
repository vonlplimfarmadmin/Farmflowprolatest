import React from 'react';
import { useFarm } from '../../context/FarmContext';
import { 
  Building2, 
  Bird, 
  Wheat, 
  Egg, 
  Skull, 
  Syringe, 
  Scale, 
  TrendingUp, 
  AlertTriangle, 
  Share2, 
  Plus, 
  Layers, 
  CheckCircle2, 
  ArrowUpRight,
  ShieldCheck,
  Users
} from 'lucide-react';
import { RoleBadge } from '../common/RoleBadge';

interface FarmDashboardOverviewProps {
  onNavigate: (module: any) => void;
  onOpenMessengerReport: () => void;
}

export const FarmDashboardOverview: React.FC<FarmDashboardOverviewProps> = ({ 
  onNavigate, 
  onOpenMessengerReport 
}) => {
  const { 
    flocks, 
    getFlockStats, 
    farmProfile, 
    feedStockEntries, 
    feedConsumptionRecords, 
    eggProductionRecords, 
    getLowStockAlerts, 
    getUpcomingVaccineAlerts, 
    currentUser,
    permissions 
  } = useFarm();

  const lowFeedAlerts = getLowStockAlerts();
  const upcomingVacAlerts = getUpcomingVaccineAlerts();

  // Aggregate stats across all active flocks
  let totalFarmMales = 0;
  let totalFarmFemales = 0;
  let totalFarmDepletions = 0;

  flocks.forEach(flock => {
    const stats = getFlockStats(flock.houseNumber);
    if (stats) {
      totalFarmMales += stats.currentMales;
      totalFarmFemales += stats.currentFemales;
      totalFarmDepletions += stats.totalDepleted;
    }
  });

  const totalFarmPopulation = totalFarmMales + totalFarmFemales;
  const overallLivability = totalFarmPopulation + totalFarmDepletions > 0
    ? (totalFarmPopulation / (totalFarmPopulation + totalFarmDepletions)) * 100
    : 100;

  // Latest egg production record
  const latestEggRecords = eggProductionRecords.slice(0, 6);
  const totalEggsToday = latestEggRecords.reduce((s, r) => s + r.totalEggs, 0);
  const totalHEToday = latestEggRecords.reduce((s, r) => s + r.totalHatchingEggs, 0);
  const avgHendayToday = latestEggRecords.length > 0
    ? (latestEggRecords.reduce((s, r) => s + r.hendayPct, 0) / latestEggRecords.length)
    : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-forest-950 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden border border-forest-900/60">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl">
            {farmProfile.logoUrl && (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-white/95 p-1 shadow-lg shadow-black/30 shrink-0 border border-forest-700/80 hidden sm:flex items-center justify-center">
                <img
                  src={farmProfile.logoUrl}
                  alt={farmProfile.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-forest-900 text-mint-400 border border-mint-400/30 text-[10px] font-bold uppercase tracking-widest">
                  Live Operations Station
                </span>
                {currentUser && <RoleBadge role={currentUser.role} />}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {farmProfile.name}
              </h1>
              <p className="text-xs sm:text-sm text-graphite-300">
                Welcome back, <strong className="text-mint-300">{currentUser?.fullName}</strong>. Live monitoring of {flocks.length} parent-stock breeder houses, bio-security schedules, and daily egg grading.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={onOpenMessengerReport}
              className="px-4 py-2.5 bg-mint-400 hover:bg-mint-300 text-forest-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Messenger Daily Report</span>
            </button>

            {permissions.canRecordEggProduction() && (
              <button
                onClick={() => onNavigate('egg_production')}
                className="px-4 py-2.5 bg-forest-900/80 hover:bg-forest-800 text-mint-100 rounded-xl text-xs font-bold uppercase tracking-wider border border-forest-700 flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4 text-mint-400" />
                <span>Log Egg Production</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Critical Alert Banners */}
      {(lowFeedAlerts.length > 0 || upcomingVacAlerts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowFeedAlerts.length > 0 && (
            <div 
              onClick={() => onNavigate('feed_inventory')}
              className="cursor-pointer p-4 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 transition shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-600 text-white rounded-xl">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-950">Low Feed Stock Alert</h4>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    {lowFeedAlerts.map(a => `${a.feedType} (${a.currentStockBags} bags)`).join(', ')}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-700 underline shrink-0">Restock →</span>
            </div>
          )}

          {upcomingVacAlerts.length > 0 && (
            <div 
              onClick={() => onNavigate('medicine')}
              className="cursor-pointer p-4 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-2xl flex items-center justify-between gap-3 transition shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <Syringe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">Upcoming Vaccination Due</h4>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    {upcomingVacAlerts.length} standard flock vaccine immunization(s) pending.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-700 underline shrink-0">View Schedule →</span>
            </div>
          )}
        </div>
      )}

      {/* 4 Key Executive Farm KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Flock Population */}
        <div 
          onClick={() => onNavigate('flock_list')}
          className="cursor-pointer bg-white rounded-2xl border border-graphite-200 p-5 shadow-xs hover:border-mint-400 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-graphite-500 uppercase tracking-wider">Total Population</span>
            <div className="p-2 bg-forest-50 text-forest-800 rounded-xl">
              <Bird className="w-4 h-4 text-forest-700" />
            </div>
          </div>
          <p className="text-2xl font-black text-graphite-900 mt-2">
            {totalFarmPopulation.toLocaleString()} <span className="text-xs font-semibold text-graphite-400">birds</span>
          </p>
          <div className="mt-3 pt-2 border-t border-graphite-100 flex items-center justify-between text-xs">
            <span className="text-forest-800 font-bold">{totalFarmMales.toLocaleString()} Males</span>
            <span className="text-rose-700 font-semibold">{totalFarmFemales.toLocaleString()} Females</span>
          </div>
        </div>

        {/* Flock Livability */}
        <div 
          onClick={() => onNavigate('mortality')}
          className="cursor-pointer bg-white rounded-2xl border border-graphite-200 p-5 shadow-xs hover:border-mint-400 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-graphite-500 uppercase tracking-wider">Farm Livability %</span>
            <div className="p-2 bg-mint-50 text-mint-800 rounded-xl border border-mint-200">
              <TrendingUp className="w-4 h-4 text-forest-700" />
            </div>
          </div>
          <p className="text-2xl font-black text-forest-800 mt-2">
            {overallLivability.toFixed(2)}%
          </p>
          <div className="mt-3 pt-2 border-t border-graphite-100 text-xs text-graphite-500 flex justify-between">
            <span>Total Depletions:</span>
            <strong className="text-rose-700">-{totalFarmDepletions} birds</strong>
          </div>
        </div>

        {/* Daily Egg Volume */}
        <div 
          onClick={() => onNavigate('egg_production')}
          className="cursor-pointer bg-forest-950 text-white rounded-2xl border border-forest-900 p-5 shadow-xs hover:border-mint-400 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-mint-300 uppercase tracking-wider">Today's Total Eggs</span>
            <div className="p-2 bg-mint-400 text-forest-950 rounded-xl shadow-xs">
              <Egg className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">
            {totalEggsToday.toLocaleString()} <span className="text-xs font-semibold text-mint-300">eggs</span>
          </p>
          <div className="mt-3 pt-2 border-t border-forest-900 flex items-center justify-between text-xs">
            <span className="text-mint-400 font-bold">{totalHEToday.toLocaleString()} HE</span>
            <span className="text-graphite-300 font-semibold">{avgHendayToday.toFixed(1)}% Henday</span>
          </div>
        </div>

        {/* Active Houses */}
        <div 
          onClick={() => onNavigate('flock_list')}
          className="cursor-pointer bg-white rounded-2xl border border-graphite-200 p-5 shadow-xs hover:border-mint-400 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-graphite-500 uppercase tracking-wider">Production Houses</span>
            <div className="p-2 bg-graphite-100 text-graphite-700 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-graphite-900 mt-2">
            {flocks.length} Houses
          </p>
          <div className="mt-3 pt-2 border-t border-graphite-100 text-xs text-graphite-500 flex justify-between">
            <span>Breeds:</span>
            <strong className="text-graphite-800">Cobb 500 & Ross 308</strong>
          </div>
        </div>
      </div>

      {/* Flock House Status Grid */}
      <div className="bg-white rounded-2xl border border-graphite-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-graphite-900">Live House Production Roster</h3>
            <p className="text-xs text-graphite-500">Real-time status, age in weeks, livability, and male/female population</p>
          </div>
          {permissions.canAddFlock && (
            <button
              onClick={() => onNavigate('flock_list')}
              className="text-xs font-bold text-forest-800 hover:text-forest-900 uppercase tracking-wider"
            >
              Manage Flocks →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flocks.map(flock => {
            const stats = getFlockStats(flock.houseNumber);
            if (!stats) return null;

            return (
              <div
                key={flock.id}
                onClick={() => onNavigate('flockman_module')}
                className="cursor-pointer p-4 bg-graphite-50 hover:bg-forest-50/50 border border-graphite-200 hover:border-mint-400/80 rounded-2xl transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-forest-900 text-mint-300 font-bold text-xs">
                      {flock.houseNumber}
                    </span>
                    <span className="text-xs font-bold text-graphite-800">{flock.breed}</span>
                  </div>
                  <span className="text-xs font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200" title={`Loading Date: ${flock.loadingDateFemale || flock.loadingDateMale} (${stats.totalDaysFromLoading || 0} days housed)`}>
                    Week {stats.ageWeeks} <span className="text-[10px] text-forest-600 font-semibold">(D{stats.ageDays || 1})</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-graphite-200">
                    <span className="text-[10px] text-forest-700 font-semibold block">Males</span>
                    <span className="font-extrabold text-graphite-900">{stats.currentMales}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-graphite-200">
                    <span className="text-[10px] text-rose-600 font-semibold block">Females</span>
                    <span className="font-extrabold text-graphite-900">{stats.currentFemales}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-graphite-200">
                    <span className="text-[10px] text-forest-700 font-semibold block">Livability</span>
                    <span className="font-extrabold text-forest-800">{stats.livabilityPct.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-graphite-500 pt-1">
                  <span>M:F Ratio: <strong className="text-graphite-800">{stats.maleToFemaleRatioStr}</strong></span>
                  <span className="text-forest-700 font-bold hover:text-forest-900">Open Station →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h3 className="text-xs font-bold text-graphite-400 uppercase tracking-wider mb-3">
          Quick Operational Modules
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('egg_production')}
            className="p-4 bg-white hover:bg-forest-50/50 border border-graphite-200 hover:border-mint-400/80 rounded-2xl text-left transition shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Egg className="w-4 h-4 text-forest-700" />
            </div>
            <p className="font-bold text-xs text-graphite-900">Egg Grading</p>
            <p className="text-[10px] text-graphite-500 mt-0.5">HE / NHE / Messenger</p>
          </button>

          <button
            onClick={() => onNavigate('flockman_module')}
            className="p-4 bg-white hover:bg-forest-50/50 border border-graphite-200 hover:border-mint-400/80 rounded-2xl text-left transition shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Layers className="w-4 h-4 text-forest-700" />
            </div>
            <p className="font-bold text-xs text-graphite-900">Flockman's Station</p>
            <p className="text-[10px] text-graphite-500 mt-0.5">Pens & Daily Feeds</p>
          </button>

          <button
            onClick={() => onNavigate('feed_inventory')}
            className="p-4 bg-white hover:bg-forest-50/50 border border-graphite-200 hover:border-mint-400/80 rounded-2xl text-left transition shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Wheat className="w-4 h-4 text-forest-700" />
            </div>
            <p className="font-bold text-xs text-graphite-900">Feed Silos</p>
            <p className="text-[10px] text-graphite-500 mt-0.5">Stock & Consumption</p>
          </button>

          <button
            onClick={() => onNavigate('mortality')}
            className="p-4 bg-white hover:bg-rose-50/50 border border-graphite-200 hover:border-rose-300 rounded-2xl text-left transition shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Skull className="w-4 h-4" />
            </div>
            <p className="font-bold text-xs text-graphite-900">Depletions</p>
            <p className="text-[10px] text-graphite-500 mt-0.5">Mortality & Culls</p>
          </button>

          <button
            onClick={() => onNavigate('medicine')}
            className="p-4 bg-white hover:bg-forest-50/50 border border-graphite-200 hover:border-mint-400/80 rounded-2xl text-left transition shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Syringe className="w-4 h-4 text-forest-700" />
            </div>
            <p className="font-bold text-xs text-graphite-900">Vaccine & Meds</p>
            <p className="text-[10px] text-graphite-500 mt-0.5">Immunization logs</p>
          </button>

          <button
            onClick={() => onNavigate('body_weight')}
            className="p-4 bg-white hover:bg-forest-50/50 border border-graphite-200 hover:border-mint-400/80 rounded-2xl text-left transition shadow-2xs group"
          >
            <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Scale className="w-4 h-4 text-forest-700" />
            </div>
            <p className="font-bold text-xs text-graphite-900">Body Weight</p>
            <p className="text-[10px] text-graphite-500 mt-0.5">Standard vs Actual</p>
          </button>
        </div>
      </div>
    </div>
  );
};
