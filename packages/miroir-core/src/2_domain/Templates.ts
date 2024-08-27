// import { render } from "mustache";
import Mustache from "mustache";

import {
  ActionReturnType,
  DomainAction,
  DomainElement,
  DomainElementObject,
  JzodReference,
  ObjectBuildTemplate,
  ObjectTemplateInnerReference,
  RuntimeTransformer
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import { domainElementToPlainObject } from "./QuerySelectors.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "Templates");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export const domainElementTemplateSchema: JzodReference = {
  type: "schemaReference",
  context: {},
  definition: {
    relativePath: "",
  },
};

// ################################################################################################
// almost duplicate from QuerySelectors.ts
export function resolveActionTemplateContextReference  (
  queryTemplateConstantOrAnyReference: ObjectTemplateInnerReference,
  queryParams: DomainElementObject,
  contextResults?: DomainElementObject,
  // queryParams: any,
  // contextResults: any
): DomainElement {
  // TODO: copy / paste (almost?) from query parameter lookup!
  // log.info("resolveActionTemplateContextReference for queryTemplateConstantOrAnyReference=", queryTemplateConstantOrAnyReference, "queryParams=", queryParams,"contextResults=", contextResults)
  if (
    (queryTemplateConstantOrAnyReference.templateType == "contextReference" &&
      (!contextResults || !contextResults.elementValue[queryTemplateConstantOrAnyReference.referenceName])) ||
    (queryTemplateConstantOrAnyReference.templateType == "parameterReference" &&
      (typeof queryParams != "object" || !queryParams.elementValue ||
        !Object.keys(queryParams.elementValue).includes(queryTemplateConstantOrAnyReference.referenceName)))
  ) {
    // checking that given reference does exist
    log.warn(
      "could not find",
      queryTemplateConstantOrAnyReference.templateType,
      queryTemplateConstantOrAnyReference.referenceName,
      "in",
      queryTemplateConstantOrAnyReference.templateType == "contextReference"
        ? JSON.stringify(contextResults)
        : Object.keys(queryParams)
    );
    return {
      elementType: "failure",
      elementValue: {
        queryFailure: "ReferenceNotFound",
        queryContext:
          "no " +
            queryTemplateConstantOrAnyReference.referenceName +
            " in " +
            queryTemplateConstantOrAnyReference.templateType ==
          "contextReference"
            ? JSON.stringify(contextResults)
            : JSON.stringify(Object.keys(queryParams)),
      },
    };
  }

  if (
    (queryTemplateConstantOrAnyReference.templateType == "contextReference" &&
      (!contextResults?.elementValue ||
        !contextResults?.elementValue[queryTemplateConstantOrAnyReference.referenceName].elementValue)) ||
    (queryTemplateConstantOrAnyReference.templateType == "parameterReference" &&
      !queryParams.elementValue[queryTemplateConstantOrAnyReference.referenceName])
  ) {
    // checking that given reference does exist
    return {
      elementType: "failure",
      elementValue: { queryFailure: "ReferenceFoundButUndefined", queryContext: JSON.stringify(contextResults) },
    };
  }

  const reference: DomainElement =
    queryTemplateConstantOrAnyReference.templateType == "contextReference"
      ? // ? {elementType: "any", elementValue: contextResults[queryTemplateConstantOrAnyReference.referenceName ]}
        contextResults?.elementValue[queryTemplateConstantOrAnyReference.referenceName] ?? {
          elementType: "failure",
          elementValue: { queryFailure: "ReferenceFoundButUndefined", queryContext: JSON.stringify(contextResults) },
        }
      : queryTemplateConstantOrAnyReference.templateType == "parameterReference"
      ? // ? { elementType: "any", elementValue: queryParams[queryTemplateConstantOrAnyReference.referenceName] }
        queryParams.elementValue[queryTemplateConstantOrAnyReference.referenceName]
      : queryTemplateConstantOrAnyReference.templateType == "constantUuid"
      ? { elementType: "instanceUuid", elementValue: queryTemplateConstantOrAnyReference.constantUuidValue } // new object
      : {
          elementType: "failure",
          elementValue: { queryFailure: queryTemplateConstantOrAnyReference },
        }; /* this should not happen. Provide "error" value instead?*/

  log.info(
    "resolveActionTemplateContextReference for queryTemplateConstantOrAnyReference=",
    queryTemplateConstantOrAnyReference,
    "resolved as",
    reference,
    "for queryParams",
    queryParams
  );

  return reference;
};

