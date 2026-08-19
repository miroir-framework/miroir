import React, { useMemo } from 'react';

import {
  LoggerInterface,
  MiroirLoggerFactory,
  Uuid,
  defaultSelfApplicationDeploymentMap,
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
import { ThemedOnScreenHelper } from 'miroir-react';

export function hasDisplayableTransformationResult(
  result: TransformerReturnType<any>,
): boolean {
  if (result === undefined || result === null) {
    return false;
  }
  if (Array.isArray(result)) {
    return result.some((item) => item !== undefined && item !== null);
  }
  return true;
}

const TransformationResultValueEditor: React.FC<{
  transformationResult: TransformerReturnType<any>;
  transformationResultSchema?: JzodElement;
  inputApplication: Uuid;
  inputDeploymentUuid: Uuid;
}> = React.memo(({ transformationResult, transformationResultSchema, inputApplication, inputDeploymentUuid }) => {
  const initialValueObject = useMemo(
    () => ({ transformationResult }),
    [safeStringify(transformationResult)],
  );

  return (
    <TypedValueObjectEditorWithFormik
      labelElement={<div>target:</div>}
      initialValueObject={initialValueObject}
      formValueMLSchema={transformationResultSchema ?? ({ type: "any" } as JzodElement)}
      formikValuePathAsString="transformationResult"
      application={inputApplication}
      applicationDeploymentMap={defaultSelfApplicationDeploymentMap}
      deploymentUuid={inputDeploymentUuid}
      applicationSection={"data"}
      formLabel={"Transformation Result Viewer"}
      onSubmit={async () => {}}
      valueObjectEditMode="create"
      maxRenderDepth={3}
      readonly={true}
    />
  );
});

TransformationResultValueEditor.displayName = "TransformationResultValueEditor";

// ################################################################################################
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerResultPanel");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export const TransformationResultPanel: React.FC<{
  transformationResult: TransformerReturnType<any>;
  transformationResultSchema?: JzodElement;
  showAllInstances: boolean;
  inputSelectorMode: "instance" | "here" | "none";
  inputApplication: Uuid;
  inputDeploymentUuid: Uuid;
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
    showAllInstances,
    inputSelectorMode,
    inputApplication,
    inputDeploymentUuid,
  }) => {
    log.info("Rendering TransformationResultPanel with result:", transformationResult);
    const showResultEditor = hasDisplayableTransformationResult(transformationResult);
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
          <ThemedOnScreenHelper label="result" data={transformationResult} />
        ) : showResultEditor ? (
          <TransformationResultValueEditor
            transformationResult={transformationResult}
            transformationResultSchema={transformationResultSchema}
            inputApplication={inputApplication}
            inputDeploymentUuid={inputDeploymentUuid}
          />
        ) : inputSelectorMode !== "instance" ? (
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
                  Tip: Use getFromContext to access the input, using "defaultInput" as
                  referenceName:
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
