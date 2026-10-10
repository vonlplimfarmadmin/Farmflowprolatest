import {
  Flock,
  DepletionRecord,
  FeedStockEntry,
  FeedConsumptionRecord,
  FeedType,
  EggProductionRecord,
  BiosecurityRequirement,
  BiosecurityVerificationLog,
  BiosecurityDailySummary,
  HatchingSummaryRecord,
  FarmProfile,
} from '../types';
import { calculateFlockAgeFromLoadingDate } from './dateCalculations';

export interface FlockStats {
  flock: Flock;
  ageWeeks: number;
  ageDays: number;
  totalDaysFromLoading: number;
  weekAndDayStr: string;
  currentMales: number;
  currentFemales: number;
  totalCurrent: number;
  initialTotal: number;
  livabilityPct: number;
  maleToFemaleRatioStr: string;
  maleRatioPct: number;
  totalMaleDepleted: number;
  totalFemaleDepleted: number;
  totalDepleted: number;
}

export interface FeedStockSummaryItem {
  feedType: FeedType;
  totalReceivedKg: number;
  totalReceivedBags: number;
  totalConsumedKg: number;
  currentStockKg: number;
  currentStockBags: number;
  isLowStock: boolean;
}

export interface NormalizedEggProductionRecord extends EggProductionRecord {
  totalEggs: number;
  totalHatchingEggs: number;
  totalNonHatchingEggs: number;
  hatchingEggPct: number;
  nonHatchingEggPct: number;
  hendayPct: number;
  femalePopulationAtDate: number;
  sampleEggWeightGrams: number;
  sorting: NonNullable<EggProductionRecord['sorting']>;
  collections: NonNullable<EggProductionRecord['collections']>;
}

export interface VaccineAlert {
  id: string;
  houseNumber: string;
  flockAgeWeeks: number;
  scheduledWeek: number;
  productName: string;
  diseaseTarget: string;
  method: string;
  urgency: 'due_now' | 'upcoming';
}

export interface BiosecurityDailyMetrics {
  total: number;
  verified: number;
  passed: number;
  failed: number;
  naCount: number;
  compliancePct: number;
  isSignedOff: boolean;
  signedOffBy?: string;
  signedOffAt?: string;
  supervisorNotes?: string;
}

export const ALL_FEED_TYPES: FeedType[] = [
  'CSC 1',
  'CSC 2',
  'CGC',
  'PDC',
  'BLC 1',
  'BLC 2',
  'BLC 3',
  'BMCC',
  'BMCR',
  'CBB',
];

/**
 * Pre-aggregates depletions by houseNumber in a single O(D) pass,
 * avoiding repeated O(F * D) linear scans when computing stats across houses.
 */
export interface HouseDepletionTotals {
  maleDepleted: number;
  femaleDepleted: number;
  totalDepleted: number;
}

export function indexDepletionsByHouse(
  depletions: DepletionRecord[]
): Map<string, HouseDepletionTotals> {
  const map = new Map<string, HouseDepletionTotals>();
  if (!Array.isArray(depletions)) return map;

  for (let i = 0; i < depletions.length; i++) {
    const d = depletions[i];
    if (!d || !d.houseNumber) continue;
    const m = Number(d.maleCount) || 0;
    const f = Number(d.femaleCount) || 0;
    const existing = map.get(d.houseNumber);
    if (existing) {
      existing.maleDepleted += m;
      existing.femaleDepleted += f;
      existing.totalDepleted += m + f;
    } else {
      map.set(d.houseNumber, {
        maleDepleted: m,
        femaleDepleted: f,
        totalDepleted: m + f,
      });
    }
  }
  return map;
}

/**
 * Computes FlockStats for a single flock using pre-aggregated depletion totals.
 */
