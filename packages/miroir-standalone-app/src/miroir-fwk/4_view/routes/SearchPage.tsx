import { Formik } from "formik";
import { Params, useParams } from "react-router-dom";

import {
  LoggerInterface,
  MiroirLoggerFactory,
  adminApplicationLibrary,
  adminConfigurationDeploymentLibrary,
  entityBook,
  type Uuid
} from "miroir-core";

import { packageName, type ReportUrlParamKeys } from "../../../constants";
import { PageContainer } from "../components/Page/PageContainer";
import {
  EntityInstanceSelectorPanel,
  formikPath_entityInstanceSelectorPanel,
} from "../components/TransformerEditor/EntityInstanceSelectorPanel";
import { cleanLevel } from "../constants";
import { usePageConfiguration } from "../services";
import { useMiroirContextService } from "../MiroirContextReactProvider";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SearchPage"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// Search Page - displays only the EntityInstanceSelectorPanel for browsing entities
// ################################################################################################
export function SearchPage() {
  // const deploymentUuid: Uuid = adminConfigurationDeploymentMiroir.uuid;
  const pageParams: Params<ReportUrlParamKeys> = useParams<ReportUrlParamKeys>();
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: `Report page configurations loaded for ${pageParams.deploymentUuid}`,
    actionName: "report page configuration fetch",
  });

  const context = useMiroirContextService();
  const persistedState = context.toolsPageState.transformerEditor;
  const showAllInstances = persistedState?.showAllInstances || false;

  const deploymentUuid: Uuid = adminConfigurationDeploymentLibrary.uuid;
  
  // Initialize with a default entity (Entity entity itself)
  // const initialEntityUuid: Uuid = "381ab1be-337f-4198-b1d3-f686867fc1dd"; // Entity entityDefinition UUID
  const initialEntityUuid: Uuid = entityBook.uuid;

  const initialFormValues = {
    [formikPath_entityInstanceSelectorPanel]: {
      mode: "instance",
      application: adminApplicationLibrary.uuid
    },
    transformerEditor_input: {},
    selectedEntityInstance: undefined,
    entityInstances: [],
  };

  return (
    <PageContainer>
      <Formik
        enableReinitialize={true}
        initialValues={initialFormValues as any}
        onSubmit={async () => {
          // No-op for search page
        }}
        validateOnChange={false}
        validateOnBlur={false}
      >
        {/* {(formikContext: FormikProps<any>) => ( */}
        <EntityInstanceSelectorPanel
          deploymentUuid={deploymentUuid}
          initialEntityUuid={initialEntityUuid}
          showAllInstances={showAllInstances}
        />
        {/* )} */}
      </Formik>
    </PageContainer>
  );
}
