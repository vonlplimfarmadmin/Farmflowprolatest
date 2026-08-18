import React, { useState } from 'react';
import { FarmProvider, useFarm } from './context/FarmContext';
import { ModuleType, UserRole } from './types';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { AuthModals } from './components/auth/AuthModals';
import { LoginScreen } from './components/auth/LoginScreen';
import { MessengerReportQuickModal } from './components/layout/MessengerReportQuickModal';

// Views
import { FarmDashboardOverview } from './components/dashboard/FarmDashboardOverview';
import { FarmProfileView } from './components/farmProfile/FarmProfileView';
import { FeedInventoryView } from './components/feed/FeedInventoryView';
import { FlockListView } from './components/flock/FlockListView';
import { FlockmanModuleView } from './components/flockman/FlockmanModuleView';
import { MortalityManagementView } from './components/mortality/MortalityManagementView';
import { MedicineVaccineView } from './components/medicine/MedicineVaccineView';
import { BodyWeightView } from './components/bodyWeight/BodyWeightView';
import { EggProductionView } from './components/eggProduction/EggProductionView';
import { SettingsView } from './components/settings/SettingsView';
import { RoleBadge } from './components/common/RoleBadge';
import { Shield, Sparkles, UserCheck, AlertCircle } from 'lucide-react';

const FarmAppContent: React.FC = () => {
  const { currentUser, switchUserRole, permissions, users } = useFarm();
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot' | null>(null);
  const [isMessengerReportOpen, setIsMessengerReportOpen] = useState(false);

  // If no user is logged in, present full-page LoginScreen
  if (!currentUser) {
    return (
      <>
        <LoginScreen
          onRegisterClick={() => setAuthModalMode('register')}
          onForgotPasswordClick={() => setAuthModalMode('forgot')}
        />
        <AuthModals
          mode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSwitchMode={setAuthModalMode}
        />
      </>
    );
  }

  // If user is pending approval or disabled
  const isPendingApproval = currentUser.status === 'pending';
  const isDisabled = currentUser.status === 'disabled';

  return (
    <div className="min-h-screen bg-graphite-50 flex flex-col font-sans text-graphite-900 antialiased selection:bg-mint-400 selection:text-forest-950">
      {/* Top Demo Helper Bar: Fast Role Switching for Preview / Testing */}
      <div className="bg-forest-950 text-graphite-300 border-b border-forest-900/60 text-xs py-1.5 px-4 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-mint-400" />
          <span className="text-mint-400/80 font-semibold hidden sm:inline text-[11px] uppercase tracking-wider">Role Preview:</span>
          <span className="font-bold text-white flex items-center gap-1.5 text-xs">
            <span>Active:</span>
            {currentUser && <RoleBadge role={currentUser.role} size="sm" />}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[10px] text-mint-400/80 font-bold uppercase tracking-wider hidden md:inline">Switch Persona:</span>
          {(['System Administrator', 'Farm Manager', 'Flockman', 'Leadman', 'Egg Collector'] as UserRole[]).map((role) => (
            <button
              key={role}
              onClick={() => switchUserRole(role)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                currentUser?.role === role
                  ? 'bg-mint-400 text-forest-950 shadow-xs ring-1 ring-mint-300'
                  : 'bg-forest-900/80 hover:bg-forest-800 text-mint-100 border border-forest-800'
              }`}
            >
              {role.replace('System ', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Main App Navigation Bar */}
      <Navbar
        currentModule={activeModule}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenReport={() => setIsMessengerReportOpen(true)}
        onOpenLogin={() => setAuthModalMode('login')}
        onOpenRegister={() => setAuthModalMode('register')}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Navigation */}
        <Sidebar
          currentModule={activeModule}
          onSelectModule={(mod) => {
            setActiveModule(mod as ModuleType);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenReport={() => setIsMessengerReportOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {isPendingApproval ? (
            <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-amber-200 shadow-lg text-center space-y-4 animate-fadeIn">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Account Pending Administrator Approval</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your registration was submitted successfully. Per farm biosecurity and compliance protocol, a <strong>System Administrator</strong> must approve your account before access is granted.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => switchUserRole('System Administrator')}
                  className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-mint-300 rounded-xl text-xs font-bold transition shadow-xs border border-forest-700"
                >
                  Switch to Administrator to Approve
                </button>
              </div>
            </div>
          ) : isDisabled ? (
            <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-rose-200 shadow-lg text-center space-y-4 animate-fadeIn">
              <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-rose-950">Account Deactivated</h2>
              <p className="text-xs text-slate-600">
                This account has been disabled by the farm administrator. Please contact system management.
              </p>
            </div>
          ) : (
            <>
              {activeModule === 'dashboard' && (
                <FarmDashboardOverview 
                  onNavigate={setActiveModule} 
                  onOpenMessengerReport={() => setIsMessengerReportOpen(true)} 
                />
              )}
              {activeModule === 'farm_profile' && <FarmProfileView />}
              {activeModule === 'feed_inventory' && <FeedInventoryView />}
              {(activeModule === 'flock_list' || (activeModule as string) === 'flock') && <FlockListView />}
              {(activeModule === 'flockman_module' || (activeModule as string) === 'flockman') && <FlockmanModuleView />}
              {activeModule === 'mortality' && <MortalityManagementView />}
              {activeModule === 'medicine' && <MedicineVaccineView />}
              {activeModule === 'body_weight' && <BodyWeightView />}
              {activeModule === 'egg_production' && <EggProductionView />}
              {activeModule === 'settings' && <SettingsView />}
            </>
          )}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigate={setActiveModule}
      />

      <MessengerReportQuickModal
        isOpen={isMessengerReportOpen}
        onClose={() => setIsMessengerReportOpen(false)}
      />

      <AuthModals
        mode={authModalMode}
        onClose={() => setAuthModalMode(null)}
        onSwitchMode={setAuthModalMode}
      />
    </div>
  );
};

export default function App() {
  return (
    <FarmProvider>
      <FarmAppContent />
    </FarmProvider>
  );
}
