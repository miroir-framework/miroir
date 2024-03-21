import {
  EntityDefinition,
  JzodElement,
  JzodObject,
  JzodSchema,
  MetaModel,
  domainEndpointVersionV1,
  entityDefinitionApplication,
  entityDefinitionApplicationVersion,
  entityDefinitionBundleV1,
  entityDefinitionCommit,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDefinitionJzodSchema,
  entityDefinitionMenu,
  entityDefinitionQueryVersionV1,
  entityDefinitionReport,
  getMiroirFundamentalJzodSchema,
  instanceEndpointVersionV1,
  jzodSchemajzodMiroirBootstrapSchema,
  localCacheEndpointVersionV1,
  modelEndpointV1,
  persistenceEndpointVersionV1,
  queryEndpointVersionV1,
  resolveJzodSchemaReference,
  storeManagementEndpoint,
  undoRedoEndpointVersionV1,
} from "miroir-core";

const miroirFundamentalJzodSchema: JzodSchema = getMiroirFundamentalJzodSchema(
  entityDefinitionBundleV1 as EntityDefinition,
  entityDefinitionCommit as EntityDefinition,
  modelEndpointV1,
  storeManagementEndpoint,
  instanceEndpointVersionV1,
  undoRedoEndpointVersionV1,
  localCacheEndpointVersionV1,
  domainEndpointVersionV1,
  queryEndpointVersionV1,
  persistenceEndpointVersionV1,
  jzodSchemajzodMiroirBootstrapSchema as JzodSchema,
  entityDefinitionApplication as EntityDefinition,
  entityDefinitionApplicationVersion as EntityDefinition,
  entityDefinitionEntity as EntityDefinition,
  entityDefinitionEntityDefinition as EntityDefinition,
  entityDefinitionJzodSchema as EntityDefinition,
  entityDefinitionMenu  as EntityDefinition,
  entityDefinitionQueryVersionV1 as EntityDefinition,
  entityDefinitionReport as EntityDefinition,
  // jzodSchemajzodMiroirBootstrapSchema as any,
);


// #####################################################################################################
export type JzodObjectRecord = { [k: string]: JzodObject };
export type JzodElementRecord = { [k: string]: JzodElement };
export type JzodEnumSchemaToJzodElementResolver = (type: string, definition?: any) => JzodElement;

export function getCurrentEnumJzodSchemaResolver(
  currentMiroirModel: MetaModel,
  // relativeReferenceJzodSchema: JzodObject,
// ):JzodElementRecord  {
):JzodEnumSchemaToJzodElementResolver  {
  return (type: string, definition?: any) => {
    console.log("getCurrentEnumJzodSchemaResolver called with", type, "definition", definition)
    return (currentMiroirModel.entities.length == 0
      ? ({} as JzodElementRecord)
      : {
          array: resolveJzodSchemaReference(
            miroirFundamentalJzodSchema,
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodArray" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          simpleType: resolveJzodSchemaReference(
            miroirFundamentalJzodSchema,
            {
              type: "schemaReference",
              definition: {
                absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                relativePath:
                  definition == "string"
                    ? "jzodAttributeStringWithValidations"
                    : definition == "number"
                    ? "jzodAttributeNumberWithValidations"
                    : definition == "date"
                    ? "jzodAttributeDateWithValidations"
                    : "jzodAttribute",
              },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          enum: resolveJzodSchemaReference(
            miroirFundamentalJzodSchema,
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodEnum" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          union: resolveJzodSchemaReference(
            miroirFundamentalJzodSchema,
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodUnion" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          record: resolveJzodSchemaReference(
            miroirFundamentalJzodSchema,
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodRecord" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          object: resolveJzodSchemaReference(
            miroirFundamentalJzodSchema,
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodObject" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          function: resolveJzodSchemaReference(
            miroirFundamentalJzodSchema,
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodFunction" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          lazy: resolveJzodSchemaReference(
            miroirFundamentalJzodSchema,
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodLazy" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          literal: resolveJzodSchemaReference(
            miroirFundamentalJzodSchema,
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodLiteral" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          schemaReference: resolveJzodSchemaReference(
            miroirFundamentalJzodSchema,
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodReference" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
        } as JzodElementRecord
        )[type];
  }
}
