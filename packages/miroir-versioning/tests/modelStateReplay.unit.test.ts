/**
 * #708 part B, Slice B6: the replay of evolution trace records on a frozen model state, on the real model
 * of Library (its `library_model` files). The records are those a commit writes: model Actions and
 * instance writes of model rows, as `recordedInstanceWrite` of core holds them.
 */
import { describe, expect, it } from "vitest";

import { Action2Error, buildMetaModelCollections, type EvolutionTraceRecordRow } from "@miroir-framework/core";

import { replayEvolutionTraceRecords, type ModelState } from "../src/modelStates.js";
import { stateFromFolder } from "./modelStateAssets.js";

const LIBRARY = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const VERSION = "708b6000-0000-4000-8000-000000000001";
const ENTITY_ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const REPORT_ENTITY = "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916";
const BOOK_ENTITY = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";
const PUBLISHER_ENTITY = "a027c379-8468-43a5-ba4d-bf618be25cab";
const BOOK_DETAILS_REPORT = "c3503412-3d8a-43ef-a168-aa36e975e606";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";

type Row = Record<string, any>;

const libraryRows = stateFromFolder(LIBRARY, "packages/miroir-example-library/assets/library_model", "model");

/** Library's model, as frozen at `VERSION`. */
function frozenLibrary(): ModelState {
  return {
    applicationUuid: LIBRARY,
    applicationName: "Library",
    ...buildMetaModelCollections(({ collection }) =>
      collection === "applicationVersions" ? [{ uuid: VERSION, name: "v1" }] : structuredClone(libraryRows[collection] ?? []),
    ),
  } as ModelState;
}

const bookDetails = (libraryRows.reports as Row[]).find((report) => report.uuid === BOOK_DETAILS_REPORT)!;
const book = (libraryRows.entities as Row[]).find((entity) => entity.uuid === BOOK_ENTITY)!;

const magazine = {
  uuid: "708b6000-0000-4000-8000-000000000002",
  parentName: "Entity",
  parentUuid: ENTITY_ENTITY,
  selfApplication: LIBRARY,
  name: "Magazine",
  conceptLevel: "Model",
  mlSchema: { type: "object", definition: { uuid: { type: "uuid" }, parentUuid: { type: "uuid" }, name: { type: "string" } } },
};

let sequenceNumber = 0;

function record(kind: "commit" | "version" | "rebaseline", fields: Partial<EvolutionTraceRecordRow> = {}): EvolutionTraceRecordRow {
  sequenceNumber += 1;
  return {
    uuid: `708b6000-0000-4000-8000-${String(sequenceNumber).padStart(12, "0")}`,
    parentName: "EvolutionTraceRecord",
    parentUuid: "c2b1a1f0-0000-4000-8000-000000000000",
    application: LIBRARY,
    sequenceNumber,
    kind,
    timestamp: "2026-11-15T00:00:00.000Z",
    ...(kind === "commit" ? { complete: true } : {}),
    ...fields,
  };
}

function instanceWrite(actionType: string, object: Row) {
  return {
    actionType,
    endpoint: INSTANCE_ENDPOINT,
    payload: { application: LIBRARY, applicationSection: "model", parentUuid: object.parentUuid, objects: [object] },
  };
}

function modelAction(actionType: string, payload: Row) {
  return { actionType, endpoint: MODEL_ENDPOINT, payload: { application: LIBRARY, ...payload } };
}

function rowsByUuid(state: ModelState | Action2Error, collection: "entities" | "reports"): Record<string, Row> {
  expect(state instanceof Action2Error, JSON.stringify(state)).toBe(false);
  return Object.fromEntries(((state as ModelState)[collection] as Row[]).map((row) => [row.uuid, row]));
}

describe("model state replay (#708 B6)", () => {
  it("replays the commits after the marker of the version, and not those before", () => {
    const records = [
      record("commit", { actions: [instanceWrite("updateInstance", { ...bookDetails, name: "BeforeTheMarker" })] }),
      record("version", { version: VERSION }),
      record("commit", { actions: [instanceWrite("updateInstance", { ...bookDetails, name: "BookCard" })] }),
      record("commit", {
        actions: [
          modelAction("createEntity", { entities: [magazine] }),
          modelAction("alterEntityAttribute", { entityUuid: BOOK_ENTITY, addColumns: [{ name: "edition", definition: { type: "string", optional: true } }] }),
          modelAction("renameEntity", { entityUuid: BOOK_ENTITY, targetValue: "Volume" }),
          modelAction("dropEntity", { entityUuid: PUBLISHER_ENTITY }),
        ],
      }),
    ];

    const replayed = replayEvolutionTraceRecords(frozenLibrary(), [...records].reverse());

    const entities = rowsByUuid(replayed, "entities");
    expect({
      report: rowsByUuid(replayed, "reports")[BOOK_DETAILS_REPORT].name,
      magazine: entities[magazine.uuid],
      book: { name: entities[BOOK_ENTITY].name, attributes: Object.keys(entities[BOOK_ENTITY].mlSchema.definition) },
      publisher: entities[PUBLISHER_ENTITY],
    }).toEqual({
      report: "BookCard",
      magazine,
      book: { name: "Volume", attributes: [...Object.keys(book.mlSchema.definition), "edition"] },
      publisher: undefined,
    });
  });

  it("replays the Actions of a record whose commit stopped part way, and deletes a deleted row", () => {
    const replayed = replayEvolutionTraceRecords(frozenLibrary(), [
      record("version", { version: VERSION }),
      record("commit", { complete: false, actions: [instanceWrite("deleteInstance", { uuid: BOOK_DETAILS_REPORT, parentUuid: REPORT_ENTITY })] }),
    ]);

    expect(Object.keys(rowsByUuid(replayed, "reports"))).not.toContain(BOOK_DETAILS_REPORT);
  });

  it("refuses a chain with no marker for the version, or restarted after it", () => {
    const noMarker = replayEvolutionTraceRecords(frozenLibrary(), [record("version", { version: "another version" })]);
    const restarted = replayEvolutionTraceRecords(frozenLibrary(), [record("version", { version: VERSION }), record("rebaseline")]);

    expect([noMarker instanceof Action2Error, restarted instanceof Action2Error]).toEqual([true, true]);
  });
});
