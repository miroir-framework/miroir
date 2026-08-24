import { render, type RenderResult } from "@testing-library/react";
import { Formik } from "formik";
import React, { useEffect } from "react";
import { MemoryRouter } from "react-router-dom";

import {
  defaultSelfApplicationDeploymentMap,
  getReportsAndEntitiesForDeploymentUuid,
} from "miroir-core";
import {
  book1,
  book2,
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
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
    <MemoryRouter>
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
        name: `Book ${number}`,
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
      />
    </ListTransformerIntegShell>,
  );
}
