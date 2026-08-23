import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Formik, useFormikContext } from "formik";
import { describe, expect, it, vi } from "vitest";

import { book1 } from "miroir-test-app_deployment-library";

import { ReportSectionListDisplay } from "../../src/miroir-fwk/4_view/components/Reports/ReportSectionListDisplay.js";
import {
  buildBookListFormikValues,
  buildBooksIndex,
  libraryApplicationDeploymentMap,
  ListTransformerIntegShell,
  renderBookListSectionInteg,
  renderListTransformerPanelInteg,
  reportBookListSectionPath,
} from "./helpers/listTransformerIntegRig.js";
import { waitForProgressiveRendering } from "./JzodElementEditorTestTools.js";
import { TableComponentTypeSchema } from "../../src/miroir-fwk/4_view/components/Grids/EntityInstanceGridInterface.js";
import {
  deployment_Library_DO_NO_USE,
  reportBookList,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";

vi.mock("../../src/miroir-fwk/4_view/components/JsonObjectEditFormDialog.js", () => ({
  JsonObjectEditFormDialog: () => null,
}));

const getTransformerToggle = () => screen.getByRole("button", { name: /functions/i });

function ParentFormikValuesObserver({
  onValues,
}: {
  onValues: (values: Record<string, unknown>) => void;
}) {
  onValues(useFormikContext<Record<string, unknown>>().values);
  return null;
}

async function setPanelElementTransformerType(transformerType: string) {
  const transformerTypeSelect = await waitFor(() => {
    const selects = screen.getAllByRole("combobox");
    const match = selects.find((el) => (el as HTMLSelectElement).value === "getFromContext");
    if (!match) {
      throw new Error("transformerType combobox (getFromContext) not found yet");
    }
    return match;
  });

  await act(async () => {
    fireEvent.change(transformerTypeSelect, { target: { value: transformerType } });
  });
  await waitForProgressiveRendering();
}

async function setPanelElementTransformerToMissingContextReference() {
  const referenceInput = await waitFor(() => {
    const inputs = screen.getAllByRole("textbox");
    const match = inputs.find((el) => (el as HTMLInputElement).name?.includes("referenceName"));
    if (!match) {
      throw new Error("referenceName textbox not found yet");
    }
    return match;
  });

  await act(async () => {
    fireEvent.change(referenceInput, { target: { value: "missingRef" } });
    fireEvent.blur(referenceInput);
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

      await waitFor(() => {
        expect(screen.getByDisplayValue("returnValue")).toBeInTheDocument();
      });
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

  describe("loop-safety", () => {
    it("keeps panel transformer state when parent report Formik reinitializes", async () => {
      const initialValues = buildBookListFormikValues();
      const refreshedValues = {
        ...buildBookListFormikValues(buildBooksIndex(book1)),
        books: buildBooksIndex(book1),
      };

      const { rerender } = render(
        <ListTransformerIntegShell>
          <Formik enableReinitialize initialValues={initialValues} onSubmit={() => {}}>
            <ReportSectionListDisplay
              label="Books"
              paramsAsdomainElements={{}}
              applicationDeploymentMap={libraryApplicationDeploymentMap}
              formikReportDefinitionPathString={reportBookList.name}
              reportSectionPath={[...reportBookListSectionPath]}
              formikValuePath={[...reportBookListSectionPath]}
              tableComponentReportType={TableComponentTypeSchema.enum.EntityInstance}
              chosenApplicationSection="data"
              application={selfApplicationLibrary.uuid}
              deploymentUuid={deployment_Library_DO_NO_USE.uuid}
            />
          </Formik>
        </ListTransformerIntegShell>,
      );

      await act(async () => {
        fireEvent.click(getTransformerToggle());
      });
      await waitForProgressiveRendering();
      await setPanelElementTransformerType("returnValue");
      await waitFor(() => {
        expect(screen.getByDisplayValue("returnValue")).toBeInTheDocument();
      });

      rerender(
        <ListTransformerIntegShell>
          <Formik enableReinitialize initialValues={refreshedValues} onSubmit={() => {}}>
            <ReportSectionListDisplay
              label="Books"
              paramsAsdomainElements={{}}
              applicationDeploymentMap={libraryApplicationDeploymentMap}
              formikReportDefinitionPathString={reportBookList.name}
              reportSectionPath={[...reportBookListSectionPath]}
              formikValuePath={[...reportBookListSectionPath]}
              tableComponentReportType={TableComponentTypeSchema.enum.EntityInstance}
              chosenApplicationSection="data"
              application={selfApplicationLibrary.uuid}
              deploymentUuid={deployment_Library_DO_NO_USE.uuid}
            />
          </Formik>
        </ListTransformerIntegShell>,
      );
      await waitForProgressiveRendering();

      expect(screen.getByDisplayValue("returnValue")).toBeInTheDocument();
      expect(Object.keys(refreshedValues)).not.toContain("elementTransformer");
    });

    it("does not add transformer keys to the parent report Formik bag", async () => {
      let parentValues: Record<string, unknown> = {};
      const initialValues = buildBookListFormikValues();

      render(
        <ListTransformerIntegShell>
          <Formik initialValues={initialValues} onSubmit={() => {}}>
            <>
              <ParentFormikValuesObserver onValues={(values) => { parentValues = values; }} />
              <ReportSectionListDisplay
                label="Books"
                paramsAsdomainElements={{}}
                applicationDeploymentMap={libraryApplicationDeploymentMap}
                formikReportDefinitionPathString={reportBookList.name}
                reportSectionPath={[...reportBookListSectionPath]}
                formikValuePath={[...reportBookListSectionPath]}
                tableComponentReportType={TableComponentTypeSchema.enum.EntityInstance}
                chosenApplicationSection="data"
                application={selfApplicationLibrary.uuid}
                deploymentUuid={deployment_Library_DO_NO_USE.uuid}
              />
            </>
          </Formik>
        </ListTransformerIntegShell>,
      );

      await act(async () => {
        fireEvent.click(getTransformerToggle());
      });
      await waitForProgressiveRendering();
      await setPanelElementTransformerType("returnValue");
      await waitForProgressiveRendering();

      expect(Object.keys(parentValues).sort()).toEqual(Object.keys(initialValues).sort());
      expect(parentValues).not.toHaveProperty("elementTransformer");
    });
  });
});
