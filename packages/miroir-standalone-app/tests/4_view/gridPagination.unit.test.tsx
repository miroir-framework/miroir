import "@testing-library/jest-dom";
import { act, fireEvent, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { book1 } from "miroir-test-app_deployment-library";

import { tableComponentCorePropsSchema } from "../../src/miroir-fwk/4_view/components/Grids/EntityInstanceGridInterface.js";
import { valueObjectGridPropsSchema } from "../../src/miroir-fwk/4_view/components/Grids/ValueObjectGridInterface.js";
import {
  computeGlideGridHeight,
  paginateRows,
  useClientPagination,
} from "../../src/miroir-fwk/4_view/components/Grids/gridPagination.js";
import { waitForProgressiveRendering } from "./JzodElementEditorTestTools.js";
import {
  renderEntityInstanceGridHarness,
  renderGlideDataGridHarness,
} from "./helpers/gridPaginationIntegRig.js";

function buildBookRows(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    ...book1,
    uuid: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    name: `Book ${index + 1}`,
  }));
}

describe("gridPagination — prop contracts and viewport baseline", () => {
  it("declares independent pageSize and maxRows on EntityInstanceGrid props", () => {
    const shape = tableComponentCorePropsSchema.shape;
    expect(shape.pageSize).toBeDefined();
    expect(shape.maxRows).toBeDefined();
  });

  it("declares independent pageSize and maxRows on ValueObjectGrid props", () => {
    const shape = valueObjectGridPropsSchema.shape;
    expect(shape.pageSize).toBeDefined();
    expect(shape.maxRows).toBeDefined();
  });

  describe("ag-grid EntityInstanceGrid viewport", () => {
    it("uses minHeight for short lists (10 rows)", async () => {
      renderEntityInstanceGridHarness({ bookCount: 10 });
      await waitForProgressiveRendering();

      const gridContainer = document.getElementById("entity-instance-ag-grid");
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer?.style.height).not.toBe("50vh");
      expect(gridContainer?.style.minHeight).toBeTruthy();
    });

    it("does not apply maxRows as page size (D2-c independence)", async () => {
      renderEntityInstanceGridHarness({ bookCount: 60, maxRows: 10 });
      await waitForProgressiveRendering();

      expect(document.querySelector(".ag-paging-panel")).toBeInTheDocument();
      expect(document.querySelector(".ag-paging-row-summary-panel")?.textContent?.replace(/\s+/g, " ")).toMatch(
        /1 to 50 of 60/,
      );
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

describe("gridPagination — height alignment (D2-c)", () => {
  it("computes exact Glide height for a full page within theme max", () => {
    const height = computeGlideGridHeight(50, 50, undefined, "600px");
    expect(height).toBe(Math.min(50 * 34 + 36, 600));
  });

  it("caps Glide height when page rows exceed maxRows", () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    const height = computeGlideGridHeight(50, 10, undefined, "600px");
    expect(height).toBe(Math.min(window.innerHeight * 0.5, 600));
  });

  it("uses minHeight (not 50vh) for a 50-row ag-grid page", async () => {
    renderEntityInstanceGridHarness({ bookCount: 60, pageSize: 50 });
    await waitForProgressiveRendering();

    const gridContainer = document.getElementById("entity-instance-ag-grid");
    expect(gridContainer?.style.height).not.toBe("50vh");
    expect(gridContainer?.style.minHeight).toBeTruthy();
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

  it("applies maxRows as viewport cap independent from pageSize", async () => {
    renderEntityInstanceGridHarness({ bookCount: 60, pageSize: 50, maxRows: 10 });
    await waitForProgressiveRendering();

    const gridContainer = document.getElementById("entity-instance-ag-grid");
    expect(gridContainer?.style.height).toBe("50vh");
  });
});
