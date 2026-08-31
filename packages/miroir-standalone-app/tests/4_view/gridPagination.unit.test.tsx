import "@testing-library/jest-dom";
import { act, fireEvent, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { book1 } from "miroir-test-app_deployment-library";

import { tableComponentCorePropsSchema } from "../../src/miroir-fwk/4_view/components/Grids/EntityInstanceGridInterface.js";
import { valueObjectGridPropsSchema } from "../../src/miroir-fwk/4_view/components/Grids/ValueObjectGridInterface.js";
import {
  agGridModeProps,
  computeAgGridScrollHeight,
  computeGlidePagedHeight,
  computeGlideScrollHeight,
  gridDefaultSizingPropsSchema,
  gridPagedSizingPropsSchema,
  gridScrollSizingPropsSchema,
  gridSizingModePropsSchema,
  paginateRows,
  resolveGridSizingMode,
  useClientPagination,
} from "../../src/miroir-fwk/4_view/components/Grids/gridPagination.js";
import { waitForProgressiveRendering } from "./JzodElementEditorTestTools.js";
import {
  renderEntityInstanceGridHarness,
  renderGlideDataGridHarness,
  renderJsonArrayGridHarness,
} from "./helpers/gridPaginationIntegRig.js";

function buildBookRows(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    ...book1,
    uuid: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    name: `Book ${index + 1}`,
  }));
}