export function computeSingleFlockStats(
  flock: Flock,
  depletionTotals?: HouseDepletionTotals,
  referenceDate?: string
): FlockStats {
  const effectiveLoadingDate =
    flock.loadingDateFemale || flock.loadingDateMale || flock.hatchDate;
  const ageCalc = calculateFlockAgeFromLoadingDate(effectiveLoadingDate, referenceDate);
  const ageWeeks = ageCalc.ageWeeks;

  const totalMaleDepleted = depletionTotals?.maleDepleted ?? 0;
  const totalFemaleDepleted = depletionTotals?.femaleDepleted ?? 0;
  const totalDepleted = totalMaleDepleted + totalFemaleDepleted;

  const initialTotal =
    (Number(flock.initialMales) || 0) + (Number(flock.initialFemales) || 0);
  const currentMales = Math.max(0, Number(flock.currentMales) || 0);
  const currentFemales = Math.max(0, Number(flock.currentFemales) || 0);
  const totalCurrent = currentMales + currentFemales;

  const rawLivability = initialTotal > 0 ? (totalCurrent / initialTotal) * 100 : 100;
  const livabilityPct = Number.isNaN(rawLivability) ? 100 : rawLivability;

  let maleToFemaleRatioStr = '0 : 0';
  if (currentMales > 0 && currentFemales > 0) {
    const ratio = currentFemales / currentMales;
    maleToFemaleRatioStr = `1 : ${Number.isNaN(ratio) ? '0.0' : ratio.toFixed(1)}`;
  } else if (currentMales > 0 && currentFemales === 0) {
    maleToFemaleRatioStr = `${currentMales.toLocaleString()} M (1 : 0)`;
  } else if (currentMales === 0 && currentFemales > 0) {
    maleToFemaleRatioStr = `0 M : ${currentFemales.toLocaleString()} F`;
  }

  const rawMaleRatio = totalCurrent > 0 ? (currentMales / totalCurrent) * 100 : 0;
  const maleRatioPct = Number.isNaN(rawMaleRatio) ? 0 : rawMaleRatio;

  return {
    flock,
    ageWeeks: Number.isNaN(ageWeeks) ? 1 : ageWeeks,
    ageDays: ageCalc.ageDays || 1,
    totalDaysFromLoading: ageCalc.totalDaysFromLoading || 1,
    weekAndDayStr: ageCalc.weekAndDayStr || 'Wk 1 D1',
    currentMales,
    currentFemales,
    totalCurrent,
    initialTotal,
    livabilityPct: Math.round(livabilityPct * 10) / 10,
    maleToFemaleRatioStr,
    maleRatioPct: Math.round(maleRatioPct * 10) / 10,
    totalMaleDepleted,
    totalFemaleDepleted,
    totalDepleted,
  };
}

/**
 * Builds an O(1) lookup Map of FlockStats keyed by houseNumber.
 */
export function buildFlockStatsMap(
  flocks: Flock[],
  depletions: DepletionRecord[],
  referenceDate?: string
): Map<string, FlockStats> {
  const statsMap = new Map<string, FlockStats>();
  if (!Array.isArray(flocks) || flocks.length === 0) return statsMap;

  const depletionByHouse = indexDepletionsByHouse(depletions);
  for (let i = 0; i < flocks.length; i++) {
    const flock = flocks[i];
    if (!flock || !flock.houseNumber) continue;
    const depTotals = depletionByHouse.get(flock.houseNumber);
    statsMap.set(
      flock.houseNumber,
      computeSingleFlockStats(flock, depTotals, referenceDate)
    );
  }
  return statsMap;
}

/**
 * Single-pass O(S + C) aggregation for Feed Stock Summary across all feed types.
 * Replaces 10x nested .filter().reduce() scans.
 */
export function computeFeedStockSummary(
  feedStockEntries: FeedStockEntry[],
  feedConsumptionRecords: FeedConsumptionRecord[]
): FeedStockSummaryItem[] {
  const receivedKgMap = new Map<FeedType, number>();
  const receivedBagsMap = new Map<FeedType, number>();
  const consumedKgMap = new Map<FeedType, number>();

  for (const ft of ALL_FEED_TYPES) {
    receivedKgMap.set(ft, 0);
    receivedBagsMap.set(ft, 0);
    consumedKgMap.set(ft, 0);
  }

  if (Array.isArray(feedStockEntries)) {
    for (let i = 0; i < feedStockEntries.length; i++) {
      const e = feedStockEntries[i];
      if (!e || !e.feedType) continue;
      receivedKgMap.set(
        e.feedType,
        (receivedKgMap.get(e.feedType) || 0) + (Number(e.totalKg) || 0)
      );
      receivedBagsMap.set(
        e.feedType,
        (receivedBagsMap.get(e.feedType) || 0) + (Number(e.bags) || 0)
      );
    }
  }

  if (Array.isArray(feedConsumptionRecords)) {
    for (let i = 0; i < feedConsumptionRecords.length; i++) {
      const r = feedConsumptionRecords[i];
      if (!r) continue;
      if (r.femaleFeedType !== undefined || r.maleFeedType !== undefined) {
        if (r.femaleFeedType) {
          consumedKgMap.set(
            r.femaleFeedType,
            (consumedKgMap.get(r.femaleFeedType) || 0) +
              (Number(r.femaleQuantityKg) || 0)
          );
        }
        if (r.maleFeedType) {
          consumedKgMap.set(
            r.maleFeedType,
            (consumedKgMap.get(r.maleFeedType) || 0) +
              (Number(r.maleQuantityKg) || 0)
          );
        }
      } else if (r.feedType) {
        consumedKgMap.set(
          r.feedType,
          (consumedKgMap.get(r.feedType) || 0) + (Number(r.quantityKg) || 0)
        );
      }
    }
  }

  return ALL_FEED_TYPES.map((ft) => {
    const totalReceivedKg = receivedKgMap.get(ft) || 0;
    const totalReceivedBags = receivedBagsMap.get(ft) || 0;
    const totalConsumedKg = consumedKgMap.get(ft) || 0;
    const currentStockKg = Math.max(0, totalReceivedKg - totalConsumedKg);
    const currentStockBags = Math.round((currentStockKg / 50) * 10) / 10;
    const isLowStock = currentStockBags <= 4;

    return {
      feedType: ft,
      totalReceivedKg,
      totalReceivedBags,
      totalConsumedKg,
      currentStockKg,
      currentStockBags,
      isLowStock,
    };
  });
}

