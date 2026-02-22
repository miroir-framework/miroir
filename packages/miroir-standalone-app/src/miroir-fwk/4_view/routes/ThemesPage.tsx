// import { z } from "zod";

import {
  defaultSelfApplicationDeploymentMap,
  MiroirLoggerFactory,
  miroirThemeSchema,
  selfApplicationDeploymentMiroir,
  selfApplicationMiroir,
  type JzodObject,
  type LoggerInterface
} from "miroir-core";
import { packageName } from "../../../constants.js";
import { PageContainer } from "../components/Page/PageContainer.js";
import { ReportPageContextProvider } from "../components/Reports/ReportPageContext.js";
import { runnerConfigs, RunnerList } from '../components/Runners/RunnersList';
import { cleanLevel } from "../constants.js";
import { useMiroirContextService } from '../MiroirContextReactProvider';
import { usePageConfiguration } from "../services/index.js";
import { TypedValueObjectEditor } from "../components/Reports/TypedValueObjectEditor.js";
import { TypedValueObjectEditorWithFormik } from "../components/Reports/TypedValueObjectEditorWithFormik.js";
import { defaultMiroirTheme } from "../components/Themes/MiroirTheme.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "PersistenceReduxSaga"), "UI",
).then((logger: LoggerInterface) => {log = logger});

let count = 0;

const pageLabel = "Admin";

// ################################################################################################
export const ThemesPage: React.FC<any> = (
  props: any // TODO: give a type to props!!!
) => {
  count++;
  
  // Auto-fetch configurations when the page loads
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: "Themes page configurations loaded successfully",
    actionName: "Themes page configuration fetch"
  });
  
  const context = useMiroirContextService();
  const applicationDeploymentMap = context.applicationDeploymentMap;

  const targetSchema:JzodObject = {
    type: "object",
    definition: {
      themesPage: miroirThemeSchema.mlSchema as JzodObject
    }
  };
  const initialFormValue = {
    themesPage: defaultMiroirTheme
  };
  return (
    <ReportPageContextProvider>
      <PageContainer>
        <h1>Themes</h1>
        {/* This is the Admin page. It has been rendered {count} times.
        <br /> */}
        {/* <RunnerList config={runnerConfigs} applicationDeploymentMap={applicationDeploymentMap} /> */}
        <TypedValueObjectEditorWithFormik
          formLabel="Themes"
          labelElement={<h2>Themes</h2>}
          application={selfApplicationMiroir.uuid}
          applicationDeploymentMap={defaultSelfApplicationDeploymentMap}
          deploymentUuid={selfApplicationDeploymentMiroir.uuid}
          applicationSection="model"
          formValueMLSchema={targetSchema}
          initialValueObject={initialFormValue}
          formikValuePathAsString={"themesPage"}
          zoomInPath=""
          maxRenderDepth={Infinity}
          onSubmit={(data: any)=>{return Promise.resolve(log.info("Submitted data:", data))}}
          // displaySubmitButton={displaySubmitButton}
          // useActionButton={useActionButton}
          valueObjectEditMode="create" // N/A
        />
  
      </PageContainer>
    </ReportPageContextProvider>
  );
};
