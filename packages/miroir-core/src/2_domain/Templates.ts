// import { render } from "mustache";
import Mustache from "mustache";

import {
  DomainElement,
  DomainAction,
  JzodReference,
  ActionReturnType,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";

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

export const objectTemplateSchema: JzodReference = {
  type: "schemaReference",
  context: {
    objectTemplate: {
      type: "union",
      discriminator: "templateType",
      definition: [
        {
          type: "object",
          definition: {
            templateType: {
              type: "literal",
              definition: "constant",
            },
            referenceUuid: {
              type: "string",
            },
          },
        },
        {
          type: "object",
          definition: {
            templateType: {
              type: "literal",
              definition: "contextReference",
            },
            referenceName: {
              type: "string",
            },
          },
        },
        {
          type: "object",
          definition: {
            templateType: {
              type: "literal",
              definition: "parameterReference",
            },
            referenceName: {
              type: "string",
            },
          },
        },
        {
          type: "object",
          definition: {
            templateType: {
              type: "literal",
              definition: "mustacheString",
            },
            definition: {
              type: "string",
            },
          },
        },
        {
          type: "object",
          definition: {
            templateType: {
              type: "literal",
              definition: "fullObjectTemplate",
            },
            definition: {
              type: "array",
              definition: {
                type: "object",
                definition: {
                  index: {
                    type: "schemaReference",
                    definition: {
                      relativePath: "objectTemplate",
                    },
                  },
                  value: {
                    type: "schemaReference",
                    definition: {
                      relativePath: "objectTemplate",
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
  },
  definition: {
    relativePath: "",
  },
};
export type ObjectTemplateInnerReference =
  | {
      templateType: "constant",
      referenceUuid: string,
    }
  | {
      templateType: "contextReference",
      referenceName: string,
    }
  | {
      templateType: "parameterReference",
      referenceName: string,
    }
;
// | {
//   templateType: "fullObjectTemplate",
//   definition: [ObjectTemplate, ObjectTemplate][]
// }
export type ObjectTemplate =
  // {
  //   templateType: "constant";
  //   referenceUuid: string;
  // } | {
  //   templateType: "queryContextReference";
  //   referenceName: string;
  // } | {
  //   templateType: "queryParameterReference";
  //   referenceName: string;
  // }
  | ObjectTemplateInnerReference
  | {
    templateType: "mustacheStringTemplate",
    definition: string
  }
  | {
      templateType: "fullObjectTemplate",
      definition: [ObjectTemplateInnerReference, ObjectTemplate][],
    };

// ################################################################################################
export const resolveActionTemplateContextReference = (
  queryObjectReference: ObjectTemplateInnerReference,
  queryParams: any,
  contextResults: any
): any => {
  // log.info("resolveContextReference for queryObjectReference=", queryObjectReference, "queryParams=", queryParams,"contextResults=", contextResults)
  if (
    (queryObjectReference.templateType == "contextReference" &&
      (!contextResults || !contextResults[queryObjectReference.referenceName])) ||
    (queryObjectReference.templateType == "parameterReference" &&
      (typeof queryParams != "object" || !Object.keys(queryParams).includes(queryObjectReference.referenceName)))
  ) {
    // checking that given reference does exist
    return {
      elementType: "failure",
      elementValue: { queryFailure: "ReferenceNotFound", queryContext: JSON.stringify(contextResults) },
    };
  }

  if (
    (queryObjectReference.templateType == "contextReference" &&
      !contextResults[queryObjectReference.referenceName].elementValue) ||
    (queryObjectReference.templateType == "parameterReference" && !queryParams[queryObjectReference.referenceName])
  ) {
    // checking that given reference does exist
    return {
      elementType: "failure",
      elementValue: { queryFailure: "ReferenceFoundButUndefined", queryContext: JSON.stringify(contextResults) },
    };
  }

  const reference: DomainElement =
    queryObjectReference.templateType == "contextReference"
      ? contextResults[queryObjectReference.referenceName]
      : queryObjectReference.templateType == "parameterReference"
      ? queryParams[queryObjectReference.referenceName]
      : queryObjectReference.templateType == "constant"
      ? { elementType: "instanceUuid", elementValue: queryObjectReference.referenceUuid } // new object
      : undefined; /* this should not happen. Provide "error" value instead?*/

  // log.info(
  //   "resolveActionTemplateContextReference for queryObjectReference=",
  //   queryObjectReference,
  //   "resolved as",
  //   reference,
  //   "for queryParams",
  //   queryParams
  // );

  return reference;
};

export type ActionTemplate = any;

export function objectTemplateToObject(
  objectName: string,
  objectTemplate: ObjectTemplate,
  queryParams: any,
  contextResults?: any
): any {
  // log.info("objectTemplateToObject called for object named", objectName,"template", objectTemplate, "queryParams", queryParams);
  if (typeof objectTemplate == "object") {
    // log.info("objectTemplateToObject for template object named", objectName, "templateType", objectTemplate.templateType);
    if (Array.isArray(objectTemplate)) {
      return objectTemplate.map(
        (e,index)=>objectTemplateToObject(index.toString(), e, queryParams, contextResults)
      )
    } else {
      if (objectTemplate.templateType) {
        switch (objectTemplate.templateType) {
          case "fullObjectTemplate": {
            const result = Object.fromEntries(
              objectTemplate.definition.map((innerEntry: [ObjectTemplateInnerReference, ObjectTemplate]) => {
                // log.info("objectTemplateToObject for object named",objectName,"innerEntry index", innerEntry[0], "innerEntry value", innerEntry[1]);
  
                const rawLeftValue = innerEntry[0].templateType
                  ? resolveActionTemplateContextReference(innerEntry[0], queryParams, contextResults)
                  : innerEntry[0];
                const leftValue =
                  typeof innerEntry[0] == "object" && (innerEntry[0] as any).applyFunction
                    ? (innerEntry[0] as any).applyFunction(rawLeftValue)
                    : rawLeftValue;
  
                const rawRightValue = objectTemplateToObject(leftValue, innerEntry[1], queryParams, contextResults);
                const rightValue =
                  typeof innerEntry[1] == "object" && (innerEntry[1] as any).applyFunction
                    ? (innerEntry[1] as any).applyFunction(rawRightValue)
                    : rawRightValue;
                // log.info(
                //   "objectTemplateToObject fullObjectTemplate for ",
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
            return result;
            break;
          }
          case "constant":
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
            // log.info("objectTemplateToObject default case for", objectTemplate, "rawvalue", rawValue, "value", value);
            return value;
            break;
          }
        }
      } else {
        // log.info("objectTemplateToObject converting plain object", objectTemplate);
        const result = Object.fromEntries(
          Object.entries(objectTemplate).map(
            (objectTemplateEntry: [string, any]) => {
              return [objectTemplateEntry[0], objectTemplateToObject(objectTemplateEntry[0], objectTemplateEntry[1], queryParams, contextResults)];
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
export function actionTemplateToAction(
  actionTemplate: ActionTemplate,
  queryParams: any,
  contextResults?: any
): DomainAction {
  return objectTemplateToObject(actionTemplate, queryParams, contextResults);
}

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
