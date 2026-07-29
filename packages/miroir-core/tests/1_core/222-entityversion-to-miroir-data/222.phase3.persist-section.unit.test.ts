/**
 * #222 Phase 3.1 — EntityVersion write section helper (Miroir data / Library model).
 */
import { describe, expect, it } from "vitest";

import {
  getApplicationSection,
  getEntityVersionWriteSection,
} from "../../../src/1_core/Model.js";
import { resolveFreezeEntityVersionApplicationSection } from "../../../src/1_core/versioning/applicationVersionFreeze.js";
import {
  entityEntityVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

const MIROIR = selfApplicationMiroir.uuid as string;
const LIBRARY = selfApplicationLibrary.uuid as string;
const EV = entityEntityVersion.uuid as string;

describe("222 Phase 3 — persist / write section for EntityVersion", () => {
  it("Miroir EntityVersion writes target data", () => {
    expect(getEntityVersionWriteSection(MIROIR)).toBe("data");
    expect(getApplicationSection(MIROIR, EV)).toBe("data");
    expect(resolveFreezeEntityVersionApplicationSection(MIROIR)).toBe("data");
  });

  it("Library EntityVersion writes target model", () => {
    expect(getEntityVersionWriteSection(LIBRARY)).toBe("model");
    expect(getApplicationSection(LIBRARY, EV)).toBe("model");
    expect(resolveFreezeEntityVersionApplicationSection(LIBRARY)).toBe("model");
  });
});
