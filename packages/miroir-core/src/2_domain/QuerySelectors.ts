// ################################################################################################

import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  BoxedExtractorOrCombinerReturningObjectList,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  CombinerManyToMany,
  CombinerOneToMany,
  DomainElement,
  DomainElementFailed,
  DomainElementSuccess,
  EntityInstance,
  EntityInstancesUuidIndex,
  ExtractorOrCombiner,
  ExtractorOrCombinerContextReference,
  QueryFailed,
  RunBoxedQueryAction,
  CoreTransformerForBuildPlusRuntime
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import {
  Action2Error,
  Action2ReturnType,
  Domain2ElementFailed,
  Domain2QueryReturnType,
} from "../0_interfaces/2_domain/DomainElement";
import {
  AsyncBoxedExtractorOrQueryRunnerMap,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncBoxedExtractorRunner,
  SyncBoxedExtractorRunnerParams,
  SyncQueryRunnerExtractorAndParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import { getForeignKeyValue, instanceMatchesForeignKey } from "../1_core/EntityPrimaryKey";
import { defaultMiroirModelEnvironment, getApplicationSection } from "../1_core/Model";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { applyExtractorFilterAndOrderBy, instanceMatchesFilter } from "./ExtractorByEntityReturningObjectListTools";
import { resolveExtractorTemplate } from "./Templates";
import { applyTransformer, transformer_extended_apply, transformer_extended_apply_wrapper } from "./TransformersForRuntime";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "QuerySelectors")
).then((logger: LoggerInterface) => {log = logger});


const emptySelectorMap:SyncBoxedExtractorOrQueryRunnerMap<any> = {
  extractorOrCombinerType: "sync",
  extractState: (state: any, params: any) => state,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: undefined as any, 
  runQuery: undefined as any, 
  extractEntityInstance: undefined as any,
  extractEntityInstanceUuidIndexWithObjectListExtractor: undefined as any,
  extractEntityInstanceUuidIndex: undefined as any,
  extractEntityInstanceListWithObjectListExtractor: undefined as any,
  extractEntityInstanceList: undefined as any,
  // ##############################################################################################
  runQueryTemplateWithExtractorCombinerTransformer: undefined as any,
}

const emptyAsyncSelectorMap:AsyncBoxedExtractorOrQueryRunnerMap = {
  extractorOrCombinerType: "async",
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: undefined as any, 
  runQuery: undefined as any, 
  extractEntityInstance: undefined as any,
  extractEntityInstanceUuidIndexWithObjectListExtractor: undefined as any,
  extractEntityInstanceUuidIndex: undefined as any,
  extractEntityInstanceListWithObjectListExtractor: undefined as any,
  extractEntityInstanceList: undefined as any,
  applyExtractorTransformer: undefined as any,
  // ##############################################################################################
  runQueryTemplateWithExtractorCombinerTransformer: undefined as any,
}

// ################################################################################################
export function domainElementToPlainObjectDEFUNCT(r:DomainElement): any {
  if (r) {
    switch (typeof r) {
      case "string":
      case "number":
      case "bigint":
      case "undefined":
      case "boolean": {
        return r;
      }
      case "object": {
        if (r && r.elementType) {
          switch (r.elementType) {
            case "instanceArray":
            case "string":
            case "instanceUuid":
            case "instanceUuidIndex":
            case "instance": {
              return r.elementValue
            }
            case "object": {
              return Object.fromEntries(Object.entries(r.elementValue).map(e => [e[0], domainElementToPlainObjectDEFUNCT(e[1])]))
            }
            case "array": {
              return r.elementValue.map(e => domainElementToPlainObjectDEFUNCT(e))
            }
            case "failure": {
              return undefined
              break;
            }
            default: {
              throw new Error("could not handle Results from query: " + JSON.stringify(r,undefined,2));
              break;
            }
          }
        } else {
          return Object.fromEntries(Object.entries(r).map(e => [e[0], domainElementToPlainObjectDEFUNCT(e[1] as any)]))
        }
      }
      case "symbol":
      case "function": 
      default: {
        throw new Error("could not convert domainElement with type: "+ typeof r + " definition: " + JSON.stringify(r,undefined,2));
        break;
      }
    }
  } else {
    return undefined;
  }
}

