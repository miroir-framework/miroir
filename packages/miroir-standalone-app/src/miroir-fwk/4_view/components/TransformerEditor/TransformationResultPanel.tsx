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
  defaultTransformerInput,
  safeStringify,
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
import type { TransformerForBuildPlusRuntime } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';

// ################################################################################################
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerResultPanel"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export const TransformationResultPanel: React.FC<{
  transformationResult: TransformerReturnType<any>;
  transformationResultSchema?: JzodElement;
  // transformationError: string | null;
  // transformationError: TransformerFailure | null;
  selectedEntityInstance: EntityInstance | undefined;
  showAllInstances: boolean;
  entityInstances: EntityInstance[];
  deploymentUuid: Uuid;
}> =
  // React.memo<{
  //   transformationResult: any;
  //   transformationResultSchema?: JzodElement;
  //   // transformationError: string | null;
  //   transformationError: TransformerFailure | null;
  //   selectedEntityInstance: EntityInstance | undefined;
  //   showAllInstances: boolean;
  //   entityInstances: EntityInstance[];
  //   deploymentUuid: Uuid;
  // }>(
  ({
    transformationResult,
    transformationResultSchema,
    // transformationError,
    selectedEntityInstance,
    showAllInstances,
    entityInstances,
    deploymentUuid,
  }) => {
    log.info("Rendering TransformationResultPanel with result:", transformationResult);
    return (
    <ThemedContainer style={{ flex: 1, maxWidth: "50%" }}>
      <ThemedHeaderSection>
        <ThemedTitle>
          Transformation Result
          {transformationResult &&
            typeof transformationResult === "object" &&
            "queryFailure" in transformationResult && (
              <span style={{ color: "red", marginLeft: "10px", fontSize: "0.9em" }}>⚠️ Error</span>
            )}
        </ThemedTitle>
      </ThemedHeaderSection>

      {transformationResult &&
      typeof transformationResult === "object" &&
      "queryFailure" in transformationResult ? (
        <ThemedCodeBlock>
          {typeof transformationResult === "string"
            ? transformationResult
            : safeStringify(transformationResult)}
        </ThemedCodeBlock>
      ) : transformationResult !== null ? (
        <TypedValueObjectEditor
          labelElement={<div>target:</div>}
          valueObject={transformationResult}
          valueObjectMMLSchema={transformationResultSchema ?? { type: "any" } as JzodElement}
          deploymentUuid={deploymentUuid}
          applicationSection={"data"}
          formLabel={"Transformation Result Viewer"}
          onSubmit={async () => {}} // No-op for readonly
          maxRenderDepth={3}
          readonly={true}
        />
      ) : (showAllInstances ? entityInstances.length > 0 : selectedEntityInstance) ? (
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
                Tip: Use contextReference to access the entity instance{showAllInstances ? "s" : ""}
                :
              </div>
            </div>
          </div>
          <ThemedCodeBlock>
            {JSON.stringify(
              {
                transformerType: "contextReference",
                // referenceName: showAllInstances ? "target" : "applyTo",
                referenceName: defaultTransformerInput,
              },
              null,
              2
            )}
          </ThemedCodeBlock>
        </div>
      ) : (
        <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
          No entity instance{showAllInstances ? "s" : ""} available for transformation.
        </div>
      )}
    </ThemedContainer>
  );}
