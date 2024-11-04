import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { getLoggerName } from "../tools";

import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { Report } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

const loggerName: string = getLoggerName(packageName, cleanLevel,"Report");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// TODO: still used?
// export function getReportSectionTargetEntityUuid(
//   reportDefinition:Report, reportSectionIndex: number,
// ) {
//   if (
//     reportDefinition &&
//     reportDefinition.definition?.section?.type === "objectListReportSection" &&
//     reportDefinition.definition.section.definition.queryType == "extractorTemplateForObjectListByEntity" &&
//     reportDefinition.definition.section?.definition?.parentUuid
//   ) {
//     log.info('getReportSectionTargetEntityUuid for entityUuid', reportDefinition.uuid, 'reportSectionIndex', reportSectionIndex)
//     return reportDefinition.definition.section?.definition.parentUuid;
//   } else {
//     return undefined;
//   }
// }
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

