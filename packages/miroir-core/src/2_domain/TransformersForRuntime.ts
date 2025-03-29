import mustache from 'mustache';
// import Mustache from "mustache";
import { v4 as uuidv4 } from 'uuid';
import {
  DomainElementFailed,
  DomainElementInstanceArray,
  DomainElementObject,
  DomainElementString,
  DomainElementSuccess,
  ExtendedTransformerForRuntime,
  Menu,
  Transformer,
  Transformer_contextOrParameterReferenceTO_REMOVE,
  TransformerForBuild_InnerReference,
  TransformerForBuild_objectDynamicAccess,
  TransformerDefinition,
  TransformerForBuild,
  TransformerForBuild_count,
  TransformerForBuild_inner_object_alter,
  TransformerForBuild_innerFullObjectTemplate,
  TransformerForBuild_list,
  TransformerForBuild_list_listMapperToList,
  TransformerForBuild_mustacheStringTemplate,
  TransformerForBuild_object_fullTemplate,
  TransformerForBuild_object_listPickElement,
  TransformerForBuild_object_listReducerToIndexObject,
  TransformerForBuild_object_listReducerToSpreadObject,
  TransformerForBuild_objectEntries,
  TransformerForBuild_objectValues,
  TransformerForBuild_unique,
  TransformerForRuntime,
  TransformerForRuntime_count,
  TransformerForRuntime_innerFullObjectTemplate,
  TransformerForRuntime_InnerReference,
  TransformerForRuntime_list_listMapperToList,
  TransformerForRuntime_list_listPickElement,
  TransformerForRuntime_mapper_listToObject,
  TransformerForRuntime_mustacheStringTemplate_NOT_IMPLEMENTED,
  TransformerForRuntime_object_alter,
  TransformerForRuntime_object_fullTemplate,
  TransformerForRuntime_object_listReducerToSpreadObject,
  TransformerForRuntime_objectDynamicAccess,
  TransformerForRuntime_objectEntries,
  TransformerForRuntime_objectValues,
  TransformerForRuntime_unique
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Action2Error, Domain2ElementFailed, Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { transformer_menu_AddItem } from "../1_core/Menu";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory";
import { packageName } from "../constants";
import { resolvePathOnObject } from "../tools";
import { cleanLevel } from "./constants";
import { transformer } from "zod";
import { transformer_spreadSheetToJzodSchema } from "./Spreadsheet";
import { resolve } from 'path';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Transformer")
).then((logger: LoggerInterface) => {log = logger});


export type ActionTemplate = any;
export type Step = "build" | "runtime";
export type ResolveBuildTransformersTo = "value" | "constantTransformer";
// ################################################################################################
export const defaultTransformers = {
  transformer_extended_apply,
  transformer_mustacheStringTemplate_apply,
  transformer_InnerReference_resolve,
  transformer_objectAlter,
  transformer_object_fullTemplate,
  transformer_object_listReducerToIndexObject_apply,
  transformer_object_listReducerToSpreadObject_apply,
  transformerForBuild_list_listMapperToList_apply,
  transformer_dynamicObjectAccess_apply,
  // ##############################
  transformer_menu_AddItem,
}

// ################################################################################################
function resolveApplyTo(
  step: Step,
  objectName: string | undefined,
  transformer:
    | TransformerForBuild_object_fullTemplate
    | TransformerForRuntime_object_fullTemplate
    | TransformerForBuild_inner_object_alter
    | TransformerForRuntime_object_alter,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>
) {
  if (transformer.applyTo.referenceType == "referencedExtractor") {
    throw new Error("resolveApplyTo can not handle referencedExtractor");
  }

  const transformerReference = transformer.applyTo.reference;

  const resolvedReference =
    typeof transformerReference == "string"
      ? defaultTransformers.transformer_InnerReference_resolve(
          step,
          { transformerType: "contextReference", referenceName: transformerReference }, // TODO: there's a bug, count can not be used at build time, although it should be usable at build time
          resolveBuildTransformersTo,
          queryParams,
          contextResults
        )
      : defaultTransformers.transformer_extended_apply(
          step,
          objectName,
          transformerReference,
          resolveBuildTransformersTo,
          queryParams,
          contextResults
        );
  return resolvedReference;
}

// ################################################################################################
// TODO: identical to resolveApplyTo, should be merged?
export function resolveApplyTo_legacy(
  transformer: 
  | TransformerForBuild_count
  | TransformerForBuild_list_listMapperToList
  | TransformerForBuild_object_listPickElement
  | TransformerForBuild_object_listReducerToSpreadObject
  | TransformerForBuild_object_listReducerToIndexObject
  | TransformerForBuild_objectEntries
  | TransformerForBuild_objectValues
  | TransformerForBuild_unique
  | TransformerForRuntime_count
  | TransformerForRuntime_list_listMapperToList 
  | TransformerForRuntime_list_listPickElement
  | TransformerForRuntime_mapper_listToObject 
  | TransformerForRuntime_object_listReducerToSpreadObject
  | TransformerForRuntime_objectEntries
  | TransformerForRuntime_objectValues
  | TransformerForRuntime_unique
  ,
  step: Step,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults: Record<string, any> | undefined,
  label: string | undefined
) {
  log.info("resolveApplyTo_legacy called for transformer", transformer, "step", step, "label", label);
  
  if (transformer.applyTo.referenceType == "referencedExtractor") {
    throw new Error("resolveApplyTo_legacy can not handle referencedExtractor");
  }

  const transformerReference = transformer.applyTo.reference;

  const resolvedReference =
    typeof transformerReference == "string"
      ? defaultTransformers.transformer_InnerReference_resolve(
          step,
          { transformerType: "contextReference", referenceName: transformerReference }, // TODO: there's a bug, count can not be used at build time, although it should be usable at build time
          resolveBuildTransformersTo,
          queryParams,
          contextResults
        )
      : defaultTransformers.transformer_extended_apply(
          step,
          label,
          transformerReference,
          resolveBuildTransformersTo,
          queryParams,
          contextResults
        );
  return resolvedReference;
}

// ################################################################################################
function transformerForBuild_list_listMapperToList_apply(
  step: Step,
  label: string | undefined,
  transformer: TransformerForRuntime_list_listMapperToList | TransformerForBuild_list_listMapperToList,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any[]> {
  const resolvedApplyTo = resolveApplyTo_legacy(transformer, step, resolveBuildTransformersTo, queryParams, contextResults, label);
  if (resolvedApplyTo instanceof Domain2ElementFailed) {
    log.error(
      "transformerForBuild_list_listMapperToList_apply extractorTransformer can not apply to failed resolvedReference",
      resolvedApplyTo
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["transformerForBuild_list_listMapperToList_apply"],
      queryContext: "transformerForBuild_list_listMapperToList_apply can not apply to failed resolvedReference",
      innerError: resolvedApplyTo
    });
  }
  log.info(
    "transformerForBuild_list_listMapperToList_apply",
    "step",
    step,
    "extractorTransformer resolvedReference",
    resolvedApplyTo
  );
  const resultArray:any[] = [];

  if (Array.isArray(resolvedApplyTo)) {
    for (const element of resolvedApplyTo) {
      resultArray.push(
        defaultTransformers.transformer_extended_apply(
          step,
          (element as any).name ?? "No name for element",
          transformer.elementTransformer as any,
          resolveBuildTransformersTo,
          queryParams,
          {
            ...contextResults,
            [transformer.referenceToOuterObject]: element,
          } // inefficient!
        )
      ); // TODO: constrain type of transformer
    }
  } else { // allow this?  or should it be an error?
    if (typeof resolvedApplyTo == "object") {
      for (const element of Object.entries(resolvedApplyTo)) {
        resultArray.push(
          defaultTransformers.transformer_extended_apply(step, element[0], transformer.elementTransformer as any, resolveBuildTransformersTo, queryParams, {
              ...contextResults,
              [transformer.referenceToOuterObject]: element[1],
          })
        ); // TODO: constrain type of transformer
      }
    } else {
      log.error("transformerForBuild_list_listMapperToList_apply extractorTransformer can not work on resolvedReference", resolvedApplyTo);
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        failureOrigin: ["transformerForBuild_list_listMapperToList_apply"],
        failureMessage:
          "resolved reference is not instanceUuidIndex or object " + JSON.stringify(resolvedApplyTo, null, 2),
      });
    }
  }
  const sortByAttribute = transformer.orderBy
  ? (a: any[]) =>
      a.sort((a, b) =>
        a[transformer.orderBy ?? ""].localeCompare(b[transformer.orderBy ?? ""], "en", {
          sensitivity: "base",
        })
      )
  : (a: any[]) => a;

  const sortedResultArray = sortByAttribute(resultArray);
  return sortedResultArray;
}

