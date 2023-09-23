// import { Instance } from '../0_interfaces/1_core/Instance.js';
// import { EntityDefinition } from '../0_interfaces/1_core/EntityDefinition.js';
// import { Report } from '../0_interfaces/1_core/Report.js';

import { Report } from "../0_interfaces/1_core/preprocessor-generated/server-generated";

export function getReportSectionTargetEntityUuid(
  reportDefinition:Report, reportSectionIndex: number,
) {
  if (
    reportDefinition &&
    reportDefinition.definition?.type === "objectListReportSection" &&
    reportDefinition.definition.definition?.parentUuid
  ) {
    console.log('getReportSectionTargetEntityUuid for entityUuid', reportDefinition.uuid, 'reportSectionIndex', reportSectionIndex)
    return reportDefinition.definition.definition.parentUuid;
  } else {
    return undefined;
  }
}
// function ReportgetDataInstancesToDispay (
//     report:Report,
//     miroirEntities:EntityDefinition[],
//     miroirReports:Report[],
//     miroirBooks:Instance[],
//   ):any[] {
//     let result:any[];
//     const currentMiroirEntity: EntityDefinition = miroirEntities?.find(e=>e?.name === report?.definition?.parentName)

//     switch (currentMiroirEntity?.name) {
//       case "Entity":
//         result = miroirEntities
//         break;

//       case "Report":
//         result = miroirReports
//         break;
    
//       case "Book":
//         result = miroirBooks
//         break;
    
//       default:
//         result = []
//         break;
//     }
//     return result
//   }
// ;

// export {ReportgetDataInstancesToDispay}

