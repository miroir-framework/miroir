import Box from '@mui/material/Box';
import { useEffect, useMemo } from 'react';
import { Params, useParams } from 'react-router-dom';

import {
  ApplicationDeploymentConfiguration,
  ApplicationSection,
  JzodElement,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  Report,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  adminConfigurationDeploymentTest1,
  getLoggerName,
  getReportsAndEntitiesDefinitionsForDeploymentUuid
} from "miroir-core";
import {
  useErrorLogService,
  useMiroirContextService
} from "../../../miroir-fwk/4_view/MiroirContextReactProvider";

import { packageName } from '../../../constants';
import { useCurrentModel } from '../ReduxHooks';
import { RootReportSectionView } from '../components/RootReportSectionView';
import { cleanLevel } from '../constants';

const loggerName: string = getLoggerName(packageName, cleanLevel,"ReportPage");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export type ReportUrlParamKeys = 'deploymentUuid' | 'applicationSection' | 'reportUuid' | 'instanceUuid';


const miroirExpression: JzodElement = {
  type: "object",
  definition: {
    root: {
      type: "simpleType",
      definition: "string"
    },
    attribute: {
      type: "simpleType",
      definition: "string"
    },
  }
}

export const adminConfigurationDeploymentTest4 = {
  "parentName": "Deployment",
  "parentUuid": "7959d814-400c-4e80-988f-a00fe582ab98",
  "uuid": "f97cce64-78e9-419f-a4bd-5cbf52833ede",
  "name": "test4ApplicationSqlDeployment",
  "defaultLabel": "test4ApplicationSqlDeployment",
  "application": "0e7e56a9-ef59-4bf1-b17e-c710444d969e",
  "description": "The default Sql Deployment for Application test4",
  "configuration": {
      "admin": {
          "emulatedServerType": "sql",
          "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
          "schema": "miroirAdmin"
      },
      "model": {
          "emulatedServerType": "sql",
          "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
          "schema": "test4Model"
      },
      "data": {
          "emulatedServerType": "sql",
          "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
          "schema": "test4Data"
      }
  }
}

export const defaultMenuParisUuid = "84c178cc-1b1b-497a-a035-9b3d756bb085";
export const selfApplicationParis = {
  "uuid": "70e02039-e283-4381-9575-8c52aed18a87",
  "parentName": "Application",
  "parentUuid": "25d935e7-9e93-42c2-aade-0472b883492b",
  "name": "Paris",
  "defaultLabel": "The Paris application.",
  "description": "This application contains the Paris model and data",
  "selfApplication": "70e02039-e283-4381-9575-8c52aed18a87"
};
export const applicationParis = {
  "uuid": "a118ba22-1be2-423f-aa77-f0baaa76313f",
  "parentName": "Application",
  "parentUuid": "25d935e7-9e93-42c2-aade-0472b883492b",
  "name": "Paris",
  "defaultLabel": "The Paris application.",
  "description": "This application contains the Paris model and data",
  "selfApplication": "70e02039-e283-4381-9575-8c52aed18a87"
};
export const adminConfigurationDeploymentParis = {
  "parentName": "Deployment",
  "parentUuid": "7959d814-400c-4e80-988f-a00fe582ab98",
  "uuid": "f1b74341-129b-474c-affa-e910d6cba01d",
  "name": "ParisApplicationSqlDeployment",
  "defaultLabel": "ParisApplicationSqlDeployment",
  "application": "70e02039-e283-4381-9575-8c52aed18a87",
  "description": "The default Sql Deployment for Application Paris",
  "configuration": {
    "admin": {
      "emulatedServerType": "sql",
      "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
      "schema": "miroirAdmin"
    },
    "model": {
      "emulatedServerType": "sql",
      "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
      "schema": "ParisModel"
    },
    "data": {
      "emulatedServerType": "sql",
      "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
      "schema": "ParisData"
    }
  }
}

export const deployments = [
  adminConfigurationDeploymentMiroir,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentTest1,
  adminConfigurationDeploymentTest4,
  adminConfigurationDeploymentParis,
] as any[]; //type for Admin Application Deployment Entity Definition


