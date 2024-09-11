// ################################################################################################

import {
  ApplicationSection,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  DomainModelGetEntityDefinitionExtractor,
  EntityDefinition,
  ExtractorForRecordOfExtractors,
  ExtractorTemplateForDomainModel,
  ExtractorTemplateForDomainModelObjects,
  ExtractorTemplateForRecordOfExtractors,
  ExtractorTemplateForSingleObject,
  ExtractorTemplateForSingleObjectList,
  JzodObject,
  QueryTemplateSelectObject,
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
// import { extractWithManyExtractors } from "./QuerySelectors.js";
import {
  extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory,
  extractFetchQueryTemplateJzodSchema,
  extractJzodSchemaForDomainModelQueryTemplate,
  extractWithExtractorTemplate,
  extractWithManyExtractorTemplates,
  extractzodSchemaForSingleSelectQueryTemplate,
  resolveContextReference,
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
export const extractEntityInstanceListFromListQueryTemplateAndDomainState: SyncExtractorTemplateRunner<
  ExtractorTemplateForSingleObjectList,
  DomainState,
  DomainElementInstanceUuidIndexOrFailed
> = extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory<DomainState>;

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

  const entityUuid: DomainElement = resolveContextReference(
    selectorParams.extractorTemplate.select.parentUuid,
    selectorParams.extractorTemplate.queryParams,
    selectorParams.extractorTemplate.contextResults
  );

  // log.info("selectEntityInstanceUuidIndexFromDomainStateForTemplate params", selectorParams, deploymentUuid, applicationSection, entityUuid);
  // log.info("selectEntityInstanceUuidIndexFromDomainStateForTemplate domainState", domainState);

  if (!deploymentUuid || !applicationSection || !entityUuid) {
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
          JSON.stringify(entityUuid),
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
  switch (entityUuid.elementType) {
    case "string":
    case "instanceUuid": {
      if (!domainState[deploymentUuid][applicationSection][entityUuid.elementValue]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuid.elementValue,
          },
        };
      }

      return {
        elementType: "instanceUuidIndex",
        elementValue: domainState[deploymentUuid][applicationSection][entityUuid.elementValue],
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
            "selectEntityInstanceUuidIndexFromDomainStateForTemplate could not handle reference" + JSON.stringify(entityUuid),
          queryReference: JSON.stringify(selectorParams.extractorTemplate.select.parentUuid),
        },
      };
    }
    case "failure": {
      return entityUuid;
      break;
    }
    default: {
      throw new Error(
        "selectEntityInstanceUuidIndexFromDomainStateForTemplate could not handle reference entityUuid=" + entityUuid
      );
      break;
    }
  }
};

// ################################################################################################
// ACCESSES DOMAIN STATE
/**
 * returns an Entity Instance (Object) from and selectObjectByParameterValue
 * @param domainState
 * @param selectorParams
 * @returns
 */
export const selectEntityInstanceFromObjectQueryAndDomainStateForTemplate: SyncExtractorTemplateRunner<
  ExtractorTemplateForSingleObject,
  DomainState,
  DomainElementEntityInstanceOrFailed
