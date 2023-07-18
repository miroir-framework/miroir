import { JzodAttribute } from "@miroir-framework/jzod";
import { EntityInstance } from "../0_interfaces/1_core/Instance";
import { ReportSectionListDefinition } from "../0_interfaces/1_core/Report";
import { DomainStateSelector, EntitiesDomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import { DomainInstanceUuidIndexToArray } from "../1_core/DomainState";

export function selectReportSectionInstances(reportSectionListDefinition:ReportSectionListDefinition):DomainStateSelector{
  return (domainState:EntitiesDomainState):EntityInstance[] => {
    // console.log('selectReportSectionInstances', reportUuid, domainState)
    // const currentReport: Report = DomainInstanceUuidIndexToArray(domainState[entityReport.uuid])?.find(e=>e['uuid'] === reportSectionListDefinition.parentUuid) as Report;
    if (reportSectionListDefinition && reportSectionListDefinition.parentUuid) {
      return DomainInstanceUuidIndexToArray(domainState[reportSectionListDefinition.parentUuid]);
    } else {
      return []
    }
  }
}

// export function selectDeploymentReportInstances(deploymentUuid:string, reportUuid:string):DomainStateSelector{
//   return (domainState:EntitiesDomainState):EntityInstance[] => {
//     // console.log('selectReportSectionInstances', reportName, currentReport, domainState[currentReport.definition.parentName])
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

export function selectEntityInstancesFromJzodAttribute(jzodSchema:JzodAttribute | undefined):DomainStateSelector{
  return (domainState:EntitiesDomainState):EntityInstance[] => {
    // console.log('selectEntityInstances for entityUuid', parentUuid, 'existing entities:', Object.keys(domainState))
    if (jzodSchema?.extra?.targetEntity && domainState[jzodSchema?.extra?.targetEntity]) {
      // console.log('selectEntityInstances for entityUuid', parentUuid, 'existing instances:', Object.keys(domainState[parentUuid]))
      return DomainInstanceUuidIndexToArray(domainState[jzodSchema?.extra?.targetEntity]);
    } else {
      return [];
    }
  }
}