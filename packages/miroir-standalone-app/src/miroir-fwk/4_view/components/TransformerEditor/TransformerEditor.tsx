import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Formik, FormikProps } from 'formik';

import {
  LoggerInterface,
  MiroirLoggerFactory,
  EntityInstance,
  type JzodElement,
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
  getEntityInstancesUuidIndexNonHook,
  transformer_extended_apply_wrapper,
  type Domain2QueryReturnType,
  type Entity,
  type EntityDefinition,
  type EntityDefinitionEntityDefinition,
  type TransformerReturnType,
  type TransformerFailure,
  getInnermostTransformerError,
} from 'miroir-core';
import { valueToJzod } from '@miroir-framework/jzod';


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
} from "../Themes/index"
import { ReportSectionEntityInstance } from '../Reports/ReportSectionEntityInstance';
import { getMemoizedReduxDeploymentsStateSelectorMap, type ReduxStateWithUndoRedo } from 'miroir-localcache-redux';
import { useSelector } from 'react-redux';
import { TypedValueObjectEditor } from '../Reports/TypedValueObjectEditor';
import { TransformerEventsPanel } from './TransformerEventsPanel';
import { useReportPageContext } from '../Reports/ReportPageContext';
import type { FoldedStateTree } from '../Reports/FoldedStateTreeUtils';
import type { TransformerForBuildOrRuntime } from 'miroir-core';

// ################################################################################################
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// Safe stringify function that prevents "Invalid string length" errors with memoization
// ################################################################################################
const stringifyCache = new WeakMap<object, string>();

function safeStringify(obj: any, maxLength: number = 2000): string {
  try {
    // Use cache for objects to avoid re-stringifying the same object
    if (obj && typeof obj === 'object' && stringifyCache.has(obj)) {
      return stringifyCache.get(obj)!;
    }
    
    const str = JSON.stringify(obj, null, 2);
    const result = str && str.length > maxLength 
      ? str.substring(0, maxLength) + "... [truncated]" 
      : str || "[unable to stringify]";
    
    // Cache the result for objects
    if (obj && typeof obj === 'object') {
      stringifyCache.set(obj, result);
    }
    
    return result;
  } catch (error) {
    return `[stringify error: ${error instanceof Error ? error.message : 'unknown'}]`;
  }
}

