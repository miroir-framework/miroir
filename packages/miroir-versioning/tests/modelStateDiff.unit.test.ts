/**
 * #708 part B, Slice B5: the difference between two model states, on the real model of Library (its
 * `library_model` files) and the real data of Miroir (`miroir_data`, where Miroir's model rows are).
 */
import { describe, expect, it } from "vitest";

import { diffModelStates, type ModelStateCollections } from "../src/modelStateDiff.js";
import { stateFromFolder } from "./modelStateAssets.js";

const LIBRARY = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const MIROIR = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const BOOK_ENTITY = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";
const BOOK_DETAILS_REPORT = "c3503412-3d8a-43ef-a168-aa36e975e606";
const BOOK_DETAILS_MIROIR_TEST = "4edb680b-4686-4d9a-bb96-40fa9f945b24";
const MIROIR_LOGO_BLOB = "f7f2fe87-df2e-4467-9a6c-ed11f8b6c34c";

type Row = Record<string, any>;

const library = stateFromFolder(LIBRARY, "packages/miroir-example-library/assets/library_model", "model");
const miroir = stateFromFolder(MIROIR, "packages/miroir-app-miroir/assets/miroir_data", "data");

/** `state` with the row `uuid` of `collection` replaced by `change(row)`. */
function changed(state: ModelStateCollections, collection: keyof ModelStateCollections, uuid: string, change: (row: Row) => Row) {
  return {
    ...state,
    [collection]: (state[collection] as Row[]).map((row) => (row.uuid === uuid ? change(structuredClone(row)) : row)),
  };
}

describe("model state diff (#708 B5)", () => {
  it("finds no difference between a state and itself", () => {
    expect(diffModelStates(library, structuredClone(library))).toEqual({ collections: {}, entityAttributes: [] });
  });

  it("names an attribute added to Book", () => {
    const next = changed(library, "entities", BOOK_ENTITY, (book) => {
      book.mlSchema.definition.edition = { type: "string", optional: true };
      return book;
    });
    expect(diffModelStates(library, next).entityAttributes).toEqual([
      { entityUuid: BOOK_ENTITY, name: "Book", added: ["edition"], removed: [], changed: [] },
    ]);
  });

  it("finds a renamed Report", () => {
    const next = changed(library, "reports", BOOK_DETAILS_REPORT, (report) => ({ ...report, name: "BookCard" }));
    const reports = diffModelStates(library, next).collections.reports;
    expect(reports?.changed.map(({ uuid, attributes }) => ({ uuid, attributes }))).toEqual([
      { uuid: BOOK_DETAILS_REPORT, attributes: ["name"] },
    ]);
  });

  it("finds a removed Blob", () => {
    const next = { ...miroir, blobs: (miroir.blobs ?? []).filter((blob) => blob.uuid !== MIROIR_LOGO_BLOB) };
    expect(diffModelStates(miroir, next).collections.blobs?.removed.map((row) => row.uuid)).toEqual([MIROIR_LOGO_BLOB]);
  });

  it("finds a changed MiroirTest, and only it", () => {
    const next = changed(library, "tests", BOOK_DETAILS_MIROIR_TEST, (test) => ({ ...test, description: "#708 B5" }));
    const diff = diffModelStates(library, next);
    expect({
      collections: Object.keys(diff.collections),
      tests: diff.collections.tests?.changed.map(({ uuid, attributes }) => ({ uuid, attributes })),
    }).toEqual({ collections: ["tests"], tests: [{ uuid: BOOK_DETAILS_MIROIR_TEST, attributes: ["description"] }] });
  });
});
