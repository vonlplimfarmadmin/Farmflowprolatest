import { Flock, UserAccount } from '../types';

/**
 * Deduplicates an array of documents by a specified key property or `id` / `_id`.
 */
export function deduplicateById<T = any>(items: any[], keyProp?: keyof T): T[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, T>();
  for (const item of items) {
    if (!item) continue;
    const key = String((keyProp ? item[keyProp] : undefined) || item.id || item._id || '');
    if (key) {
      map.set(key, item as T);
    }
  }
  return Array.from(map.values());
}

/**
 * Fast O(N) structural equality check to avoid replacing state array references when polled data is unchanged.
 */
export function areArraysEqualByIdAndUpdated<T extends Record<string, any>>(
  prev: T[],
  next: T[]
): boolean {
  if (prev === next) return true;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    const a = prev[i];
    const b = next[i];
    if (!a || !b) {
      if (a !== b) return false;
      continue;
    }
    if (a.id !== b.id || a.updatedAt !== b.updatedAt || a.date !== b.date) {
      return false;
    }
    if (!a.updatedAt && JSON.stringify(a) !== JSON.stringify(b)) {
      return false;
    }
  }
  return true;
}

/**
 * Deduplicates flocks by houseNumber (primary business key) or id.
 */
export function deduplicateFlocks(items: Flock[]): Flock[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, Flock>();
  for (const item of items) {
    if (!item) continue;
    const key = String(item.houseNumber || item.id || '');
    if (key) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

/**
 * Deduplicates user accounts by normalized lowercase username or id.
 */
export function deduplicateUsers(items: UserAccount[]): UserAccount[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, UserAccount>();
  for (const item of items) {
    if (!item) continue;
    const key = String(item.username || item.id || '').toLowerCase();
    if (key) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

export function safeParseArray<T>(key: string, fallback: T[]): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function safeParseObject<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}
