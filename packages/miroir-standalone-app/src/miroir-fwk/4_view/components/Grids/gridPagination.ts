import { useCallback, useMemo, useState } from "react";
import { z } from "zod";

export const DEFAULT_GRID_PAGE_SIZE = 50;

// ##############################################################################################
// Sizing modes (D2-d): pageSize and maxRows are mutually exclusive.
// - paged: the grid pages; height exactly fits the current page's rows — no cap, no in-grid scrollbar.
// - scroll: no paging; the full row set is bound; height fits maxRows rows (theme maxHeight as outer cap).
export type GridSizingMode =
  | { mode: "paged"; pageSize: number }
  | { mode: "scroll"; maxRows: number };

export function resolveGridSizingMode(pageSize?: number, maxRows?: number): GridSizingMode {
  if (pageSize != null) {
    return { mode: "paged", pageSize };
  }
  if (maxRows != null) {
    return { mode: "scroll", maxRows };
  }
  return { mode: "paged", pageSize: DEFAULT_GRID_PAGE_SIZE };
}

/**
 * Sizing-mode prop variants (D2-d): pageSize and maxRows are mutually exclusive. Encoded as a
 * union of object variants (not an object-level refine) so the grid prop schemas stay ZodObjects
 * — a refine would turn them into ZodEffects and break their `.shape` / `.extend` consumers.
 * The variant receiving the *other* sizing prop types it as `never`, so providing both fails.
 */
const sizingModeXorMessage =
  "pageSize and maxRows are mutually exclusive sizing modes (D2-d): pageSize ⇒ paged mode, maxRows ⇒ scroll mode";

export const gridPagedSizingPropsSchema = z.object({
  sizing: z.literal("paged").optional(), // discriminator tag — optional: callers normally select the mode by passing pageSize
  pageSize: z
    .number()
    .int()
    .positive(), // Paged mode: rows per page, exact uncapped page height, pager, no in-grid scrollbar. Default 50
  maxRows: z.never({ invalid_type_error: sizingModeXorMessage }).optional(),
});

export const gridScrollSizingPropsSchema = z.object({
  sizing: z.literal("scroll").optional(), // discriminator tag — optional: callers normally select the mode by passing maxRows
  maxRows: z
    .number()
    .int()
    .positive(), // Scroll mode: no paging; height capped at maxRows rows; in-grid scrollbar over the full set
  pageSize: z.never({ invalid_type_error: sizingModeXorMessage }).optional(),
});

export const gridDefaultSizingPropsSchema = z.object({
  sizing: z.literal("default").optional(), // discriminator tag — neither sizing prop set: resolves to paged 50
  pageSize: z.never().optional(),
  maxRows: z.never().optional(),
});

/** Standalone validation surface for the sizing props — same variants the grid prop schemas are built from. */
export const gridSizingModePropsSchema = z.union([
  gridPagedSizingPropsSchema,
  gridScrollSizingPropsSchema,
  gridDefaultSizingPropsSchema,
]);

export type PaginatedRowsResult<T> = {
  pageRows: T[];
  pageCount: number;
  pageIndex: number;
  from: number;
  to: number;
  total: number;
};

export function paginateRows<T>(
  rows: readonly T[],
  pageIndex: number,
  pageSize: number,
): PaginatedRowsResult<T> {
  const total = rows.length;
  const pageCount = total === 0 ? 0 : Math.ceil(total / pageSize);
  const clampedPageIndex =
    pageCount === 0 ? 0 : Math.min(Math.max(0, pageIndex), pageCount - 1);
  const start = clampedPageIndex * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  const from = total === 0 ? 0 : start + 1;
  const to = total === 0 ? 0 : Math.min(total, start + pageSize);

  return {
    pageRows,
    pageCount,
    pageIndex: clampedPageIndex,
    from,
    to,
    total,
  };
}

export type ClientPaginationState = {
  pageIndex: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
  canPrev: boolean;
  canNext: boolean;
  next: () => void;
  prev: () => void;
  setPageIndex: (index: number) => void;
};

