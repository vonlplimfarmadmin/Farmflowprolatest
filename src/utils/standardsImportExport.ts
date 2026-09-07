import * as XLSX from 'xlsx';
import { 
  StandardMedProgramItem, 
  StandardFeedGuideItem, 
  StandardHendayItem, 
  StandardBodyWeightItem, 
  StandardEggWeightItem,
  ProductType,
  FeedType,
  FarmProfile
} from '../types';

export type StandardTarget = 'all' | 'vaccine' | 'feed' | 'henday' | 'bodyweight' | 'eggweight';

export interface StandardParsedData {
  vaccine?: StandardMedProgramItem[];
  feed?: StandardFeedGuideItem[];
  henday?: StandardHendayItem[];
  bodyweight?: StandardBodyWeightItem[];
  eggweight?: StandardEggWeightItem[];
}

export interface ValidationIssue {
  row: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParseResult {
  success: boolean;
  target: StandardTarget;
  detectedSheets: string[];
  totalRowsParsed: number;
  validRowsCount: number;
  errorRowsCount: number;
  issues: ValidationIssue[];
  data: StandardParsedData;
  rawPreviews: Record<string, Record<string, any>[]>;
}

/**
 * Normalizes an arbitrary header string for fuzzy matching
 */
function normalizeHeader(header: any): string {
  if (header == null) return '';
  return String(header)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parses numeric value safely
 */
function parseNumber(val: any, fallback = 0): number {
  if (val == null) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? fallback : n;
}

/**
 * Parses integer safely
 */
function parseIntSafe(val: any, fallback = 0): number {
  const n = parseNumber(val, fallback);
  return Math.round(n);
}

/**
 * Parses boolean safely
 */
function parseBoolean(val: any, fallback = true): boolean {
  if (val == null) return fallback;
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toLowerCase();
  if (['yes', 'y', 'true', '1', 'mandatory', 'required'].includes(s)) return true;
  if (['no', 'n', 'false', '0', 'optional'].includes(s)) return false;
  return fallback;
}

/**
 * Normalizes ProductType
 */
function normalizeProductType(val: any): ProductType {
  const s = String(val || '').trim().toLowerCase();
  if (s.includes('vacc')) return 'Vaccine';
  if (s.includes('antibio')) return 'Antibiotic';
  if (s.includes('suppl')) return 'Supplement';
  if (s.includes('vitam')) return 'Vitamins';
  if (s.includes('disinf')) return 'Disinfectant';
  if (s.includes('deworm')) return 'Dewormer';
  if (s.includes('paraph')) return 'paraphernalias';
  return 'Medicine';
}

/**
 * Normalizes FeedType
 */
function normalizeFeedType(val: any, defaultType: FeedType = 'BLC 1'): FeedType {
  const s = String(val || '').trim().toUpperCase().replace(/\s+/g, ' ');
  const validFeedTypes: FeedType[] = ['CSC 1', 'CSC 2', 'CGC', 'PDC', 'BLC 1', 'BLC 2', 'BLC 3', 'BMCC', 'BMCR', 'CBB'];
  const matched = validFeedTypes.find(t => t.toUpperCase() === s || t.toUpperCase().replace(/\s/g, '') === s.replace(/\s/g, ''));
  return matched || defaultType;
}

/**
 * Finds key in row object by list of normalized synonyms
 */
function findValueBySynonyms(row: Record<string, any>, synonyms: string[]): any {
  const normalizedSynonyms = synonyms.map(s => normalizeHeader(s));
  for (const [key, val] of Object.entries(row)) {
    const normKey = normalizeHeader(key);
    if (normalizedSynonyms.includes(normKey)) {
      return val;
    }
  }
  return undefined;
}

// -------------------------------------------------------------
// Parsers for Each Standard Sheet
// -------------------------------------------------------------

function parseVaccineRows(rows: Record<string, any>[]): { items: StandardMedProgramItem[]; issues: ValidationIssue[] } {
  const items: StandardMedProgramItem[] = [];
  const issues: ValidationIssue[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const weekVal = findValueBySynonyms(row, ['ageweek', 'week', 'ageinweeks', 'age', 'flockweek', 'wk', 'age_week']);
    const productVal = findValueBySynonyms(row, ['productname', 'product', 'vaccine', 'medication', 'itemname', 'name']);

    if (weekVal == null && !productVal) {
      // Empty row, skip quietly
      return;
    }

    const ageWeek = parseIntSafe(weekVal, 0);
    if (ageWeek <= 0) {
      issues.push({ row: rowNum, field: 'Age Week', message: `Invalid or missing Age Week (${weekVal}). Expected week > 0.`, severity: 'error' });
      return;
    }

    const productName = String(productVal || '').trim();
    if (!productName) {
      issues.push({ row: rowNum, field: 'Product Name', message: `Missing Product / Vaccine Name.`, severity: 'error' });
      return;
    }

    const ageDaysVal = findValueBySynonyms(row, ['agedays', 'day', 'days', 'ageindays', 'age_days']);
    const ageDays = ageDaysVal != null ? parseIntSafe(ageDaysVal, ageWeek * 7) : undefined;

    const typeVal = findValueBySynonyms(row, ['producttype', 'type', 'category']);
    const diseaseVal = findValueBySynonyms(row, ['diseasetarget', 'target', 'disease', 'targetdisease', 'indication']);
    const methodVal = findValueBySynonyms(row, ['method', 'route', 'application', 'adminmethod', 'administration']);
    const mandatoryVal = findValueBySynonyms(row, ['mandatory', 'required', 'compulsory', 'isrequired']);
    const notesVal = findValueBySynonyms(row, ['notes', 'remarks', 'comments', 'instructions', 'dosage']);

    items.push({
      id: `vac_imp_${Date.now()}_${idx}`,
      ageWeek,
      ageDays,
      productName,
      productType: normalizeProductType(typeVal),
      diseaseTarget: String(diseaseVal || 'General Immunity').trim(),
      method: String(methodVal || 'Drinking Water').trim(),
      mandatory: parseBoolean(mandatoryVal, true),
      notes: notesVal ? String(notesVal).trim() : undefined,
    });
  });

  items.sort((a, b) => a.ageWeek - b.ageWeek);
  return { items, issues };
}

function parseFeedGuideRows(rows: Record<string, any>[]): { items: StandardFeedGuideItem[]; issues: ValidationIssue[] } {
  const items: StandardFeedGuideItem[] = [];
  const issues: ValidationIssue[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const weekVal = findValueBySynonyms(row, ['ageweek', 'week', 'age', 'flockage', 'wk', 'age_week']);
    if (weekVal == null) return;

    const ageWeek = parseIntSafe(weekVal, 0);
    if (ageWeek <= 0) {
      issues.push({ row: rowNum, field: 'Age Week', message: `Invalid Age Week: ${weekVal}`, severity: 'error' });
      return;
    }

    const breedVal = findValueBySynonyms(row, ['breedtype', 'breed', 'strain', 'line', 'primarybreed']);
    const phaseVal = findValueBySynonyms(row, ['productionphase', 'phase', 'stage', 'feedphase', 'phaseofproduction']);
    const femaleFeedVal = findValueBySynonyms(row, ['femalefeedtype', 'femaletype', 'ffeedtype', 'female_feed_type']);
    const femaleGramsVal = findValueBySynonyms(row, ['femalegramsperbird', 'femalegrams', 'female_grams', 'femaledailygrams', 'femaleg', 'f_grams', 'female']);
    const maleFeedVal = findValueBySynonyms(row, ['malefeedtype', 'maletype', 'mfeedtype', 'male_feed_type']);
    const maleGramsVal = findValueBySynonyms(row, ['malegramsperbird', 'malegrams', 'male_grams', 'maledailygrams', 'maleg', 'm_grams', 'male']);

    const femaleFeedType = normalizeFeedType(femaleFeedVal, ageWeek >= 20 ? 'BLC 1' : 'CSC 1');
    const maleFeedType = normalizeFeedType(maleFeedVal, ageWeek >= 20 ? 'BMCC' : 'CSC 1');
    const femaleGramsPerBird = parseNumber(femaleGramsVal, 0);
    const maleGramsPerBird = parseNumber(maleGramsVal, 0);

    if (femaleGramsPerBird <= 0 && maleGramsPerBird <= 0) {
      issues.push({ row: rowNum, field: 'Feed Grams', message: `Feed amounts for week ${ageWeek} are 0.`, severity: 'warning' });
    }

    items.push({
      id: `fg_imp_${Date.now()}_${idx}`,
      breedType: String(breedVal || 'Cobb 500').trim(),
      ageWeek,
      productionPhase: String(phaseVal || (ageWeek < 6 ? 'Brooding / Starter' : ageWeek < 20 ? 'Rearing / Grower' : 'Laying Phase')).trim(),
      femaleFeedType,
      femaleGramsPerBird,
      maleFeedType,
      maleGramsPerBird,
      recommendedFeedType: femaleFeedType,
    });
  });