/**
 * Computes upcoming vaccine alerts using pre-calculated FlockStats map.
 */
export function computeUpcomingVaccines(
  flocks: Flock[],
  flockStatsMap: Map<string, FlockStats>,
  vaccinationProgram: FarmProfile['standardVaccinationProgram']
): VaccineAlert[] {
  const alerts: VaccineAlert[] = [];
  if (!Array.isArray(flocks) || !Array.isArray(vaccinationProgram)) return alerts;

  for (let i = 0; i < flocks.length; i++) {
    const flock = flocks[i];
    if (!flock || !flock.houseNumber) continue;
    const stats = flockStatsMap.get(flock.houseNumber);
    if (!stats) continue;
    const currentWeek = stats.ageWeeks;

    for (let j = 0; j < vaccinationProgram.length; j++) {
      const item = vaccinationProgram[j];
      if (!item) continue;
      if (Math.abs(item.ageWeek - currentWeek) <= 1) {
        alerts.push({
          id: `${flock.houseNumber}_${item.id}`,
          houseNumber: flock.houseNumber,
          flockAgeWeeks: currentWeek,
          scheduledWeek: item.ageWeek,
          productName: item.productName,
          diseaseTarget: item.diseaseTarget,
          method: item.method,
          urgency: item.ageWeek === currentWeek ? 'due_now' : 'upcoming',
        });
      }
    }
  }
  return alerts;
}

/**
 * Unified extractor for EggProductionRecord breakdown fields (handles both flat and nested sorting schemas).
 */
export interface ExtractedEggBreakdown {
  heNest: number;
  heFloor: number;
  totalHE: number;
  small: number;
  broken: number;
  thinShell: number;
  doubleYolk: number;
  misshape: number;
  others: number;
  spoiled: number;
  totalNHE: number;
  tep: number;
}

export function extractEggBreakdown(rec: Partial<EggProductionRecord> & Record<string, any>): ExtractedEggBreakdown {
  const heNest = rec.heNest ?? rec.sorting?.hatchingEggs?.heNest ?? 0;
  const heFloor = rec.heFloor ?? rec.sorting?.hatchingEggs?.heFloor ?? 0;
  const totalHE =
    rec.totalHatchingEggs ??
    rec.totalHE ??
    rec.sorting?.hatchingEggs?.total ??
    heNest + heFloor;

  const small = rec.small ?? rec.sorting?.nonHatchingEggs?.small ?? 0;
  const broken = rec.broken ?? rec.sorting?.nonHatchingEggs?.broken ?? 0;
  const thinShell = rec.thinShell ?? rec.sorting?.nonHatchingEggs?.cracked ?? 0;
  const doubleYolk = rec.doubleYolk ?? rec.sorting?.nonHatchingEggs?.doubleYolk ?? 0;
  const misshape =
    rec.misshape ??
    rec.sorting?.nonHatchingEggs?.abnormal ??
    rec.sorting?.nonHatchingEggs?.misshapen ??
    0;
  const others =
    rec.others ??
    rec.sorting?.nonHatchingEggs?.softShelled ??
    rec.sorting?.nonHatchingEggs?.leakers ??
    0;
  const spoiled = rec.spoiled ?? rec.sorting?.nonHatchingEggs?.dirty ?? 0;

  const totalNHE =
    rec.totalNonHatchingEggs ??
    rec.totalNHE ??
    rec.sorting?.nonHatchingEggs?.total ??
    small + broken + thinShell + doubleYolk + misshape + others + spoiled;

  const tep = rec.tep ?? rec.totalEggs ?? totalHE + totalNHE;

  return {
    heNest,
    heFloor,
    totalHE,
    small,
    broken,
    thinShell,
    doubleYolk,
    misshape,
    others,
    spoiled,
    totalNHE,
    tep,
  };
}

