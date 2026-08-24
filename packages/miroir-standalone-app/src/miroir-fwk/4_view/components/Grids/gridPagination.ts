import { useCallback, useMemo, useState } from "react";

export const DEFAULT_GRID_PAGE_SIZE = 50;
export const DEFAULT_GRID_MAX_ROWS = 50;

export type PaginatedRowsResult<T> = {
  pageRows: T[];
  pageCount: number;
  pageIndex: number;
  from: number;
  to: number;
  total: number;
};

export function resolvePageSize(pageSize?: number): number {
  return pageSize ?? DEFAULT_GRID_PAGE_SIZE;
}

export function resolveMaxRows(maxRows?: number): number {
  return maxRows ?? DEFAULT_GRID_MAX_ROWS;
}

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

export function agGridPaginationProps(pageSize?: number) {
  const resolvedPageSize = resolvePageSize(pageSize);
  return {
    pagination: true,
    paginationPageSize: resolvedPageSize,
    domLayout: "normal" as const,
  };
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

export function computeGlideGridHeight(
  pageRowCount: number,
  maxRows: number | undefined,
  propContainerHeight: number | undefined,
  themeMaxHeight: string | number | undefined,
): number {
  const threshold = resolveMaxRows(maxRows);
  const maxHeight = propContainerHeight ?? parseThemeMaxHeight(themeMaxHeight);

  if (pageRowCount > threshold) {
    return Math.min(window.innerHeight * 0.5, maxHeight);
  }

  const calculatedHeight = pageRowCount * GLIDE_ROW_HEIGHT + GLIDE_HEADER_HEIGHT;
  return Math.min(calculatedHeight, maxHeight);
}

export function shouldUseFixedAgGridViewport(
  pageRowCount: number,
  maxRows: number | undefined,
): boolean {
  return pageRowCount > resolveMaxRows(maxRows);
}
