import { DomainInstanceUuidIndexToArray } from "../1_core/DomainState";
import { Instance } from "../0_interfaces/1_core/Instance";
import { MiroirReport } from "../0_interfaces/1_core/Report";
import { DomainState, DomainStateSelector } from "../0_interfaces/2_domain/DomainControllerInterface";

export function selectReportInstances(reportName:string):DomainStateSelector{
  return (domainState:DomainState):Instance[] => {
    const currentReport: MiroirReport = DomainInstanceUuidIndexToArray(domainState['Report'])?.find(e=>e['name'] === reportName) as MiroirReport;
    console.log('selectReportInstances', reportName, currentReport, domainState[currentReport.definition.entity])
    // const currentMiroirEntity: EntityDefinition = domainState['Entity']?.find(e=>e['name'] === currentReport.entity)
    return DomainInstanceUuidIndexToArray(domainState[currentReport.definition.entity]);
  }
}