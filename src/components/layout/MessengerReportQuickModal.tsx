import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { buildMessengerReportData } from '../../utils/farmCalculations';
import { Share2, Copy, Check, X, Calendar, Sparkles, MessageSquare, Send, CheckCircle2, Egg, Layers } from 'lucide-react';

interface MessengerReportQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type MessengerFormatStyle = 'standard' | 'executive' | 'compact';

export const MessengerReportQuickModal: React.FC<MessengerReportQuickModalProps> = ({ isOpen, onClose }) => {
  const { eggProductionRecords = [], flocks = [], farmProfile } = useFarm();
  const [reportDate, setReportDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formatStyle, setFormatStyle] = useState<MessengerFormatStyle>('standard');
  const [copied, setCopied] = useState(false);

  const reportData = useMemo(
    () => buildMessengerReportData(eggProductionRecords, flocks, farmProfile, reportDate, true),
    [eggProductionRecords, flocks, farmProfile, reportDate]
  );

  if (!isOpen) return null;

  const setDateToday = () => {
    setReportDate(new Date().toISOString().split('T')[0]);
  };

  const setDateYesterday = () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    setReportDate(y.toISOString().split('T')[0]);
  };

  const {
    companyName,
    totalTEP,
    totalHE,
    totalNHE,
    grandTEP,
    overallHEPct,
    totalTrays30,
    remainingEggs,
    formatStandard,
    formatExecutive,
    formatCompact,
  } = reportData;

  const reportText = formatStyle === 'standard' 
    ? formatStandard() 
    : formatStyle === 'executive' 
    ? formatExecutive() 
    : formatCompact();

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 p-5 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-xl shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-white uppercase tracking-wider">
                  Instant Daily Messenger Report
                </h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-extrabold px-2 py-0.5 rounded-md border border-emerald-800">
                  Ready to Share
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {companyName} &bull; Formatted for Telegram, Messenger, Viber & SMS
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Parameters & Format Selector */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Date Pickers */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-600 uppercase text-[10px]">Date:</span>
              <input
                type="date"
                value={reportDate}
                onChange={e => setReportDate(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 font-bold focus:outline-emerald-500"
              />
              <button
                type="button"
                onClick={setDateToday}
                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-[11px] font-bold transition cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={setDateYesterday}
                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-[11px] font-bold transition cursor-pointer"
              >
                Yesterday
              </button>
            </div>

            {/* Quick Copy Action */}
            <button
              id="quick-copy-messenger-report-btn"
              onClick={handleCopy}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
            </button>
          </div>

          {/* Format Selection Tabs */}
          <div className="flex items-center gap-1.5 border-t border-slate-200 pt-2.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mr-1">
              Format:
            </span>
            <button
              type="button"
              onClick={() => setFormatStyle('standard')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                formatStyle === 'standard'
                  ? 'bg-slate-950 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Official Farm Format
            </button>
            <button
              type="button"
              onClick={() => setFormatStyle('executive')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                formatStyle === 'executive'
                  ? 'bg-slate-950 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Executive Broadcast
            </button>
            <button
              type="button"
              onClick={() => setFormatStyle('compact')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                formatStyle === 'compact'
                  ? 'bg-slate-950 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Compact SMS
            </button>
          </div>
        </div>

        {/* Live Aggregation Pill Metrics */}
        <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 text-center shrink-0">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Total TEP</span>
            <span className="text-sm font-black text-slate-950">{totalTEP.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-emerald-700 block">Hatching (HE)</span>
            <span className="text-sm font-black text-emerald-950">{totalHE.toLocaleString()} ({overallHEPct}%)</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-rose-700 block">Total NHE</span>
            <span className="text-sm font-black text-rose-950">{totalNHE.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-700 block">Grand TEP (Net)</span>
            <span className="text-sm font-black text-slate-950">{grandTEP.toLocaleString()}</span>
          </div>
        </div>

        {/* Formatted Text Preview Area */}
        <div className="p-5 overflow-y-auto bg-slate-950 font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed select-all border-y border-slate-900">
          {reportText}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified & prepared for daily executive updates
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
