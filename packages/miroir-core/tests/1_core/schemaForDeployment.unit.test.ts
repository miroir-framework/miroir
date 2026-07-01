import { beforeAll, describe, expect, it, vi } from "vitest";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
} from "miroir-test-app_deployment-library";

import {
  defaultMiroirMetaModel,
  getMiroirFundamentalSchemaForDeployment,
  miroirFundamentalJzodSchema,
  type MetaModel,
  LIBRARY_TMP,
} from "miroir-core";

describe("getMiroirFundamentalSchemaForDeployment (Phase 1)", () => {
  it("returns the static schema for any deploymentUuid when model has no app-specific endpoints", () => {
    const result = getMiroirFundamentalSchemaForDeployment("any-uuid", defaultMiroirMetaModel);
    expect(result).toBe(miroirFundamentalJzodSchema);
    expect((result as any).definition.context.domainAction).toBeDefined();
  });

  it("resolves the static schema for the Miroir deployment", () => {
    const result = getMiroirFundamentalSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    expect(result).toBe(miroirFundamentalJzodSchema);
  });
});

describe("getMiroirFundamentalSchemaForDeployment (Phase 2.1 — app-specific endpoints)", () => {
  const libraryDeploymentUuid = LIBRARY_TMP.deployment_Library_DO_NO_USE.uuid;
  let librarySchema: ReturnType<typeof getMiroirFundamentalSchemaForDeployment>;

  beforeAll(() => {
    librarySchema = getMiroirFundamentalSchemaForDeployment(libraryDeploymentUuid, defaultLibraryAppModel as MetaModel);
  }, 120_000);

  it("returns a different object when model has app-specific endpoints", () => {
    expect(librarySchema).not.toBe(miroirFundamentalJzodSchema);
    expect(librarySchema.uuid).toBe(miroirFundamentalJzodSchema.uuid);
  });

  it("returns the static schema when model has no app-specific endpoints", () => {
    const modelWithoutAppEndpoints = { ...defaultLibraryAppModel, endpoints: [] };
    const schema = getMiroirFundamentalSchemaForDeployment(libraryDeploymentUuid, modelWithoutAppEndpoints as MetaModel);
    expect(schema).toBe(miroirFundamentalJzodSchema);
  });

  it("returns the static schema for the Miroir meta-model even when endpoints exist", () => {
    const schema = getMiroirFundamentalSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    expect(schema).toBe(miroirFundamentalJzodSchema);
  });
});

describe("getMiroirFundamentalSchemaForDeployment (Phase 2.2 — extended domainAction)", () => {
  const libraryDeploymentUuid = deployment_Library_DO_NO_USE.uuid;
  let librarySchema: ReturnType<typeof getMiroirFundamentalSchemaForDeployment>;

  beforeAll(() => {
    librarySchema = getMiroirFundamentalSchemaForDeployment(libraryDeploymentUuid, defaultLibraryAppModel as MetaModel);
  }, 120_000);

  function countDomainActionBranchesByType(schema: ReturnType<typeof getMiroirFundamentalSchemaForDeployment>, actionType: string) {
    const domainAction = (schema as any).definition.context.domainAction;
    return domainAction.definition.filter(
      (branch: any) => branch.definition?.actionType?.definition === actionType,
    ).length;
  }

  it("domainAction union includes lendDocument for the Library deployment", () => {
    const domainAction = (librarySchema as any).definition.context.domainAction;
    expect(domainAction.type).toBe("union");
    const lendBranch = domainAction.definition.find(
      (branch: any) => branch.definition?.actionType?.definition === "lendDocument",
    );
    expect(lendBranch).toBeDefined();
  });

  it("adds each app actionType exactly once for the Library deployment", () => {
    expect(countDomainActionBranchesByType(librarySchema, "lendDocument")).toBe(1);
    expect(countDomainActionBranchesByType(librarySchema, "returnDocument")).toBe(1);
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

    const schema = getMiroirFundamentalSchemaForDeployment(libraryDeploymentUuid, modelWithDuplicateEndpoint);
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
  }, 120_000);

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

    getMiroirFundamentalSchemaForDeployment(libraryDeploymentUuid, modelWithCollision);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('actionType "transactionalInstanceAction"'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("endpoint bbbbbbbb-cccc-dddd-eeee-ffffffffffff"),
    );

    warnSpy.mockRestore();
  }, 120_000);

  it("domainAction union still contains instanceAction for Library deployment", () => {
    const domainAction = (librarySchema as any).definition.context.domainAction;
    expect(
      domainAction.definition.some(
        (branch: any) =>
          branch.definition?.relativePath === "instanceAction" ||
          (branch.type === "schemaReference" && branch.definition?.relativePath === "instanceAction"),
      ),
    ).toBe(true);
  });

  it("domainAction union does NOT include lendDocument for the Miroir deployment", () => {
    const schema = getMiroirFundamentalSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    const domainAction = (schema as any).definition.context.domainAction;
    const lendBranch = domainAction.definition.find(
      (branch: any) => branch.definition?.actionType?.definition === "lendDocument",
    );
    expect(lendBranch).toBeUndefined();
  });
});

