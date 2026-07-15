import { describe, expect, it } from "vitest";

import { deployment_Library_DO_NO_USE, defaultLibraryAppModel } from "miroir-test-app_deployment-library";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

import {
  classifySchemaChange,
  computeSchemaRevision,
  defaultMiroirMetaModel,
  entityDefinitionEntity,
  type MetaModel,
} from "miroir-core";

const libraryDeploymentUuid = deployment_Library_DO_NO_USE.uuid;
const libraryApplicationUuid = defaultLibraryAppModel.applicationUuid;

function cloneModel<T>(model: T): T {
  return structuredClone(model);
}

describe("computeSchemaRevision — instance data ignored (3.1)", () => {
  it("revision unchanged when only entity instance data changes", () => {
    const base = cloneModel(defaultLibraryAppModel) as MetaModel;
    const rev1 = computeSchemaRevision(libraryDeploymentUuid, base, libraryApplicationUuid);

    const mutated = cloneModel(base) as MetaModel;
    mutated.entities = mutated.entities.map((entity) =>
      entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
        ? { ...entity, description: "Mutated runtime description only" }
        : entity,
    );

    expect(computeSchemaRevision(libraryDeploymentUuid, mutated, libraryApplicationUuid)).toBe(rev1);
  });

  it("revision unchanged when only report instance data changes", () => {
    const base = cloneModel(defaultLibraryAppModel) as MetaModel;
    const rev1 = computeSchemaRevision(libraryDeploymentUuid, base, libraryApplicationUuid);

    const mutated = cloneModel(base) as MetaModel;
    mutated.reports = mutated.reports.map((report) =>
      report.uuid === "c3503412-3d8a-43ef-a168-aa36e975e606"
        ? { ...report, defaultLabel: "Runtime-only label change" }
        : report,
    );

    expect(computeSchemaRevision(libraryDeploymentUuid, mutated, libraryApplicationUuid)).toBe(rev1);
  });

  it("revision unchanged on undo/redo simulation (new object ref, same schema content)", () => {
    const base = cloneModel(defaultLibraryAppModel) as MetaModel;
    const rev1 = computeSchemaRevision(libraryDeploymentUuid, base, libraryApplicationUuid);
    const redoClone = cloneModel(base) as MetaModel;

    expect(computeSchemaRevision(libraryDeploymentUuid, redoClone, libraryApplicationUuid)).toBe(rev1);
    expect(redoClone).not.toBe(base);
  });
});

describe("computeSchemaRevision — app overlay changes (3.2)", () => {
  it("revision changes when Library Book entity definition attributes change", () => {
    const base = cloneModel(defaultLibraryAppModel) as MetaModel;
    const rev1 = computeSchemaRevision(libraryDeploymentUuid, base, libraryApplicationUuid);

    const mutated = cloneModel(base) as MetaModel;
    mutated.entityDefinitions = mutated.entityDefinitions.map((entityDefinition) =>
      entityDefinition.uuid === "797dd185-0155-43fd-b23f-f6d0af8cae06"
        ? {
            ...entityDefinition,
            viewAttributes: [...(entityDefinition.viewAttributes ?? []), "isbn"],
          }
        : entityDefinition,
    );

    expect(computeSchemaRevision(libraryDeploymentUuid, mutated, libraryApplicationUuid)).not.toBe(rev1);
  });

  it("revision changes when Book details report definition changes", () => {
    const base = cloneModel(defaultLibraryAppModel) as MetaModel;
    const rev1 = computeSchemaRevision(libraryDeploymentUuid, base, libraryApplicationUuid);

    const mutated = cloneModel(base) as MetaModel;
    mutated.reports = mutated.reports.map((report) =>
      report.uuid === "c3503412-3d8a-43ef-a168-aa36e975e606"
        ? {
            ...report,
            definition: {
              ...report.definition,
              extractorTemplates: {
                ...report.definition?.extractorTemplates,
                book: {
                  ...report.definition?.extractorTemplates?.book,
                  parentName: "BookMutated",
                },
              },
            },
          }
        : report,
    );

    expect(computeSchemaRevision(libraryDeploymentUuid, mutated, libraryApplicationUuid)).not.toBe(rev1);
  });

  it("revision changes when app-owned endpoint gains a new actionType", () => {
    const base = cloneModel(defaultLibraryAppModel) as MetaModel;
    const rev1 = computeSchemaRevision(libraryDeploymentUuid, base, libraryApplicationUuid);

    const lendingEndpoint = base.endpoints.find(
      (endpoint) => endpoint.uuid === "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
    );
    expect(lendingEndpoint).toBeDefined();

    const firstAction = lendingEndpoint!.definition!.actions![0];
    const mutated = cloneModel(base) as MetaModel;
    mutated.endpoints = mutated.endpoints.map((endpoint) =>
      endpoint.uuid === lendingEndpoint!.uuid
        ? {
            ...endpoint,
            definition: {
              ...endpoint.definition!,
              actions: [
                ...(endpoint.definition?.actions ?? []),
                {
                  ...firstAction,
                  actionParameters: {
                    ...firstAction.actionParameters,
                    actionType: {
                      type: "literal" as const,
                      definition: "reserveDocument",
                    },
                  },
                },
              ],
            },
          }
        : endpoint,
    );

    expect(computeSchemaRevision(libraryDeploymentUuid, mutated, libraryApplicationUuid)).not.toBe(rev1);
  });

  it("classifySchemaChange returns app-overlay for app-scope definition edits", () => {
    const base = cloneModel(defaultLibraryAppModel) as MetaModel;
    const prev = computeSchemaRevision(libraryDeploymentUuid, base, libraryApplicationUuid);

    const mutated = cloneModel(base) as MetaModel;
    mutated.entityDefinitions = mutated.entityDefinitions.map((entityDefinition) =>
      entityDefinition.uuid === "797dd185-0155-43fd-b23f-f6d0af8cae06"
        ? { ...entityDefinition, name: "BookRenamed" }
        : entityDefinition,
    );
    const next = computeSchemaRevision(libraryDeploymentUuid, mutated, libraryApplicationUuid);

    expect(classifySchemaChange(prev, next, "app")).toBe("app-overlay");
    expect(classifySchemaChange(prev, prev, "app")).toBe("none");
  });
});

