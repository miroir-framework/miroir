import React, { useState, useCallback, useMemo } from 'react';
import {
  LoggerInterface,
  MiroirLoggerFactory,
  EntityInstance,
  JzodElement,
  TransformerForRuntime,
  Uuid,
  jzodTypeCheck,
  ResolvedJzodSchemaReturnType,
  entityDefinitionTransformerDefinition,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  type ReduxDeploymentsState,
  type SyncBoxedExtractorOrQueryRunnerMap,
  adminConfigurationDeploymentMiroir,
  miroirFundamentalJzodSchema,
  type JzodSchema,
  type MetaModel,
  type MiroirModelEnvironment,
} from 'miroir-core';
import { Formik, FormikProps } from 'formik';

import { packageName } from '../../../../constants';
import { cleanLevel } from '../../constants';
import { JzodElementEditor } from '../ValueObjectEditor/JzodElementEditor';
import { useMiroirContextService } from '../../MiroirContextReactProvider';
import { useCurrentModel } from '../../ReduxHooks';
import {
  ThemedCodeBlock,
  ThemedContainer,
  ThemedHeaderSection,
  ThemedText,
  ThemedTitle,
} from '../Themes/ThemedComponents';
import { ReportSectionEntityInstance } from '../Reports/ReportSectionEntityInstance';
import { getMemoizedReduxDeploymentsStateSelectorMap, type ReduxStateWithUndoRedo } from 'miroir-localcache-redux';
import { useSelector } from 'react-redux';

// ################################################################################################
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// Safe stringify function that prevents "Invalid string length" errors
// ################################################################################################
function safeStringify(obj: any, maxLength: number = 2000): string {
  try {
    const str = JSON.stringify(obj, null, 2);
    if (str && str.length > maxLength) {
      return str.substring(0, maxLength) + "... [truncated]";
    }
    return str || "[unable to stringify]";
  } catch (error) {
    return `[stringify error: ${error instanceof Error ? error.message : 'unknown'}]`;
  }
}

// ################################################################################################
export interface TransformerEditorProps {
  deploymentUuid: Uuid;
  entityUuid: Uuid;
}

