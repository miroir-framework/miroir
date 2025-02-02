import Mustache from "mustache";
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
  Transformer_contextOrParameterReference,
  Transformer_InnerReference,
  Transformer_objectDynamicAccess,
  TransformerForBuild,
  TransformerForBuild_inner_object_alter,
  TransformerForBuild_innerFullObjectTemplate,
  TransformerForBuild_list_listMapperToList,
  TransformerForBuild_mustacheStringTemplate,
  TransformerForBuild_object_fullTemplate,
  TransformerForBuild_object_listReducerToIndexObject,
  TransformerForBuild_object_listReducerToSpreadObject,
  TransformerForRuntime,
  TransformerForRuntime_innerFullObjectTemplate,
  TransformerForRuntime_InnerReference,
  TransformerForRuntime_mapper_listToList,
  TransformerForRuntime_mapper_listToObject,
  TransformerForRuntime_mustacheStringTemplate,
  TransformerForRuntime_object_alter,
  TransformerForRuntime_object_fullTemplate,
  TransformerForRuntime_objectDynamicAccess
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { Domain2ElementFailed, Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { transformer_menu_AddItem } from "../1_core/Menu.js";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory.js";
import { packageName } from "../constants.js";
import { resolvePathOnObject } from "../tools.js";
import { cleanLevel } from "./constants.js";
import { b } from "vitest/dist/chunks/suite.B2jumIFP.js";
import { Action2Error } from "../../dist/index.js";
import { D } from "vitest/dist/chunks/reporters.D7Jzd9GS.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Transformer")
).then((logger: LoggerInterface) => {log = logger});


export type ActionTemplate = any;
export type Step = "build" | "runtime";

