import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

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

/**
 * Report inputReportSection renderer.
 *
 * When the input schema includes an `application` uuid field, changing it
 * navigates to the same report under that application so extractor filters
 * that use getFromParameters("applicationSelector") refresh the list.
 */
export function ReportInputSection(props: {
  label: string;
  inputPrefix: string;
  inputMLSchema: JzodObject;
  application: Uuid;
  applicationDeploymentMap?: ApplicationDeploymentMap;
  deploymentUuid: Uuid;
  applicationSection: ApplicationSection;
  pageParams: Record<string, any>;
}) {
  const navigate = useNavigate();
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

  return (
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
  );
}
