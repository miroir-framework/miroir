import { useEffect, useMemo } from 'react';
import { Params, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';

import { JzodElement } from '@miroir-framework/jzod-ts';
import {
  ApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
  Report,
  DomainElementObject,
  getLoggerName,
  MetaModel
} from "miroir-core";
import {
  useErrorLogService,
  useMiroirContextService
} from "../../../miroir-fwk/4_view/MiroirContextReactProvider";

import { useCurrentModel } from '../ReduxHooks';
import { RootReportSectionView } from '../RootReportSectionView';
import { packageName } from '../../../constants';
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
  const params:Params<ReportUrlParamKeys> = useParams<ReportUrlParamKeys>();
  const context = useMiroirContextService();

  count++;
  log.info("ReportPage count",count,"params", params,);
  useEffect(()=>context.setDeploymentUuid(params.deploymentUuid ? params.deploymentUuid : ""));

  const errorLog = useErrorLogService();
  const currentModel: MetaModel = useCurrentModel(params.deploymentUuid);

  log.info("ReportPage currentModel", currentModel);

  const defaultReport: Report = useMemo(()=> ({
    "uuid": "c0ba7e3d-3740-45a9-b183-20c3382b6419",
    "parentName":"Report",
    "parentUuid":"3f2baa83-3ef7-45ce-82ea-6a43f7a8c916",
    "conceptLevel":"Model",
    "name":"DummyDefaultReport",
    "defaultLabel": "No report to display!",
    "type": "list",
    "definition": {
      "fetchQuery": {"select": {}},
      "section": {
        "type":"objectListReportSection",
        "definition": {
          "parentName": "Test",
          "parentUuid": "9ad64893-5f8f-4eaf-91aa-ffae110f88c8"
        }
      }
    }
  }), [])
  const currentMiroirReport: Report = currentModel.reports?.find((r:Report) => r.uuid === params.reportUuid)??defaultReport;

  // const emptyResultsFromQuery: DomainElementObject = useMemo(()=> ({ elementType: "object", elementValue: {}}), []);

  if (params.applicationSection) {
    log.info("ReportPage rendering count",count,"params", params,);
    return (
      <div>
        <Box>
          <h3>erreurs: {JSON.stringify(errorLog)}</h3>
        </Box>
        <span>ReportPage displayed:{count}</span>
        {
          params.deploymentUuid &&
          params.applicationSection 
          ? (
            params.instanceUuid
              ? <RootReportSectionView
                  reportSection={currentMiroirReport?.definition}
                  applicationSection={params.applicationSection as ApplicationSection}
                  deploymentUuid={params.deploymentUuid}
                  instanceUuid={params.instanceUuid}
                />
              : 
                <div>No instance</div>
          ) : (
            <div>Oops.</div>
          )
        }
      </div>
    );
  } else {
    return <>ReportPage Invalid parameters! {JSON.stringify(params)}</>;
  }
};
