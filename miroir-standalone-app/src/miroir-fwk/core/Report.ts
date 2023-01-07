import { mEntities, Mentity } from "./Entity";
import { MinstanceWithName } from "./Instance";

export interface MiroirReportListDefinition {
  "entity": string,
};

export type MiroirReportDefinition = MiroirReportListDefinition;

export interface MiroirReport extends MinstanceWithName {
  // "uuid": number,
  // "name":string,
  "defaultLabel": string,
  "type": 'list' | 'grid',
  "definition"?: MiroirReportDefinition,
};

export type MiroirReports=MiroirReport[];


export function ReportGetInstancesToDispay(
  report:MiroirReport,
  miroirEntities:mEntities
):any[] {
  let result:mEntities;
  const currentMiroirEntity: Mentity = miroirEntities?.find(e=>e?.name === report?.definition?.entity)

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