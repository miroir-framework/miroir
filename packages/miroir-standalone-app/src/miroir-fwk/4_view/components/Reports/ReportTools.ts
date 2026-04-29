import {
  entityDefinitionMLSchema,
  entityQueryVersion,
  getApplicationSection,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  LoggerInterface,
  MiroirLoggerFactory,
  type ApplicationDeploymentMap,
  type DeploymentUuidToReportsEntitiesDefinitions,
  type EntityDefinition,
  type JzodElement,
  type JzodObject,
  type MetaModel,
  type MiroirModelEnvironment,
  type ReportSection,
  type Uuid
} from "miroir-core";
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { editedQueryParameterValueKey } from "./ReportSectionEntityInstance.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportTools"), "UI",
).then((logger: LoggerInterface) => {log = logger});

export const reportSectionsFormSchema = (
  reportSection: ReportSection,
  applicationUuid: Uuid,
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
              applicationUuid,
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
                applicationUuid,
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
      const applicationSection = getApplicationSection(applicationUuid, entityUuid)
      const targetEntityDefinition: EntityDefinition | undefined =
        currentDeploymentReportsEntitiesDefinitionsMapping?.[
          applicationSection
        ]?.entityDefinitions?.find((e) => e?.entityUuid === entityUuid);
      if (!targetEntityDefinition) {
        throw new Error(
          "reportSectionsFormSchema: cannot find target entity definition for " +
          " deploymentUuid " + JSON.stringify(deploymentUuid) +
           " entityUuid " +
            entityUuid +
            " in applicationSection " +
            applicationSection
        );
      }
      const resolvedEntityDefinitionMLSchema = entityDefinitionMLSchema(targetEntityDefinition);
      return {
        [reportSectionPath.join("_")]: resolvedEntityDefinitionMLSchema
      };
    }
    case "objectListReportSection":
    case "markdownReportSection":
    case "modelDiagramReportSection":
    case "graphReportSection":
    default:
      throw new Error(
        "reportSectionsFormSchema: report section type " +
          reportSection.type +
          " is not supported for form schema generation",
      );
      // return {};
  }
};
// ###############################################################################################
// ###############################################################################################
// ###############################################################################################
// ###############################################################################################
// ###############################################################################################
export const reportSectionsFormValue = (
  reportData: Record<string, any>,
  reportSection: ReportSection,
  reportSectionPath: (string | number)[],
  application: Uuid | undefined = undefined,
  applicationDeploymentMap: ApplicationDeploymentMap | undefined = undefined,
  deploymentUuid: Uuid | undefined = undefined,
  miroirEnvironment: MiroirModelEnvironment,
  transformerParams: Record<string, any> = {},
): Record<string, any> => {
  // log.info("reportSectionsFormValue", reportSection, reportData, reportSectionPath);
  switch (reportSection.type) {
    case "list":
      return reportSection.definition.reduce(
        (acc: Record<string, any>, curr: ReportSection, index: number): Record<string, any> => {
          return {
            ...acc,
            ...reportSectionsFormValue(
              reportData,
              curr,
              reportSectionPath.concat("definition", index),
              application,
              applicationDeploymentMap,
              deploymentUuid,
              miroirEnvironment,
              transformerParams,
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
                reportData,
                subSection,
                reportSectionPath.concat("definition", rowIndex, colIndex),
                application,
                applicationDeploymentMap,
                deploymentUuid,
                miroirEnvironment,
                transformerParams,
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
      const targetData = reportData[reportSection.definition.fetchedDataReference ?? ""];
      const queryParametersSchema: JzodObject =
        typeof targetData === "object" &&
        targetData !== null &&
        !Array.isArray(targetData) &&
        targetData.parentUuid === entityQueryVersion.uuid &&
        targetData.parameters
          ? 
          targetData.parameters
          : undefined;
      const queryParametersDefaultValue = queryParametersSchema
        ? // {[editedQueryParameterValueKey]: { classification: "admin" }}
          {
            // [editedQueryParameterValueKey]: { classification: "MLS" }
            [editedQueryParameterValueKey]: getDefaultValueForJzodSchemaWithResolutionNonHook(
              "build",
              queryParametersSchema,
              undefined, // rootObject
              "", // rootLessListKey
              undefined, // currentDefaultvalue
              [], // currentValuePath
              // undefined,
              true, // forceOptional
              application,
              applicationDeploymentMap,
              deploymentUuid,
              miroirEnvironment,
              transformerParams, // transformerParams
              // {}, // contextResult
              // ReduxDeploymentsState,
            ),
          }
        : {};
      return {
        [reportSectionPath.join("_")]: targetData,
        ...queryParametersDefaultValue,
      };
    }
    case "inputReportSection":  {
      const queryParametersDefaultValue = reportSection.definition.inputMLSchema
        ? getDefaultValueForJzodSchemaWithResolutionNonHook(
            "build",
            reportSection.definition.inputMLSchema,
            undefined, // rootObject
            "", // rootLessListKey
            undefined, // currentDefaultvalue
            [], // currentValuePath
            // undefined,
            true, // forceOptional
            application,
            applicationDeploymentMap,
            deploymentUuid,
            miroirEnvironment,
            transformerParams, // transformerParams
            // {}, // contextResult
            // ReduxDeploymentsState,
          )
        : {};
      return {
        [reportSection.definition.inputPrefix ?? reportSectionPath.join("_") + "_inputMLSchema"]: queryParametersDefaultValue,
      };
    }
    case "markdownReportSection":
    case "modelDiagramReportSection":
    case "graphReportSection":
    case "accordionReportSection":
    case "jsonReportSection":
    case "storedReportDisplay":
    case "runnerReportSection":  
    default:
      return {};
  }
};
