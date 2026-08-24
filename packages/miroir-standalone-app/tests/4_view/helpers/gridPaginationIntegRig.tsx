import { render, type RenderResult } from "@testing-library/react";
import React, { useMemo, useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import {
  defaultSelfApplicationDeploymentMap,
  getReportsAndEntitiesForDeploymentUuid,
  type EntityInstance,
} from "miroir-core";
import {
  book1,
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
  entityBook,
  reportBookList,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import { defaultMiroirMetaModel, defaultStoredMiroirTheme } from "miroir-test-app_deployment-miroir";
import { useMiroirContextService } from "miroir-react";

import { EntityInstanceGrid } from "../../../src/miroir-fwk/4_view/components/Grids/EntityInstanceGrid.js";
import { TableComponentTypeSchema } from "../../../src/miroir-fwk/4_view/components/Grids/EntityInstanceGridInterface.js";
import { GlideDataGridComponent } from "../../../src/miroir-fwk/4_view/components/Grids/GlideDataGridComponent.js";
import type { TableComponentRow } from "../../../src/miroir-fwk/4_view/components/Grids/EntityInstanceGridInterface.js";
import { ValueObjectGrid } from "../../../src/miroir-fwk/4_view/components/Grids/ValueObjectGrid.js";
import { MiroirThemeProvider } from "../../../src/miroir-fwk/4_view/contexts/MiroirThemeContext.js";
import {
  buildBookListFormikValuesForCount,
  libraryApplicationDeploymentMap,
  ListTransformerIntegShell,
} from "./listTransformerIntegRig.js";

import { getWrapperLoadingLocalCache } from "../JzodElementEditorTestTools.js";

vi.mock("../../../src/miroir-fwk/4_view/components/JsonObjectEditFormDialog.js", () => ({
  JsonObjectEditFormDialog: () => null,
}));

export { libraryApplicationDeploymentMap, ListTransformerIntegShell, buildBookListFormikValuesForCount };

const testThemeOptions = [
  {
    id: "default",
    name: "Default Theme",
    description: "Test theme",
    theme: defaultStoredMiroirTheme.definition,
  },
];

const GridPaginationIntegProviders = getWrapperLoadingLocalCache(
  false,
  libraryApplicationDeploymentMap,
);

function SeedLibraryDeploymentMapping({ children }: { children: React.ReactNode }) {
  const { setDeploymentUuidToReportsEntitiesMapping } = useMiroirContextService();

  React.useEffect(() => {
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

export function GridPaginationIntegShell({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <GridPaginationIntegProviders>
        <MiroirThemeProvider currentThemeOptions={testThemeOptions}>
          <SeedLibraryDeploymentMapping>{children}</SeedLibraryDeploymentMapping>
        </MiroirThemeProvider>
      </GridPaginationIntegProviders>
    </MemoryRouter>
  );
}

export function buildManyBooks(count: number): Record<string, EntityInstance> {
  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => {
      const number = index + 1;
      const book = {
        ...book1,
        uuid: `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`,
        name: `Book ${number}`,
      } as EntityInstance;
      return [book.uuid, book];
    }),
  );
}

function useBookColumnDefs() {
  return useMemo(
    () => ({
      columnDefs: [
        { field: "name", headerName: "Name", type: "text" as const },
        { field: "uuid", headerName: "Uuid", type: "uuid" as const },
        { field: "year", headerName: "Year", type: "number" as const },
      ],
    }),
    [],
  );
}

function useBookTableComponentRows(books: Record<string, EntityInstance>) {
  return useMemo(
    () => ({
      tableComponentRowUuidIndexSchema: Object.values(books).map(
        (book): TableComponentRow => ({
          deploymentUuid: deployment_Library_DO_NO_USE.uuid,
          rawValue: book,
          foreignKeyObjects: {},
          mlSchema: entityBook.mlSchema?.definition ?? {},
          displayedValue: { ...book },
        }),
      ),
    }),
    [books],
  );
}

type EntityInstanceGridHarnessProps = {
  bookCount: number;
  maxRows?: number;
  pageSize?: number;
};

export function EntityInstanceGridHarness({
  bookCount,
  maxRows,
  pageSize,
}: EntityInstanceGridHarnessProps) {
  const [addOpen, setAddOpen] = useState(false);
  const books = useMemo(() => buildManyBooks(bookCount), [bookCount]);
  const columnDefs = useBookColumnDefs();

  return (
    <EntityInstanceGrid
      type={TableComponentTypeSchema.enum.EntityInstance}
      application={selfApplicationLibrary.uuid}
      deploymentUuid={deployment_Library_DO_NO_USE.uuid}
      columnDefs={columnDefs}
      instancesToDisplay={books}
      styles={{}}
      children={null}
      displayTools={true}
      applicationDeploymentMap={libraryApplicationDeploymentMap}
      currentModel={defaultLibraryAppModel}
      currentEntity={entityBook}
      defaultFormValuesObject={{}}
      paramsAsdomainElements={{}}
      foreignKeyObjects={{}}
      sortByAttribute="name"
      maxRows={maxRows}
      pageSize={pageSize}
      addObjectdialogFormIsOpen={addOpen}
      setAddObjectdialogFormIsOpen={setAddOpen}
    />
  );
}

export function renderEntityInstanceGridHarness(
  props: EntityInstanceGridHarnessProps,
): RenderResult {
  return render(
    <GridPaginationIntegShell>
      <EntityInstanceGridHarness {...props} />
    </GridPaginationIntegShell>,
  );
}

type JsonArrayGridHarnessProps = {
  count: number;
  pageSize?: number;
  maxRows?: number;
};

function useJsonArrayColumnDefs() {
  return useMemo(
    () => ({
      columnDefs: [
        { field: "testName", headerName: "Test Name", type: "text" as const },
        { field: "status", headerName: "Status", type: "text" as const },
      ],
    }),
    [],
  );
}

export function JsonArrayGridHarness({ count, pageSize, maxRows }: JsonArrayGridHarnessProps) {
  const [addOpen, setAddOpen] = useState(false);
  const rows = useMemo(() => buildManyTestResults(count), [count]);
  const columnDefs = useJsonArrayColumnDefs();

  return (
    <EntityInstanceGrid
      type={TableComponentTypeSchema.enum.JSON_ARRAY}
      application={selfApplicationLibrary.uuid}
      deploymentUuid={deployment_Library_DO_NO_USE.uuid}
      columnDefs={columnDefs}
      {...({ rowData: rows } as any)}
      styles={{}}
      children={null}
      displayTools={true}
      applicationDeploymentMap={libraryApplicationDeploymentMap}
      currentModel={defaultLibraryAppModel}
      currentEntity={entityBook}
      defaultFormValuesObject={{}}
      paramsAsdomainElements={{}}
      foreignKeyObjects={{}}
      maxRows={maxRows}
      pageSize={pageSize}
      addObjectdialogFormIsOpen={addOpen}
      setAddObjectdialogFormIsOpen={setAddOpen}
    />
  );
}

export function renderJsonArrayGridHarness(props: JsonArrayGridHarnessProps): RenderResult {
  return render(
    <GridPaginationIntegShell>
      <JsonArrayGridHarness {...props} />
    </GridPaginationIntegShell>,
  );
}

type GlideGridHarnessProps = {
  bookCount: number;
  maxRows?: number;
  pageSize?: number;
};

export function GlideDataGridHarness({
  bookCount,
  maxRows,
  pageSize,
}: GlideGridHarnessProps) {
  const books = useMemo(() => buildManyBooks(bookCount), [bookCount]);
  const columnDefs = useBookColumnDefs();
  const tableComponentRows = useBookTableComponentRows(books);

  return (
    <GlideDataGridComponent
      tableComponentRows={tableComponentRows}
      columnDefs={columnDefs}
      styles={{}}
      type={TableComponentTypeSchema.enum.EntityInstance}
      toolsColumnDefinition={{ field: "tools", headerName: "Actions", width: 120 }}
      maxRows={maxRows}
      pageSize={pageSize}
    />
  );
}

export function renderGlideDataGridHarness(props: GlideGridHarnessProps): RenderResult {
  return render(
    <GridPaginationIntegShell>
      <GlideDataGridHarness {...props} />
    </GridPaginationIntegShell>,
  );
}

const testResultSchema = {
  type: "object" as const,
  definition: {
    testName: { type: "string" as const },
    status: { type: "string" as const },
  },
};

export function buildManyTestResults(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    return {
      localId: `test-${number}`,
      testName: `Test ${number}`,
      status: number % 2 === 0 ? "pass" : "fail",
    };
  });
}

type ValueObjectGridHarnessProps = {
  count: number;
  gridType?: "ag-grid" | "glide-data-grid";
  maxRows?: number;
  pageSize?: number;
};

export function ValueObjectGridHarness({
  count,
  gridType = "ag-grid",
  maxRows,
  pageSize,
}: ValueObjectGridHarnessProps) {
  const valueObjects = useMemo(() => buildManyTestResults(count), [count]);

  return (
    <ValueObjectGrid
      valueObjects={valueObjects}
      mlSchema={testResultSchema}
      displayTools={false}
      gridType={gridType}
      maxRows={maxRows}
      pageSize={pageSize}
    />
  );
}

export function renderValueObjectGridHarness(
  props: ValueObjectGridHarnessProps,
): RenderResult {
  return render(
    <GridPaginationIntegShell>
      <ValueObjectGridHarness {...props} />
    </GridPaginationIntegShell>,
  );
}
