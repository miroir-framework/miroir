import { EntityDefinition } from 'src/0_interfaces/1_core/Entity.js';
import { MiroirReport } from 'src/0_interfaces/1_core/Report.js';

// const ReportGetInstancesToDispay = (
// export function ReportGetInstancesToDispay (
// export const ReportGetInstancesToDispay = (
//   report:MiroirReport,
//   miroirEntities:EntityDefinition[]
// ):any[] => {
//   let result:EntityDefinition[];
//   const currentMiroirEntity: EntityDefinition = miroirEntities?.find(e=>e?.name === report?.definition?.entity)

//   switch (currentMiroirEntity?.entity) {
//     case "Entity":
//       result = miroirEntities
//       break;
  
//     default:
//       result = []
//       break;
//   }
//   return result
// }

// const toto: (
//   report:MiroirReport,
//   miroirEntities:EntityDefinition[]
// ) => any[] = (
//   report:MiroirReport,
//   miroirEntities:EntityDefinition[]
// ) => {
//   let result:EntityDefinition[];
//   const currentMiroirEntity: EntityDefinition = miroirEntities?.find(e=>e?.name === report?.definition?.entity)

//   switch (currentMiroirEntity?.entity) {
//     case "Entity":
//       result = miroirEntities
//       break;
  
//     default:
//       result = []
//       break;
//   }
//   return result
// };

// export default {
//   ReportGetInstancesToDispay: toto
//   // (
//   //       report:MiroirReport,
//   //       miroirEntities:EntityDefinition[]
//   //     ):any[] =>{
//   //       let result:EntityDefinition[];
//   //       const currentMiroirEntity: EntityDefinition = miroirEntities?.find(e=>e?.name === report?.definition?.entity)
      
//   //       switch (currentMiroirEntity?.entity) {
//   //         case "Entity":
//   //           result = miroirEntities
//   //           break;
        
//   //         default:
//   //           result = []
//   //           break;
//   //       }
//   //       return result
//   //     }
// }

// export {
//   toto as ReportGetInstancesToDispay
// }

function ReportGetInstancesToDispay (
    report:MiroirReport,
    miroirEntities:EntityDefinition[]
  ):any[] {
    let result:EntityDefinition[];
    const currentMiroirEntity: EntityDefinition = miroirEntities?.find(e=>e?.name === report?.definition?.entity)
  
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
;

export {ReportGetInstancesToDispay}

