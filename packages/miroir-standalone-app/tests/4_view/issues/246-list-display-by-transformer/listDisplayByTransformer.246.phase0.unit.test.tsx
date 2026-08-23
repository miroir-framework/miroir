import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { Formik } from "formik";
import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it, vi } from "vitest";

import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
  entityBook,
  book1,
  reportBookList,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import { getReduxDeploymentsStateIndex } from "miroir-core";
import {
  LocalCacheProvider,
  reduxStoreWithUndoRedoGetInitialState,
  type LocalCacheSliceState,
  type ReduxStateWithUndoRedo,
} from "miroir-react";

import { ReportSectionListDisplay } from "../../../../src/miroir-fwk/4_view/components/Reports/ReportSectionListDisplay.js";
import { TableComponentTypeSchema } from "../../../../src/miroir-fwk/4_view/components/Grids/EntityInstanceGridInterface.js";
import { MiroirThemeProvider } from "../../../../src/miroir-fwk/4_view/contexts/MiroirThemeContext.js";
import { defaultStoredMiroirTheme } from "miroir-test-app_deployment-miroir";

vi.mock("../../../../src/miroir-fwk/4_view/components/Grids/EntityInstanceGrid.js", () => ({
  EntityInstanceGrid: () => <div data-testid="entity-instance-grid-stub" />,
}));

vi.mock("../../../../src/miroir-fwk/4_view/components/JsonObjectEditFormDialog.js", () => ({
  JsonObjectEditFormDialog: () => null,
}));

vi.mock("miroir-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("miroir-react")>();
  return {
    ...actual,
    JsonDisplayHelper: () => null,
    useMiroirContextService: () => ({
      showPerformanceDisplay: false,
      showDebugInfo: false,
      ensureSchemaForDeployment: vi.fn(),
      deploymentUuidToReportsEntitiesMapping: {
        [deployment_Library_DO_NO_USE.uuid]: {
          data: {
            entities: defaultLibraryAppModel.entities,
            entityVersions: [],
            availableReports: defaultLibraryAppModel.reports,
          },
        },
      },
      schemasPerDeployment: {},
    }),
    useSnackbar: () => ({
      handleAsyncAction: vi.fn(async (action: () => Promise<unknown>) => action()),
      isActionRunning: false,
    }),
    useDomainControllerService: () => ({
      handleActionFromUI: vi.fn(),
    }),
    useMiroirContextInnerFormOutput: () => [undefined, vi.fn()] as const,
  };
});

function createLibraryBookListStore() {
  const mockLocalCacheSliceState: LocalCacheSliceState = {
    loading: {},
    current: {
      [getReduxDeploymentsStateIndex(deployment_Library_DO_NO_USE.uuid, "model", entityBook.uuid)]: {
        entities: {
          [entityBook.uuid]: entityBook as any,
        },
        ids: [entityBook.uuid],
      },
      [getReduxDeploymentsStateIndex(deployment_Library_DO_NO_USE.uuid, "data", entityBook.uuid)]: {
        entities: {
          [book1.uuid]: book1 as any,
        },
        ids: [book1.uuid],
      },
    },
    status: {
      initialLoadDone: true,
    },
  };

  const mockState: ReduxStateWithUndoRedo =
    reduxStoreWithUndoRedoGetInitialState(() => mockLocalCacheSliceState);
  mockState.presentModelSnapshot = mockLocalCacheSliceState;

  return configureStore({
    reducer: {
      presentModelSnapshot: (state = mockState.presentModelSnapshot) => state,
      currentTransaction: (state = mockState.currentTransaction) => state,
      previousModelSnapshot: (state = mockState.previousModelSnapshot) => state,
      pastModelPatches: (state = mockState.pastModelPatches) => state,
      futureModelPatches: (state = mockState.futureModelPatches) => state,
      queriesResultsCache: (state = mockState.queriesResultsCache) => state,
    },
    preloadedState: mockState,
  });
}

const reportSectionPath = ["definition", "section", "definition", 0] as const;

const testThemeOptions = [
  {
    id: "default",
    name: "Default Theme",
    description: "Test theme",
    theme: defaultStoredMiroirTheme.definition,
  },
];

function renderBookListSection() {
  const store = createLibraryBookListStore();
  const formikInitialValues = {
    [reportBookList.name]: reportBookList,
    books: {
      [book1.uuid]: book1,
    },
  };

  return render(
    <MiroirThemeProvider currentThemeOptions={testThemeOptions}>
      <LocalCacheProvider store={store}>
        <Formik initialValues={formikInitialValues} onSubmit={vi.fn()}>
          <ReportSectionListDisplay
            label="Books"
            paramsAsdomainElements={{}}
            applicationDeploymentMap={{
              [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
            }}
            formikReportDefinitionPathString={reportBookList.name}
            reportSectionPath={[...reportSectionPath]}
            formikValuePath={[...reportSectionPath]}
            tableComponentReportType={TableComponentTypeSchema.enum.EntityInstance}
            chosenApplicationSection="data"
            application={selfApplicationLibrary.uuid}
            deploymentUuid={deployment_Library_DO_NO_USE.uuid}
          />
        </Formik>
      </LocalCacheProvider>
    </MiroirThemeProvider>,
  );
}

describe("246 phase0 — ReportSectionListDisplay list header baseline", () => {
  it("shows section title and add button, without a transformer toggle", () => {
    renderBookListSection();

    expect(screen.getByRole("heading", { level: 3, name: "Books" })).toBeInTheDocument();
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("button", { name: /transformer/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("list-transformer-toggle")).not.toBeInTheDocument();
  });
});