// ################################################################################################
function transformer_object_listReducerToSpreadObject_apply(
  step: Step,
  label: string | undefined,
  transformer: TransformerForBuild_object_listReducerToSpreadObject | TransformerForRuntime_object_listReducerToSpreadObject,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  log.info(
    "transformer_object_listReducerToSpreadObject_apply called for transformer",
    transformer,
    "queryParams",
    JSON.stringify(queryParams, null, 2),
    "contextResults",
    JSON.stringify(contextResults, null, 2)
  );
  const resolvedReference = resolveApplyTo_legacy(transformer, step, resolveBuildTransformersTo, queryParams, contextResults, label);

  if (resolvedReference instanceof Domain2ElementFailed) {
    log.error(
      "transformer_object_listReducerToSpreadObject_apply can not apply to failed resolvedReference",
      resolvedReference
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["transformer_object_listReducerToSpreadObject_apply"],
      queryContext: "transformer_object_listReducerToSpreadObject_apply can not apply to failed resolvedReference",
      innerError: resolvedReference
    });
  }

  const isListOfObjects = Array.isArray(resolvedReference) && resolvedReference.every((entry) => typeof entry == "object" && !Array.isArray(entry));

  if (!isListOfObjects) {
    log.error(
      "transformer_object_listReducerToSpreadObject_apply can not apply to resolvedReference of wrong type",
      resolvedReference
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["transformer_object_listReducerToSpreadObject_apply"],
      queryContext: "transformer_object_listReducerToSpreadObject_apply can not apply to resolvedReference of wrong type",
      queryParameters: resolvedReference,
    });
  }
  // TODO: test if resolvedReference is a list of objects
  const result = Object.fromEntries(
    resolvedReference.flatMap((entry: Record<string, any>) => {
      return Object.entries(entry);
    })
  );

  return result;
}
// ################################################################################################
function transformer_object_listReducerToIndexObject_apply(
  step: Step,
  label: string | undefined,
  transformer: TransformerForRuntime_mapper_listToObject | TransformerForBuild_object_listReducerToIndexObject,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  log.info(
    "transformer_object_listReducerToIndexObject_apply called for transformer",
    transformer,
    "queryParams",
    JSON.stringify(queryParams, null, 2),
    "contextResults",
    JSON.stringify(contextResults, null, 2)
  );
  const resolvedReference = resolveApplyTo_legacy(transformer, step, resolveBuildTransformersTo, queryParams, contextResults, label);

  // TODO: test if resolvedReference is a list
  const result = Object.fromEntries(
    resolvedReference.map((entry: Record<string, any>) => {
      return [
        entry[transformer.indexAttribute],
        entry
      ];
    })
  );

  return result;
}

/**
 * valid for both actions and queries??
 * For dynamic attributes the actual type of the attribute is not known, until runtime.
 * Build-time consistency check of the action is not possible.
 * Any stuctural inconsitency in the action will be detected only at runtime and result in an error.
 * 
 */
// ################################################################################################
function transformer_object_fullTemplate(
  step: Step,
  objectName: string | undefined,
  transformer: TransformerForBuild_object_fullTemplate
    | TransformerForRuntime_object_fullTemplate,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<DomainElementString | DomainElementInstanceArray> {
  log.info(
    "transformer_object_fullTemplate called with objectName=",
    objectName,
    // "transformerForBuild=",
    // // transformerForBuild,
    // JSON.stringify(transformerForBuild, null, 2)
    // // "innerEntry",
    // // JSON.stringify(innerEntry, null, 2)
  );
  const resolvedApplyTo = resolveApplyTo(step, objectName, transformer, resolveBuildTransformersTo, queryParams, contextResults);

  if (resolvedApplyTo instanceof Domain2ElementFailed) {
    log.error(
      "transformer_object_fullTemplate can not apply to failed resolvedApplyTo",
      resolvedApplyTo
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["transformer_object_fullTemplate"],
      queryContext: "transformer_object_fullTemplate can not apply to failed resolvedApplyTo",
      innerError: resolvedApplyTo
    });
  }
  log.info(
    "transformer_object_fullTemplate found resolvedApplyTo",
    JSON.stringify(resolvedApplyTo, null, 2)
  );
  const newContextResults = {
    ...contextResults,
    [transformer.referenceToOuterObject]: resolvedApplyTo,
  }
  const attributeEntries = transformer.definition.map(
    (innerEntry: {
      attributeKey: TransformerForBuild | TransformerForRuntime;
      attributeValue: TransformerForBuild | TransformerForRuntime;
    }): [
      { rawLeftValue: Domain2QueryReturnType<DomainElementSuccess>; finalLeftValue: Domain2QueryReturnType<DomainElementSuccess> },
      { renderedRightValue: Domain2QueryReturnType<DomainElementSuccess>; finalRightValue: Domain2QueryReturnType<DomainElementSuccess> }
    ] => {
      const rawLeftValue: Domain2QueryReturnType<DomainElementSuccess> = innerEntry.attributeKey.transformerType
        ? defaultTransformers.transformer_extended_apply(
            step,
            objectName, // is this correct? or should it be undefined?
            innerEntry.attributeKey,
            resolveBuildTransformersTo,
            queryParams,
            newContextResults
          )
        : innerEntry.attributeKey;
      const leftValue: { rawLeftValue: Domain2QueryReturnType<any>; finalLeftValue: Domain2QueryReturnType<any> } = {
      // const leftValue: { rawLeftValue: Domain2QueryReturnType<DomainElementSuccess>; finalLeftValue: Domain2QueryReturnType<DomainElementSuccess> } = {
        rawLeftValue,
        finalLeftValue:
          !(rawLeftValue instanceof Action2Error) &&
          typeof innerEntry.attributeKey == "object" &&
          (innerEntry.attributeKey as any).applyFunction
            ? (innerEntry.attributeKey as any).applyFunction(rawLeftValue)
            : rawLeftValue,
      };
      // log.info(
      //   "transformer_object_fullTemplate innerEntry.attributeKey",
      //   innerEntry.attributeKey,
      //   "leftValue",
      //   leftValue
      // );

      const renderedRightValue: Domain2QueryReturnType<DomainElementSuccess> = defaultTransformers.transformer_extended_apply(
        // TODO: use actionRuntimeTransformer_apply or merge the two functions
        step,
        leftValue.finalLeftValue as any as string,
        innerEntry.attributeValue as any, // TODO: wrong type in the case of runtime transformer
        resolveBuildTransformersTo,
        queryParams,
        newContextResults
      ); // TODO: check for failure!
      const rightValue: { renderedRightValue: Domain2QueryReturnType<DomainElementSuccess>; finalRightValue: Domain2QueryReturnType<DomainElementSuccess> } = {
        renderedRightValue,
        finalRightValue:
          renderedRightValue.elementType != "failure" && (innerEntry.attributeValue as any).applyFunction
            ? (innerEntry.attributeValue as any).applyFunction(renderedRightValue)
            : renderedRightValue,
      };
      log.info(
        "transformer_object_fullTemplate",
        step,
        "innerEntry",
        JSON.stringify(innerEntry, null, 2),
        // "innerEntry.attributeKey",
        // JSON.stringify(innerEntry.attributeKey, null, 2),
        "leftValue",
        JSON.stringify(leftValue, null, 2),
        "renderedRightValue",
        JSON.stringify(renderedRightValue, null, 2),
        "rightValue",
        JSON.stringify(rightValue, null, 2),
        "contextResults",
        JSON.stringify(contextResults, null, 2)
      );
      return [leftValue, rightValue];
    }
  );

  const failureIndex = attributeEntries.findIndex(
    (e) => e[0].finalLeftValue.elementType == "failure" || e[1].finalRightValue.elementType == "failure"
  );
  if (failureIndex == -1) {
    const fullObjectResult = Object.fromEntries(
      attributeEntries.map((e) => [e[0].finalLeftValue, e[1].finalRightValue])
    );
    // log.info("transformer_object_fullTemplate for", transformerForBuild, "fullObjectResult", fullObjectResult);
    // return transformerForBuild.transformerType == "innerFullObjectTemplate" ? fullObjectResult : [fullObjectResult];
    return fullObjectResult;
  } else {
    return new Domain2ElementFailed({
      queryFailure: "ReferenceNotFound",
      failureOrigin: ["transformer_object_fullTemplate"],
      queryContext: "innerFullObjectTemplate error in " +
        objectName,
        innerError: attributeEntries[failureIndex] as any,
        // JSON.stringify(attributeEntries[failureIndex], null, 2),
    });
  }
}

