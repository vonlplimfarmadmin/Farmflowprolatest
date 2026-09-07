import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { 
  Scale, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Activity, 
  CheckCircle2, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Download,
  Building2,
  Layers,
  Target,
  Search,
  Filter
} from 'lucide-react';
import { GrowthCurveChart } from './GrowthCurveChart';
import { DeviationVarianceChart } from './DeviationVarianceChart';
import { GrowthVelocityChart } from './GrowthVelocityChart';
import { UniformityTrendChart } from './UniformityTrendChart';
import { MultiHouseComparisonChart } from './MultiHouseComparisonChart';
import { EarlyWarningAdvisory } from './EarlyWarningAdvisory';
import { 
  analyzeGrowthTrajectory, 
  calculateDeviation, 
  BASE_WEEKLY_STANDARDS 
} from './growthStandards';
import { exportReportToPdf, exportReportToExcel, exportReportToCsv, ReportMetadata, SheetData } from '../../utils/reportExportUtils';
import { useToast } from '../common/ToastContainer';
import { HouseQuickBar } from '../common/HouseQuickBar';
import { StandardsBatchUploadModal } from '../farmProfile/StandardsBatchUploadModal';

export const BodyWeightView: React.FC = () => {
  const { 
    bodyWeights, 
    addBodyWeightRecord, 
    deleteBodyWeightRecord, 
    farmProfile, 
    flocks, 
    permissions,
    currentUser
  } = useFarm();
  const toast = useToast();

  const [selectedHouse, setSelectedHouse] = useState('House 1');
  const [activeTab, setActiveTab] = useState<'curves' | 'deviation' | 'velocity' | 'uniformity' | 'multihouse'>('curves');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchUploadModal, setShowBatchUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Record State
  const [modalHouseNumber, setModalHouseNumber] = useState('House 1');
  const [modalWeek, setModalWeek] = useState(32);
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0]);
  const [maleAvgWeightGrams, setMaleAvgWeightGrams] = useState(4300);
  const [femaleAvgWeightGrams, setFemaleAvgWeightGrams] = useState(3500);
  const [uniformityPct, setUniformityPct] = useState(88);
  const [sampleSize, setSampleSize] = useState(100);
  const [notes, setNotes] = useState('');

  const activeFlock = flocks.find(f => f.houseNumber === selectedHouse) || flocks[0];
  
  // Sorted records for selected house
  const houseRecords = useMemo(() => {
    return bodyWeights
      .filter(r => selectedHouse === 'All' ? true : r.houseNumber === selectedHouse)
      .sort((a, b) => a.week - b.week);
  }, [bodyWeights, selectedHouse]);

  // Latest record for selected house
  const latestRecord = houseRecords[houseRecords.length - 1];
  const previousRecord = houseRecords.length > 1 ? houseRecords[houseRecords.length - 2] : undefined;

  // Developmental assessment & diagnostics
  const assessment = useMemo(() => {
    return analyzeGrowthTrajectory(latestRecord, previousRecord, farmProfile?.standardBodyWeights || []);
  }, [latestRecord, previousRecord, farmProfile]);

  // Filtered records for table search
  const filteredTableRecords = useMemo(() => {
    if (!searchQuery.trim()) return houseRecords;
    const q = searchQuery.toLowerCase();
    return houseRecords.filter(r => 
      r.houseNumber.toLowerCase().includes(q) ||
      `week ${r.week}`.toLowerCase().includes(q) ||
      r.date.toLowerCase().includes(q) ||
      (r.loggedBy && r.loggedBy.toLowerCase().includes(q)) ||
      (r.notes && r.notes.toLowerCase().includes(q))
    );
  }, [houseRecords, searchQuery]);

  // Open modal pre-populated
  const handleOpenAddModal = () => {
    const targetHouse = selectedHouse === 'All' ? 'House 1' : selectedHouse;
    const houseRecs = bodyWeights.filter(b => b.houseNumber === targetHouse).sort((a, b) => a.week - b.week);
    const lastRec = houseRecs[houseRecs.length - 1];

    const nextWeek = lastRec ? lastRec.week + 1 : 32;
    const baseStd = BASE_WEEKLY_STANDARDS.find(b => b.ageWeek === nextWeek);
    const customStd = farmProfile?.standardBodyWeights?.find(s => s.ageWeek === nextWeek);

    const stdFemale = customStd?.femaleStandardGrams || baseStd?.femaleStandardGrams || (lastRec ? lastRec.femaleAvgWeightGrams + 40 : 3500);
    const stdMale = customStd?.maleStandardGrams || baseStd?.maleStandardGrams || (lastRec ? lastRec.maleAvgWeightGrams + 50 : 4300);

    setModalHouseNumber(targetHouse);
    setModalWeek(nextWeek);
    setModalDate(new Date().toISOString().split('T')[0]);
    setFemaleAvgWeightGrams(stdFemale);
    setMaleAvgWeightGrams(stdMale);
    setUniformityPct(lastRec?.uniformityPct || 87);
    setSampleSize(100);
    setNotes('');
    setShowAddModal(true);
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (maleAvgWeightGrams <= 0 || femaleAvgWeightGrams <= 0) {
      toast.error('Invalid Weights', 'Male and female average weights must be greater than zero.');
      return;
    }

    // Compute weekly gain from prior record if any
    const priorRec = bodyWeights
      .filter(b => b.houseNumber === modalHouseNumber && b.week < Number(modalWeek))
      .sort((a, b) => b.week - a.week)[0];

    const weeklyGainMale = priorRec ? Number(maleAvgWeightGrams) - priorRec.maleAvgWeightGrams : undefined;
    const weeklyGainFemale = priorRec ? Number(femaleAvgWeightGrams) - priorRec.femaleAvgWeightGrams : undefined;

    addBodyWeightRecord({
      houseNumber: modalHouseNumber,
      week: Number(modalWeek),
      date: modalDate,
      maleAvgWeightGrams: Number(maleAvgWeightGrams),
      femaleAvgWeightGrams: Number(femaleAvgWeightGrams),
      uniformityPct: Number(uniformityPct),
      sampleSize: Number(sampleSize),
      weeklyGainMale,
      weeklyGainFemale,
      notes: notes.trim()
    });

    toast.success('Sample Weights Logged', `Recorded Week ${modalWeek} growth sample for ${modalHouseNumber}.`);
    setShowAddModal(false);
  };

  // Export handlers
  const handleExportPdf = () => {
    const reportData = houseRecords.map(r => {
      const baseStd = BASE_WEEKLY_STANDARDS.find(b => b.ageWeek === r.week);
      const customStd = farmProfile?.standardBodyWeights?.find(s => s.ageWeek === r.week);
      const femaleStd = customStd?.femaleStandardGrams || baseStd?.femaleStandardGrams || 3500;
      const maleStd = customStd?.maleStandardGrams || baseStd?.maleStandardGrams || 4300;

      const femaleDev = calculateDeviation(r.femaleAvgWeightGrams, femaleStd);
      const maleDev = calculateDeviation(r.maleAvgWeightGrams, maleStd);

      return {
        date: r.date,
        houseNumber: r.houseNumber,
        week: `Week ${r.week}`,
        femaleActual: r.femaleAvgWeightGrams,
        femaleStd,
        femaleDiff: `${femaleDev.diffGrams > 0 ? '+' : ''}${femaleDev.diffGrams}g (${femaleDev.pctDiff > 0 ? '+' : ''}${femaleDev.pctDiff}%)`,
        maleActual: r.maleAvgWeightGrams,
        maleStd,
        maleDiff: `${maleDev.diffGrams > 0 ? '+' : ''}${maleDev.diffGrams}g (${maleDev.pctDiff > 0 ? '+' : ''}${maleDev.pctDiff}%)`,
        uniformity: `${r.uniformityPct || 85}%`,
        sampleSize: r.sampleSize || 100,
        loggedBy: r.loggedBy || ''
      };
    });

    const meta: ReportMetadata = {
      companyName: farmProfile?.name || 'L.P. LIM CITY FAMILY FARM INC',
      logoUrl: farmProfile?.logoUrl,
      address: farmProfile?.address,
      contactNumber: farmProfile?.contactNumber,
      email: farmProfile?.email,
      reportTitle: `Body Weight & Growth Curve Analysis (${selectedHouse})`,
      dateRange: `All Recorded Growth Cycles`,
      houseFilter: selectedHouse,
      generatedBy: currentUser?.fullName || 'Authorized Staff',
      generatedAt: new Date().toLocaleString()
    };

    const sheet: SheetData = {
      sheetName: 'Growth Analysis',
      title: 'Body Weight & Growth Curve Benchmarks',
      columns: [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'House', key: 'houseNumber', width: 10 },
        { header: 'Age', key: 'week', width: 10 },
        { header: 'Female (g)', key: 'femaleActual', width: 11, align: 'right' },
        { header: 'Female Std', key: 'femaleStd', width: 11, align: 'right' },
        { header: 'Female Var', key: 'femaleDiff', width: 14, align: 'right' },
        { header: 'Male (g)', key: 'maleActual', width: 11, align: 'right' },
        { header: 'Male Std', key: 'maleStd', width: 11, align: 'right' },
        { header: 'Male Var', key: 'maleDiff', width: 14, align: 'right' },
        { header: 'Uniformity', key: 'uniformity', width: 11, align: 'right' },
        { header: 'Sample', key: 'sampleSize', width: 9, align: 'right' },
        { header: 'Logged By', key: 'loggedBy', width: 16 }
      ],
      data: reportData
    };

    exportReportToPdf(meta, [sheet], `Body_Weight_Growth_Report_${selectedHouse}.pdf`, { orientation: 'landscape' });
    toast.success('Official PDF Generated', `Downloaded growth curve report for ${selectedHouse}`);
  };

  const handleExportExcel = () => {
    const reportData = houseRecords.map(r => {
      const baseStd = BASE_WEEKLY_STANDARDS.find(b => b.ageWeek === r.week);
      const customStd = farmProfile?.standardBodyWeights?.find(s => s.ageWeek === r.week);
      const femaleStd = customStd?.femaleStandardGrams || baseStd?.femaleStandardGrams || 3500;
      const maleStd = customStd?.maleStandardGrams || baseStd?.maleStandardGrams || 4300;

      const femaleDev = calculateDeviation(r.femaleAvgWeightGrams, femaleStd);
      const maleDev = calculateDeviation(r.maleAvgWeightGrams, maleStd);

      return {
        date: r.date,
        houseNumber: r.houseNumber,
        week: r.week,
        femaleActualGrams: r.femaleAvgWeightGrams,
        femaleStandardGrams: femaleStd,
        femaleVarianceGrams: femaleDev.diffGrams,
        femaleVariancePct: femaleDev.pctDiff,
        maleActualGrams: r.maleAvgWeightGrams,
        maleStandardGrams: maleStd,
        maleVarianceGrams: maleDev.diffGrams,
        maleVariancePct: maleDev.pctDiff,
        uniformityPct: r.uniformityPct || 85,
        sampleSize: r.sampleSize || 100,
        weeklyGainMale: r.weeklyGainMale || '',
        weeklyGainFemale: r.weeklyGainFemale || '',
        notes: r.notes || '',
        loggedBy: r.loggedBy || ''
      };
    });

    const meta: ReportMetadata = {
      companyName: farmProfile?.name || 'L.P. LIM CITY FAMILY FARM INC',
      logoUrl: farmProfile?.logoUrl,
      address: farmProfile?.address,
      contactNumber: farmProfile?.contactNumber,
      email: farmProfile?.email,
      reportTitle: `Body Weight & Growth Curve Analysis (${selectedHouse})`,
      dateRange: `All Recorded Growth Cycles`,
      houseFilter: selectedHouse,
      generatedBy: currentUser?.fullName || 'Authorized Staff',
      generatedAt: new Date().toLocaleString()
    };

    const sheet: SheetData = {
      sheetName: 'Growth Curve Records',
      title: 'Body Weight & Growth Curve Analysis Workbook',
      columns: [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'House', key: 'houseNumber', width: 10 },
        { header: 'Age (Weeks)', key: 'week', width: 12 },
        { header: 'Female Actual (g)', key: 'femaleActualGrams', width: 14, align: 'right' },
        { header: 'Female Target (g)', key: 'femaleStandardGrams', width: 14, align: 'right' },
        { header: 'Female Diff (g)', key: 'femaleVarianceGrams', width: 13, align: 'right' },
        { header: 'Female Diff %', key: 'femaleVariancePct', width: 13, align: 'right' },
        { header: 'Male Actual (g)', key: 'maleActualGrams', width: 14, align: 'right' },
        { header: 'Male Target (g)', key: 'maleStandardGrams', width: 14, align: 'right' },
        { header: 'Male Diff (g)', key: 'maleVarianceGrams', width: 13, align: 'right' },
        { header: 'Male Diff %', key: 'maleVariancePct', width: 13, align: 'right' },
        { header: 'Uniformity %', key: 'uniformityPct', width: 12, align: 'right' },
        { header: 'Sample Count', key: 'sampleSize', width: 12, align: 'right' },
        { header: 'Male Gain (g/wk)', key: 'weeklyGainMale', width: 14, align: 'right' },
        { header: 'Female Gain (g/wk)', key: 'weeklyGainFemale', width: 14, align: 'right' },
        { header: 'Notes', key: 'notes', width: 25 },
        { header: 'Logged By', key: 'loggedBy', width: 16 }
      ],
      data: reportData
    };

    exportReportToExcel(meta, [sheet], `Body_Weight_Growth_Analysis_${selectedHouse}.xlsx`);
    toast.success('Excel Workbook Generated', `Downloaded official spreadsheet for ${selectedHouse}`);
  };

  const handleExportCsv = () => {
    const columns = [
      { header: 'Date', key: 'date' },
      { header: 'House', key: 'houseNumber' },
      { header: 'Week', key: 'week' },
      { header: 'Female Avg Weight (g)', key: 'femaleAvgWeightGrams' },
      { header: 'Male Avg Weight (g)', key: 'maleAvgWeightGrams' },
      { header: 'Uniformity %', key: 'uniformityPct' },
      { header: 'Sample Size', key: 'sampleSize' },
      { header: 'Male Gain (g/wk)', key: 'weeklyGainMale' },
      { header: 'Female Gain (g/wk)', key: 'weeklyGainFemale' },
      { header: 'Notes', key: 'notes' },
      { header: 'Logged By', key: 'loggedBy' }
    ];
    exportReportToCsv(`Body_Weight_${selectedHouse}_${new Date().toISOString().split('T')[0]}.csv`, columns, houseRecords);
    toast.success('CSV Exported', `Downloaded CSV dataset for ${selectedHouse}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4" />
            <span>Biometric Growth & Fleshing Benchmarks</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Body Weight Growth Curve & Deviation Analysis</h2>
          <p className="text-xs text-slate-500 mt-1">
            Visualizing actual male and female growth curves against Cobb/Ross target trajectories to detect developmental deviations early.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action: Export CSV */}
          <button
            id="export-weight-csv-btn"
            onClick={handleExportCsv}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
            title="Export CSV raw dataset"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>CSV</span>
          </button>

          {/* Action: Export PDF */}
          <button
            id="export-weight-pdf-btn"
            onClick={handleExportPdf}
            className="px-3.5 py-2 bg-forest-900 hover:bg-forest-800 text-mint-300 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
            title="Export official vector PDF with letterhead & benchmarks"
          >
            <FileText className="w-3.5 h-3.5 text-mint-400" />
            <span>PDF</span>
          </button>

          {/* Action: Export Excel */}
          <button
            id="export-weight-excel-btn"
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
            title="Export Excel workbook (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          {/* Action: Batch Upload Growth Standards */}
          {permissions.canManageFarmProfile && (
            <button
              id="batch-upload-standards-btn"
              onClick={() => setShowBatchUploadModal(true)}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
              title="Batch upload custom standard body weight curves"
            >
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              <span>Standards</span>
            </button>
          )}

          {/* Record Sample Weight */}
          <button
            id="log-body-weight-btn"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Sample Weight</span>
          </button>
        </div>
      </div>

      {/* House Filter Selector Bar */}
      <HouseQuickBar
        selectedHouse={selectedHouse}
        onSelectHouse={setSelectedHouse}
        showAllOption={false}
      />

      {/* KPI Cards: Current vs Standard Performance */}
      {latestRecord && assessment && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Female Actual Weight */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">
                Female Weight (Wk {latestRecord.week})
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${assessment.femaleDeviation.badgeClass}`}>
                {assessment.femaleDeviation.diffGrams >= 0 ? '+' : ''}{assessment.femaleDeviation.pctDiff}%
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {(latestRecord.femaleAvgWeightGrams || 0).toLocaleString()} <span className="text-sm font-semibold text-slate-500">g</span>
            </p>
            <div className="mt-2 text-xs flex items-center justify-between text-slate-500">
              <span>Target: {assessment.femaleStandard.toLocaleString()} g</span>
              <span className={`font-bold ${assessment.femaleDeviation.diffGrams >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                ({assessment.femaleDeviation.diffGrams >= 0 ? '+' : ''}{assessment.femaleDeviation.diffGrams} g)
              </span>
            </div>
          </div>

          {/* Male Actual Weight */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
                Male Weight (Wk {latestRecord.week})
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${assessment.maleDeviation.badgeClass}`}>
                {assessment.maleDeviation.diffGrams >= 0 ? '+' : ''}{assessment.maleDeviation.pctDiff}%
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {(latestRecord.maleAvgWeightGrams || 0).toLocaleString()} <span className="text-sm font-semibold text-slate-500">g</span>
            </p>
            <div className="mt-2 text-xs flex items-center justify-between text-slate-500">
              <span>Target: {assessment.maleStandard.toLocaleString()} g</span>
              <span className={`font-bold ${assessment.maleDeviation.diffGrams >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                ({assessment.maleDeviation.diffGrams >= 0 ? '+' : ''}{assessment.maleDeviation.diffGrams} g)
              </span>
            </div>
          </div>

          {/* Flock Uniformity % */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                Flock Uniformity
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                assessment.uniformityStatus === 'optimal'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {assessment.uniformityStatus === 'optimal' ? 'Good (≥85%)' : 'Moderate (<85%)'}
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {latestRecord.uniformityPct || 88}%
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Within ±10% Body Weight Mean
            </p>
          </div>

          {/* Male-to-Female Ratio / Mating Synchrony */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">
                Male:Female Ratio
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                assessment.ratioStatus === 'optimal'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {assessment.ratioStatus === 'optimal' ? 'Synchronized' : 'Review Grill'}
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {assessment.maleToFemaleRatio} <span className="text-sm font-semibold text-slate-500">x</span>
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Ideal Breeder Ratio: 1.20 - 1.25x
            </p>
          </div>
        </div>
      )}

      {/* Visual Analytics Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200 overflow-x-auto">
        <button
          id="tab-growth-curves"
          onClick={() => setActiveTab('curves')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'curves'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-teal-600" />
          <span>Growth Curves (Target vs Actual)</span>
        </button>

        <button
          id="tab-deviation-variance"
          onClick={() => setActiveTab('deviation')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'deviation'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Developmental Deviation & Variance (Δ)</span>
        </button>

        <button
          id="tab-growth-velocity"
          onClick={() => setActiveTab('velocity')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'velocity'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Activity className="w-4 h-4 text-blue-600" />
          <span>Gain Velocity (g/week)</span>
        </button>

        <button
          id="tab-uniformity"
          onClick={() => setActiveTab('uniformity')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'uniformity'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Target className="w-4 h-4 text-emerald-600" />
          <span>Uniformity Trajectory (CV%)</span>
        </button>

        <button
          id="tab-multihouse"
          onClick={() => setActiveTab('multihouse')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'multihouse'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Building2 className="w-4 h-4 text-purple-600" />
          <span>Multi-House Comparison</span>
        </button>
      </div>

      {/* Chart Display Area (Powered by Recharts) */}
      {activeTab === 'curves' && (
        <GrowthCurveChart
          records={houseRecords}
          customStandards={farmProfile?.standardBodyWeights}
          selectedHouse={selectedHouse}
        />
      )}

      {activeTab === 'deviation' && (
        <DeviationVarianceChart
          records={houseRecords}
          customStandards={farmProfile?.standardBodyWeights}
          selectedHouse={selectedHouse}
        />
      )}

      {activeTab === 'velocity' && (
        <GrowthVelocityChart
          records={houseRecords}
          customStandards={farmProfile?.standardBodyWeights}
          selectedHouse={selectedHouse}
        />
      )}

      {activeTab === 'uniformity' && (
        <UniformityTrendChart
          records={houseRecords}
          selectedHouse={selectedHouse}
        />
      )}

      {activeTab === 'multihouse' && (
        <MultiHouseComparisonChart
          bodyWeights={bodyWeights}
          flocks={flocks}
          customStandards={farmProfile?.standardBodyWeights}
        />
      )}

      {/* Early Warning Advisory & Diagnostic Card */}
      <EarlyWarningAdvisory
        assessment={assessment}
        selectedHouse={selectedHouse}
      />

      {/* Historical Weight Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Sample Weighing History Log ({selectedHouse})
            </h3>
            <p className="text-xs text-slate-500">Detailed records of weekly sample weights and uniformity</p>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by week, date, notes..."
              className="pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500 w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3">House</th>
                <th className="py-3 px-3">Age (Week)</th>
                <th className="py-3 px-3 text-right">Female Avg (g)</th>
                <th className="py-3 px-3 text-right">Female Variance</th>
                <th className="py-3 px-3 text-right">Male Avg (g)</th>
                <th className="py-3 px-3 text-right">Male Variance</th>
                <th className="py-3 px-3 text-right">Uniformity</th>
                <th className="py-3 px-3 text-right">Sample Count</th>
                <th className="py-3 px-3.5">Notes & Fleshing</th>
                <th className="py-3 px-3">Logged By</th>
                {permissions.canDeleteRecord && <th className="py-3 px-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTableRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 text-xs">
                    No body weight records matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredTableRecords.map(rec => {
                  const baseStd = BASE_WEEKLY_STANDARDS.find(b => b.ageWeek === rec.week);
                  const customStd = farmProfile?.standardBodyWeights?.find(s => s.ageWeek === rec.week);
                  const femaleStd = customStd?.femaleStandardGrams || baseStd?.femaleStandardGrams || 3500;
                  const maleStd = customStd?.maleStandardGrams || baseStd?.maleStandardGrams || 4300;

                  const femaleDev = calculateDeviation(rec.femaleAvgWeightGrams, femaleStd);
                  const maleDev = calculateDeviation(rec.maleAvgWeightGrams, maleStd);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3.5 font-medium text-slate-700 whitespace-nowrap">{rec.date}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{rec.houseNumber}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">Week {rec.week}</td>
                      
                      {/* Female Actual */}
                      <td className="py-3 px-3 text-right font-bold text-rose-950 whitespace-nowrap">
                        {rec.femaleAvgWeightGrams.toLocaleString()} g
                      </td>

                      {/* Female Variance */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${femaleDev.badgeClass}`}>
                          {femaleDev.diffGrams > 0 ? '+' : ''}{femaleDev.diffGrams} g ({femaleDev.pctDiff > 0 ? '+' : ''}{femaleDev.pctDiff}%)
                        </span>
                      </td>

                      {/* Male Actual */}
                      <td className="py-3 px-3 text-right font-bold text-teal-950 whitespace-nowrap">
                        {rec.maleAvgWeightGrams.toLocaleString()} g
                      </td>

                      {/* Male Variance */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${maleDev.badgeClass}`}>
                          {maleDev.diffGrams > 0 ? '+' : ''}{maleDev.diffGrams} g ({maleDev.pctDiff > 0 ? '+' : ''}{maleDev.pctDiff}%)
                        </span>
                      </td>

                      {/* Uniformity */}
                      <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                        {rec.uniformityPct || 88}%
                      </td>

                      {/* Sample Count */}
                      <td className="py-3 px-3 text-right text-slate-600">
                        {rec.sampleSize || 100}
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-3.5 text-slate-600 max-w-xs truncate" title={rec.notes}>
                        {rec.notes || '—'}
                      </td>

                      {/* Logged By */}
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {rec.loggedBy}
                      </td>

                      {/* Delete */}
                      {permissions.canDeleteRecord && (
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (confirm(`Delete body weight sample for ${rec.houseNumber} Week ${rec.week}?`)) {
                                deleteBodyWeightRecord(rec.id);
                                toast.info('Record Deleted', `Deleted Week ${rec.week} weight sample.`);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Delete sample record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Sample Weight */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-teal-950 p-5 text-white flex items-center justify-between border-b border-teal-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-900/80 rounded-xl text-teal-300 border border-teal-800">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Record Weekly Sample Weights</h3>
                  <p className="text-xs text-teal-300/80">Log sample bird biometric data & uniformity</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-teal-400 hover:text-white p-1 rounded-lg text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">House Number *</label>
                  <select
                    value={modalHouseNumber}
                    onChange={e => setModalHouseNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white outline-hidden focus:outline-teal-500 font-semibold"
                  >
                    {flocks.map(f => (
                      <option key={f.id} value={f.houseNumber}>{f.houseNumber} ({f.breed})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Flock Age (Weeks) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="80"
                    value={modalWeek}
                    onChange={e => setModalWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden font-bold focus:outline-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Weighing Date *</label>
                <input
                  type="date"
                  required
                  value={modalDate}
                  onChange={e => setModalDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                />
              </div>

              {/* Female & Male sample weight inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200/80 space-y-1">
                  <label className="block font-bold text-rose-950">Female Avg Weight (g) *</label>
                  <input
                    type="number"
                    required
                    value={femaleAvgWeightGrams}
                    onChange={e => setFemaleAvgWeightGrams(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-rose-200 rounded-xl bg-white outline-hidden font-black text-rose-950 focus:outline-rose-500 text-sm"
                  />
                  <span className="text-[10px] text-rose-700 block">Standard: ~3,500g at peak</span>
                </div>

                <div className="bg-teal-50/70 p-3.5 rounded-2xl border border-teal-200/80 space-y-1">
                  <label className="block font-bold text-teal-950">Male Avg Weight (g) *</label>
                  <input
                    type="number"
                    required
                    value={maleAvgWeightGrams}
                    onChange={e => setMaleAvgWeightGrams(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-teal-200 rounded-xl bg-white outline-hidden font-black text-teal-950 focus:outline-teal-500 text-sm"
                  />
                  <span className="text-[10px] text-teal-700 block">Standard: ~4,300g at peak</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Uniformity % (±10% mean)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={uniformityPct}
                    onChange={e => setUniformityPct(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden font-bold focus:outline-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sample Count (Birds)</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={sampleSize}
                    onChange={e => setSampleSize(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Fleshing Score / Keel Assessment</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Fleshing score 3 (V-shape), keel bone normal, active libido"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:outline-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                >
                  Save Sample Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standards Batch Upload Modal */}
      <StandardsBatchUploadModal
        isOpen={showBatchUploadModal}
        onClose={() => setShowBatchUploadModal(false)}
        initialTarget="bodyweight"
      />
    </div>
  );
};
