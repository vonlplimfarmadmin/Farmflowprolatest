import * as XLSX from 'xlsx';
import { ProductType, UnitType, MedProduct } from '../types';

export interface HealthBatchItem {
  id?: string;
  name: string;
  type: ProductType;
  unitType: UnitType;
  dosesPerUnit: number;
  currentStockUnits: number;
  manufacturer: string;
  expirationDate: string;
  dosage: string;
  packaging?: string;
  notes?: string;
}

export interface HealthBatchValidationIssue {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface HealthBatchParseResult {
  items: HealthBatchItem[];
  issues: HealthBatchValidationIssue[];
  validCount: number;
  errorCount: number;
  sheetNames: string[];
}

/**
 * Standardize product category strings to known ProductType enum
 */
export function normalizeProductType(val: any, fallback: ProductType = 'Vaccine'): ProductType {
  if (!val) return fallback;
  const s = String(val).trim().toLowerCase();
  
  if (s.includes('vaccin') || s.includes('vax') || s.includes('immun')) return 'Vaccine';
  if (s.includes('antibiotic') || s.includes('anti-biotic') || s.includes('antimicrobial')) return 'Antibiotic';
  if (s.includes('vitamin') || s.includes('vit') || s.includes('multivit')) return 'Vitamins';
  if (s.includes('supplement') || s.includes('mineral') || s.includes('probiotic') || s.includes('electrolyte')) return 'Supplement';
  if (s.includes('disinfect') || s.includes('sanitize') || s.includes('antiseptic') || s.includes('spray')) return 'Disinfectant';
  if (s.includes('deworm') || s.includes('worm') || s.includes('anthelmintic')) return 'Dewormer';
  if (s.includes('paraphernalia') || s.includes('equipment') || s.includes('syringe') || s.includes('needle') || s.includes('tool') || s.includes('gear')) return 'paraphernalias';
  if (s.includes('med')) return 'Medicine';
  
  return fallback;
}

/**
 * Standardize packaging unit
 */
export function normalizeUnitType(val: any, fallback: UnitType = 'Vial'): UnitType {
  if (!val) return fallback;
  const s = String(val).trim().toLowerCase();
  
  if (s.includes('vial') || s.includes('amp') || s.includes('flacon')) return 'Vial';
  if (s.includes('bottle') || s.includes('btl')) return 'bottle';
  if (s.includes('bag') || s.includes('pouch') || s.includes('sachet')) return 'bag';
  if (s.includes('box') || s.includes('pack') || s.includes('carton')) return 'box';
  if (s.includes('piece') || s.includes('pc') || s.includes('kit') || s.includes('unit')) return 'piece';
  
  return fallback;
}

/**
 * Convert Excel date or text date into YYYY-MM-DD
 */
export function normalizeDate(val: any): string {
  if (!val) {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    return future.toISOString().split('T')[0];
  }

  // Check if it's an Excel numeric serial date (e.g. 46123)
  if (typeof val === 'number' && val > 20000 && val < 80000) {
    try {
      const utcDays = val - 25569;
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      if (!isNaN(dateInfo.getTime())) {
        return dateInfo.toISOString().split('T')[0];
      }
    } catch {
      // fallback
    }
  }

  const str = String(val).trim();
  // Check YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Check MM/DD/YYYY or DD/MM/YYYY
  const slashParts = str.split('/');
  if (slashParts.length === 3) {
    let year = slashParts[2];
    if (year.length === 2) year = '20' + year;
    const month = slashParts[0].padStart(2, '0');
    const day = slashParts[1].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Native Date parse attempt
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  // Fallback 2 years from today
  const fallbackDate = new Date();
  fallbackDate.setFullYear(fallbackDate.getFullYear() + 2);
  return fallbackDate.toISOString().split('T')[0];
}

function cleanKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findValueBySynonyms(
  row: Record<string, any>,
  synonyms: string[],
  predicate?: (cleanK: string) => boolean
): any {
  const rowKeys = Object.keys(row);
  for (const k of rowKeys) {
    const ck = cleanKey(k);
    if (synonyms.includes(ck)) {
      return row[k];
    }
  }
  if (predicate) {
    for (const k of rowKeys) {
      const ck = cleanKey(k);
      if (predicate(ck)) {
        return row[k];
      }
    }
  }
  return undefined;
}

/**
 * Universal parser for Excel and CSV files containing biological/health items
 */
export async function parseHealthItemsFile(file: File): Promise<HealthBatchParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames || [];

  if (sheetNames.length === 0) {
    return {
      items: [],
      issues: [{ row: 1, field: 'File', message: 'No worksheets found in uploaded file', severity: 'error' }],
      validCount: 0,
      errorCount: 1,
      sheetNames: []
    };
  }

  // Select the most appropriate worksheet
  let targetSheetName = sheetNames[0];
  for (const name of sheetNames) {
    if (/health|med|vaccin|biolog|item|product|stock/i.test(name)) {
      targetSheetName = name;
      break;
    }
  }

  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) {
    return {
      items: [],
      issues: [{ row: 1, field: 'File', message: `Could not read worksheet "${targetSheetName}"`, severity: 'error' }],
      validCount: 0,
      errorCount: 1,
      sheetNames
    };
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null });
  const items: HealthBatchItem[] = [];
  const issues: HealthBatchValidationIssue[] = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // header is row 1
    
    // Check if entire row is empty
    const nonNullVals = Object.values(row).filter(v => v !== null && v !== undefined && String(v).trim() !== '');
    if (nonNullVals.length === 0) return;

    // 1. Product Name (Required)
    const nameVal = findValueBySynonyms(
      row,
      ['productname', 'tradename', 'product', 'name', 'itemname', 'item', 'healthitem', 'medicinename', 'vaccinename', 'biological', 'product_name', 'trade_name'],
      (k) => k.includes('name') || k.includes('product') || k.includes('item')
    );

    if (!nameVal || String(nameVal).trim() === '') {
      issues.push({
        row: rowNum,
        field: 'Product Name',
        message: 'Product Name is missing or empty. This row cannot be imported.',
        severity: 'error'
      });
      return;
    }

    const productName = String(nameVal).trim();

    // 2. Product Category / Type
    const typeVal = findValueBySynonyms(
      row,
      ['category', 'producttype', 'type', 'itemtype', 'classification', 'product_type', 'group'],
      (k) => k.includes('type') || k.includes('category') || k.includes('class')
    );
    const category = normalizeProductType(typeVal, 'Vaccine');

    // 3. Packaging Unit
    const unitVal = findValueBySynonyms(
      row,
      ['packagingunit', 'unittype', 'unit', 'packagetype', 'packtype', 'unit_type', 'presentation'],
      (k) => k.includes('unit') || k.includes('pack')
    );
    const unitType = normalizeUnitType(unitVal, 'Vial');

    // 4. Doses per Unit
    const dosesVal = findValueBySynonyms(
      row,
      ['dosesperunit', 'doses', 'dosesunit', 'doses_per_unit', 'dosesperpack', 'dosecount'],
      (k) => k.includes('dose')
    );
    let dosesPerUnit = dosesVal ? parseInt(String(dosesVal).replace(/[^0-9]/g, ''), 10) : 1000;
    if (isNaN(dosesPerUnit) || dosesPerUnit <= 0) dosesPerUnit = 1000;

    // 5. Current Stock Units
    const stockVal = findValueBySynonyms(
      row,
      ['stockunits', 'currentstockunits', 'stock', 'initialstock', 'quantity', 'units', 'qty', 'initialunits', 'currentstock'],
      (k) => k.includes('stock') || k.includes('qty') || k.includes('quantity') || k.includes('units')
    );
    let currentStockUnits = stockVal !== undefined && stockVal !== null ? parseFloat(String(stockVal).replace(/[^0-9.]/g, '')) : 10;
    if (isNaN(currentStockUnits) || currentStockUnits < 0) currentStockUnits = 0;

    // 6. Manufacturer
    const mfrVal = findValueBySynonyms(
      row,
      ['manufacturer', 'mfr', 'brand', 'maker', 'company', 'producer', 'supplier', 'lab'],
      (k) => k.includes('manuf') || k.includes('maker') || k.includes('mfr') || k.includes('brand')
    );
    const manufacturer = mfrVal ? String(mfrVal).trim() : 'Boehringer Ingelheim / Zoetis';

    // 7. Expiration Date
    const expVal = findValueBySynonyms(
      row,
      ['expirationdate', 'expirydate', 'expiry', 'expdate', 'expiration', 'validuntil', 'exp_date'],
      (k) => k.includes('exp') || k.includes('valid')
    );
    const expirationDate = normalizeDate(expVal);

    // 8. Dosage / Instructions
    const dosageVal = findValueBySynonyms(
      row,
      ['dosage', 'dose', 'instructions', 'method', 'administrationroute', 'route', 'application', 'usage'],
      (k) => k.includes('dos') || k.includes('route') || k.includes('method') || k.includes('instruct')
    );
    const dosage = dosageVal ? String(dosageVal).trim() : '1 dose/bird via Eye Drop / Water';

    // 9. Notes / Packaging description
    const notesVal = findValueBySynonyms(
      row,
      ['notes', 'remarks', 'comments', 'description', 'storage'],
      (k) => k.includes('note') || k.includes('remark') || k.includes('desc')
    );
    const notes = notesVal ? String(notesVal).trim() : undefined;

    // Validation warnings
    if (currentStockUnits === 0) {
      issues.push({
        row: rowNum,
        field: 'Stock',
        message: `Product "${productName}" has 0 initial stock units.`,
        severity: 'warning'
      });
    }

    items.push({
      id: `batch_med_${Date.now()}_${idx}`,
      name: productName,
      type: category,
      unitType,
      dosesPerUnit,
      currentStockUnits,
      manufacturer,
      expirationDate,
      dosage,
      packaging: `${dosesPerUnit.toLocaleString()} doses / ${unitType}`,
      notes
    });
  });

  return {
    items,
    issues,
    validCount: items.length,
    errorCount: issues.filter(i => i.severity === 'error').length,
    sheetNames
  };
}

