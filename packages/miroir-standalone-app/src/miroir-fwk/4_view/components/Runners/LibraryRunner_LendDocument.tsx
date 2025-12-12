import { useMemo } from "react";

import {
  CompositeActionTemplate,
  defaultSelfApplicationDeploymentMap,
  EndpointDefinition,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  type LoggerInterface,
  MiroirLoggerFactory,
  type MiroirModelEnvironment,
  type ReduxDeploymentsState,
  selfApplicationLibrary,
  type SyncBoxedExtractorOrQueryRunnerMap,
  Uuid,
  type Action
} from "miroir-core";
import { getMemoizedReduxDeploymentsStateSelectorMap, type ReduxStateWithUndoRedo } from "miroir-localcache-redux";
import { useSelector } from "react-redux";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { ThemedOnScreenDebug } from "../Themes/BasicComponents.js";
import { OuterRunnerView } from "./OuterRunnerView.js";
import type { FormMlSchema } from "./RunnerInterface.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "CreateEntityRunner"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export interface LibraryRunner_LendDocumentProps {
  deploymentUuid: string;
}

const runnerDefinition = {
  application: selfApplicationLibrary.uuid,
  runnerName: "lendDocument",
  runnerLabel: "Lend Document",
  currentEndpointUuid : "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
  domainActionType : "lendDocument",
}
// ################################################################################################
export const LibraryRunner_LendDocument: React.FC<LibraryRunner_LendDocumentProps> = ({
}) => {

  const deploymentUuid: Uuid = defaultSelfApplicationDeploymentMap[runnerDefinition.application];
  const libraryAppModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(deploymentUuid);

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
        getMemoizedReduxDeploymentsStateSelectorMap();
  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        () => ({}),
        libraryAppModelEnvironment,
      )
  );

  
  const currentEndpointDefinition: EndpointDefinition | undefined = libraryAppModelEnvironment?.currentModel?.endpoints?.find(
    (ep) => ep.uuid == runnerDefinition.currentEndpointUuid
  );

  const currentActionDefinition:Action | undefined = currentEndpointDefinition?.definition.actions.find(
    (ac) => ac.actionParameters.actionType.definition == runnerDefinition.domainActionType
  );

  const formMlSchema: FormMlSchema = useMemo(
    () => ({
      formMlSchemaType: "mlSchema",
      mlSchema: {
        type: "object",
        definition: {
          [runnerDefinition.runnerName]: { type: "object", definition: currentActionDefinition?.actionParameters??{} },
        },
      },
    }),
    [currentActionDefinition]
  );

  const initialFormValue = useMemo(() => {
    const result = getDefaultValueForJzodSchemaWithResolutionNonHook(
      "build",
      formMlSchema.mlSchema,
      undefined, // rootObject
      "", // rootLessListKey,
      undefined, // No need to pass currentDefaultValue here
      [], // currentPath on value is root
      false, // forceOptional
      deploymentUuid,
      libraryAppModelEnvironment,
      {}, // transformerParams
      {}, // contextResults
      deploymentEntityState // TODO: keep this? improve so that it does not depend on entire deployment state
    );
    return result;
  }, [formMlSchema]);

  const action: CompositeActionTemplate = useMemo((): CompositeActionTemplate => {
    return {
      actionType: "compositeActionSequence",
      actionLabel: runnerDefinition.runnerLabel,
      application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        definition: [
          {
            transformerType: "getFromParameters",
            interpolation: "build",
            referencePath: [runnerDefinition.runnerName],
          },
        ],
      },
    };
  }, [runnerDefinition]);
  
  return (
    <>
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${runnerDefinition.runnerName} currentActionDefinition`}
        data={currentActionDefinition}
        initiallyUnfolded={false}
      />
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${runnerDefinition.runnerName} formMlSchema`}
        data={formMlSchema}
        initiallyUnfolded={false}
      />
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${runnerDefinition.runnerName} initialFormValue`}
        data={initialFormValue}
        initiallyUnfolded={false}
      />
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${runnerDefinition.runnerName} action`}
        data={action}
        initiallyUnfolded={false}
      />
      {/* <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${runnerName} deploymentUuidQuery`}
        data={deploymentUuidQuery}
        initiallyUnfolded={false}
      /> */}
      {!currentEndpointDefinition ? (
        <div>
          LibraryRunner_LendDocument: endpoint definition not found for uuid {runnerDefinition.currentEndpointUuid}
          <ThemedOnScreenDebug
            label="libraryAppModelEnvironment"
            data={libraryAppModelEnvironment?.currentModel?.endpoints}
          />
        </div>
      ) : (
        <OuterRunnerView
          runnerName={runnerDefinition.runnerName}
          deploymentUuid={deploymentUuid}
          formMlSchema={formMlSchema}
          initialFormValue={initialFormValue}
          action={{
            actionType: "compositeActionTemplate",
            compositeActionTemplate: action,
          }}
          labelElement={<h2>{runnerDefinition.runnerLabel}</h2>}
          formikValuePathAsString={runnerDefinition.runnerName}
          formLabel={runnerDefinition.runnerLabel}
          displaySubmitButton="onFirstLine"
          useActionButton={true}
        />
      )}
    </>
  );
};