  items.sort((a, b) => {
    if ((a.breedType || '') === (b.breedType || '')) {
      return a.ageWeek - b.ageWeek;
    }
    return (a.breedType || '').localeCompare(b.breedType || '');
  });
  return { items, issues };
}

function parseHendayRows(rows: Record<string, any>[]): { items: StandardHendayItem[]; issues: ValidationIssue[] } {
  const items: StandardHendayItem[] = [];
  const issues: ValidationIssue[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const weekVal = findValueBySynonyms(row, ['ageweek', 'week', 'flockage', 'age', 'age_week']);
    if (weekVal == null) return;

    const ageWeek = parseIntSafe(weekVal, 0);
    if (ageWeek <= 0) {
      issues.push({ row: rowNum, field: 'Age Week', message: `Invalid Age Week: ${weekVal}`, severity: 'error' });
      return;
    }

    const prodWeekVal = findValueBySynonyms(row, ['ageinproduction', 'prodweek', 'productionweek', 'layweek', 'production_week']);
    const ageInProduction = prodWeekVal != null ? parseIntSafe(prodWeekVal, Math.max(1, ageWeek - 23)) : Math.max(1, ageWeek - 23);

    const hendayVal = findValueBySynonyms(row, ['standardhendaypct', 'hendaypct', 'henday', 'standardhenday', 'laypct', 'lay%', 'hd%', 'standard_henday_pct']);
    const hatchVal = findValueBySynonyms(row, ['standardhatchingpct', 'hatchingpct', 'hatching', 'standardhe%', 'he%', 'standard_hatching_pct']);

    const standardHendayPct = parseNumber(hendayVal, 0);
    const standardHatchingPct = parseNumber(hatchVal, 0);

    if (standardHendayPct > 100 || standardHendayPct < 0) {
      issues.push({ row: rowNum, field: 'Henday %', message: `Henday % (${standardHendayPct}%) should be between 0% and 100%.`, severity: 'warning' });
    }

    items.push({
      id: `hd_imp_${Date.now()}_${idx}`,
      ageWeek,
      ageInProduction,
      standardHendayPct: Math.round(standardHendayPct * 10) / 10,
      standardHatchingPct: Math.round(standardHatchingPct * 10) / 10,
    });
  });

  items.sort((a, b) => a.ageWeek - b.ageWeek);
  return { items, issues };
}