// ################################################################################################
export function plainObjectToDomainElementDEFUNCT(r:any): DomainElement {
  switch (typeof r) {
    case "string": {
      return {elementType: "string", elementValue: r}
    }
    case "number": 
    case "boolean":
    case "bigint":
      {
        return {elementType: "string", elementValue: r.toString()}
      }
    case "symbol": {
      throw new Error("plainObjectToDomainElementDEFUNCT could not convert symbol: " + JSON.stringify(r,undefined,2));
    }
    case "undefined": {
      return {elementType: "void", elementValue: undefined}
      // throw new Error("plainObjectToDomainElementDEFUNCT could not convert undefined: " + JSON.stringify(r,undefined,2));
    }
    case "function": {
      throw new Error("plainObjectToDomainElementDEFUNCT could not convert function: " + JSON.stringify(r,undefined,2));
      // return {elementType: "string", elementValue: r}
    }
    case "object": {
      if (Array.isArray(r)) {
        return {elementType: "array", elementValue: r.map(e => plainObjectToDomainElementDEFUNCT(e))}
      } else {
        return {elementType: "object", elementValue: Object.fromEntries(Object.entries(r).map(e => [e[0], plainObjectToDomainElementDEFUNCT(e[1])]))}
      }
    }
    default: {
      throw new Error("plainObjectToDomainElementDEFUNCT could not convert object: " + JSON.stringify(r,undefined,2));
      break;
    }
  }
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export const applyExtractorForSingleObjectListToSelectedInstancesListInMemory = (
  selectedInstancesList: Domain2QueryReturnType<EntityInstance[]>,
  query: BoxedExtractorOrCombinerReturningObjectList,
): Domain2QueryReturnType<EntityInstance[]> => {
  if (selectedInstancesList instanceof Domain2ElementFailed) {
    return selectedInstancesList;
  }
  switch (query.select.extractorOrCombinerType) {
    case "extractorInstancesByEntity": {
      const localQuery = query.select;
      // Use centralized filter and orderBy implementation
      return applyExtractorFilterAndOrderBy(selectedInstancesList, localQuery);
    }
    case "combinerOneToMany": {
      const relationQuery: CombinerOneToMany = query.select;
      log.info(
        "applyExtractorForSingleObjectListToSelectedInstancesListInMemory combinerOneToMany",
        "query", JSON.stringify(query, undefined, 2),
        "selectedInstancesList",
        selectedInstancesList
      );

      const referenceObject =
        typeof relationQuery.objectReference === "string"
          ? (query.contextResults ?? {})[relationQuery.objectReference]
          : transformer_extended_apply(
              "runtime",
              [], // transformerPath
              (relationQuery.label ?? relationQuery.extractorOrCombinerType) + "_objectReference",
              relationQuery.objectReference,
              "value",
              defaultMiroirModelEnvironment, // queryParams. TODO: this is wrong, should be the actual modelEnvironment
              query.queryParams ?? {},
              query.contextResults ?? {}
            );
      ;
      let otherIndex:string | undefined = undefined
      if (referenceObject) {
        otherIndex = getForeignKeyValue(
          relationQuery.objectReferenceAttribute ?? "uuid",
          referenceObject ?? {}
        );
      } else {
        log.error(
          "applyExtractorForSingleObjectListToSelectedInstancesListInMemory combinerOneToMany could not find objectReference in contextResults, objectReference=",
          relationQuery.objectReference,
          "contextResults",
          query.contextResults
        );
      }

      const fkAttribute = relationQuery.AttributeOfListObjectToCompareToReferenceUuid ?? "dummy";
      const finalInstanceList = selectedInstancesList.filter((i: EntityInstance) => {
          if (otherIndex === undefined) return false;
          return instanceMatchesForeignKey(fkAttribute, i, otherIndex);
        }
      ) as EntityInstance[];

      log.info(
        "applyExtractorForSingleObjectListToSelectedInstancesListInMemory combinerOneToMany",
        "referenceObject", referenceObject,
        "otherIndex", otherIndex,
        "finalInstanceList", finalInstanceList
      );
      const transformedInstanceList = relationQuery.applyTransformer?finalInstanceList.map(e => transformer_extended_apply(
        "runtime",
        [], // transformerPath
        relationQuery.label??relationQuery.extractorOrCombinerType,
        relationQuery.applyTransformer,
        "value",
        defaultMiroirModelEnvironment, // queryParams. TODO: this is wrong, should be the actual modelEnvironment
        query.queryParams ?? {},
        {...query.contextResults, referenceObject, foreignKeyObject: e} // newFetchedData
      )):finalInstanceList;

      return transformedInstanceList;
    }
    case "combinerManyToMany": {
      const relationQuery: CombinerManyToMany = query.select;

      // relationQuery.objectListReference is a queryContextReference
      // log.info("applyExtractorForSingleObjectListToSelectedInstancesListInMemory combinerManyToMany selectedInstancesList", selectedInstancesList)
      let otherList: Record<string, any> | undefined = undefined
      otherList = (((query.contextResults ?? {})[
        relationQuery.objectListReference
      ]) ?? {});
      if (otherList) {
        const finalInstanceList = selectedInstancesList.filter(
          (selectedInstance: EntityInstance) => {
            const otherListAttribute = relationQuery.objectListReferenceAttribute ?? "uuid";
            const rootListAttribute =
              relationQuery.AttributeOfRootListObjectToCompareToListReferenceUuid ?? "uuid";

            if (typeof otherList == "object") {
              if (!Array.isArray(otherList)) {
                const result =
                  Object.values(otherList).findIndex(
                    (v: any) =>
                      v[otherListAttribute] == (selectedInstance as any)[rootListAttribute]
                  ) >= 0;
                return result;
              } else {
                const result =
                  otherList.findIndex(
                    (v: any) =>
                      v[otherListAttribute] == (selectedInstance as any)[rootListAttribute]
                  ) >= 0;
                return result;
              }
            } else {
              throw new Error(
                "applyExtractorForSingleObjectListToSelectedInstancesListInMemory combinerManyToMany can not use objectListReference, selectedInstances elementType=" +
                  selectedInstancesList +
                  " typeof otherList=" +
                  typeof otherList +
                  " other list=" +
                  JSON.stringify(otherList, undefined, 2)
              );
            }
          }
        ) as EntityInstance[];

        const transformedInstanceList = relationQuery.applyTransformer
          ? finalInstanceList.map((selectedInstance) => {
              let referenceObject: any = undefined;
              const otherListAttribute = relationQuery.objectListReferenceAttribute ?? "uuid";
              const rootListAttribute =
                relationQuery.AttributeOfRootListObjectToCompareToListReferenceUuid ?? "uuid";

              if (typeof otherList == "object") {
                if (!Array.isArray(otherList)) {
                  referenceObject = Object.values(otherList).find(
                    (v: any) =>
                      v[otherListAttribute] == (selectedInstance as any)[rootListAttribute]
                  );
                } else {
                  referenceObject = otherList.find(
                    (v: any) =>
                      v[otherListAttribute] == (selectedInstance as any)[rootListAttribute]
                  );
                }
              }

              return transformer_extended_apply(
                "runtime",
                [], // transformerPath
                relationQuery.label ?? relationQuery.extractorOrCombinerType,
                relationQuery.applyTransformer,
                "value",
                defaultMiroirModelEnvironment, // queryParams. TODO: this is wrong, should be the actual modelEnvironment
                query.queryParams ?? {},
                { ...query.contextResults, referenceObject, foreignKeyObject: selectedInstance } // newFetchedData
              );
            })
          : finalInstanceList;

        // log.info(
        //   "applyExtractorForSingleObjectListToSelectedInstancesListInMemory combinerManyToMany",
        //   "selectedInstancesList",
        //   selectedInstancesList,
        //   "otherList",
        //   otherList,
        //   "finalInstanceList",
        //   finalInstanceList,
        //   "transformedInstanceList",
        //   transformedInstanceList
        // );
        return transformedInstanceList;
      } else {
        throw new Error(
          "applyExtractorForSingleObjectListToSelectedInstancesListInMemory combinerManyToMany could not find list for objectListReference, selectedInstances elementType=" +
            selectedInstancesList
        );
      }
    }
    default: {
      throw new Error(
        "applyExtractorForSingleObjectListToSelectedInstancesListInMemory could not handle query, foreignKeyParams=" +
          JSON.stringify(query.select, undefined, 2)
      );
      break;
    }
  }
};

// ################################################################################################
export const applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory = (
  selectedInstancesUuidIndex: Domain2QueryReturnType<EntityInstancesUuidIndex>,
  query: BoxedExtractorOrCombinerReturningObjectList,
): Domain2QueryReturnType<EntityInstancesUuidIndex> => {
  switch (query.select.extractorOrCombinerType) {
    case "extractorInstancesByEntity": {
      const localQuery = query.select;
      // log.info(
      //   "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory filter",
      //   JSON.stringify(localQuery.filter)
      // );
      // CANNOT APPLY ORDER BY HERE, AS WE ARE WORKING ON AN INDEX
      if (localQuery.orderBy) {
        log.warn(
          "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory orderBy not implemented for instanceUuidIndex, query=",
          JSON.stringify(query, undefined, 2)
        )
      }
      // Use centralized filter implementation via instanceMatchesFilter
      const result: Domain2QueryReturnType<EntityInstancesUuidIndex> = localQuery.filter
        ? Object.fromEntries(
            Object.entries(selectedInstancesUuidIndex).filter((i: [string, EntityInstance]) => {
              return instanceMatchesFilter(i[1], localQuery.filter!);
            })
          )
        : selectedInstancesUuidIndex;
      ;
      // log.info(
      //   "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory  result",
      //   JSON.stringify(result, undefined, 2)
      // );
      return result;
      break;
    }
    case "combinerOneToMany": {
      const relationQuery: CombinerOneToMany = query.select;

      let otherIndex:string | undefined = undefined
      if (
        ((query.contextResults ?? {})[relationQuery.objectReference])
      ) {
        otherIndex = getForeignKeyValue(
          relationQuery.objectReferenceAttribute ?? "uuid",
          (((query.contextResults ?? {})[relationQuery.objectReference]) as any) ?? {}
        );
      } else {
        log.error(
          "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerOneToMany could not find objectReference in contextResults, objectReference=",
          relationQuery.objectReference,
          "contextResults",
          query.contextResults
        );
      }

      // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerOneToMany", JSON.stringify(selectedInstances))
      // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerOneToMany", selectedInstances)
      // CAN NOT APPLY FILTER HERE, AS WE ARE WORKING ON AN INDEX
      if (relationQuery.orderBy) {
        log.warn(
          "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory orderBy not implemented for instanceUuidIndex, query=",
          JSON.stringify(query, undefined, 2)
        )
      }
      const fkAttribute2 = relationQuery.AttributeOfListObjectToCompareToReferenceUuid ?? "dummy";
      return Object.fromEntries(
        Object.entries(selectedInstancesUuidIndex ?? {}).filter(
          (i: [string, EntityInstance]) => {
            if (otherIndex === undefined) return false;
            return instanceMatchesForeignKey(fkAttribute2, i[1], otherIndex);
          }
        )
      );

    }
    case "combinerManyToMany": {
      const relationQuery: CombinerManyToMany = query.select;

      // relationQuery.objectListReference is a queryContextReference
      // log.info("applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerManyToMany", selectedInstancesUuidIndex)
      let otherList: Record<string, any> | undefined = undefined
      otherList = (((query.contextResults ?? {})[
        relationQuery.objectListReference
      ]) ?? {});
      if (otherList) {
        const filteredEntries = Object.entries(selectedInstancesUuidIndex ?? {}).filter(
          (selectedInstancesEntry: [string, EntityInstance]) => {
            const otherListAttribute = relationQuery.objectListReferenceAttribute ?? "uuid";
            const rootListAttribute = relationQuery.AttributeOfRootListObjectToCompareToListReferenceUuid ?? "uuid";

            if (typeof otherList == "object" && !Array.isArray(otherList)) {
              // log.info(
              //   "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerManyToMany search otherList for attribute",
              //   otherListAttribute,
              //   "on object",
              //   selectedInstancesEntry[1],
              //   "uuidToFind",
              //   (selectedInstancesEntry[1] as any)[rootListAttribute],
              //   "otherList",
              //   otherList
              // );
              const result =
              Object.values(otherList).findIndex(
                (v: any) => v[otherListAttribute] == (selectedInstancesEntry[1] as any)[rootListAttribute]
              ) >= 0;
              // CAN NOT APPLY FILTER HERE, AS WE ARE WORKING ON AN INDEX
              return result;
            } else {
              throw new Error(
                "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerManyToMany can not use objectListReference, selectedInstances elementType=" +
                  selectedInstancesUuidIndex.elementType +
                  " typeof otherList=" +
                  typeof otherList +
                  " otherList is array " +
                  Array.isArray(otherList) +
                  " other list=" +
                  JSON.stringify(otherList, undefined, 2)
              );
            }
          }
        );

        if (relationQuery.applyTransformer) {
          const transformedEntries = filteredEntries.map(([uuid, selectedInstance]) => {
            let referenceObject: any = undefined;
            const otherListAttribute = relationQuery.objectListReferenceAttribute ?? "uuid";
            const rootListAttribute = relationQuery.AttributeOfRootListObjectToCompareToListReferenceUuid ?? "uuid";
            
            if (typeof otherList == "object" && !Array.isArray(otherList)) {
              referenceObject = Object.values(otherList).find(
                (v: any) => v[otherListAttribute] == (selectedInstance as any)[rootListAttribute]
              );
            }

            const transformedResult = transformer_extended_apply(
              "runtime",
              [], // transformerPath
              relationQuery.label ?? relationQuery.extractorOrCombinerType,
              relationQuery.applyTransformer,
              "value",
              defaultMiroirModelEnvironment, // queryParams. TODO: this is wrong, should be the actual modelEnvironment
              query.queryParams ?? {},
              {...query.contextResults, referenceObject, foreignKeyObject: selectedInstance} // newFetchedData
            );

            return [uuid, transformedResult];
          });
          
          return Object.fromEntries(transformedEntries);
        } else {
          return Object.fromEntries(filteredEntries);
        }
      } else {
        throw new Error(
          "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory combinerManyToMany could not find list for objectListReference, selectedInstances elementType=" +
            selectedInstancesUuidIndex.elementType
        );
      }
    }
    default: {
      throw new Error(
        "applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory could not handle query, foreignKeyParams=" +
          JSON.stringify(query.select, undefined, 2)
      );
      break;
    }
  }
};

// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param deploymentEntityState 
 * @param foreignKeyParams 
 * @returns 
 */
export const extractEntityInstanceUuidIndexWithObjectListExtractorInMemory
= <StateType>(
  deploymentEntityState: StateType,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: SyncBoxedExtractorRunnerParams<
  BoxedExtractorOrCombinerReturningObjectList, 
    StateType
  >,
  modelEnvironment: MiroirModelEnvironment,
): Domain2QueryReturnType<EntityInstancesUuidIndex> => {
  const selectedInstancesUuidIndex: Domain2QueryReturnType<EntityInstancesUuidIndex> = (
    foreignKeyParams?.extractorRunnerMap ?? emptySelectorMap
  ).extractEntityInstanceUuidIndex(deploymentEntityState, applicationDeploymentMap, foreignKeyParams, modelEnvironment);

  // log.info(
  //   "extractEntityInstanceUuidIndexWithObjectListExtractorInMemory found selectedInstances", selectedInstancesUuidIndex
  // );

  return applyExtractorForSingleObjectListToSelectedInstancesUuidIndexInMemory(
    selectedInstancesUuidIndex,
    foreignKeyParams.extractor,
  );

};
// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param deploymentEntityState 
 * @param foreignKeyParams 
 * @returns 
 */
export const extractEntityInstanceListWithObjectListExtractorInMemory
= <StateType>(
  deploymentEntityState: StateType,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: SyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList, StateType>,
  modelEnvironment: MiroirModelEnvironment,
): Domain2QueryReturnType<EntityInstance[]> => {
  const selectedInstancesUuidIndex: Domain2QueryReturnType<EntityInstance[]> = (
    foreignKeyParams?.extractorRunnerMap ?? emptySelectorMap
  ).extractEntityInstanceList(
    deploymentEntityState,
    applicationDeploymentMap,
    foreignKeyParams,
    modelEnvironment
  );

  // log.trace(
  //   "extractEntityInstanceUuidIndexWithObjectListExtractorInMemory for",
  //   foreignKeyParams,
  //   "found selectedInstances", selectedInstancesUuidIndex,
  // );

  return applyExtractorForSingleObjectListToSelectedInstancesListInMemory(
    selectedInstancesUuidIndex,
    foreignKeyParams.extractor,
  );

};

// ################################################################################################
export const applyExtractorTransformerInMemory = (
  actionRuntimeTransformer: CoreTransformerForBuildPlusRuntime,
  // queryParams: Record<string, any>,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  newFetchedData: Record<string, any>
// ): Domain2QueryReturnType<DomainElementSuccess> => {
): Domain2QueryReturnType<any> => {
  log.info("applyExtractorTransformerInMemory  query", JSON.stringify(actionRuntimeTransformer, null, 2));
  return transformer_extended_apply_wrapper(
    undefined, // activityTracker
    "runtime",
    [],
    "ROOT" /**WHAT?? */,
    actionRuntimeTransformer,
    modelEnvironment,
    queryParams,
    newFetchedData
  );
};


// ################################################################################################
export async function handleBoxedQueryAction(
  origin: string,
  runBoxedQueryAction: RunBoxedQueryAction,
  applicationDeploymentMap: ApplicationDeploymentMap,
  selectorMap: AsyncBoxedExtractorOrQueryRunnerMap,
  modelEnvironment: MiroirModelEnvironment,
): Promise<Action2ReturnType> {
  log.info(
    "handleBoxedQueryAction for",
    origin,
    "start",
    "runBoxedQueryAction",
    JSON.stringify(runBoxedQueryAction, null, 2),
    // "applicationDeploymentMap",
    // JSON.stringify(applicationDeploymentMap, null, 2),

  );
  let queryResult: Domain2QueryReturnType<DomainElementSuccess>;
  queryResult = await selectorMap.runQuery(
    {
      extractor: runBoxedQueryAction.payload.query,
      extractorRunnerMap: selectorMap,
    },
    applicationDeploymentMap,
    modelEnvironment,
  );
  if (queryResult instanceof Domain2ElementFailed) {
    return new Action2Error(
      "FailedToGetInstances",
      JSON.stringify(queryResult)
    );
  } else {
    const result: Action2ReturnType = { status: "ok", returnedDomainElement: queryResult };
    log.info(
      "handleBoxedQueryAction for",
      origin,
      "runBoxedQueryAction",
      runBoxedQueryAction,
      "result",
      JSON.stringify(result, null, 2)
    );
    return result;
  }
}

// ################################################################################################
export function innerSelectDomainElementFromExtractorOrCombiner/*BoxedExtractorTemplateRunner*/ <
  StateType
>(
  state: StateType,
  context: Record<string, any>,
  pageParams: Record<string, any>,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  extractorRunnerMap: SyncBoxedExtractorOrQueryRunnerMap<StateType>,
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  deploymentUuid: Uuid | undefined,
  extractorOrCombiner: ExtractorOrCombiner
  // ): Domain2QueryReturnType<DomainElementSuccess> {
): Domain2QueryReturnType<any> {
  switch (extractorOrCombiner.extractorOrCombinerType) {
    case "literal": {
      return extractorOrCombiner.definition;
      break;
    }
    // ############################################################################################
    // Impure Monads
    case "extractorInstancesByEntity":
    case "combinerOneToMany":
    case "combinerManyToMany": {
      const applicationSection =
        extractorOrCombiner.applicationSection ??
        getApplicationSection(application, extractorOrCombiner.parentUuid);
      log.info(
        "innerSelectDomainElementFromExtractorOrCombiner for",
        "application", application,
        "applicationSection", applicationSection,
        "extractorOrCombiner", JSON.stringify(extractorOrCombiner, null, 2)
      );
      return extractorRunnerMap.extractEntityInstanceListWithObjectListExtractor(
        state,
        applicationDeploymentMap,
        {
          extractorRunnerMap,
          extractor: {
            queryType: "boxedExtractorOrCombinerReturningObjectList",
            application,
            // deploymentUuid: deploymentUuid,
            contextResults: context,
            pageParams: pageParams,
            queryParams,
            select: extractorOrCombiner.applicationSection
              ? extractorOrCombiner
              : {
                  ...extractorOrCombiner,
                  applicationSection: applicationSection,
                },
          },
        },
        modelEnvironment,// queryParams // modelEnvironment
      );
      break;
    }
    case "combinerOneToOne":
    case "extractorByPrimaryKey": {
      return extractorRunnerMap.extractEntityInstance(
        state,
        applicationDeploymentMap,
        {
          extractorRunnerMap,
          extractor: {
            queryType: "boxedExtractorOrCombinerReturningObject",
            application,
            // applicationDeploymentMap,
            // deploymentUuid,
            contextResults: context,
            pageParams,
            queryParams,
            select: extractorOrCombiner.applicationSection // TODO: UGLY!!! WHERE IS THE APPLICATION SECTION PLACED?
              ? extractorOrCombiner
              : {
                  ...extractorOrCombiner,
                  // applicationSection: pageParams?.applicationSection ?? defaultApplicationSection as ApplicationSection,
                  applicationSection: getApplicationSection(application, extractorOrCombiner.parentUuid),
                },
          },
        },
        modelEnvironment,// queryParams, // modelEnvironment
      );
      break;
    }
    // ############################################################################################
    case "extractorWrapperReturningObject": {
      return Object.fromEntries(
        Object.entries(extractorOrCombiner.definition).map(
          (e: [string, ExtractorOrCombinerContextReference | ExtractorOrCombiner]) => [
            e[0],
            e[1].extractorOrCombinerType == "extractorOrCombinerContextReference"
              ? context[e[1].extractorOrCombinerContextReference] ?? {}
              : innerSelectDomainElementFromExtractorOrCombiner(
                  // recursive call
                  state,
                  context,
                  pageParams ?? {},
                  modelEnvironment,
                  queryParams ?? {},
                  extractorRunnerMap,
                  application,
                  applicationDeploymentMap,
                  deploymentUuid,
                  e[1]
                ), // TODO: check for error!
          ]
        )
      );
      break;
    }
    case "extractorWrapperReturningList": {
      return extractorOrCombiner.definition.map(
        (e) =>
          innerSelectDomainElementFromExtractorOrCombiner(
            // recursive call
            state,
            context,
            pageParams ?? {},
            modelEnvironment,
            queryParams ?? {},
            extractorRunnerMap,
            application,
            applicationDeploymentMap,
            deploymentUuid,
            e
          ) // TODO: check for error!
      );
      break;
    }
    case "combinerByHeteronomousManyToMany": {
      // join
      const rootQueryResults: Domain2QueryReturnType<any> =
        typeof extractorOrCombiner.rootExtractorOrReference == "string"
          ? innerSelectDomainElementFromExtractorOrCombiner(
              state,
              context,
              pageParams,
              modelEnvironment,
              queryParams,
              extractorRunnerMap,
              application,
              applicationDeploymentMap,
              deploymentUuid,
              {
                extractorOrCombinerType: "extractorOrCombinerContextReference",
                extractorOrCombinerContextReference: extractorOrCombiner.rootExtractorOrReference,
              }
            )
          : innerSelectDomainElementFromExtractorOrCombiner(
              state,
              context,
              pageParams,
              modelEnvironment,
              queryParams,
              extractorRunnerMap,
              application,
              applicationDeploymentMap,
              deploymentUuid,
              extractorOrCombiner.rootExtractorOrReference
            );
      if (rootQueryResults instanceof Domain2ElementFailed) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "IncorrectParameters",
            query: JSON.stringify(extractorOrCombiner.rootExtractorOrReference),
            queryContext:
              "innerSelectDomainElementFromExtractorOrCombiner for combinerByHeteronomousManyToMany, rootExtractorOrReference could not be resolved, rootExtractorOrReference=" +
              JSON.stringify(rootQueryResults, null, 2),
          },
        };
      }
      if (typeof rootQueryResults == "object") {
        const result: Domain2QueryReturnType<Record<string, any>> = Object.fromEntries(
          Object.entries(rootQueryResults).map((entry) => {
            const innerQueryParams = {
              ...queryParams,
              ...Object.fromEntries(
                Object.entries(
                  applyTransformer(
                    extractorOrCombiner.subQueryTemplate.rootQueryObjectTransformer,
                    entry[1]
                  )
                )
              ),
            };

            // TODO: faking context results here! Should we send empty contextResults instead?
            const resolvedQuery: ExtractorOrCombiner | QueryFailed = resolveExtractorTemplate(
              extractorOrCombiner.subQueryTemplate.query,
              modelEnvironment,
              innerQueryParams,
              innerQueryParams
            );

            if ("QueryFailure" in resolvedQuery) {
              return [
                (entry[1] as any).uuid ?? "no uuid found for entry " + entry[0],
                resolvedQuery,
              ];
            } else {
              // log.info(
              //   "innerSelectDomainElementFromExtractorOrCombiner for combinerByHeteronomousManyToMany resolvedQuery",
              //   JSON.stringify(resolvedQuery, null, 2)
              // );
            }
            const innerResult = innerSelectDomainElementFromExtractorOrCombiner(
              // recursive call
              state,
              context,
              pageParams,
              modelEnvironment,
              innerQueryParams,
              extractorRunnerMap,
              application,
              applicationDeploymentMap,
              deploymentUuid,
              resolvedQuery as ExtractorOrCombiner
            ); // TODO: check for error!
            return [(entry[1] as any).uuid ?? "no uuid found for entry " + entry[0], innerResult];
          })
        );
        return result;
      } else {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "IncorrectParameters",
            query: JSON.stringify(extractorOrCombiner.rootExtractorOrReference),
            queryContext:
              "innerSelectDomainElementFromExtractorOrCombiner for combinerByHeteronomousManyToMany, rootExtractorOrReference is not an object, rootExtractorOrReference=" +
              JSON.stringify(rootQueryResults, null, 2),
          },
        };
      }
      break;
    }
    case "extractorOrCombinerContextReference": {
      log.info(
        "innerSelectDomainElementFromExtractorOrCombiner queryContextReference",
        extractorOrCombiner,
        "newFetchedData",
        Object.keys(context),
        "result",
        context[extractorOrCombiner.extractorOrCombinerContextReference]
      );
      return context && context[extractorOrCombiner.extractorOrCombinerContextReference]
        ? context[extractorOrCombiner.extractorOrCombinerContextReference]
        : {
            elementType: "failure",
            elementValue: {
              queryFailure: "ReferenceNotFound",
              failureOrigin: ["QuerySelector", "innerSelectDomainElementFromExtractorOrCombiner"],
              queryContext:
                "innerSelectDomainElementFromExtractorOrCombiner could not find " +
                extractorOrCombiner.extractorOrCombinerContextReference +
                " in " +
                JSON.stringify(context),
              query: JSON.stringify(extractorOrCombiner),
            },
          };
      break;
    }
    default: {
      return {
        elementType: "failure",
        elementValue: {
          queryFailure: "QueryNotExecutable",
          query: JSON.stringify(extractorOrCombiner),
          failureMessage: "unsupported queryType for query: " + extractorOrCombiner,
        },
      } as DomainElementFailed;
      break;
    }
  }
}

