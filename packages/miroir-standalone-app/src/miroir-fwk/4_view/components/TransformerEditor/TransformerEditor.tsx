import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { valueToJzod } from '@miroir-framework/jzod';
import {
  EntityInstance,
  LoggerInterface,
  MiroirLoggerFactory,
  Uuid,
  adminConfigurationDeploymentMiroir,
  defaultTransformerInput,
  getEntityInstancesUuidIndexNonHook,
  getInnermostTransformerError,
  miroirFundamentalJzodSchema,
  safeStringify,
  transformer_extended_apply_wrapper,
  type Entity,
  type EntityDefinition,
  type JzodElement,
  type JzodSchema,
  type MetaModel,
  type MiroirModelEnvironment,
  type ReduxDeploymentsState,
  type SyncBoxedExtractorOrQueryRunnerMap,
  type TransformerReturnType
} from 'miroir-core';


import type { TransformerForBuildPlusRuntime } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';
import { getMemoizedReduxDeploymentsStateSelectorMap, type ReduxStateWithUndoRedo } from 'miroir-localcache-redux';
import { useSelector } from 'react-redux';
import { packageName } from '../../../../constants';
import { cleanLevel } from '../../constants';
import { useMiroirContextService } from '../../MiroirContextReactProvider';
import { useCurrentModel } from '../../ReduxHooks';
import { useReportPageContext } from '../Reports/ReportPageContext';
import { TypedValueObjectEditorWithFormik } from '../Reports/TypedValueObjectEditorWithFormik';
import {
  ThemedContainer,
  ThemedHeaderSection,
  ThemedTitle
} from "../Themes/index";
import { TransformationResultPanel } from './TransformationResultPanel';
import { TransformerEventsPanel } from './TransformerEventsPanel';

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
const EntityInstancePanel = React.memo<{
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
}>(
  ({
    entityInstances,
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
  }) => (
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
          <TypedValueObjectEditorWithFormik
            labelElement={<></>}
            initialValueObject={{ entityInstances }}
            formValueMLSchema={
              {
                type: "object",
                definition: {
                  type: "array",
                  definition:
                    selectedEntityInstanceDefinition?.jzodSchema ?? createGenericObjectSchema(),
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
        ) : (
          <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
            No entity instances found
          </div>
        )
      ) : /* Show single instance */
      selectedEntityInstance ? (
        <TypedValueObjectEditorWithFormik
          labelElement={<></>}
          initialValueObject={{selectedEntityInstance}}
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
  )
);

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
 * To reference the entity instance(s) in your transformer, use contextReference with one of these names:
 * - "defaultInput" - the standard reference name (single instance or array when showing all)
 * - Or use any property name from the entity instance directly (e.g., "uuid", "name", etc.)
 * 
 * Example transformer that copies the default input:
 * {
 *   "transformerType": "contextReference",
 *   "referenceName": "defaultInput"
 * }
 * 
 * Example transformer that gets the name field from an instance input:
 * {
 *   "transformerType": "contextReference",
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
export const TransformerEditor: React.FC<TransformerEditorProps> = (props) => {
  const { deploymentUuid, entityUuid: initialEntityUuid } = props;
  const context = useMiroirContextService();
  const currentModel = useCurrentModel(deploymentUuid);
  const reportContext = useReportPageContext();
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  const miroirContextService = useMiroirContextService();

  // Get persisted state from context
  const persistedState = context.toolsPageState.transformerEditor;
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
      context.updateTransformerEditorState({ currentInstanceIndex: newIndex });
    }
  }, [entityInstances.length, currentInstanceIndex]); // Remove context from dependencies

  const navigateToPreviousInstance = useCallback(() => {
    if (entityInstances.length > 0) {
      const newIndex = (currentInstanceIndex - 1 + entityInstances.length) % entityInstances.length;
      setCurrentInstanceIndex(newIndex);
      // Persist to context
      context.updateTransformerEditorState({ currentInstanceIndex: newIndex });
    }
  }, [entityInstances.length, currentInstanceIndex]); // Remove context from dependencies

  const navigateToRandomInstance = useCallback(() => {
    if (entityInstances.length > 0) {
      // const newIndex = (currentInstanceIndex - 1 + entityInstances.length) % entityInstances.length;
      const newIndex = Math.floor(Math.random() * entityInstances.length);
      setCurrentInstanceIndex(newIndex);
      // Persist to context
      context.updateTransformerEditorState({ currentInstanceIndex: newIndex });
    }
  }, [entityInstances.length, currentInstanceIndex]); // Remove context from dependencies

  // Handler for entity change (with persistence)
  const handleEntityChange = useCallback((newEntityUuid: Uuid) => {
    setSelectedEntityUuid(newEntityUuid);
    // Persist to context
    context.updateTransformerEditorState({ selectedEntityUuid: newEntityUuid });
  }, []); // Remove context from dependencies

  // Handler for toggling show all instances mode (with persistence)
  const handleToggleShowAll = useCallback(() => {
    const newShowAllInstances = !context.toolsPageState.transformerEditor?.showAllInstances;
    context.updateTransformerEditorState({ showAllInstances: newShowAllInstances });
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

  // TransformerDefinition schema - memoized to avoid recalculation
  const transformerDefinitionSchema: JzodElement = useMemo(
    () => ({
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "transformerForBuildPlusRuntime",
      },
    }),
    []
  );

  // Initialize transformer definition with persistence
  // const [currentTransformerDefinition, setCurrentTransformerDefinition] = useState<any>(() => {
  //   // Use persisted transformer definition if available
  //   if (persistedState?.currentTransformerDefinition) {
  //     return persistedState.currentTransformerDefinition;
  //   }
  //   // Otherwise, create default
  //   return getDefaultValueForJzodSchemaWithResolutionNonHook(
  //     "build", // mode
  //     transformerDefinitionSchema,
  //     undefined, // rootObject
  //     "", // rootLessListKey,
  //     undefined, // No need to pass currentDefaultValue here
  //     [], // currentPath on value is root
  //     deploymentEntityState,
  //     false, // forceOptional
  //     deploymentUuid,
  //     currentMiroirModelEnvironment,
  //     {} // relativeReferenceJzodContext
  //   );
  // });
  const currentTransformerDefinition: TransformerForBuildPlusRuntime =
    context.toolsPageState.transformerEditor?.currentTransformerDefinition??{ transformerType: "constant", value: null };

  log.info("TransformerEditor currentTransformerDefinition:", currentTransformerDefinition);
  log.info("TransformerEditor transformerDefinitionSchema:", transformerDefinitionSchema);
  useEffect(() => {
    if (persistedState && persistedState?.foldedObjectAttributeOrArrayItems) {
      reportContext.setFoldedObjectAttributeOrArrayItems(
        persistedState?.foldedObjectAttributeOrArrayItems
      );
    }
  }, [context, persistedState?.foldedObjectAttributeOrArrayItems]);
  // State for transformation result
  // const [transformationResult, setTransformationResult] = useState<any>(null);
  // const [transformationError, setTransformationError] = useState<TransformerFailure | null>(null);

  // Extract error path for highlighting problematic elements

  // Separate fold state management for each panel (with persistence)
  // const [foldedEntityInstanceItems, setFoldedEntityInstanceItems] = useState<{ [k: string]: boolean }>(
  //   persistedState?.foldedEntityInstanceItems || {}
  // );
  // const [foldedTransformationResultItems, setFoldedTransformationResultItems] = useState<{ [k: string]: boolean }>(
  //   persistedState?.foldedTransformationResultItems || {}
  // );

  // Copy-to-clipboard state for transformer definition
  const [copiedToClipboard, setCopiedToClipboard] = useState<boolean>(false);

  const copyTransformerDefinitionToClipboard = useCallback(async () => {
    try {
      // Try to stringify as nicely as possible; safeStringify accepts a large maxLength to avoid truncation
      const text = safeStringify(currentTransformerDefinition, 1000000);

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
  }, [currentTransformerDefinition]);

  const clearTransformerDefinition = useCallback(() => {
    // Assumption: a 'constant' transformer has shape { transformerType: 'constant', value: ... }
    const defaultConstantTransformer: any = {
      transformerType: "constant",
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
  const contextResults = useMemo(() => {
    if (showAllInstances) {
      // When showing all instances, target becomes an array of all instances
      if (entityInstances.length === 0) return {};

      return {
        // entityInstance: entityInstances,
        // instance: entityInstances,
        [defaultTransformerInput]: entityInstances,
        // applyTo: entityInstances,
        // Also provide individual properties from the first instance for compatibility
        // (in case transformers expect single instance properties)
        ...(entityInstances[0] || {}),
      };
    } else {
      // When showing single instance, target is the selected instance
      if (!selectedEntityInstance) return {};

      return {
        entityInstance: selectedEntityInstance,
        instance: selectedEntityInstance,
        // target: selectedEntityInstance,
        [defaultTransformerInput]: selectedEntityInstance,
        applyTo: selectedEntityInstance,
        ...selectedEntityInstance,
      };
    }
  }, [showAllInstances, entityInstances, selectedEntityInstance]);

  // ################################################################################################
  // Apply transformer to selected entity instance with debouncing
  // const applyTransformerToInstance = useCallback(async () => {
  //   if (!currentTransformerDefinition || (showAllInstances ? entityInstances.length === 0 : !selectedEntityInstance)) {
  //     // setTransformationResult(null);
  //     setTransformationError(null);
  //     return null;
  //   }

  //   // Clear existing timeout
  //   if (transformerTimeoutRef.current) {
  //     clearTimeout(transformerTimeoutRef.current);
  //   }

  //   // Debounce transformer execution
  //   transformerTimeoutRef.current = setTimeout(async () => {
  //     try {
  //       log.info("Applying transformer to instance(s)", {
  //         transformer: currentTransformerDefinition,
  //         showAllInstances,
  //         instanceCount: showAllInstances ? entityInstances.length : 1,
  //         target: showAllInstances ? entityInstances : selectedEntityInstance,
  //       });

  //       const result: TransformerReturnType<any> = transformer_extended_apply_wrapper(
  //         context.miroirContext.miroirActivityTracker, // activityTracker
  //         "runtime", // step
  //         ["rootTransformer"], // transformerPath
  //         "TransformerEditor", // label
  //         currentTransformerDefinition, // transformer
  //         { ...currentMiroirModelEnvironment, ...contextResults }, // transformerParams
  //         contextResults, // contextResults - pass the instance to transform
  //         "value" // resolveBuildTransformersTo
  //       );

  //       // Check for Domain2ElementFailed pattern
  //       if (result && typeof result === "object" && "queryFailure" in result) {
  //         // setTransformationError(`Transformation failed: ${safeStringify(result)}`);
  //         setTransformationError(result);
  //         // setTransformationResult(null);
  //         return null;
  //       } else {
  //         // setTransformationResult(result);
  //         setTransformationError(null);
  //         return result;
  //         log.info("Transformation successful", { result });
  //       }
  //     } catch (error) {
  //       const errorMessage = error instanceof Error ? error.message : String(error);
  //       log.error("Error applying transformer:", error);
  //       setTransformationError({
  //         queryFailure: "FailedTransformer",
  //         elementType: "Transformer",
  //         transformerPath: [],
  //         failureMessage: errorMessage,
  //       });
  //       // setTransformationResult(null);
  //       return null;
  //     }
  //   }, 300); // 300ms debounce
  // }, [
  //   currentTransformerDefinition,
  //   showAllInstances,
  //   entityInstances,
  //   selectedEntityInstance,
  //   currentMiroirModelEnvironment,
  //   contextResults,
  // ]);

  // useEffect(() => {
  //   miroirContextService.miroirContext.miroirActivityTracker.resetResults();
  // }, [miroirContextService.miroirContext.miroirActivityTracker, currentTransformerDefinition]);

  log.info("TransformerEditor contextResults:", contextResults);
  const [transformationResult, setTransformationResult] = useState<TransformerReturnType<any>>();

  // ##############################################################################################
  // const transformationResult: TransformerReturnType<any> = useMemo(() => {
  useEffect(() => {
    let ignore = false;

    const runTransformation = async () => {
      if (
        !currentTransformerDefinition ||
        (showAllInstances ? entityInstances.length === 0 : !selectedEntityInstance)
      ) {
        if (!ignore) setTransformationResult(undefined);
        return;
        // return null;
      }
      if (!ignore) {
        try {
          log.info("Applying transformer to instance(s)", {
            transformer: currentTransformerDefinition,
            showAllInstances,
            instanceCount: showAllInstances ? entityInstances.length : 1,
            target: showAllInstances ? entityInstances : selectedEntityInstance,
          });
          const transformerParams = { ...currentMiroirModelEnvironment, ...contextResults };
          const result: TransformerReturnType<any> =
            await miroirContextService.miroirContext.miroirActivityTracker.trackTransformerRun(
              (currentTransformerDefinition as any)?.label ??
                (currentTransformerDefinition as any)?.transformerType ??
                "UnnamedTransformer",
              (currentTransformerDefinition as any)?.transformerType as any,
              "runtime",
              transformerParams,
              undefined, // parentId
              () =>
                transformer_extended_apply_wrapper(
                  context.miroirContext.miroirActivityTracker, // activityTracker
                  "runtime", // step
                  ["rootTransformer"], // transformerPath
                  "TransformerEditor", // label
                  currentTransformerDefinition, // transformer
                  currentMiroirModelEnvironment,
                  transformerParams,
                  contextResults, // contextResults - pass the instance to transform
                  "value" // resolveBuildTransformersTo
                )
            );
          setTransformationResult(result);
          log.info("Applied transformer to instance(s)", {
            transformer: currentTransformerDefinition,
            showAllInstances,
            instanceCount: showAllInstances ? entityInstances.length : 1,
            target: showAllInstances ? entityInstances : selectedEntityInstance,
            result,
          });

          // // Check for Domain2ElementFailed pattern
          // if (result && typeof result === "object" && "queryFailure" in result) {
          //   setTransformationError(result);
          //   return null;
          // } else {
          //   setTransformationError(null);
          //   return result;
          // }
          // return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          log.error("Error applying transformer:", error);
          if (!ignore)
            setTransformationResult({
              queryFailure: "FailedTransformer",
              elementType: "Transformer",
              transformerPath: [],
              failureMessage: errorMessage,
            });
          // return ({
          //   queryFailure: "FailedTransformer",
          //   elementType: "Transformer",
          //   transformerPath: [],
          //   failureMessage: errorMessage,
          // });
          // return null;
        }
      }
    };
    runTransformation();
    return () => {
      ignore = true;
    };
  }, [
    currentTransformerDefinition,
    showAllInstances,
    entityInstances,
    selectedEntityInstance,
    currentMiroirModelEnvironment,
    contextResults,
    context.miroirContext.miroirActivityTracker,
    context.miroirContext,
    context.toolsPageState,
    context.toolsPageState.transformerEditor?.currentTransformerDefinition,
  ]);

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
    if (!currentTransformerDefinition) {
      return { type: "any" } as JzodElement;
    }
    return (valueToJzod(transformationResult) ?? { type: "any" }) as JzodElement;
  }, [transformationResult]);

  // ################################################################################################
  // Handle transformer definition changes with debouncing (with persistence)
  const handleTransformerDefinitionChange = useCallback(
    async (newTransformerDefinition: any) => {
      log.info("handleTransformerDefinitionChange", newTransformerDefinition);
      miroirContextService.miroirContext.miroirActivityTracker.resetResults();
      miroirContextService.miroirContext.miroirEventService.clear();

      context.updateTransformerEditorState({
        currentTransformerDefinition: newTransformerDefinition["currentTransformerDefinition"],
      });
    },
    [
      context,
      context.updateTransformerEditorState,
      miroirContextService,
      miroirContextService.miroirContext,
    ]
  ); // Remove context from dependencies

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

  return (
    <ThemedContainer>
      <ThemedHeaderSection
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <ThemedTitle>
          Transformer Editor for Entity "{currentReportTargetEntity?.name || selectedEntityUuid}" of
          deployment {deploymentUuid}
        </ThemedTitle>
        {/* <pre style={{ fontSize: "0.8em", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          <strong>currentTransformerDefinition:</strong> {JSON.stringify(currentTransformerDefinition, null, 2)}
        </pre> */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
          <button
            onClick={clearTransformerDefinition}
            title={"Reset transformer to default constant transformer"}
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
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Top Pane: Transformer Definition Editor */}
        <TypedValueObjectEditorWithFormik
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
          maxRenderDepth={Infinity} // Always render fully for editor
          // displayError={errorPath && errorPath.length > 0 ? {
          //   errorPath: errorPath,
          //   errorMessage: `${innermostError?.queryFailure}: ${innermostError?.failureMessage}` // TODO: provide more specific error message
          // } : undefined}
        />

        {/* Bottom Panes: Side by side */}
        <div style={{ display: "flex", gap: "20px", minHeight: "300px" }}>
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
        </div>
      </div>

      {/* {transformerEventsPanel} */}
      <TransformerEventsPanel />

      {/* <DebugPanel currentTransformerDefinition={currentTransformerDefinition} /> */}
    </ThemedContainer>
  );
};
