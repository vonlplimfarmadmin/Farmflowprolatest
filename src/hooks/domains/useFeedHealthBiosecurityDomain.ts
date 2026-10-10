import React, { useMemo, useCallback } from 'react';
import {
  FeedStockEntry,
  FeedConsumptionRecord,
  MedProduct,
  MedStockLog,
  MedAdministrationRecord,
  BiosecurityRequirement,
  BiosecurityVerificationLog,
  BiosecurityDailySummary,
  BiosecurityStatus,
  Flock,
  FarmProfile,
  UserAccount,
  SystemLog,
} from '../../types';
import {
  FlockStats,
  FeedStockSummaryItem,
  VaccineAlert,
  computeFeedStockSummary,
  computeUpcomingVaccines,
  computeBiosecurityDailyMetrics,
} from '../../utils/farmCalculations';
import { saveDocsBatchToMongoDB } from '../../services/mongodbSync';

interface UseFeedHealthBiosecurityDomainParams {
  currentUser: UserAccount | null;
  flocks: Flock[];
  flockStatsByHouseMap: Map<string, FlockStats>;
  farmProfile: FarmProfile;
  feedStockEntries: FeedStockEntry[];
  setFeedStockEntries: React.Dispatch<React.SetStateAction<FeedStockEntry[]>>;
  feedConsumptionRecords: FeedConsumptionRecord[];
  setFeedConsumptionRecords: React.Dispatch<React.SetStateAction<FeedConsumptionRecord[]>>;
  medProducts: MedProduct[];
  setMedProducts: React.Dispatch<React.SetStateAction<MedProduct[]>>;
  medStockLogs: MedStockLog[];
  setMedStockLogs: React.Dispatch<React.SetStateAction<MedStockLog[]>>;
  medAdministrations: MedAdministrationRecord[];
  setMedAdministrations: React.Dispatch<React.SetStateAction<MedAdministrationRecord[]>>;
  biosecurityRequirements: BiosecurityRequirement[];
  setBiosecurityRequirements: React.Dispatch<React.SetStateAction<BiosecurityRequirement[]>>;
  biosecurityLogs: BiosecurityVerificationLog[];
  setBiosecurityLogs: React.Dispatch<React.SetStateAction<BiosecurityVerificationLog[]>>;
  biosecuritySummaries: Record<string, BiosecurityDailySummary>;
  setBiosecuritySummaries: React.Dispatch<
    React.SetStateAction<Record<string, BiosecurityDailySummary>>
  >;
  pendingWritesRef: React.MutableRefObject<number>;
  saveDocToFirestore: (collectionName: string, docId: string, data: any) => void;
  deleteDocFromFirestore: (collectionName: string, docId: string) => void;
  logAction: (
    action: string,
    category: SystemLog['category'],
    details: string,
    houseNumber?: string
  ) => void;
}

