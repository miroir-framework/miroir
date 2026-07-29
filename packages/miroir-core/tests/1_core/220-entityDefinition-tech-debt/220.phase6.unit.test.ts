/**
 * #220 Phase 6 — MetaModel.entityDefinitions → entityVersions rename wave.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";
import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";

import type {
  EntityVersion,
  MetaModel,
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { emptyMetaModel } from "../../../src/1_core/Deployment.js";
import {
  getMetaModelEntityVersions,
  withMetaModelEntityVersions,
} from "../../../src/1_core/metaModelEntityVersions.js";

const REPO_ROOT = join(import.meta.dirname, "../../../../..");

describe("220 Phase 6 — MetaModel.entityVersions vocabulary", () => {
  it("bootstrap metaModel schema uses entityVersions (not entityDefinitions collection key)", () => {
    const schema = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts",
      ),
      "utf8",
    );
    // Find the MetaModel inline object section: entityVersions key present,
    // and the old collection key is not declared as a MetaModel field.
    expect(schema).toMatch(/entityVersions:\s*\{/);
    expect(schema).not.toMatch(
      /\/\/ #217 Phase 12: element type renamed; MetaModel collection key kept for compat[\s\S]{0,80}entityDefinitions:/,
    );
  });

  it("emptyMetaModel exposes entityVersions array", () => {
    expect(emptyMetaModel).toHaveProperty("entityVersions");
    expect(Array.isArray(emptyMetaModel.entityVersions)).toBe(true);
    expect(emptyMetaModel.entityVersions).toEqual([]);
    expect(emptyMetaModel).not.toHaveProperty("entityDefinitions");
  });

  it("default Miroir / Library MetaModels expose entityVersions", () => {
    expect(Array.isArray((defaultMiroirMetaModel as MetaModel).entityVersions)).toBe(true);
    expect((defaultMiroirMetaModel as MetaModel).entityVersions.length).toBeGreaterThan(0);
    expect(Array.isArray((defaultLibraryAppModel as MetaModel).entityVersions)).toBe(true);
    expect((defaultLibraryAppModel as MetaModel).entityVersions.length).toBeGreaterThan(0);
  });

  it("getMetaModelEntityVersions reads entityVersions", () => {
    const versions = getMetaModelEntityVersions(defaultLibraryAppModel as MetaModel);
    expect(versions).toBe((defaultLibraryAppModel as MetaModel).entityVersions);
  });

  it("withMetaModelEntityVersions writes entityVersions only", () => {
    const next = withMetaModelEntityVersions(defaultLibraryAppModel as MetaModel, []);
    expect(next.entityVersions).toEqual([]);
    expect(next).not.toHaveProperty("entityDefinitions");
  });

  it("bootFromPersistedState interface parameter is entityVersions", () => {
    const iface = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-core/src/0_interfaces/4-services/PersistenceStoreControllerInterface.ts",
      ),
      "utf8",
    );
    expect(iface).toMatch(
      /bootFromPersistedState\(\s*entities\s*:\s*Entity\[\],\s*entityVersions\s*:\s*Entity(?:Definition|Version)\[\]/,
    );
    expect(iface).not.toMatch(
      /bootFromPersistedState\(\s*entities\s*:\s*Entity\[\],\s*entityDefinitions\s*:/,
    );
  });
});

describe("220 Phase 6 — generated MetaModel type", () => {
  it("generated MetaModel type declares entityVersions: EntityVersion[]", () => {
    const generated = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts",
      ),
      "utf8",
    );
    // Narrow to MetaModel type block
    const metaModelIdx = generated.indexOf("export type MetaModel = {");
    expect(metaModelIdx).toBeGreaterThan(-1);
    const slice = generated.slice(metaModelIdx, metaModelIdx + 1200);
    expect(slice).toMatch(/entityVersions:\s*EntityVersion\[\]/);
    expect(slice).not.toMatch(/entityDefinitions:\s*EntityVersion\[\]/);
  });
});

// Keep EntityVersion import used for type documentation in this suite.
void (null as unknown as EntityVersion);