// ################################################################################################
function transformer_objectAlter(
  step: Step,
  objectName: string | undefined,
  transformer: TransformerForBuild_inner_object_alter | TransformerForRuntime_object_alter,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  const resolvedApplyTo = resolveApplyTo(step, objectName, transformer, resolveBuildTransformersTo, queryParams, contextResults);
  if (resolvedApplyTo instanceof Domain2ElementFailed) {
    log.error(
      "transformer_objectAlter can not apply to failed resolvedApplyTo",
      resolvedApplyTo
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["transformer_objectAlter"],
      queryContext: "transformer_objectAlter can not apply to failed resolvedApplyTo",
      innerError: resolvedApplyTo
    });
  }
  // TODO: test if resolvedReference is an object
  const overrideObject = defaultTransformers.transformer_extended_apply(
    step,
    "NO NAME",
    transformer.definition,
    resolveBuildTransformersTo,
    queryParams,
    {
      ...contextResults,
      [transformer.referenceToOuterObject]: resolvedApplyTo,
    }
  );

  if (overrideObject instanceof Domain2ElementFailed) {
    log.error(
      "transformer_objectAlter can not apply to failed overrideObject",
      overrideObject
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["transformer_objectAlter"],
      queryContext: "transformer_objectAlter can not apply to failed overrideObject",
      innerError: overrideObject
    });
  }
  log.info(
    "transformer_objectAlter resolvedApplyTo",
    resolvedApplyTo,
    "overrideObject",
    overrideObject
  );
  // TODO: check for failures!
  return {
    ...resolvedApplyTo,
    ...overrideObject,
  };
}

/**
 * names for transformer functions are not satisfactory or consistent, this indicates that Transformer could 
 * be a class somehow.
 */
// ################################################################################################
export function transformer_resolveReference(
  step: Step,
  transformerInnerReference: Transformer_contextOrParameterReferenceTO_REMOVE,
  paramOrContext: "param" | "context",
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  // ReferenceNotFound
  const bank: Record<string, any> = paramOrContext == "param" ? queryParams ?? {} : contextResults ?? {};
  log.info(
    "transformer_resolveReference called for",
    JSON.stringify(transformerInnerReference, null, 2),
    "bank",
    JSON.stringify(bank, null, 2)
  );
  if (!bank) {
    log.error(
      "transformer_resolveReference failed, no contextResults for step",
      step,
      "transformerInnerReference=",
      transformerInnerReference
    );
    return new Domain2ElementFailed({
      queryFailure: "ReferenceNotFound",
      failureOrigin: ["transformer_resolveReference"],
      queryReference: transformerInnerReference.referenceName,
      failureMessage: "no contextResults",
      queryContext: "no contextResults",
    });
  }

  // ReferenceNotFound
  if (transformerInnerReference.referenceName) {
    // ReferenceNotFound
    // if (!Object.hasOwn(bank, transformerInnerReference.referenceName)) {
    if (!bank[transformerInnerReference.referenceName]) {
      log.error(
        "transformer_resolveReference failed, reference not found for step",
        step,
        "transformerInnerReference=",
        transformerInnerReference,
        "could not find",
        transformerInnerReference.referenceName,
        "in",
        bank
      );
      return new Domain2ElementFailed({
        queryFailure: "ReferenceNotFound",
        failureOrigin: ["transformer_resolveReference"],
        queryReference: transformerInnerReference.referenceName,
        failureMessage: "no referenceName " + transformerInnerReference.referenceName,
        queryContext: JSON.stringify(Object.keys(bank)),
      });
    }
    return bank[transformerInnerReference.referenceName];
  }

  // ReferenceFoundButUndefined
  if (transformerInnerReference.referencePath) {
    try {
      const pathResult = resolvePathOnObject(bank, transformerInnerReference.referencePath);
      return pathResult;
    } catch (error) {
      log.error(
        "transformer_resolveReference failed, reference not found for step",
        step,
        "transformerInnerReference=",
        transformerInnerReference,
        "could not find",
        transformerInnerReference.referencePath,
        "in",
        bank
      );
      return new Domain2ElementFailed({
        queryFailure: "ReferenceNotFound",
        failureOrigin: ["transformer_resolveReference"],
        queryReference: JSON.stringify(transformerInnerReference.referencePath),
        failureMessage: "no referencePath " + transformerInnerReference.referencePath + " found in queryContext",
        queryContext: JSON.stringify(Object.keys(bank)),
      });
    }
  }
}


