import React, { useState } from 'react';
import { 
  CheckCircle2, 
  X, 
  Database, 
  Smartphone, 
  Activity, 
  Zap, 
  ShieldCheck, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  AlertCircle,
  Copy,
  Server,
  Download,
  CloudUpload
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';

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
    syncAllToMongoDB,
    pullAllFromMongoDB,
    checkDBStatus
  } = useFarm();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!isOpen) return null;

  const isConnected = mongoStatus?.connected;
  const dbName = mongoStatus?.dbName || 'farmflow_db';

  const handleManualSync = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res = await syncAllToMongoDB();
      setStatusMessage({
        text: res.message || 'All farm collections successfully saved to MongoDB.',
        type: res.success ? 'success' : 'error',
      });
      await checkDBStatus();
    } catch (err: any) {
      setStatusMessage({
        text: err?.message || 'Failed to sync with MongoDB.',
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualPull = async () => {
    setIsPulling(true);
    setStatusMessage(null);
    try {
      const res = await pullAllFromMongoDB();
      setStatusMessage({
        text: res.message || 'All farm records refreshed from MongoDB.',
        type: res.success ? 'success' : 'error',
      });
      await checkDBStatus();
    } catch (err: any) {
      setStatusMessage({
        text: err?.message || 'Failed to pull records from MongoDB.',
        type: 'error',
      });
    } finally {
      setIsPulling(false);
    }
  };

  const copyEnvVar = () => {
    const text = 'MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/farmflowproviii?retryWrites=true&w=majority"';
    navigator.clipboard.writeText(text);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600/10 via-teal-500/10 to-transparent border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">MongoDB Central Database</h3>
                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-wider ${
                  isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isConnected ? 'Live Connected' : 'Connecting'}
                </span>
              </div>
              <p className="text-xs text-slate-500">Real-time persistence for all farm records, flocks, and inventory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <span>{statusMessage.text}</span>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Connection Status Card */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-50/80 border border-emerald-300/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {isConnected && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                </span>
                <span className="text-xs font-extrabold text-slate-900">
                  {isConnected ? 'MongoDB Active & Synchronized' : 'MongoDB Initializing'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-700" />
                  Direct Real-Time
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 font-bold text-[10px] font-mono">
                DB: {dbName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2.5 p-2.5 bg-white/80 rounded-xl border border-emerald-100">
                <Server className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Cluster Host</span>
                  <span className="font-bold text-slate-900">{mongoStatus?.serverInfo || 'MongoDB Production Cluster'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 bg-white/80 rounded-xl border border-emerald-100">
                <Activity className="w-4 h-4 text-teal-700 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block font-medium">Last Cloud Sync</span>
                  <span className="font-bold text-emerald-800">
                    {mongoStatus?.lastSyncedAt ? new Date(mongoStatus.lastSyncedAt).toLocaleTimeString() : 'Active Continuous'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white/90 rounded-xl border border-emerald-200/80 text-[11px] text-slate-600 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Zero Data Loss Real-Time Mirroring</span>
              </div>
              <p>
                Every egg collection, mortality entry, and feed delivery is automatically synced directly to your MongoDB Atlas database.
              </p>
            </div>
          </div>

          {/* Sync & Pull Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'Saving to MongoDB...' : 'Sync All Data to MongoDB'}</span>
            </button>

            <button
              type="button"
              onClick={handleManualPull}
              disabled={isPulling}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
              <span>{isPulling ? 'Pulling from MongoDB...' : 'Pull Latest from MongoDB'}</span>
            </button>
          </div>

          {/* Records Summary */}
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
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Feed Logs</span>
              <span className="text-sm font-extrabold text-slate-900">{feedConsumptionRecords.length}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Mortality Logs</span>
              <span className="text-sm font-extrabold text-slate-900">{depletions.length}</span>
            </div>
          </div>

          {/* Netlify Deployment Notice */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Netlify Deployment Configuration</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Serverless Functions Ready
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When deploying to Netlify, set your MongoDB connection string in <strong>Netlify Dashboard &gt; Site configuration &gt; Environment variables</strong>:
            </p>
            <div className="flex items-center justify-between gap-2 p-2 bg-slate-100 rounded-xl text-[11px] font-mono text-slate-700">
              <span className="truncate">MONGODB_URI=mongodb+srv://...</span>
              <button
                type="button"
                onClick={copyEnvVar}
                className="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 shrink-0 font-sans text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedEnv ? 'Copied!' : 'Copy Key'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Engine: MongoDB Atlas Persistent Storage</span>
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
