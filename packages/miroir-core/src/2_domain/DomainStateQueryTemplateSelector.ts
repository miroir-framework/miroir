// ################################################################################################

import {
  DomainElement,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  DomainModelGetEntityDefinitionExtractor,
  EntityDefinition,
  ExtractorTemplateForDomainModel,
  ExtractorTemplateForDomainModelObjects,
  ExtractorTemplateForRecordOfExtractors,
  ExtractorTemplateForSingleObjectList,
  JzodObject
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import {
  ExtractorTemplateRunnerParamsForJzodSchema,
  SyncExtractorTemplateRunner,
  SyncExtractorTemplateRunnerMap,
  SyncExtractorTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { entityEntityDefinition } from "../index.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import {
  extractEntityInstanceListFromListQueryAndDomainState,
  extractWithManyExtractorsFromDomainState,
  selectEntityInstanceFromObjectQueryAndDomainState,
  selectEntityInstanceUuidIndexFromDomainState,
} from "./DomainStateQuerySelectors.js";
import { extractWithExtractor } from "./QuerySelectors.js";
import {
  extractFetchQueryTemplateJzodSchema,
  extractJzodSchemaForDomainModelQueryTemplate,
  extractWithExtractorTemplate,
  extractWithManyExtractorTemplates,
  extractzodSchemaForSingleSelectQueryTemplate
} from "./QueryTemplateSelectors.js";
import { transformer_InnerReference_resolve } from "./Transformers.js";


const loggerName: string = getLoggerName(packageName, cleanLevel, "DomainStateQueryTemplateSelector");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export const selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate = extractJzodSchemaForDomainModelQueryTemplate<DomainState>;

export const selectFetchQueryJzodSchemaFromDomainStateNewForTemplate = extractFetchQueryTemplateJzodSchema<DomainState>;

export const selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate = extractzodSchemaForSingleSelectQueryTemplate<DomainState>;

// ################################################################################################
// TODO: used in extractWithExtractorFromDomainStateForTemplate.unit.test and RestServer.ts, provide a better interface?
export const extractWithExtractorFromDomainStateForTemplate: SyncExtractorTemplateRunner<
  ExtractorTemplateForDomainModelObjects | ExtractorTemplateForRecordOfExtractors,
  DomainState,
  DomainElement
> = extractWithExtractorTemplate<DomainState>;


// ################################################################################################
export const extractWithManyExtractorsFromDomainStateForTemplate: SyncExtractorTemplateRunner<
  ExtractorTemplateForRecordOfExtractors,
  DomainState,
  DomainElementObject
> = extractWithManyExtractorTemplates<DomainState>;

// ################################################################################################
// ACCESSES DOMAIN STATE
export const selectEntityInstanceUuidIndexFromDomainStateForTemplate: SyncExtractorTemplateRunner<
  ExtractorTemplateForSingleObjectList,
  DomainState,
  DomainElementInstanceUuidIndexOrFailed
> = (
  domainState: DomainState,
  selectorParams: SyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObjectList, DomainState>
): DomainElementInstanceUuidIndexOrFailed => {
  const deploymentUuid = selectorParams.extractorTemplate.deploymentUuid;
  const applicationSection = selectorParams.extractorTemplate.select.applicationSection ?? "data";

  const entityUuidDomainElement = transformer_InnerReference_resolve(
    "build",
    selectorParams.extractorTemplate.select.parentUuid,
    selectorParams.extractorTemplate.queryParams,
    selectorParams.extractorTemplate.contextResults
  );

  // log.info("selectEntityInstanceUuidIndexFromDomainStateForTemplate params", selectorParams, deploymentUuid, applicationSection, entityUuid);
  // log.info("selectEntityInstanceUuidIndexFromDomainStateForTemplate domainState", domainState);

  if (!deploymentUuid || !applicationSection || !entityUuidDomainElement) {
    return {
      // new object
      elementType: "failure",
      elementValue: {
        queryFailure: "IncorrectParameters",
        queryContext:
          "deploymentUuid=" +
          deploymentUuid +
          ", applicationSection=" +
          applicationSection +
          ", entityUuid=" +
          JSON.stringify(entityUuidDomainElement),
        queryParameters: JSON.stringify(selectorParams),
      },
    };
    // resolving by fetchDataReference, fetchDataReferenceAttribute
  }
  if (!domainState) {
    return { elementType: "failure", elementValue: { queryFailure: "DomainStateNotLoaded" } };
  }
  if (!domainState[deploymentUuid]) {
    return { elementType: "failure", elementValue: { queryFailure: "DeploymentNotFound", deploymentUuid } };
  }
  if (!domainState[deploymentUuid][applicationSection]) {
    return {
      elementType: "failure",
      elementValue: { queryFailure: "ApplicationSectionNotFound", deploymentUuid, applicationSection },
    };
  }
  switch (entityUuidDomainElement.elementType) {
    case "string":
    case "instanceUuid": {
      if (!domainState[deploymentUuid][applicationSection][entityUuidDomainElement.elementValue]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidDomainElement.elementValue,
          },
        };
      }

      return {
        elementType: "instanceUuidIndex",
        elementValue: domainState[deploymentUuid][applicationSection][entityUuidDomainElement.elementValue],
      };
      break;
    }
    case "object":
    case "instance":
    case "instanceUuidIndex":
    case "instanceUuidIndexUuidIndex":
    case "array": {
      return {
        elementType: "failure",
        elementValue: {
          queryFailure: "IncorrectParameters",
          queryContext:
            "selectEntityInstanceUuidIndexFromDomainStateForTemplate could not handle reference" + JSON.stringify(entityUuidDomainElement),
          queryReference: JSON.stringify(selectorParams.extractorTemplate.select.parentUuid),
        },
      };
    }
    case "failure": {
      return entityUuidDomainElement;
      break;
    }
    default: {
      throw new Error(
        "selectEntityInstanceUuidIndexFromDomainStateForTemplate could not handle reference entityUuid=" + entityUuidDomainElement
      );
      break;
    }
  }
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ACCESSES DOMAIN STATE
export const selectEntityJzodSchemaFromDomainStateNewForTemplate = (
  domainState: DomainState,
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetEntityDefinitionExtractor, DomainState>
): JzodObject | undefined => {
  const localQuery: DomainModelGetEntityDefinitionExtractor = selectorParams.query;
  if (
    domainState &&
    domainState[localQuery.deploymentUuid] &&
    domainState[localQuery.deploymentUuid]["model"] &&
    domainState[localQuery.deploymentUuid]["model"][entityEntityDefinition.uuid]
  ) {
    const values: EntityDefinition[] = Object.values(
      domainState[localQuery.deploymentUuid]["model"][entityEntityDefinition.uuid] ?? {}
    ) as EntityDefinition[];
    const index = values.findIndex((e: EntityDefinition) => e.entityUuid == localQuery.entityUuid);

    const result: JzodObject | undefined = index > -1 ? values[index].jzodSchema : undefined;

    // log.info("DomainSelector selectEntityJzodSchemaFromDomainState result", result);

    return result;
  } else {
    return undefined;
  }
};

// ################################################################################################
export function getSelectorMapForTemplate(): SyncExtractorTemplateRunnerMap<DomainState> {
  return {
    extractorType: "sync",
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDomainState,
    extractEntityInstance: selectEntityInstanceFromObjectQueryAndDomainState,
    extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: extractEntityInstanceListFromListQueryAndDomainState,
    extractWithManyExtractors: extractWithManyExtractorsFromDomainState,
    extractWithExtractor: extractWithExtractor,
    // 
    extractEntityInstanceUuidIndexForTemplate: selectEntityInstanceUuidIndexFromDomainStateForTemplate,
    extractWithManyExtractorTemplates: extractWithManyExtractorsFromDomainStateForTemplate,
  };
}

// ################################################################################################
export function getSelectorParamsForTemplate<ExtractorTemplateType extends ExtractorTemplateForDomainModel>(
  query: ExtractorTemplateType,
  extractorRunnerMap?: SyncExtractorTemplateRunnerMap<DomainState>
): SyncExtractorTemplateRunnerParams<ExtractorTemplateType, DomainState> {
  return {
    extractorTemplate: query,
    extractorTemplateRunnerMap: extractorRunnerMap ?? getSelectorMapForTemplate(),
  };
}
