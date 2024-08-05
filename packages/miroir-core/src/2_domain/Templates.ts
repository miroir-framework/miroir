// import { render } from "mustache";
import Mustache from "mustache";

import {
  DomainElement,
  DomainAction,
  JzodReference,
  ActionReturnType,
  ObjectTemplateInnerReference,
  ObjectTemplate,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"Templates");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

export const domainElementTemplateSchema: JzodReference = {
  type: "schemaReference",
  context: {},
  definition: {
    relativePath: "",
  },
};

// ################################################################################################
// duplicate from QuerySelectors.ts
export const resolveActionTemplateContextReference = (
  queryTemplateConstantOrAnyReference: ObjectTemplateInnerReference,
  queryParams: any,
  contextResults: any
): any => {
  // TODO: copy / paste (almost?) from query parameter lookup!
  // log.info("resolveActionTemplateContextReference for queryTemplateConstantOrAnyReference=", queryTemplateConstantOrAnyReference, "queryParams=", queryParams,"contextResults=", contextResults)
  if (
    (queryTemplateConstantOrAnyReference.templateType == "contextReference" &&
      (!contextResults || !contextResults[queryTemplateConstantOrAnyReference.referenceName])) ||
    (queryTemplateConstantOrAnyReference.templateType == "parameterReference" &&
      (typeof queryParams != "object" || !Object.keys(queryParams).includes(queryTemplateConstantOrAnyReference.referenceName)))
  ) {
    // checking that given reference does exist
    log.warn("could not find", queryTemplateConstantOrAnyReference.templateType, queryTemplateConstantOrAnyReference.referenceName, "in", queryTemplateConstantOrAnyReference.templateType == "contextReference"?JSON.stringify(contextResults):Object.keys(queryParams))
    return {
      elementType: "failure",
      elementValue: { queryFailure: "ReferenceNotFound", queryContext: "no " + queryTemplateConstantOrAnyReference.referenceName + " in " + queryTemplateConstantOrAnyReference.templateType == "contextReference"?JSON.stringify(contextResults):Object.keys(queryParams) },
    };
  }

  if (
    (queryTemplateConstantOrAnyReference.templateType == "contextReference" &&
      !contextResults[queryTemplateConstantOrAnyReference.referenceName].elementValue) ||
    (queryTemplateConstantOrAnyReference.templateType == "parameterReference" && !queryParams[queryTemplateConstantOrAnyReference.referenceName])
  ) {
    // checking that given reference does exist
    return {
      elementType: "failure",
      elementValue: { queryFailure: "ReferenceFoundButUndefined", queryContext: JSON.stringify(contextResults) },
    };
  }

  const reference: DomainElement =
    queryTemplateConstantOrAnyReference.templateType == "contextReference"
      ? contextResults[queryTemplateConstantOrAnyReference.referenceName]
      : queryTemplateConstantOrAnyReference.templateType == "parameterReference"
      ? queryParams[queryTemplateConstantOrAnyReference.referenceName]
      : queryTemplateConstantOrAnyReference.templateType == "constantUuid"
      ? { elementType: "instanceUuid", elementValue: queryTemplateConstantOrAnyReference.constantUuidValue } // new object
      : undefined; /* this should not happen. Provide "error" value instead?*/

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
export function renderObjectTemplate(
  objectName: string,
  objectTemplate: ObjectTemplate,
  queryParams: any,
  contextResults?: any
): any {
  // log.info("renderObjectTemplate called for object named", objectName,"template", objectTemplate, "queryParams", queryParams);
  if (typeof objectTemplate == "object") {
    // log.info("renderObjectTemplate for template object named", objectName, "templateType", objectTemplate.templateType);
    if (Array.isArray(objectTemplate)) {
      return objectTemplate.map(
        (e,index)=>renderObjectTemplate(index.toString(), e, queryParams, contextResults)
      )
    } else {
      if (objectTemplate.templateType) {
        switch (objectTemplate.templateType) {
          case "fullObjectTemplate": {
            const result = Object.fromEntries(
              objectTemplate.definition.map((innerEntry: [ObjectTemplateInnerReference, ObjectTemplate]) => {
                // log.info("renderObjectTemplate for object named",objectName,"innerEntry index", innerEntry[0], "innerEntry value", innerEntry[1]);
  
                const rawLeftValue = innerEntry[0].templateType
                  ? resolveActionTemplateContextReference(innerEntry[0], queryParams, contextResults)
                  : innerEntry[0];
                const leftValue =
                  typeof innerEntry[0] == "object" && (innerEntry[0] as any).applyFunction
                    ? (innerEntry[0] as any).applyFunction(rawLeftValue)
                    : rawLeftValue;
  
                const rawRightValue = renderObjectTemplate(leftValue, innerEntry[1], queryParams, contextResults);
                const rightValue =
                  typeof innerEntry[1] == "object" && (innerEntry[1] as any).applyFunction
                    ? (innerEntry[1] as any).applyFunction(rawRightValue)
                    : rawRightValue;
                // log.info(
                //   "renderObjectTemplate fullObjectTemplate for ",
                //   objectTemplate,
                //   "rawLeftvalue",
                //   rawLeftValue,
                //   "leftValue",
                //   leftValue,
                //   "rawRightvalue",
                //   rawRightValue,
                //   "rightValue",
                //   rightValue
                // );
                return [leftValue, rightValue];
              })
            );
            return result;
            break;
          }
          case "mustacheStringTemplate": {
            const result = Mustache.render(objectTemplate.definition, queryParams);
            log.info(
              "renderObjectTemplate mustacheStringTemplate for",
              objectTemplate,
              "queryParams",
              queryParams,
              "result",
              result
            );
            return result;
            break;
          }
          case "constantUuid":
          case "contextReference":
          case "parameterReference":
          default: {
            const rawValue = objectTemplate.templateType
              ? resolveActionTemplateContextReference(objectTemplate, queryParams, contextResults)
              : objectTemplate;
            const value =
              typeof objectTemplate == "object" && (objectTemplate as any).applyFunction
                ? (objectTemplate as any).applyFunction(rawValue)
                : rawValue;
            // log.info("renderObjectTemplate default case for", objectTemplate, "rawvalue", rawValue, "value", value);
            return value;
            break;
          }
        }
      } else {
        // log.info("renderObjectTemplate converting plain object", objectTemplate);
        const result = Object.fromEntries(
          Object.entries(objectTemplate).map(
            (objectTemplateEntry: [string, any]) => {
              return [
                objectTemplateEntry[0],
                renderObjectTemplate(objectTemplateEntry[0], objectTemplateEntry[1], queryParams, contextResults),
              ];
            }
          )
        );
        return result;
      }
    }
  } else { // plain value
    return objectTemplate;
  }
}

// ################################################################################################
export function actionTemplateToAction(
  actionTemplate: ActionTemplate,
  queryParams: any,
  contextResults?: any
): DomainAction {
  return renderObjectTemplate(actionTemplate, queryParams, contextResults);
}

// ################################################################################################
export async function runActionTemplate(
  domainController: DomainControllerInterface,
  actionTemplate: ActionTemplate,
  params: any
): Promise<ActionReturnType> {
  // log.info("runActionTemplate", "actionTemplate", actionTemplate, "params", params);
  const actionToRun = actionTemplateToAction("ROOT",actionTemplate, params);
  // log.info("runActionTemplate actionToRun", actionToRun);
  return domainController.handleAction(
    actionToRun
  );
}
