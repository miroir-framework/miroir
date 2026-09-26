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

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "jzodResolveSchemaReferenceInContext");
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
  return resolveJzodSchemaReferenceInContext(
    transformer.mlReference,
    transformer.relativeReferenceJzodContext || {},
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
 * resolveJzodSchemaReferenceInContext should take a relativeReferenceJzodContext, and add to it the
 * local context found in the mlReference
 * 
 * 
 * @param mlReference 
 * @param relativeReferenceJzodContext 
 * @param miroirEnvironment 
 * @returns 
 */
export function resolveJzodSchemaReferenceInContext<T extends MiroirModelEnvironment>(
  mlReference: MlReference | MlObject | (MlReference | MlObject | undefined)[],
  relativeReferenceJzodContext: { [k: string]: MlElement } = {},
  miroirEnvironment: T,
): MlElement {
  if (Array.isArray(mlReference)) {
    // Aggregate resolved items into an object with keys as indices
    const resolvedItems = mlReference.map((ref, idx) => {
      if (ref === undefined) return undefined;
      return resolveJzodSchemaReferenceInContext(
        ref,
        relativeReferenceJzodContext,
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
        "resolveJzodSchemaReferenceInContext can not handle array of references with mixed types or non-object definitions: " +
          JSON.stringify(resolvedItems)
      );
    }
  }
  if (mlReference.type == "object") {
    throw new Error(
      "resolveJzodSchemaReferenceInContext can not handle object reference " +
        JSON.stringify(mlReference)
    );
  }
  if ((!mlReference.definition || !mlReference.definition?.absolutePath) && !relativeReferenceJzodContext) {
    throw new Error(
      "resolveJzodSchemaReferenceInContext can not handle complex / unexisting reference " +
        JSON.stringify(mlReference) +
        " for empty relative reference: " +
        JSON.stringify(relativeReferenceJzodContext)
    );
  }
  // log.info(
  //   "resolveJzodSchemaReferenceInContext called for reference",
  //   JSON.stringify(mlReference, null, 2),
  // );
  const absoluteReferences = miroirEnvironment.currentModel
    ? [
        miroirEnvironment.miroirFundamentalJzodSchema,
        ...((miroirEnvironment.currentModel as any)?.jzodSchemas || []),
        ...((miroirEnvironment.miroirMetaModel as any)?.jzodSchemas || []),
      ] // very inefficient!
    : [miroirEnvironment.miroirFundamentalJzodSchema];
  const absoluteReferenceTargetJzodSchema: { [k: string]: MlElement } = mlReference?.definition
    .absolutePath
    ? (absoluteReferences.find((s: MlSchema) => s.uuid == mlReference?.definition.absolutePath)
        ?.definition.context ?? {})
    : (relativeReferenceJzodContext ?? mlReference);

  const targetJzodSchema: MlElement | undefined = mlReference?.definition.relativePath
    ? absoluteReferenceTargetJzodSchema[mlReference?.definition.relativePath]
    : { type: "object", definition: absoluteReferenceTargetJzodSchema };


  // log.info(
  //   "resolveJzodSchemaReferenceInContext for reference",
  //   "absolutePath",
  //   mlReference.definition.absolutePath,
  //   "relativePath",
  //   mlReference.definition.relativePath,
  //   "relativeReferenceJzodContext",
  //   Object.keys(relativeReferenceJzodContext??{}),
  //   "result",
  //   targetJzodSchema,
  // );

  if (!targetJzodSchema) {
    throw new Error(
      "resolveJzodSchemaReferenceInContext could not resolve reference " +
        JSON.stringify(mlReference.definition) +
        " absoluteReferences keys " +
        JSON.stringify(absoluteReferences.map(r => r.uuid)) +
        " current Model " + Object.keys(miroirEnvironment.currentModel??{}) + 
        " relativeReferenceJzodContext keys " +
        JSON.stringify(relativeReferenceJzodContext)
    );
  }

  return targetJzodSchema;
}

// ################################################################################################
export function recursiveResolveJzodSchemaReferenceInContext<T extends MiroirModelEnvironment>(
  mlReference: MlReference | MlObject | (MlReference | MlObject | undefined)[],
  relativeReferenceJzodContext: { [k: string]: MlElement } = {},
  miroirEnvironment: T,
): MlElement {
  const resolved = resolveJzodSchemaReferenceInContext(mlReference, relativeReferenceJzodContext, miroirEnvironment);
  if (resolved.type === "schemaReference") {
    return recursiveResolveJzodSchemaReferenceInContext(resolved, relativeReferenceJzodContext, miroirEnvironment);
  }
  return resolved;
}

// ################################################################################################
// TODO: redundant to resolveJzodSchemaReferenceInContext, resolveJzodSchemaReference is used only in JzodTools,
// refactor / merge with resolveJzodSchemaReferenceInContext.
export function resolveJzodSchemaReference(
  miroirFundamentalJzodSchema: MlSchema,
  mlReference?: MlReference,
  currentModel?: MetaModel,
  relativeReferenceJzodContext?: MlObject | MlReference,
): MlElement {
  // const fundamentalJzodSchemas = miroirFundamentalJzodSchema.definition.context
  const absoluteReferences = (currentModel
    ? [miroirFundamentalJzodSchema, ...((currentModel as any)?.jzodSchemas || [])] // very inefficient!
    : [miroirFundamentalJzodSchema]
  )
  const absoluteReferenceTargetJzodSchema: MlObject | MlReference | undefined = mlReference?.definition
    .absolutePath
    ? {
        type: "object",
        definition:
          absoluteReferences.find((s: MlSchema) => s.uuid == mlReference?.definition.absolutePath)?.definition.context ?? {},
      }
    : relativeReferenceJzodContext ?? mlReference;
  const targetJzodSchema = mlReference?.definition.relativePath
    ? absoluteReferenceTargetJzodSchema?.type == "object" && absoluteReferenceTargetJzodSchema?.definition
      ? absoluteReferenceTargetJzodSchema?.definition[mlReference?.definition.relativePath]
      : absoluteReferenceTargetJzodSchema?.type == "schemaReference" && absoluteReferenceTargetJzodSchema?.context
      ? absoluteReferenceTargetJzodSchema?.context[mlReference?.definition.relativePath]
      : undefined
    : absoluteReferenceTargetJzodSchema;


  if (!targetJzodSchema) {
    log.error(
      "resolveJzodSchemaReference failed for mlSchema",
      mlReference,
      "result",
      targetJzodSchema,
      " absoluteReferences", 
      absoluteReferences,
      "absoluteReferenceTargetJzodSchema",
      absoluteReferenceTargetJzodSchema,
      "currentModel",
      currentModel,
      "rootJzodSchema",
      relativeReferenceJzodContext
    );
    throw new Error("resolveJzodSchemaReference could not resolve reference " + JSON.stringify(mlReference) + " absoluteReferences" + absoluteReferences);
  }

  return targetJzodSchema;
}
