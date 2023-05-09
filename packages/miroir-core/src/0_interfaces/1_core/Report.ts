import { EntityInstanceWithName } from "./Instance.js";

export interface MiroirReportListDefinition {
  "parentName"?: string,
  "parentUuid": string,
};

export type MiroirReportDefinition = MiroirReportListDefinition;

export interface MiroirReport extends EntityInstanceWithName {
  "defaultLabel": string,
  "type": 'list' | 'grid',
  "definition": MiroirReportDefinition,
};

export type MiroirReports=MiroirReport[];

export default {}