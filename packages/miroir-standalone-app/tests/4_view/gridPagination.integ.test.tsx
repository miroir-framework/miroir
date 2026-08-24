import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { waitForProgressiveRendering } from "./JzodElementEditorTestTools.js";
import {
  GlideDataGridHarness,
  GridPaginationIntegShell,
  renderEntityInstanceGridHarness,
  renderGlideDataGridHarness,
  renderValueObjectGridHarness,
} from "./helpers/gridPaginationIntegRig.js";
import { renderBookListSectionIntegWithCount } from "./helpers/listTransformerIntegRig.js";

vi.mock("../../src/miroir-fwk/4_view/components/JsonObjectEditFormDialog.js", () => ({
  JsonObjectEditFormDialog: () => null,
}));

async function clickAgGridNextPage() {
  const nextButton = document.querySelector(
    '.ag-paging-button[aria-label="Next Page"]',
  ) as HTMLButtonElement | null;

  if (!nextButton) {
    throw new Error("ag-grid next paging button not found");
  }

  await act(async () => {
    fireEvent.click(nextButton);
  });
  await waitForProgressiveRendering();
}

async function clickGlideNextPage() {
  await act(async () => {
    fireEvent.click(screen.getByTestId("grid-pagination-next"));
  });
  await waitForProgressiveRendering();
}

describe("gridPagination — ag-grid native pagination tracer", () => {
  it("pages a 60-row report list section via ReportSectionListDisplay", async () => {
    renderBookListSectionIntegWithCount(60);
    await waitForProgressiveRendering();

    expect(document.querySelector(".ag-paging-panel")).toBeInTheDocument();
    expect(
      document.querySelector(".ag-paging-row-summary-panel")?.textContent?.replace(/\s+/g, " "),
    ).toMatch(/1 to 50 of 60/);

    await clickAgGridNextPage();

    await waitFor(() => {
      expect(
        document.querySelector(".ag-paging-row-summary-panel")?.textContent?.replace(/\s+/g, " "),
      ).toMatch(/51 to 60 of 60/);
    });
  });

  it("shows disabled pager controls when total rows fit one page", async () => {
    renderEntityInstanceGridHarness({ bookCount: 10 });
    await waitForProgressiveRendering();

    const nextButton = document.querySelector(
      '.ag-paging-button[aria-label="Next Page"]',
    ) as HTMLButtonElement | null;
    expect(nextButton).toBeInTheDocument();
    expect(nextButton?.classList.contains("ag-disabled")).toBe(true);
  });

  it("honors explicit pageSize={20}", async () => {
    renderEntityInstanceGridHarness({ bookCount: 60, pageSize: 20 });
    await waitForProgressiveRendering();

    const summary = document.querySelector(".ag-paging-row-summary-panel");
    expect(summary?.textContent?.replace(/\s+/g, " ")).toMatch(/1 to 20 of 60/);
  });
});

