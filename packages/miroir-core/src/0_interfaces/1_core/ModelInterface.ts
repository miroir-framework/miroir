import { EntityDefinition } from "../../0_interfaces/1_core/EntityDefinition";
import { MiroirReport } from "../../0_interfaces/1_core/Report";

export interface MiroirModel {
  entities: EntityDefinition[];
  reports: MiroirReport[];
}