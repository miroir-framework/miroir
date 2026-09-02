import { Formik, useFormikContext } from "formik";
import React, { useMemo, useState } from "react";

import {
  checkTransformerInterfaceCompatibilityWithInference,
  checkTransformerMlSchemaCompatibility,
  collectTransformerEnvironmentBindings,
  defaultTransformerInput,
  entityMLSchema,
  formatMlSchemaTypeLabel,
  formatTransformerEnvironmentLabel,
  getApplicationSection,
  getTransformerDefinitionInputOutput,
  inferElementTransformerOutputType,
  liftInputOutputTypeToMlSchema,
  safeStringify,
  type ApplicationDeploymentMap,
  type CoreTransformerForBuildPlusRuntime,
  type Entity,
  type InputOutputType,
  type JzodElement,
  type TransformerMlSchemaNodeReport,
  type TransformerReturnType,
  type Uuid,
} from "miroir-core";
import { ThemedOnScreenHelper } from "miroir-react";
import { entityEntity, reportEntityDetails } from "miroir-test-app_deployment-miroir";

import { TypedValueObjectEditor } from "./TypedValueObjectEditor.js";
import { TypedValueObjectEditorWithFormik } from "./TypedValueObjectEditorWithFormik.js";
import {
  applyTransformerToListRows,
  DEFAULT_ROW_IDENTITY_TRANSFORMER,
  getListTransformationFailure,
  resolveListTransformationResultDisplaySchema,
} from "./listDisplayByTransformer.js";
import { hasDisplayableTransformationResult } from "../TransformerEditor/TransformationResultPanel.js";
import { ReportInstanceLink } from "../ReportInstanceLink.js";
import {
  TransformerNamedBindings,
  TransformerTitleSignature,
} from "./TransformerTypeAnnotation.js";
import {
  ThemedContainer,
  ThemedFlexRow,
  ThemedHeaderSection,
  ThemedLabel,
  ThemedLabeledEditor,
  ThemedSelectWithPortal,
  ThemedSwitch,
  ThemedText,
  ThemedTitle,
} from "../Themes/index.js";

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
  /**
   * #251 — when true, start in mlSchema compatibility mode (also the Settings
   * `mlSchemaTransformerCompatibility` default). Off keeps the #249 inputOutput path.
   */
  mlSchemaCompatibilityEnabled?: boolean;
  /** Report / page parameters available to getFromParameters in the list transformer. */
  transformerParams?: Record<string, any>;
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
function formatMlSchemaNodeMismatch(
  node: TransformerMlSchemaNodeReport,
  schemaNameResolver?: (schema: JzodElement) => string | undefined,
): string {
  const pathLabel = node.path.length === 0 ? node.transformerType : `${node.path.join(".")} (${node.transformerType})`;
  return node.failures
    .map((failure) => {
      const givenLabel = formatMlSchemaTypeLabel(failure.given, { schemaNameResolver });
      const declaredLabel = formatMlSchemaTypeLabel(failure.declared, { schemaNameResolver });
      return `${pathLabel} ${failure.direction}: given ${givenLabel}, declared ${declaredLabel}`;
    })
    .join("; ");
}

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
  mlSchemaCompatibilityEnabled = false,
  transformerParams = {},
}) => {
  const formik = useFormikContext<Record<string, any>>();

  const elementTransformer: CoreTransformerForBuildPlusRuntime =
    formik.values[TRANSFORMER_INPUT_FORMIK_KEY] ?? DEFAULT_ROW_IDENTITY_TRANSFORMER;

  // undefined = "default", i.e. same as the input type
  const [chosenOutputType, setChosenOutputType] = useState<InputOutputType | undefined>(undefined);
  const [mlSchemaMode, setMlSchemaMode] = useState(mlSchemaCompatibilityEnabled);
  const defaultExpectedOutputType: InputOutputType = rowEntityUuid ?? "any";
  const expectedOutputType: InputOutputType = chosenOutputType ?? defaultExpectedOutputType;
  const givenInputType: InputOutputType = rowEntityUuid ?? "any";
  const givenInputTypeLabel = formatInputOutputTypeLabel(givenInputType, entities);

  const entityMlSchemas = useMemo(() => {
    const map: Record<string, JzodElement> = {};
    for (const entity of entities ?? []) {
      if (entity.mlSchema) {
        map[entity.uuid] = entity.mlSchema as JzodElement;
      }
    }
    if (rowEntityUuid && rowMlSchema) {
      map[rowEntityUuid] = rowMlSchema;
    }
    return map;
  }, [entities, rowEntityUuid, rowMlSchema]);

  // Maps an object mlSchema to its entity name (e.g. the row entity `Book`), for
  // named display of object types in labels and tooltips.
  const mlSchemaNameResolver = useMemo(() => {
    const nameBySchemaJson = new Map<string, string>();
    for (const entity of entities ?? []) {
      if (entity.mlSchema) {
        nameBySchemaJson.set(JSON.stringify(entity.mlSchema), entity.name);
        nameBySchemaJson.set(JSON.stringify(entityMLSchema(entity)), entity.name);
      }
    }
    if (rowEntityUuid && rowMlSchema) {
      const rowEntity = entities?.find((entity) => entity.uuid === rowEntityUuid);
      if (rowEntity) {
        nameBySchemaJson.set(JSON.stringify(rowMlSchema), rowEntity.name);
      }
    }
    return (schema: JzodElement): string | undefined => nameBySchemaJson.get(JSON.stringify(schema));
  }, [entities, rowEntityUuid, rowMlSchema]);

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
    () => {
      if (!transformerType) {
        return { status: "ok" } as const;
      }
      const declared = getTransformerDefinitionInputOutput(transformerType);
      // mergeIntoObject declares output `object`. An empty overlay still yields the
      // row entity; use inferred output for the #249 output check in that case.
      const declaredForCheck =
        transformerType === "mergeIntoObject" &&
        inferredOutputType !== undefined &&
        declared
          ? { ...declared, output: inferredOutputType }
          : declared;
      return checkTransformerInterfaceCompatibilityWithInference(
        { input: rowEntityUuid ?? "any", output: expectedOutputType },
        declaredForCheck,
        inferredOutputType,
      );
    },
    [transformerType, rowEntityUuid, expectedOutputType, inferredOutputType],
  );

  const givenInputMlSchema: JzodElement = rowMlSchema ?? liftInputOutputTypeToMlSchema(givenInputType, entityMlSchemas);
  const expectedOutputMlSchema = liftInputOutputTypeToMlSchema(expectedOutputType, entityMlSchemas);
  const mlSchemaCompatibility = useMemo(
    () =>
      checkTransformerMlSchemaCompatibility(
        elementTransformer,
        { input: givenInputMlSchema, output: expectedOutputMlSchema },
        rowMlSchema ? { row: rowMlSchema } : {},
        undefined,
        entityMlSchemas,
      ),
    [elementTransformer, givenInputMlSchema, expectedOutputMlSchema, rowMlSchema, entityMlSchemas],
  );

  const transformerInadequate = mlSchemaMode
    ? mlSchemaCompatibility.status === "incompatible"
    : interfaceCompatibility.status === "incompatible";
  const interfaceMismatchTitle = mlSchemaMode
    ? mlSchemaCompatibility.nodes
        .filter((node) => node.failures.length > 0)
        .map((node) => formatMlSchemaNodeMismatch(node, mlSchemaNameResolver))
        .join("; ") || undefined
    : interfaceCompatibility.status === "incompatible"
      ? interfaceCompatibility.failures
          .map((failure) => {
            const actualLabel =
              failure.source === "inferred" ? "inferred actual" : "transformer declares";
            return `${failure.direction}: expected ${safeStringify(failure.given)}, ${actualLabel} ${safeStringify(failure.declared)}`;
          })
          .join("; ")
      : undefined;

  const compatibilityWarnings = useMemo(
    () =>
      mlSchemaMode
        ? mlSchemaCompatibility.nodes
            .filter((node) => node.failures.length > 0)
            .map((node) => ({
              path: node.path,
              title: formatMlSchemaNodeMismatch(node, mlSchemaNameResolver),
            }))
        : undefined,
    [mlSchemaMode, mlSchemaCompatibility, mlSchemaNameResolver],
  );
  const mlSchemaTypeAnnotations = useMemo(
    () =>
      mlSchemaMode
        ? mlSchemaCompatibility.nodes.map((node) => ({
            path: node.path,
            label: `in: ${formatMlSchemaTypeLabel(node.givenInput, { schemaNameResolver: mlSchemaNameResolver })} → out: ${formatMlSchemaTypeLabel(node.actualOutput, { schemaNameResolver: mlSchemaNameResolver })}`,
          }))
        : undefined,
    [mlSchemaMode, mlSchemaCompatibility, mlSchemaNameResolver],
  );

  const environmentBindings = useMemo(
    () =>
      collectTransformerEnvironmentBindings(elementTransformer, {
        contextNames: ["row", defaultTransformerInput],
        parameterNames: Object.keys(transformerParams ?? {}),
      }),
    [elementTransformer, transformerParams],
  );
  const environmentAnnotations = useMemo(
    () =>
      environmentBindings.map((binding) => ({
        path: binding.path,
        label: formatTransformerEnvironmentLabel(binding),
        contextNames: binding.contextNames,
        parameterNames: binding.parameterNames,
        transformerType: binding.transformerType,
      })),
    [environmentBindings],
  );
  const rootMlSchemaNode = useMemo(
    () => mlSchemaCompatibility.nodes.find((node) => node.path.length === 0),
    [mlSchemaCompatibility],
  );
  const rootEnvironmentBinding = useMemo(
    () => environmentBindings.find((binding) => binding.path.length === 0),
    [environmentBindings],
  );
  const inadequatePathKeys = useMemo(
    () =>
      mlSchemaMode
        ? mlSchemaCompatibility.nodes
            .filter((node) => node.failures.length > 0)
            .map((node) => (node.path.length === 0 ? "root" : node.path.map(String).join(".")))
        : [],
    [mlSchemaMode, mlSchemaCompatibility],
  );

  const transformationResult = useMemo(
    () => applyTransformerToListRows(instancesToDisplay, elementTransformer, transformerParams),
    [instancesToDisplay, elementTransformer, transformerParams],
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
        <ThemedFlexRow align="center" wrap gap="8px">
          <ThemedTitle>
            {sectionLabel ? `${sectionLabel} — transformer` : "List transformer"}
          </ThemedTitle>
          {mlSchemaMode && rootMlSchemaNode ? (
            <TransformerTitleSignature
              inLabel={formatMlSchemaTypeLabel(rootMlSchemaNode.givenInput, {
                schemaNameResolver: mlSchemaNameResolver,
              })}
              outLabel={formatMlSchemaTypeLabel(rootMlSchemaNode.actualOutput, {
                schemaNameResolver: mlSchemaNameResolver,
              })}
              inadequate={rootMlSchemaNode.failures.length > 0}
              data-testid="list-transformer-mlschema-node-root"
              title={
                rootMlSchemaNode.failures.length > 0
                  ? formatMlSchemaNodeMismatch(rootMlSchemaNode, mlSchemaNameResolver)
                  : `${formatMlSchemaTypeLabel(rootMlSchemaNode.givenInput, {
                      schemaNameResolver: mlSchemaNameResolver,
                    })} → ${formatMlSchemaTypeLabel(rootMlSchemaNode.actualOutput, {
                      schemaNameResolver: mlSchemaNameResolver,
                    })}`
              }
            />
          ) : null}
        </ThemedFlexRow>
        <ThemedFlexRow align="center" wrap gap="8px">
          {rootEnvironmentBinding ? (
            <TransformerNamedBindings
              kind="context"
              names={rootEnvironmentBinding.contextNames}
              title={formatTransformerEnvironmentLabel(rootEnvironmentBinding)}
              data-testid="list-transformer-environment-node-root"
            />
          ) : null}
          <TransformerNamedBindings
            kind="parameters"
            names={Object.keys(transformerParams ?? {})}
            data-testid="list-transformer-parameters"
          />
        </ThemedFlexRow>
      </ThemedHeaderSection>

      <ThemedFlexRow align="center" wrap gap="16px" style={{ margin: "4px 0" }}>
        <ThemedLabeledEditor
          labelElement={<ThemedLabel>Given input type:</ThemedLabel>}
          editor={
            rowEntityUuid ? (
              <span data-testid="list-transformer-given-input-type">
                <ReportInstanceLink
                  label={givenInputTypeLabel}
                  application={application}
                  deploymentUuid={deploymentUuid}
                  applicationSection={getApplicationSection(application, entityEntity.uuid)}
                  reportUuid={reportEntityDetails.uuid}
                  instanceUuid={rowEntityUuid}
                />
              </span>
            ) : (
              <span
                data-testid="list-transformer-given-input-type"
                title={typeof givenInputType === "string" ? givenInputType : safeStringify(givenInputType)}
              >
                <ThemedText>{givenInputTypeLabel}</ThemedText>
              </span>
            )
          }
        />
        <ThemedLabeledEditor
          labelElement={<ThemedLabel>Expected output type:</ThemedLabel>}
          editor={
            <ThemedSelectWithPortal
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
              minWidth="160px"
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
            </ThemedSelectWithPortal>
          }
        />
        <ThemedLabeledEditor
          labelElement={<ThemedLabel>mlSchema types:</ThemedLabel>}
          editor={
            <ThemedSwitch
              id="list-transformer-mlschema-switch"
              name="list-transformer-mlschema-switch"
              inputProps={{
                "data-testid": "list-transformer-mlschema-switch",
              } as React.InputHTMLAttributes<HTMLInputElement>}
              checked={mlSchemaMode}
              onChange={(event) => setMlSchemaMode(event.target.checked)}
              size="small"
            />
          }
        />
      </ThemedFlexRow>
      <div
        data-testid="list-transformer-editor"
        data-transformer-inadequate={transformerInadequate ? "true" : "false"}
        data-inadequate-paths={inadequatePathKeys.join(" ")}
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
          compatibilityWarnings={compatibilityWarnings}
          showMlSchemaTypes={mlSchemaMode}
          mlSchemaTypeAnnotations={mlSchemaTypeAnnotations}
          environmentAnnotations={environmentAnnotations}
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
