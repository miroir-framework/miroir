import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";

import { book1 } from "miroir-test-app_deployment-library";

import {
  expectPanelTransformerType,
  renderBookListSectionInteg,
  renderBookListSectionIntegWithCount,
  renderListTransformerPanelInteg,
  setPanelElementTransformerToMissingContextReference,
  setPanelElementTransformerType,
} from "./helpers/listTransformerIntegRig.js";
import { waitForProgressiveRendering } from "./JzodElementEditorTestTools.js";

vi.mock("../../src/miroir-fwk/4_view/components/JsonObjectEditFormDialog.js", () => ({
  JsonObjectEditFormDialog: () => null,
}));

vi.mock("miroir-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("miroir-react")>();
  return {
    ...actual,
    JsonDisplayHelper: () => null,
  };
});

const getTransformerToggle = () => screen.getByRole("button", { name: /functions/i });

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

describe("listDisplayByTransformer — integration (app-stack)", () => {
  describe("ReportSectionListDisplay + full provider stack", () => {
    it("shows list header with transformer toggle; panel hidden by default", async () => {
      renderBookListSectionInteg();
      await waitForProgressiveRendering();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Books" })).toBeInTheDocument();
      });
      expect(getTransformerToggle()).toBeInTheDocument();
      expect(screen.queryByTestId("list-transformer-panel")).not.toBeInTheDocument();
    });

    it("mounts the real panel below the grid with identity-transformed rows", async () => {
      renderBookListSectionInteg();

      await act(async () => {
        fireEvent.click(getTransformerToggle());
      });
      await waitForProgressiveRendering();

      expect(screen.getByTestId("list-transformer-panel")).toBeInTheDocument();
      expect(screen.getByText("Books — transformer")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("list-transformer-result")).toBeInTheDocument();
      });

      const resultRegion = screen.getByTestId("list-transformer-result");
      expect(within(resultRegion).getByText(book1.name, { exact: false })).toBeInTheDocument();
      // Declared result schema is concrete (not `any`) — no orange union-type stars on the result root.
      expect(resultRegion.querySelector('[data-testid^="union-type-star-transformationResult"]')).toBeNull();
    });

    it("unmounts the panel when toggled off and leaves the list grid rendered", async () => {
      renderBookListSectionInteg();
      await waitForProgressiveRendering();

      await act(async () => {
        fireEvent.click(getTransformerToggle());
      });
      await waitForProgressiveRendering();
      expect(screen.getByTestId("list-transformer-panel")).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(getTransformerToggle());
      });
      await waitForProgressiveRendering();

      expect(screen.queryByTestId("list-transformer-panel")).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Books" })).toBeInTheDocument();
      });
      expect(screen.getByText(book1.name, { exact: false })).toBeInTheDocument();
    });

    it("uses pageSize 10 while the transformer is enabled and restores default paging when disabled", async () => {
      renderBookListSectionIntegWithCount(60);
      await waitForProgressiveRendering();

      expect(
        document.querySelector(".ag-paging-row-summary-panel")?.textContent?.replace(/\s+/g, " "),
      ).toMatch(/1 to 50 of 60/);

      await act(async () => {
        fireEvent.click(getTransformerToggle());
      });
      await waitForProgressiveRendering();

      await waitFor(() => {
        expect(
          document.querySelector(".ag-paging-row-summary-panel")?.textContent?.replace(/\s+/g, " "),
        ).toMatch(/1 to 10 of 60/);
      });

      await act(async () => {
        fireEvent.click(getTransformerToggle());
      });
      await waitForProgressiveRendering();

      await waitFor(() => {
        expect(
          document.querySelector(".ag-paging-row-summary-panel")?.textContent?.replace(/\s+/g, " "),
        ).toMatch(/1 to 50 of 60/);
      });
    });

    it("transforms only rows from the currently displayed page", async () => {
      renderBookListSectionIntegWithCount(25);
      await waitForProgressiveRendering();

      await act(async () => {
        fireEvent.click(getTransformerToggle());
      });
      await waitForProgressiveRendering();

      await waitFor(
        () => {
          expect(screen.getByTestId("list-transformer-result")).toBeInTheDocument();
          const resultText = screen.getByTestId("list-transformer-result").textContent ?? "";
          expect(resultText).toContain("Book 01");
          expect(resultText).not.toContain("Book 11");
        },
        { timeout: 15000 },
      );

      await clickAgGridNextPage();

      await waitFor(
        () => {
          expect(
            document.querySelector(".ag-paging-row-summary-panel")?.textContent?.replace(/\s+/g, " "),
          ).toMatch(/11 to 20 of 25/);
          const resultText = screen.getByTestId("list-transformer-result").textContent ?? "";
          expect(resultText).toContain("Book 11");
          expect(resultText).not.toContain("Book 01");
        },
        { timeout: 15000 },
      );
    });
  });

  describe("ListTransformerPanel + real TypedValueObjectEditor", () => {
    it("recomputes the result when the transformer is edited via the real editor", async () => {
      renderListTransformerPanelInteg();

      await waitForProgressiveRendering();
      await waitFor(() => {
        expect(screen.getByTestId("list-transformer-result")).toBeInTheDocument();
      });

      await setPanelElementTransformerType("returnValue");

      await expectPanelTransformerType("returnValue");
    });

    it("surfaces transformer failure inline", async () => {
      renderListTransformerPanelInteg();

      await waitForProgressiveRendering();
      await setPanelElementTransformerToMissingContextReference();

      await waitFor(() => {
        expect(screen.getByText(/ReferenceNotFound/i)).toBeInTheDocument();
      });
      expect(screen.queryByTestId("list-transformer-result")).not.toBeInTheDocument();
    });
  });
});
