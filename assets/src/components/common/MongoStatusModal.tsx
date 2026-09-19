import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  X, 
  Database, 
  Radio, 
  Smartphone, 
  Activity, 
  Zap, 
  ShieldCheck, 
  Check, 
  Globe, 
  Layers, 
  RefreshCw, 
  ExternalLink, 
  Server, 
  Cpu, 
  AlertCircle,
  Copy
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { 
  getNeonStatus, 
  syncAllDataToNeon, 
  pullAllDataFromNeon, 
  initNeonTables, 
  testNeonConnection,
  NeonSyncStatus 
} from '../../services/neonSync';

interface MongoStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MongoStatusModal: React.FC<MongoStatusModalProps> = ({ isOpen, onClose }) => {
  const { 
    eggProductionRecords, 
    flocks, 
    feedConsumptionRecords, 
    depletions, 
    mongoStatus,
    farmProfile,
    feedStockEntries,
    transfers,
    medProducts,
    medStockLogs,
    users
  } = useFarm();

  const [activeTab, setActiveTab] = useState<'neon' | 'mongo'>('neon');
  const [neonStatus, setNeonStatus] = useState<NeonSyncStatus | null>(null);
  const [isLoadingNeon, setIsLoadingNeon] = useState(false);
  const [syncingNeon, setSyncingNeon] = useState(false);
  const [initingTables, setInitingTables] = useState(false);
  const [customConnString, setCustomConnString] = useState('');
  const [neonMessage, setNeonMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);

  // Fetch Neon status when modal opens or active tab switches to neon
  useEffect(() => {
    if (isOpen) {
      loadNeonStatus();
    }
  }, [isOpen, activeTab]);

  const loadNeonStatus = async () => {
    setIsLoadingNeon(true);
    try {
      const status = await getNeonStatus();
      setNeonStatus(status);
    } catch {
      // ignore
    } finally {
      setIsLoadingNeon(false);
    }
  };

  const handleTestNeon = async () => {
    setIsLoadingNeon(true);
    setNeonMessage(null);
    try {
      const res = await testNeonConnection(customConnString.trim() || undefined);
      setNeonStatus(res.status);
      setNeonMessage({
        text: res.message,
        type: res.success ? 'success' : 'error',
      });
    } catch (err: any) {
      setNeonMessage({
        text: err?.message || 'Failed to connect to Neon PostgreSQL',
        type: 'error',
      });
    } finally {
      setIsLoadingNeon(false);
    }
  };

  const handleInitNeonTables = async () => {
    setInitingTables(true);
    setNeonMessage(null);
    try {
      const res = await initNeonTables();
      setNeonMessage({
        text: res.message || 'Neon tables created successfully!',
        type: res.success ? 'success' : 'error',
      });
      await loadNeonStatus();
    } catch (err: any) {
      setNeonMessage({
        text: err?.message || 'Failed to initialize tables in Neon',
        type: 'error',
      });
    } finally {
      setInitingTables(false);
    }
  };

  const handleSyncToNeon = async () => {
    setSyncingNeon(true);
    setNeonMessage(null);
    try {
      const payload = {
        farmProfile,
        flocks,
        eggRecords: eggProductionRecords,
        feedRecords: feedConsumptionRecords,
        depletions,
        feedStock: feedStockEntries,
        transfers,
        medProducts,
        medStockLogs,
        settings: {
          currency: farmProfile?.currency,
          facilityHousesCount: farmProfile?.facilityHousesCount,
          totalBirdCapacity: farmProfile?.totalBirdCapacity,
          dailyEggCapacity: farmProfile?.dailyEggCapacity,
          farmOverviewNotes: farmProfile?.farmOverviewNotes,
        },
        standards: {
          standardVaccinationProgram: farmProfile?.standardVaccinationProgram,
          standardFeedGuide: farmProfile?.standardFeedGuide,
          standardHenday: farmProfile?.standardHenday,
          standardBodyWeights: farmProfile?.standardBodyWeights,
          standardEggWeights: farmProfile?.standardEggWeights,
        },
        users,
      };
      const res = await syncAllDataToNeon(payload);
      setNeonMessage({
        text: `Sync complete! Synced ${res.counts?.egg_collections || 0} egg logs, ${res.counts?.flocks || 0} flocks to Neon.`,
        type: 'success',
      });
      await loadNeonStatus();
    } catch (err: any) {
      setNeonMessage({
        text: err?.message || 'Sync failed',
        type: 'error',
      });
    } finally {
      setSyncingNeon(false);
    }
  };

