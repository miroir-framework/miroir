import type { Report } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";

import { packageName } from "../constants";
import { cleanLevel } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Report")
).then((logger: LoggerInterface) => {log = logger});

export const defaultReport: Report = {
  uuid: "c0ba7e3d-3740-45a9-b183-20c3382b6419",
  parentName: "Report",
  parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
  conceptLevel: "Model",
  name: "DummyDefaultReport",
  defaultLabel: "No report to display!",
  type: "list",
  definition: {
    extractorTemplates: {},
    section: {
      type: "objectListReportSection",
      definition: {
        parentName: "Test",
        parentUuid: "9ad64893-5f8f-4eaf-91aa-ffae110f88c8",
      },
    },
  },
};