// ################################################################################################
export type ExtractWithExtractorType<StateType> = SyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  StateType,
  // Domain2QueryReturnType<DomainElementSuccess>
  Domain2QueryReturnType<any>
>;
export const extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList /*: ExtractWithExtractorType*/ = <StateType>(
  state: StateType,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: SyncBoxedExtractorRunnerParams<
    BoxedExtractorOrCombinerReturningObjectOrObjectList,
    StateType
  >,
  modelEnvironment: MiroirModelEnvironment
): Domain2QueryReturnType<DomainElementSuccess> => {
  // log.info("########## extractExtractor begin, query", foreignKeyParams);
  const localSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<StateType> = foreignKeyParams?.extractorRunnerMap ?? emptySelectorMap;
  const deploymentUuid = applicationDeploymentMap[foreignKeyParams.extractor.application]?? "DEPLOYMENT_UUID_NOT_FOUND";
  const result = innerSelectDomainElementFromExtractorOrCombiner(
    state,
    foreignKeyParams.extractor.contextResults ?? {},
    foreignKeyParams.extractor.pageParams ?? {},
    modelEnvironment,
    foreignKeyParams.extractor.queryParams ?? {},
    localSelectorMap as any,
    foreignKeyParams.extractor.application,
    applicationDeploymentMap,
    deploymentUuid,
    foreignKeyParams.extractor.select
  );
  return result;

  // log.info(
  //   "extractExtractor",
  //   "query",
  //   foreignKeyParams,
  //   "domainState",
  //   deploymentEntityState,
  //   "newFetchedData",
  //   context
  // );
  // return result;
};

