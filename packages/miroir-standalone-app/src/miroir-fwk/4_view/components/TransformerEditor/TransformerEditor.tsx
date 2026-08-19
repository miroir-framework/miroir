import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { valueToJzod } from '@miroir-framework/jzod';
import {
  Domain2ElementFailed,
  LoggerInterface,
  MiroirLoggerFactory,
  Uuid,
  defaultAdminApplicationDeploymentMapNOTGOOD,
  defaultMiroirModelEnvironment,
  defaultTransformerInput,
  getInnermostTransformerError,
  noValue,
  safeStringify,
  transformer_extended_apply_wrapper,
  type JzodElement,
  type JzodObject,
  type JzodUnion,
  type MiroirModelEnvironment,
} from 'miroir-core';
import {
  adminSelfApplication,
  entityApplicationForAdmin
} from "miroir-test-app_deployment-admin";

import { Formik, type FormikProps } from 'formik';
import {
  type CoreTransformerForBuildPlusRuntime,
  type TransformerDefinition
} from "miroir-core";
import { JsonDisplayHelper, useMiroirContextService } from 'miroir-react';
import { packageName } from '../../../../constants';
import { cleanLevel, lastSubmitButtonClicked } from '../../constants';
import {
  useTransformer
} from "../Reports/ReportHooks";
import { useCurrentModel } from "../../ReduxHooks.js";
import { useReportPageContext } from '../Reports/ReportPageContext';
import { TypedValueObjectEditor } from '../Reports/TypedValueObjectEditor';
import {
  ThemedContainer,
  ThemedFoldableContainer,
  ThemedHeaderSection,
  ThemedTitle
} from "../Themes/index";
import { EntityInstanceSelectorPanel } from './EntityInstanceSelectorPanel';
import { TransformationResultPanel } from './TransformationResultPanel';
import {
  formikPath_TransformerEditorInputModeSelector,
  buildInitialTransformerSelectorFromPersistedState,
  buildInitialInputSelectorFromPersistedState,
  buildTransformerEditorPersistedUpdate,
  type TransformerEditorFormikValueType,
  type TransformerEditorProps,
} from "./TransformerEditorInterface";
import { TransformerEventsPanel } from './TransformerEventsPanel';