describe("gridPagination — prop contracts and viewport baseline", () => {
  it("declares pageSize and maxRows as mutually exclusive variants of the core props schema (D2-d)", () => {
    // the core schema is a union of paged / scroll / default variants
    expect(tableComponentCorePropsSchema.options).toHaveLength(3);
    for (const variant of tableComponentCorePropsSchema.options) {
      expect(variant.shape.pageSize).toBeDefined();
      expect(variant.shape.maxRows).toBeDefined();
    }
  });

  it("declares pageSize and maxRows as mutually exclusive variants of the ValueObjectGrid props schema (D2-d)", () => {
    expect(valueObjectGridPropsSchema.options).toHaveLength(3);
    for (const variant of valueObjectGridPropsSchema.options) {
      expect(variant.shape.pageSize).toBeDefined();
      expect(variant.shape.maxRows).toBeDefined();
    }
  });

  it("enforces sizing-mode XOR and positive integer pageSize (D2-d)", () => {
    // both set → invalid (modes are mutually exclusive)
    expect(gridSizingModePropsSchema.safeParse({ pageSize: 50, maxRows: 10 }).success).toBe(false);
    // each alone or neither → valid
    expect(gridSizingModePropsSchema.safeParse({ pageSize: 50 }).success).toBe(true);
    expect(gridSizingModePropsSchema.safeParse({ maxRows: 10 }).success).toBe(true);
    expect(gridSizingModePropsSchema.safeParse({}).success).toBe(true);
    // non-positive / non-integer pageSize → invalid
    expect(gridSizingModePropsSchema.safeParse({ pageSize: 0 }).success).toBe(false);
    expect(gridSizingModePropsSchema.safeParse({ pageSize: -1 }).success).toBe(false);
    expect(gridSizingModePropsSchema.safeParse({ pageSize: 2.5 }).success).toBe(false);
    // variant level: the paged variant itself rejects maxRows, the scroll variant rejects pageSize
    expect(gridPagedSizingPropsSchema.safeParse({ pageSize: 50, maxRows: 10 }).success).toBe(false);
    expect(gridPagedSizingPropsSchema.safeParse({ pageSize: 50 }).success).toBe(true);
    expect(gridScrollSizingPropsSchema.safeParse({ maxRows: 10, pageSize: 50 }).success).toBe(false);
    expect(gridScrollSizingPropsSchema.safeParse({ maxRows: 10 }).success).toBe(true);
    expect(gridDefaultSizingPropsSchema.safeParse({ pageSize: 50 }).success).toBe(false);
    expect(gridDefaultSizingPropsSchema.safeParse({}).success).toBe(true);
    // discriminator tag: optional; when present it must be consistent with the sizing prop
    expect(gridPagedSizingPropsSchema.shape.sizing.safeParse("paged").success).toBe(true);
    expect(gridScrollSizingPropsSchema.shape.sizing.safeParse("scroll").success).toBe(true);
    expect(gridDefaultSizingPropsSchema.shape.sizing.safeParse("default").success).toBe(true);
    expect(gridSizingModePropsSchema.safeParse({ sizing: "paged", pageSize: 50 }).success).toBe(true);
    expect(gridSizingModePropsSchema.safeParse({ sizing: "scroll", maxRows: 10 }).success).toBe(true);
    expect(gridSizingModePropsSchema.safeParse({ sizing: "scroll", pageSize: 50 }).success).toBe(false);
    expect(gridSizingModePropsSchema.safeParse({ sizing: "paged", maxRows: 10 }).success).toBe(false);
    expect(gridSizingModePropsSchema.safeParse({ sizing: "paged" }).success).toBe(false); // paged requires pageSize
  });

  it("constrains pageSize as a positive integer on the grid prop schemas", () => {
    // within each union, the variant exposing pageSize (resp. maxRows) as a number carries the constraint
    const corePaged = tableComponentCorePropsSchema.options.find(
      (variant) => variant.shape.pageSize instanceof z.ZodNumber
    );
    const coreScroll = tableComponentCorePropsSchema.options.find(
      (variant) => variant.shape.maxRows instanceof z.ZodNumber
    );
    const valueObjectPaged = valueObjectGridPropsSchema.options.find(
      (variant) => variant.shape.pageSize instanceof z.ZodNumber
    );
    const valueObjectScroll = valueObjectGridPropsSchema.options.find(
      (variant) => variant.shape.maxRows instanceof z.ZodNumber
    );
    expect(corePaged).toBeDefined();
    expect(coreScroll).toBeDefined();
    expect(valueObjectPaged).toBeDefined();
    expect(valueObjectScroll).toBeDefined();
    expect(corePaged?.shape.pageSize.safeParse(0).success).toBe(false);
    expect(valueObjectPaged?.shape.pageSize.safeParse(2.5).success).toBe(false);
    expect(corePaged?.shape.pageSize.safeParse(20).success).toBe(true);
    expect(valueObjectScroll?.shape.maxRows.safeParse(10).success).toBe(true);
  });

  it("forwards pageSize through the JSON_ARRAY path to ValueObjectGrid", async () => {
    renderJsonArrayGridHarness({ count: 60, pageSize: 20 });
    await waitForProgressiveRendering();

    const summary = document.querySelector(".ag-paging-row-summary-panel");
    expect(summary?.textContent?.replace(/\s+/g, " ")).toMatch(/1 to 20 of 60/);
  });

  describe("ag-grid EntityInstanceGrid viewport", () => {
    it("paged mode uses autoHeight: no fixed container height (D2-d)", async () => {
      renderEntityInstanceGridHarness({ bookCount: 10 });
      await waitForProgressiveRendering();

      const gridContainer = document.getElementById("entity-instance-ag-grid");
      expect(gridContainer).toBeInTheDocument();
      // autoHeight: ag-grid sizes itself to the page's rows — no explicit px height, no in-grid scroll
      expect(gridContainer?.style.height ?? "").not.toMatch(/^\d+px$/);
    });

    it("maxRows alone selects scroll mode: no pager (D2-d)", async () => {
      renderEntityInstanceGridHarness({ bookCount: 60, maxRows: 10 });
      await waitForProgressiveRendering();

      // ag-grid keeps the panel node mounted but hidden (ag-hidden, aria-hidden) when pagination is off
      const panel = document.querySelector(".ag-paging-panel");
      expect(panel === null || panel.classList.contains("ag-hidden")).toBe(true);
    });
  });

  describe("GlideDataGridComponent viewport", () => {
    it("uses exact height for short lists (10 rows)", async () => {
      renderGlideDataGridHarness({ bookCount: 10 });
      await waitForProgressiveRendering();

      const container = document.querySelector(".glide-data-grid-grid-container");
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute("data-page-rows", "10");
      expect(screen.queryByTestId("grid-pagination-toolbar")).not.toBeInTheDocument();
    });
  });
});

