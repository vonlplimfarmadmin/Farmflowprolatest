import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Trash2, 
  RefreshCw, 
  HelpCircle,
  FileDown,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  Package,
  AlertTriangle
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../common/ToastContainer';
import { 
  HealthBatchItem, 
  HealthBatchValidationIssue,
  parseHealthItemsFile, 
  downloadHealthItemsTemplate, 
  exportCurrentHealthItems 
} from '../../utils/healthBatchUploadUtils';
import { ProductType } from '../../types';

interface HealthBatchUploadSectionProps {
  onSuccess: (count: number) => void;
  onCancel: () => void;
}

export const HealthBatchUploadSection: React.FC<HealthBatchUploadSectionProps> = ({
  onSuccess,
  onCancel
}) => {
  const { medProducts, addMedProductsBatch, farmProfile } = useFarm();
  const toast = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<HealthBatchItem[]>([]);
  const [validationIssues, setValidationIssues] = useState<HealthBatchValidationIssue[]>([]);
  const [mergeExisting, setMergeExisting] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedSheets, setDetectedSheets] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const handleFileProcess = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      toast.error(
        'Invalid File Format',
        `"${file.name}" is not an Excel (.xlsx, .xls) or CSV (.csv) file.`
      );
      return;
    }

    setIsParsing(true);
    setUploadedFile(file);

    try {
      const result = await parseHealthItemsFile(file);
      setParsedItems(result.items);
      setValidationIssues(result.issues);
      setDetectedSheets(result.sheetNames);

      if (result.items.length === 0) {
        toast.warning(
          'No Valid Items Found',
          'Could not find valid health item rows with product names in the uploaded sheet.'
        );
      } else {
        toast.success(
          'File Parsed Successfully',
          `Detected ${result.items.length} health products ready for review.`
        );
      }
    } catch (err: any) {
      toast.error('File Read Error', err?.message || 'Failed to parse file. Please verify format.');
      setParsedItems([]);
      setValidationIssues([{
        row: 1,
        field: 'File',
        message: 'Could not read file contents.',
        severity: 'error'
      }]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleRemoveRow = (index: number) => {
    setParsedItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleReset = () => {
    setUploadedFile(null);
    setParsedItems([]);
    setValidationIssues([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCommitUpload = () => {
    if (parsedItems.length === 0) {
      toast.error('No Items to Upload', 'Please upload a spreadsheet with at least one valid health item.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedItems = parsedItems.map(item => ({
        name: item.name,
        type: item.type,
        manufacturer: item.manufacturer,
        manufacturingDate: new Date().toISOString().split('T')[0],
        expirationDate: item.expirationDate,
        expiryDate: item.expirationDate,
        unitType: item.unitType,
        dosesPerUnit: item.dosesPerUnit,
        currentStockUnits: item.currentStockUnits,
        currentStock: item.currentStockUnits,
        dosage: item.dosage,
        packaging: item.packaging || `${item.dosesPerUnit.toLocaleString()} doses / ${item.unitType}`,
        notes: item.notes
      }));

      addMedProductsBatch(formattedItems, mergeExisting);

      toast.success(
        'Batch Upload Complete!',
        `Successfully registered ${parsedItems.length} health products to farm biological pharmacy.`
      );

      onSuccess(parsedItems.length);
    } catch (err: any) {
      toast.error('Import Failed', err?.message || 'An error occurred during batch registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalUnits = parsedItems.reduce((acc, item) => acc + (item.currentStockUnits || 0), 0);
  const totalDoses = parsedItems.reduce((acc, item) => acc + ((item.currentStockUnits || 0) * (item.dosesPerUnit || 1000)), 0);

  const errorCount = validationIssues.filter(i => i.severity === 'error').length;
  const warningCount = validationIssues.filter(i => i.severity === 'warning').length;

  const categories = ['All', ...Array.from(new Set(parsedItems.map(i => i.type)))];
  const filteredItems = filterCategory === 'All'
    ? parsedItems
    : parsedItems.filter(i => i.type === filterCategory);

  return (
    <div className="space-y-5">
      {/* Template & Helper Banner */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Health Items Spreadsheet Template</h4>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Download pre-formatted Excel or CSV templates with sample vaccines, antibiotics, and vitamins.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => downloadHealthItemsTemplate('xlsx')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => downloadHealthItemsTemplate('csv')}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV (.csv)</span>
          </button>
          {medProducts.length > 0 && (
            <button
              type="button"
              onClick={() => exportCurrentHealthItems(medProducts, farmProfile?.name)}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl font-bold text-teal-800 flex items-center gap-1.5 shadow-2xs transition"
              title="Export your current inventory as an editable spreadsheet"
            >
              <FileDown className="w-3.5 h-3.5 text-teal-700" />
              <span>Export Current</span>
            </button>
          )}
        </div>
      </div>

      {/* Upload Drag & Drop Area */}
      {!uploadedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-teal-600 bg-teal-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-teal-500 hover:bg-teal-50/30 bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-xs">
            <Upload className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              Drag & drop your health inventory spreadsheet here
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
            </p>
          </div>
          <button
            type="button"
            className="mt-1 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            Browse Files from Computer
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active File Bar */}
          <div className="bg-teal-50/80 border border-teal-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{uploadedFile.name}</span>
                  <span className="text-[10px] bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full font-bold">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <p className="text-teal-900/80 text-[11px] mt-0.5">
                  {detectedSheets.length > 0 && `Worksheet: ${detectedSheets[0]} • `}
                  {parsedItems.length} products parsed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold flex items-center gap-1.5 transition shadow-2xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Change File</span>
              </button>
            </div>
          </div>

          {/* Validation Banner if any issues */}
          {validationIssues.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Validation Notices ({errorCount} errors, {warningCount} warnings)
                </span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800 max-h-24 overflow-y-auto pl-1">
                {validationIssues.slice(0, 5).map((iss, i) => (
                  <li key={i}>
                    Row {iss.row} [{iss.field}]: {iss.message}
                  </li>
                ))}
                {validationIssues.length > 5 && (
                  <li className="font-semibold text-amber-900">
                    ...and {validationIssues.length - 5} more notices
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Valid Items</span>
              <span className="text-lg font-bold text-teal-800">{parsedItems.length}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Total Stock Units</span>
              <span className="text-lg font-bold text-slate-800">{totalUnits.toLocaleString()}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Total Est. Doses</span>
              <span className="text-lg font-bold text-indigo-700">{totalDoses.toLocaleString()}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Categories</span>
              <span className="text-lg font-bold text-emerald-700">{categories.length - 1}</span>
            </div>
          </div>

          {/* Preview Table Header & Category Filter */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>Items Preview</span>
                <span className="text-slate-400 font-normal">({filteredItems.length} displayed)</span>
              </div>

              {categories.length > 2 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-[11px] text-slate-500 font-medium">Filter:</span>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFilterCategory(cat)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                        filterCategory === cat
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scrollable Preview Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="max-h-60 overflow-y-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100/90 text-slate-700 sticky top-0 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Product Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Packaging Unit</th>
                      <th className="p-2.5 text-right">Doses/Unit</th>
                      <th className="p-2.5 text-right">Stock</th>
                      <th className="p-2.5">Manufacturer</th>
                      <th className="p-2.5">Expiry Date</th>
                      <th className="p-2.5">Dosage / Notes</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 font-bold text-slate-900 max-w-[180px] truncate" title={item.name}>
                          {item.name}
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.type === 'Vaccine'
                              ? 'bg-teal-100 text-teal-900'
                              : item.type === 'Antibiotic'
                              ? 'bg-rose-100 text-rose-900'
                              : item.type === 'Vitamins' || item.type === 'Supplement'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="p-2.5 capitalize text-slate-700">{item.unitType}</td>
                        <td className="p-2.5 text-right font-medium text-slate-700">
                          {item.dosesPerUnit.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-bold text-teal-800">
                          {item.currentStockUnits}
                        </td>
                        <td className="p-2.5 text-slate-600 max-w-[120px] truncate" title={item.manufacturer}>
                          {item.manufacturer}
                        </td>
                        <td className="p-2.5 text-slate-600 whitespace-nowrap">{item.expirationDate}</td>
                        <td className="p-2.5 text-slate-500 max-w-[160px] truncate" title={`${item.dosage} ${item.notes || ''}`}>
                          {item.dosage}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition"
                            title="Remove row from import"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Merge Option Toggle */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={mergeExisting}
                onChange={e => setMergeExisting(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded-sm focus:ring-teal-500 border-slate-300"
              />
              <div>
                <span className="font-bold text-slate-800">Merge with existing inventory</span>
                <p className="text-[11px] text-slate-500">
                  If a product with the exact same name already exists, add new units to its stock instead of creating a duplicate entry.
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
        >
          Cancel
        </button>

        {uploadedFile && parsedItems.length > 0 && (
          <button
            type="button"
            onClick={handleCommitUpload}
            disabled={isSubmitting || isParsing}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Importing Items...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-teal-200" />
                <span>Import {parsedItems.length} Health Items</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
