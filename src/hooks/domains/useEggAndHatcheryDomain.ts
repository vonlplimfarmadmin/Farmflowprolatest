import React, { useMemo, useCallback } from 'react';
import {
  EggProductionRecord,
  WeeklyEggWeightRecord,
  DeliveryRecord,
  HatchingSummaryRecord,
  Flock,
  UserAccount,
  SystemLog,
} from '../../types';
import {
  FlockStats,
  NormalizedEggProductionRecord,
  normalizeEggProductionRecords,
  computeHatchingMetrics,
} from '../../utils/farmCalculations';

interface UseEggAndHatcheryDomainParams {
  currentUser: UserAccount | null;
  flocks: Flock[];
  flockStatsByHouseMap: Map<string, FlockStats>;
  getFlockStats: (houseNumber: string, referenceDate?: string) => FlockStats | null;
  rawEggRecords: EggProductionRecord[];
  setRawEggRecords: React.Dispatch<React.SetStateAction<EggProductionRecord[]>>;
  weeklyEggWeights: WeeklyEggWeightRecord[];
  setWeeklyEggWeights: React.Dispatch<React.SetStateAction<WeeklyEggWeightRecord[]>>;
  deliveries: DeliveryRecord[];
  setDeliveries: React.Dispatch<React.SetStateAction<DeliveryRecord[]>>;
  hatchingSummaries: HatchingSummaryRecord[];
  setHatchingSummaries: React.Dispatch<React.SetStateAction<HatchingSummaryRecord[]>>;
  saveDocToFirestore: (collectionName: string, docId: string, data: any) => void;
  deleteDocFromFirestore: (collectionName: string, docId: string) => void;
  logAction: (
    action: string,
    category: SystemLog['category'],
    details: string,
    houseNumber?: string
  ) => void;
}

