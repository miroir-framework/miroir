import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface.js";

import { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import {
  ApplicationSection,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  DomainModelGetEntityDefinitionExtractor,
  DomainModelGetFetchParamJzodSchemaForExtractorTemplate,
  EntityDefinition,
  ExtractorForDomainModel,
  ExtractorForDomainModelObjects,
  ExtractorForRecordOfExtractors,
  ExtractorForSingleObject,
  ExtractorForSingleObjectList,
  ExtractorTemplateForRecordOfExtractors,
  JzodObject,
  QuerySelectObject
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  ExtractorRunnerMapForJzodSchema,
  ExtractorRunnerParamsForJzodSchema,
  SyncExtractorRunner,
  SyncExtractorRunnerMap,
  SyncExtractorRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import entityEntityDefinition from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import {
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractFetchQueryJzodSchema,
  extractJzodSchemaForDomainModelQuery,
  extractWithExtractor,
  extractWithManyExtractors,
  extractzodSchemaForSingleSelectQuery,
  innerSelectElementFromQuery,
} from "./QuerySelectors.js";
import {
  resolveContextReference
} from "./QueryTemplateSelectors.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "DomainStateQuerySelector");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

const emptyDomainObject: DomainElementObject = { elementType: "object", elementValue: {} };

export const dummyDomainManyQueriesWithDeploymentUuid: ExtractorTemplateForRecordOfExtractors = {
  queryType: "extractorTemplateForRecordOfExtractors",
  deploymentUuid: "",
  pageParams: {},
  queryParams: {},
  contextResults: emptyDomainObject,
  runtimeTransformers: {},
};

export const dummyDomainModelGetFetchParamJzodSchemaQueryParams: DomainModelGetFetchParamJzodSchemaForExtractorTemplate = {
  queryType: "getFetchParamsJzodSchema",
  deploymentUuid: "",
  pageParams: {
    elementType: "object",
    elementValue: {
      applicationSection: { elementType: "string", elementValue: "data" },
      deploymentUuid: { elementType: "string", elementValue: "" },
      instanceUuid: { elementType: "string", elementValue: "" },
    },
  },
  queryParams: {},
  contextResults: {},
  fetchParams: {
    queryType: "extractorTemplateForRecordOfExtractors",
    deploymentUuid: "",
    pageParams: {},
    queryParams: {},
    contextResults: {},
    runtimeTransformers: {},
  },
};

// function getInstances(entityUuid: Uuid): DomainElementInstanceUuidIndexOrFailed {
//   return {
//     elementType: "failure",
//     elementValue: {
//       queryFailure: "NotImplemented",
//       queryParameters: JSON.stringify(entityUuid),
//     },
//   };
//  }

// ################################################################################################
// ACCESSES DOMAIN STATE
export const selectEntityInstanceUuidIndexFromDomainState: SyncExtractorRunner<
  ExtractorForSingleObjectList,
  DomainState,
  DomainElementInstanceUuidIndexOrFailed
> = (
  domainState: DomainState,
  selectorParams: SyncExtractorRunnerParams<ExtractorForSingleObjectList, DomainState>
): DomainElementInstanceUuidIndexOrFailed => {
  const deploymentUuid = selectorParams.extractor.deploymentUuid;
  const applicationSection = selectorParams.extractor.select.applicationSection ?? "data";

  const entityUuid: Uuid = selectorParams.extractor.select.parentUuid;
  // const entityUuid: DomainElement = resolveContextReference(
  //   selectorParams.extractor.select.parentUuid,
  //   selectorParams.extractor.queryParams,
  //   selectorParams.extractor.contextResults
  // );

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
  // switch (entityUuid.elementType) {
  //   case "string":
  //   case "instanceUuid": {
      if (!domainState[deploymentUuid][applicationSection][entityUuid]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuid,
          },
        };
      }

      return {
        elementType: "instanceUuidIndex",
        elementValue: domainState[deploymentUuid][applicationSection][entityUuid],
      };
  //     break;
  //   }
  //   case "object":
  //   case "instance":
  //   case "instanceUuidIndex":
  //   case "instanceUuidIndexUuidIndex":
  //   case "array": {
  //     return {
  //       elementType: "failure",
  //       elementValue: {
  //         queryFailure: "IncorrectParameters",
  //         queryContext:
  //           "selectEntityInstanceUuidIndexFromDomainStateForTemplate could not handle reference" + JSON.stringify(entityUuid),
  //         queryReference: JSON.stringify(selectorParams.extractorTemplate.select.parentUuid),
  //       },
  //     };
  //   }
  //   case "failure": {
  //     return entityUuid;
  //     break;
  //   }
  //   default: {
  //     throw new Error(
  //       "selectEntityInstanceUuidIndexFromDomainStateForTemplate could not handle reference entityUuid=" + entityUuid
  //     );
  //     break;
  //   }
  // }
};

