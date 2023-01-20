import { InstanceWithName } from "./Instance";

export interface MiroirReportListDefinition {
  "entity": string,
};

export type MiroirReportDefinition = MiroirReportListDefinition;

export interface MiroirReport extends InstanceWithName {
  // "uuid": number,
  // "name":string,
  "defaultLabel": string,
  "type": 'list' | 'grid',
  "definition"?: MiroirReportDefinition,
};

export type MiroirReports=MiroirReport[];