// ################################################################################################
export const defaultTransformers = {
  transformer_apply,
  transformer_extended_apply,
  mustacheStringTemplate_apply,
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
function transformerForBuild_list_listMapperToList_apply(
  step: Step,
  transformer: TransformerForRuntime_mapper_listToList | TransformerForBuild_list_listMapperToList,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any[]> {
  const resolvedReference =
    typeof transformer.referencedExtractor == "string"
      ? defaultTransformers.transformer_InnerReference_resolve(
          step,
          { transformerType: "contextReference", referenceName: transformer.referencedExtractor },
          queryParams,
          contextResults
        ) // object, this is a Transformer
      : defaultTransformers.transformer_extended_apply(
          step,
          "NO NAME",
          transformer.referencedExtractor,
          queryParams,
          contextResults
        );
  ;

  log.info(
    "transformerForBuild_list_listMapperToList_apply extractorTransformer resolvedReference",
    resolvedReference
  );

  const resultArray:any[] = [];
  if (resolvedReference instanceof Array) {
    for (const element of resolvedReference) {
      resultArray.push(
        defaultTransformers.transformer_apply(
          step,
          (element as any).name ?? "No name for element",
          transformer.elementTransformer as any,
          queryParams,
          {
            ...contextResults,
            [transformer.referenceToOuterObject]: element,
          } // inefficient!
        )
      ); // TODO: constrain type of transformer
    }
  } else {
    if (typeof resolvedReference == "object") {
      for (const element of Object.entries(resolvedReference)) {
        resultArray.push(
          defaultTransformers.transformer_apply(step, element[0], transformer.elementTransformer as any, queryParams, {
              ...contextResults,
              [transformer.referenceToOuterObject]: element[1],
          })
        ); // TODO: constrain type of transformer
      }
    } else {
      log.error("transformerForBuild_list_listMapperToList_apply extractorTransformer can not work on resolvedReference", resolvedReference);
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        failureOrigin: ["transformerForBuild_list_listMapperToList_apply"],
        failureMessage:
          "resolved reference is not instanceUuidIndex or object " + JSON.stringify(resolvedReference, null, 2),
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
  transformer: TransformerForBuild_object_listReducerToSpreadObject,
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
  const resolvedReference =
    typeof transformer.referencedExtractor == "string"
      ? defaultTransformers.transformer_InnerReference_resolve(
          step,
          { transformerType: "contextReference", referenceName: transformer.referencedExtractor },
          queryParams,
          contextResults
        )
      : defaultTransformers.transformer_apply(
          step,
          undefined,
          transformer.referencedExtractor,
          queryParams,
          contextResults
        );

  // TODO: test if resolvedReference is a list
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
  transformer: TransformerForRuntime_mapper_listToObject | TransformerForBuild_object_listReducerToIndexObject,
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
  const resolvedReference =
    typeof transformer.referencedExtractor == "string"
      ? defaultTransformers.transformer_InnerReference_resolve(
          step,
          { transformerType: "contextReference", referenceName: transformer.referencedExtractor },
          queryParams,
          contextResults
        )
      : defaultTransformers.transformer_apply(
          step,
          undefined,
          transformer.referencedExtractor,
          queryParams,
          contextResults
        );

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
  transformerForBuild:
    | TransformerForBuild_object_fullTemplate
    | TransformerForRuntime_object_fullTemplate
    | TransformerForBuild_innerFullObjectTemplate
    | TransformerForRuntime_innerFullObjectTemplate,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>
): Domain2QueryReturnType<DomainElementString | DomainElementInstanceArray> {
  // log.info(
  //   "transformer_apply transformer_object_fullTemplate objectName=",
  //   objectName,
  //   "transformerForBuild=",
  //   // transformerForBuild,
  //   JSON.stringify(transformerForBuild, null, 2)
  //   // "innerEntry",
  //   // JSON.stringify(innerEntry, null, 2)
  // );
  const attributeEntries = transformerForBuild.definition.map(
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
            queryParams,
            contextResults
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
      //   "transformer_apply transformer_object_fullTemplate innerEntry.attributeKey",
      //   innerEntry.attributeKey,
      //   "leftValue",
      //   leftValue
      // );

      const renderedRightValue: Domain2QueryReturnType<DomainElementSuccess> = defaultTransformers.transformer_apply(
        // TODO: use actionRuntimeTransformer_apply or merge the two functions
        step,
        leftValue.finalLeftValue as any as string,
        innerEntry.attributeValue as any, // TODO: wrong type in the case of runtime transformer
        queryParams,
        contextResults
      ); // TODO: check for failure!
      const rightValue: { renderedRightValue: Domain2QueryReturnType<DomainElementSuccess>; finalRightValue: Domain2QueryReturnType<DomainElementSuccess> } = {
        renderedRightValue,
        finalRightValue:
          renderedRightValue.elementType != "failure" && (innerEntry.attributeValue as any).applyFunction
            ? (innerEntry.attributeValue as any).applyFunction(renderedRightValue)
            : renderedRightValue,
      };
      log.info(
        "transformer_apply transformer_object_fullTemplate innerEntry.attributeKey",
        innerEntry.attributeValue,
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
    // log.info("transformer_apply innerFullObjectTemplate for", transformerForBuild, "fullObjectResult", fullObjectResult);
    // return transformerForBuild.transformerType == "innerFullObjectTemplate" ? fullObjectResult : [fullObjectResult];
    return fullObjectResult;
  } else {
    return new Domain2ElementFailed({
      queryFailure: "ReferenceNotFound",
      failureOrigin: ["transformer_object_fullTemplate"],
      queryContext:
        "innerFullObjectTemplate error in " +
        objectName +
        " in " +
        JSON.stringify(attributeEntries[failureIndex], null, 2),
    });
  }
}

// ################################################################################################
function transformer_objectAlter(
  step: Step,
  objectName: string | undefined,
  transformer: TransformerForBuild_inner_object_alter | TransformerForRuntime_object_alter,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  const resolvedReference = defaultTransformers.transformer_InnerReference_resolve(
    step,
    { transformerType: "contextReference", referenceName:transformer.referenceToOuterObject },
    queryParams,
    contextResults
  );
  // TODO: test if resolvedReference is an object
  const overrideObject = defaultTransformers.transformer_apply(
    step,
    "NO NAME",
    transformer.definition,
    queryParams,
    contextResults
  );

  log.info(
    "transformer_objectAlter resolvedReference",
    resolvedReference,
    "overrideObject",
    overrideObject
  );
  // TODO: check for failures!
  return {
    ...resolvedReference,
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
  transformerInnerReference: Transformer_contextOrParameterReference,
  paramOrContext: "param" | "context",
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  // ReferenceNotFound
  const bank: Record<string, any> = paramOrContext == "param" ? queryParams??{} : contextResults??{};
  if (!bank) {
    log.error(
      "transformer_InnerReference_resolve failed, no contextResults for step",
      step,
      "transformerInnerReference=",
      transformerInnerReference
    );
    return new Domain2ElementFailed({
      queryFailure: "ReferenceNotFound",
      failureOrigin: ["transformer_InnerReference_resolve"],
      queryReference: transformerInnerReference.referenceName,
      failureMessage: "no contextResults",
      queryContext: "no contextResults",
    });
  }
    
  // ReferenceNotFound
  if (transformerInnerReference.referenceName) {
    // ReferenceNotFound
    if (
      !Object.hasOwn(bank, transformerInnerReference.referenceName)
    ) {
      log.error(
        "transformer_InnerReference_resolve failed, reference not found for step",
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
        failureOrigin: ["transformer_InnerReference_resolve"],
        queryReference: transformerInnerReference.referenceName,
        failureMessage: "no referenceName " + transformerInnerReference.referenceName,
        queryContext: JSON.stringify(Object.keys(bank)),
      });
    }

    if (
      Object.hasOwn(bank, transformerInnerReference.referenceName) &&
      !bank[transformerInnerReference.referenceName]
    ) {
      return new Domain2ElementFailed({
        queryFailure: "ReferenceFoundButUndefined",
        failureOrigin: ["transformer_InnerReference_resolve"],
        queryReference: transformerInnerReference.referenceName,
        failureMessage:
        "found but undefined: referenceName " + transformerInnerReference.referenceName,
        queryContext: JSON.stringify(Object.keys(bank)),
      });
    }
    return bank[transformerInnerReference.referenceName];
  }
    
  // ReferenceFoundButUndefined
  if (transformerInnerReference.referencePath) {
    try {
      const pathResult = resolvePathOnObject(bank, transformerInnerReference.referencePath);
      if (!pathResult) {
        log.error(
          "transformer_InnerReference_resolve failed, reference not found for step",
          step,
          "transformerInnerReference=",
          transformerInnerReference,
          "could not find",
          transformerInnerReference.referencePath,
          "in",
          bank
        );
        return new Domain2ElementFailed({
          queryFailure: "ReferenceFoundButUndefined",
          failureOrigin: ["transformer_InnerReference_resolve"],
          queryReference: JSON.stringify(transformerInnerReference.referencePath),
          failureMessage: "no referencePath " + transformerInnerReference.referencePath,
          queryContext: JSON.stringify(Object.keys(bank)),
        });
      }
      return pathResult;
    } catch (error) {
      log.error(
        "transformer_InnerReference_resolve failed, reference not found for step",
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
        failureOrigin: ["transformer_InnerReference_resolve"],
        queryReference: JSON.stringify(transformerInnerReference.referencePath),
        failureMessage: "no referencePath " + transformerInnerReference.referencePath,
        queryContext: JSON.stringify(Object.keys(bank)),
      });
    }
  }
}


// almost duplicate from QuerySelectors.ts
// type defined in function of the types of queryParams and contextResults
// contextReference<A> -> A
// parameterReference<A> -> A
// constantUuid -> Uuid
// constantString -> string
export function transformer_InnerReference_resolve  (
  step: Step,
  transformerInnerReference: Transformer_InnerReference | TransformerForRuntime_InnerReference,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  // TODO: copy / paste (almost?) from query parameter lookup!
  // log.info(
  //   "transformer_InnerReference_resolve called for transformerInnerReference=",
  //   transformerInnerReference,
  //   "queryParams=",
  //   Object.keys(queryParams),
  //   "contextResults=",
  //   Object.keys(contextResults ?? {})
  // );
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
    case "constantUuid": {
      return transformerInnerReference.constantUuidValue // new object
      break;
    }
    case "constantObject": {
      return transformerInnerReference.constantObjectValue
      break;
    }
    case "constantString": {
      return transformerInnerReference.constantStringValue;
      break;
    }
    case "newUuid": {
      return uuidv4();
      break;
    }
    case "mustacheStringTemplate": {
      return defaultTransformers.mustacheStringTemplate_apply(
        step,
        transformerInnerReference,
        localQueryParams,
        localContextResults
      );
      break;
    }
    case "contextReference": {
      return transformer_resolveReference(step, transformerInnerReference, "context", localQueryParams, localContextResults);
      break;
    }
    case "parameterReference": {
      return transformer_resolveReference(step, transformerInnerReference, "param", localQueryParams, localContextResults);
      break;
    }
    case "objectDynamicAccess": {
      return defaultTransformers.transformer_dynamicObjectAccess_apply(
        step,
        "none",
        transformerInnerReference,
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
function mustacheStringTemplate_apply(
  step: Step,
  transformer: TransformerForBuild_mustacheStringTemplate | TransformerForRuntime_mustacheStringTemplate,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
  const result = Mustache.render(transformer.definition, {...queryParams, ...contextResults});
  // log.info(
  //   "mustacheStringTemplate_apply for",
  //   transformer,
  //   "queryParams",
  //   JSON.stringify(queryParams, null, 2),
  //   "contextResults",
  //   JSON.stringify(contextResults, null, 2),
  //   "result",
  //   result
  // );
  // return { elementType: "string", elementValue: result };
  return result;
}

// ################################################################################################
export function transformer_dynamicObjectAccess_apply(
  step: Step,
  objectName: string | undefined,
  transformer: TransformerForRuntime_objectDynamicAccess | Transformer_objectDynamicAccess,
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
              failureOrigin: ["transformer_apply"],
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
            queryParams,
            contextResults
          );
          if (key instanceof Domain2ElementFailed) {
            return new Domain2ElementFailed({
              queryFailure: "ReferenceNotFound",
              failureOrigin: ["transformer_apply"],
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
// TODO: recursive calls could be to transformer_apply or to transformer_extended_apply!!
export function innerTransformer_apply(
  step: Step,
  label: string | undefined,
  transformer:
    | TransformerForBuild
    | TransformerForRuntime
    | TransformerForBuild_innerFullObjectTemplate
    | TransformerForRuntime_innerFullObjectTemplate,
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

      const resolvedReference =
        typeof transformer.referencedExtractor == "string"
          ? defaultTransformers.transformer_InnerReference_resolve(
              step,
              { transformerType: "contextReference", referenceName: transformer.referencedExtractor }, // TODO: there's a bug, count can not be used at build time, although it should be usable at build time
              queryParams,
              contextResults
            )
          : innerTransformer_apply(step, label, transformer.referencedExtractor, queryParams, contextResults);
          ;

      if (transformer_resolveReference instanceof Domain2ElementFailed) {
        log.error(
          "innerTransformer_apply extractorTransformer count can not apply to resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["transformer_apply"],
          queryContext: "count can not apply to resolvedReference",
        });
      }

      if ( typeof resolvedReference != "object" || !Array.isArray(resolvedReference)) {
      // if ( typeof resolvedReference != "object" || !Array.isArray(resolvedReference)) {
        log.error(
          "innerTransformer_apply extractorTransformer count can not apply to resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["transformer_apply"],
          queryContext: "count can not apply to resolvedReference",
        });
      }

      log.info("innerTransformer_apply extractorTransformer count resolvedReference", resolvedReference.length);
      const sortByAttribute = transformer.orderBy
        ? (a: any[]) =>
            a.sort((a, b) =>
              a[transformer.orderBy ?? ""].localeCompare(b[transformer.orderBy ?? ""], "en", {
                sensitivity: "base",
              })
            )
        : (a: any[]) => a;

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
        return sortByAttribute(
          [...result.entries()].map((e) => ({ [transformer.groupBy as any]: e[0], count: e[1] }))
        );
      } else {
        log.info("innerTransformer_apply extractorTransformer count without groupBy resolvedReference", resolvedReference.length);
        return [{ count: resolvedReference.length }]
      }
      break;
    }
    case "innerFullObjectTemplate": {
      return defaultTransformers.transformer_object_fullTemplate(
        step,
        label,
        transformer,
        queryParams,
        contextResults
      );
    }
    case "object_fullTemplate": {
      return defaultTransformers.transformer_object_fullTemplate(
        step,
        label,
        transformer,
        queryParams,
        contextResults
      );
      break;
    }
    case "objectAlter": {
      return defaultTransformers.transformer_objectAlter(step, label, transformer, queryParams, contextResults);
      break;
    }
    case "objectEntries": {
      const resolvedReference =
        typeof transformer.referencedExtractor == "string"
          ? defaultTransformers.transformer_InnerReference_resolve(
              step,
              { transformerType: "contextReference", referenceName: transformer.referencedExtractor }, // TODO: there's a bug, count can not be used at build time, although it should be usable at build time
              queryParams,
              contextResults
            )
          : transformer_extended_apply(step, label, transformer.referencedExtractor, queryParams, contextResults);
      ;

      // log.info(
      //   "transformer_apply extractorTransformer count referencedExtractor resolvedReference",
      //   resolvedReference
      // );

      if (transformer_resolveReference instanceof Domain2ElementFailed) {
        log.error(
          "innerTransformer_apply extractorTransformer objectEntries can not apply to resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["transformer_apply"],
          queryContext: "objectEntries can not apply to resolvedReference",
        });
      }

      if (!(typeof resolvedReference == "object") || Array.isArray(resolvedReference)) {
        const failure: Domain2ElementFailed = new Domain2ElementFailed({
          queryFailure: "FailedTransformer_objectEntries",
          failureMessage: "objectEntries transformer called on something that is not an object.",
          queryParameters: JSON.stringify(resolvedReference, null, 2),
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
      const resolvedReference = defaultTransformers.transformer_InnerReference_resolve(
        step,
        { transformerType: "contextReference", referenceName: transformer.referencedExtractor }, // TODO: there's a bug, count can not be used at build time, although it should be usable at build time
        queryParams,
        contextResults
      );

      if (transformer_resolveReference instanceof Domain2ElementFailed) {
        log.error(
          "innerTransformer_apply extractorTransformer objectValues can not apply to resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["transformer_apply"],
          queryContext: "objectValues can not apply to resolvedReference",
        });
      }

      if (typeof resolvedReference != "object" || Array.isArray(resolvedReference)) {
        log.error(
          "innerTransformer_apply extractorTransformer count referencedExtractor resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["transformer_apply"],
          queryContext: "objectValues can not apply to resolvedReference",
        });
      }
      log.info(
        "innerTransformer_apply extractorTransformer objectValues resolvedReference",
        resolvedReference
      );
      return Object.values(resolvedReference);
    }
    case "mapperListToList": {
      return defaultTransformers.transformerForBuild_list_listMapperToList_apply(step, transformer, queryParams, contextResults);
      break;
    }
    case "listReducerToIndexObject": {
      return defaultTransformers.transformer_object_listReducerToIndexObject_apply(step, transformer, queryParams, contextResults);
      break;
    }
    case "listReducerToSpreadObject": {
      return defaultTransformers.transformer_object_listReducerToSpreadObject_apply(step, transformer, queryParams, contextResults);
      break;
    }
    case "listPickElement": {
      const resolvedReference = defaultTransformers.transformer_InnerReference_resolve(
        step,
        { transformerType: "contextReference", referenceName: transformer.referencedExtractor }, // TODO: there's a bug, this transformer can not be used at build time, although it should be usable at build time
        queryParams,
        contextResults
      );

      if (transformer_resolveReference instanceof Domain2ElementFailed) {
        log.error(
          "innerTransformer_apply extractorTransformer listPickElement can not apply to resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["transformer_apply"],
          queryContext: "listPickElement can not apply to resolvedReference",
        });
      }

      // if (!["instanceUuidIndex", "object"].includes(resolvedReference.elementType)) {
      if (typeof resolvedReference != "object" || !Array.isArray(resolvedReference)) {
        log.error(
          "innerTransformer_apply extractorTransformer listPickElement can not apply to resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["transformer_apply"],
          queryContext: "listPickElement can not apply to resolvedReference",
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

      const sortedResultArray = sortByAttribute(resolvedReference);
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
      break;
    }
    case "objectDynamicAccess": {
      return defaultTransformers.transformer_dynamicObjectAccess_apply(
        step,
        label,
        transformer,
        queryParams,
        contextResults
      );
    }
    case "mustacheStringTemplate": {
      return defaultTransformers.mustacheStringTemplate_apply(step, transformer, queryParams, contextResults);
      break;
    }
    case "unique": {
      const resolvedReference = defaultTransformers.transformer_InnerReference_resolve(
        step,
        { transformerType: "contextReference", referenceName: transformer.referencedExtractor }, // TODO: there's a bug, count can not be used at build time, although it should be usable at build time
        queryParams,
        contextResults
      );

      log.info(
        "transformer_apply extractorTransformer unique", label, "resolvedReference",
        resolvedReference
      );

      if (transformer_resolveReference instanceof Domain2ElementFailed) {
        log.error(
          "innerTransformer_apply extractorTransformer unique can not apply to resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["transformer_apply"],
          queryContext: "unique can not apply to resolvedReference",
        });
      }

      if (typeof resolvedReference != "object" || !Array.isArray(resolvedReference)) {
        log.error(
          "innerTransformer_apply extractorTransformer unique referencedExtractor can not apply to resolvedReference",
          resolvedReference
        );
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["transformer_apply"],
          queryContext: "unique can not apply to resolvedReference",
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
              queryParams,
              contextResults
            ),
          ];
        })
      );
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
    case "constantObject": {
      log.info("innerTransformer_apply constantObject", transformer.constantObjectValue);
      // log.error("innerTransformer_apply called with constantObject", transformer.constantObjectValue);
      return transformer.constantObjectValue;
      break;
    }
    case "constantString": {
      return transformer.constantStringValue;
    }
    case "constantUuid": {
      return transformer.constantUuidValue;
    }
    case "constant": {
      return transformer.constantValue;
    }
    case "dataflowObject": {
      const resultObject: Record<string,any> = {};
      for (const [key, value] of Object.entries(transformer.definition)) {
        const currentContext = label ? { ...contextResults, [label]: resultObject } : { ...contextResults, ...resultObject }
        log.info(
          "transformer_apply for dataflowObject labeled",
          label,
          "key",
          key,
          "calling with context",
          JSON.stringify(Object.keys(currentContext??{}), null, 2)
        );
        resultObject[key] = defaultTransformers.transformer_extended_apply(
          step,
          key,
          value,
          queryParams,
          currentContext
        );
      }
      return resultObject
      break;
    }
    case "newUuid":
    case "contextReference":
    case "parameterReference":
    default: {
      const rawValue = defaultTransformers.transformer_InnerReference_resolve(
        step,
        transformer,
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
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
// ): Domain2QueryReturnType<DomainElementSuccess> {
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
          queryParams,
          contextResults
        ),
      ];
    }
  );
  // log.info("transformer_apply converting plain object", transformer, "with params", JSON.stringify(queryParams, null, 2));
  // log.info(
  //   "innerTransformer_plainObject_apply converting plain object",
  //   transformer,
  //   "converted attributes",
  //   attributeEntries
  //   // JSON.stringify(attributeEntries, null, 2)
  // );
  const failureIndex = attributeEntries.findIndex((e) => e[1].elementType == "failure");
  if (failureIndex == -1) {
    const result = Object.fromEntries(
      attributeEntries.map((e) => [e[0], e[1]])
    )
    // log.info(
    //   "innerTransformer_plainObject_apply on",
    //   label,
    //   "step",
    //   step,
    //   "object",
    //   transformer,
    //   "result converted object",
    //   JSON.stringify(result, null, 2)
    // );
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
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
// ): Domain2QueryReturnType<DomainElementSuccess> {
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
    transformer_extended_apply(step, index.toString(), e, queryParams, contextResults)
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

// ################################################################################################
// <A>[] -> <A>[]
// object -> object
// innerFullObjectTemplate { a: A, b: B } -> object 
export function transformer_apply(
  step: Step,
  label: string | undefined,
  transformer: TransformerForBuild | TransformerForRuntime,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
): Domain2QueryReturnType<any> {
// ): Domain2QueryReturnType<DomainElementSuccess> {
  // log.info(
  //   "transformer_apply called for object named",
  //   objectName,
  //   "step:",
  //   step,
  //   "transformer.interpolation:",
  //   (transformer as any)?.interpolation??"build",
  //   "transformer",
  //   JSON.stringify(transformer, null, 2),
  //   "queryParams elements",
  //   JSON.stringify(Object.keys(queryParams??{}), null, 2),
  //   "contextResults elements",
  //   JSON.stringify(Object.keys(contextResults??{}), null, 2)
  // );
  if (typeof transformer == "object") {
    if (transformer instanceof Array) {
      log.info("transformer_apply called for array:", JSON.stringify(transformer, null, 2));
      return innerTransformer_array_apply(step, label, transformer, queryParams, contextResults);
    } else {
      // TODO: improve test, refuse interpretation of build transformer in runtime step
      if (transformer.transformerType != undefined) {
        if ((transformer as any)?.interpolation??"build" == step) {
          return innerTransformer_apply(step, label, transformer, queryParams, contextResults);
        } else {
          return innerTransformer_plainObject_apply(step, label, transformer, queryParams, contextResults);
        }
      } else {
        return innerTransformer_plainObject_apply(step, label, transformer, queryParams, contextResults);
      }
    }
  } else {
    // plain value
    return transformer;
  }
}

// ################################################################################################
// <A>[] -> <A>[]
// object -> object
// innerFullObjectTemplate { a: A, b: B } -> object 
export function transformer_extended_apply(
  step: Step,
  label: string | undefined,
  transformer: TransformerForBuild | TransformerForRuntime | ExtendedTransformerForRuntime,
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
  // let result: Domain2QueryReturnType<DomainElementSuccess> = undefined as any;
  let result: Domain2QueryReturnType<any> = undefined as any;

  if (typeof transformer == "object") {
    if (transformer instanceof Array) {
      result = innerTransformer_array_apply(step, label, transformer, queryParams, contextResults);
    } else {
      // TODO: improve test, refuse interpretation of build transformer in runtime step
      if (transformer["transformerType"] != undefined) {
        if ((((transformer as any)?.interpolation??"build") == step)) {
          // log.info("HERE");
          switch (transformer.transformerType) {
            case "transformer_menu_addItem": {
              result = defaultTransformers.transformer_menu_AddItem(
                defaultTransformers,
                step,
                label,
                transformer,
                queryParams,
                contextResults
              );
              break;
            }
            default: {
              result = innerTransformer_apply(step, label, transformer, queryParams, contextResults);
            }
          }
        } else {
          // log.info("THERE");
          result = innerTransformer_plainObject_apply(step, label, transformer, queryParams, contextResults);
        }
      } else {
        // log.info("THERE2");
        result = innerTransformer_plainObject_apply(step, label, transformer, queryParams, contextResults);
      }
    }
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
  return result;

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

