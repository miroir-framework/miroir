import { useState, type ReactNode } from "react";
import type { Params } from "react-router-dom";

import type { ApplicationSection, Uuid } from "miroir-core";

import { REPORT_URL_KNOWN_PARAM_KEYS, type ReportUrlParamKeys } from "../../../../constants.js";
import { reportUrl } from "../../navigation.js";
import {
  ThemedDialog,
  ThemedDialogActions,
  ThemedDialogContent,
  ThemedDialogTitle,
  ThemedSpan,
  ThemedStyledButton,
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

export type CallerReportPageParams = Params<ReportUrlParamKeys> | Record<string, unknown> | undefined;

export function extraReportPageParams(source: CallerReportPageParams): Record<string, string> {
  if (!source) {
    return {};
  }
  const extra: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (key === "page" || REPORT_URL_KNOWN_PARAM_KEYS.has(key)) {
      continue;
    }
    if (value === undefined || value === null || value === "") {
      continue;
    }
    if (typeof value === "object") {
      continue;
    }
    extra[key] = String(value);
  }
  return extra;
}

export function resolveOpenReportPageParams(
  spec: OpenReportSpec,
  pageContext: OpenReportPageContext,
  instanceUuid?: string,
  callerPageParams?: CallerReportPageParams,
): Params<ReportUrlParamKeys> {
  return {
    ...extraReportPageParams(callerPageParams),
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
  callerPageParams?: CallerReportPageParams,
): string {
  const pageParams = resolveOpenReportPageParams(spec, pageContext, instanceUuid, callerPageParams);
  const href = reportUrl(
    pageParams.application ?? "",
    pageParams.deploymentUuid ?? "",
    pageParams.applicationSection ?? "",
    pageParams.reportUuid ?? "",
    pageParams.instanceUuid,
  );
  const extraQuery = Object.entries(extraReportPageParams(pageParams))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  return extraQuery ? `${href}&${extraQuery}` : href;
}

export function OpenReportModal(props: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!props.open && confirmOpen) {
    setConfirmOpen(false);
  }

  if (!props.open) {
    return null;
  }

  const handleRequestClose = () => {
    setConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    props.onClose();
  };

  return (
    <>
      <ThemedDialog
        open={props.open}
        onClose={handleRequestClose}
        aria-label={props.title ?? "Open report"}
        data-testid="open-report-dialog"
        maxWidth="lg"
        fullWidth
      >
        {props.title ? <ThemedDialogTitle>{props.title}</ThemedDialogTitle> : null}
        <ThemedDialogContent>{props.children}</ThemedDialogContent>
      </ThemedDialog>
      {confirmOpen ? (
        <ThemedDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          aria-label="Cancel this process"
          data-testid="open-report-cancel-confirm"
        >
          <ThemedDialogTitle>Cancel this process?</ThemedDialogTitle>
          <ThemedDialogContent>
            <ThemedSpan>
              The values you entered will be discarded. Mid-step writes already saved are not undone.
            </ThemedSpan>
          </ThemedDialogContent>
          <ThemedDialogActions>
            <ThemedStyledButton
              type="button"
              variant="outlined"
              onClick={() => setConfirmOpen(false)}
            >
              Keep editing
            </ThemedStyledButton>
            <ThemedStyledButton
              type="button"
              variant="contained"
              color="error"
              onClick={handleConfirmClose}
            >
              Confirm cancel
            </ThemedStyledButton>
          </ThemedDialogActions>
        </ThemedDialog>
      ) : null}
    </>
  );
}
