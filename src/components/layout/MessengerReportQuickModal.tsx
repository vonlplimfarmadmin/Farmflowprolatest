import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { Share2, Copy, Check, X } from 'lucide-react';

interface MessengerReportQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MessengerReportQuickModal: React.FC<MessengerReportQuickModalProps> = ({ isOpen, onClose }) => {
  const { eggProductionRecords, flocks, getFlockStats, farmProfile } = useFarm();
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateReport = () => {
    const recordsOnDate = eggProductionRecords.filter(r => r.date === reportDate);
    const dateFormatted = new Date(reportDate + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).toUpperCase();

    const companyName = (farmProfile.name || 'L.P. LIM CITY FAMILY FARM INC').toUpperCase();

    let report = `${companyName}\nDAILY EGG REPORT\n\nDATE:\t${dateFormatted}\n\n`;

    let totalTEP = 0;
    let totalHENest = 0;
    let totalHEFloor = 0;
    let totalHE = 0;
    let totalNHE = 0;
    let totalSpoil = 0;
    let totalDY = 0;

    // Filter houses with records on this date; if none found on this date, show available active flocks
    const activeRecords = recordsOnDate.length > 0 
      ? recordsOnDate 
      : flocks.map(f => ({
          houseNumber: f.houseNumber,
          tep: 0,
          heNest: 0,
          heFloor: 0,
          small: 0,
          broken: 0,
          thinShell: 0,
          doubleYolk: 0,
          misshape: 0,
          others: 0,
          spoiled: 0,
          totalHE: 0,
          totalNHE: 0
        } as any));

    activeRecords.forEach((rec) => {
      const heNest = rec.heNest ?? rec.sorting?.hatchingEggs?.heNest ?? 0;
      const heFloor = rec.heFloor ?? rec.sorting?.hatchingEggs?.heFloor ?? 0;
      const heTotal = rec.totalHatchingEggs ?? rec.totalHE ?? (heNest + heFloor);

      const small = rec.small ?? rec.sorting?.nonHatchingEggs?.small ?? 0;
      const broken = rec.broken ?? rec.sorting?.nonHatchingEggs?.broken ?? 0;
      const ts = rec.thinShell ?? rec.sorting?.nonHatchingEggs?.cracked ?? 0;
      const dy = rec.doubleYolk ?? rec.sorting?.nonHatchingEggs?.doubleYolk ?? 0;
      const ms = rec.misshape ?? rec.sorting?.nonHatchingEggs?.abnormal ?? rec.sorting?.nonHatchingEggs?.misshapen ?? 0;
      const oth = rec.others ?? rec.sorting?.nonHatchingEggs?.softShelled ?? rec.sorting?.nonHatchingEggs?.leakers ?? 0;
      const spoiled = rec.spoiled ?? rec.sorting?.nonHatchingEggs?.dirty ?? 0;
      const nheTotal = rec.totalNonHatchingEggs ?? rec.totalNHE ?? (small + broken + ts + dy + ms + oth + spoiled);
      const tep = rec.tep ?? rec.totalEggs ?? (heTotal + nheTotal);

      totalTEP += tep;
      totalHENest += heNest;
      totalHEFloor += heFloor;
      totalHE += heTotal;
      totalNHE += nheTotal;
      totalSpoil += spoiled;
      totalDY += dy;

      report += `${rec.houseNumber.toUpperCase()}\n\n`;
      report += `TEP;\t${tep}\n`;
      report += `HE NEST;\t${heNest}\n`;
      report += `HE FLOOR;\t${heFloor}\n\n`;
      report += `SMALL;\t${small}\n`;
      report += `BROKEN;\t${broken}\n`;
      report += `TS;\t${ts}\n`;
      report += `DY;\t${dy}\n`;
      report += `MS;\t${ms}\n`;
      report += `OTH:\t${oth}\n`;
      report += `SPOILED;\t${spoiled}\n`;
      report += `TOTAL NHE;\t${nheTotal}\n\n\n`;
    });

    const grandTEP = totalTEP - totalSpoil - totalDY;

    report += `TOTAL TEP;\t${totalTEP}\n`;
    report += `TOTAL HE NEST;\t${totalHENest}\n`;
    report += `TOTAL HE FLOOR;\t${totalHEFloor}\n`;
    report += `TOTAL HE;\t${totalHE}\n`;
    report += `TOTAL NHE;\t${totalNHE}\n`;
    report += `TOTAL SPOIL;\t${totalSpoil}\n`;
    report += `TOTAL DY;\t${totalDY}\n\n`;
    report += `GRAND TEP;\t${grandTEP}`;

    return report;
  };

  const reportText = generateReport();

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-graphite-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[88vh]">
        <div className="bg-forest-950 p-5 text-white flex items-center justify-between shrink-0 border-b border-forest-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-mint-500 text-forest-950 rounded-xl shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Daily Messenger Report</h3>
              <p className="text-[11px] text-mint-300/90 font-medium">L.P. LIM CITY FAMILY FARM INC format</p>
            </div>
          </div>
          <button onClick={onClose} className="text-graphite-400 hover:text-white p-1 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-graphite-50 border-b border-graphite-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <label className="font-bold text-graphite-700 uppercase tracking-wider text-[10px]">Date:</label>
            <input
              type="date"
              value={reportDate}
              onChange={e => setReportDate(e.target.value)}
              className="px-3 py-1.5 text-xs border border-graphite-300 rounded-xl bg-white text-graphite-900 font-semibold focus:outline-mint-500"
            />
          </div>

          <button
            id="quick-copy-messenger-report-btn"
            onClick={handleCopy}
            className="px-4 py-2 bg-forest-900 hover:bg-forest-850 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs border border-forest-800"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-mint-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className={copied ? 'text-mint-300 font-bold' : ''}>{copied ? 'Copied to Clipboard!' : 'Copy Report'}</span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto bg-graphite-950 font-mono text-xs text-mint-300 whitespace-pre-wrap leading-relaxed select-all border-y border-graphite-850">
          {reportText}
        </div>

        <div className="p-4 bg-graphite-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-graphite-500 font-medium">Ready for broadcast to group chat</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-graphite-200 hover:bg-graphite-300 text-graphite-800 rounded-xl text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
