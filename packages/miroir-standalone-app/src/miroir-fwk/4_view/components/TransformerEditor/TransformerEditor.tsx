import React, { useState, useCallback, useMemo } from 'react';
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
  const transformerDefinitionSchema: JzodElement =
    entityDefinitionTransformerDefinition.jzodSchema.definition.transformerImplementation;

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
  
  // Handle transformer definition changes
  const handleTransformerDefinitionChange = useCallback((newTransformerDefinition: any) => {
    log.info("handleTransformerDefinitionChange", newTransformerDefinition);
    setCurrentTransformerDefinition(newTransformerDefinition);
  }, []);

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
          onSubmit={async ()=>{}}
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
              <ThemedTitle>Transformation Result</ThemedTitle>
            </ThemedHeaderSection>
            <ThemedCodeBlock>
              {currentTransformerDefinition
                ? safeStringify(currentTransformerDefinition, 2)
                : "No transformer definition"}
            </ThemedCodeBlock>
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