  const copyEnvSnippet = () => {
    const text = 'DATABASE_URL="postgresql://user:pass@ep-cool-pond-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"';
    navigator.clipboard.writeText(text);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  if (!isOpen) return null;

  const isMongoConnected = mongoStatus?.connected;
  const mongoDbName = mongoStatus?.dbName || 'farmflow_db';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600/10 via-teal-500/10 to-transparent border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">Farm Database Hub</h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                  Cloud Persistent
                </span>
              </div>
              <p className="text-xs text-slate-500">Connect to Neon Serverless PostgreSQL (Netlify) or MongoDB Atlas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('neon')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'neon'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Neon PostgreSQL (Netlify Partner)</span>
            <span className={`w-2 h-2 rounded-full ${neonStatus?.connected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mongo')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'mongo'
                ? 'border-emerald-600 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>MongoDB Atlas</span>
            <span className={`w-2 h-2 rounded-full ${isMongoConnected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {neonMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                neonMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : neonMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <span>{neonMessage.text}</span>
              <button
                type="button"
                onClick={() => setNeonMessage(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'neon' ? (
            /* ========================================================
               NEON POSTGRESQL VIEW
               ======================================================== */
            <div className="space-y-4">
              {/* Connection Status Card */}
              <div className="p-4 bg-gradient-to-br from-emerald-50/70 via-teal-50/50 to-emerald-50/70 border border-emerald-300/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      {neonStatus?.connected && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${neonStatus?.connected ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      {neonStatus?.connected ? 'Neon PostgreSQL Connected' : 'Neon PostgreSQL Ready'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                      Serverless SQL
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={loadNeonStatus}
                      disabled={isLoadingNeon}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingNeon ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-500 block font-medium">Database</span>
                    <span className="font-bold text-slate-900 truncate block">
                      {neonStatus?.database || 'neondb'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-500 block font-medium">Latency</span>
                    <span className="font-bold text-emerald-800">
                      {neonStatus?.latencyMs !== undefined ? `${neonStatus.latencyMs} ms` : 'Standby'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-500 block font-medium">Tables in Schema</span>
                    <span className="font-bold text-slate-900">
                      {neonStatus?.tablesCount !== undefined ? `${neonStatus.tablesCount} tables` : '0 tables'}
                    </span>
                  </div>
                </div>

                {neonStatus?.error && (
                  <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Connection Notice:</strong> {neonStatus.error}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons for Neon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleInitNeonTables}
                  disabled={initingTables}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Layers className={`w-3.5 h-3.5 ${initingTables ? 'animate-pulse' : ''}`} />
                  <span>{initingTables ? 'Creating Tables...' : 'Initialize SQL Tables'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncToNeon}
                  disabled={syncingNeon}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingNeon ? 'animate-spin' : ''}`} />
                  <span>{syncingNeon ? 'Syncing to Neon...' : 'Sync Farm Data to Neon'}</span>
                </button>
              </div>

              {/* Netlify + Neon Setup Guide */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-slate-900">Netlify Neon Integration Steps</span>
                  </div>
                  <a
                    href="https://neon.tech"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>neon.tech</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4 leading-relaxed">
                  <li>
                    In your <strong>Netlify Dashboard</strong>, select this site and click <strong>Site configuration &gt; Integrations &gt; Neon</strong>.
                  </li>
                  <li>
                    Click <strong>Install / Connect</strong>. Netlify will provision your serverless PostgreSQL database and automatically inject the <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">DATABASE_URL</code> environment variable.
                  </li>
                  <li>
                    Click <strong>"Initialize SQL Tables"</strong> above to auto-generate the farm tables and indexes.
                  </li>
                </ol>

                <div className="pt-1 flex items-center justify-between gap-2 p-2 bg-slate-100 rounded-xl text-[11px] font-mono text-slate-700">
                  <span className="truncate">DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require</span>
                  <button
                    type="button"
                    onClick={copyEnvSnippet}
                    className="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 shrink-0 font-sans text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedEnv ? 'Copied!' : 'Copy Format'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================
               MONGODB ATLAS VIEW
               ======================================================== */
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-emerald-600/5 border border-emerald-300/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      {isMongoConnected ? 'MongoDB Connected & Active' : 'MongoDB Ready'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-700" />
                      Direct Connection
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 font-bold text-[10px] font-mono">
                      DB: {mongoDbName}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-emerald-100">
                    <Smartphone className="w-4 h-4 text-teal-700 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Database Host</span>
                      <span className="font-bold text-slate-900">MongoDB Central Cluster</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-emerald-100">
                    <Activity className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Connection Status</span>
                      <span className="font-bold text-emerald-800">Connected & Live</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white/90 rounded-xl border border-emerald-200/80 text-[11px] text-slate-600 leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Direct Database Persistence</span>
                  </div>
                  <p>
                    All data is synchronized and saved directly to your MongoDB cluster across workstations and mobile devices.
                  </p>
                </div>
              </div>

              {/* Records summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">Egg Harvests</span>
                  <span className="text-sm font-extrabold text-slate-900">{eggProductionRecords.length}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">Flocks</span>
                  <span className="text-sm font-extrabold text-slate-900">{flocks.length}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">Feed Consumed</span>
                  <span className="text-sm font-extrabold text-slate-900">{feedConsumptionRecords.length}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">Mortality Logs</span>
                  <span className="text-sm font-extrabold text-slate-900">{depletions.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Active View: {activeTab === 'neon' ? 'Neon PostgreSQL (Serverless)' : 'MongoDB Atlas'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export const DatabaseStatusModal = MongoStatusModal;
export const FirebaseStatusModal = MongoStatusModal;
