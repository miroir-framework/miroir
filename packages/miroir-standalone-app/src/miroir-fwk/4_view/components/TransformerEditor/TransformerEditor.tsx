import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  getEntityInstancesUuidIndexNonHook,
  transformer_extended_apply_wrapper,
  type Domain2QueryReturnType,
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
import { TypedValueObjectEditor } from '../Reports/TypedValueObjectEditor';

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
// Memoized sub-components for better performance
// ################################################################################################
const EntityInstancePanel = React.memo<{
  entityInstances: EntityInstance[];
  selectedEntityInstance: EntityInstance | undefined;
}>(({ entityInstances, selectedEntityInstance }) => (
  <ThemedContainer style={{ flex: 1 }}>
    <ThemedHeaderSection>
      <ThemedTitle>
        Entity Instance ({entityInstances.length} instances available)
      </ThemedTitle>
    </ThemedHeaderSection>
    <ThemedCodeBlock>
      {selectedEntityInstance
        ? safeStringify(selectedEntityInstance)
        : "No entity instances found"}
    </ThemedCodeBlock>
  </ThemedContainer>
));

const TransformationResultPanel = React.memo<{
  transformationResult: any;
  transformationError: string | null;
  selectedEntityInstance: EntityInstance | undefined;
}>(({ transformationResult, transformationError, selectedEntityInstance }) => (
  <ThemedContainer style={{ flex: 1 }}>
    <ThemedHeaderSection>
      <ThemedTitle>
        Transformation Result
        {transformationError && (
          <span style={{ color: 'red', marginLeft: '10px', fontSize: '0.9em' }}>
            ⚠️ Error
          </span>
        )}
      </ThemedTitle>
    </ThemedHeaderSection>
    
    {transformationError ? (
      <ThemedCodeBlock>
        {typeof transformationError === 'string' 
          ? transformationError 
          : safeStringify(transformationError)
        }
      </ThemedCodeBlock>
    ) : transformationResult !== null ? (
      <ThemedCodeBlock>
        {safeStringify(transformationResult)}
      </ThemedCodeBlock>
    ) : selectedEntityInstance ? (
      <div>
        <div style={{ marginBottom: '12px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>No transformation result yet.</div>
          <div style={{ marginBottom: '8px' }}>Create a transformer to see the result here.</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            <div style={{ marginBottom: '4px' }}>Tip: Use contextReference to access the entity instance:</div>
          </div>
        </div>
        <ThemedCodeBlock>
          {JSON.stringify({ 
            "transformerType": "contextReference", 
            "referenceName": "applyTo" 
          }, null, 2)}
        </ThemedCodeBlock>
      </div>
    ) : (
      <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
        No entity instance available for transformation.
      </div>
    )}
  </ThemedContainer>
));

const DebugPanel = React.memo<{
  currentTransformerDefinition: any;
}>(({ currentTransformerDefinition }) => (
  <ThemedContainer style={{ marginTop: "20px" }}>
    <ThemedHeaderSection>
      <ThemedTitle>Current Transformer Definition (Debug)</ThemedTitle>
    </ThemedHeaderSection>
    <ThemedCodeBlock>{safeStringify(currentTransformerDefinition, 2)}</ThemedCodeBlock>
  </ThemedContainer>
));

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
        entityUuid,
        "name" // Order by name if available
      );
    } catch (error) {
      log.error("Error fetching entity instances:", error);
      return [];
    }
  }, [deploymentEntityState, currentMiroirModelEnvironment, deploymentUuid, entityUuid]);

  // Select the first instance for display with stable reference
  const selectedEntityInstance: EntityInstance | undefined = useMemo(() => {
    return entityInstances.length > 0 ? entityInstances[0] : undefined;
  }, [entityInstances]);

  // TransformerDefinition schema - memoized to avoid recalculation
  const transformerDefinitionSchema: JzodElement = useMemo(() => ({
    type: "schemaReference",
    definition: {
      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      relativePath: "transformerForBuildPlusRuntime",
    },
  }), []);

  // Initialize transformer definition only once
  const [currentTransformerDefinition, setCurrentTransformerDefinition] = useState<any>(() =>
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

  const [foldedObjectAttributeOrArrayItems, setFoldedObjectAttributeOrArrayItems] = useState<{
      [k: string]: boolean;
    }>({});
  
  // State for transformation result
  const [transformationResult, setTransformationResult] = useState<any>(null);
  const [transformationError, setTransformationError] = useState<string | null>(null);
  
  // Debouncing for transformer execution
  const transformerTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Handle transformer definition changes with debouncing
  const handleTransformerDefinitionChange = useCallback(async (newTransformerDefinition: any) => {
    log.info("handleTransformerDefinitionChange", newTransformerDefinition);
    setCurrentTransformerDefinition(newTransformerDefinition);
  }, []);

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

  // Apply transformer to selected entity instance with debouncing
  const applyTransformerToInstance = useCallback(async () => {
    if (!currentTransformerDefinition || !selectedEntityInstance) {
      setTransformationResult(null);
      setTransformationError(null);
      return;
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
          instance: selectedEntityInstance
        });

        const result: Domain2QueryReturnType<any> = transformer_extended_apply_wrapper(
          "runtime", // step
          "TransformerEditor", // label
          currentTransformerDefinition, // transformer
          {...currentMiroirModelEnvironment, ...contextResults}, // transformerParams
          contextResults, // contextResults - pass the instance to transform
          "value" // resolveBuildTransformersTo
        );

        // Check for Domain2ElementFailed pattern
        if (result && typeof result === 'object' && 'queryFailure' in result) {
          setTransformationError(`Transformation failed: ${safeStringify(result)}`);
          setTransformationResult(null);
        } else {
          setTransformationResult(result);
          setTransformationError(null);
          log.info("Transformation successful", { result });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error("Error applying transformer:", error);
        setTransformationError(`Error: ${errorMessage}`);
        setTransformationResult(null);
      }
    }, 300); // 300ms debounce
  }, [currentTransformerDefinition, selectedEntityInstance, currentMiroirModelEnvironment, contextResults]);

  // Apply transformer whenever definition or instance changes
  useEffect(() => {
    applyTransformerToInstance();
    
    // Cleanup timeout on unmount
    return () => {
      if (transformerTimeoutRef.current) {
        clearTimeout(transformerTimeoutRef.current);
      }
    };
  }, [applyTransformerToInstance]);

  // Memoized transformer entity UUID to avoid recalculation
  const transformerEntityUuid = useMemo(() => entityDefinitionTransformerDefinition.entityUuid, []);

  return (
    <ThemedContainer>
      <ThemedHeaderSection>
        <ThemedTitle>
          Transformer Editor for Entity {transformerEntityUuid} of deployment {deploymentUuid}
        </ThemedTitle>
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
          foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
          setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
          maxRenderDepth={Infinity} // Always render fully for editor
        />

        {/* Bottom Panes: Side by side */}
        <div style={{ display: "flex", gap: "20px", minHeight: "300px" }}>
          <EntityInstancePanel
            entityInstances={entityInstances}
            selectedEntityInstance={selectedEntityInstance}
          />
          <TransformationResultPanel
            transformationResult={transformationResult}
            transformationError={transformationError}
            selectedEntityInstance={selectedEntityInstance}
          />
        </div>
      </div>

      <DebugPanel currentTransformerDefinition={currentTransformerDefinition} />
    </ThemedContainer>
  );
});