// ################################################################################################
/**
 * StateType is the type of the deploymentEntityState, which may be a ReduxDeploymentsState or a ReduxDeploymentsStateWithUuidIndex
 * 
 * 
 * @param extractorParams the array of basic extractor functions
 * @returns 
 */
export const runQuery = <StateType>(
  state: StateType,
  applicationDeploymentMap: ApplicationDeploymentMap,
  extractorParams: SyncQueryRunnerExtractorAndParams<StateType>,
  modelEnvironment: MiroirModelEnvironment,
): Domain2QueryReturnType<Record<string,any>> => { 

  // log.info("########## runQuery begin, query", foreignKeyParams);
  const context: Record<string, any> = {
    ...(extractorParams?.extractor?.contextResults ?? {})
  };
  const deploymentUuid = applicationDeploymentMap[extractorParams.extractor.application]?? "DEPLOYMENT_UUID_NOT_FOUND";
  // log.info("########## DomainSelector runQuery will use context", context);
  const localSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<StateType> =
    extractorParams?.extractorRunnerMap ?? emptySelectorMap;

  for (const extractor of Object.entries(
    extractorParams?.extractor?.extractors ?? {}
  )) {
    let result = innerSelectDomainElementFromExtractorOrCombiner(
      state,
      context,
      extractorParams.extractor.pageParams ?? {},
      modelEnvironment,
      {
        // ...modelEnvironment,
        ...extractorParams.extractor.pageParams ?? {},
        ...extractorParams.extractor.queryParams ?? {},
      },
      localSelectorMap as any,
      extractorParams.extractor.application,
      applicationDeploymentMap,
      deploymentUuid,
      extractor[1]
    );
    // TODO: test for error!
    if (result instanceof Domain2ElementFailed) {
      log.error(
        "runQuery failed for deployment",
        deploymentUuid,
        "extractor",
        extractor[0],
        "query",
        extractor[1],
        "result=",
        result
      );
      context[extractor[0]] = result;
      return new Domain2ElementFailed({
        queryFailure: "ReferenceNotFound",
        failureOrigin: ["QuerySelector", "runQuery"],
        queryContext:
          "runQuery could not run extractor: " + extractor[0] ,
        innerError: context[extractor[0]],
        query: JSON.stringify(extractor[1]),
      }
      );
    } else {
      context[extractor[0]] = result; // does side effect!
    }
  }
  // log.info(
  //   "runQuery done for extractors,",
  //   // extractor[0],
  //   // "query",
  //   // extractor[1],
  //   // "result=",
  //   // result,
  //   "context keys=",
  //   Object.keys(context)
  // );
  for (const combiner of Object.entries(
    extractorParams.extractor.combiners ?? {}
  )) {
    let result = innerSelectDomainElementFromExtractorOrCombiner(
      state,
      context,
      extractorParams.extractor.pageParams ?? {},
      modelEnvironment,
      {
        ...extractorParams.extractor.pageParams ?? {},
        ...extractorParams.extractor.queryParams ?? {},
      },
      localSelectorMap as any,
      extractorParams.extractor.application,
      applicationDeploymentMap,
      deploymentUuid,
      combiner[1]
    );
    context[combiner[0]] = result; // does side effect!
    // log.info("runQuery done for entry", combiner[0], "query", combiner[1], "result=", result);
  }
  // log.info(
  //   "runQuery done for combiners,",
  //   // extractor[0],
  //   // "query",
  //   // extractor[1],
  //   // "result=",
  //   // result,
  //   "context keys=",
  //   Object.keys(context)
  // );

  for (const transformerForBuildPlusRuntime of 
    Object.entries(
    extractorParams.extractor.runtimeTransformers ?? {}
  )) {
    let result = applyExtractorTransformerInMemory(
      transformerForBuildPlusRuntime[1],
      modelEnvironment,
      {
        ...extractorParams.extractor.pageParams ?? {},
        ...extractorParams.extractor.queryParams ?? {},
      },
      context
    );
    // if (result.elementType == "failure") {
    if (result instanceof Domain2ElementFailed) {
      log.error(
        "extractWithManyExtractor failed for transformer",
        transformerForBuildPlusRuntime[0],
        "query",
        transformerForBuildPlusRuntime[1],
        "result=",
        result
      );
      return ({})
      
    }
    context[transformerForBuildPlusRuntime[0]] = result; // does side effect!
  }

  // log.info(
  //   "runQuery",
  //   "query",
  //   foreignKeyParams,
  //   "domainState",
  //   deploymentEntityState,
  //   "newFetchedData",
  //   context
  // );
  // return { elementType: "object", elementValue: context};
  return context;
};