function parseBodyWeightRows(rows: Record<string, any>[]): { items: StandardBodyWeightItem[]; issues: ValidationIssue[] } {
  const items: StandardBodyWeightItem[] = [];
  const issues: ValidationIssue[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const weekVal = findValueBySynonyms(row, ['ageweek', 'week', 'flockage', 'age', 'age_week']);
    if (weekVal == null) return;

    const ageWeek = parseIntSafe(weekVal, 0);
    if (ageWeek <= 0) {
      issues.push({ row: rowNum, field: 'Age Week', message: `Invalid Age Week: ${weekVal}`, severity: 'error' });
      return;
    }

    const maleVal = findValueBySynonyms(row, ['malestandardgrams', 'malestandard', 'maleweight', 'maletarget', 'male_target_grams', 'male(g)', 'malegrams', 'male_standard_grams']);
    const femaleVal = findValueBySynonyms(row, ['femalestandardgrams', 'femalestandard', 'femaleweight', 'femaletarget', 'female_target_grams', 'female(g)', 'femalegrams', 'female_standard_grams']);
    const tolMinVal = findValueBySynonyms(row, ['tolerancemingrams', 'tolerancemin', 'minweight', 'tolerance_min_grams']);
    const tolMaxVal = findValueBySynonyms(row, ['tolerancemaxgrams', 'tolerancemax', 'maxweight', 'tolerance_max_grams']);

    const maleStandardGrams = parseIntSafe(maleVal, 0);
    const femaleStandardGrams = parseIntSafe(femaleVal, 0);

    if (maleStandardGrams <= 0 && femaleStandardGrams <= 0) {
      issues.push({ row: rowNum, field: 'Weights', message: `Male and Female standard weights are 0 for week ${ageWeek}.`, severity: 'warning' });
    }

    items.push({
      id: `bw_imp_${Date.now()}_${idx}`,
      ageWeek,
      maleStandardGrams,
      femaleStandardGrams,
      toleranceMinGrams: tolMinVal != null ? parseIntSafe(tolMinVal, Math.round(femaleStandardGrams * 0.95)) : undefined,
      toleranceMaxGrams: tolMaxVal != null ? parseIntSafe(tolMaxVal, Math.round(femaleStandardGrams * 1.05)) : undefined,
    });
  });

  items.sort((a, b) => a.ageWeek - b.ageWeek);
  return { items, issues };
}

