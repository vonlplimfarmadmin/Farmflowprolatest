import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { FeedType, PenConfig } from '../../types';
import { 
  Grid2X2, 
  Plus, 
  Wheat, 
  Skull, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export const FlockmanModuleView: React.FC = () => {
  const { 
    flocks, 
    updateFlock, 
    getFlockStats, 
    feedStockEntries, 
    addFeedConsumption, 
    addDepletion, 
    farmProfile,
    currentUser,
    permissions 
  } = useFarm();

  const [selectedHouse, setSelectedHouse] = useState<string>(() => {
    if (currentUser?.designatedHouses && currentUser.designatedHouses.length > 0) {
      return currentUser.designatedHouses[0];
    }
    return 'House 1';
  });

  const [activeSide, setActiveSide] = useState<'Left' | 'Right'>('Left');

  // Pen Adding Modal
  const [showAddPenModal, setShowAddPenModal] = useState(false);
  const [newPenName, setNewPenName] = useState('Pen L3');
  const [newPenSide, setNewPenSide] = useState<'Left' | 'Right'>('Left');
  const [newPenMales, setNewPenMales] = useState(240);
  const [newPenFemales, setNewPenFemales] = useState(2300);

  // Feed Log State for Side/Pen
  const [feedType, setFeedType] = useState<FeedType>('BLC 1');
  const [feedKg, setFeedKg] = useState<number>(725);
  const [feedDate, setFeedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [feedSuccess, setFeedSuccess] = useState(false);

  // Mortality State for Side/Pen
  const [selectedPenName, setSelectedPenName] = useState('Pen L1');
  const [mortMales, setMortMales] = useState(0);
  const [mortFemales, setMortFemales] = useState(1);
  const [mortNotes, setMortNotes] = useState('Morning flockman inspection');
  const [mortSuccess, setMortSuccess] = useState(false);

  const activeFlock = flocks.find(f => f.houseNumber === selectedHouse) || flocks[0];
  const stats = activeFlock ? getFlockStats(activeFlock.houseNumber) : null;

  // Filter pens by side
  const sidePens = (activeFlock?.pens || []).filter(p => p.side === activeSide);

  // Recommended feed from Standard Feed Guide
  const feedGuideItem = farmProfile.standardFeedGuide.find(fg => fg.ageWeek >= (stats?.ageWeeks || 30)) || farmProfile.standardFeedGuide[farmProfile.standardFeedGuide.length - 1];

  // Beginning inventory for selected feed type
  const beginningStock = feedStockEntries
    .filter(e => e.feedType === feedType)
    .reduce((sum, e) => sum + e.totalKg, 0);

  const handleAddPen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFlock) return;

    const newPen: PenConfig = {
      id: 'pen_' + Date.now(),
      name: newPenName,
      side: newPenSide,
      males: Number(newPenMales),
      females: Number(newPenFemales)
    };

    const updatedPens = [...(activeFlock.pens || []), newPen];
    updateFlock(activeFlock.id, { pens: updatedPens });
    setShowAddPenModal(false);
  };

  const handleLogFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedKg <= 0 || !activeFlock) return;

    addFeedConsumption({
      houseNumber: activeFlock.houseNumber,
      date: feedDate,
      side: activeSide,
      feedType,
      quantityKg: Number(feedKg),
      notes: `${activeSide} side feeding by Flockman`
    });

    setFeedSuccess(true);
    setTimeout(() => setFeedSuccess(false), 2500);
  };

  const handleLogMortality = (e: React.FormEvent) => {
    e.preventDefault();
    if ((mortMales <= 0 && mortFemales <= 0) || !activeFlock) return;

    addDepletion({
      houseNumber: activeFlock.houseNumber,
      date: new Date().toISOString().split('T')[0],
      side: activeSide,
      penName: selectedPenName,
      category: 'Mortality',
      maleCount: Number(mortMales),
      femaleCount: Number(mortFemales),
      sourceModule: 'flockman',
      reasonDetails: mortNotes
    });

    setMortMales(0);
    setMortFemales(0);
    setMortSuccess(true);
    setTimeout(() => setMortSuccess(false), 2500);
  };

  const canEditHouse = permissions.canRecordFlockmanModule(selectedHouse);

  return (
    <div className="space-y-6">
      {/* Header & House Selector */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Grid2X2 className="w-4 h-4" />
            <span>Daily Operations Module</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Flockman's Pen & Feeding Station</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage pen counts, side-by-side feed rations, and pen-level mortality.
          </p>
        </div>

        {/* House Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700">Select House:</label>
          <select
            value={selectedHouse}
            onChange={e => setSelectedHouse(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:outline-teal-500 outline-hidden"
          >
            {flocks.map(f => (
              <option key={f.id} value={f.houseNumber}>
                {f.houseNumber} ({f.breed} - Wk {getFlockStats(f.houseNumber)?.ageWeeks || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Population & Side Toggle Card */}
      {activeFlock && stats && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-black text-xs">
                {activeFlock.houseNumber}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Active Population: <span className="text-teal-800">{stats.totalCurrent.toLocaleString()} birds</span>
              </h3>
              <p className="text-xs text-slate-500">
                Age: <strong className="text-teal-900">Week {stats.ageWeeks} (Day {stats.ageDays || 1})</strong> • Current Males: <strong className="text-teal-700">{stats.currentMales}</strong> • Current Females: <strong className="text-rose-700">{stats.currentFemales}</strong> • Livability: <strong className="text-emerald-700">{stats.livabilityPct}%</strong>
              </p>
            </div>

            {/* Side Tabs (Left vs Right) */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
              <button
                onClick={() => setActiveSide('Left')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeSide === 'Left'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                LEFT SIDE
              </button>
              <button
                onClick={() => setActiveSide('Right')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeSide === 'Right'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                RIGHT SIDE
              </button>
            </div>
          </div>

          {/* Side Pens List */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Pens in {activeSide} Side ({sidePens.length} Pens)</span>
              </h4>

              {permissions.canRecordFlockmanModule(selectedHouse) && (
                <button
                  onClick={() => {
                    setNewPenSide(activeSide);
                    setNewPenName(`Pen ${activeSide[0]}${sidePens.length + 1}`);
                    setShowAddPenModal(true);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Pen</span>
                </button>
              )}
            </div>

            {sidePens.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No pens configured for this side yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {sidePens.map(pen => (
                  <div
                    key={pen.id}
                    className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{pen.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-medium text-slate-500 border border-slate-200">
                        {pen.side} Side
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-teal-700 block font-medium">Males</span>
                        <span className="font-bold text-teal-950">{pen.males}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-600 block font-medium">Females</span>
                        <span className="font-bold text-rose-950">{pen.females}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Two Action Panels: Feed Intake vs Side Mortality Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Feed Consumption Logger */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wheat className="w-4 h-4 text-teal-600" />
              <span>Feed Consumption ({activeSide} Side)</span>
            </h3>
            {feedSuccess && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Logged
              </span>
            )}
          </div>

          {/* Reference Info Card */}
          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Beginning Total Stock ({feedType}):</span>
              <strong className="text-teal-950">{beginningStock.toLocaleString()} kg</strong>
            </div>
            {feedGuideItem && (
              <div className="flex items-center justify-between text-teal-900">
                <span>Standard Feed Guide Target:</span>
                <strong>{feedGuideItem.femaleGramsPerBird} g/female/day • {feedGuideItem.recommendedFeedType}</strong>
              </div>
            )}
          </div>

          <form onSubmit={handleLogFeed} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Feed Type *</label>
                <select
                  value={feedType}
                  onChange={e => setFeedType(e.target.value as FeedType)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-hidden focus:outline-teal-500"
                >
                  {['CSC 1', 'CSC 2', 'CGC', 'PDC', 'BLC 1', 'BLC 2', 'BLC 3', 'BMCC', 'BMCR'].map(ft => (
                    <option key={ft} value={ft}>{ft}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Feeding Date</label>
                <input
                  type="date"
                  required
                  value={feedDate}
                  onChange={e => setFeedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Feed Intake in Kilograms (kg) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={feedKg}
                onChange={e => setFeedKg(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500 font-bold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Equivalent to <strong>{(feedKg / 50).toFixed(1)} bags</strong> (50kg bags)
              </p>
            </div>

            <button
              type="submit"
              disabled={!canEditHouse}
              className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-xs ${
                canEditHouse
                  ? 'bg-teal-600 hover:bg-teal-700'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              <Wheat className="w-4 h-4" />
              <span>Record {activeSide} Side Feed Consumption</span>
            </button>
            {!canEditHouse && (
              <p className="text-[11px] text-rose-600 text-center">
                You do not have permission to log records for {selectedHouse}.
              </p>
            )}
          </form>
        </div>

        {/* Panel 2: Pen Mortality Logger */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Skull className="w-4 h-4 text-rose-600" />
              <span>Log Mortality ({activeSide} Side / Pen)</span>
            </h3>
            {mortSuccess && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Recorded
              </span>
            )}
          </div>

          <form onSubmit={handleLogMortality} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Pen *</label>
              <select
                value={selectedPenName}
                onChange={e => setSelectedPenName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-hidden focus:outline-teal-500"
              >
                {sidePens.map(p => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.side} Side)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dead Males</label>
                <input
                  type="number"
                  min="0"
                  value={mortMales}
                  onChange={e => setMortMales(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dead Females</label>
                <input
                  type="number"
                  min="0"
                  value={mortFemales}
                  onChange={e => setMortFemales(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:outline-rose-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Inspection Notes / Symptoms</label>
              <input
                type="text"
                value={mortNotes}
                onChange={e => setMortNotes(e.target.value)}
                placeholder="e.g. Found under slats during morning walk"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={!canEditHouse}
              className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-xs ${
                canEditHouse
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              <Skull className="w-4 h-4" />
              <span>Record Pen Mortality</span>
            </button>
          </form>
        </div>
      </div>

      {/* Add Pen Modal */}
      {showAddPenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-teal-950 p-5 text-white flex items-center justify-between border-b border-teal-900/50">
              <div>
                <h3 className="font-bold text-base text-white">Add New Pen Partition</h3>
                <p className="text-xs text-teal-300/80">{activeFlock.houseNumber} • {newPenSide} Side</p>
              </div>
              <button onClick={() => setShowAddPenModal(false)} className="text-teal-400 hover:text-white p-1 rounded-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddPen} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pen Name / Tag *</label>
                <input
                  type="text"
                  required
                  value={newPenName}
                  onChange={e => setNewPenName(e.target.value)}
                  placeholder="e.g. Pen L3"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Side *</label>
                <select
                  value={newPenSide}
                  onChange={e => setNewPenSide(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white outline-hidden focus:outline-teal-500"
                >
                  <option value="Left">Left Side</option>
                  <option value="Right">Right Side</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Males *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPenMales}
                    onChange={e => setNewPenMales(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Females *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPenFemales}
                    onChange={e => setNewPenFemales(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-hidden focus:outline-rose-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPenModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Create Pen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
