import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  EntityInstance,
  LoggerInterface,
  MiroirLoggerFactory,
  Uuid,
  defaultAdminApplicationDeploymentMapNOTGOOD,
  defaultSelfApplicationDeploymentMap,
  defaultTransformerInput,
  getEntityInstancesIndexNonHook,
  metaMetaModelEntityUuids,
  noValue,
  type ApplicationDeploymentMap,
  type ApplicationSection,
  type Entity,
  type EntityDefinition,
  type JzodElement,
  type JzodObject,
  type MiroirModelEnvironment,
  type ReduxDeploymentsState,
  type SyncBoxedExtractorOrQueryRunnerMap
} from 'miroir-core';


import { useFormikContext } from 'formik';
import {
  JsonDisplayHelper,
  formikPath_EntityInstanceSelectorPanel,
  getMemoizedReduxDeploymentsStateSelectorMap,
  useMiroirContextService,
  useSelector,
  type ReduxStateWithUndoRedo,
} from "miroir-react";
import {
  adminSelfApplication,
  entityApplicationForAdmin,
} from "miroir-test-app_deployment-admin";
import { selfApplicationLibrary } from 'miroir-test-app_deployment-library';
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";
import { packageName } from '../../../../constants';
import { cleanLevel } from '../../constants';
import { useCurrentModel, useCurrentModelEnvironment } from '../../ReduxHooks';
import { TypedValueObjectEditor } from '../Reports/TypedValueObjectEditor';
import { TypedValueObjectEditorWithFormik } from '../Reports/TypedValueObjectEditorWithFormik';
import {
  ThemedContainer,
  ThemedFoldableContainer,
  ThemedHeaderSection,
  ThemedTitle
} from "../Themes/index";
import {
  formikPath_TransformerEditorInputModeSelector,
  type TransformerEditorFormikValueType,
} from "./TransformerEditorInterface";

// ################################################################################################
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "EntityInstanceSelectorPanel"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});


// ################################################################################################
// Helper function to create a generic "any" schema for displaying arbitrary objects
// ################################################################################################
function createGenericObjectSchema(): JzodElement {
  return {
    type: "any"
  };
}

