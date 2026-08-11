/**
 * #222 Phase 3.1 — EntityVersion write section helper.
 * #232 — getApplicationSection now returns "model-version" for EntityVersion and all history
 * families; the removed getEntityVersionWriteSection was an alias for getApplicationSection.
 */
import { describe, expect, it } from "vitest";

import {
  getApplicationSection,
} from "../../../src/1_core/Model.js";
import {
  entityEntityVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

const MIROIR = selfApplicationMiroir.uuid as string;
const LIBRARY = selfApplicationLibrary.uuid as string;
const EV = entityEntityVersion.uuid as string;

describe("222 Phase 3 — persist / write section for EntityVersion", () => {
  it("#232 EntityVersion section is model-version for Miroir (was data in #222)", () => {
    expect(getApplicationSection(MIROIR, EV)).toBe("model-version");
  });

  it("#232 EntityVersion section is model-version for Library (was model in #222)", () => {
    expect(getApplicationSection(LIBRARY, EV)).toBe("model-version");
  });

  it("freeze EntityVersion section is model-version for all apps (#232 Slice 1)", () => {
    expect(getApplicationSection(MIROIR, EV)).toBe("model-version");
    expect(getApplicationSection(LIBRARY, EV)).toBe("model-version");
  });
});