/**
 * Downloads a prefilled sample batch upload template in Excel (.xlsx) or CSV (.csv)
 */
export function downloadHealthItemsTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const sampleData = [
    {
      'Product Name': 'Newcastle B1 + Bronchitis Mass',
      'Category': 'Vaccine',
      'Packaging Unit': 'Vial',
      'Doses Per Unit': 1000,
      'Initial Stock Units': 20,
      'Manufacturer': 'Boehringer Ingelheim',
      'Expiry Date': '2027-08-30',
      'Dosage / Route': '1 dose/bird via Eye Drop',
      'Notes': 'Keep refrigerated at 2-8°C'
    },
    {
      'Product Name': 'Gumboro IBD Live Vaccine',
      'Category': 'Vaccine',
      'Packaging Unit': 'Vial',
      'Doses Per Unit': 1000,
      'Initial Stock Units': 15,
      'Manufacturer': 'Ceva Animal Health',
      'Expiry Date': '2027-09-15',
      'Dosage / Route': '1 dose/bird via Drinking Water',
      'Notes': 'Day 14 booster'
    },
    {
      'Product Name': 'Amoxicillin 50% Soluble Powder',
      'Category': 'Antibiotic',
      'Packaging Unit': 'bottle',
      'Doses Per Unit': 1000,
      'Initial Stock Units': 10,
      'Manufacturer': 'Zoetis Animal Health',
      'Expiry Date': '2027-11-20',
      'Dosage / Route': '1g per 2 Liters drinking water for 5 days',
      'Notes': 'Withdrawal period: 3 days'
    },
    {
      'Product Name': 'Vita-Stress Soluble Concentrate',
      'Category': 'Vitamins',
      'Packaging Unit': 'bag',
      'Doses Per Unit': 2500,
      'Initial Stock Units': 25,
      'Manufacturer': 'Bayer / Elanco',
      'Expiry Date': '2028-01-10',
      'Dosage / Route': '100g per 200 Liters drinking water',
      'Notes': 'Administer post-vaccination & transfer'
    },
    {
      'Product Name': 'Virkon S Broad-Spectrum Disinfectant',
      'Category': 'Disinfectant',
      'Packaging Unit': 'box',
      'Doses Per Unit': 1000,
      'Initial Stock Units': 8,
      'Manufacturer': 'Lanxess Biosecurity',
      'Expiry Date': '2028-06-30',
      'Dosage / Route': '1:100 terminal disinfection spray',
      'Notes': 'Biosecurity vehicle and house wash'
    },
    {
      'Product Name': 'Albendazole 10% Oral Suspension',
      'Category': 'Dewormer',
      'Packaging Unit': 'bottle',
      'Doses Per Unit': 1000,
      'Initial Stock Units': 6,
      'Manufacturer': 'MSD Animal Health',
      'Expiry Date': '2027-10-15',
      'Dosage / Route': '1 dose/bird in morning water',
      'Notes': 'Scheduled rearing deworming'
    },
    {
      'Product Name': 'Automatic Vaccinator Syringe 0.5ml',
      'Category': 'paraphernalias',
      'Packaging Unit': 'piece',
      'Doses Per Unit': 1,
      'Initial Stock Units': 5,
      'Manufacturer': 'Socorex Swiss',
      'Expiry Date': '2030-01-01',
      'Dosage / Route': 'Repeat injection hardware',
      'Notes': 'Sterilize with boiling water'
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Column width configuration
  ws['!cols'] = [
    { wch: 32 }, // Product Name
    { wch: 15 }, // Category
    { wch: 16 }, // Packaging Unit
    { wch: 16 }, // Doses Per Unit
    { wch: 18 }, // Initial Stock Units
    { wch: 24 }, // Manufacturer
    { wch: 14 }, // Expiry Date
    { wch: 36 }, // Dosage / Route
    { wch: 30 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Health_Items_Template');

  const filename = format === 'csv'
    ? 'Health_Items_Batch_Template.csv'
    : 'Health_Items_Batch_Template.xlsx';

  XLSX.writeFile(wb, filename, { bookType: format === 'csv' ? 'csv' : 'xlsx' });
}

/**
 * Exports current biological inventory as an editable spreadsheet
 */
export function exportCurrentHealthItems(medProducts: MedProduct[], farmName: string = 'Farm') {
  const exportData = medProducts.map(p => ({
    'Product Name': p.name,
    'Category': p.type,
    'Packaging Unit': p.unitType,
    'Doses Per Unit': p.dosesPerUnit,
    'Initial Stock Units': p.currentStockUnits || p.currentStock || 0,
    'Manufacturer': p.manufacturer,
    'Expiry Date': p.expirationDate || p.expiryDate || '',
    'Dosage / Route': p.dosage || '',
    'Notes': p.notes || ''
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  ws['!cols'] = [
    { wch: 32 },
    { wch: 15 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 24 },
    { wch: 14 },
    { wch: 36 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Current_Health_Stock');
  const safeName = farmName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${safeName}_Health_Inventory_Export_${dateStr}.xlsx`);
}
