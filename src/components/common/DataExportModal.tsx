import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { 
  exportReportToPdf, 
  exportReportToCsv, 
  exportReportToExcel, 
  ReportMetadata, 
  SheetData 
} from '../../utils/reportExportUtils';
import { calculateFlockAgeFromLoadingDate } from '../../utils/dateCalculations';
import { useToast } from './ToastContainer';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  X, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  Bird, 
  Egg, 
  Skull, 
  Syringe, 
  Layers, 
  Sparkles,
  Truck,
  ShieldCheck,
  Wheat
} from 'lucide-react';

export type ExportCategoryType = 
  | 'flock_population' 
  | 'egg_production' 
  | 'master_operations' 
  | 'mortality' 
  | 'feed_consumption' 
  | 'medicine' 
  | 'hatching_delivery';

export type ExportFormatType = 'pdf' | 'csv' | 'excel';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: ExportCategoryType;
  defaultHouse?: string;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'egg_production',
  defaultHouse = 'All'
}) => {
  const {
    farmProfile,
    currentUser,
    flocks,
    getFlockStats,
    eggProductionRecords,
    depletions,
    medAdministrations,
    feedConsumptionRecords,
    deliveries,
    hatchingSummaries
  } = useFarm();

  const toast = useToast();

  const [category, setCategory] = useState<ExportCategoryType>(defaultCategory);
  const [format, setFormat] = useState<ExportFormatType>('pdf');
  const [selectedHouse, setSelectedHouse] = useState<string>(defaultHouse);
  const [datePreset, setDatePreset] = useState<'today' | '7days' | '30days' | 'this_month' | 'all' | 'custom'>('30days');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Sync default category when prop changes
  React.useEffect(() => {
    if (defaultCategory) setCategory(defaultCategory);
  }, [defaultCategory]);

  React.useEffect(() => {
    if (defaultHouse) setSelectedHouse(defaultHouse);
  }, [defaultHouse]);

  const handleDatePresetChange = (preset: 'today' | '7days' | '30days' | 'this_month' | 'all' | 'custom') => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setEndDate(todayStr);

    if (preset === 'today') {
      setStartDate(todayStr);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      setStartDate('2020-01-01');
    }
  };

  // 1. Filtered Data Sets
  const filteredFlocks = useMemo(() => {
    const list = Array.isArray(flocks) ? flocks : [];
    return list.filter(f => selectedHouse === 'All' || f.houseNumber === selectedHouse);
  }, [flocks, selectedHouse]);

  const filteredEggRecords = useMemo(() => {
    const list = Array.isArray(eggProductionRecords) ? eggProductionRecords : [];
    return list.filter(r => {
      if (!r) return false;
      const inDate = (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate);
      const inHouse = selectedHouse === 'All' || r.houseNumber === selectedHouse;
      return inDate && inHouse;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [eggProductionRecords, startDate, endDate, selectedHouse]);

  const filteredDepletions = useMemo(() => {
    const list = Array.isArray(depletions) ? depletions : [];
    return list.filter(d => {
      if (!d) return false;
      const inDate = (!startDate || d.date >= startDate) && (!endDate || d.date <= endDate);
      const inHouse = selectedHouse === 'All' || d.houseNumber === selectedHouse;
      return inDate && inHouse;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [depletions, startDate, endDate, selectedHouse]);

  const filteredMedRecords = useMemo(() => {
    const list = Array.isArray(medAdministrations) ? medAdministrations : [];
    return list.filter(m => {
      if (!m) return false;
      const inDate = (!startDate || m.date >= startDate) && (!endDate || m.date <= endDate);
      const inHouse = selectedHouse === 'All' || m.houseNumber === selectedHouse;
      return inDate && inHouse;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [medAdministrations, startDate, endDate, selectedHouse]);

  const filteredFeedRecords = useMemo(() => {
    const list = Array.isArray(feedConsumptionRecords) ? feedConsumptionRecords : [];
    return list.filter(f => {
      if (!f) return false;
      const inDate = (!startDate || f.date >= startDate) && (!endDate || f.date <= endDate);
      const inHouse = selectedHouse === 'All' || f.houseNumber === selectedHouse;
      return inDate && inHouse;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [feedConsumptionRecords, startDate, endDate, selectedHouse]);

  // Date Range Text
  const dateRangeText = useMemo(() => {
    if (category === 'flock_population') return 'Current Active Production Cycle';
    if (datePreset === 'today') return `Today (${endDate})`;
    if (datePreset === '7days') return `Last 7 Days (${startDate} to ${endDate})`;
    if (datePreset === '30days') return `Last 30 Days (${startDate} to ${endDate})`;
    if (datePreset === 'this_month') return `Current Month (${startDate} to ${endDate})`;
    if (datePreset === 'all') return 'Complete Production Cycle';
    return `${startDate} to ${endDate}`;
  }, [category, datePreset, startDate, endDate]);

  if (!isOpen) return null;

  // Execute Export Handler
  const handleExecuteExport = async () => {
    setIsExporting(true);
    try {
      const sanitizedFarmName = farmProfile.name ? farmProfile.name.replace(/[^a-zA-Z0-9]/g, '_') : 'FarmFlow';
      const fileDateSuffix = `${startDate}_to_${endDate}`;

      const reportMetadata: ReportMetadata = {
        companyName: farmProfile.name || 'L.P. LIM CITY FAMILY FARM INC',
        logoUrl: farmProfile.logoUrl,
        address: farmProfile.address,
        contactNumber: farmProfile.contactNumber,
        email: farmProfile.email,
        reportTitle: 
          category === 'flock_population' ? 'Flock Demographics & Pen Housing Master Report' :
          category === 'egg_production' ? 'Daily Egg Production & Grading Performance Record' :
          category === 'master_operations' ? 'Comprehensive Master Farm Operations Executive Report' :
          category === 'mortality' ? 'Flock Mortality, Culling & Depletion Incident Report' :
          category === 'feed_consumption' ? 'Feed Inventory & Daily Consumption Management Record' :
          category === 'medicine' ? 'Breeder Vaccination & Medication Health Record' :
          'Hatching Egg Delivery & ESRRR Dispatch Summary',
        dateRange: dateRangeText,
        houseFilter: selectedHouse === 'All' ? 'All Houses (Farm-wide)' : selectedHouse,
        generatedBy: currentUser?.fullName || 'Authorized System User',
        generatedAt: new Date().toLocaleString()
      };

      // 1. FLOCK POPULATION EXPORT
      if (category === 'flock_population') {
        const flockRows = filteredFlocks.map(f => {
          const stats = getFlockStats(f.houseNumber);
          const currMales = stats ? stats.currentMales : f.currentMales || 0;
          const currFemales = stats ? stats.currentFemales : f.currentFemales || 0;
          const totalLive = currMales + currFemales;
          const initTotal = (f.initialMales || 0) + (f.initialFemales || 0);
          const livability = initTotal > 0 ? (totalLive / initTotal) * 100 : 100;
          const ratio = currMales > 0 ? (currFemales / currMales) : 0;
          const age = calculateFlockAgeFromLoadingDate(f.loadingDateFemale || f.loadingDateMale);

          return {
            houseNumber: f.houseNumber,
            breed: f.breed,
            loadingDate: f.loadingDateFemale || f.loadingDateMale || 'N/A',
            ageText: age ? `${age.ageWeeks}w + ${age.ageDays}d` : 'N/A',
            ageWeeks: age ? age.ageWeeks : 0,
            initialMales: f.initialMales || 0,
            initialFemales: f.initialFemales || 0,
            initialTotal: initTotal,
            currentMales: currMales,
            currentFemales: currFemales,
            totalLive,
            livabilityPct: Number(livability.toFixed(1)),
            matingRatio: Number(ratio.toFixed(1)),
            status: f.status || 'Active',
            notes: f.notes || ''
          };
        });

        const totalInitM = flockRows.reduce((a, r) => a + r.initialMales, 0);
        const totalInitF = flockRows.reduce((a, r) => a + r.initialFemales, 0);
        const totalCurrM = flockRows.reduce((a, r) => a + r.currentMales, 0);
        const totalCurrF = flockRows.reduce((a, r) => a + r.currentFemales, 0);
        const totalLiveBirds = totalCurrM + totalCurrF;
        const totalInitBirds = totalInitM + totalInitF;

        const columns = [
          { header: 'House', key: 'houseNumber', width: 10 },
          { header: 'Breed', key: 'breed', width: 12 },
          { header: 'Loading Date', key: 'loadingDate', width: 12 },
          { header: 'Age', key: 'ageText', width: 10 },
          { header: 'Init ♂', key: 'initialMales', width: 8, align: 'right' as const },
          { header: 'Init ♀', key: 'initialFemales', width: 8, align: 'right' as const },
          { header: 'Current ♂', key: 'currentMales', width: 10, align: 'right' as const },
          { header: 'Current ♀', key: 'currentFemales', width: 10, align: 'right' as const },
          { header: 'Total Live', key: 'totalLive', width: 12, align: 'right' as const },
          { header: 'Livability %', key: 'livabilityPct', width: 12, align: 'right' as const },
          { header: 'Ratio (1:X)', key: 'matingRatio', width: 10, align: 'right' as const },
          { header: 'Status', key: 'status', width: 10 }
        ];

        const sheetData: SheetData = {
          sheetName: 'Flock Population',
          title: 'Flock Demographics & Pen Housing Master Report',
          columns,
          data: flockRows,
          summaryRow: {
            houseNumber: 'TOTALS',
            breed: `${filteredFlocks.length} Houses`,
            initialMales: totalInitM,
            initialFemales: totalInitF,
            currentMales: totalCurrM,
            currentFemales: totalCurrF,
            totalLive: totalLiveBirds,
            livabilityPct: totalInitBirds > 0 ? Number(((totalLiveBirds / totalInitBirds) * 100).toFixed(1)) : 100,
            matingRatio: totalCurrM > 0 ? Number((totalCurrF / totalCurrM).toFixed(1)) : 0
          }
        };

        const filenameBase = `${sanitizedFarmName}_Flock_Population_${selectedHouse}_${new Date().toISOString().split('T')[0]}`;

        if (format === 'csv') {
          exportReportToCsv(`${filenameBase}.csv`, columns, flockRows);
        } else if (format === 'pdf') {
          exportReportToPdf(reportMetadata, [sheetData], `${filenameBase}.pdf`, { orientation: 'landscape' });
        } else {
          exportReportToExcel(reportMetadata, [sheetData], `${filenameBase}.xlsx`);
        }
      }

      // 2. EGG PRODUCTION EXPORT
      else if (category === 'egg_production') {
        const eggRows = filteredEggRecords.map(r => {
          const hePct = r.tep && r.tep > 0 ? ((r.totalHE || 0) / r.tep) * 100 : 0;
          const nhePct = r.tep && r.tep > 0 ? ((r.totalNHE || 0) / r.tep) * 100 : 0;
          return {
            date: r.date,
            houseNumber: r.houseNumber,
            femalePop: r.femalePopulationAtDate || '',
            heNest: r.heNest || 0,
            heFloor: r.heFloor || 0,
            totalHE: r.totalHE || 0,
            hePct: Number(hePct.toFixed(1)),
            small: r.small || 0,
            thinShell: r.thinShell || 0,
            misshape: r.misshape || 0,
            doubleYolk: r.doubleYolk || 0,
            broken: r.broken || 0,
            spoiled: r.spoiled || 0,
            totalNHE: r.totalNHE || 0,
            nhePct: Number(nhePct.toFixed(1)),
            tep: r.tep || 0,
            hendayPct: r.hendayPct ? Number(r.hendayPct.toFixed(1)) : '',
            sampleEggWeight: r.sampleEggWeightGrams ? Number(r.sampleEggWeightGrams.toFixed(1)) : '',
            loggedBy: r.loggedBy || ''
          };
        });

        const totalTEP = eggRows.reduce((a, r) => a + r.tep, 0);
        const totalHE = eggRows.reduce((a, r) => a + r.totalHE, 0);
        const totalNHE = eggRows.reduce((a, r) => a + r.totalNHE, 0);

        const columns = [
          { header: 'Date', key: 'date', width: 12 },
          { header: 'House', key: 'houseNumber', width: 10 },
          { header: 'HE Nest', key: 'heNest', width: 9, align: 'right' as const },
          { header: 'HE Floor', key: 'heFloor', width: 9, align: 'right' as const },
          { header: 'Total HE', key: 'totalHE', width: 11, align: 'right' as const },
          { header: 'HE %', key: 'hePct', width: 9, align: 'right' as const },
          { header: 'Small', key: 'small', width: 7, align: 'right' as const },
          { header: 'Thin Shell', key: 'thinShell', width: 9, align: 'right' as const },
          { header: 'Misshape', key: 'misshape', width: 9, align: 'right' as const },
          { header: 'Double Yolk', key: 'doubleYolk', width: 10, align: 'right' as const },
          { header: 'Broken', key: 'broken', width: 7, align: 'right' as const },
          { header: 'Spoiled', key: 'spoiled', width: 7, align: 'right' as const },
          { header: 'Total NHE', key: 'totalNHE', width: 11, align: 'right' as const },
          { header: 'Total Eggs (TEP)', key: 'tep', width: 14, align: 'right' as const },
          { header: 'Hen-Day %', key: 'hendayPct', width: 11, align: 'right' as const },
          { header: 'Egg Wt (g)', key: 'sampleEggWeight', width: 10, align: 'right' as const },
          { header: 'Logged By', key: 'loggedBy', width: 16 }
        ];

        const sheetData: SheetData = {
          sheetName: 'Egg Production',
          title: 'Daily Egg Production & Grading Performance Record',
          columns,
          data: eggRows,
          summaryRow: {
            date: 'TOTALS',
            houseNumber: `${eggRows.length} logs`,
            totalHE,
            totalNHE,
            tep: totalTEP,
            hePct: totalTEP > 0 ? Number(((totalHE / totalTEP) * 100).toFixed(1)) : 0
          }
        };

        const filenameBase = `${sanitizedFarmName}_Egg_Production_${selectedHouse}_${fileDateSuffix}`;

        if (format === 'csv') {
          exportReportToCsv(`${filenameBase}.csv`, columns, eggRows);
        } else if (format === 'pdf') {
          exportReportToPdf(reportMetadata, [sheetData], `${filenameBase}.pdf`, { orientation: 'landscape' });
        } else {
          exportReportToExcel(reportMetadata, [sheetData], `${filenameBase}.xlsx`);
        }
      }

      // 3. MORTALITY & DEPLETIONS EXPORT
      else if (category === 'mortality') {
        const mortRows = filteredDepletions.map(d => ({
          date: d.date,
          houseNumber: d.houseNumber,
          penName: d.penName || d.side || 'All',
          category: d.category,
          males: d.maleCount || 0,
          females: d.femaleCount || 0,
          totalLost: (d.maleCount || 0) + (d.femaleCount || 0),
          reasonDetails: d.reasonDetails || '',
          loggedBy: d.loggedBy || ''
        }));

        const totalM = mortRows.reduce((a, r) => a + r.males, 0);
        const totalF = mortRows.reduce((a, r) => a + r.females, 0);

        const columns = [
          { header: 'Date', key: 'date', width: 12 },
          { header: 'House', key: 'houseNumber', width: 10 },
          { header: 'Pen / Side', key: 'penName', width: 12 },
          { header: 'Category', key: 'category', width: 14 },
          { header: 'Males Lost', key: 'males', width: 12, align: 'right' as const },
          { header: 'Females Lost', key: 'females', width: 12, align: 'right' as const },
          { header: 'Total Birds Lost', key: 'totalLost', width: 14, align: 'right' as const },
          { header: 'Reason / Clinical Notes', key: 'reasonDetails', width: 35 },
          { header: 'Logged By', key: 'loggedBy', width: 18 }
        ];

        const sheetData: SheetData = {
          sheetName: 'Mortality & Depletion',
          title: 'Flock Mortality, Culling & Depletion Incident Report',
          columns,
          data: mortRows,
          summaryRow: {
            date: 'TOTALS',
            houseNumber: `${mortRows.length} incidents`,
            males: totalM,
            females: totalF,
            totalLost: totalM + totalF
          }
        };

        const filenameBase = `${sanitizedFarmName}_Mortality_Report_${selectedHouse}_${fileDateSuffix}`;

        if (format === 'csv') {
          exportReportToCsv(`${filenameBase}.csv`, columns, mortRows);
        } else if (format === 'pdf') {
          exportReportToPdf(reportMetadata, [sheetData], `${filenameBase}.pdf`, { orientation: 'landscape' });
        } else {
          exportReportToExcel(reportMetadata, [sheetData], `${filenameBase}.xlsx`);
        }
      }

      // 4. FEED INVENTORY & CONSUMPTION EXPORT
      else if (category === 'feed_consumption') {
        const feedRows = filteredFeedRecords.map(f => ({
          date: f.date,
          houseNumber: f.houseNumber,
          side: f.side || 'All',
          feedType: f.feedType,
          quantityKg: f.quantityKg || 0,
          femaleGrams: f.femaleGramsPerBird || '',
          maleGrams: f.maleGramsPerBird || '',
          loggedBy: f.loggedBy || '',
          notes: f.notes || ''
        }));

        const totalFeedKg = feedRows.reduce((a, r) => a + r.quantityKg, 0);

        const columns = [
          { header: 'Date', key: 'date', width: 12 },
          { header: 'House', key: 'houseNumber', width: 10 },
          { header: 'Side', key: 'side', width: 10 },
          { header: 'Feed Formula', key: 'feedType', width: 15 },
          { header: 'Consumed (kg)', key: 'quantityKg', width: 14, align: 'right' as const },
          { header: '♀ Grams/Bird', key: 'femaleGrams', width: 14, align: 'right' as const },
          { header: '♂ Grams/Bird', key: 'maleGrams', width: 14, align: 'right' as const },
          { header: 'Logged By', key: 'loggedBy', width: 18 },
          { header: 'Remarks', key: 'notes', width: 25 }
        ];

        const sheetData: SheetData = {
          sheetName: 'Feed Consumption',
          title: 'Feed Inventory & Daily Consumption Management Record',
          columns,
          data: feedRows,
          summaryRow: {
            date: 'TOTAL CONSUMPTION',
            houseNumber: `${feedRows.length} feeds`,
            quantityKg: totalFeedKg
          }
        };

        const filenameBase = `${sanitizedFarmName}_Feed_Consumption_${selectedHouse}_${fileDateSuffix}`;

        if (format === 'csv') {
          exportReportToCsv(`${filenameBase}.csv`, columns, feedRows);
        } else if (format === 'pdf') {
          exportReportToPdf(reportMetadata, [sheetData], `${filenameBase}.pdf`, { orientation: 'landscape' });
        } else {
          exportReportToExcel(reportMetadata, [sheetData], `${filenameBase}.xlsx`);
        }
      }

      // 5. VACCINES & MEDICATION EXPORT
      else if (category === 'medicine') {
        const medRows = filteredMedRecords.map(m => ({
          date: m.date,
          houseNumber: m.houseNumber,
          productName: m.productName,
          productType: m.productType,
          method: m.method,
          unitsUsed: m.unitsUsed || 0,
          totalDoses: m.totalDosesAdministered || ((m.unitsUsed || 0) * 1000),
          peripherals: m.peripheralsUsed || '',
          administeredBy: m.administeredBy || m.loggedBy || 'Veterinary Crew',
          status: 'Completed'
        }));

        const totalUnits = medRows.reduce((a, r) => a + r.unitsUsed, 0);
        const totalDoses = medRows.reduce((a, r) => a + r.totalDoses, 0);

        const columns = [
          { header: 'Date', key: 'date', width: 12 },
          { header: 'House', key: 'houseNumber', width: 10 },
          { header: 'Product Name', key: 'productName', width: 24 },
          { header: 'Type', key: 'productType', width: 14 },
          { header: 'Administration Method', key: 'method', width: 20 },
          { header: 'Units Used', key: 'unitsUsed', width: 12, align: 'right' as const },
          { header: 'Total Doses', key: 'totalDoses', width: 14, align: 'right' as const },
          { header: 'Administered By', key: 'administeredBy', width: 20 },
          { header: 'Status', key: 'status', width: 12 }
        ];

        const sheetData: SheetData = {
          sheetName: 'Vaccines & Medicine',
          title: 'Breeder Vaccination & Medication Health Record',
          columns,
          data: medRows,
          summaryRow: {
            date: 'TOTALS',
            houseNumber: `${medRows.length} administrations`,
            unitsUsed: totalUnits,
            totalDoses: totalDoses
          }
        };

        const filenameBase = `${sanitizedFarmName}_Vaccines_Medicine_${selectedHouse}_${fileDateSuffix}`;

        if (format === 'csv') {
          exportReportToCsv(`${filenameBase}.csv`, columns, medRows);
        } else if (format === 'pdf') {
          exportReportToPdf(reportMetadata, [sheetData], `${filenameBase}.pdf`, { orientation: 'landscape' });
        } else {
          exportReportToExcel(reportMetadata, [sheetData], `${filenameBase}.xlsx`);
        }
      }

      // 6. MASTER OPERATIONS (MULTI-SHEET)
      else if (category === 'master_operations') {
        const sheets: SheetData[] = [];

        // Sheet 1: Egg Production
        const eggRows = filteredEggRecords.map(r => ({
          date: r.date,
          houseNumber: r.houseNumber,
          totalHE: r.totalHE || 0,
          totalNHE: r.totalNHE || 0,
          tep: r.tep || 0,
          hendayPct: r.hendayPct ? Number(r.hendayPct.toFixed(1)) : '',
          loggedBy: r.loggedBy || ''
        }));
        sheets.push({
          sheetName: 'Egg Production',
          title: 'Daily Egg Production & Grading Performance Record',
          columns: [
            { header: 'Date', key: 'date', width: 12 },
            { header: 'House', key: 'houseNumber', width: 10 },
            { header: 'Total HE', key: 'totalHE', width: 12, align: 'right' as const },
            { header: 'Total NHE', key: 'totalNHE', width: 12, align: 'right' as const },
            { header: 'Total Eggs (TEP)', key: 'tep', width: 15, align: 'right' as const },
            { header: 'Hen-Day %', key: 'hendayPct', width: 12, align: 'right' as const },
            { header: 'Logged By', key: 'loggedBy', width: 18 }
          ],
          data: eggRows,
          summaryRow: {
            date: 'TOTALS',
            totalHE: eggRows.reduce((a, r) => a + r.totalHE, 0),
            totalNHE: eggRows.reduce((a, r) => a + r.totalNHE, 0),
            tep: eggRows.reduce((a, r) => a + r.tep, 0)
          }
        });

        // Sheet 2: Mortality
        const mortRows = filteredDepletions.map(d => ({
          date: d.date,
          houseNumber: d.houseNumber,
          category: d.category,
          males: d.maleCount || 0,
          females: d.femaleCount || 0,
          totalLost: (d.maleCount || 0) + (d.femaleCount || 0),
          reasonDetails: d.reasonDetails || ''
        }));
        sheets.push({
          sheetName: 'Mortality & Depletion',
          title: 'Flock Mortality, Culling & Depletion Incident Report',
          columns: [
            { header: 'Date', key: 'date', width: 12 },
            { header: 'House', key: 'houseNumber', width: 10 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Males', key: 'males', width: 10, align: 'right' as const },
            { header: 'Females', key: 'females', width: 10, align: 'right' as const },
            { header: 'Total Lost', key: 'totalLost', width: 12, align: 'right' as const },
            { header: 'Clinical Reason', key: 'reasonDetails', width: 35 }
          ],
          data: mortRows,
          summaryRow: {
            date: 'TOTALS',
            totalLost: mortRows.reduce((a, r) => a + r.totalLost, 0)
          }
        });

        const filenameBase = `${sanitizedFarmName}_Master_Operations_${selectedHouse}_${fileDateSuffix}`;

        if (format === 'csv') {
          // For CSV with multiple sheets, export the primary egg production dataset or combined summary
          exportReportToCsv(`${filenameBase}_EggProduction.csv`, sheets[0].columns, eggRows);
          toast.info('CSV Export Note', 'Exported primary production data sheet to CSV.');
        } else if (format === 'pdf') {
          exportReportToPdf(reportMetadata, sheets, `${filenameBase}.pdf`, { orientation: 'landscape' });
        } else {
          exportReportToExcel(reportMetadata, sheets, `${filenameBase}.xlsx`);
        }
      }

      toast.success(
        `${format.toUpperCase()} Export Completed`,
        `Successfully generated and downloaded ${category.replace('_', ' ')} report.`
      );
      onClose();
    } catch (err: any) {
      console.error('Export generation error:', err);
      toast.error('Export Failed', err?.message || 'Could not generate report file.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                  Export External Farm Report
                </h3>
                <span className="px-2 py-0.5 bg-teal-400 text-teal-950 text-[10px] font-black rounded-md uppercase tracking-wider">
                  CSV / PDF / Excel
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official external records with farm letterhead, custom date ranges, and verified signatures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Step 1: Select Data Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Choose Report Dataset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'egg_production', label: 'Egg Production', icon: Egg, desc: 'Grading, HE/NHE, Henday' },
                { id: 'flock_population', label: 'Flock Demographics', icon: Bird, desc: 'Population, Pens, Age' },
                { id: 'master_operations', label: 'Master Executive', icon: Layers, desc: 'All-in-one farm overview' },
                { id: 'mortality', label: 'Mortality & Culls', icon: Skull, desc: 'Losses & Post-mortem logs' },
                { id: 'feed_consumption', label: 'Feed & Inventory', icon: Wheat, desc: 'Intake kg, stock levels' },
                { id: 'medicine', label: 'Vaccines & Meds', icon: Syringe, desc: 'Dosages & Vet records' }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id as ExportCategoryType)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                        : 'bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-700' : 'text-slate-500'}`} />
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                    </div>
                    <div>
                      <p className={`text-xs font-black ${isSelected ? 'text-teal-950' : 'text-slate-800'}`}>
                        {item.label}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Export Format */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. Select Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { 
                  id: 'pdf', 
                  label: 'Official PDF Document (.pdf)', 
                  icon: FileText, 
                  tag: 'Official Report',
                  desc: 'Formatted vector PDF with corporate letterhead, auto-alignments & signatures' 
                },
                { 
                  id: 'csv', 
                  label: 'Raw Spreadsheet (.csv)', 
                  icon: Download, 
                  tag: 'Data Exchange',
                  desc: 'Universal UTF-8 CSV with commas, quotes, and Excel compatibility' 
                },
                { 
                  id: 'excel', 
                  label: 'Excel Workbook (.xlsx)', 
                  icon: FileSpreadsheet, 
                  tag: 'Formatted Sheets',
                  desc: 'Multi-sheet workbook with styled columns and auto-fit widths' 
                }
              ].map(f => {
                const Icon = f.icon;
                const isSelected = format === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id as ExportFormatType)}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-forest-950 text-white border-forest-950 ring-2 ring-mint-400/40 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-mint-400' : 'text-slate-600'}`} />
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-mint-400 text-forest-950' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {f.tag}
                        </span>
                      </div>
                      <p className="text-xs font-bold">{f.label}</p>
                    </div>
                    <p className={`text-[10px] mt-1.5 leading-tight ${isSelected ? 'text-graphite-300' : 'text-slate-500'}`}>
                      {f.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Scope & Date Range Filter */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Scope & Date Period
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* House Scope */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Flock / House Scope
                </label>
                <select
                  value={selectedHouse}
                  onChange={e => setSelectedHouse(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-teal-500"
                >
                  <option value="All">All Houses (Farm-wide)</option>
                  {flocks.map(f => (
                    <option key={f.id} value={f.houseNumber}>
                      {f.houseNumber} - {f.breed}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Preset */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Period Preset
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: '7days', label: '7 Days' },
                    { id: '30days', label: '30 Days' },
                    { id: 'this_month', label: 'Month' },
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Today' },
                    { id: 'custom', label: 'Custom' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleDatePresetChange(p.id as any)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                        datePreset === p.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Date Range Inputs */}
            {datePreset === 'custom' && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-800"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Records Summary Preview */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs text-emerald-950 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Ready to export: <strong>
                  {category === 'flock_population' ? `${filteredFlocks.length} flock houses` :
                   category === 'egg_production' ? `${filteredEggRecords.length} production logs` :
                   category === 'mortality' ? `${filteredDepletions.length} mortality logs` :
                   category === 'feed_consumption' ? `${filteredFeedRecords.length} feed entries` :
                   category === 'medicine' ? `${filteredMedRecords.length} veterinary records` :
                   'Combined operational records'}
                </strong>
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-800 font-bold uppercase">
              Target: {format.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            id="modal-generate-download-btn"
            onClick={handleExecuteExport}
            disabled={isExporting}
            className="px-5 py-2.5 bg-forest-900 hover:bg-forest-800 active:scale-95 text-mint-300 rounded-2xl text-xs font-black flex items-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-mint-400" />
            <span>{isExporting ? 'Generating...' : `Generate & Download ${format.toUpperCase()}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
