// import { z } from "zod";

import {
  MiroirLoggerFactory,
  type LoggerInterface
} from "miroir-core";
import { packageName } from "../../../constants.js";
import { PageContainer } from "../components/Page/PageContainer.js";
import { ReportPageContextProvider } from "../components/Reports/ReportPageContext.js";
import { runnerConfigs, RunnerList } from '../components/Runners/RunnersList';
import { cleanLevel } from "../constants.js";
import { useMiroirContextService } from '../MiroirContextReactProvider';
import { usePageConfiguration } from "../services/index.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "PersistenceReduxSaga"), "UI",
).then((logger: LoggerInterface) => {log = logger});

let count = 0;

const pageLabel = "Admin";

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
  
  const context = useMiroirContextService();
  const applicationDeploymentMap = context.applicationDeploymentMap;

  return (
    <ReportPageContextProvider>
      <PageContainer>
        <h1>Runners</h1>
        {/* This is the Admin page. It has been rendered {count} times.
        <br /> */}
        <RunnerList config={runnerConfigs} applicationDeploymentMap={applicationDeploymentMap} />
      </PageContainer>
    </ReportPageContextProvider>
  );
};