import { entityDefinitionTransformerDefinition } from 'miroir-test-app_deployment-miroir';
// ################################################################################################
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerEditor");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export const TransformerEditor: React.FC<TransformerEditorProps> = (props) => {
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

 
  // Ref for debouncing transformer definition updates when mode='here'
  const transformerUpdateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const latestFormValuesRef = React.useRef<TransformerEditorFormikValueType | null>(null);

  // Get persisted state from context
  const persistedState = context.toolsPageState.transformerEditor;
  const currentHereTransformerDefinition: CoreTransformerForBuildPlusRuntime =
    persistedState?.currentTransformerDefinition ?? { transformerType: "returnValue", mlSchema: { type: "string" }, value: "seize value..." };
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
    const transformerSelector = buildInitialTransformerSelectorFromPersistedState(
      persistedState,
      application,
      currentHereTransformerDefinition,
    );
    return {
      transformerEditor_transformer_selector: transformerSelector,
      transformerEditor_input: {},
      [formikPath_TransformerEditorInputModeSelector]:
        buildInitialInputSelectorFromPersistedState(persistedState),
      transformerEditor_editor: {
        currentTransformerDefinition:
          transformerSelector.transformer ?? currentHereTransformerDefinition,
      },
    };
  }, []); // Mount-only: read persistedState on first render; remount on navigation gets fresh state

  useEffect(() => {
    return () => {
      if (transformerUpdateTimeoutRef.current) {
        clearTimeout(transformerUpdateTimeoutRef.current);
        transformerUpdateTimeoutRef.current = null;
      }
      const values = latestFormValuesRef.current;
      if (!values) {
        return;
      }
      const update = buildTransformerEditorPersistedUpdate(values);
      if (update) {
        context.updateTransformerEditorState(update);
      }
    };
  }, [context]);

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
            latestFormValuesRef.current = formikContext.values;
            const selectorValues = formikContext.values
              .transformerEditor_transformer_selector as {
              mode?: "here" | "defined" | "none";
              application?: Uuid;
              transformerUuid?: Uuid;
            };
            // Schema resolution and FK lookups need a concrete application even in "here" mode.
            const editorApplication: Uuid =
              selectorValues.mode === "defined" &&
              selectorValues.application &&
              selectorValues.application !== noValue.uuid
                ? selectorValues.application
                : application;
            const editorDeploymentUuid: Uuid =
              applicationDeploymentMap[editorApplication] ?? deploymentUuid;
            const editorModel = useCurrentModel(editorApplication, applicationDeploymentMap);
            const inputSelectorMode =
              formikContext.values[formikPath_TransformerEditorInputModeSelector].mode;
            const canRenderInputEditor =
              (inputSelectorMode === "here" || inputSelectorMode === "instance") &&
              editorModel?.entities?.length > 0;
            const transformerSelectorMode =
              formikContext.values.transformerEditor_transformer_selector.mode;
            const canRenderDefinitionEditor =
              (transformerSelectorMode === "here" ||
                transformerSelectorMode === "defined") &&
              editorModel?.entities?.length > 0;
            const transformerSelector_currentFetchedTransformerDefinition:
              | TransformerDefinition
              | Domain2ElementFailed
              | undefined = useTransformer(
                editorApplication,
                applicationDeploymentMap,
                editorDeploymentUuid,
                selectorValues.mode === "defined" ? selectorValues.transformerUuid : undefined
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
              // When mode is 'defined' and transformerUuid is changed, fetch transformer from stored definition and update formik context
              if (
                formikContext.values.transformerEditor_transformer_selector.mode === "defined" &&
                (formikContext.values.transformerEditor_transformer_selector as any).application &&
                (formikContext.values.transformerEditor_transformer_selector as any).transformerUuid &&
                (formikContext.values.transformerEditor_transformer_selector as any).transformerUuid !==
                  noValue.uuid &&
                (formikContext.values.transformerEditor_transformer_selector as any).transformerUuid !==
                  (persistedState?.selector as any)?.transformerUuid &&
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
              (formikContext.values.transformerEditor_transformer_selector as any).transformerUuid,
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
                const update = buildTransformerEditorPersistedUpdate(formikContext.values);
                if (update) {
                  context.updateTransformerEditorState(update);
                }
              }, 2000); // 2 second debounce

              return () => {
                if (transformerUpdateTimeoutRef.current) {
                  clearTimeout(transformerUpdateTimeoutRef.current);
                  transformerUpdateTimeoutRef.current = null;
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
              const currentFormikTransformerDefinition: CoreTransformerForBuildPlusRuntime = formikContext.values
                .transformerEditor_transformer_selector.transformer ?? {
                transformerType: "returnValue",
                mlSchema: {
                  type: "string"
                },
                value: "seize value...",
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
                "value", // resolveBuildTransformersTo
                defaultMiroirModelEnvironment,// currentMiroirModelEnvironment, // TODO: effectively get the currentMiroirModelEnvironment from the deploymentUuid selected as input
                transformerParams,
                // inputSelectorData, // contextResults - pass the instance to transform
                transformerInput, // contextResults - pass the input to transform
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
                              relativePath: "coreTransformerForBuildPlusRuntime",
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
                                foreignKeyParams: {
                                  targetApplicationUuid: adminSelfApplication.uuid,
                                  targetEntity: entityApplicationForAdmin.uuid,
                                  targetEntityOrderInstancesBy: "name",
                                },
                                initializeTo: {
                                  initializeToType: "value",
                                  value: application,
                                },
                              },
                            },
                          },
                          transformerUuid: {
                            type: "uuid",
                            tag: {
                              value: {
                                foreignKeyParams: {
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
                              relativePath: "coreTransformerForBuildPlusRuntime",
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
                          relativePath: "coreTransformerForBuildPlusRuntime",
                        },
                      },
                    },
                  } as JzodObject,
                },
              };
            }, [(formikContext.values.transformerEditor_transformer_selector as any).application, application]);

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
                  <JsonDisplayHelper debug={false}
                    componentName="TransformerEditor"
                    elements={[
                      {
                        label: "formikValues",
                        data: formikContext.values,
                        useCodeBlock: true,
                      },
                      {
                        label: "inputSelector defaultAdminApplicationDeploymentMapNOTGOOD",
                        data: defaultAdminApplicationDeploymentMapNOTGOOD,
                      },
                      {
                        label: "formikContext.values." + formikPath_TransformerEditorInputModeSelector,
                        data: formikContext.values[formikPath_TransformerEditorInputModeSelector],
                      },
                      {
                        label: "currentDefinedTransformerDefinition",
                        data: transformerSelector_currentFetchedTransformerDefinition,
                      },
                    ]}
                  />
                  {canRenderDefinitionEditor ? (
                  <TypedValueObjectEditor
                    labelElement={<>Transformer Definition</>}
                    formValueMLSchema={formMLSchema.definition["transformerEditor_transformer_selector"]}
                    formikValuePathAsString="transformerEditor_transformer_selector"
                    application={editorApplication}
                    applicationDeploymentMap={applicationDeploymentMap}
                    deploymentUuid={editorDeploymentUuid}
                    applicationSection={"model"}
                    formLabel={"Transformer Definition Selector"}
                    displaySubmitButton="noDisplay"
                    valueObjectEditMode="create"
                    maxRenderDepth={Infinity}
                  />
                  ) : null}
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
                    {canRenderInputEditor ? (
                      <TypedValueObjectEditor
                        valueObjectEditMode="create"
                        labelElement={<>Input Definition</>}
                        formValueMLSchema={
                          formMLSchema.definition[formikPath_TransformerEditorInputModeSelector]
                        }
                        formikValuePathAsString={formikPath_TransformerEditorInputModeSelector}
                        application={editorApplication}
                        applicationDeploymentMap={applicationDeploymentMap}
                        deploymentUuid={editorDeploymentUuid}
                        applicationSection={"model"}
                        formLabel={"Transformer Input Selector"}
                        displaySubmitButton="noDisplay"
                        maxRenderDepth={Infinity}
                      />
                    ) : null}
                  </ThemedFoldableContainer>
                  {inputSelectorMode == "instance" && (
                    <EntityInstanceSelectorPanel
                      initialEntityUuid={initialEntityUuid}
                      deploymentUuid={editorDeploymentUuid}
                      applicationDeploymentMap={applicationDeploymentMap}
                      showAllInstances={showAllInstances}
                    />
                  )}
                  <TransformationResultPanel
                    transformationResult={transformationResult}
                    transformationResultSchema={transformationResultSchema}
                    showAllInstances={showAllInstances}
                    inputApplication={editorApplication}
                    inputDeploymentUuid={editorDeploymentUuid}
                    inputSelectorMode={inputSelectorMode}
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
