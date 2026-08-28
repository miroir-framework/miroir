import { act, fireEvent, render, screen, waitFor, within, type RenderResult } from "@testing-library/react";
import { Formik } from "formik";
import React, { useEffect } from "react";
import { MemoryRouter } from "react-router-dom";

import {
  defaultSelfApplicationDeploymentMap,
  entityMLSchema,
  getReportsAndEntitiesForDeploymentUuid,
} from "miroir-core";
import {
  book1,
  book2,
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
  entityBook,
  reportBookList,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import { defaultMiroirMetaModel, defaultStoredMiroirTheme } from "miroir-test-app_deployment-miroir";
import { useMiroirContextService } from "miroir-react";

import { ReportSectionListDisplay } from "../../../src/miroir-fwk/4_view/components/Reports/ReportSectionListDisplay.js";
import { ListTransformerPanel } from "../../../src/miroir-fwk/4_view/components/Reports/ListTransformerPanel.js";
import { TableComponentTypeSchema } from "../../../src/miroir-fwk/4_view/components/Grids/EntityInstanceGridInterface.js";
import { MiroirThemeProvider } from "../../../src/miroir-fwk/4_view/contexts/MiroirThemeContext.js";

import { getWrapperLoadingLocalCache } from "../JzodElementEditorTestTools.js";

export const libraryApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

export const reportBookListSectionPath = ["definition", "section", "definition", 0] as const;

const testThemeOptions = [
  {
    id: "default",
    name: "Default Theme",
    description: "Test theme",
    theme: defaultStoredMiroirTheme.definition,
  },
];

const ListTransformerIntegProviders = getWrapperLoadingLocalCache(
  false,
  libraryApplicationDeploymentMap,
);

/** RootComponent normally seeds deploymentUuidToReportsEntitiesMapping; tests must do the same. */
function SeedLibraryDeploymentMapping({ children }: { children: React.ReactNode }) {
  const { setDeploymentUuidToReportsEntitiesMapping } = useMiroirContextService();

  useEffect(() => {
    setDeploymentUuidToReportsEntitiesMapping((previous) => ({
      ...previous,
      [deployment_Library_DO_NO_USE.uuid]: getReportsAndEntitiesForDeploymentUuid(
        selfApplicationLibrary.uuid,
        defaultMiroirMetaModel,
        defaultLibraryAppModel,
      ),
    }));
  }, [setDeploymentUuidToReportsEntitiesMapping]);

  return <>{children}</>;
}

export function ListTransformerIntegShell({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ListTransformerIntegProviders>
        <MiroirThemeProvider currentThemeOptions={testThemeOptions}>
          <SeedLibraryDeploymentMapping>{children}</SeedLibraryDeploymentMapping>
        </MiroirThemeProvider>
      </ListTransformerIntegProviders>
    </MemoryRouter>
  );
}

export function buildBooksIndex(...books: (typeof book1)[]) {
  return Object.fromEntries(books.map((book) => [book.uuid, book]));
}

export function buildManyBooks(count: number) {
  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => {
      const number = index + 1;
      const book = {
        ...book1,
        uuid: `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`,
        // Zero-pad so lexicographic sort by `name` matches numeric order (report uses sortByAttribute: name).
        name: `Book ${String(number).padStart(2, "0")}`,
      };
      return [book.uuid, book];
    }),
  );
}

export function buildBookListFormikValues(
  bookIndex = buildBooksIndex(book1, book2),
): Record<string, unknown> {
  return {
    [reportBookList.name]: reportBookList,
    books: bookIndex,
  };
}

export function buildBookListFormikValuesForCount(count: number): Record<string, unknown> {
  return {
    [reportBookList.name]: reportBookList,
    books: buildManyBooks(count),
  };
}

const listSectionCommonProps = {
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

export function renderBookListSectionInteg(
  formikInitialValues = buildBookListFormikValues(),
): RenderResult {
  return render(
    <ListTransformerIntegShell>
      <Formik initialValues={formikInitialValues} onSubmit={() => {}}>
        <ReportSectionListDisplay {...listSectionCommonProps} />
      </Formik>
    </ListTransformerIntegShell>,
  );
}

export function renderBookListSectionIntegWithCount(count: number): RenderResult {
  return renderBookListSectionInteg(buildBookListFormikValuesForCount(count));
}

export function renderListTransformerPanelInteg(
  instancesToDisplay = buildBooksIndex(book1, book2),
): RenderResult {
  return render(
    <ListTransformerIntegShell>
      <ListTransformerPanel
        instancesToDisplay={instancesToDisplay}
        application={selfApplicationLibrary.uuid}
        applicationDeploymentMap={libraryApplicationDeploymentMap}
        deploymentUuid={deployment_Library_DO_NO_USE.uuid}
        sectionLabel="Books"
        rowMlSchema={entityMLSchema(entityBook as any)}
      />
    </ListTransformerIntegShell>,
  );
}

export async function getListTransformerPanel() {
  return waitFor(() => screen.getByTestId("list-transformer-panel"), { timeout: 5000 });
}

export async function expectPanelTransformerType(transformerType: string) {
  const panel = await getListTransformerPanel();
  await waitFor(
    () => {
      within(panel).getByDisplayValue(transformerType);
    },
    { timeout: 5000 },
  );
}

/**
 * Drives the transformerType discriminator (a ThemedSelectWithPortal filterable combobox):
 * focus opens the dropdown, typing filters, Enter commits the first matching option
 * (the Enter path bypasses the component's dropdownJustOpened click guard).
 */
export async function setPanelElementTransformerType(transformerType: string) {
  const panel = await getListTransformerPanel();
  const discriminatorInput = await waitFor(
    () => {
      const match = panel.querySelector(
        'input[name="elementTransformer.transformerType"]',
      ) as HTMLInputElement | null;
      if (!match) {
        throw new Error("transformerType discriminator input not found yet");
      }
      return match;
    },
    { timeout: 5000, interval: 100 },
  );

  await act(async () => {
    fireEvent.focus(discriminatorInput);
  });
  await act(async () => {
    fireEvent.change(discriminatorInput, { target: { value: transformerType } });
  });
  await act(async () => {
    fireEvent.keyDown(discriminatorInput, { key: "Enter" });
  });
}

export async function setPanelElementTransformerToMissingContextReference() {
  const panel = await getListTransformerPanel();

  const referenceInput = await waitFor(
    () => {
      const match = Array.from(panel.querySelectorAll("input, textarea")).find((el) =>
        (el as HTMLInputElement).name?.includes("referenceName"),
      );
      if (!match) {
        throw new Error("referenceName textbox not found yet");
      }
      return match;
    },
    { timeout: 5000, interval: 100 },
  );

  await act(async () => {
    fireEvent.change(referenceInput, { target: { value: "missingRef" } });
    fireEvent.blur(referenceInput);
  });
}
