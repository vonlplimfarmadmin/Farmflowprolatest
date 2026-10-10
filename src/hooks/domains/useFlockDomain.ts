import React, { useMemo, useCallback } from 'react';
import {
  Flock,
  BirdTransferRecord,
  DepletionRecord,
  BodyWeightRecord,
  UserAccount,
  SystemLog,
} from '../../types';
import {
  FlockStats,
  indexDepletionsByHouse,
  buildFlockStatsMap,
  computeSingleFlockStats,
} from '../../utils/farmCalculations';

interface UseFlockDomainParams {
  currentUser: UserAccount | null;
  flocks: Flock[];
  setFlocks: React.Dispatch<React.SetStateAction<Flock[]>>;
  transfers: BirdTransferRecord[];
  setTransfers: React.Dispatch<React.SetStateAction<BirdTransferRecord[]>>;
  depletions: DepletionRecord[];
  setDepletions: React.Dispatch<React.SetStateAction<DepletionRecord[]>>;
  bodyWeights: BodyWeightRecord[];
  setBodyWeights: React.Dispatch<React.SetStateAction<BodyWeightRecord[]>>;
  saveDocToFirestore: (collectionName: string, docId: string, data: any) => void;
  deleteDocFromFirestore: (collectionName: string, docId: string) => void;
  logAction: (
    action: string,
    category: SystemLog['category'],
    details: string,
    houseNumber?: string
  ) => void;
}