// ################################################################################################
// almost duplicate from QuerySelectors.ts
// type defined in function of the types of queryParams and contextResults
// contextReference<A> -> A
// parameterReference<A> -> A
// constantUuid -> Uuid
// constantString -> string
export function transformer_InnerReference_resolve  (
  step: Step,
  transformerInnerReference: TransformerForBuild_InnerReference | TransformerForRuntime_InnerReference,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  // TODO: copy / paste (almost?) from query parameter lookup!
  log.info(
    "transformer_InnerReference_resolve called for transformerInnerReference=",
    transformerInnerReference,
    "queryParams=",
    Object.keys(queryParams),
    "contextResults=",
    Object.keys(contextResults ?? {})
  );
  const localQueryParams = queryParams??{};
  const localContextResults = contextResults??{};
  if (step == "build" && (transformerInnerReference as any).interpolation == "runtime") {
    log.warn(
      "transformer_InnerReference_resolve called for runtime interpolation in build step",
      transformerInnerReference
    );
    return transformerInnerReference
  }

  switch (transformerInnerReference.transformerType) {
    case "constant": {
      return transformerInnerReference.value
    }
    case "constantUuid": {
      return transformerInnerReference.value // new object
      break;
    }
    case "constantObject": {
      return transformerInnerReference.value
      break;
    }
    case "constantString": {
      return transformerInnerReference.value;
      break;
    }
    case "newUuid": {
      return uuidv4();
      break;
    }
    case "mustacheStringTemplate": {
      return defaultTransformers.transformer_mustacheStringTemplate_apply(
        step,
        transformerInnerReference,
        localQueryParams,
        localContextResults
      );
      break;
    }
    case "contextReference": {
      if (step == "build") { // no resolution in case of build step
        return transformerInnerReference;
        // return new Domain2ElementFailed({
        //   queryFailure: "ReferenceNotFound",
        //   failureOrigin: ["transformer_InnerReference_resolve"],
        //   queryReference: transformerInnerReference.referenceName,
        //   failureMessage: "contextReference not allowed in build step, all context references must be resolved at runtime",
        //   queryContext: "contextReference not allowed in build step, all context references must be resolved at runtime",
        // });
      } else {
        return transformer_resolveReference(step, transformerInnerReference, "context", localQueryParams, localContextResults);
      }
      break;
    }
    case "parameterReference": {
      // FOR NOW, RESOLVING EVERYTHING AT RUNTIME
      // !!!!!!!!!!!

      // if (step == "runtime") { // any parameter reference must be resolved before runtime step, that is during build step
      //   return new Domain2ElementFailed({
      //     queryFailure: "ReferenceNotFound",
      //     failureOrigin: ["transformer_InnerReference_resolve"],
      //     queryReference: transformerInnerReference.referenceName,
      //     failureMessage: "parameterReference not allowed in runtime step, all parameter references must be resolved before runtime",
      //     queryContext: "parameterReference not allowed in runtime step, all parameter references must be resolved before runtime",
      //   });
      // }
      return transformer_resolveReference(step, transformerInnerReference, "param", localQueryParams, localContextResults);
      break;
    }
    case "objectDynamicAccess": {
      return defaultTransformers.transformer_dynamicObjectAccess_apply(
        step,
        "none",
        transformerInnerReference,
        resolveBuildTransformersTo,
        localQueryParams,
        localContextResults
      );
      break;
    }
    default: {
      throw new Error("transformer_InnerReference_resolve failed, unknown transformerType for transformer=" + transformerInnerReference);
      break;
    }
  }

};

// ################################################################################################
// string -> string
// or
// string, <A> -> A
export function transformer_mustacheStringTemplate_apply(
  step: Step,
  transformer: TransformerForBuild_mustacheStringTemplate | TransformerForRuntime_mustacheStringTemplate_NOT_IMPLEMENTED,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  try {
    // const result = Mustache.render(transformer.definition, {...queryParams, ...contextResults});
    log.info(
      "transformer_mustacheStringTemplate_apply called for transformer",
      transformer,
      "queryParams",
      JSON.stringify(queryParams, null, 2),
      "contextResults",
      JSON.stringify(contextResults, null, 2)
    );
    const result = mustache.render(transformer.definition, (transformer as any)["interpolation"] == "runtime"?contextResults: queryParams);
    return result;
  } catch (error: any) {
    log.error(
      "transformer_mustacheStringTemplate_apply error for",
      transformer,
      "queryParams",
      JSON.stringify(queryParams, null, 2),
      "contextResults",
      JSON.stringify(contextResults, null, 2),
      "error:",
      error
    );
    return new Domain2ElementFailed({
      queryFailure: "FailedTransformer_mustache",
      failureOrigin: ["transformer_mustacheStringTemplate_apply"],
      // queryReference: transformer,
      query: transformer as any,
      queryContext: "error in transformer_mustacheStringTemplate_apply, could not render template.",
      innerError: error,
    });
  }
}

