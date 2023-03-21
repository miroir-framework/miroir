import { DomainInstanceUuidIndexToArray } from "../1_core/DomainState";
import { Instance } from "../0_interfaces/1_core/Instance";
import { MiroirReport } from "../0_interfaces/1_core/Report";
import { DomainState, DomainStateSelector } from "../0_interfaces/2_domain/DomainControllerInterface";
import entityReport from "../assets/entities/Report.json";

// export function selectReportInstances(reportName:string):DomainStateSelector{
export function selectReportInstances(reportUuid:string):DomainStateSelector{
  return (domainState:DomainState):Instance[] => {
    // console.log('selectReportInstances', reportName, currentReport, domainState[currentReport.definition.entity])
    // const currentReport: MiroirReport = DomainInstanceUuidIndexToArray(domainState['Report'])?.find(e=>e['name'] === reportName) as MiroirReport;
    const currentReport: MiroirReport = DomainInstanceUuidIndexToArray(domainState[entityReport.uuid])?.find(e=>e['uuid'] === reportUuid) as MiroirReport;
    return currentReport?.definition?.entity?DomainInstanceUuidIndexToArray(domainState[currentReport.definition.entityUuid]):[];
  }
}

export function selectEntityInstances(entityUuid:string):DomainStateSelector{
  return (domainState:DomainState):Instance[] => {
    // console.log('selectEntityInstances', entityName, Object.keys(domainState))
    return DomainInstanceUuidIndexToArray(domainState[entityUuid]);
  }
}