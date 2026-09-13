import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { Params } from "react-router-dom";

import {
  Action2Error,
  LoggerInterface,
  MiroirLoggerFactory,
  jzodTypeCheck,
  type ApplicationDeploymentMap,
  type CompositeActionSequenceTemplate,
  type DomainControllerInterface,
  type JzodObject,
  type MiroirModelEnvironment,
  type Report,
  type ReportSection,
  type Uuid,
} from "miroir-core";
import { useDomainControllerService, useMiroirContextService } from "miroir-react";

import { packageName } from "../../../../constants.js";
import type { ReportUrlParamKeys } from "../../../../constants.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { cleanLevel } from "../../constants.js";
import {
  ThemedBox,
  ThemedDialog,
  ThemedDialogActions,
  ThemedDialogContent,
  ThemedDialogTitle,
  ThemedSpan,
  ThemedStyledButton,
} from "../Themes/index.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(
  packageName,
  cleanLevel,
  "MultistepReportHost",
);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI").then((logger: LoggerInterface) => {
  log = logger;
});

export type RunMultistepFinishParams = {
  sequence: CompositeActionSequenceTemplate;
  stepBag: Record<string, any>;
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  modelEnvironment: MiroirModelEnvironment;
  domainController: DomainControllerInterface;
};

export async function runMultistepFinish({
  sequence,
  stepBag,
  application,
  applicationDeploymentMap,
  modelEnvironment,
  domainController,
}: RunMultistepFinishParams) {
  log.info(
    "runMultistepFinish",
    application,
    "stepBag keys",
    Object.keys(stepBag),
    "sequence",
    sequence,
  );
  return domainController.handleCompositeActionTemplate(
    sequence,
    applicationDeploymentMap,
    modelEnvironment,
    stepBag,
  );
}

export type MultistepReportHostContextValue = {
  stepIndex: number;
  stepBag: Record<string, any>;
  isViewerPaging: boolean;
  reportSectionPath: (string | number)[];
  captureStepBagFromFormikValues: (values: Record<string, any>) => void;
  mergeStepBagFromFormikValues: (values: Record<string, any>) => void;
};

const MultistepReportHostContext = createContext<MultistepReportHostContextValue | undefined>(
  undefined,
);

export function useOptionalMultistepReportHost(): MultistepReportHostContextValue | undefined {
  return useContext(MultistepReportHostContext);
}

export function getMultistepChildSections(report: Report | undefined): ReportSection[] {
  const section = report?.definition?.section;
  if (!section) {
    return [];
  }
  if (section.type === "list" && Array.isArray(section.definition)) {
    return section.definition;
  }
  return [section];
}

export function collectInputPrefixes(section: ReportSection | undefined): string[] {
  if (!section) {
    return [];
  }
  if (section.type === "list" && Array.isArray(section.definition)) {
    return section.definition.flatMap(collectInputPrefixes);
  }
  if (section.type === "grid" && Array.isArray(section.definition)) {
    return section.definition.flatMap((row) =>
      Array.isArray(row) ? row.flatMap(collectInputPrefixes) : [],
    );
  }
  if (section.type === "inputReportSection") {
    const prefix = section.definition?.inputPrefix;
    return typeof prefix === "string" && prefix.length > 0 ? [prefix] : [];
  }
  return [];
}

export function extractStepBagFromFormikValues(
  values: Record<string, any> | undefined,
  prefixes: string[],
): Record<string, any> {
  const bag: Record<string, any> = {};
  if (!values) {
    return bag;
  }
  for (const prefix of prefixes) {
    if (values[prefix] !== undefined) {
      bag[prefix] = values[prefix];
    }
  }
  return bag;
}

function bagsEqual(left: Record<string, any>, right: Record<string, any>): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function requiredFieldIsEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

export function currentStepAllowsNext(
  section: ReportSection | undefined,
  stepBag: Record<string, any>,
  modelEnvironment: MiroirModelEnvironment,
): boolean {
  if (!section) {
    return false;
  }
  if (section.type === "inputReportSection") {
    const prefix = section.definition?.inputPrefix;
    const schema = section.definition?.inputMLSchema as JzodObject | undefined;
    const value =
      (typeof prefix === "string" ? stepBag[prefix] : undefined) ?? {};
    if (!schema || schema.type !== "object" || !schema.definition) {
      return true;
    }
    for (const [fieldName, fieldSchema] of Object.entries(schema.definition)) {
      if ((fieldSchema as { optional?: boolean })?.optional === true) {
        continue;
      }
      if (requiredFieldIsEmpty((value as Record<string, unknown>)[fieldName])) {
        return false;
      }
    }
    const checked = jzodTypeCheck(
      schema,
      value,
      [],
      [],
      modelEnvironment,
      {},
    );
    return checked.status === "ok";
  }
  if (section.type === "objectInstanceReportSection") {
    // Slice 4 hoists instance editors; until then treat as gated only when a bag key exists.
    return true;
  }
  return true;
}

export type MultistepReportHostProps = {
  report: Report;
  pageParams: Params<ReportUrlParamKeys>;
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  children: ReactNode;
};

