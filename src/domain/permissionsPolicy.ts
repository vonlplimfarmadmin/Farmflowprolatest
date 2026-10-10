export interface PermissionCheck {
  canViewModule: (moduleId: string) => boolean;
  canEditRecord: boolean;
  canDeleteRecord: boolean;
  canApproveUsers: boolean;
  canManageUsers: boolean;
  canManageFarmProfile: boolean;
  canManageMedicines: boolean;
  canManageBiosecurityRequirements: boolean;
  canVerifyBiosecurity: boolean;
  canRecordEggProduction: (houseNumber?: string) => boolean;
  canRecordFlockmanModule: (houseNumber?: string) => boolean;
  canRecordMortality: (houseNumber?: string) => boolean;
  canAddFeedStock: boolean;
  canAddMedicine: boolean;
  canAddFlock: boolean;
}

/**
 * Pure RBAC policy builder for evaluating user role permissions and house-level access.
 */
export function buildRolePermissions(
  role?: string,
  designatedHouses: string[] = []
): PermissionCheck {
  const r = role || 'Egg Collector';
  const isAdmin = r === 'admin' || r === 'System Administrator';
  const isManager = r === 'farm_manager' || r === 'Farm Manager';
  const isFlockman = r === 'flockman' || r === 'Flockman';
  const isLeadman = r === 'leadman' || r === 'Leadman';
  const isCollector = r === 'egg_collector' || r === 'Egg Collector';

  return {
    canViewModule: (moduleId: string): boolean => {
      if (moduleId === 'presentation') return true;
      if (isAdmin || isManager) return true;

      if (isFlockman) {
        return [
          'dashboard',
          'egg_production',
          'delivery',
          'flockman',
          'flockman_module',
          'flock',
          'flock_list',
          'farm_profile',
          'reports',
          'presentation',
        ].includes(moduleId);
      }
      if (isLeadman) {
        return [
          'dashboard',
          'egg_production',
          'delivery',
          'flockman',
          'flockman_module',
          'flock',
          'flock_list',
          'farm_profile',
          'mortality',
          'reports',
          'presentation',
        ].includes(moduleId);
      }
      if (isCollector) {
        return ['dashboard', 'egg_production', 'delivery', 'reports', 'presentation'].includes(
          moduleId
        );
      }
      return false;
    },

    canEditRecord: isAdmin,
    canDeleteRecord: isAdmin,
    canApproveUsers: isAdmin,
    canManageUsers: isAdmin,
    canManageFarmProfile: isAdmin,
    canManageMedicines: isAdmin || isManager,
    canManageBiosecurityRequirements: isAdmin || isManager,
    canVerifyBiosecurity: true,

    canRecordEggProduction: (houseNumber?: string) => {
      if (isAdmin || isManager) return true;
      if (!houseNumber) return true;
      return designatedHouses.includes(houseNumber);
    },

    canRecordFlockmanModule: (houseNumber?: string) => {
      if (isAdmin || isManager || isLeadman) {
        if (!houseNumber || isAdmin || isManager) return true;
        return designatedHouses.includes(houseNumber);
      }
      return false;
    },

    canRecordMortality: (houseNumber?: string) => {
      if (isAdmin || isManager || isLeadman) {
        if (!houseNumber || isAdmin || isManager) return true;
        return designatedHouses.includes(houseNumber);
      }
      return false;
    },

    canAddFeedStock: isAdmin || isManager,
    canAddMedicine: isAdmin || isManager,
    canAddFlock: isAdmin || isManager,
  };
}
