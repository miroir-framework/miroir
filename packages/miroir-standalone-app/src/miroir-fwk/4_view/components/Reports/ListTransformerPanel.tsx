import { Formik, useFormikContext } from "formik";
import React, { useMemo, useState } from "react";

import {
  checkTransformerInterfaceCompatibilityWithInference,
  getTransformerDefinitionInputOutput,
  inferElementTransformerOutputType,
  safeStringify,
  type ApplicationDeploymentMap,
  type CoreTransformerForBuildPlusRuntime,
  type Entity,
  type InputOutputType,
  type JzodElement,
  type TransformerReturnType,
  type Uuid,
} from "miroir-core";
import { ThemedOnScreenHelper } from "miroir-react";

import { TypedValueObjectEditor } from "./TypedValueObjectEditor.js";
import { TypedValueObjectEditorWithFormik } from "./TypedValueObjectEditorWithFormik.js";
import {
  applyTransformerToListRows,
  DEFAULT_ROW_IDENTITY_TRANSFORMER,
  getListTransformationFailure,
  resolveListTransformationResultDisplaySchema,
} from "./listDisplayByTransformer.js";
import { hasDisplayableTransformationResult } from "../TransformerEditor/TransformationResultPanel.js";
import { ThemedContainer, ThemedHeaderSection, ThemedTitle } from "../Themes/index.js";

/** Shared with TransformerEditor — schemaReference to coreTransformerForBuildPlusRuntime. */
export const coreTransformerForBuildPlusRuntimeSchemaReference: JzodElement = {
  type: "schemaReference",
  definition: {
    absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
    relativePath: "coreTransformerForBuildPlusRuntime",
  },
};

const TRANSFORMER_INPUT_FORMIK_KEY = "elementTransformer";

export interface ListTransformerPanelProps {
  instancesToDisplay: any[] | Record<string, any>;
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  deploymentUuid: Uuid;
  sectionLabel?: string;
  /** Row entity ML schema (enables typed result schema for identity / getFromContext row). */
  rowMlSchema?: JzodElement;
  /** Entity uuid of the list rows — used as transformer input type for the adequacy check. */
  rowEntityUuid?: Uuid;
  /** Entities proposed as output-type choices in addition to the base types. */
  entities?: Entity[];
}

const INPUT_OUTPUT_BASE_TYPES = [
  "any",
  "undefined",
  "bigint",
  "number",
  "string",
  "boolean",
  "object",
  "array",
] as const;

/** Human-readable label for an input/output type (entity uuid → entity name when known). */
function formatInputOutputTypeLabel(type: InputOutputType, entities?: Entity[]): string {
  if (typeof type === "object") {
    const payloadLabel =
      type.payload === undefined || type.payload === "any"
        ? "any"
        : formatInputOutputTypeLabel(type.payload as InputOutputType, entities);
    return `${type.type}<${payloadLabel}>`;
  }
  return entities?.find((entity) => entity.uuid === type)?.name ?? type;
}

const ListTransformerResultViewer: React.FC<{
  transformationResult: TransformerReturnType<any>;
  transformationResultSchema: JzodElement;
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  deploymentUuid: Uuid;
}> = ({
  transformationResult,
  transformationResultSchema,
  application,
  applicationDeploymentMap,
  deploymentUuid,
}) => {
  const initialValueObject = useMemo(
    () => ({ transformationResult }),
    [safeStringify(transformationResult)],
  );

  return (
    <TypedValueObjectEditorWithFormik
      labelElement={<div>Transformed rows:</div>}
      initialValueObject={initialValueObject}
      formValueMLSchema={transformationResultSchema}
      formikValuePathAsString="transformationResult"
      application={application}
      applicationDeploymentMap={applicationDeploymentMap}
      deploymentUuid={deploymentUuid}
      applicationSection="data"
      formLabel="List transformer result"
      onSubmit={async () => {}}
      valueObjectEditMode="create"
      maxRenderDepth={3}
      readonly={true}
      displaySubmitButton="noDisplay"
    />
  );
};

