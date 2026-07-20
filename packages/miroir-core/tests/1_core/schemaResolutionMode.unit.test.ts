import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
} from "miroir-test-app_deployment-library";

import * as schemaHelpers from "../../src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchemaHelpers";
import {
  clearSchemaCacheForTests,
  getMiroirFundamentalSchemaForDeployment,
  miroirFundamentalJzodSchema,
  resolveFundamentalSchemaForDeployment,
  type MetaModel,
} from "miroir-core";

import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";
describe("resolveFundamentalSchemaForDeployment — static mode", () => {
  const libraryDeploymentUuid = deployment_Library_DO_NO_USE.uuid;

  it("returns miroirFundamentalJzodSchema by reference for Miroir deployment", () => {
    const result = resolveFundamentalSchemaForDeployment(
      deployment_Miroir.uuid,
      defaultMiroirMetaModel,
      "static",
    );
    expect(result).toBe(miroirFundamentalJzodSchema);
  });

  it("returns miroirFundamentalJzodSchema by reference for Library deployment (no carry-on)", () => {
    const result = resolveFundamentalSchemaForDeployment(
      libraryDeploymentUuid,
      defaultLibraryAppModel as MetaModel,
      "static",
    );
    expect(result).toBe(miroirFundamentalJzodSchema);
  });

  it("domainAction union is unchanged from build artifact in static mode", () => {
    const result = resolveFundamentalSchemaForDeployment(
      libraryDeploymentUuid,
      defaultLibraryAppModel as MetaModel,
      "static",
    );
    expect((result as any).definition.context.domainAction).toBe(
      (miroirFundamentalJzodSchema as any).definition.context.domainAction,
    );
  });

  it("static mode does not invoke applyDeploymentDomainActionCarryOn for Library model", () => {
    const carryOnSpy = vi.spyOn(schemaHelpers, "applyDeploymentDomainActionCarryOn");

    resolveFundamentalSchemaForDeployment(
      libraryDeploymentUuid,
      defaultLibraryAppModel as MetaModel,
      "static",
    );

    expect(carryOnSpy).not.toHaveBeenCalled();
    carryOnSpy.mockRestore();
  });

  it("static mode completes 1000 calls in under 50ms for Library model", () => {
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      resolveFundamentalSchemaForDeployment(
        libraryDeploymentUuid,
        defaultLibraryAppModel as MetaModel,
        "static",
      );
    }
    expect(Date.now() - start).toBeLessThan(50);
  });
});

describe("resolveFundamentalSchemaForDeployment — extended mode", () => {
  const libraryDeploymentUuid = deployment_Library_DO_NO_USE.uuid;
  let libraryExtendedSchema: ReturnType<typeof resolveFundamentalSchemaForDeployment>;

  beforeAll(() => {
    libraryExtendedSchema = resolveFundamentalSchemaForDeployment(
      libraryDeploymentUuid,
      defaultLibraryAppModel as MetaModel,
      "extended",
    );
  }, 120_000);

  it("returns a distinct schema for Library model with lendDocument in domainAction", () => {
    expect(libraryExtendedSchema).not.toBe(miroirFundamentalJzodSchema);

    const domainAction = (libraryExtendedSchema as any).definition.context.domainAction;
    const lendBranch = domainAction.definition.find(
      (branch: any) => branch.definition?.actionType?.definition === "lendDocument",
    );
    expect(lendBranch).toBeDefined();
  });

  it("returns static schema for Miroir model (no app-owned endpoints)", () => {
    const result = resolveFundamentalSchemaForDeployment(
      deployment_Miroir.uuid,
      defaultMiroirMetaModel,
      "extended",
    );
    expect(result).toBe(miroirFundamentalJzodSchema);
  });

  it("extended mode invokes applyDeploymentDomainActionCarryOn for Library model", () => {
    const carryOnSpy = vi.spyOn(schemaHelpers, "applyDeploymentDomainActionCarryOn");
    clearSchemaCacheForTests();
    const freshLibraryModel = structuredClone(defaultLibraryAppModel) as MetaModel;
    freshLibraryModel.applicationName = `${freshLibraryModel.applicationName}-carry-on-spy`;

    resolveFundamentalSchemaForDeployment(
      libraryDeploymentUuid,
      freshLibraryModel,
      "extended",
    );

    expect(carryOnSpy).toHaveBeenCalled();
    carryOnSpy.mockRestore();
  }, 120_000);
});

