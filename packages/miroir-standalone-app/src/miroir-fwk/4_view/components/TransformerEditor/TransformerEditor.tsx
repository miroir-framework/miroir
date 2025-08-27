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
  deploymentUuid: Uuid;
  foldedObjectAttributeOrArrayItems: { [k: string]: boolean };
  setFoldedObjectAttributeOrArrayItems: React.Dispatch<
    React.SetStateAction<{ [k: string]: boolean }>
  >;
}>(
  ({
    entityInstances,
    selectedEntityInstance,
    selectedEntityInstanceDefinition,
    deploymentUuid,
    foldedObjectAttributeOrArrayItems,
    setFoldedObjectAttributeOrArrayItems,
  }) => (
    <ThemedContainer style={{ flex: 1 }}>
      <ThemedHeaderSection>
        <ThemedTitle>Entity Instance ({entityInstances.length} instances available)</ThemedTitle>
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
          foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
          setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
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

const TransformationResultPanel = React.memo<{
  transformationResult: any;
  transformationResultSchema?: JzodElement;
  transformationError: string | null;
  selectedEntityInstance: EntityInstance | undefined;
  deploymentUuid: Uuid;
  foldedObjectAttributeOrArrayItems: { [k: string]: boolean };
  setFoldedObjectAttributeOrArrayItems: React.Dispatch<
    React.SetStateAction<{ [k: string]: boolean }>
  >;
}>(
  ({
    transformationResult,
    transformationResultSchema,
    transformationError,
    selectedEntityInstance,
    deploymentUuid,
    foldedObjectAttributeOrArrayItems,
    setFoldedObjectAttributeOrArrayItems,
  }) => (
    <ThemedContainer style={{ flex: 1 }}>
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
          foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
          setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
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

  const currentReportDeploymentSectionEntities: Entity[] = currentModel.entities; // Entities are always defined in the 'model' section
  const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] =
    currentModel.entityDefinitions; // EntityDefinitions are always defined in the 'model' section

  const currentReportTargetEntity: Entity | undefined =
    currentReportDeploymentSectionEntities?.find((e) => e?.uuid === entityUuid);

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
  
  // Separate fold state management for each panel
  const [foldedEntityInstanceItems, setFoldedEntityInstanceItems] = useState<{ [k: string]: boolean }>({});
  const [foldedTransformationResultItems, setFoldedTransformationResultItems] = useState<{ [k: string]: boolean }>({});
  
  // Debouncing for transformer execution
  const transformerTimeoutRef = useRef<NodeJS.Timeout>();
  
  // ################################################################################################
  const transformationResultSchema: JzodElement = useMemo(() => {
    if (!currentTransformerDefinition) {
      return { type: "any" } as JzodElement;
    }
    return (valueToJzod(transformationResult)??{ type: "any" }) as JzodElement;
  }, [transformationResult]);
  
  // ################################################################################################
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

  // ################################################################################################
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
            selectedEntityInstanceDefinition={currentReportTargetEntityDefinition}
            deploymentUuid={deploymentUuid}
            foldedObjectAttributeOrArrayItems={foldedEntityInstanceItems}
            setFoldedObjectAttributeOrArrayItems={setFoldedEntityInstanceItems}
          />
          <TransformationResultPanel
            transformationResult={transformationResult}
            transformationResultSchema={transformationResultSchema}
            transformationError={transformationError}
            selectedEntityInstance={selectedEntityInstance}
            deploymentUuid={deploymentUuid}
            foldedObjectAttributeOrArrayItems={foldedTransformationResultItems}
            setFoldedObjectAttributeOrArrayItems={setFoldedTransformationResultItems}
          />
        </div>
      </div>

      <DebugPanel currentTransformerDefinition={currentTransformerDefinition} />
    </ThemedContainer>
  );
});
