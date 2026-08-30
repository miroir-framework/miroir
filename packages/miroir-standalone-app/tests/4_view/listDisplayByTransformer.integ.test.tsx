import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";

import { book1, entityBook } from "miroir-test-app_deployment-library";

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

    it("defaults the output-type chooser to the row entity and shows no border for the identity transformer", async () => {
      renderBookListSectionInteg();

      await act(async () => {
        fireEvent.click(getTransformerToggle());
      });
      await waitForProgressiveRendering();

      await waitFor(() => {
        expect(screen.getByTestId("list-transformer-panel")).toBeInTheDocument();
      });
      expect(screen.getByTestId("list-transformer-given-input-type")).toHaveTextContent(
        entityBook.name,
      );
      expect(
        screen.getByTestId("list-transformer-given-input-type").querySelector("a"),
      ).toBeTruthy();
      const chooser = screen.getByTestId(
        "list-transformer-expected-output-type",
      ) as HTMLSelectElement;
      expect(chooser.value).toBe(entityBook.uuid);
      expect(
        screen.getByTestId("list-transformer-editor").getAttribute("data-transformer-inadequate"),
      ).toBe("false");
    });

    it("borders the transformer editor orange when expected output type mismatches inferred row output", async () => {
      renderBookListSectionInteg();

      await act(async () => {
        fireEvent.click(getTransformerToggle());
      });
      await waitForProgressiveRendering();
      await waitFor(() => {
        expect(screen.getByTestId("list-transformer-panel")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId("list-transformer-expected-output-type"), {
        target: { value: "array" },
      });

      await waitFor(
        () => {
          expect(
            screen
              .getByTestId("list-transformer-editor")
              .getAttribute("data-transformer-inadequate"),
          ).toBe("true");
        },
        { timeout: 15000 },
      );
    });

    it("borders the transformer editor orange when the transformer input does not accept rows", async () => {
      renderBookListSectionInteg();

      await act(async () => {
        fireEvent.click(getTransformerToggle());
      });
      await waitForProgressiveRendering();
      await waitFor(() => {
        expect(screen.getByTestId("list-transformer-panel")).toBeInTheDocument();
      });

      // mustacheStringTemplate declares input "string" — Book entity rows do not fit
      await setPanelElementTransformerType("mustacheStringTemplate");
      await expectPanelTransformerType("mustacheStringTemplate");

      await waitFor(
        () => {
          expect(
            screen
              .getByTestId("list-transformer-editor")
              .getAttribute("data-transformer-inadequate"),
          ).toBe("true");
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

    it("keeps the chooser at any and never marks inadequacy when no row entity is provided", async () => {
      renderListTransformerPanelInteg();

      await waitForProgressiveRendering();
      await waitFor(() => {
        expect(screen.getByTestId("list-transformer-panel")).toBeInTheDocument();
      });

      expect(screen.getByTestId("list-transformer-given-input-type")).toHaveTextContent("any");
      const chooser = screen.getByTestId(
        "list-transformer-expected-output-type",
      ) as HTMLSelectElement;
      expect(chooser.value).toBe("any");
      expect(
        screen.getByTestId("list-transformer-editor").getAttribute("data-transformer-inadequate"),
      ).toBe("false");
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