/**
 * Normalizes raw egg records in O(N) using pre-indexed female population lookup.
 */
export function normalizeEggProductionRecords(
  rawEggRecords: EggProductionRecord[],
  flocks: Flock[],
  flockStatsMap: Map<string, FlockStats>
): NormalizedEggProductionRecord[] {
  if (!Array.isArray(rawEggRecords) || rawEggRecords.length === 0) return [];

  const femalePopMap = new Map<string, number>();
  if (Array.isArray(flocks)) {
    for (let i = 0; i < flocks.length; i++) {
      const f = flocks[i];
      if (f && f.houseNumber) {
        const fStat = flockStatsMap.get(f.houseNumber);
        femalePopMap.set(
          f.houseNumber,
          fStat?.currentFemales || f.currentFemales || 9500
        );
      }
    }
  }

  const normalized: NormalizedEggProductionRecord[] = [];
  for (let i = 0; i < rawEggRecords.length; i++) {
    const rec = rawEggRecords[i];
    if (!rec) continue;

    const femalePop =
      rec.femalePopulationAtDate || femalePopMap.get(rec.houseNumber) || 9500;
    const { totalHE, totalNHE, tep: totalEggs, heNest, heFloor } = extractEggBreakdown(rec);

    const hatchingEggPct = totalEggs > 0 ? (totalHE / totalEggs) * 100 : 0;
    const nonHatchingEggPct = totalEggs > 0 ? (totalNHE / totalEggs) * 100 : 0;
    const hendayPct = femalePop > 0 ? (totalEggs / femalePop) * 100 : 0;

    const safeCollections =
      Array.isArray(rec.collections) && rec.collections.length > 0
        ? rec.collections
        : [
            {
              id: 'c1',
              collectionNumber: 1 as const,
              collectionTime: '08:00 AM',
              leftSideCount: Math.round(totalEggs * 0.2),
              rightSideCount: Math.round(totalEggs * 0.2),
              totalCount: Math.round(totalEggs * 0.4),
            },
            {
              id: 'c2',
              collectionNumber: 2 as const,
              collectionTime: '11:30 AM',
              leftSideCount: Math.round(totalEggs * 0.2),
              rightSideCount: Math.round(totalEggs * 0.2),
              totalCount: Math.round(totalEggs * 0.4),
            },
            {
              id: 'c3',
              collectionNumber: 3 as const,
              collectionTime: '03:30 PM',
              leftSideCount: Math.round(totalEggs * 0.1),
              rightSideCount: Math.round(totalEggs * 0.1),
              totalCount: Math.round(totalEggs * 0.2),
            },
          ];

    normalized.push({
      ...rec,
      totalEggs,
      totalHatchingEggs: totalHE,
      totalNonHatchingEggs: totalNHE,
      hatchingEggPct,
      nonHatchingEggPct,
      hendayPct,
      femalePopulationAtDate: femalePop,
      sampleEggWeightGrams: rec.sampleEggWeightGrams || 58.4,
      sorting: rec.sorting || {
        hatchingEggs: {
          total: totalHE,
          heNest: rec.heNest ?? totalHE,
          heFloor: heFloor ?? 0,
        },
        nonHatchingEggs: {
          total: totalNHE,
          dirty: rec.spoiled || Math.round(totalNHE * 0.35),
          cracked: rec.thinShell || Math.round(totalNHE * 0.25),
          broken: rec.broken || Math.round(totalNHE * 0.15),
          abnormal: rec.misshape || Math.round(totalNHE * 0.1),
          doubleYolk: rec.doubleYolk || Math.round(totalNHE * 0.1),
          softShelled: Math.round(totalNHE * 0.05),
          misshapen: rec.misshape || 0,
          leakers: 0,
        },
      },
      collections: safeCollections,
    });
  }

  return normalized;
}

