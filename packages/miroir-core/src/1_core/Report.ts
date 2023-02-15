import { EntityDefinition } from 'src/0_interfaces/1_core/EntityDefinition.js';
import { MiroirReport } from 'src/0_interfaces/1_core/Report.js';

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

