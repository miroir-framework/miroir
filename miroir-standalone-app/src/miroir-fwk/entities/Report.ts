import { MiroirEntities, MiroirEntity } from "./Entity";
import { MiroirEntityInstanceWithName } from "./Instance";

export interface MiroirReportListDefinition {
  "entity": string,
};

export type MiroirReportDefinition = MiroirReportListDefinition;

export interface MiroirReport extends MiroirEntityInstanceWithName {
  // "uuid": number,
  // "name":string,
  "defaultLabel": string,
  "type": 'list' | 'grid',
  "definition"?: MiroirReportDefinition,
};

export type MiroirReports=MiroirReport[];


export function ReportGetInstancesToDispay(
  report:MiroirReport,
  miroirEntities:MiroirEntities
):any[] {
  let result:MiroirEntities;
  const currentMiroirEntity: MiroirEntity = miroirEntities?.find(e=>e?.name === report?.definition?.entity)

  switch (currentMiroirEntity?.entity) {
    case "Entity":
      result = miroirEntities
      break;
  
    default:
      result = []
      break;
  }
  return result
}