describe("computeSchemaRevision — meta full carry-on changes (3.3)", () => {
  const metaApplicationUuid = selfApplicationMiroir.uuid;

  it("revision changes when Miroir Entity entityDefinition changes", () => {
    const base = cloneModel(defaultMiroirMetaModel) as MetaModel;
    const rev1 = computeSchemaRevision(deployment_Miroir.uuid, base, metaApplicationUuid);

    const mutated = cloneModel(base) as MetaModel;
    mutated.entityDefinitions = mutated.entityDefinitions.map((entityDefinition) =>
      entityDefinition.uuid === entityDefinitionEntity.uuid
        ? {
            ...entityDefinition,
            viewAttributes: [...(entityDefinition.viewAttributes ?? []), "newMetaField"],
          }
        : entityDefinition,
    );

    expect(computeSchemaRevision(deployment_Miroir.uuid, mutated, metaApplicationUuid)).not.toBe(rev1);
  });

  it("revision changes when Miroir Report definition changes", () => {
    const base = cloneModel(defaultMiroirMetaModel) as MetaModel;
    const rev1 = computeSchemaRevision(deployment_Miroir.uuid, base, metaApplicationUuid);
    const entityListReport = base.reports.find((report) => report.name === "EntityList");
    expect(entityListReport).toBeDefined();

    const mutated = cloneModel(base) as MetaModel;
    mutated.reports = mutated.reports.map((report) =>
      report.uuid === entityListReport!.uuid
        ? { ...report, definition: { ...report.definition, label: "Mutated report definition" } }
        : report,
    );

    expect(computeSchemaRevision(deployment_Miroir.uuid, mutated, metaApplicationUuid)).not.toBe(rev1);
  });

  it("revision changes when Miroir Query / Runner / Transformer definition changes", () => {
    const base = cloneModel(defaultMiroirMetaModel) as MetaModel;
    const rev1 = computeSchemaRevision(deployment_Miroir.uuid, base, metaApplicationUuid);

    const queryMutated = cloneModel(base) as MetaModel;
    queryMutated.storedQueries = [
      {
        extractorTemplates: {
          synthetic: {
            extractorOrCombinerType: "extractorByPrimaryKey",
            parentName: "Entity",
            parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          },
        },
      },
    ];
    expect(computeSchemaRevision(deployment_Miroir.uuid, queryMutated, metaApplicationUuid)).not.toBe(rev1);

    const runnerMutated = cloneModel(base) as MetaModel;
    const firstRunner = runnerMutated.runners[0];
    expect(firstRunner).toBeDefined();
    runnerMutated.runners = runnerMutated.runners.map((runner) =>
      runner.uuid === firstRunner!.uuid ? { ...runner, name: `${runner.name}Mutated` } : runner,
    );
    expect(computeSchemaRevision(deployment_Miroir.uuid, runnerMutated, metaApplicationUuid)).not.toBe(rev1);

    const transformerMutated = cloneModel(base) as MetaModel;
    transformerMutated.runners = [
      ...transformerMutated.runners,
      {
        uuid: "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
        name: "SyntheticTransformer",
        definition: { transformerType: "noop" },
      },
    ];
    expect(
      computeSchemaRevision(deployment_Miroir.uuid, transformerMutated, metaApplicationUuid),
    ).not.toBe(rev1);
  });

  it("classifySchemaChange returns meta-full-carry-on for meta-scope definition edits", () => {
    const base = cloneModel(defaultMiroirMetaModel) as MetaModel;
    const prev = computeSchemaRevision(deployment_Miroir.uuid, base, metaApplicationUuid);

    const mutated = cloneModel(base) as MetaModel;
    mutated.entityDefinitions = mutated.entityDefinitions.map((entityDefinition) =>
      entityDefinition.uuid === entityDefinitionEntity.uuid
        ? { ...entityDefinition, name: "EntityRenamed" }
        : entityDefinition,
    );
    const next = computeSchemaRevision(deployment_Miroir.uuid, mutated, metaApplicationUuid);

    expect(classifySchemaChange(prev, next, "meta")).toBe("meta-full-carry-on");
    expect(classifySchemaChange(prev, prev, "meta")).toBe("none");
  });
});
