// 

import { DomainState, EntityInstancesUuidIndex } from "../0_interfaces/2_domain/DomainControllerInterface";
import { DomainEntityInstancesSelectorParams, EntityInstanceListQueryParams, MiroirSelectorParams } from "../0_interfaces/2_domain/DomainSelectorInterface";

// ################################################################################################
export const selectEntityInstanceUuidIndexFromDomainState = (
  domainState: DomainState,
  // params: DomainEntityInstancesSelectorParams
  params: MiroirSelectorParams
): EntityInstancesUuidIndex | undefined => {

  const localCacheSelectorParams = params.type == "DomainEntityInstancesSelectorParams"?params.definition:params.definition.localCacheSelectorParams;

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

// // ################################################################################################
// export const selectRelatedEntityInstancesUuidIndexFromDomainState = (
//   domainState: DomainState,
//   params: EntityInstanceListQueryParams
// ): EntityInstancesUuidIndex | undefined => {

//   const instances = selectEntityInstanceUuidIndexFromDomainState(domainState,params.)
//   const result = 
//     params.deploymentUuid &&
//     params.applicationSection &&
//     params.entityUuid &&
//     domainState[params.deploymentUuid][params.applicationSection][params.entityUuid]
//       ? (domainState[params.deploymentUuid][params.applicationSection][params.entityUuid] as EntityInstancesUuidIndex)
//       : undefined;
//   // console.log('selectEntityInstanceUuidIndexFromLocalCache','params',params,'localEntityIndex',localEntityIndex,'state',state,'result',result);
//   return result;
// };
