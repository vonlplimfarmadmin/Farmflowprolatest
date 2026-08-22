import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { Database, RefreshCw, CheckCircle2, AlertCircle, HardDrive, Copy, Check, X, CloudUpload, Smartphone } from 'lucide-react';

interface MongoStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MongoStatusModal: React.FC<MongoStatusModalProps> = ({ isOpen, onClose }) => {
  const { dbStatus, isMobileDevice, checkDBStatus, reconnectDB, syncAllToMongoDB, pullAllFromMongoDB } = useFarm();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [customUriInput, setCustomUriInput] = useState('');
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [pullResult, setPullResult] = useState<{ success: boolean; message: string } | null>(null);
  const [connectResult, setConnectResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [copiedExample, setCopiedExample] = useState(false);

  if (!isOpen) return null;

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncAllToMongoDB();
      setSyncResult(res);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePull = async () => {
    setIsPulling(true);
    setPullResult(null);
    try {
      const res = await pullAllFromMongoDB();
      setPullResult(res);
      await checkDBStatus();
    } finally {
      setIsPulling(false);
    }
  };

  const handleRefresh = async () => {
    setIsConnecting(true);
    setConnectResult(null);
    try {
      const res = await reconnectDB(customUriInput.trim() || undefined);
      setConnectResult(res);
      await checkDBStatus();
    } finally {
      setIsConnecting(false);
    }
  };

  const sampleUri = `mongodb+srv://vonlplimfarm_db_user:kv5FvZZDssnVJ0Vk@farmflowv3.qlbn8c1.mongodb.net/farmflow_db?retryWrites=true&w=majority`;

  const handleCopyExample = () => {
    navigator.clipboard.writeText(sampleUri);
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-graphite-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-forest-950 p-5 text-white flex items-center justify-between shrink-0 border-b border-forest-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-mint-500 text-forest-950 rounded-xl shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">MongoDB Enterprise Database</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-mint-400/20 text-mint-300 border border-mint-400/30">
                  Auto Active
                </span>
              </div>
              <p className="text-[11px] text-mint-300/90 font-medium">Auto Database for Mobile Devices & Cloud Sync</p>
            </div>
          </div>
          <button onClick={onClose} className="text-graphite-400 hover:text-white p-1 rounded-lg transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-graphite-700">
          {/* Mobile Auto Routing Banner */}
          <div className="p-3.5 bg-forest-900 text-white rounded-2xl flex items-center justify-between gap-3 border border-forest-800">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-mint-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Mobile Auto Database: MongoDB</p>
                <p className="text-[10px] text-mint-200/90">
                  {isMobileDevice ? 'Mobile client detected — automatically routing to MongoDB.' : 'Configured as the primary cloud database engine for mobile & desktop.'}
                </p>
              </div>
            </div>
            <span className="px-2 py-1 bg-mint-400 text-forest-950 text-[10px] font-black rounded-lg shrink-0">
              Auto Mode
            </span>
          </div>

          {/* Status Card */}
          <div className={`p-4 rounded-2xl border ${
            dbStatus.connected 
              ? 'bg-mint-50/70 border-mint-200 text-forest-950' 
              : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {dbStatus.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-mint-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
                <div>
                  <p className="font-bold text-sm">
                    {dbStatus.connected ? 'Connected to MongoDB Atlas' : 'Local / Offline Cache Mode'}
                  </p>
                  <p className="text-[11px] opacity-80">
                    Status: <span className="font-semibold">{dbStatus.state}</span>
                    {dbStatus.dbName && ` • DB: ${dbStatus.dbName}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isConnecting}
                className="px-3 py-1.5 bg-white rounded-xl border border-graphite-200 hover:bg-graphite-50 transition shadow-2xs text-xs font-bold text-graphite-700 flex items-center gap-1.5 cursor-pointer"
                title="Connect or refresh status"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-graphite-600 ${isConnecting ? 'animate-spin' : ''}`} />
                <span>{isConnecting ? 'Connecting...' : 'Reconnect'}</span>
              </button>
            </div>

            {/* Connection error / IP Whitelist hint */}
            {!dbStatus.connected && (
              <div className="mt-3 p-3 bg-amber-50 text-amber-950 border border-amber-200/80 rounded-xl text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Atlas IP Whitelist Required (One-time setup):</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  MongoDB Atlas blocks cloud connections by default. To allow access:
                </p>
                <div className="bg-white/80 p-2 rounded-lg border border-amber-200 font-mono text-[10px] text-graphite-800">
                  1. Go to <strong>MongoDB Atlas</strong> → <strong>Security</strong> → <strong>Network Access</strong><br/>
                  2. Click <strong>Add IP Address</strong> → choose <strong>"Allow Access from Anywhere"</strong> (<code className="font-bold text-forest-800">0.0.0.0/0</code>)<br/>
                  3. Click <strong>Confirm</strong>, then click <strong>Reconnect</strong> above.
                </div>
              </div>
            )}

            {connectResult && !connectResult.success && (
              <div className="mt-2 p-2.5 bg-rose-100/90 text-rose-900 border border-rose-200 rounded-xl text-[11px]">
                <strong>Last Attempt:</strong> {connectResult.message}
              </div>
            )}

            {/* Counts if connected */}
            {dbStatus.connected && dbStatus.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-mint-200/60 text-center">
                <div className="bg-white/80 p-2 rounded-xl border border-mint-100">
                  <span className="block text-[10px] text-graphite-500 font-bold">Egg Logs</span>
                  <span className="text-sm font-extrabold text-forest-900">{dbStatus.stats.eggRecordsCount}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-mint-100">
                  <span className="block text-[10px] text-graphite-500 font-bold">Flocks</span>
                  <span className="text-sm font-extrabold text-forest-900">{dbStatus.stats.flocksCount}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-mint-100">
                  <span className="block text-[10px] text-graphite-500 font-bold">Feed Logs</span>
                  <span className="text-sm font-extrabold text-forest-900">{dbStatus.stats.feedRecordsCount}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-mint-100">
                  <span className="block text-[10px] text-graphite-500 font-bold">Mortality</span>
                  <span className="text-sm font-extrabold text-forest-900">{dbStatus.stats.depletionsCount ?? 0}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sync & Pull Controls */}
          <div className="p-4 bg-graphite-50 rounded-2xl border border-graphite-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CloudUpload className="w-4 h-4 text-forest-700" />
                <span className="font-bold text-graphite-900 text-xs">Cloud Database Operations</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePull}
                  disabled={isPulling || !dbStatus.connected}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border cursor-pointer ${
                    dbStatus.connected
                      ? 'bg-white hover:bg-mint-50 border-mint-200 text-forest-900 shadow-2xs'
                      : 'bg-graphite-200 text-graphite-400 border-graphite-200 cursor-not-allowed'
                  }`}
                  title="Pull records from MongoDB into this device"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                  <span>{isPulling ? 'Pulling...' : 'Pull Latest'}</span>
                </button>
                <button
                  onClick={handleSync}
                  disabled={isSyncing || !dbStatus.connected}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    dbStatus.connected
                      ? 'bg-forest-900 hover:bg-forest-850 text-white shadow-xs'
                      : 'bg-graphite-200 text-graphite-400 cursor-not-allowed'
                  }`}
                >
                  <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Pushing...' : 'Push to MongoDB'}</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-graphite-500 leading-relaxed">
              Synchronize all egg collections, flocks, feed logs, and mortality records between this device and MongoDB Atlas.
            </p>

            {syncResult && (
              <div className={`p-2.5 rounded-xl border text-xs font-medium ${
                syncResult.success 
                  ? 'bg-mint-50 border-mint-200 text-forest-900' 
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {syncResult.message}
              </div>
            )}

            {pullResult && (
              <div className={`p-2.5 rounded-xl border text-xs font-medium ${
                pullResult.success 
                  ? 'bg-mint-50 border-mint-200 text-forest-900' 
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {pullResult.message}
              </div>
            )}
          </div>

          {/* How to Connect instructions */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-forest-700" />
              <p className="font-bold text-graphite-900 text-xs">How to connect your MongoDB Database:</p>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-graphite-600 bg-graphite-50 p-3.5 rounded-2xl border border-graphite-200">
              <li>Create a cluster on <strong className="text-graphite-900">MongoDB Atlas</strong> (or local MongoDB instance).</li>
              <li>Under <strong>Database Access</strong>, create a user & password.</li>
              <li>Under <strong>Network Access</strong>, allow IP <code className="bg-white px-1 py-0.5 rounded border border-graphite-200">0.0.0.0/0</code>.</li>
              <li>Add the secret <code className="bg-white px-1 py-0.5 rounded font-bold text-forest-800 border border-graphite-200">MONGODB_URI</code> to your environment settings.</li>
            </ol>

            <div className="relative mt-2">
              <div className="p-3 bg-graphite-950 font-mono text-[11px] text-mint-300 rounded-xl border border-graphite-800 overflow-x-auto pr-16">
                {sampleUri}
              </div>
              <button
                onClick={handleCopyExample}
                className="absolute right-2 top-2 px-2.5 py-1 bg-graphite-800 hover:bg-graphite-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                {copiedExample ? <Check className="w-3 h-3 text-mint-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedExample ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-graphite-50 border-t border-graphite-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-graphite-200 hover:bg-graphite-300 text-graphite-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