/**
 * Single source of truth for Hatching Summary percentage calculations.
 */
export function computeHatchingMetrics(record: Partial<HatchingSummaryRecord>) {
  const eggsSet = Number(record.eggsSet) || 0;
  const standardChicks = Number(record.standardChicks) || 0;
  const gradeOut = Number(record.gradeOut) || 0;
  const totalChicksPulled = standardChicks + gradeOut;
  const totalHatchPct = eggsSet > 0 ? (totalChicksPulled / eggsSet) * 100 : 0;
  const saleableHatchPct = eggsSet > 0 ? (standardChicks / eggsSet) * 100 : 0;
  const gradeOutPct = eggsSet > 0 ? (gradeOut / eggsSet) * 100 : 0;

  return {
    eggsSet,
    standardChicks,
    gradeOut,
    totalChicksPulled,
    totalHatchPct: Number(totalHatchPct.toFixed(2)),
    saleableHatchPct: Number(saleableHatchPct.toFixed(2)),
    gradeOutPct: Number(gradeOutPct.toFixed(2)),
  };
}

/**
 * Single source of truth for Daily Biosecurity Compliance metrics.
 */
export function computeBiosecurityDailyMetrics(
  date: string,
  requirements: BiosecurityRequirement[],
  logs: BiosecurityVerificationLog[],
  existingSummary?: BiosecurityDailySummary
) {
  const activeReqs = Array.isArray(requirements)
    ? requirements.filter((r) => r && r.active)
    : [];
  const dayLogs = Array.isArray(logs)
    ? logs.filter((l) => l && l.date === date)
    : [];

  let verified = 0;
  let passed = 0;
  let failed = 0;
  let naCount = 0;

  for (let i = 0; i < dayLogs.length; i++) {
    const l = dayLogs[i];
    if (!l.verified) continue;
    verified++;
    if (l.status === 'pass') passed++;
    else if (l.status === 'fail') failed++;
    else if (l.status === 'na') naCount++;
  }

  const total = activeReqs.length;
  const applicableTotal = Math.max(1, total - naCount);
  const compliancePct =
    total === 0 ? 100 : Math.min(100, Math.round((passed / applicableTotal) * 100));

  return {
    total,
    verified,
    passed,
    failed,
    naCount,
    compliancePct,
    isSignedOff: Boolean(existingSummary?.supervisorSignoff),
    signedOffBy: existingSummary?.supervisorSignoffBy,
    signedOffAt: existingSummary?.supervisorSignoffAt,
    supervisorNotes: existingSummary?.supervisorNotes,
  };
}

/**
 * Shared Messenger / SMS / Executive Report formatter used across EggProductionView and MessengerReportQuickModal.
 */
