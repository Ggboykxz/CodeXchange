export const DEFAULT_PAGE_SIZE = 12;

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Chaîne/number → entier ≥ 1, `NaN`/invalide → 1 (vigilance spec). */
export function normalizePage(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
  }
  if (value === undefined || value === null || value === "") return 1;
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}

/** Taille de page positive, sinon repli sur `fallback` (défaut 12). */
export function normalizePageSize(value: unknown, fallback: number = DEFAULT_PAGE_SIZE): number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback;
  }
  if (value === undefined || value === null || value === "") return fallback;
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) || n < 1 ? fallback : n;
}

export function computeTotalPages(total: number, pageSize: number): number {
  if (pageSize <= 0) return 0;
  return Math.ceil(total / pageSize);
}

export function skipTake(page: unknown, pageSize?: unknown): { skip: number; take: number } {
  const p = normalizePage(page);
  const s = normalizePageSize(pageSize, DEFAULT_PAGE_SIZE);
  return { skip: (p - 1) * s, take: s };
}

/** Alias « limit/offset » pour les tests de pagination. */
export function pageToSkipTake(page: unknown, pageSize?: unknown): { skip: number; take: number } {
  return skipTake(page, pageSize);
}

export function limitOffset(page: unknown, pageSize?: unknown): { limit: number; offset: number } {
  const { skip, take } = skipTake(page, pageSize);
  return { limit: take, offset: skip };
}

export function offsetFor(page: unknown, pageSize?: unknown): number {
  return skipTake(page, pageSize).skip;
}

export function paginateArray<T>(
  items: readonly T[],
  page?: number,
  pageSize?: number,
): PaginatedResult<T> {
  const p = normalizePage(page);
  const s = normalizePageSize(pageSize, DEFAULT_PAGE_SIZE);
  const total = items.length;
  const totalPages = computeTotalPages(total, s);
  const start = (p - 1) * s;
  return {
    items: items.slice(start, start + s) as T[],
    total,
    page: p,
    pageSize: s,
    totalPages,
  };
}