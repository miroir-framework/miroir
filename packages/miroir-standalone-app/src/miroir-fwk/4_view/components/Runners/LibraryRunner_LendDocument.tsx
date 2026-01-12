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
  type Action,
  type JzodObject,
  type Runner,
  type ApplicationDeploymentMap
} from "miroir-core";
import { getMemoizedReduxDeploymentsStateSelectorMap, type ReduxStateWithUndoRedo } from "miroir-localcache-redux";
import { useSelector } from "react-redux";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { ThemedOnScreenDebug } from "../Themes/BasicComponents.js";
import { RunnerView, StoredRunnerView } from "./RunnerView.js";
import type { FormMLSchema } from "./RunnerInterface.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "CreateEntityRunner"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export interface LibraryRunner_LendDocumentProps {
  applicationDeploymentMap: ApplicationDeploymentMap;
}

// const runnerDefinition = {
//   application: selfApplicationLibrary.uuid,
//   runnerName: "lendDocument",
//   runnerLabel: "Lend Document",
//   currentEndpointUuid : "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
//   domainActionType : "lendDocument",
// }

const storedRunnerDefinition: Runner = {
  uuid: "44313751-b0e5-4132-bb12-a544806e759b",
  parentUuid: "e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd",
  application: selfApplicationLibrary.uuid,
  name: "lendDocument",
  defaultLabel: "Lend Document",
  parentName: "Runner",
  definition: {
    runnerType: "actionRunner",
    endpoint : "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
    action : "lendDocument",
  }
};

// ################################################################################################
export const LibraryRunner_LendDocument: React.FC<LibraryRunner_LendDocumentProps> = (props) => {

  const deploymentUuid: Uuid = defaultSelfApplicationDeploymentMap[storedRunnerDefinition.application];
  const libraryAppModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    storedRunnerDefinition.application,
    defaultSelfApplicationDeploymentMap
  );

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
        getMemoizedReduxDeploymentsStateSelectorMap();
  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        defaultSelfApplicationDeploymentMap,
        () => ({}),
        libraryAppModelEnvironment,
      )
  );

  
  const currentEndpointDefinition: EndpointDefinition | undefined =
    storedRunnerDefinition.definition.runnerType === "actionRunner"
      ? libraryAppModelEnvironment?.currentModel?.endpoints?.find(
          (ep) => ep.uuid == (storedRunnerDefinition.definition as any).endpoint
        )
      : undefined;

  const currentActionDefinition: Action | undefined =
    storedRunnerDefinition.definition.runnerType === "actionRunner"
      ? currentEndpointDefinition?.definition.actions.find(
          (ac) => ac.actionParameters.actionType.definition == (storedRunnerDefinition.definition as any).action
        )
      : undefined;

  const formMLSchema: FormMLSchema = useMemo(
    () => ({
      formMLSchemaType: "mlSchema",
      mlSchema: {
        type: "object",
        definition: {
          // [runnerDefinition.runnerName]: { type: "object", definition: currentActionDefinition?.actionParameters??{} },
          [storedRunnerDefinition.name]: { type: "object", definition: currentActionDefinition?.actionParameters??{} },
        },
      } as JzodObject,
    }),
    [currentActionDefinition]
  );

  const initialFormValue = useMemo(() => {
    const result = getDefaultValueForJzodSchemaWithResolutionNonHook(
      "build",
      formMLSchema.mlSchema,
      undefined, // rootObject
      "", // rootLessListKey,
      undefined, // No need to pass currentDefaultValue here
      [], // currentPath on value is root
      false, // forceOptional
      storedRunnerDefinition.application,
      defaultSelfApplicationDeploymentMap,
      deploymentUuid,
      libraryAppModelEnvironment,
      {}, // transformerParams
      {}, // contextResults
      deploymentEntityState // TODO: keep this? improve so that it does not depend on entire deployment state
    );
    return result;
  }, [formMLSchema]);

  const action: CompositeActionTemplate = useMemo((): CompositeActionTemplate => {
    return {
      actionType: "compositeActionSequence",
      actionLabel: storedRunnerDefinition.defaultLabel,
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        application: storedRunnerDefinition.application,
        definition: [
          {
            transformerType: "getFromParameters",
            interpolation: "build",
            referencePath: [storedRunnerDefinition.name],
          } as any, // TODO: fix type!!
        ],
      },
    };
  }, [storedRunnerDefinition]);
  
  return (
    <>
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${storedRunnerDefinition.name} deploymentUuid`}
        data={deploymentUuid}
        // initiallyUnfolded={false}
      />
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${storedRunnerDefinition.name} currentActionDefinition`}
        data={currentActionDefinition}
        initiallyUnfolded={false}
      />
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${storedRunnerDefinition.name} formMLSchema`}
        data={formMLSchema}
        initiallyUnfolded={false}
      />
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${storedRunnerDefinition.name} initialFormValue`}
        data={initialFormValue}
        initiallyUnfolded={false}
      />
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${storedRunnerDefinition.name} action`}
        data={action}
        initiallyUnfolded={false}
      />
      {/* <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${runnerName} deploymentUuidQuery`}
        data={deploymentUuidQuery}
        initiallyUnfolded={false}
      /> */}
      {storedRunnerDefinition.definition.runnerType == "actionRunner" &&
      !currentEndpointDefinition ? (
        <div>
          LibraryRunner_LendDocument: endpoint definition not found for uuid{" "}
          {storedRunnerDefinition.definition.endpoint}
          <ThemedOnScreenDebug
            label="libraryAppModelEnvironment"
            data={libraryAppModelEnvironment?.currentModel?.endpoints}
          />
        </div>
      ) : (
        // <StoredRunnerView
        //   applicationUuid={selfApplicationLibrary.uuid}
        //   applicationDeploymentMap={props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap}
        //   runnerUuid="cc853632-f158-43fa-b9ed-437c9c25f539"
        // />
        <RunnerView
          runnerName={storedRunnerDefinition.name}
          application={storedRunnerDefinition.application}
          applicationDeploymentMap={defaultSelfApplicationDeploymentMap}
          // deploymentUuid={deploymentUuid}
          formMLSchema={formMLSchema}
          initialFormValue={initialFormValue}
          action={{
            actionType: "compositeActionTemplate",
            compositeActionTemplate: action,
          }}
          formikValuePathAsString={storedRunnerDefinition.name}
          formLabel={storedRunnerDefinition.defaultLabel}
          displaySubmitButton="onFirstLine"
          useActionButton={false}
        />
      )}
    </>
  );
};
