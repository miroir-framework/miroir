import { describe, expect, it } from "vitest";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  defaultLibraryAppModel,
  deployment_Library_DO_NO_USE,
} from "miroir-test-app_deployment-library";
import {
  classifySchemaChange,
  computeSchemaRevision,
  defaultMiroirMetaModel,
  entityDefinitionEntity,
  selfApplicationMiroir,
  type MetaModel,
} from "miroir-core";

import {
  evaluateSchemaRevisionChange,
  resolveSchemaForDeploymentPolicy,
} from "../src/contexts/schemaReloadPolicy.js";

function cloneModel<T>(model: T): T {
  return structuredClone(model);
}

describe("schemaReloadPolicy (199 Phase 5)", () => {
  it("sets schemaReloadRequired when meta entity definition changes", () => {
    const base = cloneModel(defaultMiroirMetaModel) as MetaModel;
    const metaRevision = computeSchemaRevision(
      deployment_Miroir.uuid,
      base,
      selfApplicationMiroir.uuid,
    );

    const mutated = cloneModel(base) as MetaModel;
    mutated.entityDefinitions = mutated.entityDefinitions.map((entityDefinition) =>
      entityDefinition.uuid === entityDefinitionEntity.uuid
        ? { ...entityDefinition, name: "EntityRenamed" }
        : entityDefinition,
    );
    const nextMetaRevision = computeSchemaRevision(
      deployment_Miroir.uuid,
      mutated,
      selfApplicationMiroir.uuid,
    );

    const decision = evaluateSchemaRevisionChange({
      deploymentUuid: deployment_Miroir.uuid,
      applicationUuid: selfApplicationMiroir.uuid,
      metaSchemaRevision: nextMetaRevision,
      appSchemaRevision: metaRevision,
      previousRevisions: { meta: metaRevision, app: metaRevision },
    });

    expect(classifySchemaChange(metaRevision, nextMetaRevision, "meta")).toBe(
      "meta-full-carry-on",
    );
    expect(decision.schemaReloadRequired).toBe(true);
    expect(decision.shouldResolveSchema).toBe(false);
  });

  it("does not set schemaReloadRequired for Library Book instance edit", () => {
    const base = cloneModel(defaultLibraryAppModel) as MetaModel;
    const appRevision = computeSchemaRevision(
      deployment_Library_DO_NO_USE.uuid,
      base,
      defaultLibraryAppModel.applicationUuid,
    );

    const mutated = cloneModel(base) as MetaModel;
    mutated.entities = mutated.entities.map((entity) =>
      entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
        ? { ...entity, description: "Runtime-only change" }
        : entity,
    );
    const nextAppRevision = computeSchemaRevision(
      deployment_Library_DO_NO_USE.uuid,
      mutated,
      defaultLibraryAppModel.applicationUuid,
    );

    const decision = evaluateSchemaRevisionChange({
      deploymentUuid: deployment_Library_DO_NO_USE.uuid,
      applicationUuid: defaultLibraryAppModel.applicationUuid,
      metaSchemaRevision: appRevision,
      appSchemaRevision: nextAppRevision,
      previousRevisions: { meta: appRevision, app: appRevision },
    });

    expect(decision.schemaReloadRequired).toBe(false);
    expect(decision.shouldResolveSchema).toBe(false);
  });

  it("sets schemaReloadRequired when Miroir Report definition changes", () => {
    const base = cloneModel(defaultMiroirMetaModel) as MetaModel;
    const entityListReport = base.reports.find((report) => report.name === "EntityList");
    expect(entityListReport).toBeDefined();

    const metaRevision = computeSchemaRevision(
      deployment_Miroir.uuid,
      base,
      selfApplicationMiroir.uuid,
    );
    const mutated = cloneModel(base) as MetaModel;
    mutated.reports = mutated.reports.map((report) =>
      report.uuid === entityListReport!.uuid
        ? { ...report, definition: { ...report.definition, label: "Changed" } }
        : report,
    );
    const nextMetaRevision = computeSchemaRevision(
      deployment_Miroir.uuid,
      mutated,
      selfApplicationMiroir.uuid,
    );

    const decision = evaluateSchemaRevisionChange({
      deploymentUuid: deployment_Miroir.uuid,
      applicationUuid: selfApplicationMiroir.uuid,
      metaSchemaRevision: nextMetaRevision,
      appSchemaRevision: metaRevision,
      previousRevisions: { meta: metaRevision, app: metaRevision },
    });

    expect(decision.schemaReloadRequired).toBe(true);
  });

  it("invalidates schemasPerDeployment[libraryUuid] on app-overlay change", () => {
    const base = cloneModel(defaultLibraryAppModel) as MetaModel;
    const appRevision = computeSchemaRevision(
      deployment_Library_DO_NO_USE.uuid,
      base,
      defaultLibraryAppModel.applicationUuid,
    );

    const mutated = cloneModel(base) as MetaModel;
    mutated.entityDefinitions = mutated.entityDefinitions.map((entityDefinition) =>
      entityDefinition.uuid === "797dd185-0155-43fd-b23f-f6d0af8cae06"
        ? { ...entityDefinition, name: "BookRenamed" }
        : entityDefinition,
    );
    const nextAppRevision = computeSchemaRevision(
      deployment_Library_DO_NO_USE.uuid,
      mutated,
      defaultLibraryAppModel.applicationUuid,
    );

    const decision = evaluateSchemaRevisionChange({
      deploymentUuid: deployment_Library_DO_NO_USE.uuid,
      applicationUuid: defaultLibraryAppModel.applicationUuid,
      metaSchemaRevision: appRevision,
      appSchemaRevision: nextAppRevision,
      previousRevisions: { meta: appRevision, app: appRevision },
    });

    expect(decision.invalidateCachedSchema).toBe(true);
    expect(decision.resolutionMode).toBe("overlay");
    expect(decision.shouldResolveSchema).toBe(true);
  });

  it("does not invalidate schemasPerDeployment[miroirUuid] on Library overlay change", () => {
    const libraryModel = cloneModel(defaultLibraryAppModel) as MetaModel;
    const miroirModel = cloneModel(defaultMiroirMetaModel) as MetaModel;
    const libraryRevision = computeSchemaRevision(
      deployment_Library_DO_NO_USE.uuid,
      libraryModel,
      defaultLibraryAppModel.applicationUuid,
    );
    const miroirRevision = computeSchemaRevision(
      deployment_Miroir.uuid,
      miroirModel,
      selfApplicationMiroir.uuid,
    );

    const mutatedLibrary = cloneModel(libraryModel) as MetaModel;
    mutatedLibrary.entityDefinitions = mutatedLibrary.entityDefinitions.map((entityDefinition) =>
      entityDefinition.uuid === "797dd185-0155-43fd-b23f-f6d0af8cae06"
        ? { ...entityDefinition, name: "BookRenamed" }
        : entityDefinition,
    );
    const nextLibraryRevision = computeSchemaRevision(
      deployment_Library_DO_NO_USE.uuid,
      mutatedLibrary,
      defaultLibraryAppModel.applicationUuid,
    );

    const decision = evaluateSchemaRevisionChange({
      deploymentUuid: deployment_Library_DO_NO_USE.uuid,
      applicationUuid: defaultLibraryAppModel.applicationUuid,
      metaSchemaRevision: miroirRevision,
      appSchemaRevision: nextLibraryRevision,
      previousRevisions: { meta: miroirRevision, app: libraryRevision },
    });

    expect(decision.schemaReloadRequired).toBe(false);
    expect(decision.invalidateCachedSchema).toBe(true);
  });

  it("re-resolves with extended mode once for overlay revision bump", () => {
    const base = cloneModel(defaultLibraryAppModel) as MetaModel;
    const mutated = cloneModel(base) as MetaModel;
    mutated.entityDefinitions = mutated.entityDefinitions.map((entityDefinition) =>
      entityDefinition.uuid === "797dd185-0155-43fd-b23f-f6d0af8cae06"
        ? { ...entityDefinition, viewAttributes: [...(entityDefinition.viewAttributes ?? []), "isbn"] }
        : entityDefinition,
    );

    const initial = resolveSchemaForDeploymentPolicy(
      deployment_Library_DO_NO_USE.uuid,
      base,
      "initial",
    );
    const overlay = resolveSchemaForDeploymentPolicy(
      deployment_Library_DO_NO_USE.uuid,
      mutated,
      "overlay",
    );

    expect(initial).not.toBe(overlay);
    const lendBranch = (overlay as any).definition.context.domainAction.definition.find(
      (branch: any) => branch.definition?.actionType?.definition === "lendDocument",
    );
    expect(lendBranch).toBeDefined();
  }, 120_000);
});