export function MultistepReportHost(props: MultistepReportHostProps) {
  const context = useMiroirContextService();
  const domainController = useDomainControllerService();
  const modelEnvironment = useCurrentModelEnvironment(
    props.application,
    props.applicationDeploymentMap,
  );
  const generalEditMode = context.viewParams.generalEditMode;
  const steps = useMemo(() => getMultistepChildSections(props.report), [props.report]);
  const inputPrefixes = useMemo(
    () => collectInputPrefixes(props.report.definition?.section),
    [props.report],
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [stepBag, setStepBag] = useState<Record<string, any>>({});
  const stepBagRef = useRef<Record<string, any>>(stepBag);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [finishError, setFinishError] = useState<string | undefined>(undefined);

  const captureStepBagFromFormikValues = useCallback(
    (values: Record<string, any>) => {
      stepBagRef.current = extractStepBagFromFormikValues(values, inputPrefixes);
    },
    [inputPrefixes],
  );

  const isViewerPaging = !generalEditMode;
  const lastIndex = Math.max(0, steps.length - 1);
  const currentStep = steps[stepIndex];
  const currentLabel =
    (currentStep as { definition?: { label?: string } } | undefined)?.definition?.label ??
    props.report.defaultLabel ??
    props.report.name;

  const reportSectionPath = useMemo<(string | number)[]>(
    () =>
      isViewerPaging
        ? ["definition", "section", "definition", stepIndex]
        : ["definition", "section"],
    [isViewerPaging, stepIndex],
  );

  const mergeStepBagFromFormikValues = useCallback(
    (values: Record<string, any>) => {
      const nextBag = extractStepBagFromFormikValues(values, inputPrefixes);
      stepBagRef.current = nextBag;
      setStepBag((previous) => (bagsEqual(previous, nextBag) ? previous : nextBag));
    },
    [inputPrefixes],
  );

  const hostValue = useMemo<MultistepReportHostContextValue>(
    () => ({
      stepIndex,
      stepBag,
      isViewerPaging,
      reportSectionPath,
      captureStepBagFromFormikValues,
      mergeStepBagFromFormikValues,
    }),
    [
      stepIndex,
      stepBag,
      isViewerPaging,
      reportSectionPath,
      captureStepBagFromFormikValues,
      mergeStepBagFromFormikValues,
    ],
  );

  const handleBack = useCallback(() => {
    setFinishError(undefined);
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  const handleNext = useCallback(() => {
    const liveBag = stepBagRef.current;
    if (!currentStepAllowsNext(currentStep, liveBag, modelEnvironment)) {
      return;
    }
    setStepBag(liveBag);
    setFinishError(undefined);
    setStepIndex((current) => Math.min(lastIndex, current + 1));
  }, [currentStep, lastIndex, modelEnvironment]);

  const handleFinish = useCallback(async () => {
    const sequence = props.report.definition?.compositeActionSequence;
    if (!sequence) {
      setFinishError("This report has no Finish sequence.");
      return;
    }
    const liveBag = stepBagRef.current;
    setStepBag(liveBag);
    const result = await runMultistepFinish({
      sequence,
      stepBag: liveBag,
      application: props.application,
      applicationDeploymentMap: props.applicationDeploymentMap,
      modelEnvironment,
      domainController,
    });
    if (result instanceof Action2Error) {
      setFinishError(result.errorMessage ?? "Finish failed.");
      return;
    }
    setDismissed(true);
  }, [
    domainController,
    modelEnvironment,
    props.application,
    props.applicationDeploymentMap,
    props.report.definition?.compositeActionSequence,
  ]);

  const handleConfirmCancel = useCallback(() => {
    setCancelConfirmOpen(false);
    setStepBag({});
    setDismissed(true);
  }, []);

  if (dismissed) {
    return null;
  }

  return (
    <MultistepReportHostContext.Provider value={hostValue}>
      <div data-testid="multistep-report-host">
        {isViewerPaging ? (
          <ThemedBox data-testid="multistep-step-label">
            <ThemedSpan>{currentLabel}</ThemedSpan>
          </ThemedBox>
        ) : null}
        {props.children}
        {isViewerPaging ? (
          <ThemedBox>
            {finishError ? (
              <ThemedSpan data-testid="multistep-finish-error" role="alert">
                {finishError}
              </ThemedSpan>
            ) : null}
            <ThemedStyledButton
              type="button"
              variant="outlined"
              disabled={stepIndex === 0}
              onClick={handleBack}
            >
              Back
            </ThemedStyledButton>
            {stepIndex < lastIndex ? (
              <ThemedStyledButton type="button" variant="contained" onClick={handleNext}>
                Next
              </ThemedStyledButton>
            ) : (
              <ThemedStyledButton type="button" variant="contained" onClick={handleFinish}>
                Finish
              </ThemedStyledButton>
            )}
            <ThemedStyledButton
              type="button"
              variant="outlined"
              color="secondary"
              onClick={() => setCancelConfirmOpen(true)}
            >
              Cancel
            </ThemedStyledButton>
          </ThemedBox>
        ) : null}
        <ThemedDialog
          open={cancelConfirmOpen}
          onClose={() => setCancelConfirmOpen(false)}
          aria-label="Cancel this process"
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
              onClick={() => setCancelConfirmOpen(false)}
            >
              Keep editing
            </ThemedStyledButton>
            <ThemedStyledButton
              type="button"
              variant="contained"
              color="error"
              onClick={handleConfirmCancel}
            >
              Confirm cancel
            </ThemedStyledButton>
          </ThemedDialogActions>
        </ThemedDialog>
      </div>
    </MultistepReportHostContext.Provider>
  );
}