// ################################################################################################
export const TransformerEditor: React.FC<TransformerEditorProps> = (props) => {
  const { deploymentUuid, entityUuid } = props;
  const context = useMiroirContextService();
  const currentModel = useCurrentModel(deploymentUuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  const currentMiroirModelEnvironment: MiroirModelEnvironment = useMemo(() => {
    return {
      miroirFundamentalJzodSchema: context.miroirFundamentalJzodSchema?? miroirFundamentalJzodSchema as JzodSchema,
      miroirMetaModel: miroirMetaModel,
      currentModel: currentModel,
    };
  }, [
    miroirMetaModel,
    currentModel,
    context.miroirFundamentalJzodSchema,
  ]);

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
      getMemoizedReduxDeploymentsStateSelectorMap();

  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        () => ({}),
        currentMiroirModelEnvironment
      )
  );

  // Initial transformer definition based on the actual TransformerDefinition schema
  // const [currentTransformerDefinition, setCurrentTransformerDefinition] = useState<any>({
  //   uuid: "new-transformer-" + Math.random().toString(36).substr(2, 9),
  //   parentName: "TransformerDefinition",
  //   parentUuid: deploymentUuid,
  //   classification: "test",
  //   name: "NewTransformer",
  //   defaultLabel: "New Transformer",
  //   description: "A new transformer definition",
  //   transformerImplementation: {
  //     transformerImplementationType: "transformer",
  //     definition: {
  //       interpolation: "runtime",
  //       transformerType: "constant",
  //       value: "Hello World"
  //     }
  //   }
  // });

  // State for folding management
  // const [foldedItems, setFoldedItems] = useState<{ [k: string]: boolean }>({});

  // TransformerDefinition schema based on the provided JSON - simplified for now
  const transformerDefinitionSchema: JzodElement = entityDefinitionTransformerDefinition.jzodSchema;
      // const defaultFormValuesObject =
      //   currentReportTargetEntity &&
      //   currentReportTargetEntityDefinition &&
      //   currentReportTargetEntityDefinition?.jzodSchema &&
      //   context.miroirFundamentalJzodSchema
      //     ? getDefaultValueForJzodSchemaWithResolutionNonHook(
      //         currentReportTargetEntityDefinition?.jzodSchema,
      //         undefined, // rootObject
      //         "", // rootLessListKey,
      //         undefined, // No need to pass currentDefaultValue here
      //         [], // currentPath on value is root
      //         deploymentEntityState,
      //         false, // forceOptional
      //         props.deploymentUuid,
      //         currentMiroirModelEnvironment,
      //         {}, // relativeReferenceJzodContext
      //       )
      //     : undefined;

  const [currentTransformerDefinition, setCurrentTransformerDefinition] = useState<any>(
    getDefaultValueForJzodSchemaWithResolutionNonHook(
      transformerDefinitionSchema,
      undefined, // rootObject
      "", // rootLessListKey,
      undefined, // No need to pass currentDefaultValue here
      [], // currentPath on value is root
      deploymentEntityState,
      false, // forceOptional
      deploymentUuid,
      currentMiroirModelEnvironment,
      {} // relativeReferenceJzodContext
    )
  );

  log.info(
    "TransformerEditor initialized with currentTransformerDefinition",
    currentTransformerDefinition,
    "TransformerDefinition schema",
    transformerDefinitionSchema
  );
  // const transformerDefinitionSchema: JzodElement = useMemo(() => ({
  //   type: "object",
  //   definition: {
  //     uuid: {
  //       type: "uuid"
  //     },
  //     parentName: {
  //       type: "string",
  //       optional: true
  //     },
  //     parentUuid: {
  //       type: "uuid"
  //     },
  //     classification: {
  //       type: "string",
  //       optional: true
  //     },
  //     name: {
  //       type: "string"
  //     },
  //     defaultLabel: {
  //       type: "string"
  //     },
  //     description: {
  //       type: "string",
  //       optional: true
  //     },
  //     transformerImplementation: {
  //       type: "object",
  //       definition: {
  //         transformerImplementationType: {
  //           type: "enum",
  //           definition: ["libraryImplementation", "transformer"]
  //         },
  //         definition: {
  //           type: "object",
  //           optional: true,
  //           definition: {
  //             interpolation: {
  //               type: "enum",
  //               definition: ["runtime", "build"]
  //             },
  //             transformerType: {
  //               type: "enum",
  //               definition: ["constant", "contextReference", "mustacheStringTemplate"]
  //             },
  //             value: {
  //               type: "string",
  //               optional: true
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // }), []);

  // Handle transformer definition changes
  const handleTransformerDefinitionChange = useCallback((newTransformerDefinition: any) => {
    log.info("handleTransformerDefinitionChange", newTransformerDefinition);
    setCurrentTransformerDefinition(newTransformerDefinition);
  }, []);

  return (
    <ThemedContainer>
      <ThemedHeaderSection>
        <ThemedTitle>Transformer Editor for Entity {entityUuid}</ThemedTitle>
      </ThemedHeaderSection>

      {/* 3-Pane Layout */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Top Pane: Transformer Definition Editor */}
        {/* <ThemedContainer>
          <ThemedHeaderSection>
            <ThemedTitle>Transformer Definition Editor</ThemedTitle>
          </ThemedHeaderSection>
          
          <Formik
            enableReinitialize={true}
            initialValues={{ transformerDefinition: currentTransformerDefinition }}
            onSubmit={(values) => {
              log.info("Form submitted with values:", values);
              setCurrentTransformerDefinition(values.transformerDefinition);
            }}
          >
            {(formik: FormikProps<any>) => {
              const effectiveRawJzodSchema: JzodElement = useMemo(() => ({
                type: "object",
                definition: { transformerDefinition: transformerDefinitionSchema }
              }), [transformerDefinitionSchema]);

              const resolvedJzodSchema: ResolvedJzodSchemaReturnType | undefined = useMemo(() => {
                try {
                  return context.miroirFundamentalJzodSchema &&
                    effectiveRawJzodSchema &&
                    formik.values &&
                    currentModel
                    ? jzodTypeCheck(
                        effectiveRawJzodSchema,
                        formik.values,
                        [], // currentValuePath
                        [], // currentTypePath
                        {
                          miroirFundamentalJzodSchema: context.miroirFundamentalJzodSchema,
                          currentModel,
                          miroirMetaModel: currentModel,
                        },
                        {}
                      )
                    : undefined;
                } catch (e) {
                  log.error("TransformerEditor jzodTypeCheck error", e);
                  return {
                    status: "error" as const,
                    valuePath: [],
                    typePath: [],
                    error: JSON.stringify(e, Object.getOwnPropertyNames(e)),
                  };
                }
              }, [formik.values, effectiveRawJzodSchema, context, currentModel]);

              return (
                <form onSubmit={formik.handleSubmit}>
                  {resolvedJzodSchema && resolvedJzodSchema.status === "ok" ? (
                    <JzodElementEditor
                      name="transformerDefinition"
                      listKey="ROOT"
                      rootLessListKey=""
                      rootLessListKeyArray={[]}
                      currentDeploymentUuid={deploymentUuid}
                      currentApplicationSection="data"
                      resolvedElementJzodSchema={resolvedJzodSchema.resolvedSchema}
                      typeCheckKeyMap={resolvedJzodSchema.keyMap}
                      indentLevel={0}
                      foldedObjectAttributeOrArrayItems={foldedItems}
                      setFoldedObjectAttributeOrArrayItems={setFoldedItems}
                      foreignKeyObjects={{}}
                      readOnly={false}
                    />
                  ) : (
                    <div>Schema resolution error: {JSON.stringify(resolvedJzodSchema)}</div>
                  )}
                </form>
              );
            }}
          </Formik>
        </ThemedContainer> */}
        <ReportSectionEntityInstance
          domainElement={{}}
          instance={currentTransformerDefinition}
          applicationSection={"model"}
          deploymentUuid={deploymentUuid}
          entityUuid={entityUuid}
        />
        {/* Bottom Panes: Side by side */}
        <div style={{ display: "flex", gap: "20px", minHeight: "300px" }}>
          {/* Left Pane: Entity Instance */}
          <ThemedContainer style={{ flex: 1 }}>
            <ThemedHeaderSection>
              <ThemedTitle>Entity Instance ({entityUuid})</ThemedTitle>
            </ThemedHeaderSection>
            <ThemedCodeBlock>
              {safeStringify(
                {
                  message: "Random entity instance will be displayed here",
                  entityUuid: entityUuid,
                  deploymentUuid: deploymentUuid,
                },
                2
              )}
            </ThemedCodeBlock>
          </ThemedContainer>

          {/* Right Pane: Transformation Result */}
          <ThemedContainer style={{ flex: 1 }}>
            <ThemedHeaderSection>
              <ThemedTitle>Transformation Result</ThemedTitle>
            </ThemedHeaderSection>
            <ThemedCodeBlock>
              {currentTransformerDefinition?.transformerImplementation?.definition
                ? safeStringify(
                    currentTransformerDefinition.transformerImplementation.definition,
                    2
                  )
                : "No transformer implementation defined"}
            </ThemedCodeBlock>
          </ThemedContainer>
        </div>
      </div>

      {/* Debug Panel */}
      <ThemedContainer style={{ marginTop: "20px" }}>
        <ThemedHeaderSection>
          <ThemedTitle>Current Transformer Definition (Debug)</ThemedTitle>
        </ThemedHeaderSection>
        <ThemedCodeBlock>{safeStringify(currentTransformerDefinition, 2)}</ThemedCodeBlock>
      </ThemedContainer>
    </ThemedContainer>
  );
};
