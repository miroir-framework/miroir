import { DomainInstanceUuidIndexToArray } from "../1_core/DomainState";
import { Instance } from "../0_interfaces/1_core/Instance";
import { MiroirReport } from "../0_interfaces/1_core/Report";
import { DomainState, DomainStateSelector } from "../0_interfaces/2_domain/DomainControllerInterface";

export function selectReportInstances(reportName:string):DomainStateSelector{
  return (domainState:DomainState):Instance[] => {
    const currentReport: MiroirReport = DomainInstanceUuidIndexToArray(domainState['Report'])?.find(e=>e['name'] === reportName) as MiroirReport;
    // console.log('selectReportInstances', reportName, currentReport, domainState[currentReport.definition.entity])
    return currentReport?.definition?.entity?DomainInstanceUuidIndexToArray(domainState[currentReport.definition.entity]):[];
  }
}

export function selectEntityInstances(entityName:string):DomainStateSelector{
  return (domainState:DomainState):Instance[] => {
    // console.log('selectEntityInstances', entityName, Object.keys(domainState))
    return DomainInstanceUuidIndexToArray(domainState[entityName]);
  }
}