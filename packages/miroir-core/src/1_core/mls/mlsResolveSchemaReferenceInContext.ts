import type { Uuid } from "../../0_interfaces/1_core/EntityVersion";
import {
  MlElement,
  MlObject,
  MlReference,
  MlSchema,
  MetaModel,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../../0_interfaces/1_core/Transformer";
import type { ReduxDeploymentsState } from "../../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { ResolveBuildTransformersTo, Step } from "../../2_domain/Transformers";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/MiroirLoggerFactory";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "mlsResolveSchemaReferenceInContext");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => { log = logger; });

// ################################################################################################
export function resolveSchemaReferenceInContextTransformer<T extends MiroirModelEnvironment>(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: any, // Use any for now until transformer types are generated
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: T,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined,
  deploymentUuid?: Uuid,
): MlElement {
  return resolveMlSchemaReferenceInContext(
    transformer.mlReference,
    transformer.relativeReferenceMlContext || {},
    modelEnvironment,
  );
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
/**
 * 
 * TODO: inappropriate interface, passing the testSchema and the testSchema.context separately is redundant.
 * resolveMlSchemaReferenceInContext should take a relativeReferenceMlContext, and add to it the
 * local context found in the mlReference
 * 
 * 
 * @param mlReference 
 * @param relativeReferenceMlContext 
 * @param miroirEnvironment 
 * @returns 
 */
export function resolveMlSchemaReferenceInContext<T extends MiroirModelEnvironment>(
  mlReference: MlReference | MlObject | (MlReference | MlObject | undefined)[],
  relativeReferenceMlContext: { [k: string]: MlElement } = {},
  miroirEnvironment: T,
): MlElement {
  if (Array.isArray(mlReference)) {
    // Aggregate resolved items into an object with keys as indices
    const resolvedItems = mlReference.map((ref, idx) => {
      if (ref === undefined) return undefined;
      return resolveMlSchemaReferenceInContext(
        ref,
        relativeReferenceMlContext,
        miroirEnvironment,
      );
    });
    // If all items are objects with a definition, merge them into one object
    if (resolvedItems.every(item => item && item.type === "object" && typeof item.definition === "object")) {
      const mergedDefinition = Object.assign(
        {},
        ...resolvedItems.map(item => (item as MlObject).definition)
      );
    return { type: "object", definition: mergedDefinition };
    } else {
      throw new Error(
        "resolveMlSchemaReferenceInContext can not handle array of references with mixed types or non-object definitions: " +
          JSON.stringify(resolvedItems)
      );
    }
  }
  if (mlReference.type == "object") {
    throw new Error(
      "resolveMlSchemaReferenceInContext can not handle object reference " +
        JSON.stringify(mlReference)
    );
  }
  if ((!mlReference.definition || !mlReference.definition?.absolutePath) && !relativeReferenceMlContext) {
    throw new Error(
      "resolveMlSchemaReferenceInContext can not handle complex / unexisting reference " +
        JSON.stringify(mlReference) +
        " for empty relative reference: " +
        JSON.stringify(relativeReferenceMlContext)
    );
  }
  // log.info(
  //   "resolveMlSchemaReferenceInContext called for reference",
  //   JSON.stringify(mlReference, null, 2),
  // );
  const absoluteReferences = miroirEnvironment.currentModel
    ? [
        miroirEnvironment.miroirFundamentalMlSchema,
        ...((miroirEnvironment.currentModel as any)?.mlSchemas || []),
        ...((miroirEnvironment.miroirMetaModel as any)?.mlSchemas || []),
      ] // very inefficient!
    : [miroirEnvironment.miroirFundamentalMlSchema];
  const absoluteReferenceTargetMlSchema: { [k: string]: MlElement } = mlReference?.definition
    .absolutePath
    ? (absoluteReferences.find((s: MlSchema) => s.uuid == mlReference?.definition.absolutePath)
        ?.definition.context ?? {})
    : (relativeReferenceMlContext ?? mlReference);

  const targetMlSchema: MlElement | undefined = mlReference?.definition.relativePath
    ? absoluteReferenceTargetMlSchema[mlReference?.definition.relativePath]
    : { type: "object", definition: absoluteReferenceTargetMlSchema };


  // log.info(
  //   "resolveMlSchemaReferenceInContext for reference",
  //   "absolutePath",
  //   mlReference.definition.absolutePath,
  //   "relativePath",
  //   mlReference.definition.relativePath,
  //   "relativeReferenceMlContext",
  //   Object.keys(relativeReferenceMlContext??{}),
  //   "result",
  //   targetMlSchema,
  // );

  if (!targetMlSchema) {
    throw new Error(
      "resolveMlSchemaReferenceInContext could not resolve reference " +
        JSON.stringify(mlReference.definition) +
        " absoluteReferences keys " +
        JSON.stringify(absoluteReferences.map(r => r.uuid)) +
        " current Model " + Object.keys(miroirEnvironment.currentModel??{}) + 
        " relativeReferenceMlContext keys " +
        JSON.stringify(relativeReferenceMlContext)
    );
  }

  return targetMlSchema;
}

// ################################################################################################
export function recursiveResolveMlSchemaReferenceInContext<T extends MiroirModelEnvironment>(
  mlReference: MlReference | MlObject | (MlReference | MlObject | undefined)[],
  relativeReferenceMlContext: { [k: string]: MlElement } = {},
  miroirEnvironment: T,
): MlElement {
  const resolved = resolveMlSchemaReferenceInContext(mlReference, relativeReferenceMlContext, miroirEnvironment);
  if (resolved.type === "schemaReference") {
    return recursiveResolveMlSchemaReferenceInContext(resolved, relativeReferenceMlContext, miroirEnvironment);
  }
  return resolved;
}

// ################################################################################################
// TODO: redundant to resolveMlSchemaReferenceInContext, resolveMlSchemaReference is used only in JzodTools,
// refactor / merge with resolveMlSchemaReferenceInContext.
export function resolveMlSchemaReference(
  miroirFundamentalMlSchema: MlSchema,
  mlReference?: MlReference,
  currentModel?: MetaModel,
  relativeReferenceMlContext?: MlObject | MlReference,
): MlElement {
  // const fundamentalMlSchemas = miroirFundamentalMlSchema.definition.context
  const absoluteReferences = (currentModel
    ? [miroirFundamentalMlSchema, ...((currentModel as any)?.mlSchemas || [])] // very inefficient!
    : [miroirFundamentalMlSchema]
  )
  const absoluteReferenceTargetMlSchema: MlObject | MlReference | undefined = mlReference?.definition
    .absolutePath
    ? {
        type: "object",
        definition:
          absoluteReferences.find((s: MlSchema) => s.uuid == mlReference?.definition.absolutePath)?.definition.context ?? {},
      }
    : relativeReferenceMlContext ?? mlReference;
  const targetMlSchema = mlReference?.definition.relativePath
    ? absoluteReferenceTargetMlSchema?.type == "object" && absoluteReferenceTargetMlSchema?.definition
      ? absoluteReferenceTargetMlSchema?.definition[mlReference?.definition.relativePath]
      : absoluteReferenceTargetMlSchema?.type == "schemaReference" && absoluteReferenceTargetMlSchema?.context
      ? absoluteReferenceTargetMlSchema?.context[mlReference?.definition.relativePath]
      : undefined
    : absoluteReferenceTargetMlSchema;


  if (!targetMlSchema) {
    log.error(
      "resolveMlSchemaReference failed for mlSchema",
      mlReference,
      "result",
      targetMlSchema,
      " absoluteReferences", 
      absoluteReferences,
      "absoluteReferenceTargetMlSchema",
      absoluteReferenceTargetMlSchema,
      "currentModel",
      currentModel,
      "rootMlSchema",
      relativeReferenceMlContext
    );
    throw new Error("resolveMlSchemaReference could not resolve reference " + JSON.stringify(mlReference) + " absoluteReferences" + absoluteReferences);
  }

  return targetMlSchema;
}
