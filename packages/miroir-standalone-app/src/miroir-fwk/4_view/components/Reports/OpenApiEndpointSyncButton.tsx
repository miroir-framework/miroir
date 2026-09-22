import { useFormikContext } from "formik";

import {
  ACTION_OK,
  Action2Error,
  TransformerFailure,
  buildOpenApiEndpointSyncComposite,
  extractSyncedEndpointFromComposite,
  MiroirLoggerFactory,
  type Action2VoidReturnType,
  type ApplicationDeploymentMap,
  type CompositeActionSequence,
  type LoggerInterface,
  type MiroirModelEnvironment,
} from "miroir-core";
import { useDomainControllerService } from "miroir-react";

import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { ActionButtonWithSnackbar } from "../Page/ActionButtonWithSnackbar.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(
  packageName,
  cleanLevel,
  "OpenApiEndpointSyncButton",
);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI").then((logger: LoggerInterface) => {
  log = logger;
});

export interface OpenApiEndpointSyncButtonProps {
  endpoint?: unknown;
  formikValuePathAsString: string;
  applicationDeploymentMap: ApplicationDeploymentMap;
  modelEnvironment: MiroirModelEnvironment;
}

function looksLikeOpenApiEndpoint(endpoint: unknown): boolean {
  const document = (endpoint as { definition?: { externalService?: { openApiDocument?: unknown } } })
    ?.definition?.externalService?.openApiDocument;
  if (typeof document === "string") {
    return document.trim().length > 0;
  }
  return document !== null && typeof document === "object" && !Array.isArray(document);
}

function firstOpenApiEndpoint(...candidates: unknown[]): unknown | undefined {
  return candidates.find((candidate) => looksLikeOpenApiEndpoint(candidate));
}

export const OpenApiEndpointSyncButton = (props: OpenApiEndpointSyncButtonProps) => {
  const formik = useFormikContext<Record<string, any>>();
  const domainController = useDomainControllerService();
  const formikEndpoint = formik.values?.[props.formikValuePathAsString];
  const endpoint = firstOpenApiEndpoint(
    props.endpoint,
    formikEndpoint,
    formik.values?.elementToDisplay,
  );

  if (!endpoint) {
    return null;
  }

  const onAction = async (): Promise<Action2VoidReturnType> => {
    const current =
      firstOpenApiEndpoint(
        formik.values?.[props.formikValuePathAsString],
        props.endpoint,
        formik.values?.elementToDisplay,
      ) ?? endpoint;
    const composite = buildOpenApiEndpointSyncComposite(current as any, props.modelEnvironment);
    if (composite instanceof TransformerFailure) {
      log.info("OpenAPI Endpoint sync transformer failed", composite.failureMessage);
      return new Action2Error(
        "FailedToHandleAction",
        composite.failureMessage ?? "OpenAPI Endpoint sync failed",
      );
    }
    const result = await domainController.handleActionFromUI(
      composite as CompositeActionSequence,
      props.applicationDeploymentMap,
      props.modelEnvironment,
    );
    if (result.status !== "ok") {
      log.info("OpenAPI Endpoint sync failed", result);
      const errorMessage =
        "errorMessage" in result && typeof result.errorMessage === "string"
          ? result.errorMessage
          : "OpenAPI Endpoint sync failed";
      return result instanceof Action2Error
        ? result
        : new Action2Error("FailedToHandleAction", errorMessage);
    }
    const updated = extractSyncedEndpointFromComposite(composite);
    if (updated !== undefined) {
      formik.setFieldValue(props.formikValuePathAsString, updated);
    }
    return ACTION_OK;
  };

  return (
    <span title="Synchronize operations from the OpenAPI document">
      <ActionButtonWithSnackbar
        type="button"
        label="Sync"
        actionName="OpenAPI Endpoint sync"
        successMessage="Endpoint definition synchronized with OpenAPI."
        onAction={onAction}
      />
    </span>
  );
};
