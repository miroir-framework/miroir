import { ExpandMoreIcon } from '../components/Themes/MaterialSymbolWrappers';
// import { z } from "zod";

import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import {
  defaultSelfApplicationDeploymentMap,
  MiroirLoggerFactory,
  type LoggerInterface
} from "miroir-core";
import { packageName } from "../../../constants.js";
import { PageContainer } from "../components/Page/PageContainer.js";
import { ReportPageContextProvider } from "../components/Reports/ReportPageContext.js";
import { LibraryRunner_LendDocument } from '../components/Runners/LibraryRunner_LendDocument.js';
import { cleanLevel } from "../constants.js";
import { useMiroirContextService } from '../MiroirContextReactProvider';
import { usePageConfiguration } from "../services/index.js";
import { CreateApplicationRunner } from '../components/Runners/CreateApplicationRunner';
import { CreateEntityRunner } from '../components/Runners/CreateEntityRunner';
import { DeleteEntityRunner } from '../components/Runners/DeleteEntityRunner';
import { DropApplicationRunner } from '../components/Runners/DropApplicationRunner';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "PersistenceReduxSaga"), "UI",
).then((logger: LoggerInterface) => {log = logger});

let count = 0;

// const testSubPartPathArray = [
//   "definition",
//   "testCompositeActions",
//   "create new Entity and reports from spreadsheet",
//   "compositeActionSequence",
//   "payload",
//   "templates",
// ];
// // const valuePath = "definition.testCompositeActions"
// const testSubPart = resolvePathOnObject(
//   test_createEntityAndReportFromSpreadsheetAndUpdateMenu,
//   testSubPartPathArray
// );

const pageLabel = "Admin";

// ################################################################################################
// Runner configurations
const runnerConfigs = [
  // // {
  // //   title: "Endpoint Action Caller",
  // //   component: EndpointActionCaller,
  // // },
  {
    title: "Create Application & Deployment",
    component: CreateApplicationRunner,
  },
  {
    title: "Drop Application & Deployment",
    component: DropApplicationRunner,
  },
  {
    title: "Create Entity",
    component: CreateEntityRunner,
  },
  {
    title: "Drop Entity",
    component: DeleteEntityRunner,
  },
  // // {
  // //   title: "Import Entity From Spreadsheet",
  // //   component: ImportEntityFromSpreadsheetRunner,
  // // },
  {
    title: "Lend Document",
    component: LibraryRunner_LendDocument,
  },
] as const;

// ################################################################################################
function formatYYYYMMDD_HHMMSS(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}${MM}${dd}_${HH}${mm}${ss}`;
}

// ################################################################################################
export const RunnersPage: React.FC<any> = (
  props: any // TODO: give a type to props!!!
) => {
  count++;
  
  // Auto-fetch configurations when the page loads
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: "Check page configurations loaded successfully",
    actionName: "check page configuration fetch"
  });
  
  // const deploymentUuid = adminConfigurationDeploymentParis.uuid;
  // const applicationUuid = selfApplicationLibrary.uuid;
  // const deploymentUuid = adminConfigurationDeploymentLibrary.uuid;
  const context = useMiroirContextService();
  const applicationDeploymentMap = context.applicationDeploymentMap;

  return (
    <ReportPageContextProvider>
      <PageContainer>
        <h1>Runners</h1>
        This is the Admin page. It has been rendered {count} times.
        <br />
        {/* path: {testSubPartPathArray.join(".")} */}
          {/* <ApplicationSelector
            applicationUuid={currentApplication}
            onApplicationChange={setCurrentApplication}
          />
        <br /> */}
        {runnerConfigs.map((config, index) => {
          const RunnerComponent = config.component;
          return (
            <Accordion key={index} style={{ marginBottom: 12 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <div style={{ fontWeight: 500 }}>{config.title}</div>
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
        })}
      </PageContainer>
    </ReportPageContextProvider>
  );
};