// ################################################################################################
// Helper function to create a generic "any" schema for displaying arbitrary objects
// ################################################################################################
function createGenericObjectSchema(): JzodElement {
  return {
    type: "any"
  };
}

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
  onEntityChange: (entityUuid: Uuid) => void;
  onNavigateNext: () => void;
  onNavigatePrevious: () => void;
  onNavigateRandom: () => void;
}>(
  ({
    entityInstances,
    selectedEntityInstance,
    selectedEntityInstanceDefinition,
    currentInstanceIndex,
    deploymentUuid,
    availableEntities,
    selectedEntityUuid,
    onEntityChange,
    onNavigateNext,
    onNavigatePrevious,
    onNavigateRandom,
  }) => (
    <ThemedContainer style={{ flex: 1 }}>
      <ThemedHeaderSection style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemedTitle>
            Entity Instance ({entityInstances.length} instances available)
            {entityInstances.length > 0 && (
              <span style={{ fontSize: '0.8em', marginLeft: '10px', color: '#666' }}>
                (#{currentInstanceIndex + 1} of {entityInstances.length})
              </span>
            )}
          </ThemedTitle>
        </div>
        
        {/* Entity Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '60px' }}>
            Entity:
          </label>
          <select
            value={selectedEntityUuid}
            onChange={(e) => onEntityChange(e.target.value as Uuid)}
            style={{
              padding: '6px 12px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              minWidth: '200px'
            }}
          >
            {availableEntities.map((entity) => (
              <option key={entity.uuid} value={entity.uuid}>
                {entity.name || entity.uuid}
              </option>
            ))}
          </select>
                    {entityInstances.length > 1 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onNavigatePrevious}
                style={{
                  padding: '4px 8px',
                  fontSize: '14px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Previous instance"
              >
                ↑ Prev
              </button>
              <button
                onClick={onNavigateNext}
                style={{
                  padding: '4px 8px',
                  fontSize: '14px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Next instance"
              >
                Next ↓
              </button>
              <button
                onClick={onNavigateRandom}
                style={{
                  padding: '4px 8px',
                  fontSize: '14px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Next instance"
              >
                Random 🔀
              </button>
            </div>
          )}
        </div>
      </ThemedHeaderSection>
      {selectedEntityInstance ? (
        <TypedValueObjectEditor
          labelElement={<></>}
          valueObject={selectedEntityInstance}
          // valueObjectMMLSchema={createGenericObjectSchema()}
          valueObjectMMLSchema={
            selectedEntityInstanceDefinition?.jzodSchema ?? createGenericObjectSchema()
          }
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

// ################################################################################################
const TransformationResultPanel = React.memo<{
  transformationResult: any;
  transformationResultSchema?: JzodElement;
  // transformationError: string | null;
  transformationError: TransformerFailure | null;
  selectedEntityInstance: EntityInstance | undefined;
  deploymentUuid: Uuid;
}>(
  ({
    transformationResult,
    transformationResultSchema,
    transformationError,
    selectedEntityInstance,
    deploymentUuid,
  }) => (
    <ThemedContainer style={{ flex: 1, maxWidth: '50%' }}>
      <ThemedHeaderSection>
        <ThemedTitle>
          Transformation Result
          {transformationError && (
            <span style={{ color: "red", marginLeft: "10px", fontSize: "0.9em" }}>⚠️ Error</span>
          )}
        </ThemedTitle>
      </ThemedHeaderSection>

      {transformationError ? (
        <ThemedCodeBlock>
          {typeof transformationError === "string"
            ? transformationError
            : safeStringify(transformationError)}
        </ThemedCodeBlock>
      ) : transformationResult !== null ? (
        <TypedValueObjectEditor
          labelElement={<div>target:</div>}
          valueObject={transformationResult}
          valueObjectMMLSchema={transformationResultSchema??createGenericObjectSchema()}
          deploymentUuid={deploymentUuid}
          applicationSection={"data"}
          formLabel={"Transformation Result Viewer"}
          onSubmit={async () => {}} // No-op for readonly
          maxRenderDepth={3}
          readonly={true}
        />
      ) : selectedEntityInstance ? (
        <div>
          <div
            style={{
              marginBottom: "12px",
              padding: "12px",
              background: "#f5f5f5",
              borderRadius: "4px",
            }}
          >
            <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
              No transformation result yet.
            </div>
            <div style={{ marginBottom: "8px" }}>Create a transformer to see the result here.</div>
            <div style={{ fontSize: "0.9em", color: "#666" }}>
              <div style={{ marginBottom: "4px" }}>
                Tip: Use contextReference to access the entity instance:
              </div>
            </div>
          </div>
          <ThemedCodeBlock>
            {JSON.stringify(
              {
                transformerType: "contextReference",
                referenceName: "applyTo",
              },
              null,
              2
            )}
          </ThemedCodeBlock>
        </div>
      ) : (
        <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
          No entity instance available for transformation.
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
/**
 * TransformerEditor allows users to create and test transformers on entity instances.
 * 
 * To reference the entity instance in your transformer, use contextReference with one of these names:
 * - "applyTo" - the standard reference name
 * - "entityInstance" - explicit entity instance reference
 * - "instance" - short reference name
 * - "target" - alternative reference name
 * - Or use any property name from the entity instance directly (e.g., "uuid", "name", etc.)
 * 
 * Example transformer that copies the name field:
 * {
 *   "transformerType": "contextReference",
 *   "referenceName": "applyTo"
 * }
 * 
 * Example transformer that gets the name field specifically:
 * {
 *   "transformerType": "contextReference",
 *   "referenceName": "name"
 * }
 */
export interface TransformerEditorProps {
  deploymentUuid: Uuid;
  entityUuid: Uuid;
}




// ################################################################################################
export const TransformerEditor: React.FC<TransformerEditorProps> = React.memo((props) => {
  const { deploymentUuid, entityUuid: initialEntityUuid } = props;
  const context = useMiroirContextService();
  const currentModel = useCurrentModel(deploymentUuid);
  const reportContext = useReportPageContext();
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  // Get persisted state from context
  const persistedState = context.toolsPageState.transformerEditor;

  // const [persistedState, setPersistedState] = useState<ToolsPageState["transformerEditor"] | undefined>(

  // State to track the currently selected entity (with persistence)
  const [selectedEntityUuid, setSelectedEntityUuid] = useState<Uuid>(
    initialEntityUuid
  );

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
    const availableEntityUuids = currentReportDeploymentSectionEntities?.map(e => e.uuid) || [];
    if (availableEntityUuids.length > 0 && !availableEntityUuids.includes(selectedEntityUuid)) {
      // If current selection is not available, default to the first available entity
      setSelectedEntityUuid(availableEntityUuids[0]);
    }
  }, [currentReportDeploymentSectionEntities, selectedEntityUuid]);

  const currentReportTargetEntity: Entity | undefined =
    currentReportDeploymentSectionEntities?.find((e) => e?.uuid === selectedEntityUuid);

  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find(
      (e) => e?.entityUuid === currentReportTargetEntity?.uuid
    );

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> = useMemo(
    () => getMemoizedReduxDeploymentsStateSelectorMap(),
    []
  );

  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    useCallback((state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        () => ({}),
        currentMiroirModelEnvironment
      ), [deploymentEntityStateSelectorMap, currentMiroirModelEnvironment])
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

  // State to track the current instance index (with persistence)
  const [currentInstanceIndex, setCurrentInstanceIndex] = useState<number>(
    persistedState?.currentInstanceIndex || 0
  );

  // Select instance based on current index with stable reference
  const selectedEntityInstance: EntityInstance | undefined = useMemo(() => {
    if (entityInstances.length === 0) return undefined;
    // Ensure index is within bounds (round-robin)
    const validIndex = ((currentInstanceIndex % entityInstances.length) + entityInstances.length) % entityInstances.length;
    return entityInstances[validIndex];
  }, [entityInstances, currentInstanceIndex]);

  // Navigation functions for round-robin instance selection
  const navigateToNextInstance = useCallback(() => {
    if (entityInstances.length > 0) {
      const newIndex = (currentInstanceIndex + 1) % entityInstances.length;
      setCurrentInstanceIndex(newIndex);
      // Persist to context
      context.updateTransformerEditorState({ currentInstanceIndex: newIndex });
    }
  }, [entityInstances.length, currentInstanceIndex, context]);

  const navigateToPreviousInstance = useCallback(() => {
    if (entityInstances.length > 0) {
      const newIndex = (currentInstanceIndex - 1 + entityInstances.length) % entityInstances.length;
      setCurrentInstanceIndex(newIndex);
      // Persist to context
      context.updateTransformerEditorState({ currentInstanceIndex: newIndex });
    }
  }, [entityInstances.length, currentInstanceIndex, context]);

  const navigateToRandomInstance = useCallback(() => {
    if (entityInstances.length > 0) {
      // const newIndex = (currentInstanceIndex - 1 + entityInstances.length) % entityInstances.length;
      const newIndex = Math.floor(Math.random() * entityInstances.length);
      setCurrentInstanceIndex(newIndex);
      // Persist to context
      context.updateTransformerEditorState({ currentInstanceIndex: newIndex });
    }
  }, [entityInstances.length, currentInstanceIndex, context]);

  // Reset index when entity instances change
  useEffect(() => {
    setCurrentInstanceIndex(0);
  }, [entityInstances.length]);

  // Reset index when entity changes
  useEffect(() => {
    setCurrentInstanceIndex(0);
  }, [selectedEntityUuid]);

  // Handler for entity change (with persistence)
  const handleEntityChange = useCallback((newEntityUuid: Uuid) => {
    setSelectedEntityUuid(newEntityUuid);
    // Persist to context
    context.updateTransformerEditorState({ selectedEntityUuid: newEntityUuid });
  }, [context]);

  // TransformerDefinition schema - memoized to avoid recalculation
  const transformerDefinitionSchema: JzodElement = useMemo(() => ({
    type: "schemaReference",
    definition: {
      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      relativePath: "transformerForBuildPlusRuntime",
    },
  }), []);

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
  const currentTransformerDefinition: TransformerForBuildOrRuntime = context.toolsPageState.transformerEditor?.currentTransformerDefinition;

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
  const [transformationError, setTransformationError] = useState<TransformerFailure | null>(null);
  
  // Extract error path for highlighting problematic elements
  const innermostError = useMemo(
    () => (transformationError ? getInnermostTransformerError(transformationError) : undefined),
    [transformationError]
  );
  const errorPath = innermostError?.transformerPath || [];
  
  log.info("TransformerEditor Transformation error path:", errorPath);
  // Separate fold state management for each panel (with persistence)
  const [foldedEntityInstanceItems, setFoldedEntityInstanceItems] = useState<{ [k: string]: boolean }>(
    persistedState?.foldedEntityInstanceItems || {}
  );
  const [foldedTransformationResultItems, setFoldedTransformationResultItems] = useState<{ [k: string]: boolean }>(
    persistedState?.foldedTransformationResultItems || {}
  );

  // Copy-to-clipboard state for transformer definition
  const [copiedToClipboard, setCopiedToClipboard] = useState<boolean>(false);

  const copyTransformerDefinitionToClipboard = useCallback(async () => {
    try {
      // Try to stringify as nicely as possible; safeStringify accepts a large maxLength to avoid truncation
      const text = safeStringify(currentTransformerDefinition, 1000000);

      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof (window as any) !== 'undefined' && typeof (window as any).require === 'function') {
        // Electron fallback
        try {
          const { clipboard } = (window as any).require('electron');
          clipboard.writeText(text);
        } catch (e) {
          // ignore and fall through to legacy copy
          throw e;
        }
      } else {
        // Legacy fallback using execCommand
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }

      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      log.error('Failed to copy transformer definition to clipboard', error);
    }
  }, [currentTransformerDefinition]);

  const clearTransformerDefinition = useCallback(() => {
    // Reasonable default: a constant transformer that returns an empty object.
    // Assumption: a 'constant' transformer has shape { transformerType: 'constant', value: ... }
    const defaultConstantTransformer: any = {
      transformerType: 'constant',
      // interpolation: "build",
      interpolation: 'runtime',
      value: "enter the wanted value here...", // Default to undefined value
    };

    // setCurrentTransformerDefinition(defaultConstantTransformer);
    context.updateTransformerEditorState({ currentTransformerDefinition: defaultConstantTransformer });
    // Clear previous transformation outputs
    // setTransformationResult(null);
    setTransformationError(null);
  }, [context]);
  
  // Debouncing for transformer execution
  const transformerTimeoutRef = useRef<NodeJS.Timeout>();
  
  // // ################################################################################################
  // // Wrapper functions for folded state setters with persistence
  // const setFoldedObjectAttributeOrArrayItemsWithPersistence = useCallback(
  //   // (updates: React.SetStateAction<{ [k: string]: boolean }>) => {
  //   (updates: React.SetStateAction<FoldedStateTree>) => {
  //     reportContext.setFoldedObjectAttributeOrArrayItems((prev) => {
  //       const newState = typeof updates === "function" ? updates(prev) : updates;
  //       context.updateTransformerEditorState({ foldedObjectAttributeOrArrayItems: newState });
  //       return newState;
  //     });
  //   },
  //   [context, reportContext]
  // );

  // // ################################################################################################
  // const setFoldedEntityInstanceItemsWithPersistence = useCallback((updates: React.SetStateAction<{ [k: string]: boolean }>) => {
  //   setFoldedEntityInstanceItems(prev => {
  //     const newState = typeof updates === 'function' ? updates(prev) : updates;
  //     context.updateTransformerEditorState({ foldedEntityInstanceItems: newState });
  //     return newState;
  //   });
  // }, [context]);

  // // ################################################################################################
  // const setFoldedTransformationResultItemsWithPersistence = useCallback((updates: React.SetStateAction<{ [k: string]: boolean }>) => {
  //   setFoldedTransformationResultItems(prev => {
  //     const newState = typeof updates === 'function' ? updates(prev) : updates;
  //     context.updateTransformerEditorState({ foldedTransformationResultItems: newState });
  //     return newState;
  //   });
  // }, [context]);
  

  // Memoized context results to avoid recreating on every execution
  const contextResults = useMemo(() => {
    if (!selectedEntityInstance) return {};
    
    return {
      entityInstance: selectedEntityInstance,
      instance: selectedEntityInstance,
      target: selectedEntityInstance,
      ...selectedEntityInstance
    };
  }, [selectedEntityInstance]);

  // ################################################################################################
  // Apply transformer to selected entity instance with debouncing
  const applyTransformerToInstance = useCallback(async () => {
    if (!currentTransformerDefinition || !selectedEntityInstance) {
      // setTransformationResult(null);
      setTransformationError(null);
      return null;
    }

    // Clear existing timeout
    if (transformerTimeoutRef.current) {
      clearTimeout(transformerTimeoutRef.current);
    }

    // Debounce transformer execution
    transformerTimeoutRef.current = setTimeout(async () => {
      try {
        log.info("Applying transformer to instance", {
          transformer: currentTransformerDefinition,
          instance: selectedEntityInstance,
        });

        const result: TransformerReturnType<any> = transformer_extended_apply_wrapper(
          context.miroirContext.miroirActivityTracker, // activityTracker
          "runtime", // step
          ["rootTransformer"], // transformerPath
          "TransformerEditor", // label
          currentTransformerDefinition, // transformer
          { ...currentMiroirModelEnvironment, ...contextResults }, // transformerParams
          contextResults, // contextResults - pass the instance to transform
          "value" // resolveBuildTransformersTo
        );

        // Check for Domain2ElementFailed pattern
        if (result && typeof result === "object" && "queryFailure" in result) {
          // setTransformationError(`Transformation failed: ${safeStringify(result)}`);
          setTransformationError(result);
          // setTransformationResult(null);
          return null;
        } else {
          // setTransformationResult(result);
          setTransformationError(null);
          return result;
          log.info("Transformation successful", { result });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error("Error applying transformer:", error);
        setTransformationError({
          queryFailure: "FailedTransformer",
          elementType: "Transformer",
          transformerPath: [],
          failureMessage: errorMessage,
        });
        // setTransformationResult(null);
        return null;
      }
    }, 300); // 300ms debounce
  }, [
    currentTransformerDefinition,
    selectedEntityInstance,
    currentMiroirModelEnvironment,
    contextResults,
  ]);

  const transformationResult: any = useMemo(() => {
    if (!currentTransformerDefinition || !selectedEntityInstance) {
      return null;
    }

    try {
      const result: TransformerReturnType<any> = transformer_extended_apply_wrapper(
        context.miroirContext.miroirActivityTracker, // activityTracker
        "runtime", // step
        ["rootTransformer"], // transformerPath
        "TransformerEditor", // label
        currentTransformerDefinition, // transformer
        { ...currentMiroirModelEnvironment, ...contextResults }, // transformerParams
        contextResults, // contextResults - pass the instance to transform
        "value" // resolveBuildTransformersTo
      );

      // Check for Domain2ElementFailed pattern
      if (result && typeof result === "object" && "queryFailure" in result) {
        setTransformationError(result);
        return null;
      } else {
        setTransformationError(null);
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error("Error applying transformer:", error);
      setTransformationError({
        queryFailure: "FailedTransformer",
        elementType: "Transformer",
        transformerPath: [],
        failureMessage: errorMessage,
      });
      return null;
    }
  }, [
    currentTransformerDefinition,
    selectedEntityInstance,
    currentMiroirModelEnvironment,
    contextResults,
    context.miroirContext.miroirActivityTracker,
  ]);

  // ################################################################################################
  const transformationResultSchema: JzodElement = useMemo(() => {
    if (!currentTransformerDefinition) {
      return { type: "any" } as JzodElement;
    }
    return (valueToJzod(transformationResult)??{ type: "any" }) as JzodElement;
  }, [transformationResult]);
  
  // ################################################################################################
  // Handle transformer definition changes with debouncing (with persistence)
  const handleTransformerDefinitionChange = useCallback(async (newTransformerDefinition: any) => {
    log.info("handleTransformerDefinitionChange", newTransformerDefinition);
    // setCurrentTransformerDefinition(newTransformerDefinition);
    // Persist to context
    context.updateTransformerEditorState({ currentTransformerDefinition: newTransformerDefinition });
    applyTransformerToInstance();
  }, [context, applyTransformerToInstance]);

  // Apply transformer whenever definition or instance changes
  // useEffect(() => {
  //   applyTransformerToInstance();
    
  //   // Cleanup timeout on unmount
  //   return () => {
  //     if (transformerTimeoutRef.current) {
  //       clearTimeout(transformerTimeoutRef.current);
  //     }
  //   };
  // }, [applyTransformerToInstance, selectedEntityInstance]);

  // Memoized transformer entity UUID to avoid recalculation
  const transformerEntityUuid = useMemo(() => entityDefinitionTransformerDefinition.entityUuid, []);

  return (
    <ThemedContainer>
      <ThemedHeaderSection style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <ThemedTitle>
          Transformer Editor for Entity "{currentReportTargetEntity?.name || selectedEntityUuid}" of deployment {deploymentUuid}
        </ThemedTitle>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={copyTransformerDefinitionToClipboard}
            title={copiedToClipboard ? 'Copied' : 'Copy transformer definition to clipboard'}
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              background: copiedToClipboard ? '#e6ffe6' : '#f8f8f8',
              cursor: 'pointer'
            }}
          >
            {copiedToClipboard ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={clearTransformerDefinition}
            title={'Reset transformer to default constant transformer'}
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              background: '#fff4e6',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      </ThemedHeaderSection>

      {/* 3-Pane Layout */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Top Pane: Transformer Definition Editor */}
        <TypedValueObjectEditor
          labelElement={<>Transformer Definition</>}
          valueObject={currentTransformerDefinition}
          valueObjectMMLSchema={transformerDefinitionSchema}
          deploymentUuid={deploymentUuid}
          applicationSection={"model"}
          formLabel={"Transformer Definition Editor"}
          onSubmit={handleTransformerDefinitionChange}
          maxRenderDepth={Infinity} // Always render fully for editor
          displayError={errorPath && errorPath.length > 0 ? {
            errorPath: errorPath,
            errorMessage: `${innermostError?.queryFailure}: ${innermostError?.failureMessage}` // TODO: provide more specific error message
          } : undefined}
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
            onEntityChange={handleEntityChange}
            onNavigateNext={navigateToNextInstance}
            onNavigatePrevious={navigateToPreviousInstance}
            onNavigateRandom={navigateToRandomInstance}
          />
          <TransformationResultPanel
            transformationResult={transformationResult}
            transformationResultSchema={transformationResultSchema}
            transformationError={transformationError}
            selectedEntityInstance={selectedEntityInstance}
            deploymentUuid={deploymentUuid}
          />
        </div>
      </div>

      <TransformerEventsPanel />

      {/* <DebugPanel currentTransformerDefinition={currentTransformerDefinition} /> */}
    </ThemedContainer>
  );
});