// ################################################################################################
// ACCESSES DOMAIN STATE
/**
 * returns an Entity Instance (Object) from and selectObjectByParameterValue
 * @param domainState
 * @param selectorParams
 * @returns
 */
export const selectEntityInstanceFromObjectQueryAndDomainState: SyncExtractorRunner<
  ExtractorForSingleObject,
  DomainState,
  DomainElementEntityInstanceOrFailed
> = (
  domainState: DomainState,
  selectorParams: SyncExtractorRunnerParams<ExtractorForSingleObject, DomainState>
): DomainElementEntityInstanceOrFailed => {
  const querySelectorParams: QuerySelectObject = selectorParams.extractor.select as QuerySelectObject;
  const deploymentUuid = selectorParams.extractor.deploymentUuid;
  const applicationSection: ApplicationSection =
    selectorParams.extractor.select.applicationSection ??
    ((selectorParams.extractor.pageParams?.applicationSection ?? "data") as ApplicationSection);

  log.info(
    "selectEntityInstanceFromObjectQueryAndDomainStateForTemplate params",
    querySelectorParams,
    "deploymentUuid",
    deploymentUuid,
    "applicationSection",
    applicationSection
  );
  const entityUuidReference: Uuid = querySelectorParams.parentUuid;
  // const entityUuidReference: DomainElement = resolveContextReference(
  //   querySelectorParams.parentUuid,
  //   selectorParams.extractorTemplate.queryParams,
  //   selectorParams.extractorTemplate.contextResults
  // );
  log.info("selectEntityInstanceFromObjectQueryAndDomainStateForTemplate entityUuidReference", entityUuidReference);

  // if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
  //   return {
  //     elementType: "failure",
  //     elementValue: {
  //       queryFailure: "IncorrectParameters",
  //       queryContext:
  //         "selectEntityInstanceFromObjectQueryAndDomainStateForTemplate wrong entityUuidReference=" +
  //         JSON.stringify(entityUuidReference),
  //       queryReference: JSON.stringify(querySelectorParams.parentUuid),
  //     },
  //   };
  // }

  switch (querySelectorParams?.queryType) {
    case "selectObjectByRelation": {
      // const referenceObject = resolveContextReference(
      const referenceObject = resolveContextReference(
        { queryTemplateType: "queryContextReference", referenceName: querySelectorParams.objectReference},
        selectorParams.extractor.queryParams,
        selectorParams.extractor.contextResults
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
            queryParameters: JSON.stringify(selectorParams.extractor.pageParams),
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
      if (!domainState[deploymentUuid][applicationSection][entityUuidReference]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference,
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
          domainState[deploymentUuid][applicationSection][entityUuidReference][
            (referenceObject.elementValue as any)[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
          ],
      };
      break;
    }
    case "selectObjectByDirectReference": {
      const instanceUuidDomainElement = querySelectorParams.instanceUuid;
      // const instanceUuidDomainElement = resolveContextReference(
      //   querySelectorParams.instanceUuid,
      //   selectorParams.extractorTemplate.queryParams,
      //   selectorParams.extractorTemplate.contextResults
      // );

      log.info(
        "selectEntityInstanceFromObjectQueryAndDomainStateForTemplate found instanceUuid",
        JSON.stringify(instanceUuidDomainElement)
      );

      // if (instanceUuidDomainElement == "instance") {
      //   return instanceUuidDomainElement; /* QueryResults, elementType == "failure" */
      // }
      // if (
      //   instanceUuidDomainElement != "string" &&
      //   instanceUuidDomainElement != "instanceUuid"
      // ) {
      //   return {
      //     elementType: "failure",
      //     elementValue: {
      //       queryFailure: "EntityNotFound",
      //       deploymentUuid,
      //       applicationSection,
      //       entityUuid: entityUuidReference.elementValue,
      //       instanceUuid: instanceUuidDomainElement.elementValue,
      //     },
      //   };
      // }
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
      if (!domainState[deploymentUuid][applicationSection][entityUuidReference]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference,
          },
        };
      }
      if (
        !domainState[deploymentUuid][applicationSection][entityUuidReference][
          instanceUuidDomainElement
        ]
      ) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "InstanceNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference,
            instanceUuid: instanceUuidDomainElement,
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
          domainState[deploymentUuid][applicationSection][entityUuidReference][
            instanceUuidDomainElement
          ],
      };
      break;
    }
    default: {
      throw new Error(
        "selectEntityInstanceFromObjectQueryAndDomainStateForTemplate can not handle QueryTemplateSelectObject query with queryType=" +
          selectorParams.extractor.select.queryType
      );
      break;
    }
  }
};

// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param domainState
 * @param selectorParams
 * @returns
 */
export const exractEntityInstanceListFromListQueryAndDomainState: SyncExtractorRunner<
  ExtractorForSingleObjectList,
  DomainState,
  DomainElementInstanceUuidIndexOrFailed
> = extractEntityInstanceUuidIndexWithObjectListExtractorInMemory<DomainState>;

// ################################################################################################
export const innerSelectElementFromQueryAndDomainState = innerSelectElementFromQuery<DomainState>;

// ################################################################################################
export const extractWithManyExtractorsFromDomainState: SyncExtractorRunner<
  ExtractorForRecordOfExtractors,
  DomainState,
  DomainElementObject
> = extractWithManyExtractors<DomainState>;

// ################################################################################################
export const extractWithExtractorFromDomainState: SyncExtractorRunner<
  ExtractorForDomainModelObjects | ExtractorForRecordOfExtractors,
  DomainState,
  DomainElement
> = extractWithExtractor<DomainState>;

// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ################################################################################################
export const selectJzodSchemaBySingleSelectQueryFromDomainStateNew = extractzodSchemaForSingleSelectQuery<DomainState>;

// ################################################################################################
// ACCESSES DOMAIN STATE
export const selectEntityJzodSchemaFromDomainStateNew = (
  domainState: DomainState,
  selectorParams: ExtractorRunnerParamsForJzodSchema<DomainModelGetEntityDefinitionExtractor, DomainState>
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
/**
 * the runtimeTransformers and FetchQueryJzodSchema should depend only on the instance of Report at hand
 * then on the instance of the required entities (which can change over time, on refresh!! Problem: their number can vary!!)
 * @param domainState
 * @param query
 * @returns
 */
export const selectFetchQueryJzodSchemaFromDomainStateNew = extractFetchQueryJzodSchema<DomainState>;

// ################################################################################################
export const selectJzodSchemaByDomainModelQueryFromDomainStateNew = extractJzodSchemaForDomainModelQuery<DomainState>;

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// DEPENDENT ON RESELECT / REDUX. TO MOVE TO miroir-localCache-redux!
// ################################################################################################

export function getSelectorMap(): SyncExtractorRunnerMap<DomainState> {
  return {
    extractorType: "sync",
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDomainState,
    extractEntityInstance: selectEntityInstanceFromObjectQueryAndDomainState,
    extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: exractEntityInstanceListFromListQueryAndDomainState,
    extractWithManyExtractors: extractWithManyExtractorsFromDomainState,
    extractWithExtractor: extractWithExtractor,
  };
}

export function getJzodSchemaSelectorMap(): ExtractorRunnerMapForJzodSchema<DomainState> {
  return {
    extractJzodSchemaForDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDomainStateNew,
    extractEntityJzodSchema: selectEntityJzodSchemaFromDomainStateNew,
    extractFetchQueryJzodSchema: selectFetchQueryJzodSchemaFromDomainStateNew,
    extractzodSchemaForSingleSelectQuery: selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  };
}

// ################################################################################################
export function getSelectorParams<ExtractorType extends ExtractorForDomainModel>(
  query: ExtractorType,
  extractorRunnerMap?: SyncExtractorRunnerMap<DomainState>
): SyncExtractorRunnerParams<ExtractorType, DomainState> {
  return {
    extractor: query,
    extractorRunnerMap: extractorRunnerMap ?? getSelectorMap(),
  };
}
