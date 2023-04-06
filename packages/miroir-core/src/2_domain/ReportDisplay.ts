import { DomainInstanceUuidIndexToArray } from "../1_core/DomainState";
import { EntityInstance } from "../0_interfaces/1_core/Instance";
import { MiroirReport } from "../0_interfaces/1_core/Report";
import { DomainState, DomainStateSelector } from "../0_interfaces/2_domain/DomainControllerInterface";
import entityDefinitionReport from "../assets/entityDefinitions/EntityDefinitionReport.json";

// export function selectReportInstances(reportName:string):DomainStateSelector{
export function selectReportInstances(reportUuid:string):DomainStateSelector{
  return (domainState:DomainState):EntityInstance[] => {
    // console.log('selectReportInstances', reportName, currentReport, domainState[currentReport.definition.parentName])
    // const currentReport: MiroirReport = DomainInstanceUuidIndexToArray(domainState['Report'])?.find(e=>e['name'] === reportName) as MiroirReport;
    const currentReport: MiroirReport = DomainInstanceUuidIndexToArray(domainState[entityDefinitionReport.uuid])?.find(e=>e['uuid'] === reportUuid) as MiroirReport;
    return currentReport?.definition?.parentName?DomainInstanceUuidIndexToArray(domainState[currentReport.definition.parentUuid]):[];
  }
}

export function selectEntityInstances(parentUuid:string):DomainStateSelector{
  return (domainState:DomainState):EntityInstance[] => {
    // console.log('selectEntityInstances', parentName, Object.keys(domainState))
    return DomainInstanceUuidIndexToArray(domainState[parentUuid]);
  }
}