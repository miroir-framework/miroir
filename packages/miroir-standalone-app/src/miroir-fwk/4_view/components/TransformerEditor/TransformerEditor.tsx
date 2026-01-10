import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { valueToJzod } from '@miroir-framework/jzod';
import {
  Domain2ElementFailed,
  LoggerInterface,
  MiroirLoggerFactory,
  Uuid,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentMiroir,
  adminSelfApplication,
  defaultAdminApplicationDeploymentMapNOTGOOD,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  defaultTransformerInput,
  entityApplicationForAdmin,
  entityDefinitionTransformerDefinition,
  getInnermostTransformerError,
  miroirFundamentalJzodSchema,
  safeStringify,
  selfApplicationMiroir,
  transformer_extended_apply_wrapper,
  type JzodElement,
  type JzodObject,
  type JzodSchema,
  type JzodUnion,
  type MetaModel,
  type MiroirModelEnvironment,
  type ReduxDeploymentsState,
  type SyncBoxedExtractorOrQueryRunnerMap
} from 'miroir-core';


import { Formik, type FormikProps } from 'formik';
import {
  type TransformerDefinition,
  type TransformerForBuildPlusRuntime
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { packageName } from '../../../../constants';
import { cleanLevel, lastSubmitButtonClicked } from '../../constants';
import { useMiroirContextService } from '../../MiroirContextReactProvider';
import { useCurrentModel, useCurrentModelEnvironment } from '../../ReduxHooks';
import {
  useDeploymentUuidFromApplicationUuid,
  useTransformer
} from "../Reports/ReportHooks";
import { useReportPageContext } from '../Reports/ReportPageContext';
import { TypedValueObjectEditor } from '../Reports/TypedValueObjectEditor';
import {
  ThemedContainer,
  ThemedFoldableContainer,
  ThemedHeaderSection,
  ThemedOnScreenHelper,
  ThemedTitle
} from "../Themes/index";
import { noValue } from '../ValueObjectEditor/JzodElementEditorInterface';
import { EntityInstanceSelectorPanel } from './EntityInstanceSelectorPanel';
import {
  formikPath_TransformerEditorInputModeSelector,
  type TransformerEditorFormikValueType,
  type TransformerEditorProps,
} from "./TransformerEditorInterface";
import { TransformerEventsPanel } from './TransformerEventsPanel';
import { TransformationResultPanel } from './TransformationResultPanel';
import { ThemedOnScreenDebug } from '../Themes/BasicComponents';
import { getMemoizedReduxDeploymentsStateSelectorMap, type ReduxStateWithUndoRedo } from 'miroir-localcache-redux';
import { useSelector } from 'react-redux';

// ################################################################################################
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerEditor"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export const TransformerEditor: React.FC<TransformerEditorProps> = (props) => {
  const runnerName: string = "transformerEditor";
  const runnerLabel: string = "Transformer Editor";

  // const formikPath_inputDeploymentUuid: string = "transformerEditor_input.defaultInput";
  // const formikPath_entityInstances: string = "transformerEditor_input.defaultInput";

  const {
    deploymentUuid: initialDeploymentUuid,
    entityUuid: initialEntityUuid,
    application,
    applicationDeploymentMap,
  } = props;
  // const application: Uuid = initialApplication;
  const deploymentUuid: Uuid = initialDeploymentUuid;
  const context = useMiroirContextService();
  const reportContext = useReportPageContext();
  const miroirContextService = useMiroirContextService();

 
  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    application,
    applicationDeploymentMap
  );

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
      getMemoizedReduxDeploymentsStateSelectorMap();
  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        applicationDeploymentMap,
        () => ({}),
        currentMiroirModelEnvironment
      )
  );
  
  // Ref for debouncing transformer definition updates when mode='here'
  const transformerUpdateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Get persisted state from context
  const persistedState = context.toolsPageState.transformerEditor;
  // const currentMode: "here" | "defined" = persistedState?.mode || "here";
  const currentHereTransformerDefinition: TransformerForBuildPlusRuntime =
    persistedState?.currentTransformerDefinition ?? { transformerType: "returnValue", value: null };
  // ##############################################################################################

  const showAllInstances = persistedState?.showAllInstances || false;

  
  // ##############################################################################################
  // Copy-to-clipboard state for transformer definition
  const [copiedToClipboard, setCopiedToClipboard] = useState<boolean>(false);

  const copyTransformerDefinitionToClipboard = useCallback(async () => {
    try {
      // Try to stringify as nicely as possible; safeStringify accepts a large maxLength to avoid truncation
      const text = safeStringify(currentHereTransformerDefinition, 1000000);

      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(text);
      } else if (
        typeof (window as any) !== "undefined" &&
        typeof (window as any).require === "function"
      ) {
        // Electron fallback
        try {
          const { clipboard } = (window as any).require("electron");
          clipboard.writeText(text);
        } catch (e) {
          // ignore and fall through to legacy copy
          throw e;
        }
      } else {
        // Legacy fallback using execCommand
        const el = document.createElement("textarea");
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }

      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      log.error("Failed to copy transformer definition to clipboard", error);
    }
  }, [currentHereTransformerDefinition]);

  const clearTransformerDefinition = useCallback(() => {
    // Assumption: a 'returnValue' transformer has shape { transformerType: 'returnValue', value: ... }
    const defaultConstantTransformer: any = {
      transformerType: "returnValue",
      interpolation: "runtime",
      value: "enter the wanted value here...", // Default to undefined value
    };

    context.updateTransformerEditorState({
      currentTransformerDefinition: defaultConstantTransformer,
    });
    // Clear previous transformation outputs
    // setTransformationResult(null);
    // setTransformationError(null);
  }, [context]);

  log.info("TransformerEditor currentTransformerDefinition:", currentHereTransformerDefinition);
  // log.info("TransformerEditor transformerDefinitionSchema:", transformerDefinitionSchema);
  // handle folding of TransfrormerEditor object attributes and array items
  useEffect(() => {
    if (persistedState && persistedState?.foldedObjectAttributeOrArrayItems) {
      reportContext.setFoldedObjectAttributeOrArrayItems(
        persistedState?.foldedObjectAttributeOrArrayItems
      );
    }
  }, [context, persistedState?.foldedObjectAttributeOrArrayItems]);

  // ################################################################################################
  // Handle transformer definition changes (form submission)
  // Note: For mode='here', updates are already handled by debounced useEffect
  // This mainly handles clearing activity tracker/events on submit
  const handleTransformerDefinitionSubmit = useCallback(
    async (formValuesAsParam: any) => {
      log.info(
        "handleTransformerDefinitionSubmit form values",
        formValuesAsParam,
        "button clicked:",
        formValuesAsParam[lastSubmitButtonClicked]
      );
      miroirContextService.miroirContext.miroirActivityTracker.resetResults();
      miroirContextService.miroirContext.miroirEventService.clear();

      // For mode='here', the transformer is already being updated via debounced useEffect
      // For mode='defined', the transformer is already updated when fetched
      // So this submit handler is mainly for clearing activity tracker/events
    },
    [miroirContextService, miroirContextService.miroirContext]
  );

  log.info(
    "Rendering TransformerEditor context.miroirContext.miroirEventService.events.size",
    context.miroirContext.miroirEventService.events.size
  );

  // ################################################################################################
  const initialFormValues = useMemo(() => {
    return {
      // For mode selector - transformer field is only used when mode='here'
      transformerEditor_transformer_selector: {
        // transformer: currentHereTransformerDefinition,
        mode: "none",
      },
      transformerEditor_input: {},
      [formikPath_TransformerEditorInputModeSelector]: {
        mode: "none",
        // input: "no input yet"
      },
      // For transformer editor when mode='here'
      transformerEditor_editor: {
        currentTransformerDefinition: currentHereTransformerDefinition,
      },
    };
  }, []); // Empty deps - initialize once with persisted state

  return (
    <ThemedContainer>
      <ThemedHeaderSection
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <ThemedTitle>
          {/* Transformer Editor for Entity "{currentReportTargetEntity?.name || selectedEntityUuid}" of */}
          {/* deployment {deploymentUuid} */}
          Transformer Editor
        </ThemedTitle>
        {/* <ThemedOnScreenHelper label="currentTransformerDefinition" data={currentTransformerDefinition} /> */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* copyTransformerDefinitionToClipboard */}
          <button
            onClick={copyTransformerDefinitionToClipboard}
            title={copiedToClipboard ? "Copied" : "Copy transformer definition to clipboard"}
            style={{
              padding: "6px 10px",
              fontSize: "13px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: copiedToClipboard ? "#e6ffe6" : "#f8f8f8",
              cursor: "pointer",
            }}
          >
            {copiedToClipboard ? "Copied" : "Copy"}
          </button>
          {/* clearTransformerDefinition */}
          <button
            onClick={clearTransformerDefinition}
            title={"Reset transformer to default returnValue transformer"}
            style={{
              padding: "6px 10px",
              fontSize: "13px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: "#fff4e6",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </ThemedHeaderSection>

      {/* 3-Pane Layout */}
      {/* <div style={{ display: "flex", gap: "20px" }}> */}
      {/* left Pane: Transformer Definition Editor */}
      <Formik
        enableReinitialize={true}
        initialValues={initialFormValues as any}
        onSubmit={async (values, { setSubmitting, setErrors }) => {
          try {
            log.info("onSubmit formik values", values);
            await handleTransformerDefinitionSubmit(values);
          } catch (e) {
            log.error(e);
          } finally {
            setSubmitting(false);
          }
        }}
        validateOnChange={false}
        validateOnBlur={false}
      >
        {
          /* Formik children as function to access formik context */ (
            formikContext: FormikProps<TransformerEditorFormikValueType>
          ) => {
            // ##################################################################################
            const transformerSelector_deploymentUuidFromApplicationUuid: Uuid =
              useDeploymentUuidFromApplicationUuid(
                (formikContext.values.transformerEditor_transformer_selector as any).application,
                applicationDeploymentMap
              );
            // ##################################################################################
            const transformerSelector_currentFetchedTransformerDefinition:
              | TransformerDefinition
              | Domain2ElementFailed
              | undefined = useTransformer(
                (formikContext.values.transformerEditor_transformer_selector as any).application,
                applicationDeploymentMap,
                transformerSelector_deploymentUuidFromApplicationUuid,
                (formikContext.values.transformerEditor_transformer_selector as any).transformerUuid
            );

            if (
              transformerSelector_currentFetchedTransformerDefinition instanceof
              Domain2ElementFailed
            ) {
              // should never happen
              throw new Error(
                "TransformerEditor: failed to get report data: " +
                  JSON.stringify(transformerSelector_currentFetchedTransformerDefinition, null, 2)
              );
            }

            // ##################################################################################
            // transformerEditor_transformer_selector persistedState -> formik
            useEffect(() => {
              log.info(
                "TransformerEditor: got new mode:",
                // formikContext.values.transformerEditor_transformer_selector.mode
                persistedState?.selector?.mode
              );
              if (formikContext.values.transformerEditor_transformer_selector.mode == "none") {
                if (persistedState?.selector?.mode && persistedState?.selector?.mode !== "none") {
                  // restore state from persistedState
                  log.info(
                    "TransformerEditor: initializing mode from persisted state:",
                    persistedState?.selector?.mode
                  );
                  formikContext.setFieldValue(
                    "transformerEditor_transformer_selector",
                    persistedState?.selector
                  );
                }
              }

              switch (formikContext.values[formikPath_TransformerEditorInputModeSelector].mode) {
                case "here": {
                  break;
                }
                case "instance": {
                  // clears the formik [formikPath_TransformerEditorInputModeSelector].input
                  if (
                    Object.hasOwn(formikContext.values[formikPath_TransformerEditorInputModeSelector], "input")
                  ) {
                    formikContext.setFieldValue(formikPath_TransformerEditorInputModeSelector, {
                      mode: "instance",
                    });
                  }
                  break;
                }
                case "none": {
                  // sets the formik input_selector from the persisted state input_selector, if there is one
                  if (persistedState?.input_selector?.mode) {
                    formikContext.setFieldValue(
                      formikPath_TransformerEditorInputModeSelector,
                      persistedState?.input_selector
                    );
                  } else {
                    formikContext.setFieldValue(formikPath_TransformerEditorInputModeSelector, {
                      mode: "here",
                      input: { placeholder: "put your input here..." },
                    });
                  }
                  break;
                }
              }

              // When mode is 'defined' and transformerUuid is changed, fetch transformer from stored definition and update formik context
              if (
                formikContext.values.transformerEditor_transformer_selector.mode === "defined" &&
                (formikContext.values.transformerEditor_transformer_selector as any).application &&
                (formikContext.values.transformerEditor_transformer_selector as any).transformerUuid &&
                (formikContext.values.transformerEditor_transformer_selector as any).transformerUuid !==
                  noValue.uuid &&
                (formikContext.values.transformerEditor_transformer_selector as any).transformerUuid !==
                  (persistedState?.selector as any).transformerUuid &&
                transformerSelector_currentFetchedTransformerDefinition &&
                typeof transformerSelector_currentFetchedTransformerDefinition == "object" &&
                transformerSelector_currentFetchedTransformerDefinition.transformerImplementation
                  ?.transformerImplementationType == "transformer"
              ) {
                log.info(
                  "TransformerEditor: updating context with stored transformer definition:",
                  transformerSelector_currentFetchedTransformerDefinition.transformerImplementation
                    ?.definition
                );
                formikContext.setFieldValue(
                  "transformerEditor_transformer_selector.transformer",
                  transformerSelector_currentFetchedTransformerDefinition.transformerImplementation
                    ?.definition
                );
              }
            }, [
              formikContext.values.transformerEditor_transformer_selector.mode,
              persistedState?.selector,
              transformerSelector_currentFetchedTransformerDefinition,
            ]);

            // ##################################################################################
            // transformerEditor_transformer_selector, EntityInstanceSelectorPanel formik -> persistedState
            // Debounced update to context when mode='here' and transformer definition changes
            useEffect(() => {
              // Clear existing timeout
              if (transformerUpdateTimeoutRef.current) {
                clearTimeout(transformerUpdateTimeoutRef.current);
              }

              // Only update if mode is defined
              if (
                !formikContext.values.transformerEditor_transformer_selector.mode ||
                formikContext.values.transformerEditor_transformer_selector.mode === "none"
              ) {
                return;
              }

              // Debounce the update - only push to context after 2 seconds of no changes
              transformerUpdateTimeoutRef.current = setTimeout(() => {
                log.info(
                  "TransformerEditor: debounced update - pushing transformer to context:",
                  formikContext.values.transformerEditor_transformer_selector.transformer
                );
                const selector =
                  formikContext.values.transformerEditor_transformer_selector.mode === "defined"
                    ? {
                        mode: "defined" as any, //formikContext.values.transformerEditor_transformer_selector.mode,
                        application: (formikContext.values.transformerEditor_transformer_selector as any)
                          .application,
                        transformerUuid: (formikContext.values.transformerEditor_transformer_selector as any)
                          .transformerUuid,
                        transformer: (formikContext.values.transformerEditor_transformer_selector as any)
                          .transformer, // restores potentially saved modifications
                      }
                    : {
                        mode: "here" as any, //formikContext.values.transformerEditor_transformer_selector.mode
                        transformer: formikContext.values.transformerEditor_transformer_selector.transformer,
                      };
                context.updateTransformerEditorState({
                  currentTransformerDefinition:
                    formikContext.values.transformerEditor_transformer_selector.transformer,
                  selector,
                  input_selector: {
                    mode: formikContext.values[formikPath_TransformerEditorInputModeSelector].mode as any,
                    input: formikContext.values[formikPath_TransformerEditorInputModeSelector].input,
                  },
                });
              }, 2000); // 2 second debounce

              // Cleanup timeout on unmount
              return () => {
                if (transformerUpdateTimeoutRef.current) {
                  clearTimeout(transformerUpdateTimeoutRef.current);
                }
              };
            }, [
              formikContext.values.transformerEditor_transformer_selector.mode,
              formikContext.values.transformerEditor_transformer_selector.transformer,
              formikContext.values[formikPath_TransformerEditorInputModeSelector].mode,
              formikContext.values[formikPath_TransformerEditorInputModeSelector].input,
              // formikContext.values.transformerEditor_editor.currentTransformerDefinition,
            ]);


            // ###############################################################################################
            // ###############################################################################################
            // ###############################################################################################
            // ###############################################################################################
            // ###############################################################################################
            // ##################################################################################
            // Apply transformer to input
            const transformerInput = useMemo(
              () =>
                formikContext.values[formikPath_TransformerEditorInputModeSelector].mode == "here"
                  ? {[defaultTransformerInput]: formikContext.values[formikPath_TransformerEditorInputModeSelector].input}
                  : formikContext.values.transformerEditor_input ?? {},
              [
                formikContext.values[formikPath_TransformerEditorInputModeSelector].mode,
                formikContext.values[formikPath_TransformerEditorInputModeSelector].input,
                formikContext.values.transformerEditor_input,
              ]
            );

            const transformationResult = useMemo(() => {
              const currentFormikTransformerDefinition: TransformerForBuildPlusRuntime = formikContext.values
                .transformerEditor_transformer_selector.transformer ?? {
                transformerType: "returnValue",
                value: null,
              };
              const transformerParams = {
                // ...currentMiroirModelEnvironment, // TODO: effectively get the currentMiroirModelEnvironment from the deploymentUuid selected as input
                ...transformerInput,
              };

              return transformer_extended_apply_wrapper(
                context.miroirContext.miroirActivityTracker, // activityTracker
                "runtime", // step
                ["rootTransformer"], // transformerPath
                "TransformerEditor", // label
                currentFormikTransformerDefinition, // transformer
                defaultMiroirModelEnvironment,// currentMiroirModelEnvironment, // TODO: effectively get the currentMiroirModelEnvironment from the deploymentUuid selected as input
                transformerParams,
                // inputSelectorData, // contextResults - pass the instance to transform
                transformerInput, // contextResults - pass the input to transform
                "value", // resolveBuildTransformersTo
                // deploymentEntityState,
                // deploymentUuid,
              );
              // }, [formikContext.values.transformerEditor_editor.currentTransformerDefinition]);
            }, [formikContext.values.transformerEditor_transformer_selector.transformer, transformerInput]);

            const innermostError = useMemo(
              () =>
                transformationResult &&
                typeof transformationResult == "object" &&
                "queryFailure" in transformationResult
                  ? getInnermostTransformerError(transformationResult)
                  : undefined,
              [transformationResult]
            );
            const errorPath = innermostError?.transformerPath || [];
            log.info("TransformerEditor Transformation error path:", errorPath);

            // ################################################################################################
            const transformationResultSchema: JzodElement = useMemo(() => {
              // if (!currentHereTransformerDefinition) {
              //   return { type: "any" } as JzodElement;
              // }
              return (valueToJzod(transformationResult) ?? { type: "any" }) as JzodElement;
            }, [transformationResult]);

            // ##################################################################################
            // Form ML Schema for the transformer editor
            const formMLSchema: JzodObject = useMemo(() => {
              return {
                type: "object",
                definition: {
                  transformerEditor_transformer_selector: {
                    type: "union",
                    discriminator: "mode",
                    tag: {
                      value: {
                        initializeTo: {
                          initializeToType: "value",
                          value: "here",
                        },
                      },
                    },
                    definition: [
                      {
                        type: "object",
                        definition: {
                          mode: {
                            type: "literal",
                            definition: "none",
                          },
                        },
                      },
                      // transformerEditor_transformer_selector here mode uses the in-editor transformer
                      {
                        type: "object",
                        definition: {
                          mode: {
                            type: "literal",
                            definition: "here",
                          },
                          transformer: {
                            type: "schemaReference",
                            definition: {
                              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                              relativePath: "transformerForBuildPlusRuntime",
                            },
                          },
                        },
                      },
                      // transformerEditor_transformer_selector defined mode uses a stored transformer
                      {
                        type: "object",
                        definition: {
                          mode: {
                            type: "literal",
                            definition: "defined",
                          },
                          application: {
                            type: "uuid",
                            nullable: true,
                            tag: {
                              value: {
                                defaultLabel: "Application",
                                editable: true,
                                selectorParams: {
                                  targetApplicationUuid: adminSelfApplication.uuid,
                                  targetEntity: entityApplicationForAdmin.uuid,
                                  targetEntityOrderInstancesBy: "name",
                                },
                                initializeTo: {
                                  initializeToType: "value",
                                  value: noValue.uuid,
                                },
                              },
                            },
                          },
                          transformerUuid: {
                            type: "uuid",
                            tag: {
                              value: {
                                selectorParams: {
                                  targetApplicationUuid: (
                                    formikContext.values
                                      .transformerEditor_transformer_selector as any
                                  ).application,
                                  targetEntity: entityDefinitionTransformerDefinition.entityUuid,
                                  targetEntityOrderInstancesBy: "name",
                                },
                                initializeTo: {
                                  initializeToType: "value",
                                  value: noValue.uuid,
                                },
                              },
                            },
                          },
                          transformer: {
                            type: "schemaReference",
                            optional: true,
                            definition: {
                              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                              relativePath: "transformerForBuildPlusRuntime",
                            },
                          },
                        },
                      },
                    ],
                  } as JzodUnion,
                  [formikPath_TransformerEditorInputModeSelector]: {
                    type: "union",
                    discriminator: "mode",
                    tag: {
                      value: {
                        initializeTo: {
                          initializeToType: "value",
                          value: { mode: "here", input: { placeholder: "put your input here..." } },
                        },
                      },
                    },
                    definition: [
                      // here mode uses the in-editor transformer
                      {
                        type: "object",
                        definition: {
                          mode: {
                            type: "literal",
                            definition: "here",
                          },
                          input: {
                            type: "any",
                            tag: {
                              value: {
                                initializeTo: {
                                  initializeToType: "value",
                                  value: { sampleKey: "sampleValue" },
                                },
                              },
                            },
                          },
                        },
                      },
                      // instance mode extract Entity instances using a query
                      {
                        type: "object",
                        definition: {
                          mode: {
                            type: "literal",
                            definition: "instance",
                          },
                        },
                      },
                    ],
                  } as JzodUnion,
                  transformerEditor_input: {
                    type: "any",
                  } as JzodElement,
                  transformerEditor_editor: {
                    type: "object",
                    definition: {
                      currentTransformerDefinition: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          relativePath: "transformerForBuildPlusRuntime",
                        },
                      },
                    },
                  } as JzodObject,
                },
              };
            }, [(formikContext.values.transformerEditor_transformer_selector as any).application]);

            // ####################################################################################
            // ####################################################################################
            // ####################################################################################
            // ####################################################################################
            return (
              // 3-Pane Layout
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  justifyContent: "start",
                  alignItems: "flex-start",
                }}
              >
                {/* left Pane: Transformer Definition Editor */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    maxWidth: "50%",
                    flexGrow: 1,
                  }}
                >
                  <ThemedOnScreenDebug
                      label="formikValues"
                      data={formikContext.values}
                      initiallyUnfolded={false}
                      useCodeBlock={true}
                    />
                  <ThemedOnScreenDebug
                    label="inputSelector defaultAdminApplicationDeploymentMapNOTGOOD"
                    data={defaultAdminApplicationDeploymentMapNOTGOOD}
                    // initiallyUnfolded={false}
                  />
                  <ThemedOnScreenDebug
                    label={"formikContext.values." + formikPath_TransformerEditorInputModeSelector}
                    data={formikContext.values[formikPath_TransformerEditorInputModeSelector]}
                    initiallyUnfolded={false}
                  />
                  <ThemedOnScreenDebug
                    label="currentDefinedTransformerDefinition"
                    data={transformerSelector_currentFetchedTransformerDefinition}
                    initiallyUnfolded={false}
                  />
                  <TypedValueObjectEditor
                    labelElement={<>Transformer Definition</>}
                    formValueMLSchema={formMLSchema}
                    formikValuePathAsString="transformerEditor_transformer_selector"
                    application={(formikContext.values.transformerEditor_transformer_selector as any).application}
                    applicationDeploymentMap={applicationDeploymentMap}
                    deploymentUuid={deploymentUuid}
                    applicationSection={"model"}
                    formLabel={"Transformer Definition Selector"}
                    displaySubmitButton="noDisplay"
                    valueObjectEditMode="create"
                    maxRenderDepth={Infinity}
                  />
                </div>
                {/* Right Panes: stacked */}
                {/* <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: "50%" }}> */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "start",
                    alignItems: "flex-start",
                    minWidth: "50%",
                    gap: "20px",
                  }}
                >
                  {/* input selector */}
                  <ThemedFoldableContainer style={{ flex: 1 }} title="Transformer Input">
                    {/* <ThemedHeaderSection>
                        <ThemedTitle>
                          Transformer Input
                        </ThemedTitle>
                      </ThemedHeaderSection> */}
                    <TypedValueObjectEditor
                      valueObjectEditMode="create"
                      labelElement={<>Input Definition</>}
                      formValueMLSchema={formMLSchema}
                      formikValuePathAsString={formikPath_TransformerEditorInputModeSelector}
                      // zoomInPath="selector"
                      application={(formikContext.values.transformerEditor_transformer_selector as any).application}
                      applicationDeploymentMap={applicationDeploymentMap}
                      deploymentUuid={deploymentUuid}
                      applicationSection={"model"}
                      formLabel={"Transformer Input Selector"}
                      displaySubmitButton="noDisplay"
                      maxRenderDepth={Infinity}
                    />
                  </ThemedFoldableContainer>
                  {formikContext.values[formikPath_TransformerEditorInputModeSelector].mode == "instance" && (
                    <EntityInstanceSelectorPanel
                      initialEntityUuid={initialEntityUuid}
                      deploymentUuid={deploymentUuid}
                      applicationDeploymentMap={applicationDeploymentMap}
                      showAllInstances={showAllInstances}
                    />
                  )}
                  <TransformationResultPanel
                    transformationResult={transformationResult}
                    transformationResultSchema={transformationResultSchema}
                    // transformationError={transformationError}
                    // selectedEntityInstance={selectedEntityInstance}
                    showAllInstances={showAllInstances}
                    // entityInstances={entityInstances}
                    inputApplication={application}
                    inputDeploymentUuid={deploymentUuid}
                    inputSelectorMode={formikContext.values[formikPath_TransformerEditorInputModeSelector].mode}
                  />
                </div>
              </div>
            );
          }
        }
      </Formik>
      <TransformerEventsPanel />

      {/* <DebugPanel currentTransformerDefinition={currentTransformerDefinition} /> */}
    </ThemedContainer>
  );
};
