import { EntityInstance } from "../0_interfaces/1_core/Instance";
import { Report } from "../0_interfaces/1_core/Report";
import { EntitiesDomainState, DomainStateSelector } from "../0_interfaces/2_domain/DomainControllerInterface";
import { DomainInstanceUuidIndexToArray } from "../1_core/DomainState";
import entityReport  from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json";

export function selectReportInstances(reportUuid:string):DomainStateSelector{
  return (domainState:EntitiesDomainState):EntityInstance[] => {
    // console.log('selectReportInstances', reportUuid, domainState)
    const currentReport: Report = DomainInstanceUuidIndexToArray(domainState[entityReport.uuid])?.find(e=>e['uuid'] === reportUuid) as Report;
    if (currentReport && currentReport.definition) {
      return currentReport?.definition?.parentName?DomainInstanceUuidIndexToArray(domainState[currentReport.definition.parentUuid]):[];
    } else {
      return []
    }
  }
}

// export function selectDeploymentReportInstances(deploymentUuid:string, reportUuid:string):DomainStateSelector{
//   return (domainState:EntitiesDomainState):EntityInstance[] => {
//     // console.log('selectReportInstances', reportName, currentReport, domainState[currentReport.definition.parentName])
//     // const currentReport: Report = DomainInstanceUuidIndexToArray(domainState[entityDefinitionReport.uuid])?.find(e=>e['uuid'] === reportUuid) as Report;
//     const currentReport: Report = DomainInstanceUuidIndexToArray(domainState[entityReport.uuid])?.find(e=>e['uuid'] === reportUuid) as Report;
//     return currentReport?.definition?.parentName?DomainInstanceUuidIndexToArray(domainState[currentReport.definition.parentUuid]):[];
//   }
// }

// export function selectEntityInstances(deploymentUuid:string,parentUuid:string):DomainStateSelector{
export function selectEntityInstances(parentUuid:string | undefined):DomainStateSelector{
  return (domainState:EntitiesDomainState):EntityInstance[] => {
    // console.log('selectEntityInstances for entityUuid', parentUuid, 'existing entities:', Object.keys(domainState))
    if (parentUuid && domainState[parentUuid]) {
      // console.log('selectEntityInstances for entityUuid', parentUuid, 'existing instances:', Object.keys(domainState[parentUuid]))
      return DomainInstanceUuidIndexToArray(domainState[parentUuid]);
    } else {
      return [];
    }
  }
}