describe("resolveFundamentalSchemaForDeployment — auto mode", () => {
  const libraryDeploymentUuid = deployment_Library_DO_NO_USE.uuid;

  it("matches getMiroirFundamentalSchemaForDeployment for Library and Miroir", () => {
    const libraryAuto = resolveFundamentalSchemaForDeployment(
      libraryDeploymentUuid,
      defaultLibraryAppModel as MetaModel,
      "auto",
    );
    const libraryLegacy = getMiroirFundamentalSchemaForDeployment(
      libraryDeploymentUuid,
      defaultLibraryAppModel as MetaModel,
    );
    expect(libraryAuto).toBe(libraryLegacy);

    const miroirAuto = resolveFundamentalSchemaForDeployment(
      deployment_Miroir.uuid,
      defaultMiroirMetaModel,
      "auto",
    );
    const miroirLegacy = getMiroirFundamentalSchemaForDeployment(
      deployment_Miroir.uuid,
      defaultMiroirMetaModel,
    );
    expect(miroirAuto).toBe(miroirLegacy);
  }, 120_000);
});

describe("resolveFundamentalSchemaForDeployment — logging", () => {
  it("does not log to console when resolving schema", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    resolveFundamentalSchemaForDeployment(
      deployment_Library_DO_NO_USE.uuid,
      defaultLibraryAppModel as MetaModel,
      "auto",
    );
    getMiroirFundamentalSchemaForDeployment(
      deployment_Miroir.uuid,
      defaultMiroirMetaModel,
    );

    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("getMiroirFundamentalSchemaForDeployment"),
    );

    logSpy.mockRestore();
  }, 120_000);
});

describe("MIROIR_SCHEMA_MODE policy (199 Phase 4)", () => {
  const libraryDeploymentUuid = deployment_Library_DO_NO_USE.uuid;

  afterEach(() => {
    vi.unstubAllEnvs();
    clearSchemaCacheForTests();
  });

  it("MIROIR_SCHEMA_MODE=frozen forces static for Library model via getMiroirFundamentalSchemaForDeployment", () => {
    vi.stubEnv("MIROIR_SCHEMA_MODE", "frozen");

    const schema = getMiroirFundamentalSchemaForDeployment(
      libraryDeploymentUuid,
      defaultLibraryAppModel as MetaModel,
    );

    expect(schema).toBe(miroirFundamentalJzodSchema);
  });

  it("MIROIR_SCHEMA_MODE=frozen forces static for Library model via resolve auto mode", () => {
    vi.stubEnv("MIROIR_SCHEMA_MODE", "frozen");

    const schema = resolveFundamentalSchemaForDeployment(
      libraryDeploymentUuid,
      defaultLibraryAppModel as MetaModel,
      "auto",
    );

    expect(schema).toBe(miroirFundamentalJzodSchema);
  });

  it("explicit extended mode still builds carry-on when MIROIR_SCHEMA_MODE=frozen", () => {
    vi.stubEnv("MIROIR_SCHEMA_MODE", "frozen");

    const schema = resolveFundamentalSchemaForDeployment(
      libraryDeploymentUuid,
      defaultLibraryAppModel as MetaModel,
      "extended",
    );

    expect(schema).not.toBe(miroirFundamentalJzodSchema);
    const lendBranch = (schema as any).definition.context.domainAction.definition.find(
      (branch: any) => branch.definition?.actionType?.definition === "lendDocument",
    );
    expect(lendBranch).toBeDefined();
  }, 120_000);
});
