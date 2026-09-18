import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, type Params } from "react-router-dom";

import {
  Action2Error,
  LoggerInterface,
  MiroirLoggerFactory,
  entityWithResolvedMLSchema,
  jzodTypeCheck,
  type ApplicationDeploymentMap,
  type CompositeActionSequenceTemplate,
  type DomainControllerInterface,
  type Entity,
  type JzodObject,
  type MiroirModelEnvironment,
  type Report,
  type ReportSection,
  type Uuid,
} from "miroir-core";
import { useDomainControllerService } from "miroir-react";

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

export function collectStepBagKeys(
  section: ReportSection | undefined,
  path: (string | number)[] = ["definition", "section"],
): string[] {
  if (!section) {
    return [];
  }
  if (section.type === "list" && Array.isArray(section.definition)) {
    return section.definition.flatMap((child, index) =>
      collectStepBagKeys(child, path.concat("definition", index)),
    );
  }
  if (section.type === "grid" && Array.isArray(section.definition)) {
    return section.definition.flatMap((row, rowIndex) =>
      Array.isArray(row)
        ? row.flatMap((cell, colIndex) =>
            collectStepBagKeys(cell, path.concat("definition", rowIndex, colIndex)),
          )
        : [],
    );
  }
  if (section.type === "inputReportSection") {
    return [inputReportSectionBagKey(section, path)];
  }
  if (section.type === "objectInstanceReportSection") {
    return [path.join("_")];
  }
  return [];
}

export function collectInputPrefixes(section: ReportSection | undefined): string[] {
  return collectStepBagKeys(section);
}

export function inputReportSectionBagKey(
  section: ReportSection,
  path: (string | number)[],
): string {
  const prefix = section.type === "inputReportSection" ? section.definition?.inputPrefix : undefined;
  if (typeof prefix === "string" && prefix.length > 0) {
    return prefix;
  }
  return `${path.join("_")}_inputMLSchema`;
}

export function isMultistepListRoot(section: ReportSection | undefined): boolean {
  return section?.type === "list" && Array.isArray(section.definition);
}

export function multistepViewerReportSectionPath(
  rootSection: ReportSection | undefined,
  stepIndex: number,
  isViewerPaging: boolean,
): (string | number)[] {
  if (!isViewerPaging) {
    return ["definition", "section"];
  }
  if (isMultistepListRoot(rootSection)) {
    return ["definition", "section", "definition", stepIndex];
  }
  return ["definition", "section"];
}

