import Mustache from "mustache";
import {
  DomainElement,
  DomainElementObject,
  Transformer,
  Transformer_InnerReference,
  TransformerForBuild,
  TransformerForBuild_fullObjectTemplate,
  TransformerForBuild_listMapper,
  TransformerForBuild_mustacheStringTemplate,
  transformerForRuntime,
  TransformerForRuntime,
  TransformerForRuntime_fullObjectTemplate,
  TransformerForRuntime_InnerReference,
  TransformerForRuntime_mapObject,
  TransformerForRuntime_mustacheStringTemplate,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName, getValue } from "../tools.js";
import { cleanLevel } from "./constants.js";
import { domainElementToPlainObject } from "./QuerySelectors.js";
import { v4 as uuidv4 } from 'uuid';

const loggerName: string = getLoggerName(packageName, cleanLevel,"Transformer");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

export type ActionTemplate = any;
export type Step = "build" | "runtime";

// ################################################################################################
function transformer_listMapper_apply(
  step: Step,
  transformer: TransformerForRuntime_mapObject | TransformerForBuild_listMapper,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  // queryParams: DomainElementObject,
  // contextResults?: DomainElementObject
): DomainElement {
  const resolvedReference = transformer_InnerReference_resolve(
    step,
    { templateType: "contextReference", referenceName:transformer.referencedExtractor },
    queryParams,
    contextResults
  );

  // log.info(
  //   "transformer_listMapper_apply extractorTransformer resolvedReference",
  //   resolvedReference
  // );

  // can't check for elementType, because we're not using DomainElement anymore
  // if (resolvedReference.elementType != "instanceArray") {
  //   log.error("transformer_listMapper_apply extractorTransformer resolvedReference", resolvedReference);
  //   return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } }; // TODO: improve error message / queryFailure
  // }
  // if (
  //   // !["object", "instanceUuidIndex"].includes(resolvedReference.elementType) ||
  //   !(resolvedReference.elementValue instanceof Array)
  // ) {
  //   log.error("transformer_listMapper_apply extractorTransformer can not work on resolvedReference", resolvedReference);
  //   return {
  //     elementType: "failure",
  //     elementValue: {
  //       queryFailure: "QueryNotExecutable",
  //       queryContext:
  //         "resolved reference is not instanceUuidIndex or object " + JSON.stringify(resolvedReference, null, 2),
  //     },
  //   }; // TODO: improve error message / queryFailure
  // }
  // const resultObject:{[k:string]: any} = {};
  // const resultArray:{[k:string]: DomainElement}[] = [];
  const resultArray:DomainElement[] = [];
  if (resolvedReference.elementValue instanceof Array) {
    for (const element of resolvedReference.elementValue) {
      resultArray.push(
        transformer_apply(
          step,
          (element as any).name ?? "No name for element",
          transformer.elementTransformer as any,
          queryParams,
          {
            ...contextResults,
            [transformer.elementTransformer.referencedExtractor]: element,
          } // inefficient!
        ).elementValue
      ); // TODO: constrain type of transformer
    }
  } else {
    if (typeof resolvedReference.elementValue == "object") {
      for (const element of Object.entries(resolvedReference.elementValue)) {
        // resultObject[element[0]] = transformer_apply(step, element[0], transformer.elementTransformer as any, queryParams, {
        resultArray.push(
          transformer_apply(step, element[0], transformer.elementTransformer as any, queryParams, {
            // elementType: "object",
            // elementValue: {
              ...contextResults,
              // [transformer.elementTransformer.referencedExtractor]: { elementType: "instance", elementValue: element[1] },
              [transformer.elementTransformer.referencedExtractor]: element[1],
            // }, // inefficient!
          }).elementValue
        ); // TODO: constrain type of transformer
      }
    } else {
      log.error("transformer_listMapper_apply extractorTransformer can not work on resolvedReference", resolvedReference);
      return {
        elementType: "failure",
        elementValue: {
          queryFailure: "QueryNotExecutable",
          failureOrigin: ["transformer_listMapper_apply"],
          failureMessage:
            "resolved reference is not instanceUuidIndex or object " + JSON.stringify(resolvedReference, null, 2),
        },
      }
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
  // log.info(
  //   "transformer_listMapper_apply sorted resultArray with orderBy",
  //   transformer.orderBy,
  //   "sortedResultArray",
  //   sortedResultArray
  // );
  return { elementType: "array", elementValue: sortedResultArray };
  // return { elementType: "object", elementValue: resultObject };
  // return { elementType: "array", elementValue: resultArray };
}

/**
 * valid for both actions and queries??
 * For dynamic attributes the actual type of the attribute is not known, until runtime.
 * Build-time consistency check of the action is not possible.
 * Any stuctural inconsitency in the action will be detected only at runtime and result in an error.
 * 
 */
// ################################################################################################
// fullObjectTemplate { a: A, b: B } -> object { ...[buildTimeAttributes.map -> leftValue.elementvalue: resolved rightValue type], ...any for runtime attributes }
function transformer_fullObjectTemplate(
  step: Step,
  objectName: string,
  transformerForBuild: TransformerForBuild_fullObjectTemplate | TransformerForRuntime_fullObjectTemplate,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  // queryParams: DomainElementObject,
  // contextResults?: DomainElementObject,
): DomainElement {
  // log.info(
  //   "transformer_apply fullObjectTemplate objectName=",
  //   objectName,
  //   "transformerForBuild=",
  //   // transformerForBuild,
  //   JSON.stringify(transformerForBuild, null, 2)
  //   // "innerEntry",
  //   // JSON.stringify(innerEntry, null, 2)
  // );
  const attributeEntries = transformerForBuild.definition.map(
    (innerEntry: {
      attributeKey: Transformer_InnerReference | TransformerForRuntime_InnerReference;
      attributeValue: TransformerForBuild | TransformerForRuntime;
    }): [
      { rawLeftValue: DomainElement; finalLeftValue: DomainElement },
      { renderedRightValue: DomainElement; finalRightValue: DomainElement }
    ] => {

      const rawLeftValue: DomainElement = innerEntry.attributeKey.templateType
        ? transformer_InnerReference_resolve(step, innerEntry.attributeKey, queryParams, contextResults)
        : { elementType: "string", elementValue: innerEntry.attributeKey };
      const leftValue: { rawLeftValue: DomainElement; finalLeftValue: DomainElement } = {
        rawLeftValue,
        finalLeftValue:
          rawLeftValue.elementType != "failure" &&
          typeof innerEntry.attributeKey == "object" &&
          (innerEntry.attributeKey as any).applyFunction
            ? {
                elementType: "string",
                elementValue: (innerEntry.attributeKey as any).applyFunction(rawLeftValue.elementValue),
              }
            : rawLeftValue,
      };
      // log.info(
      //   "transformer_apply fullObjectTemplate innerEntry.attributeKey",
      //   innerEntry.attributeKey,
      //   "leftValue",
      //   leftValue
      // );

      // const renderedRightValue: DomainElement = transformer_apply( // TODO: use actionRuntimeTransformer_apply or merge the two functions
      const renderedRightValue: DomainElement = transformer_apply(
        // TODO: use actionRuntimeTransformer_apply or merge the two functions
        step,
        leftValue.finalLeftValue.elementValue as string,
        innerEntry.attributeValue as any, // TODO: wrong type in the case of runtime transformer
        queryParams,
        contextResults
      ); // TODO: check for failure!
      const rightValue: { renderedRightValue: DomainElement; finalRightValue: DomainElement } = {
        renderedRightValue,
        finalRightValue:
          renderedRightValue.elementType != "failure" && (innerEntry.attributeValue as any).applyFunction
            ? {
                elementType: "any",
                elementValue: (innerEntry.attributeValue as any).applyFunction(renderedRightValue.elementValue),
              }
            : renderedRightValue,
      };
      log.info(
        "transformer_apply fullObjectTemplate innerEntry.attributeKey",
        innerEntry.attributeValue,
        "rightValue",
        JSON.stringify(rightValue, null, 2),
        "contextResults",
        // Object.keys(contextResults??{}),
        JSON.stringify(contextResults, null, 2)
      );
      return [leftValue, rightValue];
    }
  );

  const failureIndex = attributeEntries.findIndex(
    (e) => e[0].finalLeftValue.elementType == "failure" || e[1].finalRightValue.elementType == "failure"
  );
  if (failureIndex == -1) { // no failure found
    // log.info(
    //   "transformer_apply fullObjectTemplate for",
    //   transformerForBuild,
    //   "attributeEntries",
    //   JSON.stringify(attributeEntries, null, 2)
    // );
    const fullObjectResult = Object.fromEntries(
      attributeEntries.map((e) => [e[0].finalLeftValue.elementValue, e[1].finalRightValue.elementValue])
    );
    // log.info("transformer_apply fullObjectTemplate for", transformerForBuild, "fullObjectResult", fullObjectResult);
    return {
      elementType: "object",
      elementValue: fullObjectResult,
    };
  } else {
    return {
      elementType: "failure",
      elementValue: {
        queryFailure: "ReferenceNotFound",
        failureOrigin: ["transformer_fullObjectTemplate"],
        queryContext: "fullObjectTemplate error in " + objectName + " in " + JSON.stringify(attributeEntries[failureIndex], null, 2),
      },
    };
  }
}

/**
 * names for transformer functions are not satisfactory or consistent, this indicates that Transformer could 
 * be a class somehow.
 */
// ################################################################################################
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
  // queryParams: DomainElementObject,
  // contextResults?: DomainElementObject,
): DomainElement {
  // TODO: copy / paste (almost?) from query parameter lookup!
  // log.info("transformer_InnerReference_resolve for queryTemplateConstantOrAnyReference=", queryTemplateConstantOrAnyReference, "queryParams=", queryParams,"contextResults=", contextResults)
  // log.info(
  //   "transformer_InnerReference_resolve called for transformerInnerReference=",
  //   transformerInnerReference,
  //   "queryParams=",
  //   Object.keys(queryParams.elementValue),
  //   "contextResults=",
  //   Object.keys(contextResults?.elementValue ?? {})
  // );
  if (step == "build" && (transformerInnerReference as any).interpolation == "runtime") {
    log.warn("transformer_InnerReference_resolve called for runtime interpolation in build step", transformerInnerReference);
    return {
      elementType: "any",
      elementValue: transformerInnerReference
    }
  }
  if (
    (transformerInnerReference.templateType == "contextReference" &&
      (!contextResults ||
        (!transformerInnerReference.referenceName && !transformerInnerReference.referencePath) ||
        (transformerInnerReference.referenceName && transformerInnerReference.referencePath) ||
        (transformerInnerReference.referenceName &&
          !contextResults[transformerInnerReference.referenceName]
        ) ||
        (transformerInnerReference.referencePath &&
          (transformerInnerReference.referencePath.length == 0 ||
            !contextResults[transformerInnerReference.referencePath[0]]
          )
        )
      )
    ) ||
    (
      transformerInnerReference.templateType == "parameterReference" &&
      // (typeof queryParams != "object" ||
      //   !queryParams.elementValue ||
      (
        (!transformerInnerReference.referenceName && !transformerInnerReference.referencePath) ||
        (transformerInnerReference.referenceName && transformerInnerReference.referencePath) ||
        (transformerInnerReference.referenceName && !Object.keys(queryParams).includes(transformerInnerReference.referenceName)) ||
        (transformerInnerReference.referencePath &&
          (transformerInnerReference.referencePath.length == 0 ||
            !queryParams[transformerInnerReference.referencePath[0]]
          )
        )
      )
    )
      // )
  ) {
    // checking that given reference does exist
    log.warn(
      "transformer_InnerReference_resolve for reference=",
      JSON.stringify(transformerInnerReference, null, 2),
      "could not find",
      transformerInnerReference.templateType,
      "with referenceName",
      transformerInnerReference.referenceName,
      "and referencePath",
      transformerInnerReference.referencePath,
      "in",
      transformerInnerReference.templateType == "contextReference"
        ? JSON.stringify(Object.keys(contextResults ?? {}))
        : Object.keys(queryParams)
    );
    return {
      elementType: "failure",
      elementValue: {
        queryFailure: "ReferenceNotFound",
        failureOrigin: ["transformer_InnerReference_resolve"],
        queryContext:
          "no referenceName" +
            transformerInnerReference.referenceName +
            " or referencePath " +
            transformerInnerReference.referencePath +
            " in " +
            transformerInnerReference.templateType ==
          "contextReference"
            ? JSON.stringify(contextResults)
            : JSON.stringify(Object.keys(queryParams)),
      },
    };
  }

  if (
    (transformerInnerReference.templateType == "contextReference" &&
      (!contextResults ||
        // (!queryTemplateConstantOrAnyReference.referenceName && !queryTemplateConstantOrAnyReference.referencePath) ||
        // (queryTemplateConstantOrAnyReference.referenceName && queryTemplateConstantOrAnyReference.referencePath) ||
        (transformerInnerReference.referenceName &&
          !contextResults[transformerInnerReference.referenceName]
        ) ||
        (transformerInnerReference.referencePath &&
          (transformerInnerReference.referencePath.length == 0 ||
            !contextResults[transformerInnerReference.referencePath[0]] // TODO: what about the DomainElementObject structure, attributes hould be DomainElements themselves
          )
        )
      )
    ) ||
    (
      transformerInnerReference.templateType == "parameterReference" &&
      // (typeof queryParams != "object" ||
      //   !queryParams.elementValue ||
      (
        // (!queryTemplateConstantOrAnyReference.referenceName && !queryTemplateConstantOrAnyReference.referencePath) ||
        // (queryTemplateConstantOrAnyReference.referenceName && queryTemplateConstantOrAnyReference.referencePath) ||
        (transformerInnerReference.referenceName && !Object.keys(queryParams).includes(transformerInnerReference.referenceName)) ||
        (transformerInnerReference.referencePath &&
          (transformerInnerReference.referencePath.length == 0 ||
            !queryParams[transformerInnerReference.referencePath[0]] // TODO: what about the DomainElementObject structure, attributes hould be DomainElements themselves
          )
        )
      )
    )
  ) {
    // checking that given reference does exist
    log.warn(
      "transformer_InnerReference_resolve found undefined reference",
      transformerInnerReference.templateType,
      "with referenceName",
      transformerInnerReference.referenceName,
      "and referencePath",
      transformerInnerReference.referencePath,
      "in",
      (
        transformerInnerReference.templateType == "contextReference"
          ? contextResults
          : queryParams
          // ? JSON.stringify(Object.keys(contextResults?.elementValue ?? {}))
          // : Object.keys(queryParams.elementValue)
      )
    );


    return {
      elementType: "failure",
      elementValue: { queryFailure: "ReferenceFoundButUndefined", queryContext: "context " + JSON.stringify(contextResults) },
    };
  }

  const reference: DomainElement =
    transformerInnerReference.templateType == "contextReference"
      ? // ? {elementType: "any", elementValue: contextResults[queryTemplateConstantOrAnyReference.referenceName ]}
        transformerInnerReference.referenceName
        ? ((contextResults??{})[transformerInnerReference.referenceName]) ? 
          {
            elementType: typeof (contextResults??{})[transformerInnerReference.referenceName],
            elementValue: (contextResults??{})[transformerInnerReference.referenceName],
          }
          :
          {
            elementType: "failure",
            elementValue: { queryFailure: "ReferenceFoundButUndefined", queryContext: JSON.stringify(contextResults) },
          }
        : transformerInnerReference.referencePath
        ? getValue(contextResults, transformerInnerReference.referencePath) ?? {
            elementType: "failure",
            elementValue: {
              queryFailure: "ReferenceFoundButUndefined",
              queryContext:
                "path " +
                JSON.stringify(transformerInnerReference.referencePath) +
                " not found in " +
                JSON.stringify(contextResults),
            },
          }
        : {
            elementType: "failure",
            elementValue: {
              queryFailure: "ReferenceFoundButUndefined",
              queryContext: "no referenceName or referencePath found in " + JSON.stringify(contextResults),
            },
          }
      : transformerInnerReference.templateType == "parameterReference"
      ? // ? { elementType: "any", elementValue: queryParams[queryTemplateConstantOrAnyReference.referenceName] }
        transformerInnerReference.referenceName
        ? queryParams[transformerInnerReference.referenceName] ? 
            {
              elementType: typeof queryParams[transformerInnerReference.referenceName],
              elementValue: queryParams[transformerInnerReference.referenceName],
            }
          :
            {
              elementType: "failure",
              elementValue: { queryFailure: "ReferenceFoundButUndefined", queryContext: JSON.stringify(queryParams) },
            }
        : transformerInnerReference.referencePath
        ? getValue(queryParams, transformerInnerReference.referencePath) ?? {
            elementType: "failure",
            elementValue: {
              queryFailure: "ReferenceFoundButUndefined",
              queryContext:
                "path " +
                JSON.stringify(transformerInnerReference.referencePath) +
                " not found in " +
                JSON.stringify(queryParams),
            },
          }
        : {
            elementType: "failure",
            elementValue: { queryFailure: "ReferenceFoundButUndefined", queryContext: JSON.stringify(queryParams) },
          }
      : transformerInnerReference.templateType == "constantUuid"
      ? { elementType: "instanceUuid", elementValue: transformerInnerReference.constantUuidValue } // new object
      : transformerInnerReference.templateType == "newUuid"
      ? { elementType: "instanceUuid", elementValue: uuidv4() } // new object
      : transformerInnerReference.templateType == "constantString"
      ? { elementType: "string", elementValue: transformerInnerReference.constantStringValue } // new object
      : {
          elementType: "failure",
          elementValue: { queryFailure: transformerInnerReference },
        }; /* this should not happen. Provide "error" value instead?*/

  // log.info(
  //   "transformer_InnerReference_resolve returning for transformerInnerReference=",
  //   transformerInnerReference,
  //   "resolved as",
  //   reference,
  //   "in",
  //   (
  //     transformerInnerReference.templateType ==
  //     "contextReference"
  //       ? JSON.stringify(contextResults)
  //       : JSON.stringify(Object.keys(queryParams))
  //   )
  // );

  return reference;
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
  // queryParams: DomainElementObject,
  // contextResults?: DomainElementObject,
): DomainElement {
  // const cleanedQueryParams = domainElementToPlainObject(queryParams); // TODO: highly inefficient!!
  // const result = Mustache.render(transformerForBuild.definition, cleanedQueryParams);
  // const cleanedReferences = contextResults
  //   ? domainElementToPlainObject(contextResults)
  //   : domainElementToPlainObject(queryParams); // TODO: highly inefficient & buggy!!
  const result = Mustache.render(transformer.definition, {...queryParams, ...contextResults});
  log.info(
    "mustacheStringTemplate_apply for",
    transformer,
    "queryParams",
    JSON.stringify(queryParams, null, 2),
    "contextResults",
    JSON.stringify(contextResults, null, 2),
    "result",
    result
  );
  return { elementType: "string", elementValue: result };
}

// ################################################################################################
// <A>[] -> <A>[]
// object -> object
// fullObjectTemplate { a: A, b: B } -> object 
export function transformer_apply(
  step: Step,
  objectName: string,
  transformer: TransformerForBuild | TransformerForRuntime,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  // queryParams: DomainElementObject,
  // contextResults?: DomainElementObject,
): DomainElement {
  // log.info(
  //   "transformer_apply called for object named",
  //   objectName,
  //   "step",
  //   step,
  //   "transformer.interpolation==",
  //   (transformer as any)?.interpolation??"build",
  //   "step==transformer.interpolation",
  //   step==((transformer as any)?.interpolation??"build"),
  //   "transformer",
  //   JSON.stringify(transformer, null, 2),
  //   "queryParams",
  //   JSON.stringify(Object.keys(queryParams), null, 2)
  // );
  if (typeof transformer == "object") {
    if (transformer instanceof Array) {
      // log.info(
      //   "transformer_apply converting array",
      //   JSON.stringify(transformer, null, 2),
      //   "with params",
      //   JSON.stringify(Object.keys(queryParams.elementValue), null, 2)
      // );

      const subObject = transformer.map((e, index) =>
        transformer_apply(step, index.toString(), e, queryParams, contextResults)
      );
      const failureIndex = subObject.findIndex((e) => e.elementType == "failure");
      if (failureIndex == -1) {
        return {
          elementType: "array",
          elementValue: subObject.map((e) => e.elementValue), // TODO: clean result instead? (deep!)
        }
      } else {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "ReferenceNotFound",
            failureOrigin: ["transformer_apply"],
            queryContext:
              "failed to transform object attribute for object " +
              objectName +
              " transformer" +
              transformer[failureIndex],
          },
        };
      }
    } else {
      // TODO: improve test, refuse interpretation of build transformer in runtime step
      if (transformer.templateType && (((transformer as any)?.interpolation??"build") == step)) {
        switch (transformer.templateType) {
          case "count": {
            const resolvedReference = transformer_InnerReference_resolve(
              step,
              { templateType: "contextReference", referenceName:transformer.referencedExtractor }, // TODO: there's a bug, count can not be used at build time, although it should be usable at build time
              queryParams,
              contextResults
            );
          
            if (!["instanceUuidIndex", "object"].includes(resolvedReference.elementType)) {
              log.error(
                "transformer_apply extractorTransformer count can not apply to resolvedReference",
                resolvedReference
              );
              return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } }; // TODO: improve error message / queryFailure
            }
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
              for (const entry of Object.entries(resolvedReference.elementValue)) {
                const key = (entry[1] as any)[transformer.groupBy];
                if (result.has(key)) {
                  result.set(key, (result.get(key)??0) + 1);
                } else {
                  result.set(key, 1);
                }
              }
              return {
                elementType: "any",
                elementValue: sortByAttribute(
                  [...result.entries()].map((e) => ({ [transformer.groupBy as any]: e[0], count: e[1] }))
                ),
              };
            } else {
              return { elementType: "any" /* TODO: number? */, elementValue: [{count: Object.keys(resolvedReference.elementValue).length}] };
            }
            break;
          }
          case "fullObjectTemplate": {
            return transformer_fullObjectTemplate(
              step,
              objectName,
              transformer,
              queryParams,
              contextResults
            );
            // const result = Object.fromEntries(
            // );
            // return {};
            break;
          }
          case "objectValues": {
            const resolvedReference = transformer_InnerReference_resolve(
              step,
              { templateType: "contextReference", referenceName:transformer.referencedExtractor }, // TODO: there's a bug, count can not be used at build time, although it should be usable at build time
              queryParams,
              contextResults
            );

            // log.info(
            //   "transformer_apply extractorTransformer count referencedExtractor resolvedReference",
            //   resolvedReference
            // );
          
            if (resolvedReference.elementType != "instanceUuidIndex") {
              log.error(
                "transformer_apply extractorTransformer count referencedExtractor resolvedReference",
                resolvedReference
              );
              return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } }; // TODO: improve error message / queryFailure
            }
            return { elementType: "instanceArray", elementValue: Object.values(resolvedReference.elementValue)}
          }
          case "listMapper": {
            return transformer_listMapper_apply(
              step,
              transformer,
              queryParams,
              contextResults,
            );
            break;
          }
          case "mustacheStringTemplate": {
            return mustacheStringTemplate_apply(step, transformer, queryParams, contextResults);
            break;
          }
          case "unique": {
            const resolvedReference = transformer_InnerReference_resolve(
              step,
              { templateType: "contextReference", referenceName:transformer.referencedExtractor },  // TODO: there's a bug, count can not be used at build time, although it should be usable at build time
              queryParams,
              contextResults
            );

            // log.info(
            //   "transformer_apply extractorTransformer unique referencedExtractor resolvedReference",
            //   resolvedReference
            // );
          
            if (!["instanceUuidIndex", "object"].includes(resolvedReference.elementType)) {
              log.error("transformer_apply extractorTransformer unique referencedExtractor can not apply to resolvedReference", resolvedReference);
              return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } }; // TODO: improve error message / queryFailure
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
            for (const entry of Object.entries(resolvedReference.elementValue)) {
              result.add((entry[1] as any)[transformer.attribute]);
            }
            return {
              elementType: "instanceArray",
              elementValue: sortByAttribute([...result].map((e) => ({ [transformer.attribute]: e }))),
            };
            break;  
          }
          case "freeObjectTemplate": {
            const result = Object.fromEntries(
              Object.entries(transformer.definition).map((objectTemplateEntry: [string, any]) => {
                return [
                  objectTemplateEntry[0],
                  transformer_apply(step, objectTemplateEntry[0], objectTemplateEntry[1], queryParams, contextResults).elementValue,
                ];
              })
            );
            return { elementType: "object", elementValue: result};
            break;
          }
          case "newUuid":
          case "constantString":
          case "constantUuid":
          case "contextReference":
          case "parameterReference":
          default: {
            const rawValue = transformer_InnerReference_resolve(step, transformer, queryParams, contextResults);
            const returnedValue: DomainElement =
              typeof transformer == "object" && (transformer as any).applyFunction
                ? { elementType: "any", elementValue: (transformer as any).applyFunction(rawValue.elementValue)}
                : rawValue;
            // log.info("transformer_apply default case for", transformerForBuild, "rawvalue", rawValue, "value", value);
            // return { elementType: "any", elementValue: value};
            return returnedValue;
            break;
          }
        }
      } else {
        //  this is a plain object!! The result of transformer_apply is an object
        // rendering the attributes of the object if needed
        // log.info(
        //   "transformer_apply converting plain object",
        //   JSON.stringify(transformer, null, 2),
        //   "with params",
        //   JSON.stringify(Object.keys(queryParams.elementValue), null, 2)
        // );
        const attributeEntries:[string, DomainElement][] = Object.entries(transformer).map((objectTemplateEntry: [string, any]) => {
          // log.info("transformer_apply converting attribute",JSON.stringify(objectTemplateEntry, null, 2));
          return [
            objectTemplateEntry[0],
            transformer_apply(step, objectTemplateEntry[0], objectTemplateEntry[1], queryParams, contextResults),
          ];
        });
        // log.info("transformer_apply converting plain object", transformer, "with params", JSON.stringify(queryParams, null, 2));
        // log.info("transformer_apply converting plain object", transformer, "converted attributes", JSON.stringify(attributeEntries, null, 2));
        const failureIndex = attributeEntries.findIndex((e) => e[1].elementType == "failure");
        if (failureIndex == -1) {
          const result = Object.fromEntries(
            attributeEntries.map((e) => [e[0], e[1].elementValue])
          )
          // log.info("transformer_apply converted plain object", transformer, "converted attributes", JSON.stringify(result, null, 2));

          return {
            elementType: "object",
            elementValue: result,
          };
        } else {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "ReferenceNotFound",
              failureOrigin: ["transformer_apply"],
              queryContext: "error in " + objectName + " in " + JSON.stringify(attributeEntries[failureIndex]),
            },
          };
        }
        // const result = Object.fromEntries(
        //   Object.entries(transformerForBuild).map((objectTemplateEntry: [string, any]) => {
        //     return [
        //       objectTemplateEntry[0],
        //       transformer_apply(objectTemplateEntry[0], objectTemplateEntry[1], queryParams, contextResults),
        //     ];
        //   })
        // );
        // return result;
      }
    }
  } else {
    // plain value
    return { elementType: "any", elementValue: transformer};
  }
}

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