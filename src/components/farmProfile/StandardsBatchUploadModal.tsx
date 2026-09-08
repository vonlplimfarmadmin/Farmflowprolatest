import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  Layers, 
  Syringe, 
  Wheat, 
  TrendingUp, 
  Scale, 
  Egg, 
  HelpCircle,
  FileDown,
  ArrowRight,
  Database,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../common/ToastContainer';
import { 
  StandardTarget, 
  ParseResult, 
  parseStandardsFile, 
  downloadStandardTemplate, 
  exportCurrentStandards 
} from '../../utils/standardsImportExport';
import { 
  StandardMedProgramItem, 
  StandardFeedGuideItem, 
  StandardHendayItem, 
  StandardBodyWeightItem, 
  StandardEggWeightItem 
} from '../../types';

interface StandardsBatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: StandardTarget;
}

const TARGET_CONFIGS: {
  id: StandardTarget;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}[] = [
  {
    id: 'all',
    label: 'Master Workbook (All 5 Standards)',
    shortLabel: 'All Standards',
    icon: Layers,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    description: 'Multi-sheet Excel workbook importing Vaccination, Feed Guide, Henday, Body Weight & Egg Weight at once'
  },
  {
    id: 'vaccine',
    label: 'Vaccination & Medication Program',
    shortLabel: 'Vaccination',
    icon: Syringe,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    description: 'Immunization schedule, vaccine products, target diseases, administration methods, and timing'
  },
  {
    id: 'feed',
    label: 'Standard Feed Guide by Breed',
    shortLabel: 'Feed Guide',
    icon: Wheat,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'Grams per bird per day (g/bird/day) and feed formulations for male and female breeders'
  },
  {
    id: 'henday',
    label: 'Standard Henday % & Hatching Egg Curve',
    shortLabel: 'Henday %',
    icon: TrendingUp,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    description: 'Benchmark lay percentage and hatching egg (HE) percentage curve from onset through late-lay'
  },
  {
    id: 'bodyweight',
    label: 'Standard Body Weight Curves',
    shortLabel: 'Body Weight',
    icon: Scale,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Target weight milestones (grams) for male and female breeders, with tolerance boundaries'
  },
  {
    id: 'eggweight',
    label: 'Standard Egg Weight Progression',
    shortLabel: 'Egg Weight',
    icon: Egg,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Average target hatching egg weight (grams) across flock production age'
  }
];

