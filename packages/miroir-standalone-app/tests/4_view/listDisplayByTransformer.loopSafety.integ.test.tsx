import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Formik, useFormikContext } from "formik";
import { useEffect, useRef } from "react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { book1 } from "miroir-example-library";

import { GridComponentsProvider, ReportSectionListDisplay } from "miroir-react";
import {
  buildBookListFormikValues,
  buildBooksIndex,
  expectPanelTransformerType,
  libraryApplicationDeploymentMap,
  ListTransformerIntegShell,
  reportBookListSectionPath,
  setPanelElementTransformerType,
} from "./helpers/listTransformerIntegRig.js";
import { waitForProgressiveRendering } from "./MlElementEditorTestTools.js";
import { TableComponentTypeSchema } from "miroir-react";
import {
  deployment_Library_DO_NO_USE,
  reportBookList,
  selfApplicationLibrary,
} from "miroir-example-library";

/** Given to the list section through `GridComponentsProvider` (#612). */
const gridStubs = { EntityInstanceGrid: () => <div data-testid="entity-instance-grid-stub" /> };

const getTransformerToggle = () => screen.getByRole("button", { name: /functions/i });

function ParentFormikValuesObserver({
  onValues,
}: {
  onValues: (values: Record<string, unknown>) => void;
}) {
  const { values } = useFormikContext<Record<string, unknown>>();
  const onValuesRef = useRef(onValues);
  onValuesRef.current = onValues;
  useEffect(() => {
    onValuesRef.current(values);
  }, [values]);
  return null;
}

const reportSectionProps = {
  label: "Books",
  paramsAsdomainElements: {},
  applicationDeploymentMap: libraryApplicationDeploymentMap,
  formikReportDefinitionPathString: reportBookList.name,
  reportSectionPath: [...reportBookListSectionPath],
  formikValuePath: [...reportBookListSectionPath],
  tableComponentReportType: TableComponentTypeSchema.enum.EntityInstance,
  chosenApplicationSection: "data" as const,
  application: selfApplicationLibrary.uuid,
  deploymentUuid: deployment_Library_DO_NO_USE.uuid,
};

describe("listDisplayByTransformer — loop-safety (app-stack)", () => {
  it("keeps panel transformer state when parent report Formik reinitializes", async () => {
    const initialValues = buildBookListFormikValues();
    const refreshedValues = {
      ...buildBookListFormikValues(buildBooksIndex(book1)),
      books: buildBooksIndex(book1),
    };

    const { rerender } = render(
      <ListTransformerIntegShell>
        <Formik enableReinitialize initialValues={initialValues} onSubmit={() => {}}>
          <GridComponentsProvider components={gridStubs}><ReportSectionListDisplay {...reportSectionProps} /></GridComponentsProvider>
        </Formik>
      </ListTransformerIntegShell>,
    );

    await act(async () => {
      fireEvent.click(getTransformerToggle());
    });
    await waitForProgressiveRendering();
    await setPanelElementTransformerType("returnValue");
    await expectPanelTransformerType("returnValue");

    rerender(
      <ListTransformerIntegShell>
        <Formik enableReinitialize initialValues={refreshedValues} onSubmit={() => {}}>
          <GridComponentsProvider components={gridStubs}><ReportSectionListDisplay {...reportSectionProps} /></GridComponentsProvider>
        </Formik>
      </ListTransformerIntegShell>,
    );
    await waitForProgressiveRendering();

    await expectPanelTransformerType("returnValue");
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
            <GridComponentsProvider components={gridStubs}><ReportSectionListDisplay {...reportSectionProps} /></GridComponentsProvider>
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
