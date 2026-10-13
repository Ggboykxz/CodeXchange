import { describe, expect, test } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  computeTotalPages,
  limitOffset,
  normalizePage,
  normalizePageSize,
  offsetFor,
  paginateArray,
  skipTake,
} from "@/lib/pagination";

describe("pagination — math limit/offset", () => {
  test("normalizePage : NaN, 0, négatif, vide → 1", () => {
    expect(normalizePage(NaN)).toBe(1);
    expect(normalizePage(0)).toBe(1);
    expect(normalizePage(-3)).toBe(1);
    expect(normalizePage(undefined)).toBe(1);
    expect(normalizePage("abc")).toBe(1);
    expect(normalizePage("2.9")).toBe(2);
  });

  test("normalizePageSize : invalide → 12", () => {
    expect(normalizePageSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
    expect(normalizePageSize(0)).toBe(DEFAULT_PAGE_SIZE);
    expect(normalizePageSize("x")).toBe(DEFAULT_PAGE_SIZE);
    expect(normalizePageSize(5)).toBe(5);
  });

  test("skipTake(1, 12) → skip 0 take 12", () => {
    expect(skipTake(1, 12)).toEqual({ skip: 0, take: 12 });
  });

  test("skipTake(2, 12) → skip 12 take 12", () => {
    expect(skipTake(2, 12)).toEqual({ skip: 12, take: 12 });
  });

  test("skipTake(3, 10) → skip 20 take 10", () => {
    expect(skipTake(3, 10)).toEqual({ skip: 20, take: 10 });
  });

  test("limitOffset / offsetFor cohérents", () => {
    expect(limitOffset(2, 8)).toEqual({ limit: 8, offset: 8 });
    expect(offsetFor(4, 8)).toBe(24);
  });

  test("computeTotalPages : ceil(total/pageSize)", () => {
    expect(computeTotalPages(0, 12)).toBe(0);
    expect(computeTotalPages(12, 12)).toBe(1);
    expect(computeTotalPages(13, 12)).toBe(2);
    expect(computeTotalPages(24, 12)).toBe(2);
    expect(computeTotalPages(25, 12)).toBe(3);
  });

  test("paginateArray découpe correctement", () => {
    const items = Array.from({ length: 30 }, (_, i) => i + 1);
    const p1 = paginateArray(items, 1, 12);
    expect(p1.items).toHaveLength(12);
    expect(p1.items[0]).toBe(1);
    expect(p1.items[11]).toBe(12);
    expect(p1.total).toBe(30);
    expect(p1.page).toBe(1);
    expect(p1.pageSize).toBe(12);
    expect(p1.totalPages).toBe(3);

    const p3 = paginateArray(items, 3, 12);
    expect(p3.items).toEqual([25, 26, 27, 28, 29, 30]);
    expect(p3.items).toHaveLength(6);
    expect(p3.page).toBe(3);

    const empty = paginateArray([], 1, 12);
    expect(empty.items).toEqual([]);
    expect(empty.total).toBe(0);
    expect(empty.totalPages).toBe(0);
  });
});