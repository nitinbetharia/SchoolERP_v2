/**
 * Runtime guard helpers to avoid runtime errors and enforce type safety at edges.
 * Use these in services/repos before DB or external calls.
 */

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function isString(v: unknown): v is string {
  return typeof v === 'string';
}

export function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0;
}

export function toIntSafe(v: unknown, fallback = 0): number {
  const n = typeof v === 'string' ? Number(v) : (typeof v === 'number' ? v : NaN);
  return Number.isInteger(n) ? Number(n) : fallback;
}

export function isArray<T = unknown>(v: unknown): v is T[] {
  return Array.isArray(v);
}

export function hasKeys<T extends object = any>(v: unknown, keys: (keyof T)[]): v is T {
  if (v && typeof v === 'object') {
    return keys.every(k => Object.prototype.hasOwnProperty.call(v, k));
  }
  return false;
}

// Guarded access to optional arrays
export function normalizeArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v === undefined || v === null) return [];
  return [v as T];
}

// Fail fast helper
export function invariant(cond: any, message: string): asserts cond {
  if (!cond) throw new Error(message);
}