describe("getMiroirFundamentalSchemaForDeployment (Phase 2.4 — carry-on actionTemplate)", () => {
  const libraryDeploymentUuid = deployment_Library_DO_NO_USE.uuid;
  const domainActionTemplateKey = "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction";
  let librarySchema: ReturnType<typeof getMiroirFundamentalSchemaForDeployment>;

  beforeAll(() => {
    librarySchema = getMiroirFundamentalSchemaForDeployment(libraryDeploymentUuid, defaultLibraryAppModel as MetaModel);
  }, 120_000);

  function branchIncludesLendDocument(branch: any): boolean {
    const actionType = branch.definition?.actionType;
    if (!actionType) {
      return false;
    }
    if (actionType.definition === "lendDocument") {
      return true;
    }
    if (actionType.definition?.definition === "lendDocument") {
      return true;
    }
    if (actionType.type === "union" && Array.isArray(actionType.definition)) {
      return actionType.definition.some(
        (variant: any) =>
          variant.definition === "lendDocument" ||
          variant.definition?.definition === "lendDocument",
      );
    }
    return false;
  }

  it("actionTemplate resolves to a union that includes a lendDocument-shaped branch", () => {
    const actionTemplateBranches = (librarySchema as any).definition.context[domainActionTemplateKey].definition;
    expect(
      actionTemplateBranches.some((branch: any) => branchIncludesLendDocument(branch)),
    ).toBe(true);
  });
});

describe("getMiroirFundamentalSchemaForDeployment (Phase 2.7 — Miroir deployment unaffected)", () => {
  const domainActionTemplateKey = "miroirTemplate_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction";

  it("Miroir deployment schema does not include Library actions", () => {
    const schema = getMiroirFundamentalSchemaForDeployment(deployment_Miroir.uuid, defaultMiroirMetaModel);
    expect(schema).toBe(miroirFundamentalJzodSchema);

    const domainAction = (schema as any).definition.context.domainAction;
    for (const actionType of ["lendDocument", "returnDocument"] as const) {
      const branch = domainAction.definition.find(
        (b: any) => b.definition?.actionType?.definition === actionType,
      );
      expect(branch, `domainAction should not include ${actionType}`).toBeUndefined();
    }

    const actionTemplateBranches = (schema as any).definition.context[domainActionTemplateKey]?.definition;
    if (Array.isArray(actionTemplateBranches)) {
      for (const actionType of ["lendDocument", "returnDocument"] as const) {
        const branch = actionTemplateBranches.find(
          (b: any) => b.definition?.actionType?.definition === actionType,
        );
        expect(branch, `actionTemplate should not include ${actionType}`).toBeUndefined();
      }
    }
  });
});

describe("getMiroirFundamentalSchemaForDeployment (Phase 2.9 — performance)", () => {
  const libraryDeploymentUuid = deployment_Library_DO_NO_USE.uuid;

  it("completes within 500ms for the Library model", () => {
    // First call may take several seconds (carry-on build). Runtime path reuses
    // WeakMap cache (see schemaForDeployment.ts) after hook mount or prior validation.
    getMiroirFundamentalSchemaForDeployment(libraryDeploymentUuid, defaultLibraryAppModel as MetaModel);
    const start = Date.now();
    getMiroirFundamentalSchemaForDeployment(libraryDeploymentUuid, defaultLibraryAppModel as MetaModel);
    expect(Date.now() - start).toBeLessThan(500);
  }, 120_000);
});
