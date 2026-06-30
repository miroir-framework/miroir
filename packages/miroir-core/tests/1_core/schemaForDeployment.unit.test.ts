import { describe, expect, it, vi } from "vitest";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
} from "miroir-test-app_deployment-library";

import {
  defaultMiroirMetaModel,
  getSchemaForDeployment,
  miroirFundamentalJzodSchema,
  type MetaModel,
} from "miroir-core";

describe("getSchemaForDeployment (Phase 1)", () => {
  it("returns the static schema for any deploymentUuid when model has no app-specific endpoints", () => {
    const result = getSchemaForDeployment("any-uuid", defaultMiroirMetaModel);
    expect(result).toBe(miroirFundamentalJzodSchema);
    expect((result as any).definition.context.domainAction).toBeDefined();
  });

  it("resolves the static schema for the Miroir deployment", () => {
    const result = getSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    expect(result).toBe(miroirFundamentalJzodSchema);
  });
});

describe("getSchemaForDeployment (Phase 2.1 — app-specific endpoints)", () => {
  const libraryDeploymentUuid = deployment_Library_DO_NO_USE.uuid;

  it("returns a different object when model has app-specific endpoints", () => {
    const schema = getSchemaForDeployment(libraryDeploymentUuid, defaultLibraryAppModel as MetaModel);
    expect(schema).not.toBe(miroirFundamentalJzodSchema);
    expect(schema.uuid).toBe(miroirFundamentalJzodSchema.uuid);
  });

  it("returns the static schema when model has no app-specific endpoints", () => {
    const modelWithoutAppEndpoints = { ...defaultLibraryAppModel, endpoints: [] };
    const schema = getSchemaForDeployment(libraryDeploymentUuid, modelWithoutAppEndpoints as MetaModel);
    expect(schema).toBe(miroirFundamentalJzodSchema);
  });

  it("returns the static schema for the Miroir meta-model even when endpoints exist", () => {
    const schema = getSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    expect(schema).toBe(miroirFundamentalJzodSchema);
  });
});

describe("getSchemaForDeployment (Phase 2.2 — extended domainAction)", () => {
  const libraryDeploymentUuid = deployment_Library_DO_NO_USE.uuid;

  function countDomainActionBranchesByType(schema: ReturnType<typeof getSchemaForDeployment>, actionType: string) {
    const domainAction = (schema as any).definition.context.domainAction;
    return domainAction.definition.filter(
      (branch: any) => branch.definition?.actionType?.definition === actionType,
    ).length;
  }

  it("domainAction union includes lendDocument for the Library deployment", () => {
    const schema = getSchemaForDeployment(libraryDeploymentUuid, defaultLibraryAppModel as MetaModel);
    const domainAction = (schema as any).definition.context.domainAction;
    expect(domainAction.type).toBe("union");
    const lendBranch = domainAction.definition.find(
      (branch: any) => branch.definition?.actionType?.definition === "lendDocument",
    );
    expect(lendBranch).toBeDefined();
  });

  it("adds each app actionType exactly once for the Library deployment", () => {
    const schema = getSchemaForDeployment(libraryDeploymentUuid, defaultLibraryAppModel as MetaModel);
    expect(countDomainActionBranchesByType(schema, "lendDocument")).toBe(1);
    expect(countDomainActionBranchesByType(schema, "returnDocument")).toBe(1);
  });

  it("deduplicates app actionTypes when the same action appears on multiple endpoints", () => {
    const lendingEndpoint = defaultLibraryAppModel.endpoints.find(
      (endpoint) => endpoint.uuid === "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
    );
    expect(lendingEndpoint).toBeDefined();

    const duplicateLendingEndpoint = {
      ...lendingEndpoint!,
      uuid: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      name: "Lending duplicate",
    };
    const modelWithDuplicateEndpoint = {
      ...defaultLibraryAppModel,
      endpoints: [...defaultLibraryAppModel.endpoints, duplicateLendingEndpoint],
    } as MetaModel;

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const schema = getSchemaForDeployment(libraryDeploymentUuid, modelWithDuplicateEndpoint);
    expect(countDomainActionBranchesByType(schema, "lendDocument")).toBe(1);
    expect(countDomainActionBranchesByType(schema, "returnDocument")).toBe(1);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('actionType "lendDocument"'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('actionType "returnDocument"'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("endpoint aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
    );

    warnSpy.mockRestore();
  });

  it("warns and skips app actionTypes that collide with the static domainAction union", () => {
    const lendingEndpoint = defaultLibraryAppModel.endpoints.find(
      (endpoint) => endpoint.uuid === "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
    );
    expect(lendingEndpoint).toBeDefined();

    const firstAction = lendingEndpoint!.definition!.actions![0];
    const collisionEndpoint = {
      ...lendingEndpoint!,
      uuid: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
      name: "Lending collision",
      definition: {
        ...lendingEndpoint!.definition!,
        actions: [
          {
            ...firstAction,
            actionParameters: {
              ...firstAction.actionParameters,
              actionType: {
                type: "literal" as const,
                definition: "transactionalInstanceAction",
              },
            },
          },
        ],
      },
    };
    const modelWithCollision = {
      ...defaultLibraryAppModel,
      endpoints: [...defaultLibraryAppModel.endpoints, collisionEndpoint],
    } as MetaModel;

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    getSchemaForDeployment(libraryDeploymentUuid, modelWithCollision);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('actionType "transactionalInstanceAction"'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("endpoint bbbbbbbb-cccc-dddd-eeee-ffffffffffff"),
    );

    warnSpy.mockRestore();
  });

  it("domainAction union still contains instanceAction for Library deployment", () => {
    const schema = getSchemaForDeployment(libraryDeploymentUuid, defaultLibraryAppModel as MetaModel);
    const domainAction = (schema as any).definition.context.domainAction;
    expect(
      domainAction.definition.some(
        (branch: any) =>
          branch.definition?.relativePath === "instanceAction" ||
          (branch.type === "schemaReference" && branch.definition?.relativePath === "instanceAction"),
      ),
    ).toBe(true);
  });

  it("domainAction union does NOT include lendDocument for the Miroir deployment", () => {
    const schema = getSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    const domainAction = (schema as any).definition.context.domainAction;
    const lendBranch = domainAction.definition.find(
      (branch: any) => branch.definition?.actionType?.definition === "lendDocument",
    );
    expect(lendBranch).toBeUndefined();
  });
});
