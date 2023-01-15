import { EntityDefinition } from "src/miroir-fwk/0_interfaces/1_core/Entity";
import { MiroirReport } from "src/miroir-fwk/0_interfaces/1_core/Report";

export function ReportGetInstancesToDispay(
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