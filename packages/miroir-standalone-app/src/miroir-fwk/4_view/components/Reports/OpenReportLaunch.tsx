import type { ReactNode } from "react";
import type { Params } from "react-router-dom";

import type { ApplicationSection, Uuid } from "miroir-core";

import type { ReportUrlParamKeys } from "../../../../constants.js";
import { reportUrl } from "../../navigation.js";
import {
  ThemedDialog,
  ThemedDialogContent,
  ThemedDialogTitle,
} from "../Themes/index.js";

export type OpenReportSpec = {
  label?: string;
  reportUuid: string;
  openAs: "modal" | "route";
  application?: string;
  applicationSection?: "data" | "model" | "modelVersion";
  deploymentUuid?: string;
};

export type OpenReportPageContext = {
  application: Uuid;
  applicationSection: ApplicationSection | string;
  deploymentUuid: Uuid;
};

export function resolveOpenReportPageParams(
  spec: OpenReportSpec,
  pageContext: OpenReportPageContext,
  instanceUuid?: string,
): Params<ReportUrlParamKeys> {
  return {
    application: spec.application ?? pageContext.application,
    applicationSection: spec.applicationSection ?? pageContext.applicationSection,
    deploymentUuid: spec.deploymentUuid ?? pageContext.deploymentUuid,
    reportUuid: spec.reportUuid,
    instanceUuid,
  };
}

export function openReportHref(
  spec: OpenReportSpec,
  pageContext: OpenReportPageContext,
  instanceUuid?: string,
): string {
  const pageParams = resolveOpenReportPageParams(spec, pageContext, instanceUuid);
  return reportUrl(
    pageParams.application ?? "",
    pageParams.deploymentUuid ?? "",
    pageParams.applicationSection ?? "",
    pageParams.reportUuid ?? "",
    pageParams.instanceUuid,
  );
}

export function OpenReportModal(props: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  if (!props.open) {
    return null;
  }
  return (
    <ThemedDialog
      open={props.open}
      onClose={props.onClose}
      aria-label={props.title ?? "Open report"}
      data-testid="open-report-dialog"
      maxWidth="lg"
      fullWidth
    >
      {props.title ? <ThemedDialogTitle>{props.title}</ThemedDialogTitle> : null}
      <ThemedDialogContent>{props.children}</ThemedDialogContent>
    </ThemedDialog>
  );
}