export function allGatedStepsAllowFinish(
  steps: ReportSection[],
  stepBag: Record<string, any>,
  modelEnvironment: MiroirModelEnvironment,
  listRoot: boolean,
): boolean {
  if (steps.length === 0) {
    return false;
  }
  return steps.every((section, index) => {
    const path = listRoot
      ? (["definition", "section", "definition", index] as (string | number)[])
      : (["definition", "section"] as (string | number)[]);
    return currentStepAllowsNext(
      section,
      stepBag,
      modelEnvironment,
      path.join("_"),
      inputReportSectionBagKey(section, path),
    );
  });
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

function objectSchemaAllowsNext(
  schema: JzodObject | undefined,
  value: Record<string, unknown>,
  modelEnvironment: MiroirModelEnvironment,
): boolean {
  if (!schema || schema.type !== "object" || !schema.definition) {
    return true;
  }
  for (const [fieldName, fieldSchema] of Object.entries(schema.definition)) {
    if ((fieldSchema as { optional?: boolean })?.optional === true) {
      continue;
    }
    if (requiredFieldIsEmpty(value[fieldName])) {
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

export function currentStepAllowsNext(
  section: ReportSection | undefined,
  stepBag: Record<string, any>,
  modelEnvironment: MiroirModelEnvironment,
  instanceBagKey?: string,
  inputBagKey?: string,
): boolean {
  if (!section) {
    return false;
  }
  if (section.type === "inputReportSection") {
    const prefix = section.definition?.inputPrefix;
    const schema = section.definition?.inputMLSchema as JzodObject | undefined;
    const key =
      inputBagKey ??
      (typeof prefix === "string" && prefix.length > 0 ? prefix : undefined);
    const value = (typeof key === "string" ? stepBag[key] : undefined) ?? {};
    return objectSchemaAllowsNext(schema, value as Record<string, unknown>, modelEnvironment);
  }
  if (section.type === "objectInstanceReportSection") {
    const value =
      (typeof instanceBagKey === "string" ? stepBag[instanceBagKey] : undefined) ?? {};
    const entity = (modelEnvironment.currentModel?.entities ?? []).find(
      (candidate: Entity) => candidate.uuid === section.definition?.parentUuid,
    );
    if (!entity) {
      return true;
    }
    const schema = entityWithResolvedMLSchema(entity).mlSchema as JzodObject | undefined;
    return objectSchemaAllowsNext(schema, value as Record<string, unknown>, modelEnvironment);
  }
  return true;
}

export type MultistepReportHostProps = {
  report: Report;
  pageParams: Params<ReportUrlParamKeys>;
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  children: ReactNode;
  onDismissed?: () => void;
};

export function MultistepReportHost(props: MultistepReportHostProps) {
  const domainController = useDomainControllerService();
  const navigate = useNavigate();
  const modelEnvironment = useCurrentModelEnvironment(
    props.application,
    props.applicationDeploymentMap,
  );
  const steps = useMemo(() => getMultistepChildSections(props.report), [props.report]);
  const rootSection = props.report.definition?.section;
  const listRoot = isMultistepListRoot(rootSection);
  const stepBagKeys = useMemo(
    () => collectStepBagKeys(rootSection),
    [rootSection],
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [stepBag, setStepBag] = useState<Record<string, any>>({});
  const stepBagRef = useRef<Record<string, any>>(stepBag);
  const finishInFlightRef = useRef(false);
  const [finishInFlight, setFinishInFlight] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [finishError, setFinishError] = useState<string | undefined>(undefined);

  const captureStepBagFromFormikValues = useCallback(
    (values: Record<string, any>) => {
      stepBagRef.current = extractStepBagFromFormikValues(values, stepBagKeys);
    },
    [stepBagKeys],
  );

  /** Always page in the host; Report definition editing uses InlineReportEditor above the preview. */
  const isViewerPaging = true;
  const lastIndex = Math.max(0, steps.length - 1);
  const currentStep = steps[stepIndex];
  const currentLabel =
    (currentStep as { definition?: { label?: string } } | undefined)?.definition?.label ??
    props.report.defaultLabel ??
    props.report.name;

  const reportSectionPath = useMemo<(string | number)[]>(
    () => multistepViewerReportSectionPath(rootSection, stepIndex, isViewerPaging),
    [isViewerPaging, rootSection, stepIndex],
  );

  const mergeStepBagFromFormikValues = useCallback(
    (values: Record<string, any>) => {
      const nextBag = extractStepBagFromFormikValues(values, stepBagKeys);
      stepBagRef.current = nextBag;
      setStepBag((previous) => (bagsEqual(previous, nextBag) ? previous : nextBag));
    },
    [stepBagKeys],
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
    if (
      !currentStepAllowsNext(
        currentStep,
        liveBag,
        modelEnvironment,
        reportSectionPath.join("_"),
        currentStep ? inputReportSectionBagKey(currentStep, reportSectionPath) : undefined,
      )
    ) {
      return;
    }
    setStepBag(liveBag);
    setFinishError(undefined);
    setStepIndex((current) => Math.min(lastIndex, current + 1));
  }, [currentStep, lastIndex, modelEnvironment, reportSectionPath]);

  const leaveProcess = useCallback(() => {
    setDismissed(true);
    if (props.onDismissed) {
      props.onDismissed();
      return;
    }
    navigate(-1);
  }, [navigate, props.onDismissed]);

  const handleFinish = useCallback(async () => {
    if (finishInFlightRef.current) {
      return;
    }
    const sequence = props.report.definition?.compositeActionSequence;
    if (!sequence) {
      setFinishError("This report has no Finish sequence.");
      return;
    }
    const liveBag = stepBagRef.current;
    setStepBag(liveBag);
    if (!allGatedStepsAllowFinish(steps, liveBag, modelEnvironment, listRoot)) {
      setFinishError("Required fields are missing or invalid.");
      return;
    }
    finishInFlightRef.current = true;
    setFinishInFlight(true);
    setFinishError(undefined);
    let left = false;
    try {
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
      left = true;
      leaveProcess();
    } finally {
      finishInFlightRef.current = false;
      if (!left) {
        setFinishInFlight(false);
      }
    }
  }, [
    domainController,
    leaveProcess,
    listRoot,
    modelEnvironment,
    props.application,
    props.applicationDeploymentMap,
    props.report.definition?.compositeActionSequence,
    steps,
  ]);

  const handleConfirmCancel = useCallback(() => {
    setCancelConfirmOpen(false);
    setStepBag({});
    leaveProcess();
  }, [leaveProcess]);

  const reportDescription =
    typeof props.report.description === "string" && props.report.description.trim().length > 0
      ? props.report.description.trim()
      : undefined;

  if (dismissed) {
    return null;
  }

  return (
    <MultistepReportHostContext.Provider value={hostValue}>
      <div data-testid="multistep-report-host">
        <pre data-testid="multistep-step-bag" hidden>
          {JSON.stringify(stepBag)}
        </pre>
        {isViewerPaging && stepIndex === 0 && reportDescription ? (
          <ThemedBox data-testid="multistep-report-description">
            <ThemedSpan>{reportDescription}</ThemedSpan>
          </ThemedBox>
        ) : null}
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
              <ThemedStyledButton
                type="button"
                variant="contained"
                disabled={finishInFlight}
                onClick={handleFinish}
              >
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