describe("gridPagination — Glide custom pager", () => {
  it("pages 60 rows with Miroir toolbar and page slice", async () => {
    renderGlideDataGridHarness({ bookCount: 60 });
    await waitForProgressiveRendering();

    expect(screen.getByTestId("grid-pagination-toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("grid-pagination-range")).toHaveTextContent(
      "Showing 1–50 of 60",
    );

    const container = document.querySelector(".glide-data-grid-grid-container");
    expect(container).toHaveAttribute("data-page-rows", "50");

    await clickGlideNextPage();

    expect(screen.getByTestId("grid-pagination-range")).toHaveTextContent(
      "Showing 51–60 of 60",
    );
    expect(container).toHaveAttribute("data-page-rows", "10");
  });

  it("hides the pager when everything fits one page", async () => {
    renderGlideDataGridHarness({ bookCount: 10 });
    await waitForProgressiveRendering();

    expect(screen.queryByTestId("grid-pagination-toolbar")).not.toBeInTheDocument();
  });

  it("clamps page when the filtered row set shrinks", async () => {
    const { rerender } = render(
      <GridPaginationIntegShell>
        <GlideDataGridHarness bookCount={60} />
      </GridPaginationIntegShell>,
    );
    await waitForProgressiveRendering();

    await clickGlideNextPage();
    expect(screen.getByTestId("grid-pagination-range")).toHaveTextContent(
      "Showing 51–60 of 60",
    );

    rerender(
      <GridPaginationIntegShell>
        <GlideDataGridHarness bookCount={55} />
      </GridPaginationIntegShell>,
    );
    await waitForProgressiveRendering();

    expect(screen.getByTestId("grid-pagination-range")).toHaveTextContent(
      "Showing 1–50 of 55",
    );
  });
});

describe("gridPagination — Glide sizing modes (D2-d)", () => {
  it("paged mode renders a full page at exact uncapped height (no 600px cap)", async () => {
    renderGlideDataGridHarness({ bookCount: 60 });
    await waitForProgressiveRendering();

    expect(screen.getByTestId("grid-pagination-range")).toHaveTextContent(
      "Showing 1–50 of 60",
    );
    const container = document.querySelector(".glide-data-grid-grid-container") as HTMLElement;
    expect(container).toHaveAttribute("data-page-rows", "50");
    expect(container.style.height).toBe(`${50 * 34 + 36}px`);
  });

  it("scroll mode binds the full set, caps height at maxRows rows, hides the pager", async () => {
    renderGlideDataGridHarness({ bookCount: 60, maxRows: 10 });
    await waitForProgressiveRendering();

    expect(screen.queryByTestId("grid-pagination-toolbar")).not.toBeInTheDocument();
    const container = document.querySelector(".glide-data-grid-grid-container") as HTMLElement;
    expect(container).toHaveAttribute("data-page-rows", "60");
    expect(container.style.height).toBe(`${10 * 34 + 36}px`);
  });

  it("scroll mode caps height at the theme maxHeight for large maxRows", async () => {
    renderGlideDataGridHarness({ bookCount: 200, maxRows: 100 });
    await waitForProgressiveRendering();

    const container = document.querySelector(".glide-data-grid-grid-container") as HTMLElement;
    expect(container).toHaveAttribute("data-page-rows", "200");
    expect(container.style.height).toBe("600px");
  });
});

describe("gridPagination — ValueObjectGrid both backends", () => {
  it("pages on ag-grid with native pager", async () => {
    renderValueObjectGridHarness({ count: 60, gridType: "ag-grid" });
    await waitForProgressiveRendering();

    expect(document.querySelector(".ag-paging-panel")).toBeInTheDocument();
    expect(
      document.querySelector(".ag-paging-row-summary-panel")?.textContent?.replace(/\s+/g, " "),
    ).toMatch(/1 to 50 of 60/);

    await clickAgGridNextPage();

    await waitFor(() => {
      expect(
        document.querySelector(".ag-paging-row-summary-panel")?.textContent?.replace(/\s+/g, " "),
      ).toMatch(/51 to 60 of 60/);
    });
  });

  it("pages on glide-data-grid with Miroir pager", async () => {
    renderValueObjectGridHarness({ count: 60, gridType: "glide-data-grid" });
    await waitForProgressiveRendering();

    expect(screen.getByTestId("grid-pagination-range")).toHaveTextContent(
      "Showing 1–50 of 60",
    );

    await clickGlideNextPage();

    expect(screen.getByTestId("grid-pagination-range")).toHaveTextContent(
      "Showing 51–60 of 60",
    );
  });

  it("honors pageSize={20} on both backends", async () => {
    renderValueObjectGridHarness({ count: 60, gridType: "ag-grid", pageSize: 20 });
    await waitForProgressiveRendering();
    expect(
      document.querySelector(".ag-paging-row-summary-panel")?.textContent?.replace(/\s+/g, " "),
    ).toMatch(/1 to 20 of 60/);

    renderValueObjectGridHarness({ count: 60, gridType: "glide-data-grid", pageSize: 20 });
    await waitForProgressiveRendering();
    expect(screen.getByTestId("grid-pagination-range")).toHaveTextContent(
      "Showing 1–20 of 60",
    );
  });

  it("scroll mode on both backends: maxRows={10} shows no pager", async () => {
    renderValueObjectGridHarness({ count: 60, gridType: "ag-grid", maxRows: 10 });
    await waitForProgressiveRendering();
    // ag-grid keeps the panel node mounted but hidden (ag-hidden) when pagination is off
    const agPanel = document.querySelector(".ag-paging-panel");
    expect(agPanel === null || agPanel.classList.contains("ag-hidden")).toBe(true);

    renderValueObjectGridHarness({ count: 60, gridType: "glide-data-grid", maxRows: 10 });
    await waitForProgressiveRendering();
    expect(screen.queryByTestId("grid-pagination-toolbar")).not.toBeInTheDocument();
    expect(document.querySelector(".glide-data-grid-grid-container")).toHaveAttribute(
      "data-page-rows",
      "60",
    );
  });
});
