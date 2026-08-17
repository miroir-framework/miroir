/**
 * #222 Phase 3.3 — contract: EV round-trip section must match getApplicationSection
 * (filesystem integ covered by PersistenceStoreController + DomainController MiroirTest suites).
 * #232 — getEntityVersionWriteSection removed; getApplicationSection is the single source.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getApplicationSection,
} from "../../../../src/1_core/Model.js";
import {
  entityEntityVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../../../../");
const MIROIR = selfApplicationMiroir.uuid as string;
const LIBRARY = selfApplicationLibrary.uuid as string;

describe("222 Phase 3 — EntityVersion round-trip section contract", () => {
  it("#232 getApplicationSection returns modelVersion for EntityVersion in Miroir and Library", () => {
    expect(getApplicationSection(MIROIR, entityEntityVersion.uuid as string)).toBe("modelVersion");
    expect(getApplicationSection(LIBRARY, entityEntityVersion.uuid as string)).toBe("modelVersion");
  });

  it("resetAndinitializeDeploymentCompositeAction groups meta-model instances by getApplicationSection", () => {
    const src = readFileSync(
      join(repoRoot, "packages/miroir-core/src/1_core/Deployment.ts"),
      "utf8",
    );
    expect(src).toMatch(/getApplicationSection\s*\(\s*applicationUuid/);
    expect(src).toMatch(/createMetaModelInstances_\$\{section\}|createMetaModelInstances_\$\{/);
    // no single hard-coded model-only meta-model createInstance payload for Cross/SAV mix
    expect(src).not.toMatch(
      /applicationSection:\s*"model"\s+as\s+const,\s*objects:\s*\[\s*\.\.\.appMetaModel\.menus/,
    );
  });

  it("DomainController createModelInstancesFromResetModel uses getApplicationSection", () => {
    const src = readFileSync(
      join(repoRoot, "packages/miroir-core/src/3_controllers/DomainController.ts"),
      "utf8",
    );
    expect(src).toMatch(
      /applicationSection:\s*getApplicationSection\s*\(\s*application\s*,\s*parentEntity\.uuid\s*\)/,
    );
  });
});