export function useEggAndHatcheryDomain({
  currentUser,
  flocks,
  flockStatsByHouseMap,
  getFlockStats,
  rawEggRecords,
  setRawEggRecords,
  weeklyEggWeights,
  setWeeklyEggWeights,
  deliveries,
  setDeliveries,
  hatchingSummaries,
  setHatchingSummaries,
  saveDocToFirestore,
  deleteDocFromFirestore,
  logAction,
}: UseEggAndHatcheryDomainParams) {
  const eggProductionRecords: NormalizedEggProductionRecord[] = useMemo(
    () => normalizeEggProductionRecords(rawEggRecords, flocks, flockStatsByHouseMap),
    [rawEggRecords, flocks, flockStatsByHouseMap]
  );

  const addEggProductionRecord = useCallback(
    (record: Partial<EggProductionRecord> & { houseNumber: string; date: string }) => {
      const fStat = getFlockStats(record.houseNumber);
      const femalePop = record.femalePopulationAtDate || fStat?.currentFemales || 9500;

      let he = (record.heNest || 0) + (record.heFloor || 0);
      if (record.sorting?.hatchingEggs?.total) he = record.sorting.hatchingEggs.total;

      let nhe =
        (record.small || 0) +
        (record.thinShell || 0) +
        (record.misshape || 0) +
        (record.doubleYolk || 0) +
        (record.broken || 0) +
        (record.spoiled || 0) +
        (record.others || 0);
      if (record.sorting?.nonHatchingEggs?.total) nhe = record.sorting.nonHatchingEggs.total;

      const tep = he + nhe;

      const newRecord: EggProductionRecord = {
        ...record,
        id: 'ep_' + Date.now(),
        heNest: record.heNest ?? he,
        heFloor: record.heFloor ?? 0,
        totalHE: he,
        totalNHE: nhe,
        tep,
        femalePopulationAtDate: femalePop,
        sampleEggWeightGrams: record.sampleEggWeightGrams || 58.4,
        loggedBy: currentUser?.fullName || 'Staff',
        createdAt: new Date().toISOString(),
      };

      setRawEggRecords(prev => [newRecord, ...prev]);
      saveDocToFirestore('eggRecords', newRecord.id, newRecord);

      logAction(
        'LOG_EGG_PRODUCTION',
        'egg_prod',
        `Recorded Egg Production in ${record.houseNumber} on ${record.date} (TEP: ${tep}, HE: ${he}, NHE: ${nhe}).`,
        record.houseNumber
      );
    },
    [getFlockStats, currentUser, setRawEggRecords, saveDocToFirestore, logAction]
  );

  const updateEggProductionRecord = useCallback(
    (id: string, updates: Partial<EggProductionRecord>) => {
      let updatedDoc: EggProductionRecord | undefined;
      setRawEggRecords(prev =>
        prev.map(r => {
          if (r.id === id) {
            const next = { ...r, ...updates, updatedAt: new Date().toISOString() };
            updatedDoc = next;
            return next;
          }
          return r;
        })
      );
      if (updatedDoc) {
        saveDocToFirestore('eggRecords', id, updatedDoc);
        logAction('UPDATE_EGG_PRODUCTION', 'egg_prod', `Updated egg production record ID ${id}.`);
      }
    },
    [setRawEggRecords, saveDocToFirestore, logAction]
  );

  const deleteEggProductionRecord = useCallback(
    (id: string) => {
      setRawEggRecords(prev => prev.filter(r => r.id !== id));
      deleteDocFromFirestore('eggRecords', id);
      logAction('DELETE_EGG_PRODUCTION', 'egg_prod', `Deleted egg production record ID ${id}.`);
    },
    [setRawEggRecords, deleteDocFromFirestore, logAction]
  );

  const addWeeklyEggWeight = useCallback(
    (record: Omit<WeeklyEggWeightRecord, 'id' | 'createdAt' | 'loggedBy'>) => {
      const newRecord: WeeklyEggWeightRecord = {
        ...record,
        id: 'wew_' + Date.now(),
        loggedBy: currentUser?.fullName || 'Staff',
        createdAt: new Date().toISOString(),
      };
      setWeeklyEggWeights(prev => [newRecord, ...prev]);
      saveDocToFirestore('weeklyEggWeights', newRecord.id, newRecord);
      logAction(
        'LOG_EGG_WEIGHT',
        'egg_prod',
        `Recorded weekly egg weight for ${record.houseNumber}: ${record.weightGrams}g at Prod Wk ${record.ageInProductionWeeks}.`,
        record.houseNumber
      );
    },
    [currentUser, setWeeklyEggWeights, saveDocToFirestore, logAction]
  );

  const deleteWeeklyEggWeight = useCallback(
    (id: string) => {
      setWeeklyEggWeights(prev => prev.filter(w => w.id !== id));
      deleteDocFromFirestore('weeklyEggWeights', id);
      logAction('DELETE_EGG_WEIGHT', 'egg_prod', `Deleted weekly egg weight record ID ${id}.`);
    },
    [setWeeklyEggWeights, deleteDocFromFirestore, logAction]
  );

  const addDelivery = useCallback(
    (record: Omit<DeliveryRecord, 'id' | 'createdAt'>): DeliveryRecord => {
      const id = 'del_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newDelivery: DeliveryRecord = {
        ...record,
        id,
        createdAt: new Date().toISOString(),
      };
      setDeliveries(prev => [newDelivery, ...prev]);
      saveDocToFirestore('deliveries', newDelivery.id, newDelivery);
      logAction(
        'ADD_DELIVERY',
        'egg_prod',
        `Created ESRRR delivery record #${newDelivery.esrrrNumber} for date ${newDelivery.productionDate} (${newDelivery.totalEggsReceived.toLocaleString()} total eggs).`
      );
      return newDelivery;
    },
    [setDeliveries, saveDocToFirestore, logAction]
  );

  const updateDelivery = useCallback(
    (id: string, updates: Partial<DeliveryRecord>) => {
      const existing = deliveries.find(d => d.id === id);
      if (!existing) return;
      const updated: DeliveryRecord = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      setDeliveries(prev => prev.map(d => (d.id === id ? updated : d)));
      saveDocToFirestore('deliveries', id, updated);
      logAction('UPDATE_DELIVERY', 'egg_prod', `Updated ESRRR delivery #${updated.esrrrNumber}.`);
    },
    [deliveries, setDeliveries, saveDocToFirestore, logAction]
  );

  const deleteDelivery = useCallback(
    (id: string) => {
      const target = deliveries.find(d => d.id === id);
      setDeliveries(prev => prev.filter(d => d.id !== id));
      deleteDocFromFirestore('deliveries', id);
      logAction(
        'DELETE_DELIVERY',
        'egg_prod',
        `Deleted ESRRR delivery record #${target?.esrrrNumber || id}.`
      );
    },
    [deliveries, setDeliveries, deleteDocFromFirestore, logAction]
  );

  const getDeliveryById = useCallback(
    (id: string): DeliveryRecord | undefined => {
      return deliveries.find(d => d.id === id);
    },
    [deliveries]
  );

  const addHatchingSummary = useCallback(
    (record: Omit<HatchingSummaryRecord, 'id' | 'createdAt'>): HatchingSummaryRecord => {
      const id = 'hatch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const metrics = computeHatchingMetrics(record);

      const newRecord: HatchingSummaryRecord = {
        ...record,
        ...metrics,
        id,
        createdAt: new Date().toISOString(),
      };

      setHatchingSummaries(prev => [newRecord, ...prev]);
      saveDocToFirestore('hatchingSummaries', newRecord.id, newRecord);
      logAction(
        'ADD_HATCHING_SUMMARY',
        'egg_prod',
        `Created Hatching Summary for House ${newRecord.houseNumber} (${metrics.eggsSet.toLocaleString()} eggs set, ${newRecord.saleableHatchPct}% saleable hatch).`
      );
      return newRecord;
    },
    [setHatchingSummaries, saveDocToFirestore, logAction]
  );

  const updateHatchingSummary = useCallback(
    (id: string, updates: Partial<HatchingSummaryRecord>) => {
      const existing = hatchingSummaries.find(h => h.id === id);
      if (!existing) return;
      const merged = { ...existing, ...updates };
      const metrics = computeHatchingMetrics(merged);
      const updated: HatchingSummaryRecord = {
        ...merged,
        ...metrics,
        updatedAt: new Date().toISOString(),
      };
      setHatchingSummaries(prev => prev.map(h => (h.id === id ? updated : h)));
      saveDocToFirestore('hatchingSummaries', updated.id, updated);
      logAction(
        'UPDATE_HATCHING_SUMMARY',
        'egg_prod',
        `Updated Hatching Summary for House ${updated.houseNumber}.`
      );
    },
    [hatchingSummaries, setHatchingSummaries, saveDocToFirestore, logAction]
  );

  const deleteHatchingSummary = useCallback(
    (id: string) => {
      const target = hatchingSummaries.find(h => h.id === id);
      setHatchingSummaries(prev => prev.filter(h => h.id !== id));
      deleteDocFromFirestore('hatchingSummaries', id);
      logAction(
        'DELETE_HATCHING_SUMMARY',
        'egg_prod',
        `Deleted Hatching Summary for House ${target?.houseNumber || id} (Setting Date: ${target?.settingDate || 'N/A'}).`
      );
    },
    [hatchingSummaries, setHatchingSummaries, deleteDocFromFirestore, logAction]
  );

  const getHatchingSummaryById = useCallback(
    (id: string): HatchingSummaryRecord | undefined => {
      return hatchingSummaries.find(h => h.id === id);
    },
    [hatchingSummaries]
  );

  return {
    eggProductionRecords,
    addEggProductionRecord,
    updateEggProductionRecord,
    deleteEggProductionRecord,
    addWeeklyEggWeight,
    deleteWeeklyEggWeight,
    addDelivery,
    updateDelivery,
    deleteDelivery,
    getDeliveryById,
    addHatchingSummary,
    updateHatchingSummary,
    deleteHatchingSummary,
    getHatchingSummaryById,
  };
}