> = (
  domainState: DomainState,
  selectorParams: SyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObject, DomainState>
): DomainElementEntityInstanceOrFailed => {
  const querySelectorParams: QueryTemplateSelectObject = selectorParams.extractorTemplate.select as QueryTemplateSelectObject;
  const deploymentUuid = selectorParams.extractorTemplate.deploymentUuid;
  const applicationSection: ApplicationSection =
    selectorParams.extractorTemplate.select.applicationSection ??
    ((selectorParams.extractorTemplate.pageParams?.applicationSection ?? "data") as ApplicationSection);

  log.info(
    "selectEntityInstanceFromObjectQueryAndDomainStateForTemplate params",
    querySelectorParams,
    "deploymentUuid",
    deploymentUuid,
    "applicationSection",
    applicationSection
  );
  const entityUuidReference: DomainElement = resolveContextReference(
    querySelectorParams.parentUuid,
    selectorParams.extractorTemplate.queryParams,
    selectorParams.extractorTemplate.contextResults
  );
  log.info("selectEntityInstanceFromObjectQueryAndDomainStateForTemplate entityUuidReference", entityUuidReference);

  if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
    return {
      elementType: "failure",
      elementValue: {
        queryFailure: "IncorrectParameters",
        queryContext:
          "selectEntityInstanceFromObjectQueryAndDomainStateForTemplate wrong entityUuidReference=" +
          JSON.stringify(entityUuidReference),
        queryReference: JSON.stringify(querySelectorParams.parentUuid),
      },
    };
  }

  switch (querySelectorParams?.queryType) {
    case "selectObjectByRelation": {
      const referenceObject = resolveContextReference(
        querySelectorParams.objectReference,
        selectorParams.extractorTemplate.queryParams,
        selectorParams.extractorTemplate.contextResults
      );

      if (
        !querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
        // ||
        // referenceObject.elementType != "instance"
      ) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "IncorrectParameters",
            queryParameters: JSON.stringify(selectorParams.extractorTemplate.pageParams),
            queryContext:
              "DomainStateQuerySelectors selectObjectByRelation did not find AttributeOfObjectToCompareToReferenceUuid in " +
              JSON.stringify(querySelectorParams),
          },
        };
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
      if (!domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference.elementValue,
          },
        };
      }

      // log.info(
      //   "selectEntityInstanceFromObjectQueryAndDomainStateForTemplate selectObjectByRelation, ############# reference",
      //   querySelectorParams,
      //   "######### context entityUuid",
      //   entityUuidReference,
      //   "######### referenceObject",
      //   referenceObject,
      //   "######### queryParams",
      //   JSON.stringify(selectorParams.query.queryParams, undefined, 2),
      //   "######### contextResults",
      //   JSON.stringify(selectorParams.query.contextResults, undefined, 2)
      // );
      return {
        elementType: "instance",
        elementValue:
          domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue][
            (referenceObject.elementValue as any)[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
          ],
      };
      break;
    }
    case "selectObjectByDirectReference": {
      const instanceUuidDomainElement = transformer_InnerReference_resolve(
        "build",
        querySelectorParams.instanceUuid,
        selectorParams.extractorTemplate.queryParams,
        selectorParams.extractorTemplate.contextResults
      );
      // const instanceUuidDomainElement = resolveContextReference(
      //   querySelectorParams.instanceUuid,
      //   selectorParams.extractorTemplate.queryParams,
      //   selectorParams.extractorTemplate.contextResults
      // );

      log.info(
        "selectEntityInstanceFromObjectQueryAndDomainStateForTemplate found instanceUuid",
        JSON.stringify(instanceUuidDomainElement)
      );

      if (instanceUuidDomainElement.elementType == "instance") {
        return instanceUuidDomainElement; /* QueryResults, elementType == "failure" */
      }
      if (
        instanceUuidDomainElement.elementType != "string" &&
        instanceUuidDomainElement.elementType != "instanceUuid"
      ) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference.elementValue,
            instanceUuid: instanceUuidDomainElement.elementValue,
          },
        };
      }
      // log.info("selectEntityInstanceFromObjectQueryAndDomainStateForTemplate resolved instanceUuid =", instanceUuid);
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
      if (!domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference.elementValue,
          },
        };
      }
      if (
        !domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue][
          instanceUuidDomainElement.elementValue
        ]
      ) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "InstanceNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference.elementValue,
            instanceUuid: instanceUuidDomainElement.elementValue,
          },
        };
      }

      // log.info("selectEntityInstanceFromObjectQueryAndDomainStateForTemplate selectObjectByDirectReference, ############# reference",
      //   querySelectorParams,
      //   "entityUuidReference",
      //   entityUuidReference,
      //   "######### context entityUuid",
      //   entityUuidReference,
      //   "######### queryParams",
      //   JSON.stringify(selectorParams.query.queryParams, undefined, 2),
      //   "######### contextResults",
      //   JSON.stringify(selectorParams.query.contextResults, undefined, 2),
      //   "domainState",
      //   domainState
      // );
      return {
        elementType: "instance",
        elementValue:
          domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue][
            instanceUuidDomainElement.elementValue
          ],
      };
      break;
    }
    default: {
      throw new Error(
        "selectEntityInstanceFromObjectQueryAndDomainStateForTemplate can not handle QueryTemplateSelectObject query with queryType=" +
          selectorParams.extractorTemplate.select.queryType
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
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDomainStateForTemplate,
    extractEntityInstance: selectEntityInstanceFromObjectQueryAndDomainStateForTemplate,
    extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory: extractEntityInstanceListFromListQueryTemplateAndDomainState,
    extractWithManyExtractorTemplates: extractWithManyExtractorsFromDomainStateForTemplate,
    extractWithExtractorTemplate: extractWithExtractorTemplate,
  };
}

// ################################################################################################
export function getSelectorParamsForTemplate<QueryType extends ExtractorTemplateForDomainModel>(
  query: QueryType,
  extractorRunnerMap?: SyncExtractorTemplateRunnerMap<DomainState>
): SyncExtractorTemplateRunnerParams<QueryType, DomainState> {
  return {
    extractorTemplate: query,
    extractorRunnerMap: extractorRunnerMap ?? getSelectorMapForTemplate(),
  };
}