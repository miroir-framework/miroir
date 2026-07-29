/**
 * #222 Phase 3.4 — Cross / SAV / EntityVersion section matrix (future versioning).
 */
import { describe, expect, it } from "vitest";

import { getApplicationSection } from "../../../src/1_core/Model.js";
import {
  entityApplicationVersionCrossEntityVersion,
  entityEntity,
  entityEntityVersion,
  entitySelfApplicationVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

const MIROIR = selfApplicationMiroir.uuid as string;
const LIBRARY = selfApplicationLibrary.uuid as string;

describe("222 Phase 3 — versioning section matrix", () => {
  it("Miroir: Entity model; EntityVersion / Cross / SAV data", () => {
    expect(getApplicationSection(MIROIR, entityEntity.uuid as string)).toBe("model");
    expect(getApplicationSection(MIROIR, entityEntityVersion.uuid as string)).toBe("data");
    expect(
      getApplicationSection(MIROIR, entityApplicationVersionCrossEntityVersion.uuid as string),
    ).toBe("data");
    expect(getApplicationSection(MIROIR, entitySelfApplicationVersion.uuid as string)).toBe(
      "data",
    );
  });

  it("Library: EntityVersion / SAV model; Cross data (Cross Entity not in MetaModel entities list)", () => {
    expect(getApplicationSection(LIBRARY, entityEntityVersion.uuid as string)).toBe("model");
    expect(getApplicationSection(LIBRARY, entitySelfApplicationVersion.uuid as string)).toBe(
      "model",
    );
    // ApplicationVersionCrossEntityVersion Entity is not in defaultMiroirMetaModel.entities,
    // so getApplicationSection treats it as a data-section concept for non-Miroir apps.
    expect(
      getApplicationSection(LIBRARY, entityApplicationVersionCrossEntityVersion.uuid as string),
    ).toBe("data");
  });
});
