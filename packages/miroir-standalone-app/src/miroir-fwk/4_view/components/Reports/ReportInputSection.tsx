import { useMemo } from "react";
import { useFormikContext } from "formik";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  noValue,
  type ApplicationDeploymentMap,
  type ApplicationSection,
  type JzodObject,
  type Uuid,
} from "miroir-core";

import { TypedValueObjectEditor } from "./TypedValueObjectEditor.js";
import {
  buildReportApplicationSwitchUrl,
} from "./reportInputApplication.js";
import { reportUrl } from "../../navigation.js";
import { ThemedStyledButton } from "../Themes/index.js";

/**
 * Report inputReportSection renderer.
 *
 * When the input schema includes an `application` uuid field, changing it
 * navigates to the same report under that application so extractor filters
 * that use getFromParameters("applicationSelector") refresh the list.
 *
 * When the section definition declares `urlParamFields`, an OK button is
 * rendered: clicking it writes the named input values into the report URL
 * search params, which makes the page re-run the report query with the new
 * pageParams (e.g. playlistId, #267).
 */
export function ReportInputSection(props: {
  label: string;
  inputPrefix: string;
  inputMLSchema: JzodObject;
  urlParamFields?: string[];
  application: Uuid;
  applicationDeploymentMap?: ApplicationDeploymentMap;
  deploymentUuid: Uuid;
  applicationSection: ApplicationSection;
  pageParams: Record<string, any>;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formik = useFormikContext<Record<string, any>>();
  const applicationDeploymentMap = props.applicationDeploymentMap ?? {};

  const onChangeVector = useMemo(() => {
    const schemaDef = props.inputMLSchema?.definition as
      | Record<string, unknown>
      | undefined;
    if (!schemaDef || !("application" in schemaDef)) {
      return undefined;
    }
    return {
      application: (value: any) => {
        if (!value || value === noValue.uuid || value === props.application) {
          return;
        }
        const nextUrl = buildReportApplicationSwitchUrl({
          application: value,
          applicationDeploymentMap,
          reportUuid: props.pageParams?.reportUuid ?? "",
          instanceUuid: props.pageParams?.instanceUuid,
          reportUrl,
        });
        if (nextUrl) {
          navigate(nextUrl);
        }
      },
    };
  }, [
    props.inputMLSchema,
    props.application,
    props.pageParams?.reportUuid,
    props.pageParams?.instanceUuid,
    applicationDeploymentMap,
    navigate,
  ]);

  const onApplyUrlParams = () => {
    const bucket = formik.values?.[props.inputPrefix] ?? {};
    const next = new URLSearchParams(searchParams);
    for (const field of props.urlParamFields ?? []) {
      const value = bucket[field];
      if (value === undefined || value === null || value === "") {
        next.delete(field);
      } else {
        next.set(field, String(value));
      }
    }
    navigate("/?" + next.toString());
  };

  return (
    <div>
      <TypedValueObjectEditor
        labelElement={<h2>{props.label}</h2>}
        formValueMLSchema={props.inputMLSchema}
        formikValuePathAsString={props.inputPrefix}
        application={props.application}
        applicationDeploymentMap={applicationDeploymentMap}
        deploymentUuid={props.deploymentUuid}
        applicationSection={props.applicationSection}
        formLabel={props.label}
        zoomInPath=""
        maxRenderDepth={Infinity}
        displaySubmitButton="noDisplay"
        useActionButton={false}
        valueObjectEditMode="create"
        onChangeVector={onChangeVector}
      />
      {props.urlParamFields && props.urlParamFields.length > 0 ? (
        <ThemedStyledButton
          type="button"
          variant="contained"
          style={{ maxWidth: "300px" }}
          onClick={onApplyUrlParams}
          title="Apply"
        >
          OK
        </ThemedStyledButton>
      ) : null}
    </div>
  );
}
