import { DomainInstanceUuidIndexToArray } from "../1_core/DomainState";
import { EntityInstance } from "../0_interfaces/1_core/Instance";
import { MiroirReport } from "../0_interfaces/1_core/Report";
import { DomainState, DomainStateSelector } from "../0_interfaces/2_domain/DomainControllerInterface";
import entityDefinitionReport from "../assets/entityDefinitions/Report.json";

// export function selectReportInstances(reportName:string):DomainStateSelector{
export function selectReportInstances(reportUuid:string):DomainStateSelector{
  return (domainState:DomainState):EntityInstance[] => {
    // console.log('selectReportInstances', reportName, currentReport, domainState[currentReport.definition.entityName])
    // const currentReport: MiroirReport = DomainInstanceUuidIndexToArray(domainState['Report'])?.find(e=>e['name'] === reportName) as MiroirReport;
    const currentReport: MiroirReport = DomainInstanceUuidIndexToArray(domainState[entityDefinitionReport.uuid])?.find(e=>e['uuid'] === reportUuid) as MiroirReport;
    return currentReport?.definition?.entityName?DomainInstanceUuidIndexToArray(domainState[currentReport.definition.entityDefinitionUuid]):[];
  }
}

export function selectEntityInstances(entityDefinitionUuid:string):DomainStateSelector{
  return (domainState:DomainState):EntityInstance[] => {
    // console.log('selectEntityInstances', entityName, Object.keys(domainState))
    return DomainInstanceUuidIndexToArray(domainState[entityDefinitionUuid]);
  }
}