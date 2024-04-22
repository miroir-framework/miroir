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
  applicationDeploymentAdmin,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  getDeploymentUuidToReportsEntitiesDefinitionsMapping,
  getLoggerName
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
  const deployments = [
    applicationDeploymentMiroir,
    applicationDeploymentLibrary,
    applicationDeploymentAdmin,
  ] as ApplicationDeploymentConfiguration[];

  const miroirMetaModel: MetaModel = useCurrentModel(applicationDeploymentMiroir.uuid);
  const libraryAppModel: MetaModel = useCurrentModel(applicationDeploymentLibrary.uuid);
  const adminAppModel: MetaModel = useCurrentModel(applicationDeploymentAdmin.uuid);

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

  const deploymentUuidToReportsEntitiesDefinitionsMapping = useMemo(
    () => getDeploymentUuidToReportsEntitiesDefinitionsMapping(miroirMetaModel, libraryAppModel, adminAppModel),
    [miroirMetaModel, libraryAppModel, adminAppModel]
  );

  useEffect(() =>
    context.setDeploymentUuidToReportsEntitiesDefinitionsMapping(deploymentUuidToReportsEntitiesDefinitionsMapping)
  );


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
  log.info("displayedDeploymentDefinition", displayedDeploymentDefinition);
  log.info("context.deploymentUuidToReportsEntitiesDefinitionsMapping", context.deploymentUuidToReportsEntitiesDefinitionsMapping);
  log.info("ReportPage availableReports", availableReports);

  const currentMiroirReport: Report =
    availableReports?.find((r: Report) => r.uuid == pageParams.reportUuid) ?? defaultReport;

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