const ListTransformerPanelInner: React.FC<ListTransformerPanelProps> = ({
  instancesToDisplay,
  application,
  applicationDeploymentMap,
  deploymentUuid,
  sectionLabel,
  rowMlSchema,
  rowEntityUuid,
  entities,
}) => {
  const formik = useFormikContext<Record<string, any>>();

  const elementTransformer: CoreTransformerForBuildPlusRuntime =
    formik.values[TRANSFORMER_INPUT_FORMIK_KEY] ?? DEFAULT_ROW_IDENTITY_TRANSFORMER;

  // undefined = "default", i.e. same as the input type
  const [chosenOutputType, setChosenOutputType] = useState<InputOutputType | undefined>(undefined);
  const defaultExpectedOutputType: InputOutputType = rowEntityUuid ?? "any";
  const expectedOutputType: InputOutputType = chosenOutputType ?? defaultExpectedOutputType;
  const givenInputType: InputOutputType = rowEntityUuid ?? "any";
  const givenInputTypeLabel = formatInputOutputTypeLabel(givenInputType, entities);

  // CoreTransformerForBuildPlusRuntime has string (by-name reference) and array arms — no interface check then.
  const transformerType: string | undefined =
    typeof elementTransformer === "object" &&
    !Array.isArray(elementTransformer) &&
    "transformerType" in elementTransformer
      ? elementTransformer.transformerType
      : undefined;
  const inferredOutputType = useMemo(
    () => inferElementTransformerOutputType(elementTransformer, rowMlSchema, rowEntityUuid),
    [elementTransformer, rowMlSchema, rowEntityUuid],
  );
  const interfaceCompatibility = useMemo(
    () =>
      transformerType
        ? checkTransformerInterfaceCompatibilityWithInference(
            { input: rowEntityUuid ?? "any", output: expectedOutputType },
            getTransformerDefinitionInputOutput(transformerType),
            inferredOutputType,
          )
        : ({ status: "ok" } as const),
    [transformerType, rowEntityUuid, expectedOutputType, inferredOutputType],
  );
  const transformerInadequate = interfaceCompatibility.status === "incompatible";
  const interfaceMismatchTitle =
    interfaceCompatibility.status === "incompatible"
      ? interfaceCompatibility.failures
          .map((failure) => {
            const actualLabel =
              failure.source === "inferred" ? "inferred actual" : "transformer declares";
            return `${failure.direction}: expected ${safeStringify(failure.given)}, ${actualLabel} ${safeStringify(failure.declared)}`;
          })
          .join("; ")
      : undefined;

  const transformationResult = useMemo(
    () => applyTransformerToListRows(instancesToDisplay, elementTransformer),
    [instancesToDisplay, elementTransformer],
  );

  const transformationResultSchema = useMemo(
    () =>
      resolveListTransformationResultDisplaySchema(
        elementTransformer,
        transformationResult,
        rowMlSchema,
      ),
    [elementTransformer, transformationResult, rowMlSchema],
  );

  const transformationFailure = useMemo(
    () => getListTransformationFailure(transformationResult),
    [transformationResult],
  );

  const showResultEditor =
    !transformationFailure && hasDisplayableTransformationResult(transformationResult);

  return (
    <div data-testid="list-transformer-panel">
      <ThemedContainer style={{ marginTop: "12px" }}>
      <ThemedHeaderSection>
        <ThemedTitle>
          {sectionLabel ? `${sectionLabel} — transformer` : "List transformer"}
        </ThemedTitle>
      </ThemedHeaderSection>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "4px 0", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>Given input type:</span>
          <span
            data-testid="list-transformer-given-input-type"
            title={typeof givenInputType === "string" ? givenInputType : safeStringify(givenInputType)}
          >
            {givenInputTypeLabel}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label htmlFor="list-transformer-expected-output-type">Expected output type:</label>
          <select
            id="list-transformer-expected-output-type"
            data-testid="list-transformer-expected-output-type"
            value={typeof expectedOutputType === "string" ? expectedOutputType : "any"}
            onChange={(event) =>
              setChosenOutputType(
                event.target.value === defaultExpectedOutputType
                  ? undefined
                  : (event.target.value as InputOutputType),
              )
            }
          >
            {INPUT_OUTPUT_BASE_TYPES.map((baseType) => (
              <option key={baseType} value={baseType}>
                {baseType}
              </option>
            ))}
            {[...(entities ?? [])]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((entity) => (
                <option key={entity.uuid} value={entity.uuid}>
                  {entity.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div
        data-testid="list-transformer-editor"
        data-transformer-inadequate={transformerInadequate ? "true" : "false"}
        title={interfaceMismatchTitle}
        style={{
          border: transformerInadequate ? "2px solid #ff9800" : "2px solid transparent",
          borderRadius: "4px",
          padding: "2px",
        }}
      >
        <TypedValueObjectEditor
          labelElement={<div>Element transformer (per row):</div>}
          formValueMLSchema={coreTransformerForBuildPlusRuntimeSchemaReference}
          formikValuePathAsString={TRANSFORMER_INPUT_FORMIK_KEY}
          application={application}
          applicationDeploymentMap={applicationDeploymentMap}
          deploymentUuid={deploymentUuid}
          applicationSection="data"
          formLabel="List row transformer"
          valueObjectEditMode="create"
          maxRenderDepth={2}
          displaySubmitButton="noDisplay"
        />
      </div>

      {transformationFailure ? (
        <ThemedOnScreenHelper label="transformer result error" data={transformationFailure} />
      ) : showResultEditor ? (
        <div data-testid="list-transformer-result">
          <ListTransformerResultViewer
            transformationResult={transformationResult}
            transformationResultSchema={transformationResultSchema}
            application={application}
            applicationDeploymentMap={applicationDeploymentMap}
            deploymentUuid={deploymentUuid}
          />
        </div>
      ) : null}
      </ThemedContainer>
    </div>
  );
};

export const ListTransformerPanel: React.FC<ListTransformerPanelProps> = (props) => {
  const initialValues = useMemo(
    () => ({
      [TRANSFORMER_INPUT_FORMIK_KEY]: DEFAULT_ROW_IDENTITY_TRANSFORMER,
    }),
    [],
  );

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialValues}
      onSubmit={() => {}}
      validateOnChange={false}
      validateOnBlur={false}
    >
      <ListTransformerPanelInner {...props} />
    </Formik>
  );
};
