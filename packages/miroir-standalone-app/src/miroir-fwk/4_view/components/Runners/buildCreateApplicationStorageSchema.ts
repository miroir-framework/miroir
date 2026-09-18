import type { JzodObject, ProcessCapabilities } from "miroir-core";
import type { FormMLSchema } from "./RunnerInterface.js";

export type CreateApplicationStoreType = ProcessCapabilities["creatableStoreTypes"][number];

export const ALL_NON_BUNDLED_CREATABLE_STORE_TYPES: CreateApplicationStoreType[] = [
  "indexedDb",
  "filesystem",
  "sql",
  "mongodb",
];

const INDEXED_DB_STORE_SECTION_CONFIGURATION: JzodObject = {
  type: "object",
  definition: {
    emulatedServerType: { type: "literal", definition: "indexedDb" },
  },
};

const FILESYSTEM_STORE_SECTION_CONFIGURATION: JzodObject = {
  type: "object",
  definition: {
    emulatedServerType: { type: "literal", definition: "filesystem" },
  },
};

const SQL_STORE_SECTION_CONFIGURATION: JzodObject = {
  type: "object",
  definition: {
    emulatedServerType: { type: "literal", definition: "sql" },
    connectionString: {
      type: "string",
      tag: {
        value: {
          defaultLabel: "SQL Connection String",
          display: { editable: false },
          initializeTo: {
            initializeToType: "transformer",
            transformer: {
              transformerType: "getFromParameters",
              interpolation: "runtime",
              referencePath: ["viewParams", "postgresConnectionString"],
            },
          },
        },
      },
    },
  },
};

const MONGODB_STORE_SECTION_CONFIGURATION: JzodObject = {
  type: "object",
  definition: {
    emulatedServerType: { type: "literal", definition: "mongodb" },
    connectionString: {
      type: "string",
      tag: {
        value: {
          defaultLabel: "MongoDB Connection String",
          display: { editable: false },
          initializeTo: {
            initializeToType: "transformer",
            transformer: {
              transformerType: "getFromParameters",
              interpolation: "runtime",
              referencePath: ["viewParams", "mongoConnectionString"],
            },
          },
        },
      },
    },
  },
};

const VARIANT_BY_STORE_TYPE: Partial<
  Record<CreateApplicationStoreType, { key: string; schema: JzodObject }>
> = {
  indexedDb: {
    key: "indexedDbStoreSectionConfiguration",
    schema: INDEXED_DB_STORE_SECTION_CONFIGURATION,
  },
  filesystem: {
    key: "filesystemDbStoreSectionConfiguration",
    schema: FILESYSTEM_STORE_SECTION_CONFIGURATION,
  },
  sql: {
    key: "sqlDbStoreSectionConfiguration",
    schema: SQL_STORE_SECTION_CONFIGURATION,
  },
  mongodb: {
    key: "mongoDbStoreSectionConfiguration",
    schema: MONGODB_STORE_SECTION_CONFIGURATION,
  },
};

function connectionStringUnionBranch(
  viewParamsKey: "postgresConnectionString" | "mongoConnectionString",
  relativePath: string,
) {
  return {
    transformerType: "ifThenElse",
    if: {
      transformerType: "boolExpr",
      operator: "==",
      left: {
        transformerType: "getFromParameters",
        referencePath: ["viewParams", viewParamsKey],
      },
      right: {
        transformerType: "returnValue",
        value: null,
      },
    },
    then: [],
    else: [
      {
        type: "schemaReference",
        definition: { relativePath },
      },
    ],
  };
}

export function buildCreateApplicationStorageSchema(
  creatableStoreTypes: CreateApplicationStoreType[],
): Record<string, JzodObject> {
  const context: Record<string, JzodObject> = {};
  const seen = new Set<CreateApplicationStoreType>();
  for (const storeType of creatableStoreTypes) {
    if (storeType === "bundled" || seen.has(storeType)) {
      continue;
    }
    seen.add(storeType);
    const variant = VARIANT_BY_STORE_TYPE[storeType];
    if (!variant) {
      continue;
    }
    context[variant.key] = variant.schema;
  }
  return context;
}

export function getRunner_CreateApplication_formMLSchema(
  creatableStoreTypes: CreateApplicationStoreType[] = ALL_NON_BUNDLED_CREATABLE_STORE_TYPES,
): FormMLSchema {
  const variants = buildCreateApplicationStorageSchema(creatableStoreTypes);
  const included = new Set(
    creatableStoreTypes.filter((storeType) => storeType !== "bundled"),
  );

  const lists: unknown[] = [];
  const unconditionalRefs: { type: "schemaReference"; definition: { relativePath: string } }[] = [];
  if (included.has("indexedDb")) {
    unconditionalRefs.push({
      type: "schemaReference",
      definition: { relativePath: "indexedDbStoreSectionConfiguration" },
    });
  }
  if (included.has("filesystem")) {
    unconditionalRefs.push({
      type: "schemaReference",
      definition: { relativePath: "filesystemDbStoreSectionConfiguration" },
    });
  }
  if (unconditionalRefs.length > 0) {
    lists.push(unconditionalRefs);
  }
  if (included.has("sql")) {
    lists.push(
      connectionStringUnionBranch("postgresConnectionString", "sqlDbStoreSectionConfiguration"),
    );
  }
  if (included.has("mongodb")) {
    lists.push(
      connectionStringUnionBranch("mongoConnectionString", "mongoDbStoreSectionConfiguration"),
    );
  }

  return {
    formMLSchemaType: "transformer",
    transformer: {
      type: "object",
      definition: {
        createApplicationAndDeployment: {
          type: "object",
          definition: {
            applicationStorage: {
              type: "schemaReference",
              context: {
                ...variants,
                storeSectionConfiguration: {
                  type: "union",
                  discriminator: "emulatedServerType",
                  definition: {
                    transformerType: "concatLists",
                    lists,
                  } as any,
                },
              },
              definition: {
                relativePath: "storeSectionConfiguration",
              },
            },
            deploymentUuid: {
              type: "uuid",
              tag: {
                value: {
                  defaultLabel: "Deployment UUID",
                  display: { editable: false },
                },
              },
            },
            newApplicationUuid: {
              type: "uuid",
              tag: {
                value: {
                  defaultLabel: "New Application UUID",
                  display: { editable: false },
                },
              },
            },
            applicationName: {
              type: "string",
              tag: {
                value: {
                  defaultLabel: "Application Name or Folder Path",
                },
              },
            },
          },
        },
      },
    },
  };
}
