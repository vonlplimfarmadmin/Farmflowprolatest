import React from 'react';
import { useFarm } from '../../context/FarmContext';
import { 
  Building2, 
  Wheat, 
  Bird, 
  Grid2X2, 
  Skull, 
  Syringe, 
  Scale, 
  Egg, 
  Settings, 
  ShieldAlert, 
  FileSpreadsheet,
  LayoutDashboard,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentModule: string;
  onSelectModule: (moduleId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenReport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  isOpen,
  onClose,
  onOpenReport
}) => {
  const { currentUser, permissions, getLowStockAlerts, getUpcomingVaccines, users, farmProfile, logout } = useFarm();

  const lowFeeds = getLowStockAlerts();
  const upcomingVaccines = getUpcomingVaccines();
  const pendingUsers = users.filter(u => u.status === 'pending');

  const managementItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      sublabel: 'Operations Overview',
      icon: LayoutDashboard,
      visible: true,
      badge: null
    },
    {
      id: 'flock_list',
      label: 'Flock Profile',
      sublabel: 'Houses, Breed, Livability',
      icon: Bird,
      visible: permissions.canViewModule('flock_list') || permissions.canViewModule('flock'),
      badge: null
    },
    {
      id: 'feed_inventory',
      label: 'Feed Inventory',
      sublabel: 'CSC, CGC, BLC, BMCC Stocks',
      icon: Wheat,
      visible: permissions.canViewModule('feed_inventory'),
      badge: lowFeeds.length > 0 ? `${lowFeeds.length} Low` : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'mortality',
      label: 'Mortality Log',
      sublabel: 'Culls, Missex, Depletions',
      icon: Skull,
      visible: permissions.canViewModule('mortality'),
      badge: null
    }
  ];

  const productionItems = [
    {
      id: 'egg_production',
      label: 'Egg Production',
      sublabel: 'HE, NHE, Daily Logs & Messenger',
      icon: Egg,
      visible: permissions.canViewModule('egg_production'),
      badge: null
    },
    {
      id: 'flockman_module',
      label: 'Flockman\'s Module',
      sublabel: 'Side & Pen Feed / Depletion',
      icon: Grid2X2,
      visible: permissions.canViewModule('flockman_module') || permissions.canViewModule('flockman'),
      badge: null
    },
    {
      id: 'body_weight',
      label: 'Body Weight Log',
      sublabel: 'Weekly Weights & Growth Curve',
      icon: Scale,
      visible: permissions.canViewModule('body_weight'),
      badge: null
    },
    {
      id: 'medicine',
      label: 'Vaccine Schedule',
      sublabel: 'Health Logs & Schedule Alert',
      icon: Syringe,
      visible: permissions.canViewModule('medicine'),
      badge: upcomingVaccines.length > 0 ? `${upcomingVaccines.length} Due` : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold'
    }
  ];

  const systemItems = [
    {
      id: 'farm_profile',
      label: 'Farm Profile & Standards',
      sublabel: 'Vaccine, Feed & Henday Standard',
      icon: Building2,
      visible: permissions.canViewModule('farm_profile'),
      badge: null
    },
    {
      id: 'settings',
      label: 'Settings & Audit Logs',
      sublabel: 'User Access, Approvals & Logs',
      icon: Settings,
      visible: permissions.canViewModule('settings'),
      badge: currentUser?.role === 'admin' && pendingUsers.length > 0 ? `${pendingUsers.length} New` : null,
      badgeColor: 'bg-teal-400 text-teal-950 font-bold'
    }
  ];

  const renderNavGroup = (title: string, items: typeof managementItems) => {
    const visibleGroup = items.filter(i => i.visible);
    if (visibleGroup.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="px-6 mb-2 text-[10px] font-bold text-mint-400/90 uppercase tracking-widest">
          {title}
        </div>
        <div className="space-y-0.5">
          {visibleGroup.map(item => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  onSelectModule(item.id);
                  onClose();
                }}
                className={`w-full text-left flex items-center justify-between px-6 py-2.5 transition-colors group ${
                  isActive
                    ? 'bg-forest-900 text-mint-300 border-r-4 border-mint-400 font-bold'
                    : 'text-graphite-300 hover:bg-forest-900/60 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-mint-400' : 'text-mint-400/60 group-hover:text-mint-300'}`} />
                  <span className="text-xs truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-graphite-950/70 z-30 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-30 w-64 bg-forest-950 text-white flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } border-r border-forest-900/60 shadow-2xl lg:shadow-none select-none`}
      >
        {/* Farm Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-forest-900/60">
          {farmProfile.logoUrl ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/95 p-0.5 shadow-md shadow-mint-500/20 shrink-0 border border-forest-800 flex items-center justify-center">
              <img
                src={farmProfile.logoUrl}
                alt={farmProfile.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-mint-400 text-forest-950 rounded-xl flex items-center justify-center font-black text-lg italic shadow-md shadow-mint-500/20 shrink-0">
              FF
            </div>
          )}
          <div className="leading-tight min-w-0">
            <h1 className="font-bold text-sm text-white tracking-tight truncate">
              FarmFlow Pro
            </h1>
            <p className="text-[10px] text-mint-400 uppercase tracking-widest font-semibold truncate">
              {farmProfile.name.split(' ')[0] || 'L.P. LIM'} Operations
            </p>
          </div>
        </div>

        {/* Assigned Houses Indicator */}
        {currentUser && (
          <div className="px-6 py-2.5 bg-forest-900/40 border-b border-forest-900/60 text-[11px] flex items-center justify-between">
            <span className="text-mint-400/80 font-medium">Assigned Scope:</span>
            <span className="font-bold text-mint-100 truncate ml-2">
              {currentUser.role === 'admin' || currentUser.role === 'farm_manager' || currentUser.role === 'System Administrator' || currentUser.role === 'Farm Manager'
                ? 'All Houses (1-6)' 
                : currentUser.designatedHouses.join(', ')}
            </span>
          </div>
        )}

        {/* Navigation Groups */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-forest-900">
          {renderNavGroup('Management', managementItems)}
          {renderNavGroup('Production', productionItems)}
          {renderNavGroup('System & Compliance', systemItems)}

          {/* Quick Action: Messenger Report */}
          <div className="px-6 pt-2 pb-4">
            <button
              onClick={() => {
                onOpenReport();
                onClose();
              }}
              className="w-full py-2.5 bg-mint-400 hover:bg-mint-300 active:scale-98 text-forest-950 rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Messenger Report</span>
            </button>
          </div>
        </nav>

        {/* User Card in Footer */}
        <div className="p-4 border-t border-forest-900/60 space-y-2">
          <div className="flex items-center gap-3 p-3 bg-forest-900/40 rounded-xl border border-forest-900/80">
            <div className="w-8 h-8 rounded-full bg-mint-400 text-forest-950 flex items-center justify-center text-xs font-bold uppercase shrink-0">
              {currentUser?.username ? currentUser.username.substring(0, 2).toUpperCase() : 'SA'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser?.fullName || 'Admin User'}
              </p>
              <p className="text-[10px] text-mint-400 truncate uppercase font-medium">
                {currentUser?.role ? currentUser.role.replace('_', ' ') : 'Systems Administrator'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full py-2 px-3 bg-forest-900/80 hover:bg-rose-900/30 text-rose-300 hover:text-rose-200 border border-forest-800 hover:border-rose-700/50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
