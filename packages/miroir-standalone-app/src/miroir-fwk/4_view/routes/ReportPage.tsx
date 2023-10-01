import { useEffect } from 'react';
import { Params, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';

import { JzodElement } from '@miroir-framework/jzod-ts';
import {
  ApplicationSection,
  MiroirApplicationModel,
  Report
} from "miroir-core";
import {
  useErrorLogService,
  useMiroirContextService
} from "../../../miroir-fwk/4_view/MiroirContextReactProvider";

import { useCurrentModel } from '../ReduxHooks';
import { RootReportSectionView } from '../RootReportSectionView';

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
  console.log("ReportPage count",count,"params", params,);
  useEffect(()=>context.setDeploymentUuid(params.deploymentUuid ? params.deploymentUuid : ""));

  const errorLog = useErrorLogService();
  const currentModel: MiroirApplicationModel = useCurrentModel(params.deploymentUuid);

  // console.log("ReportPage currentModel", currentModel);

  const currentMiroirReport: Report | undefined = currentModel.reports?.find((r) => r.uuid === params.reportUuid);

  if (params.applicationSection) {
    console.log("ReportPage rendering count",count,"params", params,);
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
                  fetchedData={{}}
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