export function useFeedHealthBiosecurityDomain({
  currentUser,
  flocks,
  flockStatsByHouseMap,
  farmProfile,
  feedStockEntries,
  setFeedStockEntries,
  feedConsumptionRecords,
  setFeedConsumptionRecords,
  medProducts,
  setMedProducts,
  setMedStockLogs,
  medAdministrations,
  setMedAdministrations,
  biosecurityRequirements,
  setBiosecurityRequirements,
  biosecurityLogs,
  setBiosecurityLogs,
  biosecuritySummaries,
  setBiosecuritySummaries,
  pendingWritesRef,
  saveDocToFirestore,
  deleteDocFromFirestore,
  logAction,
}: UseFeedHealthBiosecurityDomainParams) {
  // Feed Inventory Methods
  const addFeedStock = useCallback(
    (entry: Omit<FeedStockEntry, 'id' | 'totalKg' | 'createdAt'>) => {
      const kgPerBag = entry.kgPerBag || 50;
      const totalKg = entry.bags * kgPerBag;
      const newEntry: FeedStockEntry = {
        ...entry,
        id: 'fs_' + Date.now(),
        kgPerBag,
        totalKg,
        createdAt: new Date().toISOString(),
      };
      setFeedStockEntries(prev => [newEntry, ...prev]);
      saveDocToFirestore('feedStock', newEntry.id, newEntry);
      logAction(
        'ADD_FEED_STOCK',
        'feed',
        `Received ${entry.bags} bags (${totalKg} kg) of ${entry.feedType}.`
      );
    },
    [setFeedStockEntries, saveDocToFirestore, logAction]
  );

  const deleteFeedStock = useCallback(
    (id: string) => {
      setFeedStockEntries(prev => prev.filter(e => e.id !== id));
      deleteDocFromFirestore('feedStock', id);
      logAction('DELETE_FEED_STOCK', 'feed', `Deleted feed stock entry ID ${id}.`);
    },
    [setFeedStockEntries, deleteDocFromFirestore, logAction]
  );

  const addFeedConsumption = useCallback(
    (record: Omit<FeedConsumptionRecord, 'id' | 'createdAt' | 'loggedBy'>) => {
      const femaleKg = record.femaleQuantityKg ?? 0;
      const maleKg = record.maleQuantityKg ?? 0;
      const totalKg =
        record.femaleQuantityKg !== undefined || record.maleQuantityKg !== undefined
          ? femaleKg + maleKg
          : record.quantityKg;

      const primaryFeedType =
        record.feedType || record.femaleFeedType || record.maleFeedType || 'BLC 1';

      const newRecord: FeedConsumptionRecord = {
        ...record,
        feedType: primaryFeedType,
        quantityKg: totalKg,
        id: 'fc_' + Date.now(),
        loggedBy: currentUser?.fullName || 'Staff',
        createdAt: new Date().toISOString(),
      };
      setFeedConsumptionRecords(prev => [newRecord, ...prev]);
      saveDocToFirestore('feedRecords', newRecord.id, newRecord);

      const descParts = [];
      if (record.femaleQuantityKg)
        descParts.push(
          `Females: ${record.femaleQuantityKg}kg (${record.femaleFeedType || primaryFeedType})`
        );
      if (record.maleQuantityKg)
        descParts.push(
          `Males: ${record.maleQuantityKg}kg (${record.maleFeedType || primaryFeedType})`
        );
      const desc =
        descParts.length > 0 ? descParts.join(', ') : `${totalKg}kg of ${primaryFeedType}`;

      logAction(
        'LOG_FEED_CONSUMPTION',
        'feed',
        `Logged feed in ${record.houseNumber} [Total ${totalKg} kg] - ${desc}.`,
        record.houseNumber
      );
    },
    [currentUser, setFeedConsumptionRecords, saveDocToFirestore, logAction]
  );

  const deleteFeedConsumption = useCallback(
    (id: string) => {
      setFeedConsumptionRecords(prev => prev.filter(r => r.id !== id));
      deleteDocFromFirestore('feedRecords', id);
      logAction('DELETE_FEED_CONSUMPTION', 'feed', `Deleted feed consumption record ID ${id}.`);
    },
    [setFeedConsumptionRecords, deleteDocFromFirestore, logAction]
  );

  const feedStockSummary = useMemo(
    () => computeFeedStockSummary(feedStockEntries, feedConsumptionRecords),
    [feedStockEntries, feedConsumptionRecords]
  );

  const lowStockAlerts = useMemo(
    () => feedStockSummary.filter(s => s.isLowStock),
    [feedStockSummary]
  );

  const getFeedStockSummary = useCallback((): FeedStockSummaryItem[] => {
    return feedStockSummary;
  }, [feedStockSummary]);

  const getLowStockAlerts = useCallback((): FeedStockSummaryItem[] => {
    return lowStockAlerts;
  }, [lowStockAlerts]);

  // Medicine & Vaccines Methods
  const addMedProduct = useCallback(
    (product: Omit<MedProduct, 'id'>) => {
      const newProduct: MedProduct = {
        ...product,
        id: 'med_' + Date.now(),
        currentStockUnits: product.currentStockUnits || product.currentStock || 0,
        currentStock: product.currentStockUnits || product.currentStock || 0,
      };
      setMedProducts(prev => [...prev, newProduct]);
      saveDocToFirestore('medProducts', newProduct.id, newProduct);
      logAction(
        'ADD_MED_PRODUCT',
        'medicine',
        `Registered new health product: ${product.name} (${product.type}).`
      );
    },
    [setMedProducts, saveDocToFirestore, logAction]
  );

  const addMedProductsBatch = useCallback(
    (products: Omit<MedProduct, 'id'>[], mergeExisting: boolean = false) => {
      if (!products || products.length === 0) return;

      const updatedList = [...medProducts];
      const docsToPersist: MedProduct[] = [];

      products.forEach((prod, idx) => {
        const existingIdx = mergeExisting
          ? updatedList.findIndex(
              p => p.name.trim().toLowerCase() === prod.name.trim().toLowerCase()
            )
          : -1;

        if (existingIdx >= 0) {
          const existing = updatedList[existingIdx];
          const newStockUnits =
            (existing.currentStockUnits || existing.currentStock || 0) +
            (prod.currentStockUnits || 0);
          const updatedItem: MedProduct = {
            ...existing,
            currentStockUnits: newStockUnits,
            currentStock: newStockUnits,
            manufacturer: prod.manufacturer || existing.manufacturer,
            expirationDate: prod.expirationDate || existing.expirationDate,
            dosage: prod.dosage || existing.dosage,
            dosesPerUnit: prod.dosesPerUnit || existing.dosesPerUnit,
            unitType: prod.unitType || existing.unitType,
          };
          updatedList[existingIdx] = updatedItem;
          docsToPersist.push(updatedItem);
        } else {
          const newId = `med_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`;
          const stock = prod.currentStockUnits ?? prod.currentStock ?? 0;
          const newItem: MedProduct = {
            ...prod,
            id: newId,
            currentStockUnits: stock,
            currentStock: stock,
          };
          updatedList.push(newItem);
          docsToPersist.push(newItem);
        }
      });

      setMedProducts(updatedList);
      pendingWritesRef.current += 1;
      saveDocsBatchToMongoDB('medProducts', docsToPersist).finally(() => {
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
      });

      logAction(
        'BATCH_ADD_MED_PRODUCTS',
        'medicine',
        `Batch imported ${products.length} health items into pharmacy stock.`
      );
    },
    [medProducts, setMedProducts, pendingWritesRef, logAction]
  );

  const updateMedProduct = useCallback(
    (id: string, updates: Partial<MedProduct>) => {
      const existing = medProducts.find(p => p.id === id);
      if (!existing) return;
      const next: MedProduct = { ...existing, ...updates };
      setMedProducts(prev => prev.map(p => (p.id === id ? next : p)));
      saveDocToFirestore('medProducts', id, next);
      logAction('UPDATE_MED_PRODUCT', 'medicine', `Updated medicine product details for ID ${id}.`);
    },
    [medProducts, setMedProducts, saveDocToFirestore, logAction]
  );

  const deleteMedProduct = useCallback(
    (id: string) => {
      const target = medProducts.find(p => p.id === id);
      setMedProducts(prev => prev.filter(p => p.id !== id));
      deleteDocFromFirestore('medProducts', id);
      logAction('DELETE_MED_PRODUCT', 'medicine', `Deleted product ${target?.name || id}.`);
    },
    [medProducts, setMedProducts, deleteDocFromFirestore, logAction]
  );

  const addMedStock = useCallback(
    (
      productId: string,
      unitsAdded: number,
      date: string,
      lotNumber?: string,
      notes?: string
    ) => {
      const product = medProducts.find(p => p.id === productId);
      if (!product) return;

      const newLog: MedStockLog = {
        id: 'msl_' + Date.now(),
        productId,
        productName: product.name,
        date,
        unitsAdded,
        lotNumber,
        notes,
        createdAt: new Date().toISOString(),
      };
      setMedStockLogs(prev => [newLog, ...prev]);
      saveDocToFirestore('medStockLogs', newLog.id, newLog);

      const nextUnits = product.currentStockUnits + unitsAdded;
      const updatedProduct: MedProduct = {
        ...product,
        currentStockUnits: nextUnits,
        currentStock: nextUnits,
      };
      setMedProducts(prev => prev.map(p => (p.id === productId ? updatedProduct : p)));
      saveDocToFirestore('medProducts', productId, updatedProduct);

      logAction('ADD_MED_STOCK', 'medicine', `Added ${unitsAdded} units of ${product.name}.`);
    },
    [medProducts, setMedStockLogs, setMedProducts, saveDocToFirestore, logAction]
  );

  const addMedAdministration = useCallback(
    (record: Omit<MedAdministrationRecord, 'id' | 'createdAt' | 'loggedBy'>) => {
      const newRecord: MedAdministrationRecord = {
        ...record,
        id: 'ma_' + Date.now(),
        loggedBy: currentUser?.fullName || 'Staff',
        createdAt: new Date().toISOString(),
      };
      setMedAdministrations(prev => [newRecord, ...prev]);
      saveDocToFirestore('medAdmins', newRecord.id, newRecord);

      const targetProduct = medProducts.find(p => p.id === record.productId);
      if (targetProduct) {
        const remaining = Math.max(0, targetProduct.currentStockUnits - record.unitsUsed);
        const updatedProduct: MedProduct = {
          ...targetProduct,
          currentStockUnits: remaining,
          currentStock: remaining,
        };
        setMedProducts(prev => prev.map(p => (p.id === record.productId ? updatedProduct : p)));
        saveDocToFirestore('medProducts', updatedProduct.id, updatedProduct);
      }

      logAction(
        'LOG_MED_ADMINISTRATION',
        'medicine',
        `Administered ${record.unitsUsed} units of ${record.productName} in ${record.houseNumber} via ${record.method}.`,
        record.houseNumber
      );
    },
    [currentUser, medProducts, setMedAdministrations, setMedProducts, saveDocToFirestore, logAction]
  );

  const deleteMedAdministration = useCallback(
    (id: string) => {
      const target = medAdministrations.find(a => a.id === id);
      setMedAdministrations(prev => prev.filter(a => a.id !== id));
      deleteDocFromFirestore('medAdmins', id);
      if (target) {
        const targetProduct = medProducts.find(p => p.id === target.productId);
        if (targetProduct) {
          const restored = targetProduct.currentStockUnits + (target.unitsUsed || 0);
          const updatedProduct: MedProduct = {
            ...targetProduct,
            currentStockUnits: restored,
            currentStock: restored,
          };
          setMedProducts(prev => prev.map(p => (p.id === target.productId ? updatedProduct : p)));
          saveDocToFirestore('medProducts', updatedProduct.id, updatedProduct);
        }
      }
      logAction(
        'DELETE_MED_ADMINISTRATION',
        'medicine',
        `Deleted medication administration record ID ${id}.`
      );
    },
    [
      medAdministrations,
      medProducts,
      setMedAdministrations,
      setMedProducts,
      saveDocToFirestore,
      deleteDocFromFirestore,
      logAction,
    ]
  );

  const upcomingVaccineAlerts = useMemo(
    () =>
      computeUpcomingVaccines(
        flocks,
        flockStatsByHouseMap,
        farmProfile.standardVaccinationProgram
      ),
    [flocks, flockStatsByHouseMap, farmProfile.standardVaccinationProgram]
  );

  const getUpcomingVaccines = useCallback((): VaccineAlert[] => {
    return upcomingVaccineAlerts;
  }, [upcomingVaccineAlerts]);

  // Biosecurity Compliance Operations
  const addBiosecurityRequirement = useCallback(
    (req: Omit<BiosecurityRequirement, 'id' | 'createdAt'>) => {
      const newReq: BiosecurityRequirement = {
        ...req,
        id: 'bio_req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        createdBy: currentUser?.fullName || 'Farm Manager',
        createdAt: new Date().toISOString(),
      };
      setBiosecurityRequirements(prev => [newReq, ...prev]);
      saveDocToFirestore('biosecurityRequirements', newReq.id, newReq);
      logAction(
        'ADD_BIOSECURITY_REQ',
        'biosecurity',
        `Added biosecurity protocol: "${req.title}" (${req.category}, ${req.criticalLevel}).`
      );
    },
    [currentUser, setBiosecurityRequirements, saveDocToFirestore, logAction]
  );

  const updateBiosecurityRequirement = useCallback(
    (id: string, updates: Partial<BiosecurityRequirement>) => {
      let updated: BiosecurityRequirement | undefined;
      setBiosecurityRequirements(prev =>
        prev.map(r => {
          if (r.id === id) {
            updated = { ...r, ...updates };
            return updated;
          }
          return r;
        })
      );
      if (updated) {
        saveDocToFirestore('biosecurityRequirements', id, updated);
      }
      logAction('UPDATE_BIOSECURITY_REQ', 'biosecurity', `Updated biosecurity protocol ID ${id}.`);
    },
    [setBiosecurityRequirements, saveDocToFirestore, logAction]
  );

  const deleteBiosecurityRequirement = useCallback(
    (id: string) => {
      const target = biosecurityRequirements.find(r => r.id === id);
      setBiosecurityRequirements(prev => prev.filter(r => r.id !== id));
      deleteDocFromFirestore('biosecurityRequirements', id);
      logAction(
        'DELETE_BIOSECURITY_REQ',
        'biosecurity',
        `Deleted biosecurity protocol: "${target?.title || id}".`
      );
    },
    [biosecurityRequirements, setBiosecurityRequirements, deleteDocFromFirestore, logAction]
  );

  const toggleBiosecurityRequirementActive = useCallback(
    (id: string) => {
      const target = biosecurityRequirements.find(r => r.id === id);
      if (!target) return;
      const nextActive = !target.active;
      const updated: BiosecurityRequirement = { ...target, active: nextActive };
      setBiosecurityRequirements(prev => prev.map(r => (r.id === id ? updated : r)));
      saveDocToFirestore('biosecurityRequirements', id, updated);
      logAction(
        'TOGGLE_BIOSECURITY_REQ',
        'biosecurity',
        `${nextActive ? 'Activated' : 'Deactivated'} biosecurity protocol: "${target.title}".`
      );
    },
    [biosecurityRequirements, setBiosecurityRequirements, saveDocToFirestore, logAction]
  );

  const calculateAndUpdateDailySummary = useCallback(
    (
      date: string,
      updatedLogs: BiosecurityVerificationLog[],
      currentRequirements: BiosecurityRequirement[]
    ) => {
      setBiosecuritySummaries(prev => {
        const stats = computeBiosecurityDailyMetrics(
          date,
          currentRequirements,
          updatedLogs,
          prev[date]
        );
        return {
          ...prev,
          [date]: {
            date,
            totalRequirements: stats.total,
            verifiedCount: stats.verified,
            passedCount: stats.passed,
            failedCount: stats.failed,
            complianceScorePct: stats.compliancePct,
            supervisorSignoff: stats.isSignedOff,
            supervisorSignoffBy: stats.signedOffBy,
            supervisorSignoffAt: stats.signedOffAt,
            supervisorNotes: stats.supervisorNotes,
          },
        };
      });
    },
    [setBiosecuritySummaries]
  );

  const toggleBiosecurityLog = useCallback(
    (
      requirementId: string,
      date: string,
      status?: BiosecurityStatus,
      notes?: string,
      correctiveAction?: string
    ) => {
      const req = biosecurityRequirements.find(r => r.id === requirementId);
      if (!req) return;

      let newLogs: BiosecurityVerificationLog[] = [];
      const existingIndex = biosecurityLogs.findIndex(
        l => l.requirementId === requirementId && l.date === date
      );

      if (existingIndex >= 0) {
        const existing = biosecurityLogs[existingIndex];
        const nextStatus: BiosecurityStatus =
          status ||
          (existing.status === 'pass'
            ? 'fail'
            : existing.status === 'fail'
              ? 'na'
              : 'pass');

        const updatedLog: BiosecurityVerificationLog = {
          ...existing,
          status: nextStatus,
          verified: true,
          verifiedBy: currentUser?.id || 'staff',
          verifiedByName: currentUser?.fullName || 'Staff',
          verifiedAt: new Date().toISOString(),
          notes: notes !== undefined ? notes : existing.notes,
          correctiveAction:
            correctiveAction !== undefined ? correctiveAction : existing.correctiveAction,
        };

        newLogs = [...biosecurityLogs];
        newLogs[existingIndex] = updatedLog;
      } else {
        const targetStatus: BiosecurityStatus = status || 'pass';
        const newLogEntry: BiosecurityVerificationLog = {
          id: 'blog_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          date,
          requirementId,
          requirementTitle: req.title,
          category: req.category,
          targetArea: req.targetArea,
          status: targetStatus,
          verified: true,
          verifiedBy: currentUser?.id || 'staff',
          verifiedByName: currentUser?.fullName || 'Staff',
          verifiedAt: new Date().toISOString(),
          notes,
          correctiveAction,
        };
        newLogs = [newLogEntry, ...biosecurityLogs];
      }

      setBiosecurityLogs(newLogs);
      calculateAndUpdateDailySummary(date, newLogs, biosecurityRequirements);

      const logToSave = newLogs.find(l => l.requirementId === requirementId && l.date === date);
      if (logToSave) {
        saveDocToFirestore(
          'biosecurityLogs',
          logToSave.id || `${requirementId}_${date}`,
          logToSave
        );
      }

      logAction(
        'BIOSECURITY_VERIFICATION',
        'biosecurity',
        `Verified biosecurity item: "${req.title}" as [${(status || 'pass').toUpperCase()}] for date ${date}.`
      );
    },
    [
      biosecurityRequirements,
      biosecurityLogs,
      currentUser,
      setBiosecurityLogs,
      calculateAndUpdateDailySummary,
      saveDocToFirestore,
      logAction,
    ]
  );

  const batchVerifyAllBiosecurity = useCallback(
    (date: string, status: BiosecurityStatus = 'pass') => {
      const activeReqs = biosecurityRequirements.filter(r => r.active);
      const existingOtherLogs = biosecurityLogs.filter(l => l.date !== date);

      const nowIso = new Date().toISOString();
      const batchLogs: BiosecurityVerificationLog[] = activeReqs.map(req => {
        const prev = biosecurityLogs.find(l => l.date === date && l.requirementId === req.id);
        return {
          id: prev?.id || 'blog_' + Date.now() + '_' + req.id,
          date,
          requirementId: req.id,
          requirementTitle: req.title,
          category: req.category,
          targetArea: req.targetArea,
          status,
          verified: true,
          verifiedBy: currentUser?.id || 'staff',
          verifiedByName: currentUser?.fullName || 'Staff',
          verifiedAt: nowIso,
          notes: prev?.notes || 'Batch verified compliant',
        };
      });

      const newLogs = [...batchLogs, ...existingOtherLogs];
      setBiosecurityLogs(newLogs);
      calculateAndUpdateDailySummary(date, newLogs, biosecurityRequirements);
      pendingWritesRef.current += 1;
      saveDocsBatchToMongoDB('biosecurityLogs', batchLogs).finally(() => {
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
      });
      logAction(
        'BIOSECURITY_BATCH_VERIFY',
        'biosecurity',
        `Batch-verified all ${activeReqs.length} active biosecurity requirements as [${status.toUpperCase()}] for date ${date}.`
      );
    },
    [
      biosecurityRequirements,
      biosecurityLogs,
      currentUser,
      setBiosecurityLogs,
      calculateAndUpdateDailySummary,
      pendingWritesRef,
      logAction,
    ]
  );

  const signoffBiosecurityDaily = useCallback(
    (date: string, supervisorNotes?: string) => {
      const stats = computeBiosecurityDailyMetrics(
        date,
        biosecurityRequirements,
        biosecurityLogs,
        biosecuritySummaries[date]
      );

      const updatedSummary: BiosecurityDailySummary = {
        date,
        totalRequirements: stats.total,
        verifiedCount: stats.verified,
        passedCount: stats.passed,
        failedCount: stats.failed,
        complianceScorePct: stats.compliancePct,
        supervisorSignoff: true,
        supervisorSignoffBy: currentUser?.fullName || 'Farm Manager',
        supervisorSignoffAt: new Date().toISOString(),
        supervisorNotes:
          supervisorNotes || 'Daily biosecurity protocols audited and verified compliant.',
      };

      setBiosecuritySummaries(prev => ({
        ...prev,
        [date]: updatedSummary,
      }));
      saveDocToFirestore('biosecuritySummaries', date, updatedSummary);

      logAction(
        'BIOSECURITY_SUPERVISOR_SIGNOFF',
        'biosecurity',
        `Manager supervisor sign-off approved for ${date} with ${stats.compliancePct}% compliance score.`
      );
    },
    [
      biosecurityRequirements,
      biosecurityLogs,
      biosecuritySummaries,
      currentUser,
      setBiosecuritySummaries,
      saveDocToFirestore,
      logAction,
    ]
  );

  const getBiosecurityDailyStats = useCallback(
    (date: string) => {
      return computeBiosecurityDailyMetrics(
        date,
        biosecurityRequirements,
        biosecurityLogs,
        biosecuritySummaries[date]
      );
    },
    [biosecurityRequirements, biosecurityLogs, biosecuritySummaries]
  );

  return {
    addFeedStock,
    deleteFeedStock,
    addFeedConsumption,
    deleteFeedConsumption,
    getFeedStockSummary,
    getLowStockAlerts,
    addMedProduct,
    addMedProductsBatch,
    updateMedProduct,
    deleteMedProduct,
    addMedStock,
    addMedAdministration,
    deleteMedAdministration,
    getUpcomingVaccines,
    getUpcomingVaccineAlerts: getUpcomingVaccines,
    addBiosecurityRequirement,
    updateBiosecurityRequirement,
    deleteBiosecurityRequirement,
    toggleBiosecurityRequirementActive,
    toggleBiosecurityLog,
    batchVerifyAllBiosecurity,
    signoffBiosecurityDaily,
    getBiosecurityDailyStats,
  };
}
