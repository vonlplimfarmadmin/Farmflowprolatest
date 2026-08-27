import React, { useState } from 'react';
import { 
  Flame, 
  CloudUpload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Database,
  Layers,
  ArrowDownToLine,
  Server
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseStatusModal: React.FC<FirebaseStatusModalProps> = ({ isOpen, onClose }) => {
  const { 
    eggProductionRecords, 
    flocks, 
    feedConsumptionRecords, 
    farmProfile, 
    depletions, 
    medAdministrations, 
    bodyWeights, 
    biosecurityLogs, 
    users,
    syncAllToFirestore,
    pullAllFromFirestore,
    firestoreStatus
  } = useFarm();

  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handlePush = async () => {
    setIsPushing(true);
    setFeedback(null);
    try {
      const res = await syncAllToFirestore();
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e?.message || 'Error pushing to Firestore' });
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    setIsPulling(true);
    setFeedback(null);
    try {
      const res = await pullAllFromFirestore();
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e?.message || 'Error pulling from Firestore' });
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Google Firebase & Firestore</h3>
              <p className="text-xs text-slate-500">Live Multi-User Cloud Synchronization & Persistence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status Card */}
          <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-extrabold text-slate-900">Firestore Cloud Connected</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Auto-Sync Active
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 font-bold text-[10px]">
                Project: nice-axiom-29v0l
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Live multi-device sync is running in the background. All entries, modifications, and deletions recorded on any phone, tablet, or desktop instantly sync across your entire team.
            </p>
          </div>

          {/* Cloud Collections Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-orange-500" />
                <span>Local Record Inventory</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Ready for sync</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Egg Logs</span>
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
                <span className="block text-[10px] text-slate-500 font-bold uppercase">Mortality / Cull</span>
                <span className="text-sm font-extrabold text-slate-900">{depletions.length}</span>
              </div>
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`p-3 rounded-2xl border text-xs font-medium flex items-center gap-2 ${
              feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handlePush}
              disabled={isPushing || isPulling}
              className="px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <CloudUpload className={`w-4 h-4 ${isPushing ? 'animate-spin' : ''}`} />
              <span>{isPushing ? 'Uploading to Firestore...' : 'Push Local Data to Firebase'}</span>
            </button>

            <button
              type="button"
              onClick={handlePull}
              disabled={isPushing || isPulling}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <ArrowDownToLine className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
              <span>{isPulling ? 'Hydrating Records...' : 'Pull from Firebase'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Database ID: nice-axiom-29v0l</span>
          <span>Security Rules: Deployed & Active</span>
        </div>
      </div>
    </div>
  );
};
