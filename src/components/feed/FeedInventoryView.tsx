import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { FeedType } from '../../types';
import { 
  Wheat, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  TrendingDown, 
  PackageCheck, 
  Trash2, 
  FileText,
  Clock
} from 'lucide-react';

export const FeedInventoryView: React.FC = () => {
  const { 
    feedStockEntries, 
    feedConsumptionRecords, 
    addFeedStock, 
    deleteFeedStock, 
    addFeedConsumption,
    deleteFeedConsumption,
    getFeedStockSummary, 
    getLowStockAlerts,
    flocks,
    permissions 
  } = useFarm();

  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showLogConsumptionModal, setShowLogConsumptionModal] = useState(false);

  // Add Stock state
  const [feedType, setFeedType] = useState<FeedType>('BLC 1');
  const [bags, setBags] = useState<number>(50);
  const [kgPerBag, setKgPerBag] = useState<number>(50);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [supplier, setSupplier] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Log Consumption state
  const [consHouse, setConsHouse] = useState('House 1');
  const [consDate, setConsDate] = useState(new Date().toISOString().split('T')[0]);
  const [consFeedType, setConsFeedType] = useState<FeedType>('BLC 1');
  const [consKg, setConsKg] = useState<number>(1450);
  const [consSide, setConsSide] = useState<'All' | 'Left' | 'Right'>('All');
  const [consNotes, setConsNotes] = useState('');

  const summaries = getFeedStockSummary();
  const lowAlerts = getLowStockAlerts();

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (bags <= 0) return;

    addFeedStock({
      feedType,
      bags: Number(bags),
      kgPerBag: Number(kgPerBag),
      date,
      supplier: supplier.trim() || 'San Miguel / B-MEG Mills',
      batchNumber: batchNumber.trim() || `LOT-${feedType.replace(/\s+/g, '')}-${Date.now().toString().slice(-4)}`,
      notes: notes.trim()
    });

    setShowAddStockModal(false);
    setBags(50);
    setNotes('');
  };

  const handleLogConsumption = (e: React.FormEvent) => {
    e.preventDefault();
    if (consKg <= 0) return;

    addFeedConsumption({
      houseNumber: consHouse,
      date: consDate,
      feedType: consFeedType,
      quantityKg: Number(consKg),
      side: consSide,
      notes: consNotes
    });

    setShowLogConsumptionModal(false);
    setConsNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Wheat className="w-4 h-4" />
            <span>Feed Stock & Silo Control</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Feed Inventory Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Automated stock deduction (Received less Daily Farm Consumption) with ≤ 4 bags critical alert.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {permissions.canAddFeedStock && (
            <button
              id="open-add-feed-stock-modal-btn"
              onClick={() => setShowAddStockModal(true)}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Receive New Stock</span>
            </button>
          )}

          {permissions.canRecordFlockmanModule() && (
            <button
              id="open-log-feed-consumption-btn"
              onClick={() => setShowLogConsumptionModal(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              <TrendingDown className="w-4 h-4 text-teal-400" />
              <span>Log Consumption</span>
            </button>
          )}
        </div>
      </div>

      {/* Low Feed Level Alert Notification if any */}
      {lowAlerts.length > 0 && (
        <div className="p-4 bg-rose-50/80 border border-rose-200/80 rounded-2xl animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-rose-950 flex items-center gap-2">
                <span>Low Feed Stock Alert ({lowAlerts.length} type{lowAlerts.length > 1 ? 's' : ''} critical)</span>
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                The following feed types have dropped to <strong>≤ 4 bags</strong> remaining in farm inventory:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {lowAlerts.map(a => (
                  <span
                    key={a.feedType}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-rose-300 rounded-lg text-xs font-bold text-rose-900 shadow-2xs"
                  >
                    <span>{a.feedType}:</span>
                    <span className="text-rose-600">{a.currentStockBags} bags ({a.currentStockKg} kg)</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          {permissions.canAddFeedStock && (
            <button
              onClick={() => {
                if (lowAlerts[0]) setFeedType(lowAlerts[0].feedType);
                setShowAddStockModal(true);
              }}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shrink-0"
            >
              Restock Now
            </button>
          )}
        </div>
      )}

      {/* Grid of Feed Types Stock Level */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Current Stock by Formulation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaries.map(item => (
            <div
              key={item.feedType}
              className={`p-5 rounded-2xl border transition ${
                item.isLowStock
                  ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                    Formula
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">{item.feedType}</h4>
                </div>
                {item.isLowStock ? (
                  <span className="px-2.5 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Low Stock
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> In Stock
                  </span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">Current Bags</p>
                  <p className={`text-lg font-black ${item.isLowStock ? 'text-rose-700' : 'text-slate-900'}`}>
                    {item.currentStockBags} <span className="text-xs font-semibold text-slate-500">bags</span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">Equivalent Weight</p>
                  <p className="text-lg font-black text-slate-900">
                    {item.currentStockKg.toLocaleString()} <span className="text-xs font-semibold text-slate-500">kg</span>
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-dashed border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Received: {item.totalReceivedBags} bags</span>
                <span>Consumed: {(item.totalConsumedKg / 50).toFixed(1)} bags</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column History: Stock Deliveries vs Daily Consumptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Intake Deliveries Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-teal-600" />
              <span>Stock Deliveries Received</span>
            </h3>
            <span className="text-xs text-slate-500">{feedStockEntries.length} logs</span>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 sticky top-0">
                  <th className="py-2 px-2.5">Date</th>
                  <th className="py-2 px-2.5">Feed Type</th>
                  <th className="py-2 px-2.5">Bags (50kg)</th>
                  <th className="py-2 px-2.5">Total Kg</th>
                  <th className="py-2 px-2.5">Supplier / Batch</th>
                  {permissions.canDeleteRecord && <th className="py-2 px-2.5 text-right">Del</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feedStockEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-2.5 font-medium text-slate-700">{entry.date}</td>
                    <td className="py-2 px-2.5 font-bold text-slate-900">{entry.feedType}</td>
                    <td className="py-2 px-2.5 font-semibold text-teal-700">+{entry.bags} bags</td>
                    <td className="py-2 px-2.5 text-slate-700">{entry.totalKg.toLocaleString()} kg</td>
                    <td className="py-2 px-2.5 text-slate-500 truncate max-w-32" title={entry.supplier}>
                      {entry.batchNumber || entry.supplier || '—'}
                    </td>
                    {permissions.canDeleteRecord && (
                      <td className="py-2 px-2.5 text-right">
                        <button
                          onClick={() => deleteFeedStock(entry.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Feed Consumption Log Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-teal-600" />
              <span>Daily House Consumption Logs</span>
            </h3>
            <span className="text-xs text-slate-500">{feedConsumptionRecords.length} records</span>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 sticky top-0">
                  <th className="py-2 px-2.5">Date</th>
                  <th className="py-2 px-2.5">House</th>
                  <th className="py-2 px-2.5">Type</th>
                  <th className="py-2 px-2.5">Quantity (kg)</th>
                  <th className="py-2 px-2.5">Logged By</th>
                  {permissions.canDeleteRecord && <th className="py-2 px-2.5 text-right">Del</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feedConsumptionRecords.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-2.5 font-medium text-slate-700">{record.date}</td>
                    <td className="py-2 px-2.5 font-bold text-slate-900">{record.houseNumber}</td>
                    <td className="py-2 px-2.5 font-semibold text-teal-900">{record.feedType}</td>
                    <td className="py-2 px-2.5 font-bold text-slate-800">{record.quantityKg.toLocaleString()} kg</td>
                    <td className="py-2 px-2.5 text-slate-500 truncate max-w-28">{record.loggedBy}</td>
                    {permissions.canDeleteRecord && (
                      <td className="py-2 px-2.5 text-right">
                        <button
                          onClick={() => deleteFeedConsumption(record.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal 1: Add New Feed Stock */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-teal-950 p-5 text-white flex items-center justify-between border-b border-teal-900/50">
              <div>
                <h3 className="font-bold text-base text-white">Receive Feed Stock Delivery</h3>
                <p className="text-xs text-teal-300/80">Record incoming bags and calculate total kgs</p>
              </div>
              <button
                onClick={() => setShowAddStockModal(false)}
                className="text-teal-400 hover:text-white transition p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddStock} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Feed Type *</label>
                <select
                  value={feedType}
                  onChange={e => setFeedType(e.target.value as FeedType)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden bg-white"
                >
                  <option value="CSC 1">CSC 1 (Chick Starter Crumble 1)</option>
                  <option value="CSC 2">CSC 2 (Chick Starter Crumble 2)</option>
                  <option value="CGC">CGC (Chick Grower Crumble)</option>
                  <option value="PDC">PDC (Pre-Developer Crumble)</option>
                  <option value="BLC 1">BLC 1 (Breeder Layer Crumble 1)</option>
                  <option value="BLC 2">BLC 2 (Breeder Layer Crumble 2)</option>
                  <option value="BLC 3">BLC 3 (Breeder Layer Crumble 3)</option>
                  <option value="BMCC">BMCC (Breeder Male Clean Crumble)</option>
                  <option value="BMCR">BMCR (Breeder Male Clean Ration)</option>
                  <option value="CBB">CBB (Chick Broiler Booster / Starter)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity in Bags *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bags}
                    onChange={e => setBags(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kg per Bag</label>
                  <input
                    type="number"
                    value={kgPerBag}
                    onChange={e => setKgPerBag(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Dynamic conversion preview */}
              <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-medium text-teal-900">Total Quantity in Kg:</span>
                <span className="text-base font-black text-teal-950">
                  {(bags * kgPerBag).toLocaleString()} kg
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch / Lot #</label>
                  <input
                    type="text"
                    placeholder="LOT-BLC1-9920"
                    value={batchNumber}
                    onChange={e => setBatchNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Feed Mill</label>
                <input
                  type="text"
                  placeholder="e.g. San Miguel B-MEG / Cargill"
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Silo 2 fill, moisture ok"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  Add to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Log Feed Consumption */}
      {showLogConsumptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-teal-950 p-5 text-white flex items-center justify-between border-b border-teal-900/50">
              <div>
                <h3 className="font-bold text-base text-white">Record Daily Feed Consumption</h3>
                <p className="text-xs text-teal-300/80">Deduct consumed kilograms from active silo stock</p>
              </div>
              <button
                onClick={() => setShowLogConsumptionModal(false)}
                className="text-teal-400 hover:text-white transition p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleLogConsumption} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">House Number *</label>
                  <select
                    value={consHouse}
                    onChange={e => setConsHouse(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden bg-white"
                  >
                    {flocks.map(f => (
                      <option key={f.id} value={f.houseNumber}>{f.houseNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={consDate}
                    onChange={e => setConsDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Feed Type *</label>
                  <select
                    value={consFeedType}
                    onChange={e => setConsFeedType(e.target.value as FeedType)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden bg-white"
                  >
                    {['CSC 1', 'CSC 2', 'CGC', 'PDC', 'BLC 1', 'BLC 2', 'BLC 3', 'BMCC', 'BMCR', 'CBB'].map(ft => (
                      <option key={ft} value={ft}>{ft}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">House Side</label>
                  <select
                    value={consSide}
                    onChange={e => setConsSide(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden bg-white"
                  >
                    <option value="All">Both Sides (Full House)</option>
                    <option value="Left">Left Side Only</option>
                    <option value="Right">Right Side Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Feed Consumed (in Kg) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={consKg}
                  onChange={e => setConsKg(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Equivalent to ~<strong>{(consKg / 50).toFixed(1)} bags</strong> (50kg/bag)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Feed Intake Notes</label>
                <input
                  type="text"
                  placeholder="Clean-up time: 3.5 hrs, pan lines clean"
                  value={consNotes}
                  onChange={e => setConsNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-teal-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogConsumptionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  Submit Consumption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
