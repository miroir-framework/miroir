/**
 * Grids over an Entity without primary key (`idAttribute: false`): every row is shown, identical
 * rows included, rows are identified by their cache key, and no edit / duplicate / delete / open
 * action is offered.
 */
import "@testing-library/jest-dom";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import React, { useMemo, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { Entity, EntityInstance } from "miroir-core";
import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
  selfApplicationLibrary,
} from "miroir-example-library";

import { EntityInstanceGrid } from "../../src/miroir-fwk/4_view/components/Grids/EntityInstanceGrid.js";
import { TableComponentTypeSchema } from "../../src/miroir-fwk/4_view/components/Grids/EntityInstanceGridInterface.js";
import type { TableComponentRow } from "../../src/miroir-fwk/4_view/components/Grids/EntityInstanceGridInterface.js";
import { toolsCellActions } from "../../src/miroir-fwk/4_view/components/Grids/GlideToolsCellRenderer.js";
import { waitForProgressiveRendering } from "./MlElementEditorTestTools.js";
import { GridPaginationIntegShell } from "./helpers/gridPaginationIntegRig.js";
import { libraryApplicationDeploymentMap } from "./helpers/listTransformerIntegRig.js";

vi.mock("../../src/miroir-fwk/4_view/components/JsonObjectEditFormDialog.js", () => ({
  JsonObjectEditFormDialog: () => null,
}));

const keylessEntity = {
  uuid: "22275459-d657-48cc-b72e-834e2ba3947c",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  parentName: "Entity",
  name: "pk_less_rows",
  conceptLevel: "External",
  externalDataSource: { schema: "test_175" },
  idAttribute: false,
  mlSchema: {
    type: "object",
    definition: {
      label: { type: "string", optional: true },
      n: { type: "number", optional: true },
    },
  },
} as unknown as Entity;

const keylessRows = {
  "#0": { label: "a", n: 1 },
  "#1": { label: "a", n: 1 },
  "#2": { label: "b", n: 2 },
} as unknown as Record<string, EntityInstance>;

function KeylessEntityGridHarness() {
  const [addOpen, setAddOpen] = useState(false);
  const columnDefs = useMemo(
    () => ({
      columnDefs: [
        { field: "label", headerName: "Label", type: "text" as const },
        { field: "n", headerName: "N", type: "number" as const },
      ],
    }),
    [],
  );

  return (
    <EntityInstanceGrid
      type={TableComponentTypeSchema.enum.EntityInstance}
      application={selfApplicationLibrary.uuid}
      deploymentUuid={deployment_Library_DO_NO_USE.uuid}
      columnDefs={columnDefs}
      instancesToDisplay={keylessRows}
      styles={{}}
      children={null}
      displayTools={true}
      applicationDeploymentMap={libraryApplicationDeploymentMap}
      currentModel={defaultLibraryAppModel}
      currentEntity={keylessEntity}
      defaultFormValuesObject={{}}
      paramsAsdomainElements={{}}
      foreignKeyObjects={{}}
      sortByAttribute="label"
      rowOpenReport={{ reportUuid: "3fcaedd8-97eb-4e97-ba5f-133b9abf80de" } as any}
      onRowOpenReport={() => undefined}
      addObjectdialogFormIsOpen={addOpen}
      setAddObjectdialogFormIsOpen={setAddOpen}
    />
  );
}

describe("keylessEntityGrid", () => {
  it("ag-grid shows every keyless row, identified by its cache key, without row actions or cell editing", async () => {
    render(
      <GridPaginationIntegShell>
        <KeylessEntityGridHarness />
      </GridPaginationIntegShell>,
    );
    await waitForProgressiveRendering();

    await waitFor(() => {
      expect(document.querySelectorAll(".ag-center-cols-container .ag-row")).toHaveLength(3);
    });
    const rowIds = Array.from(
      document.querySelectorAll(".ag-center-cols-container .ag-row"),
      (row) => row.getAttribute("row-id"),
    ).sort();
    expect(rowIds).toEqual(["#0", "#1", "#2"]);

    for (const title of ["Open", "Edit", "Duplicate", "Delete"]) {
      expect(document.querySelector(`[title="${title}"]`)).toBeNull();
    }

    // cells are read-only: a double click opens no editor
    const labelCell = document.querySelector(
      '.ag-center-cols-container .ag-row [col-id="label"]',
    ) as HTMLElement;
    expect(labelCell).not.toBeNull();
    await act(async () => {
      fireEvent.doubleClick(labelCell);
    });
    expect(document.querySelector(".ag-cell-inline-editing, .ag-popup-editor")).toBeNull();
  });

  it("the Glide tools cell draws only the actions it is given", () => {
    const row = { rawValue: keylessRows["#0"] } as unknown as TableComponentRow;
    const handler = () => undefined;

    expect(toolsCellActions({ kind: "tools-cell", row })).toEqual([]);
    expect(
      toolsCellActions({
        kind: "tools-cell",
        row,
        onOpen: handler,
        onEdit: handler,
        onDuplicate: handler,
        onDelete: handler,
      }).map(({ icon }) => icon),
    ).toEqual(["OpenInNew", "Create", "ContentCopy", "Delete"]);
  });
});
