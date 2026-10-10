import React, { useCallback } from 'react';
import {
  FarmProfile,
  StandardMedProgramItem,
  StandardFeedGuideItem,
  StandardHendayItem,
  StandardBodyWeightItem,
  StandardEggWeightItem,
  SystemLog,
} from '../../types';
import {
  saveFarmProfileToMongoDB,
  saveDocToMongoDB,
} from '../../services/mongodbSync';

interface UseFarmProfileDomainParams {
  farmProfile: FarmProfile;
  setFarmProfile: React.Dispatch<React.SetStateAction<FarmProfile>>;
  setMongoStatus: React.Dispatch<React.SetStateAction<any>>;
  saveDocToFirestore: (collectionName: string, docId: string, data: any) => void;
  logAction: (
    action: string,
    category: SystemLog['category'],
    details: string,
    houseNumber?: string
  ) => void;
}

export function useFarmProfileDomain({
  farmProfile,
  setFarmProfile,
  setMongoStatus,
  saveDocToFirestore,
  logAction,
}: UseFarmProfileDomainParams) {
  const updateFarmProfile = useCallback(
    async (
      profile: Partial<FarmProfile>
    ): Promise<{ success: boolean; message: string; data?: FarmProfile }> => {
      let nextProfile: FarmProfile = { ...farmProfile, ...profile };
      setFarmProfile(prev => {
        const next = { ...prev, ...profile };
        nextProfile = next;
        return next;
      });

      try {
        const res = await saveFarmProfileToMongoDB(nextProfile);
        if (res.success) {
          setMongoStatus((prev: any) => ({
            ...prev,
            lastSyncedAt: new Date().toISOString(),
            connected: true,
          }));
        }
      } catch {
        saveDocToFirestore('farmProfile', 'profile', nextProfile);
      }

      logAction(
        'UPDATE_FARM_PROFILE',
        'admin',
        `Updated farm profile information (${profile.name || 'details'}).`
      );
      return {
        success: true,
        message: 'Farm Profile & Overview updated in MongoDB!',
        data: nextProfile,
      };
    },
    [farmProfile, setFarmProfile, setMongoStatus, saveDocToFirestore, logAction]
  );

  const updateAllStandards = useCallback(
    async (standards: {
      vaccine?: StandardMedProgramItem[];
      feed?: StandardFeedGuideItem[];
      henday?: StandardHendayItem[];
      bodyweight?: StandardBodyWeightItem[];
      eggweight?: StandardEggWeightItem[];
    }): Promise<{ success: boolean; message: string }> => {
      let nextProfile: FarmProfile;
      setFarmProfile(prev => {
        const next = { ...prev };
        if (standards.vaccine) next.standardVaccinationProgram = standards.vaccine;
        if (standards.feed) next.standardFeedGuide = standards.feed;
        if (standards.henday) next.standardHenday = standards.henday;
        if (standards.bodyweight) next.standardBodyWeights = standards.bodyweight;
        if (standards.eggweight) next.standardEggWeights = standards.eggweight;
        nextProfile = next;
        return next;
      });

      try {
        if (standards.vaccine) {
          await saveDocToMongoDB('standards', 'vaccination', {
            id: 'vaccination',
            items: standards.vaccine,
          });
        }
        if (standards.feed) {
          await saveDocToMongoDB('standards', 'feedGuide', {
            id: 'feedGuide',
            items: standards.feed,
          });
        }
        if (standards.henday) {
          await saveDocToMongoDB('standards', 'henday', {
            id: 'henday',
            items: standards.henday,
          });
        }
        if (standards.bodyweight) {
          await saveDocToMongoDB('standards', 'bodyWeights', {
            id: 'bodyWeights',
            items: standards.bodyweight,
          });
        }
        if (standards.eggweight) {
          await saveDocToMongoDB('standards', 'eggWeights', {
            id: 'eggWeights',
            items: standards.eggweight,
          });
        }
        if (nextProfile!) {
          await saveFarmProfileToMongoDB(nextProfile);
          saveDocToFirestore('farmProfile', 'profile', nextProfile);
        }
        return { success: true, message: 'All standards synchronized with database.' };
      } catch (err: any) {
        console.warn('[Standards] Error persisting standards:', err);
        return { success: false, message: err?.message || 'Error persisting standards' };
      }
    },
    [setFarmProfile, saveDocToFirestore]
  );

  const updateSingleStandard = useCallback(
    <K extends keyof FarmProfile>(
      profileField: K,
      standardDocId: string,
      items: FarmProfile[K],
      actionCode: string,
      logDescription: string
    ) => {
      const nextProfile: FarmProfile = { ...farmProfile, [profileField]: items };
      setFarmProfile(nextProfile);
      saveDocToMongoDB('standards', standardDocId, { id: standardDocId, items }).catch(() => {});
      saveFarmProfileToMongoDB(nextProfile).catch(() => {});
      logAction(actionCode, 'admin', logDescription);
    },
    [farmProfile, setFarmProfile, logAction]
  );

  const updateStandardVaccination = useCallback(
    (program: StandardMedProgramItem[]) => {
      updateSingleStandard(
        'standardVaccinationProgram',
        'vaccination',
        program,
        'UPDATE_STANDARD_VACCINATION',
        `Updated standard vaccination schedule (${program.length} items).`
      );
    },
    [updateSingleStandard]
  );

  const updateStandardFeedGuide = useCallback(
    (guide: StandardFeedGuideItem[]) => {
      updateSingleStandard(
        'standardFeedGuide',
        'feedGuide',
        guide,
        'UPDATE_STANDARD_FEED_GUIDE',
        `Updated standard feed guide (${guide.length} items).`
      );
    },
    [updateSingleStandard]
  );

  const updateStandardHenday = useCallback(
    (henday: StandardHendayItem[]) => {
      updateSingleStandard(
        'standardHenday',
        'henday',
        henday,
        'UPDATE_STANDARD_HENDAY',
        'Updated standard Henday% production curve.'
      );
    },
    [updateSingleStandard]
  );

  const updateStandardBodyWeights = useCallback(
    (weights: StandardBodyWeightItem[]) => {
      updateSingleStandard(
        'standardBodyWeights',
        'bodyWeights',
        weights,
        'UPDATE_STANDARD_BODY_WEIGHTS',
        'Updated standard body weight curves.'
      );
    },
    [updateSingleStandard]
  );

  const updateStandardEggWeights = useCallback(
    (eggWeights: StandardEggWeightItem[]) => {
      updateSingleStandard(
        'standardEggWeights',
        'eggWeights',
        eggWeights,
        'UPDATE_STANDARD_EGG_WEIGHTS',
        'Updated standard egg weight progression.'
      );
    },
    [updateSingleStandard]
  );

  return {
    updateFarmProfile,
    updateAllStandards,
    updateStandardVaccination,
    updateStandardFeedGuide,
    updateStandardHenday,
    updateStandardBodyWeights,
    updateStandardEggWeights,
  };
}
