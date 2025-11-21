import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { valueToJzod } from '@miroir-framework/jzod';
import {
  Domain2ElementFailed,
  EntityInstance,
  LoggerInterface,
  MiroirLoggerFactory,
  Uuid,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentMiroir,
  defaultTransformerInput,
  entityApplicationForAdmin,
  entityDefinitionTransformerDefinition,
  entityDeployment,
  entityTransformerDefinition,
  getApplicationSection,
  getEntityInstancesUuidIndexNonHook,
  getInnermostTransformerError,
  miroirFundamentalJzodSchema,
  safeStringify,
  transformer_extended_apply_wrapper,
  type BoxedQueryTemplateWithExtractorCombinerTransformer,
  type BoxedQueryWithExtractorCombinerTransformer,
  type Domain2QueryReturnType,
  type Entity,
  type EntityDefinition,
  type JzodElement,
  type JzodObject,
  type JzodSchema,
  type JzodUnion,
  type MetaModel,
  type MiroirModelEnvironment,
  type ReduxDeploymentsState,
  type SyncBoxedExtractorOrQueryRunnerMap,
  type TransformerReturnType
} from 'miroir-core';


import { transformer, type TransformerDefinition, type TransformerForBuildPlusRuntime } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';
import { getMemoizedReduxDeploymentsStateSelectorMap, type ReduxStateWithUndoRedo } from 'miroir-localcache-redux';
import { useSelector } from 'react-redux';
import { packageName } from '../../../../constants';
import { cleanLevel, lastSubmitButtonClicked } from '../../constants';
import { useMiroirContextService } from '../../MiroirContextReactProvider';
import { useCurrentModel } from '../../ReduxHooks';
import { useReportPageContext } from '../Reports/ReportPageContext';
import { TypedValueObjectEditorWithFormik } from '../Reports/TypedValueObjectEditorWithFormik';
import {
  ThemedContainer,
  ThemedFoldableContainer,
  ThemedHeaderSection,
  ThemedOnScreenHelper,
  ThemedTitle
} from "../Themes/index";
import { TransformationResultPanel } from './TransformationResultPanel';
import { TransformerEventsPanel } from './TransformerEventsPanel';
import { Formik, type FormikProps } from 'formik';
import { TypedValueObjectEditor } from '../Reports/TypedValueObjectEditor';
import { noValue } from '../ValueObjectEditor/JzodElementEditorInterface';
import { useQueryTemplateResults } from '../Reports/ReportHooks';
import { ReportSectionEntityInstance } from '../Reports/ReportSectionEntityInstance';

// ################################################################################################
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerEditor"), "UI",
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
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// Memoized sub-components for better performance
// ################################################################################################
// const EntityInstancePanel = React.memo<
// {
//   entityInstances: EntityInstance[];
//   selectedEntityInstance: EntityInstance | undefined;
//   selectedEntityInstanceDefinition: EntityDefinition | undefined;
//   currentInstanceIndex: number;
//   deploymentUuid: Uuid;
//   availableEntities: Entity[];
//   selectedEntityUuid: Uuid;
//   showAllInstances: boolean;
//   onEntityChange: (entityUuid: Uuid) => void;
//   onNavigateNext: () => void;
//   onNavigatePrevious: () => void;
//   onNavigateRandom: () => void;
//   onToggleShowAll: () => void;
// }>(
function EntityInstancePanel(props:{
  entityInstances: EntityInstance[];
  selectedEntityInstance: EntityInstance | undefined;
  selectedEntityInstanceDefinition: EntityDefinition | undefined;
  currentInstanceIndex: number;
  deploymentUuid: Uuid;
  availableEntities: Entity[];
  selectedEntityUuid: Uuid;
  showAllInstances: boolean;
  onEntityChange: (entityUuid: Uuid) => void;
  onNavigateNext: () => void;
  onNavigatePrevious: () => void;
  onNavigateRandom: () => void;
  onToggleShowAll: () => void;
}): JSX.Element {
  const {entityInstances,
  selectedEntityInstance,
  selectedEntityInstanceDefinition,
  currentInstanceIndex,
  deploymentUuid,
  availableEntities,
  selectedEntityUuid,
  showAllInstances,
  onEntityChange,
  onNavigateNext,
  onNavigatePrevious,
  onNavigateRandom,
  onToggleShowAll,
} = props;
  return (
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
              onClick={onToggleShowAll}
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

        {/* Entity Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "14px", fontWeight: "bold", minWidth: "60px" }}>Entity:</label>
          <select
            value={selectedEntityUuid}
            onChange={(e) => onEntityChange(e.target.value as Uuid)}
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
            {availableEntities.map((entity) => (
              <option key={entity.uuid} value={entity.uuid}>
                {entity.name || entity.uuid}
              </option>
            ))}
          </select>
          {/* Navigation buttons - only show when in single instance mode */}
          {!showAllInstances && entityInstances.length > 1 && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={onNavigatePrevious}
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
                onClick={onNavigateNext}
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
                onClick={onNavigateRandom}
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
            <ThemedOnScreenHelper
              label={`TypedValueObjectEditor showing all ${
                entityInstances.length
              } instances of entity '${selectedEntityInstanceDefinition?.name || ""}`}
              data={{
                type: "object",
                definition: {
                  entityInstances: {
                    definition: {
                      type: "array",
                      definition:
                        selectedEntityInstanceDefinition?.jzodSchema ?? createGenericObjectSchema(),
                    },
                  },
                },
              }}
            />
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
                        selectedEntityInstanceDefinition?.jzodSchema ?? createGenericObjectSchema(),
                    },
                  },
                } as any
              } // TODO: ILL-TYPED!!
              formikValuePathAsString="entityInstances"
              deploymentUuid={deploymentUuid}
              applicationSection={"data"}
              formLabel={"All Entity Instances Viewer"}
              onSubmit={async () => {}} // No-op for readonly
              maxRenderDepth={3}
              readonly={true}
            />
          </>
        ) : (
          <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
            No entity instances found
          </div>
        )
      ) : /* Show single instance */
      selectedEntityInstance ? (
        <TypedValueObjectEditorWithFormik
          labelElement={<></>}
          initialValueObject={{ selectedEntityInstance }}
          // valueObjectMMLSchema={createGenericObjectSchema()}
          formValueMLSchema={{
            type: "object",
            definition: {
              selectedEntityInstance:
                selectedEntityInstanceDefinition?.jzodSchema ?? createGenericObjectSchema(),
            },
          }}
          formikValuePathAsString="selectedEntityInstance"
          deploymentUuid={deploymentUuid}
          applicationSection={"data"}
          formLabel={"Entity Instance Viewer"}
          onSubmit={async () => {}} // No-op for readonly
          maxRenderDepth={3}
          readonly={true}
        />
      ) : (
        <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
          No entity instances found
        </div>
      )}
    </ThemedContainer>
  );
}