function parseEggWeightRows(rows: Record<string, any>[]): { items: StandardEggWeightItem[]; issues: ValidationIssue[] } {
  const items: StandardEggWeightItem[] = [];
  const issues: ValidationIssue[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const weekVal = findValueBySynonyms(row, ['ageweek', 'week', 'flockage', 'age', 'age_week']);
    if (weekVal == null) return;

    const ageWeek = parseIntSafe(weekVal, 0);
    if (ageWeek <= 0) {
      issues.push({ row: rowNum, field: 'Age Week', message: `Invalid Age Week: ${weekVal}`, severity: 'error' });
      return;
    }

    const prodWeekVal = findValueBySynonyms(row, ['ageinproduction', 'prodweek', 'productionweek', 'layweek', 'production_week']);
    const ageInProduction = prodWeekVal != null ? parseIntSafe(prodWeekVal, Math.max(1, ageWeek - 23)) : Math.max(1, ageWeek - 23);

    const weightVal = findValueBySynonyms(row, ['standardweightgrams', 'standardweight', 'eggweight', 'eggweightgrams', 'standard_weight_grams', 'weight(g)']);
    const standardWeightGrams = parseNumber(weightVal, 0);

    if (standardWeightGrams <= 0) {
      issues.push({ row: rowNum, field: 'Egg Weight', message: `Egg weight for week ${ageWeek} is 0.`, severity: 'warning' });
    }

    items.push({
      id: `ew_imp_${Date.now()}_${idx}`,
      ageWeek,
      ageInProduction,
      standardWeightGrams: Math.round(standardWeightGrams * 10) / 10,
    });
  });

  items.sort((a, b) => a.ageWeek - b.ageWeek);
  return { items, issues };
}

// -------------------------------------------------------------
// Universal File Parser
// -------------------------------------------------------------