let count = 0;
// ###############################################################################################################
export const ReportPage = () => {
  const pageParams: Params<ReportUrlParamKeys> = useParams<ReportUrlParamKeys>();
  const context = useMiroirContextService();

  count++;
  log.info("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& ReportPage rendering count", count, "params", pageParams);
  useEffect(() => context.setDeploymentUuid(pageParams.deploymentUuid ? pageParams.deploymentUuid : ""));
  useEffect(() => context.setApplicationSection((pageParams.applicationSection as ApplicationSection) ?? "data"));

  const errorLog = useErrorLogService();
  // const currentModel: MetaModel = useCurrentModel(params.deploymentUuid);

  // TODO: REMOVE HARD-CODED LIST!!! WHAT IS IT USEFUL FOR???
  // const deployments = [
  //   adminConfigurationDeploymentAdmin,
  //   adminConfigurationDeploymentMiroir,

  //   adminConfigurationDeploymentLibrary,
  //   adminConfigurationDeploymentTest1,
  //   adminConfigurationDeploymentTest4,
  // ] as any[]; //type for Admin Application Deployment Entity Definition
  // ] as ApplicationDeploymentConfiguration[];


  const adminAppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentAdmin.uuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  const libraryAppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentLibrary.uuid);

  const test1AppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentTest1.uuid);
  const test4AppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentTest4.uuid);
  // const parisAppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentParis.uuid);

  // log.info("ReportPage currentModel", currentModel);

  const defaultReport: Report = useMemo(
    () => (
      {
        uuid: "c0ba7e3d-3740-45a9-b183-20c3382b6419",
        parentName: "Report",
        parentUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
        conceptLevel: "Model",
        name: "DummyDefaultReport",
        defaultLabel: "No report to display!",
        type: "list",
        definition: {
          fetchQuery: { select: {} },
          section: {
            type: "objectListReportSection",
            definition: {
              parentName: "Test",
              parentUuid: "9ad64893-5f8f-4eaf-91aa-ffae110f88c8",
            },
          },
        },
      }
    ),
    []
  );

  const displayedDeploymentDefinition: ApplicationDeploymentConfiguration | undefined = deployments.find(
    (d) => d.uuid == pageParams.deploymentUuid
  );

  log.info("displayedDeploymentDefinition", displayedDeploymentDefinition);

  const deploymentUuidToReportsEntitiesDefinitionsMapping = useMemo(
    () => (
      {
        [adminConfigurationDeploymentAdmin.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminConfigurationDeploymentAdmin.uuid,
          miroirMetaModel, 
          adminAppModel,
        ),
        [adminConfigurationDeploymentMiroir.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminConfigurationDeploymentMiroir.uuid,
          miroirMetaModel, 
          miroirMetaModel, 
        ),
        [adminConfigurationDeploymentLibrary.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminConfigurationDeploymentLibrary.uuid,
          miroirMetaModel, 
          libraryAppModel,
        ),
        [adminConfigurationDeploymentTest1.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminConfigurationDeploymentTest1.uuid,
          miroirMetaModel, 
          test1AppModel,
        ),
        [adminConfigurationDeploymentTest4.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
          adminConfigurationDeploymentTest4.uuid,
          miroirMetaModel, 
          test4AppModel,
        ),
        // [adminConfigurationDeploymentParis.uuid]: getReportsAndEntitiesDefinitionsForDeploymentUuid(
        //   adminConfigurationDeploymentParis.uuid,
        //   miroirMetaModel, 
        //   parisAppModel,
        // ),
      }
    ),
    // [miroirMetaModel, libraryAppModel, adminAppModel, test1AppModel, test4AppModel, parisAppModel]
    [miroirMetaModel, libraryAppModel, adminAppModel, test1AppModel, test4AppModel ]
  );

  useEffect(() =>
    context.setDeploymentUuidToReportsEntitiesDefinitionsMapping(deploymentUuidToReportsEntitiesDefinitionsMapping)
  );

  log.info("context.deploymentUuidToReportsEntitiesDefinitionsMapping", context.deploymentUuidToReportsEntitiesDefinitionsMapping);

  const { availableReports, entities, entityDefinitions } = useMemo(() => {
    return displayedDeploymentDefinition &&
      pageParams.applicationSection &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid]
      ? context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid][
          pageParams.applicationSection as ApplicationSection
        ]
      : { availableReports: [], entities: [], entityDefinitions: [] };
  }, [
    displayedDeploymentDefinition,
    context.deploymentUuidToReportsEntitiesDefinitionsMapping,
    pageParams.applicationSection,
  ]);
  // log.info("displayedDeploymentDefinition", displayedDeploymentDefinition);
  log.info("ReportPage availableReports", availableReports);

  const currentMiroirReport: Report =
    availableReports?.find((r: Report) => r.uuid == pageParams.reportUuid) ?? defaultReport;

  log.info("currentMiroirReport", currentMiroirReport);

  if (pageParams.applicationSection) {
    log.info("ReportPage rendering count", count, "params", pageParams);
    return (
      <div>
        <Box>
          <h3>erreurs: {JSON.stringify(errorLog)}</h3>
        </Box>
        {/* <div>ReportPage displayed:{count}</div>
        <div>ReportPage reportUuid: {params.reportUuid} </div> */}
        {
          pageParams.deploymentUuid &&
          pageParams.applicationSection &&
          pageParams.reportUuid &&
          pageParams.reportUuid != "undefined" ? (
            <>
              <div>
                deploymentUuid={pageParams.deploymentUuid}, applicationSection={pageParams.applicationSection},
                reportUuid={pageParams.reportUuid}, instanceUuid={pageParams.instanceUuid}
              </div>
              <RootReportSectionView
                applicationSection={pageParams.applicationSection as ApplicationSection}
                deploymentUuid={pageParams.deploymentUuid}
                instanceUuid={pageParams.instanceUuid}
                pageParams={pageParams}
                rootReportSection={currentMiroirReport?.definition}
              />
            </>
          ) : (
            <span style={{ color: "red" }}>
              ReportDisplay: no report to display, deploymentUuid={pageParams.deploymentUuid}, applicationSection=
              {pageParams.applicationSection}, reportUuid={pageParams.reportUuid}
            </span>
          )
        }
      </div>
    );
  } else {
    return <>ReportPage Invalid parameters! {JSON.stringify(pageParams)}</>;
  }
};