// ################################################################################################
export function transformer_dynamicObjectAccess_apply(
  step: Step,
  objectName: string | undefined,
  transformer: TransformerForRuntime_objectDynamicAccess | TransformerForBuild_objectDynamicAccess,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  const result = (transformer.objectAccessPath.reduce as any)( // triggers "error TS2349: This expression is not callable" in tsc. Not in eslint, though!
    ((acc: any, currentPathElement: any): any => {
      switch (typeof currentPathElement) {
        case "string": {
          if (!acc) {
            return new Domain2ElementFailed({
              queryFailure: "ReferenceNotFound",
              failureOrigin: ["transformer_dynamicObjectAccess_apply"],
              query: currentPathElement,
              queryContext: "error in transformer_dynamicObjectAccess_apply, could not find key: " + JSON.stringify(currentPathElement, null, 2),
            });
          }
          const innerResult = acc[currentPathElement]
          log.info(
            "innerTransformer_apply transformer_dynamicObjectAccess_apply (string) for",
            transformer,
            "path element",
            currentPathElement,
            "used as key",
            "to be applied on acc",
            acc,
            "result",
            innerResult
          );
          return innerResult;
          break;
        }
        case "object": {
          if (Array.isArray(currentPathElement)) {
            throw new Error("transformer_dynamicObjectAccess_apply can not handle arrays");
          }
          if (!currentPathElement.transformerType) {
            throw new Error("transformer_dynamicObjectAccess_apply can not handle objects without transformerType");
          }
          const key = defaultTransformers.transformer_extended_apply(
            step,
            "NO NAME",
            currentPathElement,
            resolveBuildTransformersTo,
            queryParams,
            contextResults
          );
          if (key instanceof Domain2ElementFailed) {
            return new Domain2ElementFailed({
              queryFailure: "ReferenceNotFound",
              failureOrigin: ["transformer_dynamicObjectAccess_apply"],
              query: currentPathElement,
              queryContext:
                "error in transformer_dynamicObjectAccess_apply, could not find key: " + JSON.stringify(key, null, 2),
            });
          }
          const innerResult = acc?acc[key]:key;
          log.info(
            "innerTransformer_apply transformer_dynamicObjectAccess_apply (object) for",
            transformer,
            "path element",
            currentPathElement,
            "resolved key",
            key,
            "to be applied on acc",
            acc,
            "result",
            innerResult
          );
          return innerResult;
        }
        case "number":
        case "bigint":
        case "boolean":
        case "symbol":
        case "undefined":
        case "function": {
          throw new Error("transformer_dynamicObjectAccess_apply can not handle " + typeof currentPathElement);
        }
      }
    }) as (acc: any, current: any) => any,
    undefined
  );
  return result;

}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// <A>[] -> <A>[]
// object -> object
// innerFullObjectTemplate { a: A, b: B } -> object 
export function innerTransformer_apply(
  step: Step,
  label: string | undefined,
  transformer:
    | TransformerForBuild
    | TransformerForRuntime
    | TransformerForBuild_innerFullObjectTemplate
    | TransformerForRuntime_innerFullObjectTemplate,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>
// ): Domain2QueryReturnType<DomainElementSuccess> {
): Domain2QueryReturnType<any> {
  // log.info(
  //   "innerTransformer_apply called for object named",
  //   objectName,
  //   "step:",
  //   step,
  //   "transformer.interpolation:",
  //   (transformer as any)?.interpolation??"build",
  //   // "step==transformer.interpolation",
  //   // step==((transformer as any)?.interpolation??"build"),
  //   "transformer",
  //   JSON.stringify(transformer, null, 2),
  //   "queryParams elements",
  //   JSON.stringify(Object.keys(queryParams??{}), null, 2),
  //   "contextResults elements",
  //   JSON.stringify(Object.keys(contextResults??{}), null, 2)
  // );
  switch (transformer.transformerType) {
    case "count": {
      const resolvedReference = resolveApplyTo_legacy(
        transformer,
        step,
        resolveBuildTransformersTo,
        queryParams,
        contextResults,
        label
      );
      log.info("innerTransformer_apply extractorTransformer count resolvedReference=", resolvedReference);
      if (resolvedReference instanceof Domain2ElementFailed) {
        log.error(
          "innerTransformer_apply extractorTransformer count can not apply to failed resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["innerTransformer_apply"],
          queryContext: "count can not apply to failed resolvedReference",
          innerError: resolvedReference
        });
      }

      if ( typeof resolvedReference != "object" || !Array.isArray(resolvedReference)) {
      // if ( typeof resolvedReference != "object" || !Array.isArray(resolvedReference)) {
        log.error(
          "innerTransformer_apply extractorTransformer count can not apply to resolvedReference of wrong type",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["innerTransformer_apply"],
          queryContext: "count can not apply to resolvedReference of wrong type: " + typeof resolvedReference,
          queryParameters: resolvedReference,
        });
      }

      log.info("innerTransformer_apply extractorTransformer count resolvedReference", resolvedReference.length);
      // const sortByAttribute = transformer.orderBy
      //   ? (a: any[]) =>
      //       a.sort((a, b) =>
      //         a[transformer.orderBy ?? ""].localeCompare(b[transformer.orderBy ?? ""], "en", {
      //           sensitivity: "base",
      //         })
      //       )
      //   : (a: any[]) => a;

      if (transformer.groupBy) {
        const result = new Map<string, number>();
        for (const entry of resolvedReference) {
          const key = (entry as any)[transformer.groupBy];
          if (result.has(key)) {
            result.set(key, (result.get(key) ?? 0) + 1);
          } else {
            result.set(key, 1);
          }
        }
        return [Object.fromEntries(result.entries())];
      } else {
        log.info("innerTransformer_apply extractorTransformer count without groupBy resolvedReference", resolvedReference.length);
        return [{ count: resolvedReference.length }]
      }
      break;
    }
    case "innerFullObjectTemplate": {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        failureOrigin: ["innerTransformer_apply"],
        queryContext: "innerFullObjectTemplate can not be applied directly",
        queryParameters: JSON.stringify(transformer, null, 2),
      });
      // return defaultTransformers.transformer_object_fullTemplate(
      //   step,
      //   label,
      //   transformer,
      //   queryParams,
      //   contextResults
      // );
      break;
    }
    case "object_fullTemplate": {
      return defaultTransformers.transformer_object_fullTemplate(
        step,
        label,
        transformer,
        resolveBuildTransformersTo,
        queryParams,
        contextResults
      );
      break;
    }
    case "objectAlter": {
      return defaultTransformers.transformer_objectAlter(
        step,
        label,
        transformer,
        resolveBuildTransformersTo,
        queryParams,
        contextResults
      );
      break;
    }
    case "objectEntries": {
      const resolvedReference = resolveApplyTo_legacy(
        transformer,
        step,
        resolveBuildTransformersTo,
        queryParams,
        contextResults,
        label
      );
      log.info(
        "innerTransformer_apply objectEntries referencedExtractor=",
        resolvedReference
      );

      if (resolvedReference instanceof Domain2ElementFailed) {
        log.error(
          "innerTransformer_apply extractorTransformer objectEntries can not apply to resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["innerTransformer_apply"],
          queryContext: "objectEntries can not apply to resolvedReference",
          innerError: resolvedReference
        });
      }

      if (!(typeof resolvedReference == "object") || Array.isArray(resolvedReference)) {
        const failure: Domain2ElementFailed = new Domain2ElementFailed({
          queryFailure: "FailedTransformer_objectEntries",
          failureMessage:
            "objectEntries transformer called on something that is not an object: " +
            typeof resolvedReference,
          // queryParameters: JSON.stringify(resolvedReference, null, 2),
          queryParameters: resolvedReference,
        });
        log.error(
          "innerTransformer_apply extractorTransformer objectEntries referencedExtractor resolvedReference",
          resolvedReference
        );
        return failure;
      }
      log.info(
        "innerTransformer_apply extractorTransformer objectEntries resolvedReference",
        resolvedReference
      );
      return Object.entries(resolvedReference);
    }
    case "objectValues": {
      const resolvedReference = resolveApplyTo_legacy(transformer, step, resolveBuildTransformersTo, queryParams, contextResults, label);
      if (resolvedReference instanceof Domain2ElementFailed) {
        log.error(
          "innerTransformer_apply extractorTransformer objectValues can not apply to resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["innerTransformer_apply"],
          queryContext: "objectValues failed ro resolve resolvedReference",
          innerError: resolvedReference
        });
      }

      if (typeof resolvedReference != "object" || Array.isArray(resolvedReference)) {
        log.error(
          "innerTransformer_apply extractorTransformer count referencedExtractor resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["innerTransformer_apply"],
          queryContext: "objectValues resolvedReference is not an object: " + typeof resolvedReference,
        });
      }
      log.info(
        "innerTransformer_apply extractorTransformer objectValues resolvedReference",
        resolvedReference
      );
      return Object.values(resolvedReference);
    }
    case "mapperListToList": {
      return defaultTransformers.transformerForBuild_list_listMapperToList_apply(step, label, transformer, resolveBuildTransformersTo, queryParams, contextResults);
      break;
    }
    case "listReducerToIndexObject": {
      return defaultTransformers.transformer_object_listReducerToIndexObject_apply(step, label, transformer, resolveBuildTransformersTo, queryParams, contextResults);
      break;
    }
    case "listReducerToSpreadObject": {
      return defaultTransformers.transformer_object_listReducerToSpreadObject_apply(step, label, transformer, resolveBuildTransformersTo, queryParams, contextResults);
      break;
    }
    case "listPickElement": {
      const resolvedReference = resolveApplyTo_legacy(transformer, step, resolveBuildTransformersTo, queryParams, contextResults, label);
      if (resolvedReference instanceof Domain2ElementFailed) {
        log.error(
          "innerTransformer_apply extractorTransformer listPickElement can not apply to resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["innerTransformer_apply"],
          queryContext: "listPickElement can not apply to resolvedReference",
          innerError: resolvedReference
        });
      }

      if (typeof resolvedReference != "object" || !Array.isArray(resolvedReference)) {
        log.error(
          "innerTransformer_apply extractorTransformer listPickElement can not apply to resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["innerTransformer_apply"],
          queryContext: "listPickElement can not apply to resolvedReference, wrong type: " + typeof resolvedReference,
          queryParameters: resolvedReference,
        });
      }

      const orderByAttribute = transformer.orderBy??"";
      const sortByAttribute = transformer.orderBy
      ? (a: any[]) =>
          a.sort((a, b) =>
            a[orderByAttribute].localeCompare(b[orderByAttribute], "en", {
              sensitivity: "base",
            })
          )
      : (a: any[]) => a;

      // try {
        const sortedResultArray = sortByAttribute(resolvedReference);
        if (transformer.index < 0 || sortedResultArray.length < transformer.index) {
          return undefined;
          // return new Domain2ElementFailed({
          //   queryFailure: "FailedTransformer_listPickElement",
          //   failureOrigin: ["innerTransformer_apply"],
          //   queryContext: "listPickElement index out of bounds",
          // });
        } else {
          const result = sortedResultArray[transformer.index];
          log.info(
            "innerTransformer_apply extractorTransformer listPickElement sorted resolvedReference",
            sortedResultArray,
            "index",
            transformer.index,
            "result",
            result
          );
          return result;
        }
      // } catch (error) {
      //   log.error(
      //     "innerTransformer_apply extractorTransformer listPickElement failed",
      //     error
      //   )
      //   return new Domain2ElementFailed({
      //     queryFailure: "FailedTransformer_listPickElement",
      //     failureOrigin: ["innerTransformer_apply"],
      //     queryContext: "listPickElement failed: " + error,
      //   });
      // }
      break;
    }
    case "objectDynamicAccess": {
      return defaultTransformers.transformer_dynamicObjectAccess_apply(
        step,
        label,
        transformer,
        resolveBuildTransformersTo,
        queryParams,
        contextResults
      );
    }
    case "mustacheStringTemplate": {
      return defaultTransformers.transformer_mustacheStringTemplate_apply(step, transformer, queryParams, contextResults);
      break;
    }
    case "unique": {
      const resolvedReference = resolveApplyTo_legacy(transformer, step, resolveBuildTransformersTo, queryParams, contextResults, label);
      log.info(
        "innerTransformer_apply extractorTransformer unique", label, "resolvedReference",
        resolvedReference
      );

      if (resolvedReference instanceof Domain2ElementFailed) {
        log.error(
          "innerTransformer_apply extractorTransformer unique can not apply to resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["innerTransformer_apply"],
          queryContext: "unique can not apply to resolvedReference",
          innerError: resolvedReference
        });
      }

      if (typeof resolvedReference != "object" || !Array.isArray(resolvedReference)) {
        log.error(
          "innerTransformer_apply extractorTransformer unique referencedExtractor can not apply to resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["innerTransformer_apply"],
          queryContext: "unique can not apply to resolvedReference, wrong type: " + typeof resolvedReference,
          queryParameters: resolvedReference,
        });
      }

      const sortByAttribute = transformer.orderBy
        ? (a: any[]) =>
            a.sort((a, b) =>
              a[transformer.orderBy ?? ""].localeCompare(b[transformer.orderBy ?? ""], "en", {
                sensitivity: "base",
              })
            )
        : (a: any[]) => a;
      const result = new Set<string>();
      for (const entry of Object.entries(resolvedReference)) {
        result.add((entry[1] as any)[transformer.attribute]);
      }
      const resultDomainElement: Domain2QueryReturnType<any> = sortByAttribute(
        [...result].map((e) => ({ [transformer.attribute]: e }))
      );
      log.info(
        "innerTransformer_apply extractorTransformer unique", label, "result",
        resultDomainElement
      );
      return resultDomainElement;
      break;
    }
    case "freeObjectTemplate": {
      // log.info("innerTransformer_apply freeObjectTemplate", JSON.stringify(transformer, null, 2));
      const result = Object.fromEntries(
        Object.entries(transformer.definition).map((objectTemplateEntry: [string, any]) => {
          return [
            objectTemplateEntry[0],
            defaultTransformers.transformer_extended_apply(
              step,
              objectTemplateEntry[0],
              objectTemplateEntry[1],
              resolveBuildTransformersTo,
              queryParams,
              contextResults
            ),
          ];
        })
      );
      const hasFailures = Object.values(result).find((e) => e instanceof Domain2ElementFailed);
      if (hasFailures) {
        log.error(
          "innerTransformer_apply freeObjectTemplate hasFailures",
          hasFailures
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["innerTransformer_apply"],
          queryContext: "freeObjectTemplate hasFailures",
          innerError: hasFailures
        });
      }
      log.info(
        "innerTransformer_apply freeObjectTemplate for",
        label,
        "step",
        step,
        "result",
        JSON.stringify(transformer, null, 2)
      );
      return result;
      break;
    }
    case "constantArray": {
      if (Array.isArray(transformer.value)) {
        return transformer.value;
      } else {
        return transformer.value;
        // return JSON.stringify(transformer.value)
        // return new Domain2ElementFailed({
        //   queryFailure: "FailedTransformer_constantArray",
        //   failureOrigin: ["innerTransformer_apply"],
        //   queryContext: "constantArrayValue is not an array",
        // });
      }
    }
    case "constantBigint": {
      if (typeof transformer.value == "number") {
      // if (typeof transformer.value == "bigint") {
        return transformer.value;
      } else {
        return new Domain2ElementFailed({
          queryFailure: "FailedTransformer_constantBigint",
          failureOrigin: ["innerTransformer_apply"],
          queryContext: "value is not a number (but it should actually be a bigint)",
        });
      }
    }
    case "constantBoolean": {
      if (typeof transformer.value == "boolean") {
        return transformer.value;
      } else {
        return new Domain2ElementFailed({
          queryFailure: "FailedTransformer_constantBoolean",
          failureOrigin: ["innerTransformer_apply"],
          queryContext: "value is not a boolean",
        });
      }
    }
    case "constantObject": {
      if (typeof transformer.value == "object") {
        return transformer.value;
      } else {
        return new Domain2ElementFailed({
          queryFailure: "FailedTransformer_constantObject",
          failureOrigin: ["innerTransformer_apply"],
          queryContext: "value is not an object",
        });
      }
    }
    case "constantNumber": {
      if (typeof transformer.value == "number") {
        return transformer.value;
      } else {
        return new Domain2ElementFailed({
          queryFailure: "FailedTransformer_constantNumber",
          failureOrigin: ["innerTransformer_apply"],
          queryContext: "value is not a number",
        });
      }
    }
    case "constantString": {
      if (typeof transformer.value == "string") {
        return transformer.value;
      } else {
        return JSON.stringify((transformer as any).value);
        // return new Domain2ElementFailed({
        //   queryFailure: "FailedTransformer_constantString",
        //   failureOrigin: ["innerTransformer_apply"],
        //   queryContext: "value is not a string",
        // });
      }
    }
    case "constantUuid": {
      return transformer.value;
    }
    case "constantAsExtractor":
    case "constant": {
      switch (typeof transformer.value) {
        case "string":
        case "number":
        case "bigint":
        case "boolean": {
          return transformer.value;
        }
        case "object": {
          return transformer.value;
          // if (Array.isArray(transformer.value)) {
          //   return transformer.value
          // } else {
          //   // TODO: questionable, should "runtime" transformers only return arrays of objects, not objects directly? 
          //   // This is likely done to get an identical result to the postgres implementation, where all runtime transformer executions return arrays (of objects or other types).
          //   return [transformer.value]; 
          // }
        }
        case "symbol":
        case "undefined":
        case "function": {
          return new Domain2ElementFailed(
            {
              queryFailure: "FailedTransformer_constant",
              failureOrigin: ["innerTransformer_apply"],
              queryContext: "constantValue is not a string, number, bigint, boolean, or object",
            }
          )
          break;
        }
        default: {
          return new Domain2ElementFailed(
            {
              queryFailure: "FailedTransformer_constant",
              failureOrigin: ["innerTransformer_apply"],
              queryContext: "constantValue could not be handled",
            }
          );
          break;
        }
      }
      // return transformer.value;
    }
    case "dataflowObject": {
      const resultObject: Record<string,any> = {};
      for (const [key, value] of Object.entries(transformer.definition)) {
        // const currentContext = label ? { ...contextResults, [label]: resultObject } : { ...contextResults, ...resultObject }
        const currentContext = { ...contextResults, ...resultObject }
        log.info(
          "innerTransformer_apply for dataflowObject labeled",
          label,
          "key",
          key,
          "step",
          step,
          "calling with context",
          JSON.stringify(Object.keys(currentContext??{}), null, 2)
        );
        resultObject[key] = defaultTransformers.transformer_extended_apply(
          step,
          key,
          value,
          resolveBuildTransformersTo,
          queryParams,
          currentContext
        );
      }
      // return resultObject
      return resultObject[transformer.target];
      break;
    }
    case "dataflowSequence": {
      throw new Error("innerTransformer_apply dataflowSequence not implemented");
    }
    case "parameterReference": // TODO: not possible for TransformerForRuntime
    // {
    //   // parameterReferences resolve to constant query definitions, that will be further resolved at runtime
    //   const rawValue = defaultTransformers.transformer_InnerReference_resolve(
    //     step,
    //     transformer,
    //     queryParams,
    //     contextResults
    //   );
    //   const returnedValue: Domain2QueryReturnType<TransformerForRuntime> = {
    //     transformerType: "constant",
    //     value: typeof transformer == "object" && (transformer as any).applyFunction
    //     ? (transformer as any).applyFunction(rawValue)
    //     : rawValue,
    //   };
    //   return returnedValue;
    //   break;
    // }
    case "newUuid":
    case "contextReference":
    default: {
      const rawValue = defaultTransformers.transformer_InnerReference_resolve(
        step,
        transformer,
        resolveBuildTransformersTo,
        queryParams,
        contextResults
      );
      const returnedValue: Domain2QueryReturnType<any> =
        typeof transformer == "object" && (transformer as any).applyFunction
          ? (transformer as any).applyFunction(rawValue)
          : rawValue;
      return returnedValue;
      break;
    }
  }
}

