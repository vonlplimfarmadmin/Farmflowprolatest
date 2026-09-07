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
  Users,
  FileSpreadsheet,
  LineChart as ChartIcon
} from 'lucide-react';
import { RoleBadge } from '../common/RoleBadge';
import { FlockProductivityDashboard } from './FlockProductivityDashboard';

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

  const safeFlocks = Array.isArray(flocks) ? flocks : [];
  const safeEggProductionRecords = Array.isArray(eggProductionRecords) ? eggProductionRecords : [];
  const lowFeedAlerts = getLowStockAlerts ? getLowStockAlerts() : [];
  const upcomingVacAlerts = getUpcomingVaccineAlerts ? getUpcomingVaccineAlerts() : [];

  // Aggregate stats across all active flocks
  let totalFarmMales = 0;
  let totalFarmFemales = 0;
  let totalFarmDepletions = 0;

  safeFlocks.forEach(flock => {
    if (!flock) return;
    const stats = getFlockStats ? getFlockStats(flock.houseNumber) : null;
    if (stats) {
      totalFarmMales += stats.currentMales || 0;
      totalFarmFemales += stats.currentFemales || 0;
      totalFarmDepletions += stats.totalDepleted || 0;
    }
  });

  const totalFarmPopulation = totalFarmMales + totalFarmFemales;
  const rawLivability = totalFarmPopulation + totalFarmDepletions > 0
    ? (totalFarmPopulation / (totalFarmPopulation + totalFarmDepletions)) * 100
    : 100;
  const overallLivability = isNaN(rawLivability) ? 100 : rawLivability;

  // Latest egg production record
  const latestEggRecords = safeEggProductionRecords.slice(0, 6);
  const totalEggsToday = latestEggRecords.reduce((s, r) => s + (Number(r?.tep) || Number(r?.totalEggs) || 0), 0);
  const totalHEToday = latestEggRecords.reduce((s, r) => s + (Number(r?.totalHE) || Number(r?.totalHatchingEggs) || 0), 0);
  const rawAvgHenday = latestEggRecords.length > 0
    ? (latestEggRecords.reduce((s, r) => s + (Number(r?.hendayPct) || 0), 0) / latestEggRecords.length)
    : 0;
  const avgHendayToday = isNaN(rawAvgHenday) ? 0 : rawAvgHenday;

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Sleek Hero Banner with Glassmorphism */}
      <div className="glass-card-dark text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-mint-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5 max-w-2xl">
            {farmProfile.logoUrl ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/95 p-1 shadow-lg shadow-black/30 shrink-0 border border-forest-700/80 hidden sm:flex items-center justify-center">
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
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-mint-400 to-emerald-500 text-forest-950 font-black text-xl italic flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0 hidden sm:flex font-display">
                FF
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-0.5 rounded-full glass-pill-dark text-mint-300 text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                  Live Operations Station
                </span>
                {currentUser && <RoleBadge role={currentUser.role} />}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
                {farmProfile.name}
              </h1>
              <p className="text-xs sm:text-sm text-graphite-300 leading-relaxed max-w-xl">
                Active control for <strong className="text-mint-300 font-semibold">{currentUser?.fullName}</strong>. Live monitoring of {flocks.length} parent-stock breeder houses, bio-security compliance, and daily egg grading.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center flex-wrap">
            <button
              onClick={() => {
                const el = document.getElementById('flock-productivity-dashboard-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2.5 glass-pill-dark hover:bg-forest-900/90 text-mint-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <ChartIcon className="w-4 h-4 text-mint-400" />
              <span>Trends & Curves</span>
            </button>
            <button
              onClick={onOpenMessengerReport}
              className="px-4 py-2.5 bg-gradient-to-r from-mint-400 to-emerald-400 hover:from-mint-300 hover:to-emerald-300 active:scale-95 text-forest-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Messenger Summary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alert Banners */}
      {(lowFeedAlerts.length > 0 || upcomingVacAlerts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowFeedAlerts.length > 0 && (
            <div 
              onClick={() => onNavigate('feed_inventory')}
              className="cursor-pointer p-4 glass-card hover:border-rose-300 rounded-2xl flex items-center justify-between gap-3 transition-all shadow-xs group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
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
              className="cursor-pointer p-4 glass-card hover:border-indigo-300 rounded-2xl flex items-center justify-between gap-3 transition-all shadow-xs group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
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

      {/* 4 Key Executive Farm KPIs with Glassmorphism */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Flock Population */}
        <div 
          onClick={() => onNavigate('flock_list')}
          className="cursor-pointer glass-card-interactive rounded-2xl p-5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-graphite-500 uppercase tracking-wider">Total Population</span>
            <div className="p-2 bg-forest-50/90 text-forest-800 rounded-xl group-hover:bg-forest-100 transition-colors border border-forest-100">
              <Bird className="w-4 h-4 text-forest-700" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-graphite-900 mt-2 tracking-tight">
            {totalFarmPopulation.toLocaleString()} <span className="text-xs font-semibold text-graphite-400 font-sans">birds</span>
          </p>
          <div className="mt-3 pt-2.5 border-t border-graphite-100 flex items-center justify-between text-xs">
            <span className="text-forest-800 font-bold">{totalFarmMales.toLocaleString()} Males</span>
            <span className="text-rose-700 font-semibold">{totalFarmFemales.toLocaleString()} Females</span>
          </div>
        </div>

        {/* Flock Livability */}
        <div 
          onClick={() => onNavigate('mortality')}
          className="cursor-pointer glass-card-interactive rounded-2xl p-5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-graphite-500 uppercase tracking-wider">Farm Livability %</span>
            <div className="p-2 bg-mint-50/90 text-mint-800 rounded-xl border border-mint-200 group-hover:bg-mint-100 transition-colors">
              <TrendingUp className="w-4 h-4 text-forest-700" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-forest-800 mt-2 tracking-tight">
            {typeof overallLivability === 'number' && !isNaN(overallLivability) ? overallLivability.toFixed(2) : '100.00'}%
          </p>
          <div className="mt-3 pt-2.5 border-t border-graphite-100 text-xs text-graphite-500 flex justify-between">
            <span>Total Depletions:</span>
            <strong className="text-rose-700 font-bold">-{(totalFarmDepletions || 0).toLocaleString()} birds</strong>
          </div>
        </div>

        {/* Daily Egg Volume */}
        <div 
          onClick={() => onNavigate('egg_production')}
          className="cursor-pointer glass-card-dark rounded-2xl p-5 group transition-all duration-200 hover:-translate-y-0.5 hover:border-mint-400/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-mint-300 uppercase tracking-wider">Today's Total Eggs</span>
            <div className="p-2 bg-gradient-to-br from-mint-400 to-emerald-500 text-forest-950 rounded-xl shadow-xs group-hover:scale-105 transition-transform">
              <Egg className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            {(totalEggsToday || 0).toLocaleString()} <span className="text-xs font-semibold text-mint-300 font-sans">eggs</span>
          </p>
          <div className="mt-3 pt-2.5 border-t border-forest-800/80 flex items-center justify-between text-xs">
            <span className="text-mint-400 font-bold">{(totalHEToday || 0).toLocaleString()} HE</span>
            <span className="text-graphite-300 font-semibold">{typeof avgHendayToday === 'number' && !isNaN(avgHendayToday) ? avgHendayToday.toFixed(1) : '0.0'}% Henday</span>
          </div>
        </div>

        {/* Active Houses */}
        <div 
          onClick={() => onNavigate('flock_list')}
          className="cursor-pointer glass-card-interactive rounded-2xl p-5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-graphite-500 uppercase tracking-wider">Production Houses</span>
            <div className="p-2 bg-graphite-100/80 text-graphite-700 rounded-xl group-hover:bg-graphite-200/80 transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-graphite-900 mt-2 tracking-tight">
            {flocks.length} <span className="text-xs font-semibold text-graphite-400 font-sans">Houses</span>
          </p>
          <div className="mt-3 pt-2.5 border-t border-graphite-100 text-xs text-graphite-500 flex justify-between">
            <span>Breeds:</span>
            <strong className="text-graphite-800 font-semibold">Cobb 500 & Ross 308</strong>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Productivity Trends Module */}
      <FlockProductivityDashboard onNavigateModule={onNavigate} />

      {/* Flock House Status Grid */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-graphite-900 font-display">Live House Production Roster</h3>
            <p className="text-xs text-graphite-500">Real-time age in weeks, livability, and male/female population</p>
          </div>
          {permissions.canAddFlock && (
            <button
              onClick={() => onNavigate('flock_list')}
              className="text-xs font-bold text-forest-800 hover:text-forest-950 uppercase tracking-wider cursor-pointer"
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
                className="cursor-pointer p-4.5 glass-card-interactive rounded-2xl space-y-3.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-forest-950 text-mint-300 font-extrabold text-xs shadow-2xs">
                      {flock.houseNumber}
                    </span>
                    <span className="text-xs font-bold text-graphite-800">{flock.breed}</span>
                  </div>
                  <span className="text-xs font-bold text-forest-800 glass-pill px-2.5 py-0.5 rounded-lg border border-forest-200/80" title={`Loading Date: ${flock.loadingDateFemale || flock.loadingDateMale} (${stats.totalDaysFromLoading || 0} days housed)`}>
                    Week {stats.ageWeeks} <span className="text-[10px] text-forest-600 font-semibold">(D{stats.ageDays || 1})</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="glass-pill p-2 rounded-xl">
                    <span className="text-[10px] text-forest-700 font-semibold block">Males</span>
                    <span className="font-extrabold text-graphite-900">{stats.currentMales}</span>
                  </div>
                  <div className="glass-pill p-2 rounded-xl">
                    <span className="text-[10px] text-rose-600 font-semibold block">Females</span>
                    <span className="font-extrabold text-graphite-900">{stats.currentFemales}</span>
                  </div>
                  <div className="glass-pill p-2 rounded-xl">
                    <span className="text-[10px] text-forest-700 font-semibold block">Livability</span>
                    <span className="font-extrabold text-forest-800">
                      {typeof stats.livabilityPct === 'number' && !isNaN(stats.livabilityPct) ? stats.livabilityPct.toFixed(1) : '100.0'}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-graphite-500 pt-0.5">
                  <span>M:F Ratio: <strong className="text-graphite-800 font-semibold">{stats.maleToFemaleRatioStr}</strong></span>
                  <span className="text-forest-700 font-bold group-hover:text-forest-950 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                    Open Station →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h3 className="text-xs font-bold text-graphite-400 uppercase tracking-wider mb-3 font-display">
          Quick Operational Modules
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('egg_production')}
            className="p-4 glass-card-interactive rounded-2xl text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-forest-50/90 text-forest-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-forest-100">
              <Egg className="w-4 h-4 text-forest-700" />
            </div>
            <p className="font-bold text-xs text-graphite-900">Egg Grading</p>
            <p className="text-[10px] text-graphite-500 mt-0.5 truncate">HE / NHE / Messenger</p>
          </button>

          <button
            onClick={() => onNavigate('flockman_module')}
            className="p-4 glass-card-interactive rounded-2xl text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-forest-50/90 text-forest-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-forest-100">
              <Layers className="w-4 h-4 text-forest-700" />
            </div>
            <p className="font-bold text-xs text-graphite-900">Flockman's Station</p>
            <p className="text-[10px] text-graphite-500 mt-0.5 truncate">Pens & Daily Feeds</p>
          </button>

          <button
            onClick={() => onNavigate('feed_inventory')}
            className="p-4 glass-card-interactive rounded-2xl text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-forest-50/90 text-forest-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-forest-100">
              <Wheat className="w-4 h-4 text-forest-700" />
            </div>
            <p className="font-bold text-xs text-graphite-900">Feed Silos</p>
            <p className="text-[10px] text-graphite-500 mt-0.5 truncate">Stock & Consumption</p>
          </button>

          <button
            onClick={() => onNavigate('mortality')}
            className="p-4 glass-card-interactive hover:border-rose-300 rounded-2xl text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-rose-100">
              <Skull className="w-4 h-4" />
            </div>
            <p className="font-bold text-xs text-graphite-900">Depletions</p>
            <p className="text-[10px] text-graphite-500 mt-0.5 truncate">Mortality & Culls</p>
          </button>

          <button
            onClick={() => onNavigate('medicine')}
            className="p-4 glass-card-interactive rounded-2xl text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-forest-50/90 text-forest-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-forest-100">
              <Syringe className="w-4 h-4 text-forest-700" />
            </div>
            <p className="font-bold text-xs text-graphite-900">Vaccine & Meds</p>
            <p className="text-[10px] text-graphite-500 mt-0.5 truncate">Immunization logs</p>
          </button>

          <button
            onClick={() => onNavigate('body_weight')}
            className="p-4 glass-card-interactive rounded-2xl text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-forest-50/90 text-forest-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-forest-100">
              <Scale className="w-4 h-4 text-forest-700" />
            </div>
            <p className="font-bold text-xs text-graphite-900">Body Weight</p>
            <p className="text-[10px] text-graphite-500 mt-0.5 truncate">Standard vs Actual</p>
          </button>
        </div>
      </div>
    </div>
  );
};