// ################################################################################################
// ################################################################################################
// EntityInstanceSelectorPanel Component
// ################################################################################################
// ################################################################################################
export function EntityInstanceSelectorPanel(props:{
  applicationDeploymentMap: ApplicationDeploymentMap;
  deploymentUuid: Uuid;
  initialEntityUuid: Uuid;
  showAllInstances: boolean;
}): JSX.Element {
  const {
    deploymentUuid,
    showAllInstances,
    initialEntityUuid,
  } = props;

  const formikContext = useFormikContext<TransformerEditorFormikValueType>();
  const context = useMiroirContextService();
  const persistedState = context.toolsPageState.transformerEditor;

  const entityInstanceSelectorPanelSchema: JzodElement = {
    type: "object",
    definition: {
      [formikPath_EntityInstanceSelectorPanel]: {
        type: "object",
        tag: {
          value: {
            defaultLabel: "Application Selector",
            display: {
              // unfoldSubLevels: 1,
              objectWithoutHeader: true,
              objectOrArrayWithoutFrame: true,
              objectAttributesNoIndent: true,
            }
          }
        },
        definition: {
          application: {
            type: "uuid",
            tag: {
              value: {
                defaultLabel: "Application (mls)",
                foreignKeyParams: {
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
        }
      }
    },
  };

  // const applicationDeploymentMap = useApplicationDeploymentMapFromLocalCache();
  const applicationDeploymentMap = context.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap;
  // ##################################################################################
  // ##################################################################################
  // SELECT INPUT INSTANCE(S)
  // ##################################################################################
  // ##################################################################################
  // State to track the current instance index (with persistence)
  const [currentInstanceIndex, setCurrentInstanceIndex] = useState<number>(
    persistedState?.currentInstanceIndex || 0
  );

  // data (default): browse application data entities / instances
  // model: browse application model section; available entity types come from Miroir Entity instances
  const [applicationSection, setApplicationSection] = useState<ApplicationSection>(
    persistedState?.applicationSection || "data"
  );

  const inputSelector_applicationUuid: Uuid =
    formikContext.values[formikPath_EntityInstanceSelectorPanel]?.application ||
    persistedState?.selectedApplicationUuid ||
    context.toolsPageState?.[formikPath_EntityInstanceSelectorPanel]?.application ||
    selfApplicationLibrary.uuid;

  const inputSelector_deploymentUuidFromApplicationUuid: Uuid = 
    !inputSelector_applicationUuid || inputSelector_applicationUuid == noValue.uuid
      ? deploymentUuid
      : defaultAdminApplicationDeploymentMapNOTGOOD[inputSelector_applicationUuid];

  const currentModel = useCurrentModel(inputSelector_applicationUuid, applicationDeploymentMap);
  const miroirMetaModel = useCurrentModel(selfApplicationMiroir.uuid, applicationDeploymentMap);
  const isMiroirApp = inputSelector_applicationUuid === selfApplicationMiroir.uuid;

  // model (user apps): every Entity instance from the miroir meta-app model section.
  // model (Miroir): only Entity + EntityDefinition (meta-meta-model).
  // data (user apps): the application's own entities.
  // data (Miroir): miroir entities excluding Entity + EntityDefinition.
  const currentReportDeploymentSectionEntities: Entity[] = useMemo(() => {
    let entities: Entity[];
    if (applicationSection === "model") {
      entities = isMiroirApp
        ? (miroirMetaModel.entities ?? []).filter(
            (e) => !!e?.uuid && metaMetaModelEntityUuids.includes(e.uuid),
          )
        : (miroirMetaModel.entities ?? []);
    } else {
      entities = isMiroirApp
        ? (currentModel.entities ?? []).filter(
            (e) => !!e?.uuid && !metaMetaModelEntityUuids.includes(e.uuid),
          )
        : (currentModel.entities ?? []);
    }
    return [...entities]
      .filter((e) => !!e?.uuid)
      .sort((a, b) => {
        const nameA = a.name?.toLowerCase() ?? "";
        const nameB = b.name?.toLowerCase() ?? "";
        return nameA.localeCompare(nameB);
      });
  }, [
    applicationSection,
    isMiroirApp,
    miroirMetaModel.entities,
    currentModel.entities,
  ]);
  // Schemas for model-section entity types come from Miroir; data-section types from the app model
  // (for Miroir those are the same MetaModel).
  const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] =
    applicationSection === "model"
      ? miroirMetaModel.entityDefinitions
      : currentModel.entityDefinitions;

  const [selectedEntityUuid, setSelectedEntityUuid] = useState<Uuid>(
    persistedState?.selectedEntityUuid || initialEntityUuid
  );
  // Ensure selected entity is valid when available entities change
  useEffect(() => {
    const availableEntityUuids =
      currentReportDeploymentSectionEntities?.map((e) => e.uuid) || [];
    if (
      availableEntityUuids.length > 0 &&
      !availableEntityUuids.includes(selectedEntityUuid)
    ) {
      // If current selection is not available, default to the first available entity
      setSelectedEntityUuid(availableEntityUuids[0]);
    }
  }, [currentReportDeploymentSectionEntities, selectedEntityUuid]);

  // Reset index when entity or section changes
  useEffect(() => {
    setCurrentInstanceIndex(0);
  }, [selectedEntityUuid, applicationSection]);

  const currentReportTargetEntity: Entity | undefined =
    currentReportDeploymentSectionEntities?.find((e) => e?.uuid === selectedEntityUuid);

  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find(
      (e) => e?.entityUuid === currentReportTargetEntity?.uuid
    );

  // Avoid rendering with a stale / mismatched schema while selection catches up
  const schemaMatchesSelection =
    !!currentReportTargetEntity &&
    !!currentReportTargetEntityDefinition &&
    currentReportTargetEntityDefinition.entityUuid === selectedEntityUuid;

  const instanceEditorKey = `instance-editor-${applicationSection}-${selectedEntityUuid}-${currentReportTargetEntityDefinition?.uuid ?? "noschema"}-${showAllInstances ? "all" : "single"}`;

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
    useMemo(() => getMemoizedReduxDeploymentsStateSelectorMap(), []);

  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    inputSelector_applicationUuid,
    applicationDeploymentMap
  );
  // const currentMiroirModelEnvironment: MiroirModelEnvironment = useMemo(() => {
  //   return {
  //     miroirFundamentalJzodSchema:
  //       context.miroirFundamentalJzodSchema ??
  //       (miroirFundamentalJzodSchema as MlSchema),
  //     miroirMetaModel: miroirMetaModel,
  //     currentModel: currentModel,
  //   };
  // }, [miroirMetaModel, currentModel, context.miroirFundamentalJzodSchema]);

  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    useCallback(
      (state: ReduxStateWithUndoRedo) =>
        deploymentEntityStateSelectorMap.extractState(
          state.presentModelSnapshot.current,
          applicationDeploymentMap,
          () => ({}),
          currentMiroirModelEnvironment
        ),
      [deploymentEntityStateSelectorMap, currentMiroirModelEnvironment]
    )
  );

  // Fetch all instances of the target entity with stable reference.
  // Pass the UI section explicitly: getApplicationSection()'s hardcoded metaModelEntityUuids
  // is stale (e.g. misses ApplicationEvolutionTrace), so relying on it here would fetch
  // from the wrong store section for newer meta-model entities.
  const entityInstances: EntityInstance[] = useMemo(() => {
    try {
      return getEntityInstancesIndexNonHook(
        deploymentEntityState,
        currentMiroirModelEnvironment,
        inputSelector_applicationUuid,
        applicationDeploymentMap,
        inputSelector_deploymentUuidFromApplicationUuid,
        selectedEntityUuid,
        "name", // Order by name if available
        applicationSection,
      );
    } catch (error) {
      log.error("Error fetching entity instances:", error);
      return [];
    }
  }, [
    deploymentEntityState,
    currentMiroirModelEnvironment,
    inputSelector_deploymentUuidFromApplicationUuid,
    inputSelector_applicationUuid,
    selectedEntityUuid,
    applicationSection,
  ]);

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // Select instance based on current index with stable reference
  const selectedEntityInstance: EntityInstance | undefined = useMemo(() => {
    if (entityInstances.length === 0) return undefined;
    // Ensure index is within bounds (round-robin)
    const validIndex =
      ((currentInstanceIndex % entityInstances.length) + entityInstances.length) %
      entityInstances.length;
    return entityInstances[validIndex];
  }, [
    entityInstances,
    context.toolsPageState.transformerEditor?.showAllInstances,
    currentInstanceIndex,
  ]);

  const inputSelectorData = useMemo(() => {
    const defaultTransformerInputValue =
      formikContext.values[formikPath_TransformerEditorInputModeSelector].mode == "instance"
        ? showAllInstances
          ? entityInstances
          : selectedEntityInstance
        : formikContext.values.transformerEditor_input;
    if (showAllInstances) {
      // When showing all instances, target becomes an array of all instances
      if (entityInstances.length === 0) return {};

      return {
        [defaultTransformerInput]: defaultTransformerInputValue,
      };
    } else {
      // When showing single instance, target is the selected instance
      if (!selectedEntityInstance) return {};

      return {
        [defaultTransformerInput]: defaultTransformerInputValue,
      };
    }
  }, [showAllInstances, entityInstances, selectedEntityInstance]);


  // ##############################################################################################
  // ####### EntityInstanceSelectorPanel NAVIGATION AND SELECTION HANDLERS ########################
  // ##############################################################################################
  // Navigation functions for round-robin instance selection
  const navigateToNextInstance = useCallback(() => {
    if (entityInstances.length > 0) {
      const newIndex = (currentInstanceIndex + 1) % entityInstances.length;
      setCurrentInstanceIndex(newIndex);
      // Persist to context
      context.updateTransformerEditorState({
        ...context.toolsPageState.transformerEditor,
        currentInstanceIndex: newIndex,
      });
    }
  }, [entityInstances.length, currentInstanceIndex]); // Remove context from dependencies

  const navigateToPreviousInstance = useCallback(() => {
    if (entityInstances.length > 0) {
      const newIndex =
        (currentInstanceIndex - 1 + entityInstances.length) % entityInstances.length;
      setCurrentInstanceIndex(newIndex);
      // Persist to context
      context.updateTransformerEditorState({
        ...context.toolsPageState.transformerEditor,
        currentInstanceIndex: newIndex,
      });
    }
  }, [
    entityInstances.length,
    currentInstanceIndex,
    context.toolsPageState.transformerEditor,
  ]); // Remove context from dependencies

  const navigateToRandomInstance = useCallback(() => {
    if (entityInstances.length > 0) {
      // const newIndex = (currentInstanceIndex - 1 + entityInstances.length) % entityInstances.length;
      const newIndex = Math.floor(Math.random() * entityInstances.length);
      setCurrentInstanceIndex(newIndex);
      // Persist to context
      context.updateTransformerEditorState({
        ...context.toolsPageState.transformerEditor,
        currentInstanceIndex: newIndex,
      });
    }
  }, [
    entityInstances.length,
    currentInstanceIndex,
    context.toolsPageState.transformerEditor,
  ]); // Remove context from dependencies

  // Handler for toggling show all instances mode (with persistence)
  const handleToggleShowAll = useCallback(() => {
    const newShowAllInstances =
      !context.toolsPageState.transformerEditor?.showAllInstances;
    context.updateTransformerEditorState({
      ...context.toolsPageState.transformerEditor,
      showAllInstances: newShowAllInstances,
    });
  }, [context.toolsPageState.transformerEditor?.showAllInstances]); // Remove context from dependencies

  // Handler for entity change (with persistence)
  const handleEntityChange = useCallback(
    (newEntityUuid: Uuid) => {
      setSelectedEntityUuid(newEntityUuid);
      // Persist to context
      context.updateTransformerEditorState({
        ...context.toolsPageState.transformerEditor,
        selectedEntityUuid: newEntityUuid,
      });
    },
    [context.toolsPageState.transformerEditor]
  ); // Remove context from dependencies

  const handleApplicationSectionChange = useCallback(
    (newSection: ApplicationSection) => {
      setApplicationSection(newSection);
      context.updateTransformerEditorState({
        ...context.toolsPageState.transformerEditor,
        applicationSection: newSection,
        currentInstanceIndex: 0,
      });
    },
    [context.toolsPageState.transformerEditor]
  );

  // Persist chosen application so it survives leave/return to the search page
  useEffect(() => {
    const app =
      formikContext.values[formikPath_EntityInstanceSelectorPanel]?.application;
    if (!app || app === noValue.uuid) {
      return;
    }
    const persistedPanelApp =
      context.toolsPageState?.[formikPath_EntityInstanceSelectorPanel]?.application;
    const persistedEditorApp =
      context.toolsPageState.transformerEditor?.selectedApplicationUuid;
    if (persistedPanelApp === app && persistedEditorApp === app) {
      return;
    }
    context.updateToolsPageStateDEFUNCT({
      [formikPath_EntityInstanceSelectorPanel]: {
        ...context.toolsPageState?.[formikPath_EntityInstanceSelectorPanel],
        application: app,
      },
    });
    context.updateTransformerEditorState({
      selectedApplicationUuid: app,
    });
  }, [formikContext.values[formikPath_EntityInstanceSelectorPanel]?.application]);

  // ##################################################################################
  // input -> formik when formikContext.values[formikPath_TransformerEditorInputModeSelector].mode is changed or when selected instance(s) change
  useEffect(() => {
    // formikPath_EntityInstanceSelectorPanel initial value
    const currentApplication =
      formikContext.values[formikPath_EntityInstanceSelectorPanel]?.application;
    if (!currentApplication || currentApplication === noValue.uuid) {
      const restoredApplication =
        context.toolsPageState?.[formikPath_EntityInstanceSelectorPanel]?.application ||
        context.toolsPageState.transformerEditor?.selectedApplicationUuid ||
        selfApplicationLibrary.uuid;
      formikContext.setFieldValue(formikPath_EntityInstanceSelectorPanel, {
        ...(formikContext.values[formikPath_EntityInstanceSelectorPanel] ?? {}),
        application: restoredApplication,
      });
    }
    if (formikContext.values[formikPath_TransformerEditorInputModeSelector].mode == "instance") {
      formikContext.setFieldValue("transformerEditor_input", inputSelectorData);
      if (showAllInstances) {
        formikContext.setFieldValue(
          "entityInstances", entityInstances
        );
      } else {
        formikContext.setFieldValue(
          "selectedEntityInstance", selectedEntityInstance
        )
      }
    }
  }, [
    formikContext.values[formikPath_TransformerEditorInputModeSelector].mode,
    inputSelectorData,
    entityInstances,
    selectedEntityInstance,
  ]);

  // ##############################################################################################
  return (
    <>
      <JsonDisplayHelper debug={true}
        componentName="EntityInstanceSelectorPanel"
        elements={[{
          label: `EntityInstanceSelectorPanel`,
          data: {
            props,
            applicationSection,
            currentReportDeploymentSectionEntities: currentReportDeploymentSectionEntities?.map(
              (e) => ({ uuid: e.uuid, name: e.name }),
            ),
          },
        }]}
      />
      <ThemedContainer style={{ flex: 1 }}>
        <ThemedHeaderSection style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <ThemedTitle>
              {showAllInstances ? "All Entity Instances" : "Entity Instance"} (
              {entityInstances.length} instances available)
              {!showAllInstances && entityInstances.length > 0 && (
                <span style={{ fontSize: "0.8em", marginLeft: "10px", color: "#666" }}>
                  (#{currentInstanceIndex + 1} of {entityInstances.length})
                </span>
              )}
            </ThemedTitle>
            {/* Always visible; disabled when there is nothing to toggle between */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggleShowAll();
              }}
              disabled={entityInstances.length <= 1}
              style={{
                padding: "6px 12px",
                fontSize: "13px",
                backgroundColor:
                  entityInstances.length <= 1
                    ? "#f5f5f5"
                    : showAllInstances
                      ? "#e6f3ff"
                      : "#f0f0f0",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: entityInstances.length <= 1 ? "not-allowed" : "pointer",
                fontWeight: showAllInstances ? "bold" : "normal",
                opacity: entityInstances.length <= 1 ? 0.5 : 1,
              }}
              title={
                entityInstances.length <= 1
                  ? "Need at least 2 instances to toggle single/all view"
                  : showAllInstances
                    ? "Switch to single instance view"
                    : "Show all instances"
              }
            >
              {showAllInstances ? "👤 Show Single" : "👥 Show All"}
            </button>
          </div>

          {/* Application Selector */}
          {formikContext.values[formikPath_EntityInstanceSelectorPanel] && (
            <TypedValueObjectEditor
              labelElement={<span>select Application</span>}
              formValueMLSchema={entityInstanceSelectorPanelSchema.definition[formikPath_EntityInstanceSelectorPanel] as JzodObject}
              formikValuePathAsString={formikPath_EntityInstanceSelectorPanel}
              application={inputSelector_applicationUuid}
              applicationDeploymentMap={applicationDeploymentMap}
              deploymentUuid={deploymentUuid}
              applicationSection={"data"}
              formLabel={"Application Selector jzod"}
              // onSubmit={async () => {}} // No-op for readonly
              valueObjectEditMode="create" // Readonly viewer mode, not relevant here
              displaySubmitButton="noDisplay"
              maxRenderDepth={3}
              // readonly={true}
            />
          )}

          {/* Section Selector: data (application instances) | model (meta-model entity types) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "bold", minWidth: "60px" }}>
              Section:
            </label>
            <select
              value={applicationSection}
              onChange={(e) => handleApplicationSectionChange(e.target.value as ApplicationSection)}
              style={{
                padding: "6px 12px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "white",
                cursor: "pointer",
                minWidth: "200px",
              }}
            >
              <option value="data">data</option>
              <option value="model">model</option>
            </select>
          </div>

          {/* Entity Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "bold", minWidth: "60px" }}>
              Entity:
            </label>
            <select
              value={selectedEntityUuid}
              onChange={(e) => handleEntityChange(e.target.value as Uuid)}
              style={{
                padding: "6px 12px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "white",
                cursor: "pointer",
                minWidth: "200px",
              }}
            >
              {currentReportDeploymentSectionEntities.map((entity) => (
                <option key={entity.uuid} value={entity.uuid}>
                  {entity.name || entity.uuid}
                </option>
              ))}
            </select>
            {/* Navigation buttons: always visible in single mode; greyed out when not usable */}
            {!showAllInstances && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateToPreviousInstance();
                  }}
                  disabled={entityInstances.length <= 1}
                  style={{
                    padding: "4px 8px",
                    fontSize: "14px",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: entityInstances.length <= 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    opacity: entityInstances.length <= 1 ? 0.5 : 1,
                  }}
                  title="Previous instance"
                >
                  ↑ Prev
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateToNextInstance();
                  }}
                  disabled={entityInstances.length <= 1}
                  style={{
                    padding: "4px 8px",
                    fontSize: "14px",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: entityInstances.length <= 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    opacity: entityInstances.length <= 1 ? 0.5 : 1,
                  }}
                  title="Next instance"
                >
                  Next ↓
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateToRandomInstance();
                  }}
                  disabled={entityInstances.length <= 1}
                  style={{
                    padding: "4px 8px",
                    fontSize: "14px",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: entityInstances.length <= 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    opacity: entityInstances.length <= 1 ? 0.5 : 1,
                  }}
                  title="Random instance"
                >
                  Random 🔀
                </button>
              </div>
            )}
          </div>
        </ThemedHeaderSection>
        {showAllInstances ? (
          /* Show all instances */
          entityInstances.length > 0 && schemaMatchesSelection ? (
            <>
              <JsonDisplayHelper debug={true}
                componentName="EntityInstanceSelectorPanel"
                elements={[{
                  label: `TypedValueObjectEditor showing all ${
                    entityInstances.length
                  } instances of entity '${currentReportTargetEntityDefinition?.name || ""}`,
                  data: {
                    type: "object",
                    definition: {
                      entityInstances: {
                        definition: {
                          type: "array",
                          definition:
                            currentReportTargetEntityDefinition?.mlSchema ??
                            createGenericObjectSchema(),
                        },
                      },
                    },
                  },
                }]}
              />
              <ThemedFoldableContainer
                style={{ flex: 1, padding: 0 }}
                title="Selected Entity Instances"
                initiallyFolded={true}
              >
                <TypedValueObjectEditorWithFormik
                  key={instanceEditorKey}
                  labelElement={<></>}
                  initialValueObject={{ entityInstances }}
                  formValueMLSchema={
                    {
                      type: "array",
                      definition:
                        currentReportTargetEntityDefinition?.mlSchema ??
                        createGenericObjectSchema(),
                    }
                  } // TODO: ILL-TYPED!!
                  formikValuePathAsString="entityInstances"
                  application={inputSelector_applicationUuid}
                  applicationDeploymentMap={applicationDeploymentMap}
                  deploymentUuid={deploymentUuid}
                  applicationSection={applicationSection}
                  formLabel={"All Entity Instances Viewer"}
                  onSubmit={async () => {
                    log.warn("Submit called on read-only EntityInstanceSelectorPanel for all instances, this should not happen");
                  }} // No-op for readonly
                  valueObjectEditMode="create" // Readonly viewer mode, not relevant here
                  maxRenderDepth={3}
                  readonly={true}
                />
              </ThemedFoldableContainer>
            </>
          ) : (
            <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
              {entityInstances.length === 0
                ? "No entity instances found"
                : "Loading entity schema…"}
            </div>
          )
        ) : /* Show single instance */
        selectedEntityInstance && schemaMatchesSelection ? (
          <ThemedFoldableContainer
            style={{ flex: 1, padding: 0 }}
            title="Selected Entity Instance"
            initiallyFolded={false}
          >
            <TypedValueObjectEditorWithFormik
              key={instanceEditorKey}
              valueObjectEditMode="create"
              labelElement={<></>}
              initialValueObject={{ selectedEntityInstance }}
              formValueMLSchema={
                // {
                // type: "object",
                // definition: {
                //   selectedEntityInstance:
                    currentReportTargetEntityDefinition?.mlSchema ?? createGenericObjectSchema()
                // },
              // }
              }
              formikValuePathAsString="selectedEntityInstance"
              deploymentUuid={deploymentUuid}
              application={inputSelector_applicationUuid}
              applicationDeploymentMap={applicationDeploymentMap}
              applicationSection={applicationSection}
              formLabel={"Entity Instance Viewer"}
              onSubmit={async () => {
                log.warn("Submit called on read-only EntityInstanceSelectorPanel for single instance, this should not happen");
              }} // No-op for readonly
              maxRenderDepth={3}
              readonly={true}
            />
          </ThemedFoldableContainer>
        ) : (
          <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
            {!selectedEntityInstance
              ? "No entity instances found"
              : "Loading entity schema…"}
          </div>
        )}
      </ThemedContainer>
    </>
  );
}