export async function parseStandardsFile(
  file: File,
  target: StandardTarget = 'all'
): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const detectedSheets = workbook.SheetNames || [];

  const parsedData: StandardParsedData = {};
  const allIssues: ValidationIssue[] = [];
  const rawPreviews: Record<string, Record<string, any>[]> = {};
  let totalRows = 0;
  let validRows = 0;

  // Helper to extract JSON rows from a sheet
  const getSheetRows = (sheetName: string): Record<string, any>[] => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null });
  };

  // If single specific target selected and file only has 1 sheet, use that sheet directly regardless of its name
  const useSingleSheetFallback = target !== 'all' && detectedSheets.length === 1;

  // 1. Vaccination Program
  if (target === 'all' || target === 'vaccine') {
    let sheetName = detectedSheets.find(s => /vaccin|med/i.test(s));
    if (!sheetName && useSingleSheetFallback && target === 'vaccine') {
      sheetName = detectedSheets[0];
    }
    if (sheetName) {
      const rows = getSheetRows(sheetName);
      rawPreviews['vaccine'] = rows.slice(0, 10);
      totalRows += rows.length;
      const res = parseVaccineRows(rows);
      parsedData.vaccine = res.items;
      allIssues.push(...res.issues);
      validRows += res.items.length;
    }
  }

  // 2. Feed Guide
  if (target === 'all' || target === 'feed') {
    let sheetName = detectedSheets.find(s => /feed/i.test(s));
    if (!sheetName && useSingleSheetFallback && target === 'feed') {
      sheetName = detectedSheets[0];
    }
    if (sheetName) {
      const rows = getSheetRows(sheetName);
      rawPreviews['feed'] = rows.slice(0, 10);
      totalRows += rows.length;
      const res = parseFeedGuideRows(rows);
      parsedData.feed = res.items;
      allIssues.push(...res.issues);
      validRows += res.items.length;
    }
  }

  // 3. Henday %
  if (target === 'all' || target === 'henday') {
    let sheetName = detectedSheets.find(s => /henday|lay/i.test(s));
    if (!sheetName && useSingleSheetFallback && target === 'henday') {
      sheetName = detectedSheets[0];
    }
    if (sheetName) {
      const rows = getSheetRows(sheetName);
      rawPreviews['henday'] = rows.slice(0, 10);
      totalRows += rows.length;
      const res = parseHendayRows(rows);
      parsedData.henday = res.items;
      allIssues.push(...res.issues);
      validRows += res.items.length;
    }
  }

  // 4. Body Weight
  if (target === 'all' || target === 'bodyweight') {
    let sheetName = detectedSheets.find(s => /body.*weight|weight.*body|^body/i.test(s));
    if (!sheetName && useSingleSheetFallback && target === 'bodyweight') {
      sheetName = detectedSheets[0];
    }
    if (sheetName) {
      const rows = getSheetRows(sheetName);
      rawPreviews['bodyweight'] = rows.slice(0, 10);
      totalRows += rows.length;
      const res = parseBodyWeightRows(rows);
      parsedData.bodyweight = res.items;
      allIssues.push(...res.issues);
      validRows += res.items.length;
    }
  }

  // 5. Egg Weight
  if (target === 'all' || target === 'eggweight') {
    let sheetName = detectedSheets.find(s => /egg.*weight|weight.*egg|^egg/i.test(s));
    if (!sheetName && useSingleSheetFallback && target === 'eggweight') {
      sheetName = detectedSheets[0];
    }
    if (sheetName) {
      const rows = getSheetRows(sheetName);
      rawPreviews['eggweight'] = rows.slice(0, 10);
      totalRows += rows.length;
      const res = parseEggWeightRows(rows);
      parsedData.eggweight = res.items;
      allIssues.push(...res.issues);
      validRows += res.items.length;
    }
  }

  const errorIssues = allIssues.filter(i => i.severity === 'error');

  return {
    success: validRows > 0,
    target,
    detectedSheets,
    totalRowsParsed: totalRows,
    validRowsCount: validRows,
    errorRowsCount: errorIssues.length,
    issues: allIssues,
    data: parsedData,
    rawPreviews
  };
}

// -------------------------------------------------------------
// Starter Templates Generator
// -------------------------------------------------------------

