import { Formik, useFormikContext } from "formik";
import React, { useMemo } from "react";

import {
  safeStringify,
  type ApplicationDeploymentMap,
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
}

const ListTransformerResultViewer: React.FC<{
  transformationResult: TransformerReturnType<any>;
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  deploymentUuid: Uuid;
}> = ({ transformationResult, application, applicationDeploymentMap, deploymentUuid }) => {
  const initialValueObject = useMemo(
    () => ({ transformationResult }),
    [safeStringify(transformationResult)],
  );

  return (
    <TypedValueObjectEditorWithFormik
      labelElement={<div>Transformed rows:</div>}
      initialValueObject={initialValueObject}
      formValueMLSchema={{ type: "any" } as JzodElement}
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
}) => {
  const formik = useFormikContext<Record<string, any>>();

  const transformationResult = useMemo(
    () =>
      applyTransformerToListRows(
        instancesToDisplay,
        formik.values[TRANSFORMER_INPUT_FORMIK_KEY] ?? DEFAULT_ROW_IDENTITY_TRANSFORMER,
      ),
    [instancesToDisplay, formik.values[TRANSFORMER_INPUT_FORMIK_KEY]],
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

      {transformationFailure ? (
        <ThemedOnScreenHelper label="transformer result error" data={transformationFailure} />
      ) : showResultEditor ? (
        <div data-testid="list-transformer-result">
          <ListTransformerResultViewer
            transformationResult={transformationResult}
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