export function useClientPagination({
  totalCount,
  pageSize,
  resetKey,
}: {
  totalCount: number;
  resetKey?: string | number;
  pageSize: number;
}): ClientPaginationState {
  const [pageIndex, setPageIndex] = useState(0);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);

  if (resetKey !== undefined && resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setPageIndex(0);
  }

  const pageCount = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
  const clampedPageIndex =
    pageCount === 0 ? 0 : Math.min(Math.max(0, pageIndex), pageCount - 1);

  if (clampedPageIndex !== pageIndex) {
    setPageIndex(clampedPageIndex);
  }

  const from = totalCount === 0 ? 0 : clampedPageIndex * pageSize + 1;
  const to =
    totalCount === 0 ? 0 : Math.min(totalCount, (clampedPageIndex + 1) * pageSize);

  const next = useCallback(() => {
    setPageIndex((current) => Math.min(current + 1, Math.max(pageCount - 1, 0)));
  }, [pageCount]);

  const prev = useCallback(() => {
    setPageIndex((current) => Math.max(current - 1, 0));
  }, []);

  return useMemo(
    () => ({
      pageIndex: clampedPageIndex,
      pageCount,
      from,
      to,
      total: totalCount,
      canPrev: clampedPageIndex > 0,
      canNext: clampedPageIndex < pageCount - 1,
      next,
      prev,
      setPageIndex,
    }),
    [clampedPageIndex, from, next, pageCount, prev, to, totalCount],
  );
}

export type AgGridModeProps = {
  pagination: boolean;
  paginationPageSize?: number;
  domLayout: "normal" | "autoHeight";
};

/**
 * Maps the sizing mode onto ag-grid props.
 * Paged mode uses `domLayout="autoHeight"`: the grid sizes itself to the current page's rows —
 * no height estimate, no vertical virtualization window, no in-grid scrollbar. Scroll mode uses
 * `domLayout="normal"` with an explicit capped container height (see computeAgGridScrollHeight),
 * which ag-grid needs to avoid collapsing the body to 0 while rows scroll inside.
 */
export function agGridModeProps(sizing: GridSizingMode): AgGridModeProps {
  return sizing.mode === "paged"
    ? { pagination: true, paginationPageSize: sizing.pageSize, domLayout: "autoHeight" }
    : { pagination: false, domLayout: "normal" };
}

const GLIDE_HEADER_HEIGHT = 36;
const GLIDE_ROW_HEIGHT = 34;

export function parseThemeMaxHeight(maxHeight: string | number | undefined): number {
  if (typeof maxHeight === "number") {
    return maxHeight;
  }
  if (typeof maxHeight === "string" && maxHeight.endsWith("px")) {
    return Number.parseInt(maxHeight, 10);
  }
  return 600;
}

export function computeGlidePagedHeight(pageRowCount: number): number {
  return pageRowCount * GLIDE_ROW_HEIGHT + GLIDE_HEADER_HEIGHT;
}

export function computeGlideScrollHeight(
  totalRowCount: number,
  maxRows: number,
  propContainerHeight: number | undefined,
  themeMaxHeight: string | number | undefined,
): number {
  const visibleRowCount = Math.min(maxRows, totalRowCount);
  const maxHeight = propContainerHeight ?? parseThemeMaxHeight(themeMaxHeight);
  return Math.min(visibleRowCount * GLIDE_ROW_HEIGHT + GLIDE_HEADER_HEIGHT, maxHeight);
}

/** Alpine theme defaults used when estimating height for `domLayout="normal"` (scroll mode). */
const AG_GRID_HEADER_HEIGHT = 48;
const AG_GRID_ROW_HEIGHT = 42;

/** Scroll mode (D2-d): px estimate for `min(maxRows, total)` rows, capped by the theme maxHeight. */
export function computeAgGridScrollHeight(
  totalRowCount: number,
  maxRows: number,
  themeMaxHeight: string | number | undefined,
): number {
  const visibleRowCount = Math.min(maxRows, totalRowCount);
  return Math.min(
    visibleRowCount * AG_GRID_ROW_HEIGHT + AG_GRID_HEADER_HEIGHT,
    parseThemeMaxHeight(themeMaxHeight),
  );
}
