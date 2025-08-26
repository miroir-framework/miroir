import React, { useState, useCallback, useMemo, useEffect } from 'react';
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

  // Fetch all instances of the target entity
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

  // Select the first instance for display
  const selectedEntityInstance: EntityInstance | undefined = useMemo(() => {
    return entityInstances.length > 0 ? entityInstances[0] : undefined;
  }, [entityInstances]);

  log.info(
    "TransformerEditor entityInstances",
    entityInstances,
    "selectedEntityInstance",
    selectedEntityInstance
  );

  // TransformerDefinition schema based on the provided JSON - simplified for now
  const transformerEntityUuid = entityDefinitionTransformerDefinition.entityUuid;
  
  // Get the transformerForBuildPlusRuntime schema from the fundamental schema
  const transformerDefinitionSchema: JzodElement = {
    type: "schemaReference",
    definition: {
      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      relativePath: "transformerForBuildPlusRuntime",
    },
  };
  // const transformerDefinitionSchema: JzodElement =
  //   entityDefinitionTransformerDefinition.jzodSchema.definition.transformerImplementation;

  log.info(
    "TransformerEditor transformerDefinitionSchema",
    transformerDefinitionSchema
  );

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
    "transformerDefinitionSchema schema",
    transformerDefinitionSchema
  );
  const [foldedObjectAttributeOrArrayItems, setFoldedObjectAttributeOrArrayItems] = useState<{
      [k: string]: boolean;
      // }>({"ROOT": true}); // Initialize with empty key to handle root object folding
    }>({});
  
  // State for transformation result
  const [transformationResult, setTransformationResult] = useState<any>(null);
  const [transformationError, setTransformationError] = useState<string | null>(null);
  
  // Handle transformer definition changes
  const handleTransformerDefinitionChange = useCallback(async (newTransformerDefinition: any) => {
    log.info("handleTransformerDefinitionChange", newTransformerDefinition);
    setCurrentTransformerDefinition(newTransformerDefinition);
  }, []);

  // Apply transformer to selected entity instance
  const applyTransformerToInstance = useCallback(async () => {
    if (!currentTransformerDefinition || !selectedEntityInstance) {
      setTransformationResult(null);
      setTransformationError(null);
      return;
    }

    try {
      log.info("Applying transformer to instance", {
        transformer: currentTransformerDefinition,
        instance: selectedEntityInstance
      });

      // Provide multiple context keys for different transformer reference patterns
      const contextResults = {
        // Standard keys that transformers commonly use
        // applyTo: selectedEntityInstance,
        entityInstance: selectedEntityInstance,
        instance: selectedEntityInstance,
        target: selectedEntityInstance,
        // Also provide the actual entity instance data directly
        ...selectedEntityInstance
      };

      const result: Domain2QueryReturnType<any> = transformer_extended_apply_wrapper(
        "runtime", // step
        "TransformerEditor", // label
        // currentTransformerDefinition.definition, // transformer
        currentTransformerDefinition, // transformer
        {...currentMiroirModelEnvironment, ...contextResults}, // transformerParams
        contextResults, // contextResults - pass the instance to transform
        "value" // resolveBuildTransformersTo
      );
      log.info("Transformer application result", result);

      // Check for Domain2ElementFailed pattern
      if (result && typeof result === 'object' && 'queryFailure' in result) {
        setTransformationError(`Transformation failed: ${JSON.stringify(result, null, 2)}`);
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
  }, [currentTransformerDefinition, selectedEntityInstance, currentMiroirModelEnvironment]);

  // Apply transformer whenever definition or instance changes
  useEffect(() => {
    applyTransformerToInstance();
  }, [applyTransformerToInstance]);

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
          //
          formLabel={"Transformer Definition Editor"}
          onSubmit={handleTransformerDefinitionChange}
          foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
          setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
          maxRenderDepth={Infinity} // Always render fully for editor
        />

        {/* Bottom Panes: Side by side */}
        <div style={{ display: "flex", gap: "20px", minHeight: "300px" }}>
          {/* Left Pane: Entity Instance */}
          <ThemedContainer style={{ flex: 1 }}>
            <ThemedHeaderSection>
              <ThemedTitle>
                Entity Instance ({entityInstances.length} instances available)
              </ThemedTitle>
            </ThemedHeaderSection>
            <ThemedCodeBlock>
              {selectedEntityInstance
                ? JSON.stringify(selectedEntityInstance, null, 2)
                : "No entity instances found"}
            </ThemedCodeBlock>
          </ThemedContainer>

          {/* Right Pane: Transformation Result */}
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
                  : JSON.stringify(transformationError, null, 2)
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