describe("gridPagination — shared pagination primitives", () => {
  describe("paginateRows", () => {
    it("returns the first page", () => {
      const rows = buildBookRows(60);
      const result = paginateRows(rows, 0, 50);
      expect(result.pageRows).toHaveLength(50);
      expect(result.from).toBe(1);
      expect(result.to).toBe(50);
      expect(result.total).toBe(60);
      expect(result.pageCount).toBe(2);
    });

    it("returns the last short page", () => {
      const rows = buildBookRows(60);
      const result = paginateRows(rows, 1, 50);
      expect(result.pageRows).toHaveLength(10);
      expect(result.from).toBe(51);
      expect(result.to).toBe(60);
      expect(result.pageIndex).toBe(1);
    });

    it("handles empty input and single-page totals", () => {
      expect(paginateRows([], 0, 50).pageCount).toBe(0);
      const singlePage = paginateRows(buildBookRows(10), 0, 50);
      expect(singlePage.pageCount).toBe(1);
      expect(singlePage.pageRows).toHaveLength(10);
    });

    it("clamps out-of-range page indices", () => {
      const rows = buildBookRows(60);
      const result = paginateRows(rows, 99, 50);
      expect(result.pageIndex).toBe(1);
      expect(result.pageRows).toHaveLength(10);
    });
  });

  describe("useClientPagination", () => {
    it("steps next/prev within boundaries", () => {
      const { result } = renderHook(() =>
        useClientPagination({ totalCount: 60, pageSize: 50 }),
      );

      expect(result.current.canPrev).toBe(false);
      expect(result.current.canNext).toBe(true);
      expect(result.current.from).toBe(1);
      expect(result.current.to).toBe(50);

      act(() => {
        result.current.next();
      });
      expect(result.current.pageIndex).toBe(1);
      expect(result.current.from).toBe(51);
      expect(result.current.to).toBe(60);
      expect(result.current.canNext).toBe(false);

      act(() => {
        result.current.prev();
      });
      expect(result.current.pageIndex).toBe(0);
    });

    it("clamps when totalCount shrinks", () => {
      const { result, rerender } = renderHook(
        ({ totalCount }: { totalCount: number }) =>
          useClientPagination({ totalCount, pageSize: 50 }),
        { initialProps: { totalCount: 60 } },
      );

      act(() => {
        result.current.next();
      });
      expect(result.current.pageIndex).toBe(1);

      rerender({ totalCount: 15 });
      expect(result.current.pageIndex).toBe(0);
      expect(result.current.pageCount).toBe(1);
    });

    it("resets to page 0 when resetKey changes", () => {
      const { result, rerender } = renderHook(
        ({ resetKey }: { resetKey: string }) =>
          useClientPagination({ totalCount: 60, pageSize: 50, resetKey }),
        { initialProps: { resetKey: "a" } },
      );

      act(() => {
        result.current.next();
      });
      expect(result.current.pageIndex).toBe(1);

      rerender({ resetKey: "b" });
      expect(result.current.pageIndex).toBe(0);
    });
  });
});

describe("gridPagination — sizing modes (D2-d)", () => {
  describe("resolveGridSizingMode", () => {
    it("defaults to paged mode at 50 when neither prop is set", () => {
      expect(resolveGridSizingMode(undefined, undefined)).toEqual({
        mode: "paged",
        pageSize: 50,
      });
    });

    it("selects paged mode when pageSize is set", () => {
      expect(resolveGridSizingMode(20, undefined)).toEqual({ mode: "paged", pageSize: 20 });
    });

    it("selects scroll mode when only maxRows is set", () => {
      expect(resolveGridSizingMode(undefined, 10)).toEqual({ mode: "scroll", maxRows: 10 });
    });

    it("prefers paged mode defensively when both are set", () => {
      // façades reject both-set at the prop schema (Slice 8); the resolver never produces a hybrid
      expect(resolveGridSizingMode(20, 10)).toEqual({ mode: "paged", pageSize: 20 });
    });
  });

  describe("Glide paged-mode height", () => {
    it("is exact and uncapped by the theme maxHeight", () => {
      // D2-d: paged mode has no height cap — a full 50-row page is 1736px, not min(1736, 600)
      expect(computeGlidePagedHeight(50)).toBe(50 * 34 + 36);
      expect(computeGlidePagedHeight(10)).toBe(10 * 34 + 36);
      expect(computeGlidePagedHeight(0)).toBe(36);
    });
  });

  describe("Glide scroll-mode height", () => {
    it("fits maxRows rows exactly, capped by the theme maxHeight", () => {
      expect(computeGlideScrollHeight(60, 10, undefined, "600px")).toBe(10 * 34 + 36);
      expect(computeGlideScrollHeight(5, 10, undefined, "600px")).toBe(5 * 34 + 36);
      expect(computeGlideScrollHeight(200, 100, undefined, "600px")).toBe(600);
    });

    it("lets containerHeight override the theme cap", () => {
      expect(computeGlideScrollHeight(200, 100, 800, "600px")).toBe(800);
    });
  });
});

