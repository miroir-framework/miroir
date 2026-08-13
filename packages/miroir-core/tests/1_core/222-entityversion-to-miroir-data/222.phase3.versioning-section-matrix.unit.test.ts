/**
 * #222 Phase 3.4 — Cross / SAV / EntityVersion section matrix.
 * #232 — all version-history entities now route to modelVersion for any application.
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
  it("#232 Miroir: Entity model; EntityVersion / Cross / SAV → modelVersion (was data in #222)", () => {
    expect(getApplicationSection(MIROIR, entityEntity.uuid as string)).toBe("model");
    expect(getApplicationSection(MIROIR, entityEntityVersion.uuid as string)).toBe("modelVersion");
    expect(
      getApplicationSection(MIROIR, entityApplicationVersionCrossEntityVersion.uuid as string),
    ).toBe("modelVersion");
    expect(getApplicationSection(MIROIR, entitySelfApplicationVersion.uuid as string)).toBe(
      "modelVersion",
    );
  });

  it("#232 Library: EntityVersion / SAV / Cross → modelVersion (was model/data in #222)", () => {
    expect(getApplicationSection(LIBRARY, entityEntityVersion.uuid as string)).toBe("modelVersion");
    expect(getApplicationSection(LIBRARY, entitySelfApplicationVersion.uuid as string)).toBe("modelVersion");
    expect(
      getApplicationSection(LIBRARY, entityApplicationVersionCrossEntityVersion.uuid as string),
    ).toBe("modelVersion");
  });
});
