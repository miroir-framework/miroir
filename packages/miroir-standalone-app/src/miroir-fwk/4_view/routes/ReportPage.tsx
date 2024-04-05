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
import { RootReportSectionView } from '../RootReportSectionView';
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

  const deployments = [
    applicationDeploymentMiroir,
    applicationDeploymentLibrary,
  ] as ApplicationDeploymentConfiguration[];

  const miroirMetaModel: MetaModel = useCurrentModel(applicationDeploymentMiroir.uuid);
  const libraryAppModel: MetaModel = useCurrentModel(applicationDeploymentLibrary.uuid);

  // log.info("ReportPage currentModel", currentModel);

  const defaultReport: Report = useMemo(
    () => ({
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
    }),
    []
  );

  const displayedDeploymentDefinition: ApplicationDeploymentConfiguration | undefined = deployments.find(
    (d) => d.uuid == pageParams.deploymentUuid
  );

  const localApplicationSection: ApplicationSection = (
    pageParams.applicationSection == "data" ? "data" : "model"
  ) as ApplicationSection;

  const deploymentUuidToReportsEntitiesDefinitionsMapping = useMemo(
    () => getDeploymentUuidToReportsEntitiesDefinitionsMapping(miroirMetaModel, libraryAppModel),
    [miroirMetaModel, libraryAppModel]
  );

  // if (!context.deploymentUuidToReportsEntitiesDefinitionsMapping && miroirMetaModel && libraryAppModel) {
  useEffect(() =>
    context.setDeploymentUuidToReportsEntitiesDefinitionsMapping(deploymentUuidToReportsEntitiesDefinitionsMapping)
  );
  // }

  const { availableReports, entities, entityDefinitions } = useMemo(() => {
    return displayedDeploymentDefinition &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping &&
      context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid]
      ? context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid][
          localApplicationSection
        ]
      : { availableReports: [], entities: [], entityDefinitions: [] };
  }, [
    displayedDeploymentDefinition,
    context.deploymentUuidToReportsEntitiesDefinitionsMapping,
    localApplicationSection,
  ]);
  log.info("ReportPage availableReports", availableReports);

  const currentMiroirReport: Report = availableReports?.find((r:Report) => r.uuid == pageParams.reportUuid) ?? defaultReport;

  // const currentMiroirReport: Report = currentModel.reports?.find((r:Report) => r.uuid === params.reportUuid)??defaultReport;

  // const emptyResultsFromQuery: DomainElementObject = useMemo(()=> ({ elementType: "object", elementValue: {}}), []);

  if (pageParams.applicationSection) {
    log.info("ReportPage rendering count", count, "params", pageParams);
    return (
      <div>
        <Box>
          <h3>erreurs: {JSON.stringify(errorLog)}</h3>
        </Box>
        {/* <div>ReportPage displayed:{count}</div>
        <div>ReportPage reportUuid: {params.reportUuid} </div> */}
        {pageParams.deploymentUuid && pageParams.applicationSection && pageParams.reportUuid && pageParams.reportUuid != "undefined" ? (
          <>
            <div>
              deploymentUuid={pageParams.deploymentUuid}, applicationSection={pageParams.applicationSection}, reportUuid=
              {pageParams.reportUuid}, instanceUuid={pageParams.instanceUuid}
            </div>
            <RootReportSectionView
              reportSection={currentMiroirReport?.definition}
              applicationSection={pageParams.applicationSection as ApplicationSection}
              deploymentUuid={pageParams.deploymentUuid}
              instanceUuid={pageParams.instanceUuid}
              pageParams={pageParams}
            />
          </>
        ) : (
          <span style={{ color: "red" }}>
            no report to display, deploymentUuid={pageParams.deploymentUuid}, applicationSection={pageParams.applicationSection}
            , reportUuid={pageParams.reportUuid}
          </span>
        )}
      </div>
    );
  } else {
    return <>ReportPage Invalid parameters! {JSON.stringify(pageParams)}</>;
  }
};
