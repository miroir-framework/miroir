import React from 'react';

import {
  EntityInstance,
  LoggerInterface,
  MiroirLoggerFactory,
  Uuid,
  defaultTransformerInput,
  safeStringify,
  type JzodElement,
  type TransformerReturnType
} from 'miroir-core';


import { packageName } from '../../../../constants';
import { cleanLevel } from '../../constants';
import { TypedValueObjectEditorWithFormik } from '../Reports/TypedValueObjectEditorWithFormik';
import {
  ThemedCodeBlock,
  ThemedContainer,
  ThemedHeaderSection,
  ThemedTitle
} from "../Themes/index";
import { useFormikContext } from 'formik';
import type { TransformerEditorFormikValueType } from './TransformerEditorInterface';

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
  // selectedEntityInstance: EntityInstance | undefined;
  showAllInstances: boolean;
  // entityInstances: EntityInstance[];
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
    // selectedEntityInstance,
    showAllInstances,
    // entityInstances,
    deploymentUuid,
  }) => {
    log.info("Rendering TransformationResultPanel with result:", transformationResult);
    const formikContext = useFormikContext<TransformerEditorFormikValueType>();
    return (
      <ThemedContainer style={{ flex: 1 }}>
        <ThemedHeaderSection>
          <ThemedTitle>
            Transformation Result
            {transformationResult &&
              typeof transformationResult === "object" &&
              "queryFailure" in transformationResult && (
                <span style={{ color: "red", marginLeft: "10px", fontSize: "0.9em" }}>
                  ⚠️ Error
                </span>
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
          <TypedValueObjectEditorWithFormik
            labelElement={<div>target:</div>}
            initialValueObject={{ transformationResult }}
            formValueMLSchema={
              {
                type: "object",
                definition: {
                  transformationResult:
                    transformationResultSchema ?? ({ type: "any" } as JzodElement),
                },
              } // TODO: ILL-TYPED!!
            }
            formikValuePathAsString="transformationResult"
            deploymentUuid={deploymentUuid}
            applicationSection={"data"}
            formLabel={"Transformation Result Viewer"}
            onSubmit={async () => {}} // No-op for readonly
            mode="create"
            maxRenderDepth={3}
            readonly={true}
          />
        // ) : (showAllInstances ? entityInstances.length > 0 : selectedEntityInstance) ? (
        // ) : (showAllInstances ? formikContext.values.entityInstances?.length > 0 : formikContext.values.selectedEntityInstance) ? (
        ) : formikContext.values.transformerEditor_input_selector.mode !== "instance" ? (
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
              <div style={{ marginBottom: "8px" }}>
                Create a transformer to see the result here.
              </div>
              <div style={{ fontSize: "0.9em", color: "#666" }}>
                <div style={{ marginBottom: "4px" }}>
                  Tip: Use getFromContext to access the input, using "defaultInput" as referenceName:
                </div>
              </div>
            </div>
            <ThemedCodeBlock>
              {JSON.stringify(
                {
                  transformerType: "getFromContext",
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