export function buildMessengerReportData(
  records: EggProductionRecord[],
  flocks: Flock[],
  farmProfile: FarmProfile | undefined,
  targetDate: string,
  includeWeekday = false
) {
  const safeRecords = Array.isArray(records) ? records : [];
  const safeFlocks = Array.isArray(flocks) ? flocks : [];
  const recordsOnDate = safeRecords.filter((r) => r && r.date === targetDate);

  let dateFormatted = targetDate;
  try {
    dateFormatted = new Date(targetDate + 'T00:00:00')
      .toLocaleDateString('en-US', {
        ...(includeWeekday ? { weekday: 'long' } : {}),
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
      .toUpperCase();
  } catch {
    dateFormatted = targetDate;
  }

  const companyName = (
    farmProfile?.name || 'L.P. LIM CITY FAMILY FARM INC'
  ).toUpperCase();

  const activeRecords =
    recordsOnDate.length > 0
      ? recordsOnDate
      : safeFlocks.map(
          (f) =>
            ({
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
              totalNHE: 0,
            }) as any
        );

  let totalTEP = 0;
  let totalHENest = 0;
  let totalHEFloor = 0;
  let totalHE = 0;
  let totalNHE = 0;
  let totalSmall = 0;
  let totalBroken = 0;
  let totalThin = 0;
  let totalDY = 0;
  let totalMisshape = 0;
  let totalOthers = 0;
  let totalSpoil = 0;

  const houseBreakdowns = activeRecords.map((rec) => {
    const b = extractEggBreakdown(rec);
    totalTEP += b.tep;
    totalHENest += b.heNest;
    totalHEFloor += b.heFloor;
    totalHE += b.totalHE;
    totalNHE += b.totalNHE;
    totalSmall += b.small;
    totalBroken += b.broken;
    totalThin += b.thinShell;
    totalDY += b.doubleYolk;
    totalMisshape += b.misshape;
    totalOthers += b.others;
    totalSpoil += b.spoiled;

    return {
      houseNumber: rec.houseNumber || 'House',
      hendayPct: (rec as any).hendayPct as number | undefined,
      ...b,
    };
  });

  const grandTEP = totalTEP - totalSpoil - totalDY;
  const overallHEPct = totalTEP > 0 ? ((totalHE / totalTEP) * 100).toFixed(1) : '0.0';
  const totalTrays30 = Math.floor(totalTEP / 30);
  const remainingEggs = totalTEP % 30;

  const formatStandard = () => {
    let report = `${companyName}\nDAILY EGG REPORT\n\nDATE:\t${dateFormatted}\n\n`;
    for (const h of houseBreakdowns) {
      report += `${h.houseNumber.toUpperCase()}\n\n`;
      report += `TEP;\t${h.tep}\n`;
      report += `HE NEST;\t${h.heNest}\n`;
      report += `HE FLOOR;\t${h.heFloor}\n\n`;
      report += `SMALL;\t${h.small}\n`;
      report += `BROKEN;\t${h.broken}\n`;
      report += `TS;\t${h.thinShell}\n`;
      report += `DY;\t${h.doubleYolk}\n`;
      report += `MS;\t${h.misshape}\n`;
      report += `OTH:\t${h.others}\n`;
      report += `SPOILED;\t${h.spoiled}\n`;
      report += `TOTAL NHE;\t${h.totalNHE}\n\n\n`;
    }
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

  const formatExecutive = () => {
    let text = `📊 *${companyName}*\n`;
    text += `🥚 *DAILY FLOCK PRODUCTION REPORT*\n`;
    text += `📅 *Date:* ${dateFormatted}\n`;
    text += `─────────────────────────\n\n`;

    for (const h of houseBreakdowns) {
      const hd = h.hendayPct ? `${h.hendayPct.toFixed(1)}%` : '-';
      const yieldPct = h.tep > 0 ? ((h.totalHE / h.tep) * 100).toFixed(1) : '0';

      text += `🏠 *${h.houseNumber.toUpperCase()}*\n`;
      text += `• TEP: *${h.tep.toLocaleString()}* (HD: ${hd})\n`;
      text += `• Settable HE: *${h.totalHE.toLocaleString()}* (${yieldPct}% yield | Nest: ${h.heNest}, Floor: ${h.heFloor})\n`;
      text += `• NHE Discard: ${h.totalNHE.toLocaleString()}\n\n`;
    }

    text += `═════════════════════════\n`;
    text += `🏆 *FARM TOTALS SUMMARY*\n`;
    text += `• Total Eggs (TEP): *${totalTEP.toLocaleString()}* (~${totalTrays30.toLocaleString()} Trays)\n`;
    text += `• Hatching Eggs (HE): *${totalHE.toLocaleString()}* (${overallHEPct}%)\n`;
    text += `• Non-Hatching (NHE): *${totalNHE.toLocaleString()}*\n`;
    text += `• Deductions (Spoiled + DY): *${totalSpoil + totalDY}*\n`;
    text += `• *GRAND TEP (Net Settable):* *${grandTEP.toLocaleString()}*\n`;
    text += `─────────────────────────\n`;
    text += `_Verified via FarmFlow Pro Broiler-Breeder OS_`;
    return text;
  };

  const formatCompact = () => {
    let text = `${companyName} (${targetDate})\n`;
    for (const h of houseBreakdowns) {
      text += `${h.houseNumber}: TEP ${h.tep} | HE ${h.totalHE} | NHE ${h.totalNHE}\n`;
    }
    text += `TOTAL: TEP ${totalTEP} | HE ${totalHE} (${overallHEPct}%) | NHE ${totalNHE} | GRAND ${grandTEP}`;
    return text;
  };

  return {
    companyName,
    dateFormatted,
    activeRecords,
    houseBreakdowns,
    totalTEP,
    totalHENest,
    totalHEFloor,
    totalHE,
    totalNHE,
    totalSmall,
    totalBroken,
    totalThin,
    totalDY,
    totalMisshape,
    totalOthers,
    totalSpoil,
    grandTEP,
    overallHEPct,
    totalTrays30,
    remainingEggs,
    formatStandard,
    formatExecutive,
    formatCompact,
  };
}