export function downloadStandardTemplate(
  target: StandardTarget,
  format: 'xlsx' | 'csv' = 'xlsx',
  customFarmName = 'FarmFlow'
) {
  const wb = XLSX.utils.book_new();

  // Template 1: Vaccination Schedule
  if (target === 'all' || target === 'vaccine') {
    const vaccineData = [
      {
        'Age Week': 1,
        'Age Days': 1,
        'Product Name': "Marek's HVT + Rispens",
        'Product Type': 'Vaccine',
        'Disease Target': "Marek's Disease",
        'Method': 'Subcutaneous Injection',
        'Mandatory': 'Yes',
        'Notes': 'Hatchery administered on Day 1'
      },
      {
        'Age Week': 1,
        'Age Days': 7,
        'Product Name': 'Newcastle B1 + Bronchitis Mass',
        'Product Type': 'Vaccine',
        'Disease Target': 'ND + IB',
        'Method': 'Eye Drop',
        'Mandatory': 'Yes',
        'Notes': 'Individual bird ocular application'
      },
      {
        'Age Week': 2,
        'Age Days': 14,
        'Product Name': 'Gumboro D78 Live',
        'Product Type': 'Vaccine',
        'Disease Target': 'Infectious Bursal Disease (IBD)',
        'Method': 'Drinking Water',
        'Mandatory': 'Yes',
        'Notes': 'Skim milk stabilizer added to water line'
      },
      {
        'Age Week': 4,
        'Age Days': 28,
        'Product Name': 'Fowl Pox Live Wing Web',
        'Product Type': 'Vaccine',
        'Disease Target': 'Avian Pox',
        'Method': 'Wing Web',
        'Mandatory': 'Yes',
        'Notes': 'Check take at 7-10 days'
      },
      {
        'Age Week': 8,
        'Age Days': 56,
        'Product Name': 'Infectious Coryza Killed 3-Valent',
        'Product Type': 'Vaccine',
        'Disease Target': 'Coryza A, B, C',
        'Method': 'Intramuscular Injection',
        'Mandatory': 'Yes',
        'Notes': 'Breast muscle injection'
      },
      {
        'Age Week': 12,
        'Age Days': 84,
        'Product Name': 'ND + IB + IBD Inactivated Oil Emulsion',
        'Product Type': 'Vaccine',
        'Disease Target': 'ND + IB + Gumboro',
        'Method': 'Intramuscular Injection',
        'Mandatory': 'Yes',
        'Notes': 'Booster prior to pre-lay'
      },
      {
        'Age Week': 18,
        'Age Days': 126,
        'Product Name': 'ND+IB+EDS+Reo Killed Booster',
        'Product Type': 'Vaccine',
        'Disease Target': 'Egg Drop Syndrome + ND + IB + Reo',
        'Method': 'Intramuscular Injection',
        'Mandatory': 'Yes',
        'Notes': 'Pre-transfer final breeder defense'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(vaccineData);
    ws['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 32 }, { wch: 14 }, { wch: 28 }, { wch: 24 }, { wch: 12 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Vaccination_Standard');
  }

  // Template 2: Feed Guide
  if (target === 'all' || target === 'feed') {
    const feedData = [
      {
        'Breed Type': 'Cobb 500',
        'Age Week': 1,
        'Production Phase': 'Brooding / Starter',
        'Female Feed Type': 'CSC 1',
        'Female Grams Per Bird': 20,
        'Male Feed Type': 'CSC 1',
        'Male Grams Per Bird': 22
      },
      {
        'Breed Type': 'Cobb 500',
        'Age Week': 4,
        'Production Phase': 'Starter Phase 2',
        'Female Feed Type': 'CSC 2',
        'Female Grams Per Bird': 42,
        'Male Feed Type': 'CSC 2',
        'Male Grams Per Bird': 46
      },
      {
        'Breed Type': 'Cobb 500',
        'Age Week': 12,
        'Production Phase': 'Growing Phase',
        'Female Feed Type': 'CGC',
        'Female Grams Per Bird': 70,
        'Male Feed Type': 'CGC',
        'Male Grams Per Bird': 80
      },
      {
        'Breed Type': 'Cobb 500',
        'Age Week': 20,
        'Production Phase': 'Pre-Lay Preparation',
        'Female Feed Type': 'BLC 1',
        'Female Grams Per Bird': 95,
        'Male Feed Type': 'BMCC',
        'Male Grams Per Bird': 105
      },
      {
        'Breed Type': 'Cobb 500',
        'Age Week': 24,
        'Production Phase': 'Onset of Lay (5% HD)',
        'Female Feed Type': 'BLC 1',
        'Female Grams Per Bird': 120,
        'Male Feed Type': 'BMCC',
        'Male Grams Per Bird': 115
      },
      {
        'Breed Type': 'Cobb 500',
        'Age Week': 28,
        'Production Phase': 'Peak Production',
        'Female Feed Type': 'BLC 1',
        'Female Grams Per Bird': 160,
        'Male Feed Type': 'BMCC',
        'Male Grams Per Bird': 125
      },
      {
        'Breed Type': 'Cobb 500',
        'Age Week': 40,
        'Production Phase': 'Post-Peak Maintenance',
        'Female Feed Type': 'BLC 2',
        'Female Grams Per Bird': 158,
        'Male Feed Type': 'BMCR',
        'Male Grams Per Bird': 130
      }
    ];
    const ws = XLSX.utils.json_to_sheet(feedData);
    ws['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 25 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Feed_Guide_Standard');
  }

  // Template 3: Henday Curve
  if (target === 'all' || target === 'henday') {
    const hendayData = [
      { 'Age Week': 24, 'Production Week': 1, 'Standard Henday %': 5.0, 'Standard Hatching Egg %': 60.0 },
      { 'Age Week': 25, 'Production Week': 2, 'Standard Henday %': 22.0, 'Standard Hatching Egg %': 75.0 },
      { 'Age Week': 26, 'Production Week': 3, 'Standard Henday %': 50.0, 'Standard Hatching Egg %': 84.0 },
      { 'Age Week': 27, 'Production Week': 4, 'Standard Henday %': 72.0, 'Standard Hatching Egg %': 88.5 },
      { 'Age Week': 28, 'Production Week': 5, 'Standard Henday %': 84.0, 'Standard Hatching Egg %': 91.0 },
      { 'Age Week': 30, 'Production Week': 7, 'Standard Henday %': 90.5, 'Standard Hatching Egg %': 94.0 },
      { 'Age Week': 35, 'Production Week': 12, 'Standard Henday %': 87.0, 'Standard Hatching Egg %': 94.2 },
      { 'Age Week': 42, 'Production Week': 19, 'Standard Henday %': 81.5, 'Standard Hatching Egg %': 92.5 },
      { 'Age Week': 50, 'Production Week': 27, 'Standard Henday %': 74.0, 'Standard Hatching Egg %': 89.0 },
      { 'Age Week': 60, 'Production Week': 37, 'Standard Henday %': 63.5, 'Standard Hatching Egg %': 84.0 },
      { 'Age Week': 65, 'Production Week': 42, 'Standard Henday %': 57.0, 'Standard Hatching Egg %': 80.0 },
    ];
    const ws = XLSX.utils.json_to_sheet(hendayData);
    ws['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 20 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Henday_Standard');
  }

  // Template 4: Body Weight Curve
  if (target === 'all' || target === 'bodyweight') {
    const bwData = [
      { 'Age Week': 1, 'Male Target (g)': 155, 'Female Target (g)': 140, 'Tolerance Min (g)': 130, 'Tolerance Max (g)': 165 },
      { 'Age Week': 4, 'Male Target (g)': 580, 'Female Target (g)': 490, 'Tolerance Min (g)': 460, 'Tolerance Max (g)': 520 },
      { 'Age Week': 8, 'Male Target (g)': 1250, 'Female Target (g)': 1020, 'Tolerance Min (g)': 970, 'Tolerance Max (g)': 1070 },
      { 'Age Week': 12, 'Male Target (g)': 1850, 'Female Target (g)': 1450, 'Tolerance Min (g)': 1380, 'Tolerance Max (g)': 1520 },
      { 'Age Week': 16, 'Male Target (g)': 2450, 'Female Target (g)': 1880, 'Tolerance Min (g)': 1790, 'Tolerance Max (g)': 1970 },
      { 'Age Week': 20, 'Male Target (g)': 3050, 'Female Target (g)': 2280, 'Tolerance Min (g)': 2170, 'Tolerance Max (g)': 2390 },
      { 'Age Week': 24, 'Male Target (g)': 3600, 'Female Target (g)': 2750, 'Tolerance Min (g)': 2620, 'Tolerance Max (g)': 2880 },
      { 'Age Week': 28, 'Male Target (g)': 4050, 'Female Target (g)': 3250, 'Tolerance Min (g)': 3100, 'Tolerance Max (g)': 3400 },
      { 'Age Week': 35, 'Male Target (g)': 4400, 'Female Target (g)': 3600, 'Tolerance Min (g)': 3450, 'Tolerance Max (g)': 3750 },
      { 'Age Week': 50, 'Male Target (g)': 4750, 'Female Target (g)': 3950, 'Tolerance Min (g)': 3780, 'Tolerance Max (g)': 4120 },
      { 'Age Week': 65, 'Male Target (g)': 4950, 'Female Target (g)': 4150, 'Tolerance Min (g)': 3980, 'Tolerance Max (g)': 4320 },
    ];
    const ws = XLSX.utils.json_to_sheet(bwData);
    ws['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Body_Weight_Standard');
  }

  // Template 5: Egg Weight Progression
  if (target === 'all' || target === 'eggweight') {
    const ewData = [
      { 'Age Week': 24, 'Production Week': 1, 'Standard Weight (g)': 51.5 },
      { 'Age Week': 26, 'Production Week': 3, 'Standard Weight (g)': 55.0 },
      { 'Age Week': 28, 'Production Week': 5, 'Standard Weight (g)': 58.2 },
      { 'Age Week': 30, 'Production Week': 7, 'Standard Weight (g)': 60.5 },
      { 'Age Week': 34, 'Production Week': 11, 'Standard Weight (g)': 62.8 },
      { 'Age Week': 40, 'Production Week': 17, 'Standard Weight (g)': 64.9 },
      { 'Age Week': 48, 'Production Week': 25, 'Standard Weight (g)': 66.8 },
      { 'Age Week': 56, 'Production Week': 33, 'Standard Weight (g)': 68.2 },
      { 'Age Week': 65, 'Production Week': 42, 'Standard Weight (g)': 69.8 },
    ];
    const ws = XLSX.utils.json_to_sheet(ewData);
    ws['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Egg_Weight_Standard');
  }

  const cleanPrefix = (customFarmName || 'FarmFlow').replace(/[^a-zA-Z0-9]/g, '_');
  const targetLabel = target === 'all' ? 'All_Standards_Master' : `${target.toUpperCase()}_Standard`;

  if (format === 'csv' && target !== 'all') {
    const firstSheetName = wb.SheetNames[0];
    const csvContent = XLSX.utils.sheet_to_csv(wb.Sheets[firstSheetName]);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cleanPrefix}_${targetLabel}_Template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(wb, `${cleanPrefix}_${targetLabel}_Template.xlsx`);
  }
}

// -------------------------------------------------------------
// Export Existing Standards to Excel / CSV
// -------------------------------------------------------------

export function exportCurrentStandards(
  farmProfile: FarmProfile,
  target: StandardTarget = 'all'
) {
  const wb = XLSX.utils.book_new();

  if (target === 'all' || target === 'vaccine') {
    const data = (farmProfile.standardVaccinationProgram || []).map(item => ({
      'Age Week': item.ageWeek,
      'Age Days': item.ageDays || item.ageWeek * 7,
      'Product Name': item.productName,
      'Product Type': item.productType,
      'Disease Target': item.diseaseTarget,
      'Method': item.method,
      'Mandatory': item.mandatory ? 'Yes' : 'No',
      'Notes': item.notes || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Vaccination_Standard');
  }

  if (target === 'all' || target === 'feed') {
    const data = (farmProfile.standardFeedGuide || []).map(item => ({
      'Breed Type': item.breedType || 'All Breeds',
      'Age Week': item.ageWeek,
      'Production Phase': item.productionPhase,
      'Female Feed Type': item.femaleFeedType || item.recommendedFeedType || 'BLC 1',
      'Female Grams Per Bird': item.femaleGramsPerBird,
      'Male Feed Type': item.maleFeedType || 'BMCC',
      'Male Grams Per Bird': item.maleGramsPerBird
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Feed_Guide_Standard');
  }

  if (target === 'all' || target === 'henday') {
    const data = (farmProfile.standardHenday || []).map(item => ({
      'Age Week': item.ageWeek,
      'Production Week': item.ageInProduction,
      'Standard Henday %': item.standardHendayPct,
      'Standard Hatching Egg %': item.standardHatchingPct
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Henday_Standard');
  }

  if (target === 'all' || target === 'bodyweight') {
    const data = (farmProfile.standardBodyWeights || []).map(item => ({
      'Age Week': item.ageWeek,
      'Male Target (g)': item.maleStandardGrams,
      'Female Target (g)': item.femaleStandardGrams,
      'Tolerance Min (g)': item.toleranceMinGrams || '',
      'Tolerance Max (g)': item.toleranceMaxGrams || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Body_Weight_Standard');
  }

  if (target === 'all' || target === 'eggweight') {
    const data = (farmProfile.standardEggWeights || []).map(item => ({
      'Age Week': item.ageWeek,
      'Production Week': item.ageInProduction,
      'Standard Weight (g)': item.standardWeightGrams
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Egg_Weight_Standard');
  }

  const farmPrefix = (farmProfile.name || 'FarmFlow').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const targetLabel = target === 'all' ? 'All_Standards' : `${target.toUpperCase()}_Standard`;

  XLSX.writeFile(wb, `${farmPrefix}_${targetLabel}_Export_${dateStr}.xlsx`);
}