// ################################################################################################
// <A>[] -> <A>[]
// object -> object
// innerFullObjectTemplate { a: A, b: B } -> object 
export function innerTransformer_plainObject_apply(
  step: Step,
  label: string | undefined,
  transformer: Record<string, any>,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  // log.info(
  //   "innerTransformer_plainObject_apply called for object named",
  //   objectName,
  //   "step:",
  //   step,
  //   "transformer.interpolation:",
  //   (transformer as any)?.interpolation??"build",
  //   // "step==transformer.interpolation",
  //   // step==((transformer as any)?.interpolation??"build"),
  //   "transformer",
  //   JSON.stringify(transformer, null, 2),
  //   "queryParams elements",
  //   JSON.stringify(Object.keys(queryParams??{}), null, 2),
  //   "contextResults elements",
  //   JSON.stringify(Object.keys(contextResults??{}), null, 2)
  // );
  const attributeEntries: [string, Domain2QueryReturnType<DomainElementSuccess>][] = Object.entries(transformer).map(
    (objectTemplateEntry: [string, any]) => {
      // log.info("transformer_apply converting attribute",JSON.stringify(objectTemplateEntry, null, 2));
      return [
        objectTemplateEntry[0],
        defaultTransformers.transformer_extended_apply(
          step,
          objectTemplateEntry[0],
          objectTemplateEntry[1],
          resolveBuildTransformersTo,
          queryParams,
          contextResults
        ),
      ];
    }
  );
  const failureIndex = attributeEntries.findIndex((e) => e[1].elementType == "failure");
  if (failureIndex == -1) {
    const result = Object.fromEntries(
      attributeEntries.map((e) => [e[0], e[1]])
    )
    return result;
  } else {
    log.error(
      "innerTransformer_plainObject_apply failed converting plain object",
      transformer,
      "with params",
      queryParams,
      "error in",
      label,
      "in",
      JSON.stringify(attributeEntries[failureIndex], null, 2)
    );
    return new Domain2ElementFailed({
      queryFailure: "ReferenceNotFound",
      failureOrigin: ["innerTransformer_plainObject_apply"],
      innerError: attributeEntries[failureIndex][1] as any, // TODO: type!
      queryContext: "error in attribute: " + attributeEntries[failureIndex][0]
    });
  }
}

