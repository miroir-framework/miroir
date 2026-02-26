import { ExpandMoreIcon } from '../Themes/MaterialSymbolWrappers';
// import { z } from "zod";

import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import {
  defaultSelfApplicationDeploymentMap,
  MiroirLoggerFactory,
  type LoggerInterface
} from "miroir-core";
import { Runner_CreateApplication } from './Runner_CreateApplication';
import { Runner_CreateEntity } from './Runner_CreateEntity';
import { Runner_DeleteEntity } from './Runner_DeleteEntity';
import { Runner_DropApplication } from './Runner_DropApplication';
import { Runner_InstallApplication } from './Runner_InstallApplication';
import { packageName } from '../../../../constants';
import { cleanLevel } from '../../constants';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "PersistenceReduxSaga"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
// Runner configurations
export type RunnerConfig = {
  title: string;
  component: React.FC<any>; // TODO: give a proper type to the component props
}
export const runnerConfigs: RunnerConfig[] = [
  // {
  //   title: "Endpoint Action Caller",
  //   component: EndpointActionCaller,
  // },
  {
    title: "Install Existing Application",
    component: Runner_InstallApplication,
  },
  {
    title: "Create Application (and Deployment)",
    component: Runner_CreateApplication,
  },
  {
    title: "Drop Application (and Deployment)",
    component: Runner_DropApplication,
  },
  {
    title: "Create Entity",
    component: Runner_CreateEntity,
  },
  {
    title: "Drop Entity",
    component: Runner_DeleteEntity,
  },
  // // // {
  // // //   title: "Import Entity From Spreadsheet",
  // // //   component: ImportEntityFromSpreadsheetRunner,
  // // // },
  // {
  //   title: "Lend Document",
  //   component: LibraryRunner_LendDocument,
  // },
] as const;

// ################################################################################################
export const RunnerList: React.FC<{
  config: RunnerConfig[];
  applicationDeploymentMap?: any;
}> = ({ config, applicationDeploymentMap }) => {
  const runners = config.map((config, index) => {
    const RunnerComponent = config.component;
    return (
      <Accordion key={index} style={{ marginBottom: 12 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          {/* <div style={{ fontWeight: 500 }}>{config.title}</div> */}
          <div>{config.title}</div>
        </AccordionSummary>
        <AccordionDetails>
          {/* <RunnerComponent deploymentUuid={deploymentUuid} /> */}
          <RunnerComponent
            // application={applicationUuid}
            applicationDeploymentMap={
              applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap
            }
          />
        </AccordionDetails>
      </Accordion>
    );
  });
  return <>{runners}</>;
};
