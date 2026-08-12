/**
 * #222 Phase 2.1 — section-aware LocalCache / selector indexing for EntityVersion.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getApplicationSection,
  getReportsAndEntitiesForDeploymentUuid,
} from "../../../src/1_core/Model.js";
import { getReduxDeploymentsStateIndex } from "../../../src/2_domain/ReduxDeploymentsState.js";
import { defaultMiroirMetaModel } from "../../../src/1_core/defaultMiroirMetaModel.js";
import {
  entityEntityVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";

const MIROIR_APP_UUID = selfApplicationMiroir.uuid as string;
const LIBRARY_APP_UUID = selfApplicationLibrary.uuid as string;
const EV_UUID = entityEntityVersion.uuid as string;
const MIROIR_DEPLOYMENT = deployment_Miroir.uuid as string;
const LIBRARY_DEPLOYMENT = "00000000-0000-4000-8000-0000000000aa";

// tests/1_core/222-... → packages/miroir-core → packages → repo root (5 levels)
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../../../");

describe("222 Phase 2 — LocalCache / selector EV section indexing", () => {
  it("#232 Miroir EV section is modelVersion (was data in #222)", () => {
    const section = getApplicationSection(MIROIR_APP_UUID, EV_UUID);
    expect(section).toBe("modelVersion");
    expect(getReduxDeploymentsStateIndex(MIROIR_DEPLOYMENT, section, EV_UUID)).toBe(
      `${MIROIR_DEPLOYMENT}_modelVersion_${EV_UUID}`,
    );
  });

  it("#232 Library EV section is modelVersion (was model in #222)", () => {
    const section = getApplicationSection(LIBRARY_APP_UUID, EV_UUID);
    expect(section).toBe("modelVersion");
    expect(getReduxDeploymentsStateIndex(LIBRARY_DEPLOYMENT, section, EV_UUID)).toBe(
      `${LIBRARY_DEPLOYMENT}_modelVersion_${EV_UUID}`,
    );
  });

  it("getReportsAndEntitiesForDeploymentUuid still exposes entityVersions for Miroir listing", () => {
    const reports = getReportsAndEntitiesForDeploymentUuid(
      MIROIR_APP_UUID,
      defaultMiroirMetaModel,
      defaultMiroirMetaModel,
    );
    expect(reports.model.entityVersions.length).toBeGreaterThan(0);
    expect(reports.data.entityVersions.length).toBeGreaterThan(0);
  });

  it("LocalCacheSliceModelSelector (redux) uses getApplicationSection for EntityVersion", () => {
    const src = readFileSync(
      join(
        repoRoot,
        "packages/miroir-localcache-redux/src/4_services/localCache/LocalCacheSliceModelSelector.ts",
      ),
      "utf8",
    );
    expect(src).toMatch(
      /getApplicationSection\s*\(\s*[^,]+,\s*entityEntityVersion\.uuid\s*\)/,
    );
  });

  it("LocalCacheSliceModelSelector (zustand) uses getApplicationSection for EntityVersion", () => {
    const src = readFileSync(
      join(
        repoRoot,
        "packages/miroir-localcache-zustand/src/4_services/localCache/LocalCacheSliceModelSelector.ts",
      ),
      "utf8",
    );
    expect(src).toMatch(
      /getApplicationSection\s*\(\s*[^,]+,\s*entityEntityVersion\.uuid\s*\)/,
    );
  });

  it("cache-policy EV fallback in ReduxDeploymentsStateQuerySelectors is section-aware", () => {
    const src = readFileSync(
      join(
        repoRoot,
        "packages/miroir-core/src/2_domain/ReduxDeploymentsStateQuerySelectors.ts",
      ),
      "utf8",
    );
    expect(src).toMatch(/getApplicationSection/);
    expect(src).not.toMatch(
      /getReduxDeploymentsStateIndex\(\s*deploymentUuid,\s*"model",\s*entityEntityVersion\.uuid/,
    );
  });
});