export const StandardsBatchUploadModal: React.FC<StandardsBatchUploadModalProps> = ({
  isOpen,
  onClose,
  initialTarget = 'all'
}) => {
  const { 
    farmProfile, 
    updateStandardVaccination, 
    updateStandardFeedGuide, 
    updateStandardHenday, 
    updateStandardBodyWeights, 
    updateStandardEggWeights 
  } = useFarm();
  const toast = useToast();

  const [selectedTarget, setSelectedTarget] = useState<StandardTarget>(initialTarget);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<string>('');
  const [commitStatus, setCommitStatus] = useState<'idle' | 'committing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialTarget when modal opens or prop changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedTarget(initialTarget);
      setUploadedFile(null);
      setParseResult(null);
      setCommitStatus('idle');
      setStatusMessage('');
    }
  }, [isOpen, initialTarget]);

  if (!isOpen) return null;

  const currentConfig = TARGET_CONFIGS.find(t => t.id === selectedTarget) || TARGET_CONFIGS[0];

  const handleTargetChange = (newTarget: StandardTarget) => {
    setSelectedTarget(newTarget);
    setUploadedFile(null);
    setParseResult(null);
    setCommitStatus('idle');
    setStatusMessage('');
  };

  const handleFileProcess = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!hasValidExt) {
      toast.error(
        'Unsupported File Format',
        `"${file.name}" is not a recognized spreadsheet. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.`
      );
      setStatusMessage(`Invalid file format: "${file.name}". Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.`);
      setUploadedFile(null);
      setParseResult(null);
      return;
    }

    setUploadedFile(file);
    setIsParsing(true);
    setCommitStatus('idle');
    setStatusMessage('');

    try {
      const result = await parseStandardsFile(file, selectedTarget);
      setParseResult(result);
      
      // Select first available sheet preview tab
      const availableTabs = Object.keys(result.data).filter(
        k => (result.data as any)[k] && (result.data as any)[k].length > 0
      );
      if (availableTabs.length > 0) {
        setActivePreviewTab(availableTabs[0]);
      }

      if (result.validRowsCount === 0) {
        toast.warning(
          'No Valid Rows Found',
          'The spreadsheet was read, but no benchmark rows matched the target format. Check template requirements.'
        );
      } else {
        toast.info(
          'Spreadsheet Parsed',
          `Identified ${result.validRowsCount} valid standard rows ready for review.`
        );
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setParseResult(null);
      const errMsg = `Failed to read file: ${err?.message || 'Invalid or corrupted spreadsheet.'}`;
      setStatusMessage(errMsg);
      toast.error('File Parsing Error', err?.message || 'Unable to open or read spreadsheet file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileProcess(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleCommit = async () => {
    if (!parseResult || !parseResult.success) return;

    setCommitStatus('committing');
    setStatusMessage('Saving standards to farm profile...');

    try {
      const { data } = parseResult;
      const changesSummary: string[] = [];

      // 1. Vaccination Program
      if (data.vaccine && data.vaccine.length > 0) {
        let updated: StandardMedProgramItem[];
        if (importMode === 'replace') {
          updated = [...data.vaccine];
        } else {
          // Merge by ageWeek + productName
          const existing = [...(farmProfile.standardVaccinationProgram || [])];
          data.vaccine.forEach(newItem => {
            const idx = existing.findIndex(
              e => e.ageWeek === newItem.ageWeek && e.productName.toLowerCase() === newItem.productName.toLowerCase()
            );
            if (idx >= 0) {
              existing[idx] = newItem;
            } else {
              existing.push(newItem);
            }
          });
          updated = existing;
        }
        updated.sort((a, b) => a.ageWeek - b.ageWeek);
        updateStandardVaccination(updated);
        changesSummary.push(`${updated.length} Vaccination rules`);
      }

      // 2. Feed Guide
      if (data.feed && data.feed.length > 0) {
        let updated: StandardFeedGuideItem[];
        if (importMode === 'replace') {
          updated = [...data.feed];
        } else {
          // Merge by breedType + ageWeek
          const existing = [...(farmProfile.standardFeedGuide || [])];
          data.feed.forEach(newItem => {
            const idx = existing.findIndex(
              e => (e.breedType || '').toLowerCase() === (newItem.breedType || '').toLowerCase() && e.ageWeek === newItem.ageWeek
            );
            if (idx >= 0) {
              existing[idx] = newItem;
            } else {
              existing.push(newItem);
            }
          });
          updated = existing;
        }
        updated.sort((a, b) => {
          if ((a.breedType || '') === (b.breedType || '')) return a.ageWeek - b.ageWeek;
          return (a.breedType || '').localeCompare(b.breedType || '');
        });
        updateStandardFeedGuide(updated);
        changesSummary.push(`${updated.length} Feed Guide allocations`);
      }

      // 3. Henday %
      if (data.henday && data.henday.length > 0) {
        let updated: StandardHendayItem[];
        if (importMode === 'replace') {
          updated = [...data.henday];
        } else {
          // Merge by ageWeek
          const existing = [...(farmProfile.standardHenday || [])];
          data.henday.forEach(newItem => {
            const idx = existing.findIndex(e => e.ageWeek === newItem.ageWeek);
            if (idx >= 0) {
              existing[idx] = newItem;
            } else {
              existing.push(newItem);
            }
          });
          updated = existing;
        }
        updated.sort((a, b) => a.ageWeek - b.ageWeek);
        updateStandardHenday(updated);
        changesSummary.push(`${updated.length} Henday lay curve points`);
      }

      // 4. Body Weight
      if (data.bodyweight && data.bodyweight.length > 0) {
        let updated: StandardBodyWeightItem[];
        if (importMode === 'replace') {
          updated = [...data.bodyweight];
        } else {
          // Merge by ageWeek
          const existing = [...(farmProfile.standardBodyWeights || [])];
          data.bodyweight.forEach(newItem => {
            const idx = existing.findIndex(e => e.ageWeek === newItem.ageWeek);
            if (idx >= 0) {
              existing[idx] = newItem;
            } else {
              existing.push(newItem);
            }
          });
          updated = existing;
        }
        updated.sort((a, b) => a.ageWeek - b.ageWeek);
        updateStandardBodyWeights(updated);
        changesSummary.push(`${updated.length} Body Weight benchmarks`);
      }

      // 5. Egg Weight
      if (data.eggweight && data.eggweight.length > 0) {
        let updated: StandardEggWeightItem[];
        if (importMode === 'replace') {
          updated = [...data.eggweight];
        } else {
          // Merge by ageWeek
          const existing = [...(farmProfile.standardEggWeights || [])];
          data.eggweight.forEach(newItem => {
            const idx = existing.findIndex(e => e.ageWeek === newItem.ageWeek);
            if (idx >= 0) {
              existing[idx] = newItem;
            } else {
              existing.push(newItem);
            }
          });
          updated = existing;
        }
        updated.sort((a, b) => a.ageWeek - b.ageWeek);
        updateStandardEggWeights(updated);
        changesSummary.push(`${updated.length} Egg Weight targets`);
      }

      setCommitStatus('success');
      const successText = `Successfully applied: ${changesSummary.join(', ')}.`;
      setStatusMessage(successText);
      toast.success('Standards Imported Successfully', successText);
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err: any) {
      console.error('Error committing standards:', err);
      setCommitStatus('error');
      const errorMsg = `Failed to save standards: ${err?.message || 'Internal database error.'}`;
      setStatusMessage(errorMsg);
      toast.error('Standards Save Error', errorMsg);
    }
  };

  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    downloadStandardTemplate(selectedTarget, format, farmProfile?.name || 'FarmFlow');
  };

  const handleExportCurrent = () => {
    exportCurrentStandards(farmProfile, selectedTarget);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-gradient-to-r from-slate-50 to-teal-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Batch Upload Farm Standards</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Excel (.xlsx) & CSV
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Bulk import benchmark schedules, feed tables, growth curves, and weight targets
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          
          {/* Target Selector Navigation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Standard Category to Upload
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {TARGET_CONFIGS.map(t => {
                const isSelected = selectedTarget === t.id;
                const IconComponent = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTargetChange(t.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                      isSelected
                        ? `${t.bgColor} ${t.borderColor} ${t.color} font-bold ring-2 ring-teal-500/20 shadow-xs`
                        : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 mb-1.5 ${isSelected ? t.color : 'text-slate-400'}`} />
                    <span className="text-xs leading-tight line-clamp-1">{t.shortLabel}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">{currentConfig.label}:</span>
              {currentConfig.description}
            </p>
          </div>

          {/* Quick Actions Bar: Download Template & Export Existing */}
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileDown className="w-4 h-4 text-teal-600" />
              <div>
                <p className="text-xs font-bold text-slate-800">Need the standard format?</p>
                <p className="text-[11px] text-slate-500">
                  Download a pre-formatted template with Cobb 500 / Ross 308 reference rows.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleDownloadTemplate('xlsx')}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>Template (.xlsx)</span>
              </button>
              {selectedTarget !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('csv')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Template (.csv)</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleExportCurrent}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-teal-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                title="Export current standards to backup or modify"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Export Current Data</span>
              </button>
            </div>
          </div>

          {/* Dropzone Area */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                dragOver 
                  ? 'border-teal-500 bg-teal-50/60 scale-[0.99]' 
                  : uploadedFile 
                    ? 'border-teal-300 bg-teal-50/20' 
                    : 'border-slate-300 hover:border-teal-400 bg-slate-50/40 hover:bg-slate-50/80'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition shadow-xs ${
                uploadedFile ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {isParsing ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              {uploadedFile ? (
                <div>
                  <p className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1.5">
                    <span>{uploadedFile.name}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      ({(uploadedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </p>
                  <p className="text-xs text-teal-600 mt-1 font-medium">
                    Click or drag another file to replace
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Drop your spreadsheet here, or <span className="text-teal-600 underline">browse files</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Import Mode Radio Options */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Import Mode Strategy</span>
              <span className="text-[11px] text-slate-500">Choose how data should merge</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                  importMode === 'replace'
                    ? 'border-teal-500 bg-teal-50/40 text-slate-900 font-semibold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="text-xs font-bold block text-slate-900">Replace All Existing</span>
                  <span className="text-[11px] text-slate-500 font-normal leading-relaxed block">
                    Completely overwrites the selected standard with the uploaded records. Recommended for fresh benchmarks.
                  </span>
                </div>
              </label>

              <label 
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                  importMode === 'merge'
                    ? 'border-teal-500 bg-teal-50/40 text-slate-900 font-semibold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="mt-0.5 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="text-xs font-bold block text-slate-900">Merge & Upsert by Week</span>
                  <span className="text-[11px] text-slate-500 font-normal leading-relaxed block">
                    Keeps unchanged weeks, updates matching weeks with new targets, and appends any missing weeks.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Validation & Preview Section */}
          {parseResult && (
            <div className="space-y-4 animate-fadeIn">
              {/* Status summary banner */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                parseResult.success 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50/70 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-2.5">
                  {parseResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-bold">
                      {parseResult.success 
                        ? `Parsed Successfully: ${parseResult.validRowsCount} valid standard rows found` 
                        : 'No valid rows could be identified in the file'}
                    </p>
                    <p className="text-[11px] opacity-80">
                      Sheets detected: {parseResult.detectedSheets.join(', ') || 'Default sheet'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className={`px-2.5 py-1 rounded-lg border font-semibold ${
                    parseResult.validRowsCount > 0 
                      ? 'bg-white/90 border-emerald-200 text-emerald-800' 
                      : 'bg-white/90 border-rose-200 text-rose-800'
                  }`}>
                    {parseResult.validRowsCount} Ready
                  </span>
                  {parseResult.issues.length > 0 && (
                    <span className={`px-2.5 py-1 rounded-lg border font-semibold ${
                      parseResult.errorRowsCount > 0 
                        ? 'bg-rose-100 border-rose-300 text-rose-800' 
                        : 'bg-amber-100 border-amber-300 text-amber-800'
                    }`}>
                      {parseResult.issues.length} {parseResult.errorRowsCount > 0 ? 'Errors & Warnings' : 'Notes'}
                    </span>
                  )}
                </div>
              </div>

              {/* Comprehensive Error Prompt Card when parsing fails */}
              {!parseResult.success && (
                <div className="p-4 bg-rose-50 border border-rose-200/90 rounded-xl space-y-3 text-rose-950">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                        Spreadsheet Verification Alert
                      </h4>
                      <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                        The uploaded file could not be parsed into valid benchmark rows for <strong>{currentConfig.label}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/90 rounded-lg p-3 border border-rose-200 text-xs space-y-1.5">
                    <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                      Diagnostic Guidance:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
                      <li>Ensure column headers are placed on the first row of your worksheet.</li>
                      <li>Check that column names match common terms (e.g., <code>Age (Week)</code>, <code>Male Target (g)</code>, <code>Female Target (g)</code>).</li>
                      <li>Remove non-numeric characters or currency signs from numeric data columns.</li>
                      <li>For multi-sheet workbooks, label sheets clearly as <em>Vaccination</em>, <em>Feed</em>, <em>Henday</em>, <em>Body Weight</em>, or <em>Egg Weight</em>.</li>
                    </ul>
                  </div>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('xlsx')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download {currentConfig.shortLabel} Template (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setParseResult(null);
                        setStatusMessage('');
                      }}
                      className="px-3 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Select Another File
                    </button>
                  </div>
                </div>
              )}

              {/* Issues list if any */}
              {parseResult.issues.length > 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2 text-xs text-amber-900">
                  <div className="flex items-center justify-between">
                    <p className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-950">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Spreadsheet Verification Prompts & Warnings ({parseResult.issues.length})
                    </p>
                    <span className="text-[10px] text-amber-700 font-medium">
                      Review warnings before saving
                    </span>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                    {parseResult.issues.map((issue, i) => (
                      <div key={i} className={`p-1.5 rounded-lg border flex items-start gap-2 ${
                        issue.severity === 'error'
                          ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                          : 'bg-amber-50/80 border-amber-200 text-amber-900'
                      }`}>
                        <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] uppercase shrink-0 mt-0.5 ${
                          issue.severity === 'error' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                        }`}>
                          {issue.severity === 'error' ? 'Error' : 'Warning'} (Row {issue.row})
                        </span>
                        <div className="flex-1">
                          {issue.field && <strong className="font-semibold">{issue.field}: </strong>}
                          <span>{issue.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Tables */}
              <div>
                {/* Category preview tabs */}
                <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-3 overflow-x-auto">
                  {Object.entries(parseResult.data).map(([key, items]) => {
                    if (!items || (items as any[]).length === 0) return null;
                    const count = (items as any[]).length;
                    const isActive = activePreviewTab === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActivePreviewTab(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                          isActive
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="capitalize">{key === 'vaccine' ? 'Vaccination' : key === 'feed' ? 'Feed Guide' : key === 'henday' ? 'Henday %' : key === 'bodyweight' ? 'Body Weight' : 'Egg Weight'}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-teal-700 text-white' : 'bg-white text-slate-600'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Table for active preview tab */}
                <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs max-h-56 overflow-y-auto">
                  {activePreviewTab === 'vaccine' && parseResult.data.vaccine && (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 sticky top-0 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Age Week</th>
                          <th className="py-2 px-3">Product / Vaccine</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Target Disease</th>
                          <th className="py-2 px-3">Method</th>
                          <th className="py-2 px-3">Mandatory</th>
                          <th className="py-2 px-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parseResult.data.vaccine.slice(0, 15).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-bold text-slate-800">Wk {row.ageWeek}</td>
                            <td className="py-1.5 px-3 font-medium text-teal-900">{row.productName}</td>
                            <td className="py-1.5 px-3">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                                {row.productType}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-slate-600">{row.diseaseTarget}</td>
                            <td className="py-1.5 px-3 text-slate-600">{row.method}</td>
                            <td className="py-1.5 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                row.mandatory ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {row.mandatory ? 'Mandatory' : 'Optional'}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-slate-400 max-w-xs truncate">{row.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activePreviewTab === 'feed' && parseResult.data.feed && (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 sticky top-0 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Breed</th>
                          <th className="py-2 px-3">Age Week</th>
                          <th className="py-2 px-3">Phase</th>
                          <th className="py-2 px-3">Female Feed</th>
                          <th className="py-2 px-3">Female (g/bird)</th>
                          <th className="py-2 px-3">Male Feed</th>
                          <th className="py-2 px-3">Male (g/bird)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parseResult.data.feed.slice(0, 15).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-bold text-amber-900">{row.breedType}</td>
                            <td className="py-1.5 px-3 font-bold text-slate-800">Wk {row.ageWeek}</td>
                            <td className="py-1.5 px-3 text-slate-600">{row.productionPhase}</td>
                            <td className="py-1.5 px-3 font-medium text-slate-700">{row.femaleFeedType}</td>
                            <td className="py-1.5 px-3 font-bold text-teal-700">{row.femaleGramsPerBird} g</td>
                            <td className="py-1.5 px-3 font-medium text-slate-700">{row.maleFeedType}</td>
                            <td className="py-1.5 px-3 font-bold text-teal-900">{row.maleGramsPerBird} g</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activePreviewTab === 'henday' && parseResult.data.henday && (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 sticky top-0 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Flock Age</th>
                          <th className="py-2 px-3">Production Week</th>
                          <th className="py-2 px-3">Standard Henday %</th>
                          <th className="py-2 px-3">Standard Hatching %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parseResult.data.henday.slice(0, 15).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-bold text-slate-800">Week {row.ageWeek}</td>
                            <td className="py-1.5 px-3 text-slate-600">Prod Wk {row.ageInProduction}</td>
                            <td className="py-1.5 px-3 font-bold text-teal-700">{row.standardHendayPct}%</td>
                            <td className="py-1.5 px-3 font-bold text-emerald-700">{row.standardHatchingPct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activePreviewTab === 'bodyweight' && parseResult.data.bodyweight && (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 sticky top-0 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Age Week</th>
                          <th className="py-2 px-3">Male Target (g)</th>
                          <th className="py-2 px-3">Female Target (g)</th>
                          <th className="py-2 px-3">Tolerance Min (g)</th>
                          <th className="py-2 px-3">Tolerance Max (g)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parseResult.data.bodyweight.slice(0, 15).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-bold text-slate-800">Week {row.ageWeek}</td>
                            <td className="py-1.5 px-3 font-bold text-blue-900">{row.maleStandardGrams.toLocaleString()} g</td>
                            <td className="py-1.5 px-3 font-bold text-teal-700">{row.femaleStandardGrams.toLocaleString()} g</td>
                            <td className="py-1.5 px-3 text-slate-500">{row.toleranceMinGrams ? `${row.toleranceMinGrams} g` : '—'}</td>
                            <td className="py-1.5 px-3 text-slate-500">{row.toleranceMaxGrams ? `${row.toleranceMaxGrams} g` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {activePreviewTab === 'eggweight' && parseResult.data.eggweight && (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 sticky top-0 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Age Week</th>
                          <th className="py-2 px-3">Production Week</th>
                          <th className="py-2 px-3">Standard Egg Weight (g)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parseResult.data.eggweight.slice(0, 15).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-bold text-slate-800">Week {row.ageWeek}</td>
                            <td className="py-1.5 px-3 text-slate-600">Prod Wk {row.ageInProduction}</td>
                            <td className="py-1.5 px-3 font-bold text-purple-800">{row.standardWeightGrams} g</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status Message if committing or failed */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              commitStatus === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                : commitStatus === 'error' 
                  ? 'bg-rose-50 text-rose-900 border-rose-200' 
                  : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}>
              {commitStatus === 'committing' && <RefreshCw className="w-4 h-4 animate-spin" />}
              {commitStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {commitStatus === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{statusMessage}</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!parseResult || !parseResult.success || commitStatus === 'committing' || commitStatus === 'success'}
              onClick={handleCommit}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer ${
                parseResult && parseResult.success && commitStatus !== 'committing' && commitStatus !== 'success'
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {commitStatus === 'committing' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Committing Standards...</span>
                </>
              ) : commitStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Applied Successfully!</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>
                    Commit & Save Standards {parseResult ? `(${parseResult.validRowsCount} Rows)` : ''}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