export function useFlockDomain({
  currentUser,
  flocks,
  setFlocks,
  transfers,
  setTransfers,
  depletions,
  setDepletions,
  bodyWeights,
  setBodyWeights,
  saveDocToFirestore,
  deleteDocFromFirestore,
  logAction,
}: UseFlockDomainParams) {
  const depletionByHouseMap = useMemo(
    () => indexDepletionsByHouse(depletions),
    [depletions]
  );

  const flockStatsByHouseMap = useMemo(
    () => buildFlockStatsMap(flocks, depletions),
    [flocks, depletions]
  );

  const getFlockStats = useCallback(
    (houseNumber: string, referenceDate?: string): FlockStats | null => {
      if (!referenceDate) {
        return flockStatsByHouseMap.get(houseNumber) ?? null;
      }
      const flock = flocks.find(f => f.houseNumber === houseNumber);
      if (!flock) return null;
      return computeSingleFlockStats(
        flock,
        depletionByHouseMap.get(houseNumber),
        referenceDate
      );
    },
    [flocks, flockStatsByHouseMap, depletionByHouseMap]
  );

  const addFlock = useCallback(
    (flockData: Omit<Flock, 'id' | 'currentMales' | 'currentFemales'>) => {
      const newFlock: Flock = {
        ...flockData,
        id: 'flock_' + Date.now(),
        currentMales: flockData.initialMales,
        currentFemales: flockData.initialFemales,
        pens: flockData.pens || [
          {
            id: 'pen_l1',
            name: 'Pen L1',
            side: 'Left',
            males: Math.floor(flockData.initialMales / 4),
            females: Math.floor(flockData.initialFemales / 4),
          },
          {
            id: 'pen_l2',
            name: 'Pen L2',
            side: 'Left',
            males: Math.floor(flockData.initialMales / 4),
            females: Math.floor(flockData.initialFemales / 4),
          },
          {
            id: 'pen_r1',
            name: 'Pen R1',
            side: 'Right',
            males: Math.floor(flockData.initialMales / 4),
            females: Math.floor(flockData.initialFemales / 4),
          },
          {
            id: 'pen_r2',
            name: 'Pen R2',
            side: 'Right',
            males: Math.floor(flockData.initialMales / 4),
            females: Math.floor(flockData.initialFemales / 4),
          },
        ],
      };
      setFlocks(prev => [...prev, newFlock]);
      saveDocToFirestore('flocks', newFlock.id, newFlock);
      logAction(
        'ADD_FLOCK',
        'flock',
        `Added flock in ${newFlock.houseNumber} (${newFlock.breed}, ${newFlock.initialMales}M / ${newFlock.initialFemales}F).`,
        newFlock.houseNumber
      );
    },
    [setFlocks, saveDocToFirestore, logAction]
  );

  const updateFlock = useCallback(
    (id: string, updates: Partial<Flock>) => {
      const existing = flocks.find(f => f.id === id);
      if (!existing) return;
      const next: Flock = { ...existing, ...updates };
      setFlocks(prev => prev.map(f => (f.id === id ? next : f)));
      saveDocToFirestore('flocks', id, next);
      logAction('UPDATE_FLOCK', 'flock', `Updated flock parameters for ID ${id}.`);
    },
    [flocks, setFlocks, saveDocToFirestore, logAction]
  );

  const deleteFlock = useCallback(
    (id: string) => {
      const target = flocks.find(f => f.id === id);
      setFlocks(prev => prev.filter(f => f.id !== id));
      deleteDocFromFirestore('flocks', id);
      logAction(
        'DELETE_FLOCK',
        'flock',
        `Deleted flock in ${target?.houseNumber || id}.`,
        target?.houseNumber
      );
    },
    [flocks, setFlocks, deleteDocFromFirestore, logAction]
  );

  const addTransfer = useCallback(
    (
      transfer: Omit<BirdTransferRecord, 'id' | 'createdAt' | 'loggedBy'>
    ): { success: boolean; message: string } => {
      const {
        sourceHouse,
        destHouse,
        maleCount,
        femaleCount,
        sourcePenName,
        destPenName,
        reason,
      } = transfer;

      if (sourceHouse === destHouse) {
        return {
          success: false,
          message: 'Source and destination houses cannot be the same.',
        };
      }

      if (maleCount <= 0 && femaleCount <= 0) {
        return {
          success: false,
          message: 'Please specify at least 1 male or female bird to transfer.',
        };
      }

      const sourceFlock = flocks.find(f => f.houseNumber === sourceHouse);
      const destFlock = flocks.find(f => f.houseNumber === destHouse);

      if (!sourceFlock || !destFlock) {
        return {
          success: false,
          message: 'Selected source or destination house could not be found.',
        };
      }

      if (sourceFlock.currentMales < maleCount) {
        return {
          success: false,
          message: `Insufficient males in ${sourceHouse}: requested ${maleCount}, but only ${sourceFlock.currentMales} available.`,
        };
      }

      if (sourceFlock.currentFemales < femaleCount) {
        return {
          success: false,
          message: `Insufficient females in ${sourceHouse}: requested ${femaleCount}, but only ${sourceFlock.currentFemales} available.`,
        };
      }

      const updatedSourceFlock: Flock = {
        ...sourceFlock,
        currentMales: Math.max(0, sourceFlock.currentMales - maleCount),
        currentFemales: Math.max(0, sourceFlock.currentFemales - femaleCount),
        pens:
          sourceFlock.pens?.map(p =>
            sourcePenName && p.name === sourcePenName
              ? {
                  ...p,
                  males: Math.max(0, p.males - maleCount),
                  females: Math.max(0, p.females - femaleCount),
                }
              : p
          ) || sourceFlock.pens,
      };

      const updatedDestFlock: Flock = {
        ...destFlock,
        currentMales: destFlock.currentMales + maleCount,
        currentFemales: destFlock.currentFemales + femaleCount,
        pens:
          destFlock.pens?.map(p =>
            destPenName && p.name === destPenName
              ? {
                  ...p,
                  males: p.males + maleCount,
                  females: p.females + femaleCount,
                }
              : p
          ) || destFlock.pens,
      };

      setFlocks(prev =>
        prev.map(f => {
          if (f.houseNumber === sourceHouse) return updatedSourceFlock;
          if (f.houseNumber === destHouse) return updatedDestFlock;
          return f;
        })
      );
      saveDocToFirestore('flocks', updatedSourceFlock.id, updatedSourceFlock);
      saveDocToFirestore('flocks', updatedDestFlock.id, updatedDestFlock);

      const newTransfer: BirdTransferRecord = {
        ...transfer,
        id: 'tr_' + Date.now(),
        loggedBy: currentUser?.fullName || 'Staff',
        createdAt: new Date().toISOString(),
      };

      setTransfers(prev => [newTransfer, ...prev]);
      saveDocToFirestore('transfers', newTransfer.id, newTransfer);

      logAction(
        'LOG_TRANSFER',
        'flock',
        `Transferred ${maleCount} males & ${femaleCount} females from ${sourceHouse} to ${destHouse}${reason ? ` (${reason})` : ''}.`,
        sourceHouse
      );

      return {
        success: true,
        message: `Successfully transferred ${maleCount > 0 ? `${maleCount} males ` : ''}${femaleCount > 0 ? `${femaleCount} females ` : ''}from ${sourceHouse} to ${destHouse}!`,
      };
    },
    [flocks, currentUser, setFlocks, setTransfers, saveDocToFirestore, logAction]
  );

  const deleteTransfer = useCallback(
    (id: string, revertCounts: boolean = true) => {
      const target = transfers.find(t => t.id === id);
      if (!target) return;

      if (revertCounts) {
        const sourceFlock = flocks.find(f => f.houseNumber === target.sourceHouse);
        const destFlock = flocks.find(f => f.houseNumber === target.destHouse);

        const updatedSource: Flock | undefined = sourceFlock
          ? {
              ...sourceFlock,
              currentMales: sourceFlock.currentMales + target.maleCount,
              currentFemales: sourceFlock.currentFemales + target.femaleCount,
              pens:
                sourceFlock.pens?.map(p =>
                  target.sourcePenName && p.name === target.sourcePenName
                    ? {
                        ...p,
                        males: p.males + target.maleCount,
                        females: p.females + target.femaleCount,
                      }
                    : p
                ) || sourceFlock.pens,
            }
          : undefined;

        const updatedDest: Flock | undefined = destFlock
          ? {
              ...destFlock,
              currentMales: Math.max(0, destFlock.currentMales - target.maleCount),
              currentFemales: Math.max(0, destFlock.currentFemales - target.femaleCount),
              pens:
                destFlock.pens?.map(p =>
                  target.destPenName && p.name === target.destPenName
                    ? {
                        ...p,
                        males: Math.max(0, p.males - target.maleCount),
                        females: Math.max(0, p.females - target.femaleCount),
                      }
                    : p
                ) || destFlock.pens,
            }
          : undefined;

        setFlocks(prev =>
          prev.map(f => {
            if (updatedSource && f.houseNumber === target.sourceHouse) return updatedSource;
            if (updatedDest && f.houseNumber === target.destHouse) return updatedDest;
            return f;
          })
        );

        if (updatedSource) saveDocToFirestore('flocks', updatedSource.id, updatedSource);
        if (updatedDest) saveDocToFirestore('flocks', updatedDest.id, updatedDest);
      }

      setTransfers(prev => prev.filter(t => t.id !== id));
      deleteDocFromFirestore('transfers', id);
      logAction(
        'DELETE_TRANSFER',
        'flock',
        `Deleted transfer record ${target.sourceHouse} -> ${target.destHouse} (${target.maleCount}M, ${target.femaleCount}F).`
      );
    },
    [transfers, flocks, setFlocks, setTransfers, saveDocToFirestore, deleteDocFromFirestore, logAction]
  );

  const addDepletion = useCallback(
    (record: Omit<DepletionRecord, 'id' | 'createdAt' | 'loggedBy'>) => {
      const newRecord: DepletionRecord = {
        ...record,
        id: 'dep_' + Date.now(),
        loggedBy: currentUser?.fullName || 'Staff',
        createdAt: new Date().toISOString(),
      };
      setDepletions(prev => [newRecord, ...prev]);
      saveDocToFirestore('depletions', newRecord.id, newRecord);

      const targetFlock = flocks.find(f => f.houseNumber === record.houseNumber);
      if (targetFlock) {
        const updatedFlock: Flock = {
          ...targetFlock,
          currentMales: Math.max(0, targetFlock.currentMales - record.maleCount),
          currentFemales: Math.max(0, targetFlock.currentFemales - record.femaleCount),
        };
        setFlocks(prev =>
          prev.map(f => (f.houseNumber === record.houseNumber ? updatedFlock : f))
        );
        saveDocToFirestore('flocks', updatedFlock.id, updatedFlock);
      }

      logAction(
        'LOG_DEPLETION',
        'mortality',
        `Depletion (${record.category}): ${record.maleCount}M, ${record.femaleCount}F in ${record.houseNumber} (${record.side} side).`,
        record.houseNumber
      );
    },
    [currentUser, flocks, setDepletions, setFlocks, saveDocToFirestore, logAction]
  );

  const deleteDepletion = useCallback(
    (id: string) => {
      const target = depletions.find(d => d.id === id);
      setDepletions(prev => prev.filter(d => d.id !== id));
      deleteDocFromFirestore('depletions', id);
      if (target) {
        const targetFlock = flocks.find(f => f.houseNumber === target.houseNumber);
        if (targetFlock) {
          const updatedFlock: Flock = {
            ...targetFlock,
            currentMales: targetFlock.currentMales + (target.maleCount || 0),
            currentFemales: targetFlock.currentFemales + (target.femaleCount || 0),
          };
          setFlocks(prev =>
            prev.map(f => (f.houseNumber === target.houseNumber ? updatedFlock : f))
          );
          saveDocToFirestore('flocks', updatedFlock.id, updatedFlock);
        }
      }
      logAction('DELETE_DEPLETION', 'mortality', `Deleted depletion record ID ${id}.`);
    },
    [depletions, flocks, setDepletions, setFlocks, saveDocToFirestore, deleteDocFromFirestore, logAction]
  );

  const addBodyWeightRecord = useCallback(
    (record: Omit<BodyWeightRecord, 'id' | 'createdAt' | 'loggedBy'>) => {
      const prevRecord = bodyWeights
        .filter(b => b.houseNumber === record.houseNumber && b.week < record.week)
        .sort((a, b) => b.week - a.week)[0];

      const weeklyGainMale = prevRecord
        ? record.maleAvgWeightGrams - prevRecord.maleAvgWeightGrams
        : undefined;
      const weeklyGainFemale = prevRecord
        ? record.femaleAvgWeightGrams - prevRecord.femaleAvgWeightGrams
        : undefined;

      const newRecord: BodyWeightRecord = {
        ...record,
        id: 'bw_' + Date.now(),
        weeklyGainMale: record.weeklyGainMale ?? weeklyGainMale,
        weeklyGainFemale: record.weeklyGainFemale ?? weeklyGainFemale,
        loggedBy: currentUser?.fullName || 'Staff',
        createdAt: new Date().toISOString(),
      };
      setBodyWeights(prev => [newRecord, ...prev]);
      saveDocToFirestore('bodyWeights', newRecord.id, newRecord);

      logAction(
        'LOG_BODY_WEIGHT',
        'bodyweight',
        `Logged Week ${record.week} weight in ${record.houseNumber} (M: ${record.maleAvgWeightGrams}g, F: ${record.femaleAvgWeightGrams}g).`,
        record.houseNumber
      );
    },
    [bodyWeights, currentUser, setBodyWeights, saveDocToFirestore, logAction]
  );

  const deleteBodyWeightRecord = useCallback(
    (id: string) => {
      setBodyWeights(prev => prev.filter(b => b.id !== id));
      deleteDocFromFirestore('bodyWeights', id);
      logAction('DELETE_BODY_WEIGHT', 'bodyweight', `Deleted body weight record ID ${id}.`);
    },
    [setBodyWeights, deleteDocFromFirestore, logAction]
  );

  return {
    flockStatsByHouseMap,
    getFlockStats,
    addFlock,
    updateFlock,
    deleteFlock,
    addTransfer,
    deleteTransfer,
    addDepletion,
    deleteDepletion,
    addBodyWeightRecord,
    deleteBodyWeightRecord,
  };
}
