// 

import { EntityInstance } from "../0_interfaces/1_core/Instance";
import { DomainState, EntityInstancesUuidIndex } from "../0_interfaces/2_domain/DomainControllerInterface";
import { DomainEntityInstancesSelectorParams, EntityInstanceListQueryParams, MiroirSelectorParams } from "../0_interfaces/2_domain/DomainSelectorInterface";

// ################################################################################################
export const selectEntityInstanceUuidIndexFromDomainState = (
  domainState: DomainState,
  // params: DomainEntityInstancesSelectorParams
  params: MiroirSelectorParams
): EntityInstancesUuidIndex | undefined => {

  const localCacheSelectorParams =
    params.type == "DomainEntityInstancesSelectorParams"
      ? params.definition
      : params.type == "EntityInstanceListQueryParams"
      ? params.definition.localCacheSelectorParams
      : undefined;

  const result = 
    localCacheSelectorParams &&
    localCacheSelectorParams.deploymentUuid &&
    localCacheSelectorParams.applicationSection &&
    localCacheSelectorParams.entityUuid &&
    domainState[localCacheSelectorParams.deploymentUuid][localCacheSelectorParams.applicationSection][localCacheSelectorParams.entityUuid]
      ? (domainState[localCacheSelectorParams.deploymentUuid][localCacheSelectorParams.applicationSection][localCacheSelectorParams.entityUuid] as EntityInstancesUuidIndex)
      : undefined;
  console.log('selectEntityInstanceUuidIndexFromLocalCache','params',params,'domainState',domainState,'result',result);
  return result;
};

// ################################################################################################
export const selectRelatedEntityInstancesUuidIndexFromDomainState = (
  domainState: DomainState,
  selectorParams: MiroirSelectorParams
): EntityInstancesUuidIndex | undefined => {

  if (selectorParams.type == "EntityInstanceListQueryParams") {
    const selectedInstances = selectEntityInstanceUuidIndexFromDomainState(domainState,selectorParams)
    const result = Object.fromEntries(
      Object.entries(selectedInstances ?? {}).filter(
        (i: [string, EntityInstance]) =>
          (i[1] as any)[
            selectorParams.type == "EntityInstanceListQueryParams"
              ? selectorParams.definition.query?.rootObjectAttribute ?? "dummy"
              : "dummy"
          ] === (selectorParams.type == "EntityInstanceListQueryParams"?selectorParams.definition.query?.rootObjectUuid:undefined)
      )
    );
    console.log('selectRelatedEntityInstancesUuidIndexFromDomainState','selectorParams',selectorParams,'selectedInstances',selectedInstances,'domainState',domainState,'result',result);
    return result;
      
  } else {
    return {}
  }
  // const localCacheSelectorParams = params.type == "DomainEntityInstancesSelectorParams"?params.definition:params.definition.localCacheSelectorParams;

};

// ################################################################################################
export const selectEntityInstanceFromDomainState = (
  domainState: DomainState,
  params: MiroirSelectorParams
): EntityInstance | undefined => {

  const localCacheSelectorParams =
    params.type == "EntityInstanceQueryParams"
      ? params.definition.localCacheSelectorParams
      : undefined;

  const result = 
    localCacheSelectorParams &&
    localCacheSelectorParams.deploymentUuid &&
    localCacheSelectorParams.applicationSection &&
    localCacheSelectorParams.entityUuid &&
    localCacheSelectorParams.instanceUuid &&
    domainState[localCacheSelectorParams.deploymentUuid][localCacheSelectorParams.applicationSection][localCacheSelectorParams.entityUuid][localCacheSelectorParams.instanceUuid]
      ? (domainState[localCacheSelectorParams.deploymentUuid][localCacheSelectorParams.applicationSection][localCacheSelectorParams.entityUuid][localCacheSelectorParams.instanceUuid] as EntityInstance)
      : undefined;
  console.log('selectEntityInstanceFromDomainState entityUuid',localCacheSelectorParams?.entityUuid, 'params',params,'domainState',domainState,'result',result);
  return result;
};
