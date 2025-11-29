import {
  getApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  type DeploymentUuidToReportsEntitiesDefinitions,
  type EntityDefinition,
  type JzodElement,
  type MetaModel,
  type ReportSection,
  type Uuid
} from "miroir-core";
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportTools"), "UI",
).then((logger: LoggerInterface) => {log = logger});

export const reportSectionsFormSchema = (
  reportSection: ReportSection,
  deploymentUuid: Uuid,
  currentDeploymentReportsEntitiesDefinitionsMapping: DeploymentUuidToReportsEntitiesDefinitions,
  currentModel: MetaModel,
  reportData: Record<string, any>,
  reportSectionPath: (string | number)[]
): Record<string, JzodElement> => {
  log.info("reportSectionsFormValue", reportSection, reportData, reportSectionPath);
  switch (reportSection.type) {
    case "list":
      return reportSection.definition.reduce(
        (acc: Record<string, any>, curr: ReportSection, index: number): Record<string, any> => {
          return {
            ...acc,
            ...reportSectionsFormSchema(
              curr,
              deploymentUuid,
              currentDeploymentReportsEntitiesDefinitionsMapping,
              currentModel,
              reportData,
              reportSectionPath.concat("definition", index)
            ),
          };
        },
        {}
      );
    case "grid":
      return reportSection.definition.reduce(
        (acc: Record<string, any>, row: ReportSection[], rowIndex: number) => {
          const rowObj = row.reduce(
            (rowAcc: Record<string, any>, subSection: ReportSection, colIndex: number) => ({
              ...rowAcc,
              ...reportSectionsFormSchema(
                subSection,
                deploymentUuid,
                currentDeploymentReportsEntitiesDefinitionsMapping,
                currentModel,
                reportData,
                reportSectionPath.concat("definition", rowIndex, colIndex)
              ),
            }),
            {}
          );
          return { ...acc, ...rowObj };
        },
        {}
      );
    case "objectInstanceReportSection": {
      const entityUuid = reportSection.definition.parentUuid;
      const applicationSection = getApplicationSection(deploymentUuid, entityUuid)
      // const targetEntityDefinition: EntityDefinition | undefined =
      //   currentModel?.entityDefinitions?.find((e) => e?.entityUuid === entityUuid);
      const targetEntityDefinition: EntityDefinition | undefined =
        currentDeploymentReportsEntitiesDefinitionsMapping?.[
          applicationSection
        ]?.entityDefinitions?.find((e) => e?.entityUuid === entityUuid);
      if (!targetEntityDefinition) {
        throw new Error(
          "ReportViewWithEditor reportSectionsFormSchema: cannot find target entity definition for " +
          " deploymentUuid " + deploymentUuid +
           " entityUuid " +
            entityUuid +
            " in applicationSection " +
            applicationSection
        );
      }
      return {
        [reportSectionPath.join("_")]:targetEntityDefinition.jzodSchema
      };
    }
    case "objectListReportSection":
    case "markdownReportSection":
    case "graphReportSection":
    default:
      return {};
  }
};
// ###############################################################################################
// ###############################################################################################
// ###############################################################################################
// ###############################################################################################
// ###############################################################################################
export const reportSectionsFormValue = (
  reportSection: ReportSection,
  reportData: Record<string, any>,
  reportSectionPath: (string | number)[]
): Record<string, any> => {
  log.info("reportSectionsFormValue", reportSection, reportData, reportSectionPath);
  switch (reportSection.type) {
    case "list":
      return reportSection.definition.reduce(
        (acc: Record<string, any>, curr: ReportSection, index: number): Record<string, any> => {
          return {
            ...acc,
            ...reportSectionsFormValue(
              curr,
              reportData,
              reportSectionPath.concat("definition", index)
            ),
          };
        },
        {}
      );
    case "grid":
      return reportSection.definition.reduce(
        (acc: Record<string, any>, row: ReportSection[], rowIndex: number) => {
          const rowObj = row.reduce(
            (rowAcc: Record<string, any>, subSection: ReportSection, colIndex: number) => ({
              ...rowAcc,
              ...reportSectionsFormValue(
                subSection,
                reportData,
                reportSectionPath.concat("definition", rowIndex, colIndex)
              ),
            }),
            {}
          );
          return { ...acc, ...rowObj };
        },
        {}
      );
    case "objectListReportSection":
    case "objectInstanceReportSection": {
      return {
        [reportSectionPath.join("_")]:
          reportData[reportSection.definition.fetchedDataReference ?? ""],
      };
    }
    case "markdownReportSection":
    case "graphReportSection":
    default:
      return {};
  }
};
