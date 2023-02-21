import { EntityDefinition } from '../0_interfaces/1_core/EntityDefinition.js';
import { MiroirReport } from '../0_interfaces/1_core/Report.js';

function ReportGetInstancesToDispay (
    report:MiroirReport,
    miroirEntities:EntityDefinition[],
    miroirReports:MiroirReport[],
  ):any[] {
    let result:any[];
    const currentMiroirEntity: EntityDefinition = miroirEntities?.find(e=>e?.name === report?.definition?.entity)
  
    switch (currentMiroirEntity?.name) {
      case "Entity":
        result = miroirEntities
        break;
    
      case "Report":
        result = miroirReports
        break;
    
      default:
        result = []
        break;
    }
    return result
  }
;

export {ReportGetInstancesToDispay}