// ################################################################################################
// <A>[] -> <A>[]
// object -> object
// innerFullObjectTemplate { a: A, b: B } -> object 
export function innerTransformer_array_apply(
  step: Step,
  objectName: string | undefined,
  transformer: any[],
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  // log.info(
  //   "innerTransformer_array_apply called for object named",
  //   objectName,
  //   "step:",
  //   step,
  //   "transformer.interpolation:",
  //   (transformer as any)?.interpolation??"build",
  //   // "step==transformer.interpolation",
  //   // step==((transformer as any)?.interpolation??"build"),
  //   "transformer",
  //   JSON.stringify(transformer, null, 2),
  //   "queryParams elements",
  //   JSON.stringify(Object.keys(queryParams??{}), null, 2),
  //   "contextResults elements",
  //   JSON.stringify(Object.keys(contextResults??{}), null, 2)
  // );
  const subObject = transformer.map((e, index) =>
    transformer_extended_apply(step, index.toString(), e, resolveBuildTransformersTo, queryParams, contextResults)
  );
  const failureIndex = subObject.findIndex((e) => e.elementType == "failure");
  if (failureIndex == -1) {
    return subObject;
  } else {
    log.error(
      "innerTransformer_array_apply failed converting array",
      transformer,
      "with params",
      queryParams,
      "error in",
      JSON.stringify(subObject[failureIndex], null, 2)
    );
    return new Domain2ElementFailed({
      queryFailure: "ReferenceNotFound",
      failureOrigin: ["innerTransformer_array_apply"],
      innerError: subObject[failureIndex],
      queryContext:
        "failed to transform object attribute for array index " +
        failureIndex +
        // " failure " +
        // JSON.stringify(subObject[failureIndex]) +
        " in transformer " +
        transformer[failureIndex]
        // JSON.stringify(transformer[failureIndex]),
    });
  }
}

// // ################################################################################################
// // <A>[] -> <A>[]
// // object -> object
// // innerFullObjectTemplate { a: A, b: B } -> object 
// export function transformer_apply(
//   step: Step,
//   label: string | undefined,
//   transformer: TransformerForBuild | TransformerForRuntime,
//   queryParams: Record<string, any>,
//   contextResults?: Record<string, any>,
// ): Domain2QueryReturnType<any> {
// // ): Domain2QueryReturnType<DomainElementSuccess> {
//   // log.info(
//   //   "transformer_apply called for object named",
//   //   objectName,
//   //   "step:",
//   //   step,
//   //   "transformer.interpolation:",
//   //   (transformer as any)?.interpolation??"build",
//   //   "transformer",
//   //   JSON.stringify(transformer, null, 2),
//   //   "queryParams elements",
//   //   JSON.stringify(Object.keys(queryParams??{}), null, 2),
//   //   "contextResults elements",
//   //   JSON.stringify(Object.keys(contextResults??{}), null, 2)
//   // );
//   if (typeof transformer == "object") {
//     let result: Domain2QueryReturnType<any> = undefined as any;
//     if (transformer instanceof Array) {
//       log.info("transformer_apply ", "step", step, "called for array:", JSON.stringify(transformer, null, 2));
//       result = innerTransformer_array_apply(step, label, transformer, queryParams, contextResults);
//     } else {
//       // TODO: improve test, refuse interpretation of build transformer in runtime step
//       if (transformer.transformerType != undefined) {
//         if (step == "build") {
//           result = innerTransformer_plainObject_apply(step, label, transformer, queryParams, contextResults);
//         } else {
//           // FOR NOW, RESOLVING EVERYTHING AT RUNTIME
//           // if (
//           //   !(transformer as any).interpolation &&
//           //   ![
//           //   "constant",
//           //   "constantArray",
//           //   "constantBigint",
//           //   "constantBoolean",
//           //   "constantNumber",
//           //   "constantObject",
//           //   "constantString",
//           //   "constantUuid",
//           // ].includes(transformer.transformerType)) {
//           //   throw new Error(
//           //     "transformer_apply called for build transformer in runtime step: " +
//           //     JSON.stringify(transformer, null, 2)
//           //   );
//           // }
//           result = innerTransformer_apply(step, label, transformer, queryParams, contextResults);
//         }
//       } else {
//         result = innerTransformer_plainObject_apply(step, label, transformer, queryParams, contextResults);
//       }
//     }
//     return result
//   } else {
//     // plain value
//     return transformer;
//   }
// }

// ################################################################################################
export const applicationTransformerDefinitions: Record<string, TransformerDefinition> = {
  spreadSheetToJzodSchema: transformer_spreadSheetToJzodSchema,
}