describe("gridPagination — ag-grid sizing modes (D2-d)", () => {
  it("computes scroll height from maxRows, capped by the theme maxHeight", () => {
    expect(computeAgGridScrollHeight(60, 10, "600px")).toBe(Math.min(10 * 42 + 48, 600));
    expect(computeAgGridScrollHeight(5, 10, "600px")).toBe(5 * 42 + 48);
    expect(computeAgGridScrollHeight(200, 100, "600px")).toBe(600);
  });

  it("maps the sizing mode onto ag-grid props", () => {
    // paged: autoHeight — the grid sizes itself to the current page's rows (no estimate, no in-grid scroll)
    expect(agGridModeProps({ mode: "paged", pageSize: 20 })).toEqual({
      pagination: true,
      paginationPageSize: 20,
      paginationPageSizeSelector: false,
      domLayout: "autoHeight",
    });
    expect(agGridModeProps({ mode: "scroll", maxRows: 10 })).toEqual({
      pagination: false,
      domLayout: "normal",
    });
  });

  it("paged mode uses autoHeight: grid self-sizes to the page's rows, no fixed container height", async () => {
    renderEntityInstanceGridHarness({ bookCount: 60, pageSize: 50 });
    await waitForProgressiveRendering();

    const gridContainer = document.getElementById("entity-instance-ag-grid");
    expect(gridContainer?.style.height ?? "").not.toMatch(/^\d+px$/);
    expect(document.querySelectorAll(".ag-row").length).toBeGreaterThan(0);
  });

  it("paged mode renders exactly the short last page's rows (autoHeight)", async () => {
    renderEntityInstanceGridHarness({ bookCount: 60, pageSize: 50 });
    await waitForProgressiveRendering();

    const nextButton = document.querySelector(
      '.ag-paging-button[aria-label="Next Page"]',
    ) as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(nextButton);
    });
    await waitForProgressiveRendering();

    await waitFor(() => {
      expect(document.querySelectorAll(".ag-row").length).toBe(10);
    });
    const summary = document.querySelector(".ag-paging-row-summary-panel");
    expect(summary?.textContent?.replace(/\s+/g, " ")).toMatch(/51 to 60 of 60/);
  });

  it("scroll mode caps height at maxRows rows", async () => {
    renderEntityInstanceGridHarness({ bookCount: 60, maxRows: 10 });
    await waitForProgressiveRendering();

    const gridContainer = document.getElementById("entity-instance-ag-grid");
    expect(gridContainer?.style.height).toBe(`${Math.min(10 * 42 + 48, 600)}px`);
  });

  it("uses exact Glide height for the short last page", async () => {
    renderGlideDataGridHarness({ bookCount: 60, pageSize: 50 });
    await waitForProgressiveRendering();

    await act(async () => {
      fireEvent.click(screen.getByTestId("grid-pagination-next"));
    });
    await waitForProgressiveRendering();

    const container = document.querySelector(".glide-data-grid-grid-container");
    expect(container).toHaveAttribute("data-page-rows", "10");
    expect((container as HTMLElement).style.height).toBe(`${10 * 34 + 36}px`);
  });
});
