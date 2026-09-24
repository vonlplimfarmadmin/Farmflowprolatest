import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Layers,
  Clock,
  ArrowDownToLine,
  ArrowUpToLine,
  Server,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { getMongoDBStatus, MongoSyncStatus } from '../../services/mongodbSync';

interface MongoStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MongoStatusModal: React.FC<MongoStatusModalProps> = ({ isOpen, onClose }) => {
  const { syncAllToMongoDB, pullAllFromMongoDB, purgeDatabaseAndCache, mongoStatus } = useFarm();
  const [liveStatus, setLiveStatus] = useState<MongoSyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; isError?: boolean } | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const s = await getMongoDBStatus();
      setLiveStatus(s);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setActionFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualPush = async () => {
    setIsPushing(true);
    setActionFeedback(null);
    try {
      const res = await syncAllToMongoDB();
      setActionFeedback({
        message: res.message || 'All records successfully synchronized to MongoDB.',
        isError: !res.success,
      });
      fetchStatus();
    } catch (err: any) {
      setActionFeedback({
        message: err.message || 'Failed to sync with MongoDB',
        isError: true,
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handleManualPull = async () => {
    setIsPulling(true);
    setActionFeedback(null);
    try {
      const res = await pullAllFromMongoDB();
      setActionFeedback({
        message: res.message || 'Loaded latest data from MongoDB database.',
        isError: !res.success,
      });
      fetchStatus();
    } catch (err: any) {
      setActionFeedback({
        message: err.message || 'Failed to pull data from MongoDB',
        isError: true,
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handlePurge = async () => {
    setIsPurging(true);
    setActionFeedback(null);
    try {
      const res = await purgeDatabaseAndCache({
        purgeDatabase: true,
        clearCache: true,
        preserveUsers: true,
        preserveStandards: true,
        preserveFarmProfile: true,
      });
      setActionFeedback({
        message: res.message || 'All old records and persistent cache purged successfully.',
        isError: !res.success,
      });
      setConfirmPurge(false);
      fetchStatus();
    } catch (err: any) {
      setActionFeedback({
        message: err.message || 'Failed to purge database records',
        isError: true,
      });
    } finally {
      setIsPurging(false);
    }
  };

  const isConnected = liveStatus ? liveStatus.connected : mongoStatus.connected;
  const dbName = liveStatus?.dbName || mongoStatus.dbName || 'farmflowproviii';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 backdrop-blur-md rounded-2xl border border-emerald-400/30 text-emerald-300">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                <span>MongoDB Database Connection</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  isConnected
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-200 border border-rose-400/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {isConnected ? 'Connected' : 'Offline'}
                </span>
              </h3>
              <p className="text-xs text-emerald-200/80">
                Direct Cloud Database Storage &bull; {dbName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {actionFeedback && (
            <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
              actionFeedback.isError
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}>
              {actionFeedback.isError ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
          )}

          {/* Connection Status Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2 text-slate-500">
                <Server className="w-4 h-4 text-emerald-600" />
                Cluster Status
              </span>
              <button
                type="button"
                onClick={fetchStatus}
                disabled={loading}
                className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200/60">
                <div className="text-[10px] uppercase font-bold text-slate-400">Database</div>
                <div className="font-extrabold text-slate-900 truncate mt-0.5">{dbName}</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/60">
                <div className="text-[10px] uppercase font-bold text-slate-400">Storage Mode</div>
                <div className="font-extrabold text-emerald-700 truncate mt-0.5">Direct MongoDB</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Last Synced:{' '}
                <strong className="text-slate-700">
                  {mongoStatus.lastSyncedAt
                    ? new Date(mongoStatus.lastSyncedAt).toLocaleTimeString()
                    : 'Active / Just now'}
                </strong>
              </span>
            </div>
          </div>

          {/* Active Collections */}
          {liveStatus?.collections && liveStatus.collections.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>MongoDB Collections ({liveStatus.collections.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                {liveStatus.collections.map((col) => (
                  <div
                    key={col.name}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-700 truncate">{col.name}</span>
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-extrabold text-[10px]">
                      {col.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Actions */}
          <div className="pt-2 space-y-2">
            <div className="text-xs font-bold text-slate-700">Synchronize Cloud Data</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleManualPull}
                disabled={isPulling || isPushing}
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <ArrowDownToLine className={`w-4 h-4 ${isPulling ? 'animate-bounce' : ''}`} />
                <span>{isPulling ? 'Pulling Data...' : 'Pull From MongoDB'}</span>
              </button>

              <button
                type="button"
                onClick={handleManualPush}
                disabled={isPushing || isPulling}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <ArrowUpToLine className={`w-4 h-4 ${isPushing ? 'animate-bounce' : ''}`} />
                <span>{isPushing ? 'Syncing...' : 'Sync To MongoDB'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              All farm record entries, flock edits, and egg harvests auto-save directly to MongoDB in real time.
            </p>
          </div>

          {/* Purge Persistent Recurring Data */}
          <div className="pt-2 border-t border-slate-100">
            <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  Purge Persistent Records & Cache
                </span>
                {!confirmPurge ? (
                  <button
                    type="button"
                    onClick={() => setConfirmPurge(true)}
                    disabled={isPurging || isPushing || isPulling}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    Purge Data
                  </button>
                ) : null}
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Permanently remove all old recurring records (flocks, egg collections, feed records, depletions, deliveries, and audit logs) from MongoDB and local storage/cache. Active user logins and farm profile are preserved.
              </p>
              {confirmPurge && (
                <div className="pt-2 border-t border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    Confirm removal of all recurring records?
                  </span>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setConfirmPurge(false)}
                      disabled={isPurging}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-rose-100/70 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePurge}
                      disabled={isPurging}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className={`w-3.5 h-3.5 ${isPurging ? 'animate-spin' : ''}`} />
                      <span>{isPurging ? 'Purging...' : 'Confirm Purge'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const DatabaseStatusModal = MongoStatusModal;