// <A>[] -> <A>[]
// object -> object
// innerFullObjectTemplate { a: A, b: B } -> object 
export function transformer_extended_apply(
  step: Step,
  label: string | undefined,
  transformer: TransformerForBuild | TransformerForRuntime | ExtendedTransformerForRuntime,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
// ): Domain2QueryReturnType<DomainElementSuccess> {
  // log.info(
  //   "transformer_extended_apply called for",
  //   label,
  //   "step:",
  //   step,
  //   "transformer.interpolation:",
  //   (transformer as any)?.interpolation??"build",
  //   ((transformer as any)?.interpolation??"build") == step,
  //   typeof transformer,
  //   "transformer",
  //   JSON.stringify(transformer, null, 2),
  //   // "queryParams elements",
  //   // Object.keys(queryParams??{}),
  //   // // JSON.stringify(Object.keys(queryParams??{}), null, 2),
  //   // "contextResults elements",
  //   // Object.keys(contextResults??{})
  //   // // JSON.stringify(Object.keys(contextResults??{}), null, 2)
  // );
  let result: Domain2QueryReturnType<any> = undefined as any;

  const newResolveBuildTransformersTo =
    (transformer as any)["interpolation"] == "build" &&
    resolveBuildTransformersTo == "constantTransformer"
      ? "value"
      : resolveBuildTransformersTo;

  if (typeof transformer == "object") {
    if (transformer instanceof Array) {
      result = innerTransformer_array_apply(step, label, transformer, resolveBuildTransformersTo, queryParams, contextResults);
    } else {
      // TODO: improve test, refuse interpretation of build transformer in runtime step
      if (transformer["transformerType"] != undefined) {
      //  if (step == "runtime" || (transformer as any)["interpolation"] == "build") {
       if (step == "runtime" || (transformer as any)["interpolation"] == "build") {
          // log.info("HERE");
          let preResult
          switch (transformer.transformerType) {
            case "transformer_menu_addItem": {
              preResult = defaultTransformers.transformer_menu_AddItem(
                defaultTransformers,
                step,
                label,
                transformer,
                queryParams,
                contextResults
              );
              break;
            }
            // non-extended transformers...
            case "constantUuid":
            case "constant":
            case "constantAsExtractor":
            case "constantArray":
            case "constantBigint":
            case "constantBoolean":
            case "constantObject":
            case "constantNumber":
            case "constantString":
            case "newUuid":
            case "mustacheStringTemplate":
            case "mustacheStringTemplate_NOT_IMPLEMENTED":
            case "contextReference":
            case "parameterReference":
            case "objectDynamicAccess":
            case "dataflowObject":
            case "dataflowSequence":
            case "freeObjectTemplate":
            case "objectAlter":
            case "object_fullTemplate":
            case "listReducerToSpreadObject":
            case "objectEntries":
            case "objectValues":
            case "listPickElement":
            case "listReducerToIndexObject":
            case "mapperListToList":
            case "count":
            case "unique": {
              preResult = innerTransformer_apply(step, label, transformer, newResolveBuildTransformersTo, queryParams, contextResults);
              break;
            }
            default: {
              const foundApplicationTransformer = applicationTransformerDefinitions[(transformer as any).transformerType];
              if (!foundApplicationTransformer) {
                log.error(
                  "transformer_extended_apply failed for",
                  label,
                  "using to resolve build transformers for step:",
                  step,
                  "transformer",
                  JSON.stringify(transformer, null, 2)
                );
                preResult = new Domain2ElementFailed({
                  queryFailure: "QueryNotExecutable",
                  failureOrigin: ["transformer_extended_apply"],
                  queryContext: "transformer " + (transformer as any).transformerType + " not found",
                  queryParameters: transformer,
                });
              }
              if (foundApplicationTransformer.transformerImplementation.transformerImplementationType == "transformer") {
                preResult = innerTransformer_apply(
                  step,
                  label,
                  foundApplicationTransformer.transformerImplementation.definition,
                  newResolveBuildTransformersTo,
                  { ...queryParams, ...(transformer as any) },
                  contextResults
                );
              }
            }
          }
          if (preResult instanceof Domain2ElementFailed) {
            log.error(
              "transformer_extended_apply failed for",
              label,
              "using to resolve build transformers for step:",
              step,
              "transformer",
              JSON.stringify(transformer, null, 2),
              "result",
              JSON.stringify(preResult, null, 2)
            );
            return preResult;
          } else {
            if ((transformer as any)["interpolation"] == "build" && resolveBuildTransformersTo == "constantTransformer") {
              // result = innerTransformer_plainObject_apply(step, label, preResult, queryParams, contextResults);
              const value = preResult;
              result = {
                transformerType: "constant",
                value: preResult
              };
            } else {
              result = preResult;
            }
          }
        } else {
          // log.info("THERE");
          log.warn(
            "transformer_extended_apply called for",
            label,
            "treated as plain object for step:",
            step,
            "transformer",
            JSON.stringify(transformer, null, 2)
          );

          result = innerTransformer_plainObject_apply(
            step,
            label,
            transformer,
            newResolveBuildTransformersTo,
            queryParams,
            contextResults
          );
        }
      } else {
        // log.info("THERE2");
        result = innerTransformer_plainObject_apply(
          step,
          label,
          transformer,
          newResolveBuildTransformersTo,
          queryParams,
          contextResults
        );
      }
    }
    return result;
  } else {
    // plain value
    return transformer;
  }

  // log.info(
  //   "transformer_extended_apply called for",
  //   label,
  //   "step:",
  //   step,
  //   "transformer.interpolation:",
  //   (transformer as any)?.interpolation??"build",
  //   ((transformer as any)?.interpolation??"build") == step,
  //   typeof transformer,
  //   "transformer",
  //   JSON.stringify(transformer, null, 2),
  //   "result",
  //   JSON.stringify(result, null, 2),
  //   // "queryParams elements",
  //   // Object.keys(queryParams??{}),
  //   // // JSON.stringify(Object.keys(queryParams??{}), null, 2),
  //   // "contextResults elements",
  //   // Object.keys(contextResults??{})
  //   // // JSON.stringify(Object.keys(contextResults??{}), null, 2)
  // );
  // return result
}

// ################################################################################################
export function transformer_apply_wrapper(
  step: Step,
  label: string | undefined,
  transformer: TransformerForBuild | TransformerForRuntime,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<any> {
  // const result = transformer_extended_apply(step, label, transformer, queryParams, contextResults);
  const result = transformer_extended_apply(step, label, transformer, "constantTransformer", queryParams, contextResults);
  if (result instanceof Domain2ElementFailed) {
    log.error(
      "transformer_extended_apply failed for",
      label,
      "step",
      step,
      "transformer",
      JSON.stringify(transformer, null, 2),
      "result",
      JSON.stringify(result, null, 2)
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["transformer_extended_apply"],
      innerError: result,
      queryContext: "failed to transform object attribute",
    });
  } else {
    return result;
  }
}

// ################################################################################################
export function transformer_extended_apply_wrapper(
  step: Step,
  label: string | undefined,
  transformer: TransformerForBuild | TransformerForRuntime | ExtendedTransformerForRuntime,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  const result = transformer_extended_apply(step, label, transformer, "constantTransformer", queryParams, contextResults);
  if (result instanceof Domain2ElementFailed) {
    log.error(
      "transformer_extended_apply_wrapper failed for",
      label??transformer.transformerType,
      "step",
      step,
      "transformer",
      JSON.stringify(transformer, null, 2),
      "result",
      JSON.stringify(result, null, 2)
    );
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["transformer_extended_apply"],
      innerError: result,
      queryContext: "failed to transform object attribute",
    });
  } else {
    return result;
  }
}
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export function applyTransformer(t: Transformer, o: any):any {
  switch (t.transformerType) {
    case "recordOfTransformers": { // build object from record of transformers
      const result =  Object.fromEntries(Object.entries(t.definition).map(e=>[e[0],applyTransformer(e[1],o)]))
      // log.info("applyTransformer",t, "parameter", o, "return", result)
      return result
    }
    case "objectTransformer": { // access object attribute
      const result = o[t.attributeName]
      return result;
      break;
    }
    default:
      throw new Error(`Transformer ${JSON.stringify(t)} can not be applied`);
      break;
  }
}

