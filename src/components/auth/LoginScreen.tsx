import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { UserRole } from '../../types';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  HelpCircle,
  UserPlus
} from 'lucide-react';

interface LoginScreenProps {
  onRegisterClick?: () => void;
  onForgotPasswordClick?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onRegisterClick,
  onForgotPasswordClick 
}) => {
  const { login, farmProfile, users, switchUserRole, dbStatus } = useFarm();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('pass123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message);
      } else {
        setSuccessMessage(`Authenticated successfully. Loading ${res.user?.fullName || 'dashboard'}...`);
      }
    }, 450);
  };

  const handleQuickPersonaSelect = (roleName: UserRole) => {
    const matched = users.find(u => u.role === roleName && u.status === 'active');
    if (matched) {
      setUsername(matched.username);
      setPassword('pass123');
    } else {
      switchUserRole(roleName);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-forest-950 via-slate-900 to-forest-900 flex flex-col justify-between text-graphite-100 font-sans selection:bg-mint-400 selection:text-forest-950">
      {/* Top Header Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-forest-800/40 backdrop-blur-md bg-forest-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mint-400 text-forest-950 flex items-center justify-center font-black text-xl shadow-lg shadow-mint-400/20">
            FF
          </div>
          <div>
            <span className="font-black text-white text-base tracking-tight block">
              {farmProfile.name || 'FarmFlow Pro'}
            </span>
            <span className="text-[11px] text-mint-400/90 font-medium">
              Broiler-Breeder Management System
            </span>
          </div>
        </div>

        {/* Database Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-900/80 border border-forest-800/80 text-xs">
          <Database className={`w-3.5 h-3.5 ${dbStatus.connected ? 'text-mint-400' : 'text-amber-400'}`} />
          <span className="text-[11px] text-slate-300 hidden sm:inline">Database:</span>
          <span className={`text-[11px] font-bold ${dbStatus.connected ? 'text-mint-300' : 'text-amber-300'}`}>
            {dbStatus.connected ? 'Cloud Connected' : 'Local Standby'}
          </span>
          <span className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-mint-400 animate-pulse' : 'bg-amber-400'}`}></span>
        </div>
      </header>

      {/* Center Login Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
          
          {/* Card Header */}
          <div className="bg-forest-950 p-6 sm:p-8 text-white relative">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-forest-900/90 border border-forest-800 text-[11px] text-mint-300 font-semibold mb-3">
              <Lock className="w-3.5 h-3.5 text-mint-400" />
              <span>Biosecure Farm Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Sign In
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Enter your authorized staff credentials to access your farm house records.
            </p>
          </div>

          {/* Form Body */}
          <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-5">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Access Denied</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-1.5">
              <label htmlFor="login-username-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Username or Staff ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., admin, flockman1, manager"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-forest-600 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                {onForgotPasswordClick && (
                  <button
                    type="button"
                    onClick={onForgotPasswordClick}
                    className="text-xs text-forest-700 hover:text-forest-900 font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-forest-600 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-slate-300 text-forest-700 focus:ring-forest-600"
                />
                <span className="font-medium">Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-forest-800 hover:bg-forest-900 active:bg-forest-950 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to FarmFlow</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Credentials Panel */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Quick Staff Credentials:
                </span>
                <span className="text-[10px] text-slate-400">Click to autofill</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { role: 'System Administrator' as UserRole, label: 'Admin (Full Access)', user: 'admin' },
                  { role: 'Farm Manager' as UserRole, label: 'Farm Manager', user: 'manager' },
                  { role: 'Flockman' as UserRole, label: 'Flockman (House 1)', user: 'flockman1' },
                  { role: 'Egg Collector' as UserRole, label: 'Egg Collector', user: 'collector1' },
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleQuickPersonaSelect(item.role)}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-slate-800 transition hover:border-slate-300"
                  >
                    <p className="font-bold text-[11px] text-forest-900 truncate">{item.label}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">u: {item.user} / p: pass123</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Register Option */}
            {onRegisterClick && (
              <div className="pt-2 text-center text-xs text-slate-600">
                <span>Don't have staff credentials? </span>
                <button
                  type="button"
                  onClick={onRegisterClick}
                  className="font-bold text-forest-800 hover:text-forest-950 hover:underline inline-flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register for Staff Access</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="px-6 py-3 border-t border-forest-800/40 bg-forest-950/60 text-center text-[11px] text-slate-400">
        <p>© {new Date().getFullYear()} {farmProfile.name || 'FarmFlow Pro'} — Broiler-Breeder Management Platform. All records secured.</p>
      </footer>
    </div>
  );
};