export type ActionTemplate = any;

// ################################################################################################
export function renderObjectRuntimeTemplate(
  objectName: string,
  runtimeTransformer: RuntimeTransformer,
  queryParams: DomainElementObject,
  contextResults?: DomainElementObject,
): DomainElement {
  // log.info("renderObjectBuildTemplate called for object named", objectName,"template", objectBuildTemplate, "queryParams", queryParams);
  if (typeof runtimeTransformer == "object") {
    // log.info("renderObjectBuildTemplate for template object named", objectName, "templateType", objectBuildTemplate.templateType);
    if (Array.isArray(runtimeTransformer)) {
      const subObject = runtimeTransformer.map((e, index) =>
        renderObjectBuildTemplate(index.toString(), e, queryParams, contextResults)
      );
      const failureIndex = subObject.findIndex((e) => e.elementType == "failure");
      if (failureIndex == -1) {
        return {
          elementType: "array",
          elementValue: subObject.map((e) => e.elementValue),
        }
      } else {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "ReferenceNotFound",
            queryContext:
              "no " +
              objectName +
              " in " +
              runtimeTransformer,
          },
        };
      }

    } else {
      if (runtimeTransformer.templateType) {
        switch (runtimeTransformer.templateType) {
          case "count": {
            const resolvedReference = resolveActionTemplateContextReference(
              { templateType: "contextReference", referenceName:runtimeTransformer.referencedExtractor },
              queryParams,
              contextResults
            );

            log.info(
              "innerSelectElementFromQuery extractorTransformer count referencedExtractor resolvedReference",
              resolvedReference
            );
          
            if (resolvedReference.elementType != "instanceUuidIndex") {
              log.error("innerSelectElementFromQuery extractorTransformer count referencedExtractor resolvedReference", resolvedReference);
              return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } }; // TODO: improve error message / queryFailure
            }
            const sortByAttribute = runtimeTransformer.orderBy
              ? (a: any[]) =>
                  a.sort((a, b) =>
                    a[runtimeTransformer.orderBy ?? ""].localeCompare(b[runtimeTransformer.orderBy ?? ""], "en", {
                      sensitivity: "base",
                    })
                  )
              : (a: any[]) => a;

            if (runtimeTransformer.groupBy) {
              const result = new Map<string, number>();
              for (const entry of Object.entries(resolvedReference.elementValue)) {
                const key = (entry[1] as any)[runtimeTransformer.groupBy];
                if (result.has(key)) {
                  result.set(key, (result.get(key)??0) + 1);
                } else {
                  result.set(key, 1);
                }
              }
              return {
                elementType: "any",
                elementValue: sortByAttribute([...result.entries()].map((e) => ({ [runtimeTransformer.groupBy as any]: e[0], count: e[1] }))),
              };
            } else {
              return { elementType: "any" /* TODO: number? */, elementValue: [{count: Object.keys(resolvedReference.elementValue).length}] };
            }
            break;
          }
          case "unique": {
            const resolvedReference = resolveActionTemplateContextReference(
              { templateType: "contextReference", referenceName:runtimeTransformer.referencedExtractor },
              queryParams,
              contextResults
            );

            log.info(
              "innerSelectElementFromQuery extractorTransformer unique referencedExtractor resolvedReference",
              resolvedReference
            );
          
            if (resolvedReference.elementType != "instanceUuidIndex") {
              log.error("innerSelectElementFromQuery extractorTransformer unique referencedExtractor resolvedReference", resolvedReference);
              return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } }; // TODO: improve error message / queryFailure
            }
          
            const sortByAttribute = runtimeTransformer.orderBy
              ? (a: any[]) =>
                  a.sort((a, b) =>
                    a[runtimeTransformer.orderBy ?? ""].localeCompare(b[runtimeTransformer.orderBy ?? ""], "en", {
                      sensitivity: "base",
                    })
                  )
              : (a: any[]) => a;
            const result = new Set<string>();
            for (const entry of Object.entries(resolvedReference.elementValue)) {
              result.add((entry[1] as any)[runtimeTransformer.attribute]);
            }
            return {
              elementType: "any",
              elementValue: sortByAttribute([...result].map((e) => ({ [runtimeTransformer.attribute]: e }))),
            };
            break;  
          }
            
          // case "fullObjectTemplate": {
          //   const result = Object.fromEntries(
          //     runtimeTransformer.definition.map(
          //       (innerEntry: { attributeKey: ObjectTemplateInnerReference; attributeValue: ObjectBuildTemplate }) => {
          //         // log.info("renderObjectBuildTemplate for object named",objectName,"innerEntry index", innerEntry[0], "innerEntry value", innerEntry[1]);

          //         const rawLeftValue = innerEntry.attributeKey.templateType
          //           ? resolveActionTemplateContextReference(innerEntry.attributeKey, queryParams, contextResults)
          //           : innerEntry.attributeKey;
          //         const leftValue =
          //           typeof innerEntry.attributeKey == "object" && (innerEntry.attributeKey as any).applyFunction
          //             ? (innerEntry.attributeKey as any).applyFunction(rawLeftValue)
          //             : rawLeftValue;

          //         const rawRightValue = renderObjectBuildTemplate(
          //           leftValue,
          //           innerEntry.attributeValue,
          //           queryParams,
          //           contextResults
          //         );
          //         const rightValue =
          //           typeof innerEntry.attributeValue == "object" && (innerEntry.attributeValue as any).applyFunction
          //             ? (innerEntry.attributeValue as any).applyFunction(rawRightValue)
          //             : rawRightValue;
          //         // log.info(
          //         //   "renderObjectBuildTemplate fullObjectTemplate for ",
          //         //   objectBuildTemplate,
          //         //   "rawLeftvalue",
          //         //   rawLeftValue,
          //         //   "leftValue",
          //         //   leftValue,
          //         //   "rawRightvalue",
          //         //   rawRightValue,
          //         //   "rightValue",
          //         //   rightValue
          //         // );
          //         return [leftValue, rightValue];
          //       }
          //     )
          //   );
          //   return result;
          //   break;
          // }
          // case "mustacheStringTemplate": {
          //   const result = Mustache.render(runtimeTransformer.definition, queryParams);
          //   log.info(
          //     "renderObjectBuildTemplate mustacheStringTemplate for",
          //     runtimeTransformer,
          //     "queryParams",
          //     queryParams,
          //     "result",
          //     result
          //   );
          //   return result;
          //   break;
          // }
          // case "constantUuid":
          // case "contextReference":
          // case "parameterReference":
          default: {
            throw new Error("could not render runtimeTransformer" + JSON.stringify(runtimeTransformer, null, 2));
            // const rawValue = runtimeTransformer.templateType
            //   ? resolveActionTemplateContextReference(runtimeTransformer, queryParams, contextResults)
            //   : runtimeTransformer;
            // const value =
            //   typeof runtimeTransformer == "object" && (runtimeTransformer as any).applyFunction
            //     ? (runtimeTransformer as any).applyFunction(rawValue)
            //     : rawValue;
            // // log.info("renderObjectBuildTemplate default case for", objectBuildTemplate, "rawvalue", rawValue, "value", value);
            // return value;
            break;
          }
        }
      } else {
        // log.info("renderObjectBuildTemplate converting plain object", objectBuildTemplate);
        const result = Object.fromEntries(
          Object.entries(runtimeTransformer).map((objectTemplateEntry: [string, any]) => {
            return [
              objectTemplateEntry[0],
              renderObjectBuildTemplate(objectTemplateEntry[0], objectTemplateEntry[1], queryParams, contextResults),
            ];
          })
        );
        return { elementType: "object", elementValue: result};
      }
    }
  } else {
    // plain value
    return runtimeTransformer;
  }
}