// const DebugPanel = React.memo<{
//   currentTransformerDefinition: any;
// }>(({ currentTransformerDefinition }) => (
//   <ThemedContainer style={{ marginTop: "20px" }}>
//     <ThemedHeaderSection>
//       <ThemedTitle>Current Transformer Definition (Debug)</ThemedTitle>
//     </ThemedHeaderSection>
//     <ThemedCodeBlock>{safeStringify(currentTransformerDefinition, 2)}</ThemedCodeBlock>
//   </ThemedContainer>
// ));

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
/**
 * TransformerEditor allows users to create and test transformers on entity instances.
 * 
 * To reference the entity instance(s) in your transformer, use getFromContext with one of these names:
 * - "defaultInput" - the standard reference name (single instance or array when showing all)
 * - Or use any property name from the entity instance directly (e.g., "uuid", "name", etc.)
 * 
 * Example transformer that copies the default input:
 * {
 *   "transformerType": "getFromContext",
 *   "referenceName": "defaultInput"
 * }
 * 
 * Example transformer that gets the name field from an instance input:
 * {
 *   "transformerType": "getFromContext",
 *   "referenceName": "name"
 * }
 * 
 * When "Show All" mode is active, the target becomes an array of all entity instances.
 */
export interface TransformerEditorProps {
  deploymentUuid: Uuid;
  entityUuid: Uuid;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export const TransformerEditor: React.FC<TransformerEditorProps> = (props) => {
  const runnerName: string = "transformerEditor";
  const runnerLabel: string = "Transformer Editor";

  const { deploymentUuid, entityUuid: initialEntityUuid } = props;
  const context = useMiroirContextService();
  const currentModel = useCurrentModel(deploymentUuid);
  const reportContext = useReportPageContext();
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  const miroirContextService = useMiroirContextService();

  // Ref for debouncing transformer definition updates when mode='here'
  const transformerUpdateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Get persisted state from context
  const persistedState = context.toolsPageState.transformerEditor;
  // const currentMode: "here" | "defined" = persistedState?.mode || "here";
  const currentHereTransformerDefinition: TransformerForBuildPlusRuntime =
    persistedState?.currentTransformerDefinition ?? { transformerType: "returnValue", value: null };
  // ##############################################################################################

  const showAllInstances = persistedState?.showAllInstances || false;
  // State to track the current instance index (with persistence)
  const [currentInstanceIndex, setCurrentInstanceIndex] = useState<number>(
    persistedState?.currentInstanceIndex || 0
  );

  // // State to track whether to show all instances or single instance (with persistence)
  // const [showAllInstances, setShowAllInstances] = useState<boolean>(
  //   persistedState?.showAllInstances || false
  // );

  // const [persistedState, setPersistedState] = useState<ToolsPageState["transformerEditor"] | undefined>(

  // State to track the currently selected entity (with persistence)
  const [selectedEntityUuid, setSelectedEntityUuid] = useState<Uuid>(initialEntityUuid);

  const currentMiroirModelEnvironment: MiroirModelEnvironment = useMemo(() => {
    return {
      miroirFundamentalJzodSchema:
        context.miroirFundamentalJzodSchema ?? (miroirFundamentalJzodSchema as JzodSchema),
      miroirMetaModel: miroirMetaModel,
      currentModel: currentModel,
    };
  }, [miroirMetaModel, currentModel, context.miroirFundamentalJzodSchema]);

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

  // Ensure selected entity is valid when available entities change
  useEffect(() => {
    const availableEntityUuids = currentReportDeploymentSectionEntities?.map((e) => e.uuid) || [];
    if (availableEntityUuids.length > 0 && !availableEntityUuids.includes(selectedEntityUuid)) {
      // If current selection is not available, default to the first available entity
      setSelectedEntityUuid(availableEntityUuids[0]);
    }
  }, [currentReportDeploymentSectionEntities, selectedEntityUuid]);

  // Reset index when entity changes
  useEffect(() => {
    setCurrentInstanceIndex(0);
    // Also reset to single instance mode when entity changes, but only if it's currently showing all
    // if (showAllInstances) {
    // setShowAllInstances(false);
    // context.updateTransformerEditorState({ showAllInstances: false });
    // }
  }, [selectedEntityUuid]); // Remove context from dependencies to prevent infinite refresh

  const currentReportTargetEntity: Entity | undefined =
    currentReportDeploymentSectionEntities?.find((e) => e?.uuid === selectedEntityUuid);

  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find(
      (e) => e?.entityUuid === currentReportTargetEntity?.uuid
    );

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
    useMemo(() => getMemoizedReduxDeploymentsStateSelectorMap(), []);

  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    useCallback(
      (state: ReduxStateWithUndoRedo) =>
        deploymentEntityStateSelectorMap.extractState(
          state.presentModelSnapshot.current,
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
        deploymentUuid,
        selectedEntityUuid,
        "name" // Order by name if available
      );
    } catch (error) {
      log.error("Error fetching entity instances:", error);
      return [];
    }
  }, [deploymentEntityState, currentMiroirModelEnvironment, deploymentUuid, selectedEntityUuid]);

  // ##############################################################################################
  // ##############################################################################################
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
      const newIndex = (currentInstanceIndex - 1 + entityInstances.length) % entityInstances.length;
      setCurrentInstanceIndex(newIndex);
      // Persist to context
      context.updateTransformerEditorState({
        ...context.toolsPageState.transformerEditor,
        currentInstanceIndex: newIndex,
      });
    }
  }, [entityInstances.length, currentInstanceIndex, context.toolsPageState.transformerEditor]); // Remove context from dependencies

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
  }, [entityInstances.length, currentInstanceIndex, context.toolsPageState.transformerEditor]); // Remove context from dependencies

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

  // Handler for toggling show all instances mode (with persistence)
  const handleToggleShowAll = useCallback(() => {
    const newShowAllInstances = !context.toolsPageState.transformerEditor?.showAllInstances;
    context.updateTransformerEditorState({
      ...context.toolsPageState.transformerEditor,
      showAllInstances: newShowAllInstances,
    });
  }, [context.toolsPageState.transformerEditor?.showAllInstances]); // Remove context from dependencies
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

  // Memoized context results to avoid recreating on every execution
  // const inputSelectorInstances = useMemo(() => {
  //   if (showAllInstances) {
  //     // When showing all instances, target becomes an array of all instances
  //     if (entityInstances.length === 0) return {};

  //     return {
  //       // entityInstance: entityInstances,
  //       // instance: entityInstances,
  //       [defaultTransformerInput]: entityInstances,
  //       // applyTo: entityInstances,
  //       // Also provide individual properties from the first instance for compatibility
  //       // (in case transformers expect single instance properties)
  //       ...(entityInstances[0] || {}),
  //     };
  //   } else {
  //     // When showing single instance, target is the selected instance
  //     if (!selectedEntityInstance) return {};

  //     return {
  //       entityInstance: selectedEntityInstance,
  //       instance: selectedEntityInstance,
  //       // target: selectedEntityInstance,
  //       [defaultTransformerInput]: selectedEntityInstance,
  //       applyTo: selectedEntityInstance,
  //       ...selectedEntityInstance,
  //     };
  //   }
  // }, [showAllInstances, entityInstances, selectedEntityInstance]);

  // #################################################################################################
  // const transformerEditorForm_transformerDefinitionAttributeName = "currentTransformerDefinition";
  // const formMlSchema: JzodObject = useMemo(() => {
  //   return {
  //     type: "object",
  //     definition: {
  //       transformerEditor_selector: {
  //         type: "union",
  //         discriminator: "mode",
  //         tag: {
  //           value: {
  //             initializeTo: {
  //               initializeToType: "value",
  //               value: "here",
  //             },
  //           },
  //         },
  //         definition: [
  //           // here mode uses the in-editor transformer
  //           {
  //             type: "object",
  //             definition: {
  //               mode: {
  //                 type: "literal",
  //                 definition: "here",
  //               },
  //               transformer: {
  //                 type: "schemaReference",
  //                 definition: {
  //                   absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                   relativePath: "transformerForBuildPlusRuntime",
  //                 },
  //               },
  //             },
  //           },
  //           // defined mode uses a stored transformer
  //           {
  //             type: "object",
  //             definition: {
  //               mode: {
  //                 type: "literal",
  //                 definition: "defined",
  //               },
  //               application: {
  //                 type: "uuid",
  //                 nullable: true,
  //                 tag: {
  //                   value: {
  //                     defaultLabel: "Application",
  //                     editable: true,
  //                     selectorParams: {
  //                       targetDeploymentUuid: adminConfigurationDeploymentAdmin.uuid,
  //                       targetEntity: entityApplicationForAdmin.uuid,
  //                       targetEntityOrderInstancesBy: "name",
  //                     },
  //                     initializeTo: {
  //                       initializeToType: "value",
  //                       value: noValue.uuid,
  //                     },
  //                   },
  //                 },
  //               },
  //               transformer: {
  //                 type: "uuid",
  //                 tag: {
  //                   value: {
  //                     initializeTo: {
  //                       initializeToType: "value",
  //                       value: noValue.uuid,
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         ],
  //       } as JzodUnion,
  //       transformerEditor_editor: {
  //         type: "object",
  //         definition: {
  //           currentTransformerDefinition: {
  //             type: "schemaReference",
  //             definition: {
  //               absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //               relativePath: "transformerForBuildPlusRuntime",
  //             },
  //           },
  //         },
  //       } as JzodObject,
  //     },
  //   };
  // }, [currentReportTargetEntityDefinition]);

  // TransformerDefinition schema - memoized to avoid recalculation
  // const transformerDefinitionSchema: JzodElement = useMemo(
  //   () => ({
  //     type: "schemaReference",
  //     definition: {
  //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //       relativePath: "transformerForBuildPlusRuntime",
  //     },
  //   }),
  //   []
  // );

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

  // // ################################################################################################
  // // Apply transformer to selected entity instance with debouncing
  // // const applyTransformerToInstance = useCallback(async () => {
  // //   if (!currentTransformerDefinition || (showAllInstances ? entityInstances.length === 0 : !selectedEntityInstance)) {
  // //     // setTransformationResult(null);
  // //     setTransformationError(null);
  // //     return null;
  // //   }

  // //   // Clear existing timeout
  // //   if (transformerTimeoutRef.current) {
  // //     clearTimeout(transformerTimeoutRef.current);
  // //   }

  // //   // Debounce transformer execution
  // //   transformerTimeoutRef.current = setTimeout(async () => {
  // //     try {
  // //       log.info("Applying transformer to instance(s)", {
  // //         transformer: currentTransformerDefinition,
  // //         showAllInstances,
  // //         instanceCount: showAllInstances ? entityInstances.length : 1,
  // //         target: showAllInstances ? entityInstances : selectedEntityInstance,
  // //       });

  // //       const result: TransformerReturnType<any> = transformer_extended_apply_wrapper(
  // //         context.miroirContext.miroirActivityTracker, // activityTracker
  // //         "runtime", // step
  // //         ["rootTransformer"], // transformerPath
  // //         "TransformerEditor", // label
  // //         currentTransformerDefinition, // transformer
  // //         { ...currentMiroirModelEnvironment, ...contextResults }, // transformerParams
  // //         contextResults, // contextResults - pass the instance to transform
  // //         "value" // resolveBuildTransformersTo
  // //       );

  // //       // Check for Domain2ElementFailed pattern
  // //       if (result && typeof result === "object" && "queryFailure" in result) {
  // //         // setTransformationError(`Transformation failed: ${safeStringify(result)}`);
  // //         setTransformationError(result);
  // //         // setTransformationResult(null);
  // //         return null;
  // //       } else {
  // //         // setTransformationResult(result);
  // //         setTransformationError(null);
  // //         return result;
  // //         log.info("Transformation successful", { result });
  // //       }
  // //     } catch (error) {
  // //       const errorMessage = error instanceof Error ? error.message : String(error);
  // //       log.error("Error applying transformer:", error);
  // //       setTransformationError({
  // //         queryFailure: "FailedTransformer",
  // //         elementType: "Transformer",
  // //         transformerPath: [],
  // //         failureMessage: errorMessage,
  // //       });
  // //       // setTransformationResult(null);
  // //       return null;
  // //     }
  // //   }, 300); // 300ms debounce
  // // }, [
  // //   currentTransformerDefinition,
  // //   showAllInstances,
  // //   entityInstances,
  // //   selectedEntityInstance,
  // //   currentMiroirModelEnvironment,
  // //   contextResults,
  // // ]);

  // // useEffect(() => {
  // //   miroirContextService.miroirContext.miroirActivityTracker.resetResults();
  // // }, [miroirContextService.miroirContext.miroirActivityTracker, currentTransformerDefinition]);
  // log.info("TransformerEditor contextResults:", contextResults);
  // const [transformationResult, setTransformationResult] = useState<TransformerReturnType<any>>();

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
  // // ################################################################################################
  // const transformerEventsPanel: JSX.Element = useMemo(() => {
  //   log.info("Rendering new transformerEventsPanel with events:", context.miroirContext.miroirEventService.events);
  //   return (
  //     <>
  //       <TransformerEventsPanel />
  //     </>
  //   );

  // }, [transformationResult, context.miroirContext.miroirEventService.events.size]);
  // // ################################################################################################
  // const transformationResultSchema: JzodElement = useMemo(() => {
  //   // if (!currentHereTransformerDefinition) {
  //   //   return { type: "any" } as JzodElement;
  //   // }
  //   return (valueToJzod(transformationResult) ?? { type: "any" }) as JzodElement;
  // }, [transformationResult]);

  // ################################################################################################
  const initialFormValues = useMemo(() => {
    return {
      // For mode selector - transformer field is only used when mode='here'
      transformerEditor_selector: {
        // transformer: currentHereTransformerDefinition,
        mode: "none",
      },
      transformerEditor_input: {},
      transformerEditor_input_selector: {
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
          Transformer Editor for Entity "{currentReportTargetEntity?.name || selectedEntityUuid}" of
          deployment {deploymentUuid}
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
        // initialValues={{ currentTransformerDefinition }}
        initialValues={initialFormValues as any}
        onSubmit={async (values, { setSubmitting, setErrors }) => {
          // if (readonly) {
          //   setSubmitting(false);
          //   return;
          // }
          try {
            log.info("onSubmit formik values", values);

            // Handle zoom case: merge changes back into the full object for submission
            // const finalValues = hasZoomPath
            //   ? setValueAtPath(initialValueObject, zoomInPath!, values)
            //   : values;

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
            formikContext: FormikProps<{
              transformerEditor_selector: {
                mode?: "here" | "defined" | "none";
                transformer?: TransformerForBuildPlusRuntime;
              };
              transformerEditor_input_selector: {
                mode: "instance" | "here" | "none";
                input?: any;
              };
              transformerEditor_input: any;
              transformerEditor_editor: {
                currentTransformerDefinition: TransformerForBuildPlusRuntime;
              };
            }>
          ) => {
            const deploymentUuidQuery:
              | BoxedQueryWithExtractorCombinerTransformer
              | BoxedQueryTemplateWithExtractorCombinerTransformer
              | undefined = useMemo(
              () =>
                // formikContext.values[runnerName]?.application !== noValue.uuid &&
                formikContext.values.transformerEditor_selector.mode === "defined" &&
                (formikContext.values.transformerEditor_selector as any).application !==
                  noValue.uuid
                  ? ({
                      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
                      deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                      pageParams: {},
                      queryParams: formikContext.values,
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
                              definition: `{{transformerEditor_selector.application}}`,
                            },
                          },
                        },
                      },
                    } as BoxedQueryTemplateWithExtractorCombinerTransformer)
                  : // ({
                    //     ...props.deploymentUuidQuery,
                    //     queryParams: {
                    //       ...(props.deploymentUuidQuery.queryParams ?? {}),
                    //       ...formikContext.values, // letting the template access the form state
                    //     },
                    //   } as BoxedQueryTemplateWithExtractorCombinerTransformer)
                    {
                      queryType: "boxedQueryWithExtractorCombinerTransformer",
                      deploymentUuid: "",
                      pageParams: {},
                      queryParams: {},
                      contextResults: {},
                      extractors: {},
                    },
              [
                formikContext.values.transformerEditor_selector.mode,
                (formikContext.values.transformerEditor_selector as any).application,
              ]
            );

            const deploymentUuidQueryResults: Domain2QueryReturnType<
              Domain2QueryReturnType<Record<string, any>>
            > = useQueryTemplateResults({} as any, deploymentUuidQuery);

            if (deploymentUuidQueryResults instanceof Domain2ElementFailed) {
              // should never happen
              throw new Error(
                "DeleteEntityRunner: failed to get report data: " +
                  JSON.stringify(deploymentUuidQueryResults, null, 2)
              );
            }
            const { reportData: deploymentUuidQueryResultsData, resolvedQuery } =
              deploymentUuidQueryResults;
            const deploymentUuidFromApplicationUuid: Uuid = useMemo(() => {
              return deploymentUuidQueryResultsData?.deployments &&
                deploymentUuidQueryResultsData?.deployments.length == 1
                ? deploymentUuidQueryResultsData?.deployments[0].uuid
                : "NOT_FOUND";
            }, [deploymentUuidQueryResultsData]);

            // ##################################################################################
            // fetch defined transformer definition
            const transformerDefinitionApplicationSection = getApplicationSection(
              deploymentUuidFromApplicationUuid,
              entityTransformerDefinition.uuid
            );
            const transformerQuery:
              | BoxedQueryWithExtractorCombinerTransformer
              | BoxedQueryTemplateWithExtractorCombinerTransformer
              | undefined = useMemo(
              () =>
                // formikContext.values[runnerName]?.application !== noValue.uuid &&
                formikContext.values.transformerEditor_selector.mode === "defined" &&
                (formikContext.values.transformerEditor_selector as any).application !==
                  noValue.uuid &&
                deploymentUuidFromApplicationUuid &&
                deploymentUuidFromApplicationUuid !== "NOT_FOUND"
                  ? ({
                      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
                      deploymentUuid: deploymentUuidFromApplicationUuid,
                      pageParams: {},
                      queryParams: formikContext.values,
                      contextResults: {},
                      extractorTemplates: {
                        transformers: {
                          label: "transformers of the given application",
                          extractorTemplateType: "extractorTemplateForObjectListByEntity",
                          parentUuid: entityTransformerDefinition.uuid,
                          parentName: entityTransformerDefinition.name,
                          applicationSection: transformerDefinitionApplicationSection,
                          filter: {
                            attributeName: "uuid",
                            value: {
                              transformerType: "mustacheStringTemplate",
                              interpolation: "build",
                              definition: `{{transformerEditor_selector.transformerUuid}}`,
                            },
                          },
                        },
                      },
                    } as BoxedQueryTemplateWithExtractorCombinerTransformer)
                  : // ({
                    //     ...props.deploymentUuidQuery,
                    //     queryParams: {
                    //       ...(props.deploymentUuidQuery.queryParams ?? {}),
                    //       ...formikContext.values, // letting the template access the form state
                    //     },
                    //   } as BoxedQueryTemplateWithExtractorCombinerTransformer)
                    {
                      queryType: "boxedQueryWithExtractorCombinerTransformer",
                      deploymentUuid: "",
                      pageParams: {},
                      queryParams: {},
                      contextResults: {},
                      extractors: {},
                    },
              [
                formikContext.values.transformerEditor_selector.mode,
                deploymentUuidFromApplicationUuid,
                (formikContext.values.transformerEditor_selector as any).transformerUuid,
              ]
            );

            const transformerQueryResults: Domain2QueryReturnType<
              Domain2QueryReturnType<Record<string, any>>
            > = useQueryTemplateResults({} as any, transformerQuery);

            if (transformerQueryResults instanceof Domain2ElementFailed) {
              // should never happen
              throw new Error(
                "TransformerEditor: failed to get report data: " +
                  JSON.stringify(transformerQueryResults, null, 2)
              );
            }
            // const {reportData: transformerQueryResultsData } = transformerQueryResults;
            const currentFetchedTransformerDefinition: TransformerDefinition | string =
              useMemo(() => {
                return transformerQueryResults?.reportData?.transformers &&
                  transformerQueryResults?.reportData?.transformers.length == 1
                  ? transformerQueryResults?.reportData?.transformers[0]
                  : "NOT_FOUND";
              }, [transformerQueryResults]);

            // ##################################################################################
            // transformerEditor_selector persistedState -> formik
            useEffect(() => {
              log.info(
                "TransformerEditor: got new mode:",
                // formikContext.values.transformerEditor_selector.mode
                persistedState?.selector?.mode
              );
              if (formikContext.values.transformerEditor_selector.mode == "none") {
                if (persistedState?.selector?.mode && persistedState?.selector?.mode !== "none") {
                  // restore state from persistedState
                  log.info(
                    "TransformerEditor: initializing mode from persisted state:",
                    persistedState?.selector?.mode
                  );
                  formikContext.setFieldValue(
                    "transformerEditor_selector",
                    persistedState?.selector
                  );
                }
              }

              switch (formikContext.values.transformerEditor_input_selector.mode) {
                case "here": {
                  // if (persistedState?.input_selector?.input) {
                  //   formikContext.setFieldValue(
                  //     "transformerEditor_input_selector",
                  //     { mode: "here", input: persistedState?.input_selector.input }
                  //   );
                  // }
                  break;
                }
                case "instance": {
                  // clears the formik transformerEditor_input_selector.input
                  if (Object.hasOwn(formikContext.values.transformerEditor_input_selector, "input")) {
                    formikContext.setFieldValue("transformerEditor_input_selector", {
                      mode: "instance",
                    });
                  }
                  break;
                }
                case "none": {
                  // sets the formik input_selector from the persisted state input_selector, if there is one
                  if (persistedState?.input_selector?.mode) {
                    formikContext.setFieldValue(
                      "transformerEditor_input_selector",
                      persistedState?.input_selector
                    );
                  } else {
                    formikContext.setFieldValue("transformerEditor_input_selector", {
                      mode: "here",
                      input: { placeholder: "put your input here..." },
                    });
                  }
                  break;
                }
              }
              // restore state from persistedState
              // // transfer the current transformer definition in persistedState to the formik context
              // if (
              //   // formikContext.values.transformerEditor_selector.mode === "here"
              //   persistedState?.selector?.mode === "here"
              // ) {
              //   formikContext.setFieldValue(
              //     "transformerEditor_selector.transformer",
              //     persistedState?.selector?.transformer
              //   );
              // }

              // When mode is 'defined' and transformerUuid is changed, fetch transformer from stored definition and update formik context
              if (
                formikContext.values.transformerEditor_selector.mode === "defined" &&
                (formikContext.values.transformerEditor_selector as any).application &&
                (formikContext.values.transformerEditor_selector as any).transformerUuid &&
                (formikContext.values.transformerEditor_selector as any).transformerUuid !==
                  noValue.uuid &&
                (formikContext.values.transformerEditor_selector as any).transformerUuid !==
                  (persistedState?.selector as any).transformerUuid &&
                currentFetchedTransformerDefinition &&
                typeof currentFetchedTransformerDefinition == "object" &&
                currentFetchedTransformerDefinition.transformerImplementation
                  ?.transformerImplementationType == "transformer"
              ) {
                log.info(
                  "TransformerEditor: updating context with stored transformer definition:",
                  currentFetchedTransformerDefinition.transformerImplementation?.definition
                );
                formikContext.setFieldValue(
                  "transformerEditor_selector.transformer",
                  currentFetchedTransformerDefinition.transformerImplementation?.definition
                );
              }
            }, [
              formikContext.values.transformerEditor_selector.mode,
              persistedState?.selector,
              currentFetchedTransformerDefinition,
            ]);

            // ##################################################################################
            // transformerEditor_selector, transformerEditor_input_selector formik -> persistedState
            // Debounced update to context when mode='here' and transformer definition changes
            useEffect(() => {
              // Clear existing timeout
              if (transformerUpdateTimeoutRef.current) {
                clearTimeout(transformerUpdateTimeoutRef.current);
              }

              // Only update if mode is defined
              if (
                !formikContext.values.transformerEditor_selector.mode ||
                formikContext.values.transformerEditor_selector.mode === "none"
              ) {
                return;
              }

              // Debounce the update - only push to context after 2 seconds of no changes
              transformerUpdateTimeoutRef.current = setTimeout(() => {
                log.info(
                  "TransformerEditor: debounced update - pushing transformer to context:",
                  formikContext.values.transformerEditor_selector.transformer
                );
                const selector =
                  formikContext.values.transformerEditor_selector.mode === "defined"
                    ? {
                        mode: "defined" as any, //formikContext.values.transformerEditor_selector.mode,
                        application: (formikContext.values.transformerEditor_selector as any)
                          .application,
                        transformerUuid: (formikContext.values.transformerEditor_selector as any)
                          .transformerUuid,
                        transformer: (formikContext.values.transformerEditor_selector as any)
                          .transformer, // restores potentially saved modifications
                      }
                    : {
                        mode: "here" as any, //formikContext.values.transformerEditor_selector.mode
                        transformer: formikContext.values.transformerEditor_selector.transformer,
                      };
                context.updateTransformerEditorState({
                  currentTransformerDefinition:
                    formikContext.values.transformerEditor_selector.transformer,
                  selector,
                  input_selector: {
                    mode: formikContext.values.transformerEditor_input_selector.mode as any,
                    input: formikContext.values.transformerEditor_input_selector.input,
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
              formikContext.values.transformerEditor_selector.mode,
              formikContext.values.transformerEditor_selector.transformer,
              formikContext.values.transformerEditor_input_selector.mode,
              formikContext.values.transformerEditor_input_selector.input,
              // formikContext.values.transformerEditor_editor.currentTransformerDefinition,
            ]);

            // ##################################################################################
            const inputSelectorData = useMemo(() => {
              const defaultTransformerInputValue =
                formikContext.values.transformerEditor_input_selector.mode == "instance"
                  ? showAllInstances
                    ? entityInstances
                    : selectedEntityInstance
                  : formikContext.values.transformerEditor_input;
              if (showAllInstances) {
                // When showing all instances, target becomes an array of all instances
                if (entityInstances.length === 0) return {};

                return {
                  // entityInstance: entityInstances,
                  // instance: entityInstances,
                  // [defaultTransformerInput]: entityInstances,
                  [defaultTransformerInput]: defaultTransformerInputValue,
                  // spreadsheetContents,
                  // applyTo: entityInstances,
                  // Also provide individual properties from the first instance for compatibility
                  // (in case transformers expect single instance properties)
                  // ...(entityInstances[0] || {}),
                };
              } else {
                // When showing single instance, target is the selected instance
                if (!selectedEntityInstance) return {};

                return {
                  // entityInstance: selectedEntityInstance,
                  // instance: selectedEntityInstance,
                  // spreadsheetContents,
                  // target: selectedEntityInstance,
                  // [defaultTransformerInput]: selectedEntityInstance,
                  [defaultTransformerInput]: defaultTransformerInputValue,
                  // applyTo: selectedEntityInstance,
                  // ...selectedEntityInstance,
                };
              }
            }, [showAllInstances, entityInstances, selectedEntityInstance]);

            // ##################################################################################
            // input -> formik
            useEffect(() => {
              if (formikContext.values.transformerEditor_input_selector.mode == "instance") {
                formikContext.setFieldValue("transformerEditor_input", inputSelectorData);
              }
            }, [
              formikContext.values.transformerEditor_input_selector.mode,
              // formikContext.values.transformerEditor_input.input,
              inputSelectorData,
            ]);

            const transformerInput = useMemo(
              () =>
                formikContext.values.transformerEditor_input_selector.mode == "here"
                  ? formikContext.values.transformerEditor_input_selector.input ?? {}
                  : formikContext.values.transformerEditor_input ?? {},
              [
                formikContext.values.transformerEditor_input_selector.mode,
                formikContext.values.transformerEditor_input_selector.input,
                formikContext.values.transformerEditor_input,
              ]
            );

            // ##################################################################################
            // run transformation when transformer definition or imput data change
            // useEffect(() => {
            //   // let ignore = false;
            //   const currentFormikTransformerDefinition =
            //     formikContext.values.transformerEditor_editor.currentTransformerDefinition;
            //   try {
            //     log.info("Applying transformer to instance(s)", {
            //       transformer: currentFormikTransformerDefinition,
            //       showAllInstances,
            //       instanceCount: showAllInstances ? entityInstances.length : 1,
            //       target: showAllInstances ? entityInstances : selectedEntityInstance,
            //     });
            //     const transformerParams = {
            //       ...currentMiroirModelEnvironment,
            //       ...contextResults,
            //     };
            //     // const result: TransformerReturnType<any> =
            //     //   await miroirContextService.miroirContext.miroirActivityTracker.trackTransformerRun(
            //     miroirContextService.miroirContext.miroirActivityTracker.trackTransformerRun(
            //       (currentFormikTransformerDefinition as any)?.label ??
            //         (currentFormikTransformerDefinition as any)?.transformerType ??
            //         "UnnamedTransformer",
            //       (currentFormikTransformerDefinition as any)?.transformerType as any,
            //       "runtime",
            //       transformerParams,
            //       undefined, // parentId
            //       () => {
            //         const transformationResult = transformer_extended_apply_wrapper(
            //           context.miroirContext.miroirActivityTracker, // activityTracker
            //           "runtime", // step
            //           ["rootTransformer"], // transformerPath
            //           "TransformerEditor", // label
            //           currentFormikTransformerDefinition, // transformer
            //           currentMiroirModelEnvironment,
            //           transformerParams,
            //           contextResults, // contextResults - pass the instance to transform
            //           "value" // resolveBuildTransformersTo
            //         );
            //         setTransformationResult(transformationResult);
            //         log.info("Applied transformer to instance(s)", {
            //           transformer: currentFormikTransformerDefinition,
            //           showAllInstances,
            //           instanceCount: showAllInstances ? entityInstances.length : 1,
            //           target: showAllInstances ? entityInstances : selectedEntityInstance,
            //           transformationResult,
            //         });
            //         return transformationResult;
            //       }
            //     );

            //     // // Check for Domain2ElementFailed pattern
            //     // if (result && typeof result === "object" && "queryFailure" in result) {
            //     //   setTransformationError(result);
            //     //   return null;
            //     // } else {
            //     //   setTransformationError(null);
            //     //   return result;
            //     // }
            //     // return result;
            //   } catch (error) {
            //     const errorMessage = error instanceof Error ? error.message : String(error);
            //     log.error("Error applying transformer:", error);
            //     setTransformationResult({
            //       queryFailure: "FailedTransformer",
            //       elementType: "Transformer",
            //       transformerPath: [],
            //       failureMessage: errorMessage,
            //     });
            //     // return ({
            //     //   queryFailure: "FailedTransformer",
            //     //   elementType: "Transformer",
            //     //   transformerPath: [],
            //     //   failureMessage: errorMessage,
            //     // });
            //     // return null;
            //   } finally {
            //     // return Promise.resolve();
            //   }
            // }, [
            //   formikContext.values.transformerEditor_editor
            //           .currentTransformerDefinition,
            //   // transformationResult,
            //   showAllInstances,
            //   entityInstances,
            //   selectedEntityInstance,
            //   currentMiroirModelEnvironment,
            //   contextResults,
            //   context.miroirContext.miroirActivityTracker,
            //   context.miroirContext,
            //   context.toolsPageState,
            // ]);
            const transformationResult = useMemo(() => {
              const currentFormikTransformerDefinition = formikContext.values
                .transformerEditor_selector.transformer ?? {
                transformerType: "returnValue",
                value: null,
              };
              // const currentFormikTransformerDefinition =
              //   formikContext.values.transformerEditor_editor.currentTransformerDefinition;
              const transformerParams = {
                // spreadsheetContents: [],
                ...currentMiroirModelEnvironment,
                // ...inputSelectorData,
                ...transformerInput,
              };

              return transformer_extended_apply_wrapper(
                context.miroirContext.miroirActivityTracker, // activityTracker
                "runtime", // step
                ["rootTransformer"], // transformerPath
                "TransformerEditor", // label
                currentFormikTransformerDefinition, // transformer
                currentMiroirModelEnvironment,
                transformerParams,
                // inputSelectorData, // contextResults - pass the instance to transform
                transformerInput, // contextResults - pass the input to transform
                "value" // resolveBuildTransformersTo
              );
              // }, [formikContext.values.transformerEditor_editor.currentTransformerDefinition]);
            }, [formikContext.values.transformerEditor_selector.transformer, transformerInput]);

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
                  transformerEditor_selector: {
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
                      // here mode uses the in-editor transformer
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
                      // defined mode uses a stored transformer
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
                                  targetDeploymentUuid: adminConfigurationDeploymentAdmin.uuid,
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
                                  targetDeploymentUuid: deploymentUuidFromApplicationUuid,
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
                  transformerEditor_input_selector: {
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
                      // instance mode extract ENtity instances using a query
                      {
                        type: "object",
                        definition: {
                          mode: {
                            type: "literal",
                            definition: "instance",
                          },
                          // input: {
                          //   type: "any",
                          //   optional: true,
                          // },
                          // application: {
                          //   type: "uuid",
                          //   nullable: true,
                          //   tag: {
                          //     value: {
                          //       defaultLabel: "Application",
                          //       editable: true,
                          //       selectorParams: {
                          //         targetDeploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                          //         targetEntity: entityApplicationForAdmin.uuid,
                          //         targetEntityOrderInstancesBy: "name",
                          //       },
                          //       initializeTo: {
                          //         initializeToType: "value",
                          //         value: noValue.uuid,
                          //       },
                          //     },
                          //   },
                          // },
                          // transformerUuid: {
                          //   type: "uuid",
                          //   tag: {
                          //     value: {
                          //       selectorParams: {
                          //         targetDeploymentUuid: deploymentUuidFromApplicationUuid,
                          //         targetEntity: entityDefinitionTransformerDefinition.entityUuid,
                          //         targetEntityOrderInstancesBy: "name",
                          //       },
                          //       initializeTo: {
                          //         initializeToType: "value",
                          //         value: noValue.uuid,
                          //       },
                          //     },
                          //   },
                          // },
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
            }, [currentReportTargetEntityDefinition, deploymentUuidFromApplicationUuid]);

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
                  {/* <ThemedOnScreenHelper
                      label="deploymentUuidQueryResultsData"
                      data={deploymentUuidQueryResultsData}
                    /> */}
                  {/* <ThemedOnScreenHelper
                        label="deploymentUuidFromApplicationUuid"
                        data={deploymentUuidFromApplicationUuid}
                      /> */}
                  {/* <ThemedOnScreenHelper
                      label="transformerQuery"
                      data={transformerQuery}
                    /> */}
                  {/*  */}
                  {/*  */}
                  {/* <ThemedOnScreenHelper
                      label="persistedState?.selector"
                      data={persistedState?.selector}
                      initiallyUnfolded={false}
                    /> */}
                  {/* <ThemedOnScreenHelper
                      label="formikValues"
                      data={formikContext.values}
                      initiallyUnfolded={false}
                    /> */}
                  {/* <ThemedOnScreenHelper
                      label="formik Transformer Definition"
                      data={{
                        mode: formikContext.values.transformerEditor_selector.mode,
                        defn: formikContext.values.transformerEditor_selector.transformer,
                      }}
                      initiallyUnfolded={false}
                    /> */}
                  {/* <ThemedOnScreenHelper
                      label="currentDefinedTransformerDefinition"
                      data={currentFetchedTransformerDefinition}
                      initiallyUnfolded={false}
                    /> */}
                  {/* <ThemedOnScreenHelper
                      label="currentHereTransformerDefinition"
                      data={currentHereTransformerDefinition}
                      initiallyUnfolded={false}
                    /> */}
                  {/* <ThemedOnScreenHelper
                      label="transformerQueryResults"
                      data={transformerQueryResults}
                      initiallyUnfolded={false}
                    /> */}
                  {/* <ThemedOnScreenHelper
                      label="transformer mode"
                      data={formikContext.values.transformerEditor_selector.mode}
                      initiallyUnfolded={false}
                    /> */}
                  {/* <ThemedOnScreenHelper
                      label="transformer input"
                      data={transformerInput}
                      initiallyUnfolded={false}
                    /> */}
                  {/* <ThemedOnScreenHelper
                      label="transformation Error"
                      data={innermostError}
                      initiallyUnfolded={false}
                      // initiallyUnfolded={innermostError ? true : false}
                    /> */}
                  {/* <ThemedOnScreenHelper
                      label="transformationResult"
                      data={transformationResult}
                      initiallyUnfolded={false}
                      // initiallyUnfolded={innermostError ? false : true}
                    /> */}
                  {/* <ThemedOnScreenHelper
                      label="transformationResultSchema"
                      data={transformationResultSchema}
                      initiallyUnfolded={false}
                    /> */}
                  {/* <ThemedOnScreenHelper
                      label="currentTransformerDefinition"
                      data={currentTransformerDefinition}
                    /> */}
                  {/* <ThemedOnScreenHelper
                      label="currentTransformerDefinition transformerImplementation.definition"
                      data={
                        (currentFetchedTransformerDefinition as any)?.transformerImplementation
                          ?.definition
                      }
                      initiallyUnfolded={true}
                    /> */}
                  <TypedValueObjectEditor
                    labelElement={<>Transformer Definition</>}
                    formValueMLSchema={formMLSchema}
                    formikValuePathAsString="transformerEditor_selector"
                    deploymentUuid={deploymentUuid}
                    applicationSection={"model"}
                    formLabel={"Transformer Definition Selector"}
                    displaySubmitButton="noDisplay"
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
                      labelElement={<>Input Definition</>}
                      formValueMLSchema={formMLSchema}
                      // formikValuePathAsString="transformerEditor_input.selector"
                      formikValuePathAsString="transformerEditor_input_selector"
                      // zoomInPath="selector"
                      deploymentUuid={deploymentUuid}
                      applicationSection={"model"}
                      formLabel={"Transformer Input Selector"}
                      displaySubmitButton="noDisplay"
                      maxRenderDepth={Infinity}
                    />
                  </ThemedFoldableContainer>
                  {formikContext.values.transformerEditor_input_selector.mode == "instance" && (
                    <EntityInstancePanel
                      entityInstances={entityInstances}
                      selectedEntityInstance={selectedEntityInstance}
                      selectedEntityInstanceDefinition={currentReportTargetEntityDefinition}
                      currentInstanceIndex={currentInstanceIndex}
                      deploymentUuid={deploymentUuid}
                      availableEntities={currentReportDeploymentSectionEntities || []}
                      selectedEntityUuid={selectedEntityUuid}
                      showAllInstances={showAllInstances}
                      onEntityChange={handleEntityChange}
                      onNavigateNext={navigateToNextInstance}
                      onNavigatePrevious={navigateToPreviousInstance}
                      onNavigateRandom={navigateToRandomInstance}
                      onToggleShowAll={handleToggleShowAll}
                    />
                  )}
                  <TransformationResultPanel
                    transformationResult={transformationResult}
                    transformationResultSchema={transformationResultSchema}
                    // transformationError={transformationError}
                    selectedEntityInstance={selectedEntityInstance}
                    showAllInstances={showAllInstances}
                    entityInstances={entityInstances}
                    deploymentUuid={deploymentUuid}
                  />
                </div>
              </div>
            );
          }
        }
      </Formik>
      {/* <TypedValueObjectEditorWithFormik
          labelElement={<>Transformer Definition</>}
          initialValueObject={{ currentTransformerDefinition: currentTransformerDefinition }}
          formValueMLSchema={{
            type: "object",
            definition: { currentTransformerDefinition: transformerDefinitionSchema },
          }}
          formikValuePathAsString="currentTransformerDefinition"
          deploymentUuid={deploymentUuid}
          applicationSection={"model"}
          formLabel={"Transformer Definition Editor"}
          onSubmit={handleTransformerDefinitionChange}
          maxRenderDepth={Infinity}
        /> */}

      {/* Right Panes: stacked */}
      {/* <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: "50%" }}> */}
      {/* <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <EntityInstancePanel
            entityInstances={entityInstances}
            selectedEntityInstance={selectedEntityInstance}
            selectedEntityInstanceDefinition={currentReportTargetEntityDefinition}
            currentInstanceIndex={currentInstanceIndex}
            deploymentUuid={deploymentUuid}
            availableEntities={currentReportDeploymentSectionEntities || []}
            selectedEntityUuid={selectedEntityUuid}
            showAllInstances={showAllInstances}
            onEntityChange={handleEntityChange}
            onNavigateNext={navigateToNextInstance}
            onNavigatePrevious={navigateToPreviousInstance}
            onNavigateRandom={navigateToRandomInstance}
            onToggleShowAll={handleToggleShowAll}
          />
          <TransformationResultPanel
            transformationResult={transformationResult}
            transformationResultSchema={transformationResultSchema}
            // transformationError={transformationError}
            selectedEntityInstance={selectedEntityInstance}
            showAllInstances={showAllInstances}
            entityInstances={entityInstances}
            deploymentUuid={deploymentUuid}
          />
        </div> */}
      {/* </div> */}

      {/* {transformerEventsPanel} */}
      <TransformerEventsPanel />

      {/* <DebugPanel currentTransformerDefinition={currentTransformerDefinition} /> */}
    </ThemedContainer>
  );
};
