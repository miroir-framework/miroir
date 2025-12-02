import { useMemo } from "react";

import type {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  CompositeActionTemplate,
  EndpointDefinition,
  LoggerInterface,
  MiroirModelEnvironment,
  ReduxDeploymentsState,
  SyncBoxedExtractorOrQueryRunnerMap,
  Uuid
} from "miroir-core";
import {
  type Action,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  entityDeployment,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  MiroirLoggerFactory
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

// ################################################################################################
export const LibraryRunner_LendDocument: React.FC<LibraryRunner_LendDocumentProps> = ({
}) => {
  const runnerName: string = "lendDocument";
  const runnerLabel: string = "Lend Document";
  const deploymentUuid: Uuid = adminConfigurationDeploymentLibrary.uuid;
  const libraryAppModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(adminConfigurationDeploymentLibrary.uuid);

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

  const currentEndpointUuid = "212f2784-5b68-43b2-8ee0-89b1c6fdd0de";
  const domainActionType = "lendDocument";
  
  const currentEndpointDefinition: EndpointDefinition | undefined = libraryAppModelEnvironment?.currentModel?.endpoints?.find(
    (ep) => ep.uuid == currentEndpointUuid
  );

  const currentActionDefinition:Action | undefined = currentEndpointDefinition?.definition.actions.find(
    (ac) => ac.actionParameters.actionType.definition == domainActionType
  );

  const formMlSchema: FormMlSchema = useMemo(
    () => ({
      formMlSchemaType: "mlSchema",
      mlSchema: {
        type: "object",
        definition: {
          [runnerName]: { type: "object", definition: currentActionDefinition?.actionParameters??{} },
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
      adminConfigurationDeploymentLibrary.uuid,
      libraryAppModelEnvironment,
      {}, // transformerParams
      {}, // contextResults
      deploymentEntityState // TODO: keep this? improve so that it does not depend on entire deployment state
    );
    return result;
  }, [formMlSchema]);

  const deploymentUuidQuery:
    | BoxedQueryWithExtractorCombinerTransformer
    | BoxedQueryTemplateWithExtractorCombinerTransformer
    | undefined = {
    queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
    deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
    pageParams: {},
    queryParams: {},
    contextResults: {},
    extractorTemplates: {
      deployments: {
        label: "deployments of the application",
        // extractorOrCombinerType: "extractorByEntityReturningObjectList",
        extractorTemplateType: "extractorTemplateForObjectListByEntity",
        parentUuid: entityDeployment.uuid,
        parentName: entityDeployment.name,
        applicationSection: "data",
        filter: {
          attributeName: "adminApplication",
          value: {
            transformerType: "mustacheStringTemplate",
            interpolation: "build",
            definition: `{{${runnerName}.application}}`,
          },
        },
      },
    },
  } as BoxedQueryTemplateWithExtractorCombinerTransformer;

  // const deleteEntityActionTemplate = useMemo((): CompositeActionTemplate => {
  //   return {
  //     actionType: "compositeAction",
  //     actionLabel: runnerLabel,
  //     actionName: "sequence",
  //     definition: [
  //       // Step 1: Query to get the deployment UUID from the selected application
  //       {
  //         actionType: "compositeRunBoxedExtractorOrQueryAction",
  //         actionLabel: "getDeploymentForApplication",
  //         nameGivenToResult: "deploymentInfo",
  //         query: {
  //           actionType: "runBoxedExtractorOrQueryAction",
  //           actionName: "runQuery",
  //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //           deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
  //           payload: {
  //             applicationSection: "data",
  //             query: {
  //               queryType: "boxedQueryWithExtractorCombinerTransformer",
  //               deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
  //               pageParams: {},
  //               queryParams: {},
  //               contextResults: {},
  //               extractors: {
  //                 deployments: {
  //                   label: "deployments of the application",
  //                   extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //                   parentUuid: entityDeployment.uuid,
  //                   parentName: entityDeployment.name,
  //                   applicationSection: "data",
  //                   filter: {
  //                     attributeName: "adminApplication",
  //                     value: {
  //                       transformerType: "mustacheStringTemplate",
  //                       interpolation: "build",
  //                       definition: `{{${runnerName}.application}}`,
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //       // infer entityDefintion from entity uuid
  //       {
  //         actionType: "compositeRunBoxedExtractorOrQueryAction",
  //         // actionType: "",
  //         actionLabel: "getEntityDefinitionForEntity",
  //         nameGivenToResult: "entityDefinitionInfo",
  //         query: {
  //           actionType: "runBoxedExtractorOrQueryAction",
  //           actionName: "runQuery",
  //           endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //           deploymentUuid: {
  //             transformerType: "getFromContext",
  //             interpolation: "runtime",
  //             // definition: "{{deploymentInfo.deployments.0.uuid}}",
  //             referencePath: ["deploymentInfo", "deployments", "0", "uuid"],
  //           } as any,
  //           payload: {
  //             applicationSection: "model",
  //             query: {
  //               queryType: "boxedQueryWithExtractorCombinerTransformer",
  //               deploymentUuid: {
  //                 transformerType: "getFromContext",
  //                 interpolation: "runtime",
  //                 // definition: "{{deploymentInfo.deployments.0.uuid}}",
  //                 referencePath: ["deploymentInfo", "deployments", "0", "uuid"],
  //               } as any,
  //               pageParams: {},
  //               queryParams: {},
  //               contextResults: {},
  //               extractors: {
  //                 entityDefinitions: {
  //                   label: "entityDefinitions of the deployment",
  //                   extractorOrCombinerType: "extractorByEntityReturningObjectList",
  //                   parentUuid: entityEntityDefinition.uuid,
  //                   parentName: entityEntityDefinition.name,
  //                   applicationSection: "model",
  //                   filter: {
  //                     attributeName: "entityUuid",
  //                     value: {
  //                       transformerType: "mustacheStringTemplate",
  //                       interpolation: "build",
  //                       definition: `{{${runnerName}.entity}}`,
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //       // createEntity action
  //       {
  //         actionType: "dropEntity",
  //         actionLabel: runnerName,
  //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //         deploymentUuid: {
  //           transformerType: "mustacheStringTemplate",
  //           interpolation: "runtime",
  //           definition: "{{deploymentInfo.deployments.0.uuid}}",
  //         } as any,
  //         payload: {
  //           entityUuid: {
  //             transformerType: "getFromParameters",
  //             interpolation: "build",
  //             referencePath: [runnerName, "entity"],
  //           } as any,
  //           entityDefinitionUuid: {
  //             transformerType: "getFromContext",
  //             interpolation: "runtime",
  //             referencePath: ["entityDefinitionInfo", "entityDefinitions", "0", "uuid"],
  //           } as any,
  //         },
  //       },
  //       {
  //         actionType: "commit",
  //         actionLabel: "commit",
  //         endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
  //         deploymentUuid: {
  //           transformerType: "mustacheStringTemplate",
  //           interpolation: "runtime",
  //           definition: "{{deploymentInfo.deployments.0.uuid}}",
  //         } as any,
  //       },
  //     ],
  //   };
  // }, [runnerName, runnerLabel]);

  const action: CompositeActionTemplate = useMemo((): CompositeActionTemplate => {
    return {
      actionType: "compositeAction",
      actionLabel: runnerLabel,
      actionName: "sequence",
      definition: [
        {
          transformerType: "getFromParameters",
          interpolation: "build",
          // referencePath: [runnerName, "lendDocumentAction"],
          referencePath: [runnerName],
        }
      ],
    };
  }, [runnerName, runnerLabel]);
  
  return (
    <>
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${runnerName} currentActionDefinition`}
        data={currentActionDefinition}
        initiallyUnfolded={false}
      />
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${runnerName} formMlSchema`}
        data={formMlSchema}
        initiallyUnfolded={false}
      />
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${runnerName} initialFormValue`}
        data={initialFormValue}
        initiallyUnfolded={false}
      />
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${runnerName} action`}
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
          LibraryRunner_LendDocument: endpoint definition not found for uuid {currentEndpointUuid}
          <ThemedOnScreenDebug
            label="libraryAppModelEnvironment"
            data={libraryAppModelEnvironment?.currentModel?.endpoints}
          />
        </div>
      ) : (
        <OuterRunnerView
          runnerName={runnerName}
          deploymentUuid={deploymentUuid}
          deploymentUuidQuery={deploymentUuidQuery}
          formMlSchema={formMlSchema}
          initialFormValue={initialFormValue}
          action={{
            actionType: "compositeActionTemplate",
            compositeActionTemplate: action,
          }}
          labelElement={<h2>{runnerLabel}</h2>}
          formikValuePathAsString={runnerName}
          formLabel={runnerLabel}
          displaySubmitButton="onFirstLine"
          useActionButton={true}
        />
      )}
    </>
  );
};