// ################################################################################################
export function renderObjectBuildTemplate(
  objectName: string,
  objectBuildTemplate: ObjectBuildTemplate,
  queryParams: DomainElementObject,
  contextResults?: DomainElementObject,
): DomainElement {
  // log.info("renderObjectBuildTemplate called for object named", objectName,"template", objectBuildTemplate, "queryParams", queryParams);
  if (typeof objectBuildTemplate == "object") {
    // log.info("renderObjectBuildTemplate for template object named", objectName, "templateType", objectBuildTemplate.templateType);
    if (Array.isArray(objectBuildTemplate)) {
      const subObject = objectBuildTemplate.map((e, index) =>
        renderObjectBuildTemplate(index.toString(), e, queryParams, contextResults)
      );
      const failureIndex = subObject.findIndex((e) => e.elementType == "failure");
      if (failureIndex == -1) {
        return {
          elementType: "array",
          elementValue: subObject.map((e) => e.elementValue),
        }
      } else {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "ReferenceNotFound",
            queryContext:
              "no " +
              objectName +
              " in " +
              objectBuildTemplate,
          },
        };
      }
    } else {
      if (objectBuildTemplate.templateType) {
        switch (objectBuildTemplate.templateType) {
          case "fullObjectTemplate": {
            const attributeEntries = objectBuildTemplate.definition.map(
              (innerEntry: { attributeKey: ObjectTemplateInnerReference; attributeValue: ObjectBuildTemplate }): [
                { rawLeftValue: DomainElement; finalLeftValue: DomainElement },
                { renderedRightValue: DomainElement; finalRightValue: DomainElement }
              ] => {
                // log.info("renderObjectBuildTemplate for object named",objectName,"innerEntry index", innerEntry[0], "innerEntry value", innerEntry[1]);

                const rawLeftValue: DomainElement = innerEntry.attributeKey.templateType
                  ? resolveActionTemplateContextReference(innerEntry.attributeKey, queryParams, contextResults)
                  : { elementType: "string", elementValue: innerEntry.attributeKey};
                const leftValue:{ rawLeftValue: DomainElement; finalLeftValue: DomainElement } = {
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
                // log.info("renderObjectBuildTemplate fullObjectTemplate innerEntry.attributeKey", innerEntry.attributeKey, "leftValue", leftValue);

                const renderedRightValue: DomainElement = renderObjectBuildTemplate(
                  leftValue.finalLeftValue.elementValue as string,
                  innerEntry.attributeValue,
                  queryParams,
                  contextResults
                );
                const rightValue: { renderedRightValue: DomainElement; finalRightValue: DomainElement } = {
                  renderedRightValue,
                  finalRightValue:
                    renderedRightValue.elementType != "failure" && (innerEntry.attributeValue as any).applyFunction
                      ? { elementType: "any", elementValue: (innerEntry.attributeValue as any).applyFunction(renderedRightValue.elementValue)}
                      : renderedRightValue,
                };
                // log.info("renderObjectBuildTemplate fullObjectTemplate innerEntry.attributeKey", innerEntry.attributeKey, "rightValue", rightValue);
                return [leftValue, rightValue];
              }
            )
            const failureIndex = attributeEntries.findIndex((e) => e[0].finalLeftValue.elementType == "failure" || e[1].finalRightValue.elementType == "failure");
            if (failureIndex == -1) { // no failure found
              
              log.info("renderObjectBuildTemplate fullObjectTemplate for", objectBuildTemplate, "attributeEntries", JSON.stringify(attributeEntries, null, 2));
              const fullObjectResult = Object.fromEntries(
                attributeEntries.map((e) => [e[0].finalLeftValue.elementValue, e[1].finalRightValue.elementValue])
              );
              log.info("renderObjectBuildTemplate fullObjectTemplate for", objectBuildTemplate, "fullObjectResult", fullObjectResult);
              return {
                elementType: "object",
                elementValue: fullObjectResult,
              };
            } else {
              return {
                elementType: "failure",
                elementValue: {
                  queryFailure: "ReferenceNotFound",
                  queryContext: "error in " + objectName + " in " + JSON.stringify(attributeEntries[failureIndex], null, 2),
                },
              };
            }
            // const result = Object.fromEntries(
            // );
            // return {};
            break;
          }
          case "mustacheStringTemplate": {
            const cleanedQueryParams = domainElementToPlainObject(queryParams); // TODO: highly inefficient!!
            const result = Mustache.render(objectBuildTemplate.definition, cleanedQueryParams);
            log.info(
              "renderObjectBuildTemplate mustacheStringTemplate for",
              objectBuildTemplate,
              "queryParams",
              queryParams,
              "result",
              result
            );
            return { elementType: "string", elementValue: result};
            break;
          }
          case "constantUuid":
          case "contextReference":
          case "parameterReference":
          default: {
            const rawValue = resolveActionTemplateContextReference(objectBuildTemplate, queryParams, contextResults);
            const returnedValue: DomainElement =
              typeof objectBuildTemplate == "object" && (objectBuildTemplate as any).applyFunction
                ? { elementType: "any", elementValue: (objectBuildTemplate as any).applyFunction(rawValue.elementValue)}
                : rawValue;
            // log.info("renderObjectBuildTemplate default case for", objectBuildTemplate, "rawvalue", rawValue, "value", value);
            // return { elementType: "any", elementValue: value};
            return returnedValue;
            break;
          }
        }
      } else {
        //  this is a plain object!! The result of renderObjectBuildTemplate is an object
        // rendering the attributes of the object if needed
        const attributeEntries:[string, DomainElement][] = Object.entries(objectBuildTemplate).map((objectTemplateEntry: [string, any]) => {
          return [
            objectTemplateEntry[0],
            renderObjectBuildTemplate(objectTemplateEntry[0], objectTemplateEntry[1], queryParams, contextResults),
          ];
        });
        log.info("renderObjectBuildTemplate converting plain object", objectBuildTemplate, "attributeEntries", JSON.stringify(attributeEntries, null, 2));
        const failureIndex = attributeEntries.findIndex((e) => e[1].elementType == "failure");
        if (failureIndex == -1) {
          return {
            elementType: "object",
            elementValue: Object.fromEntries(
              attributeEntries.map((e) => [e[0], e[1].elementValue])
            ),
          };
        } else {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "ReferenceNotFound",
              queryContext: "error in " + objectName + " in " + JSON.stringify(attributeEntries[failureIndex]),
            },
          };
        }
        // const result = Object.fromEntries(
        //   Object.entries(objectBuildTemplate).map((objectTemplateEntry: [string, any]) => {
        //     return [
        //       objectTemplateEntry[0],
        //       renderObjectBuildTemplate(objectTemplateEntry[0], objectTemplateEntry[1], queryParams, contextResults),
        //     ];
        //   })
        // );
        // return result;
      }
    }
  } else {
    // plain value
    return { elementType: "any", elementValue: objectBuildTemplate};
  }
}

// ################################################################################################
export function actionTemplateToAction(
  actionTemplate: ActionTemplate,
  queryParams: any,
  contextResults?: any
): DomainAction {
  // TODO: deal with failure!
  return renderObjectBuildTemplate(actionTemplate, queryParams, contextResults).elementValue as DomainAction;
}

// ################################################################################################
export async function runActionTemplate(
  domainController: DomainControllerInterface,
  actionTemplate: ActionTemplate,
  params: any
): Promise<ActionReturnType> {
  // log.info("runActionTemplate", "actionTemplate", actionTemplate, "params", params);
  const actionToRun = actionTemplateToAction("ROOT", actionTemplate, params);
  // log.info("runActionTemplate actionToRun", actionToRun);
  return domainController.handleAction(actionToRun);
}
