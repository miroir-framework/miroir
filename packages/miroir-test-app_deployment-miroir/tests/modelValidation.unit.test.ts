/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";

import type {
  EntityDefinition,
  JzodElement,
  MetaModel,
  MiroirModelEnvironment,
} from "miroir-core";
import {
  defaultMiroirModelEnvironment,
  getInnermostTypeCheckError,
  jzodTypeCheck,
  miroirFundamentalJzodSchema
} from "miroir-core";

import reportEntityList from "../assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c9ea3359-690c-4620-9603-b5b402e4a2b9.json" with { type: "json" };
import { defaultMiroirMetaModel, defaultMiroirMetaModelEntityNameToAttributeName } from "../src/Model";
import { entityDefinitionReport } from "..";

// ================================================================================================
// Helpers
// ================================================================================================
function buildInstanceLabel(instance: any, fallbackPath: string): string {
  const uuid: string = instance.uuid ?? fallbackPath;
  return instance.name ? `${instance.name} (${uuid})` : uuid;
}

type ModelTestToRun = {
  groupName: string;
  jzodSchema: JzodElement;
  instances: Record<string, { default: any }>;
  filterByName?: string[];
};

/** Adapt MetaModel instance arrays to the Record shape expected by describeEntityGroup. */
function metaModelInstancesToRecord(
  instances: readonly any[],
): Record<string, { default: any }> {
  return Object.fromEntries(
    instances.map((instance, index) => {
      const key = instance?.uuid ?? instance?.name ?? String(index);
      return [key, { default: instance }];
    }),
  );
}

function entityDefinitionsByEntityName(metaModel: MetaModel): Record<string, EntityDefinition> {
  return Object.fromEntries(
    metaModel.entityDefinitions.map((entityDefinition) => [entityDefinition.name, entityDefinition]),
  );
}
/**
 * Build modelTestsToRun from a MetaModel.
 * @param groupFilter optional list of groupName substrings to include; omit for all MetaModel-backed groups.
 * Groups not present on MetaModel (e.g. StoreBasedConfiguration, MiroirTest) are omitted.
 */
function buildModelTestsToRun(
  metaModel: MetaModel,
  entityNames?: string[],
  groupFilter?: string[],
): ModelTestToRun[] {
  const entityDefinitions = entityDefinitionsByEntityName(metaModel);
  // console.log("entityDefinitions:", JSON.stringify(Object.keys(entityDefinitions), null, 2));
  const all: ModelTestToRun[] = metaModel.entities
    .map((entity) => entity.name)
    // .filter((entityName) => entityNames.includes(entityName))
    .map((entityName) => {
      // console.log("entityName:", entityName);
      // console.log(
      //   `metaModel[${defaultMiroirMetaModelEntityNameToAttributeName[entityName]}]:`,
      //   ((metaModel as any)[
      //     defaultMiroirMetaModelEntityNameToAttributeName[entityName] ?? entityName
      //   ]??[]).length,
      // );
      return {
        groupName: entityName,
        jzodSchema: entityDefinitions[entityName]?.mlSchema as unknown as JzodElement,
        instances: metaModelInstancesToRecord((metaModel as any)[defaultMiroirMetaModelEntityNameToAttributeName[entityName] ?? entityName] ?? []),
      };
    });

    return all;
  // // filter out by groupName
  // return all.filter(
  //   (test) =>
  //     Object.keys(test.instances).length > 0 &&
  //   (!groupFilter || groupFilter.includes(test.groupName)),
  // );
}

const checkedEntityNames = [
  "Entity",
  "EntityDefinition",
  "Report",
  "EndpointVersion",
  "Menu",
  "JzodSchema",
  "QueryVersion",
  "SelfApplication",
  "SelfApplicationVersion",
  "Runner",
];

function describeEntityGroup(
  groupName: string,
  jzodSchema: JzodElement,
  instances: Record<string, { default: any }>,
  modelEnv: MiroirModelEnvironment,
): void {
  describe(groupName, () => {
    for (const [path, module] of Object.entries(instances)) {
      const instance = module.default;
      const label = buildInstanceLabel(instance, path);
      it(label, () => {
        const result = jzodTypeCheck(
          jzodSchema,
          instance,
          [], // currentValuePath
          [], // currentTypePath
          modelEnv,
          {}, // relativeReferenceJzodContext
        );
        if (result.status === "error") {
          console.error(`Validation error for instance ${label}:`, JSON.stringify(getInnermostTypeCheckError(result), null, 2));
        }
        expect(
          result.status,
          `jzodTypeCheck failed for instance ${label}`,
          // `jzodTypeCheck failed for instance ${label}: ${JSON.stringify(result)}`,
        ).toBe("ok");
      });
    }
  });
}

// ================================================================================================
// Test suites — Model instances (validated against the Miroir meta-model)
// ================================================================================================
// Groups not on MetaModel (StoreBasedConfiguration, SelfApplicationDeploymentConfiguration,
// SelfApplicationModelBranch, TransformerDefinition, MiroirTest) are filtered out by the builder.
console.log("Found Entities in defaultMiroirMetaModel:", defaultMiroirMetaModel.entities.map(e => e.name).join(", "));
const modelTestsToRun: ModelTestToRun[] = buildModelTestsToRun(defaultMiroirMetaModel);
// console.log("modelTestsToRun:", JSON.stringify(modelTestsToRun, null, 2));

modelTestsToRun.forEach(({ groupName, jzodSchema, instances, filterByName }) => {
  const filteredInstances = Object.fromEntries(Object.entries(instances).filter(e => {
    const instance = e[1].default;
    if (!instance.name) return true;
    if (!filterByName) return true;
    return filterByName.some(name => instance.name.includes(name));
  }));
  describeEntityGroup(
    groupName,
    jzodSchema,
    filteredInstances,
    defaultMiroirModelEnvironment,
  );
});

describe("static schema mode (199)", () => {
  it("model environment schema is miroirFundamentalJzodSchema by reference", () => {
    expect(defaultMiroirModelEnvironment.miroirFundamentalJzodSchema).toBe(
      miroirFundamentalJzodSchema,
    );
  });

  it("EntityList report still validates against static domainAction", () => {
    const reportSchema = (entityDefinitionReport as unknown as { mlSchema: JzodElement }).mlSchema;
    const result = jzodTypeCheck(
      reportSchema,
      reportEntityList,
      [],
      [],
      defaultMiroirModelEnvironment,
      {},
    );
    if (result.status === "error") {
      console.error(
        "EntityList validation error:",
        JSON.stringify(getInnermostTypeCheckError(result), null, 2),
      );
    }
    expect(result.status).toBe("ok");
  });
});
