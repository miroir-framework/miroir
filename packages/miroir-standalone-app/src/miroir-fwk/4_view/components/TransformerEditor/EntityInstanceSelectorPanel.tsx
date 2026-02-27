import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  EntityInstance,
  LoggerInterface,
  MiroirLoggerFactory,
  Uuid,
  defaultAdminApplicationDeploymentMapNOTGOOD,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  defaultTransformerInput,
  defaultTransformers,
  getEntityInstancesUuidIndexNonHook,
  noValue,
  type ApplicationDeploymentMap,
  type Entity,
  type EntityDefinition,
  type JzodElement,
  type MiroirModelEnvironment,
  type ReduxDeploymentsState,
  type SyncBoxedExtractorOrQueryRunnerMap
} from 'miroir-core';


import { useFormikContext } from 'formik';
import {
  DebugHelper,
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


  const inputSelector_applicationUuid: Uuid =
    formikContext.values[formikPath_EntityInstanceSelectorPanel]?.application ||
    selfApplicationLibrary.uuid;

  const inputSelector_deploymentUuidFromApplicationUuid: Uuid = 
    !inputSelector_applicationUuid || inputSelector_applicationUuid == noValue.uuid
      ? deploymentUuid
      : defaultAdminApplicationDeploymentMapNOTGOOD[inputSelector_applicationUuid];

  const currentModel = useCurrentModel(inputSelector_applicationUuid, applicationDeploymentMap);
  // const currentModel = useCurrentModel(inputSelector_deploymentUuidFromApplicationUuid);

  // Entities are always defined in the 'model' section, sorted by name
  const currentReportDeploymentSectionEntities: Entity[] = useMemo(() => {
    return [...currentModel.entities].sort((a, b) => {
      const nameA = a.name?.toLowerCase() ?? "";
      const nameB = b.name?.toLowerCase() ?? "";
      return nameA.localeCompare(nameB);
    });
  }, [currentModel.entities]);
  const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] =
    currentModel.entityDefinitions; // EntityDefinitions are always defined in the 'model' section

  const [selectedEntityUuid, setSelectedEntityUuid] = useState<Uuid>(initialEntityUuid);
  // Ensure selected entity is valid when available entities change
  useEffect(() => {
    // if (
    //   formikContext.values[formikPath_EntityInstanceSelectorPanel]?.application &&
    //   formikContext.values[formikPath_EntityInstanceSelectorPanel]?.application !== noValue.uuid) {
    //     context.updateTransformerEditorState({
    //       ...context.toolsPageState.transformerEditor,
    //       selectedApplicationUuid: formikContext.values[formikPath_EntityInstanceSelectorPanel]?.application,
    //     });
    // }
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

  // Reset index when entity changes
  useEffect(() => {
    setCurrentInstanceIndex(0);
  }, [selectedEntityUuid]); // Remove context from dependencies to prevent infinite refresh

  const currentReportTargetEntity: Entity | undefined =
    currentReportDeploymentSectionEntities?.find((e) => e?.uuid === selectedEntityUuid);

  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find(
      (e) => e?.entityUuid === currentReportTargetEntity?.uuid
    );

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

  // Fetch all instances of the target entity with stable reference
  const entityInstances: EntityInstance[] = useMemo(() => {
    try {
      return getEntityInstancesUuidIndexNonHook(
        deploymentEntityState,
        currentMiroirModelEnvironment,
        inputSelector_applicationUuid,
        applicationDeploymentMap,
        inputSelector_deploymentUuidFromApplicationUuid,
        selectedEntityUuid,
        "name" // Order by name if available
      );
    } catch (error) {
      log.error("Error fetching entity instances:", error);
      return [];
    }
  }, [
    deploymentEntityState,
    currentMiroirModelEnvironment,
    inputSelector_deploymentUuidFromApplicationUuid,
    selectedEntityUuid,
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

  // ##################################################################################
  // input -> formik
  useEffect(() => {
    // formikPath_EntityInstanceSelectorPanel initial value
    if (!formikContext.values[formikPath_EntityInstanceSelectorPanel]?.application) {
      const initialValue = defaultTransformers.transformer_extended_apply(
        "runtime",
        [],
        "get default values for EntityInstanceSelectorPanel",
        {
          transformerType: "defaultValueForMLSchema",
          label: "EntityInstanceSelectorPanel initial value",
          mlSchema: entityInstanceSelectorPanelSchema,
        },
        "value",
        defaultMiroirModelEnvironment, //modelEnvironment, // TODO: use real deployment environment!
        {},
        {}
      );
      log.info("Setting initial value for EntityInstanceSelectorPanel", initialValue);
      formikContext.setFieldValue(
        formikPath_EntityInstanceSelectorPanel,
        initialValue[formikPath_EntityInstanceSelectorPanel]
      );
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
      <DebugHelper
        componentName="EntityInstanceSelectorPanel"
        elements={[{
          label: `EntityInstanceSelectorPanel`,
          data: {
            props,
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
            {/* Toggle button for Single/All mode */}
            {entityInstances.length > 1 && (
              <button
                onClick={handleToggleShowAll}
                style={{
                  padding: "6px 12px",
                  fontSize: "13px",
                  backgroundColor: showAllInstances ? "#e6f3ff" : "#f0f0f0",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: showAllInstances ? "bold" : "normal",
                }}
                title={showAllInstances ? "Switch to single instance view" : "Show all instances"}
              >
                {showAllInstances ? "👤 Show Single" : "👥 Show All"}
              </button>
            )}
          </div>

          {/* Application Selector */}
          {formikContext.values[formikPath_EntityInstanceSelectorPanel] && (
            <TypedValueObjectEditor
              labelElement={<span>select Application</span>}
              formValueMLSchema={entityInstanceSelectorPanelSchema}
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
            {/* Navigation buttons - only show when in single instance mode */}
            {!showAllInstances && entityInstances.length > 1 && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={navigateToPreviousInstance}
                  type="button"
                  style={{
                    padding: "4px 8px",
                    fontSize: "14px",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Previous instance"
                >
                  ↑ Prev
                </button>
                <button
                  onClick={navigateToNextInstance}
                  type="button"
                  style={{
                    padding: "4px 8px",
                    fontSize: "14px",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Next instance"
                >
                  Next ↓
                </button>
                <button
                  onClick={navigateToRandomInstance}
                  type="button"
                  style={{
                    padding: "4px 8px",
                    fontSize: "14px",
                    backgroundColor: "#f0f0f0",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Next instance"
                >
                  Random 🔀
                </button>
              </div>
            )}
          </div>
        </ThemedHeaderSection>
        {showAllInstances ? (
          /* Show all instances */
          entityInstances.length > 0 ? (
            <>
              <DebugHelper
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
                  labelElement={<></>}
                  initialValueObject={{ entityInstances }}
                  formValueMLSchema={
                    {
                      type: "object",
                      definition: {
                        entityInstances: {
                          type: "array",
                          definition:
                            currentReportTargetEntityDefinition?.mlSchema ??
                            createGenericObjectSchema(),
                        },
                      },
                    } as any
                  } // TODO: ILL-TYPED!!
                  formikValuePathAsString="entityInstances"
                  application={inputSelector_applicationUuid}
                  applicationDeploymentMap={applicationDeploymentMap}
                  deploymentUuid={deploymentUuid}
                  applicationSection={"data"}
                  formLabel={"All Entity Instances Viewer"}
                  onSubmit={async () => {}} // No-op for readonly
                  valueObjectEditMode="create" // Readonly viewer mode, not relevant here
                  maxRenderDepth={3}
                  readonly={true}
                />
              </ThemedFoldableContainer>
            </>
          ) : (
            <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
              No entity instances found
            </div>
          )
        ) : /* Show single instance */
        selectedEntityInstance ? (
          <ThemedFoldableContainer
            style={{ flex: 1, padding: 0 }}
            title="Selected Entity Instance"
            initiallyFolded={false}
          >
            <TypedValueObjectEditorWithFormik
              valueObjectEditMode="create"
              labelElement={<></>}
              initialValueObject={{ selectedEntityInstance }}
              // valueObjectMMLSchema={createGenericObjectSchema()}
              formValueMLSchema={{
                type: "object",
                definition: {
                  selectedEntityInstance:
                    currentReportTargetEntityDefinition?.mlSchema ?? createGenericObjectSchema(),
                },
              }}
              formikValuePathAsString="selectedEntityInstance"
              deploymentUuid={deploymentUuid}
              application={inputSelector_applicationUuid}
              applicationDeploymentMap={applicationDeploymentMap}
              applicationSection={"data"}
              formLabel={"Entity Instance Viewer"}
              onSubmit={async () => {}} // No-op for readonly
              maxRenderDepth={3}
              readonly={true}
            />
          </ThemedFoldableContainer>
        ) : (
          <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
            No entity instances found
          </div>
        )}
      </ThemedContainer>
    </>
  );
}
