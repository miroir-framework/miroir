import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Formik } from "formik";
import { describe, expect, it, vi } from "vitest";

import {
  book5,
  reportBookDetails,
  reportBookList,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";

import { ReportSectionEntityInstance } from "../../src/miroir-fwk/4_view/components/Reports/ReportSectionEntityInstance.js";
import { waitForProgressiveRendering } from "./JzodElementEditorTestTools.js";
import {
  buildBookListFormikValues,
  buildBooksIndex,
  libraryApplicationDeploymentMap,
  ListTransformerIntegShell,
  renderBookListSectionInteg,
} from "./helpers/listTransformerIntegRig.js";

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

describe("virtual attributes display — Book citation", () => {
  it("BookList has no report runtimeTransformers", () => {
    expect(reportBookList.definition.runtimeTransformers).toBeUndefined();
  });

  it("BookList grid shows Citation for Rear Window without a report transformer", async () => {
    renderBookListSectionInteg(buildBookListFormikValues(buildBooksIndex(book5)));
    await waitForProgressiveRendering();

    await waitFor(() => {
      expect(screen.getByText("Citation")).toBeInTheDocument();
    });
    expect(screen.getByText("Rear Window (1942)")).toBeInTheDocument();
  });

  it("BookDetails shows read-only Citation for Rear Window without a report transformer", async () => {
    expect(reportBookDetails.definition.runtimeTransformers).toBeUndefined();
    expect(book5).not.toHaveProperty("citation");

    render(
      <ListTransformerIntegShell>
        <Formik
          initialValues={{
            [reportBookDetails.name]: reportBookDetails,
            book: book5,
          }}
          onSubmit={() => {}}
        >
          <ReportSectionEntityInstance
            valueObjectEditMode="update"
            applicationSection="data"
            application={selfApplicationLibrary.uuid}
            applicationDeploymentMap={libraryApplicationDeploymentMap}
            deploymentUuid={libraryApplicationDeploymentMap[selfApplicationLibrary.uuid]}
            formikValuePath={["book"]}
            formikReportDefinitionPathString={reportBookDetails.name}
            reportSectionPath={["definition", "section", "definition", 0]}
          />
        </Formik>
      </ListTransformerIntegShell>,
    );
    await waitForProgressiveRendering();

    await waitFor(() => {
      expect(screen.getByText("Rear Window (1942)")).toBeInTheDocument();
    });
    const citationField =
      screen.queryByDisplayValue("Rear Window (1942)") ??
      screen.getByText("Rear Window (1942)");
    if (citationField instanceof HTMLInputElement || citationField instanceof HTMLTextAreaElement) {
      expect(citationField).toHaveAttribute("readonly");
    }
  });
});
