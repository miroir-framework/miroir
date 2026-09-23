import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, type Params } from "react-router-dom";

import {
  Action2Error,
  LoggerInterface,
  MiroirLoggerFactory,
  entityWithResolvedMLSchema,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  jzodTypeCheck,
  transformer_extended_apply_wrapper,
  TransformerFailure,
  type ApplicationDeploymentMap,
  type CompositeActionSequenceTemplate,
  type DomainControllerInterface,
  type Entity,
  type JzodObject,
  type MiroirModelEnvironment,
  type MultistepStep,
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

const BAG_DUMP_OMIT_KEYS = new Set(["clientsecret", "refreshtoken", "token", "secretvalue"]);

export type MultistepListChild = ReportSection | MultistepStep;

export function isMultistepStepEnvelope(child: unknown): child is MultistepStep {
  return (
    !!child &&
    typeof child === "object" &&
    typeof (child as MultistepStep).stepId === "string" &&
    (child as MultistepStep).section != null &&
    typeof (child as MultistepStep).section === "object"
  );
}

export function unwrapMultistepListChild(child: MultistepListChild): ReportSection {
  return isMultistepStepEnvelope(child) ? child.section : child;
}

export function omitSecretKeysFromBagDump(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(omitSecretKeysFromBagDump);
  }
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
    return value;
  }
  const next: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (BAG_DUMP_OMIT_KEYS.has(key.toLowerCase())) {
      continue;
    }
    next[key] = omitSecretKeysFromBagDump(child);
  }
  return next;
}

export function unwrapAction2ErrorMessage(
  error: Action2Error | undefined,
  fallback: string = "Action failed.",
): string {
  if (!error) {
    return fallback;
  }
  let current: unknown = error;
  let message: string | undefined = error.errorMessage;
  const seen = new Set<unknown>();
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const asError = current as {
      errorMessage?: string;
      message?: string;
      failureMessage?: string;
      innerError?: unknown;
    };
    if (typeof asError.errorMessage === "string" && asError.errorMessage.length > 0) {
      message = asError.errorMessage;
    } else if (typeof asError.message === "string" && asError.message.length > 0) {
      message = asError.message;
    } else if (typeof asError.failureMessage === "string" && asError.failureMessage.length > 0) {
      message = asError.failureMessage;
    }
    const inner = asError.innerError;
    if (!inner) {
      break;
    }
    current = Array.isArray(inner) ? inner[0] : inner;
  }
  return message ?? fallback;
}

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
    "sequence actionLabel",
    (sequence as { actionLabel?: string })?.actionLabel,
    "sequence actionType",
    (sequence as { actionType?: string })?.actionType,
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
  resolvedInputSchema?: JzodObject;
  captureStepBagFromFormikValues: (values: Record<string, any>) => void;
  mergeStepBagFromFormikValues: (values: Record<string, any>) => void;
};

const MultistepReportHostContext = createContext<MultistepReportHostContextValue | undefined>(
  undefined,
);

export function useOptionalMultistepReportHost(): MultistepReportHostContextValue | undefined {
  return useContext(MultistepReportHostContext);
}

export function getMultistepChildSections(report: Report | undefined): {
  children: MultistepListChild[];
  sections: ReportSection[];
} {
  const section = report?.definition?.section;
  if (!section) {
    return { children: [], sections: [] };
  }
  if (section.type === "list" && Array.isArray(section.definition)) {
    const children = section.definition as MultistepListChild[];
    return {
      children,
      sections: children.map(unwrapMultistepListChild),
    };
  }
  return { children: [section], sections: [section] };
}

export function collectStepBagKeys(
  section: ReportSection | MultistepListChild | undefined,
  path: (string | number)[] = ["definition", "section"],
): string[] {
  if (!section) {
    return [];
  }
  if (isMultistepStepEnvelope(section)) {
    return collectStepBagKeys(section.section, path.concat("section"));
  }
  if (section.type === "list" && Array.isArray(section.definition)) {
    return section.definition.flatMap((child: MultistepListChild, index: number) => {
      if (isMultistepStepEnvelope(child)) {
        return collectStepBagKeys(child.section, path.concat("definition", index, "section"));
      }
      return collectStepBagKeys(child, path.concat("definition", index));
    });
  }
  if (section.type === "grid" && Array.isArray(section.definition)) {
    return section.definition.flatMap((row: ReportSection[], rowIndex: number) =>
      Array.isArray(row)
        ? row.flatMap((cell: ReportSection, colIndex: number) =>
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
  child?: MultistepListChild,
): (string | number)[] {
  if (!isViewerPaging) {
    return ["definition", "section"];
  }
  if (isMultistepListRoot(rootSection)) {
    if (child && isMultistepStepEnvelope(child)) {
      return ["definition", "section", "definition", stepIndex, "section"];
    }
    return ["definition", "section", "definition", stepIndex];
  }
  return ["definition", "section"];
}

export function allGatedStepsAllowFinish(
  steps: MultistepListChild[],
  stepBag: Record<string, any>,
  modelEnvironment: MiroirModelEnvironment,
  listRoot: boolean,
  resolvedSchemasByIndex?: (JzodObject | undefined)[],
): boolean {
  if (steps.length === 0) {
    return false;
  }
  return steps.every((child, index) => {
    const section = unwrapMultistepListChild(child);
    const path = listRoot
      ? isMultistepStepEnvelope(child)
        ? (["definition", "section", "definition", index, "section"] as (string | number)[])
        : (["definition", "section", "definition", index] as (string | number)[])
      : (["definition", "section"] as (string | number)[]);
    return currentStepAllowsNext(
      section,
      stepBag,
      modelEnvironment,
      path.join("_"),
      inputReportSectionBagKey(section, path),
      resolvedSchemasByIndex?.[index],
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
  resolvedInputSchema?: JzodObject,
): boolean {
  if (!section) {
    return false;
  }
  if (section.type === "inputReportSection") {
    const prefix = section.definition?.inputPrefix;
    const schema = (resolvedInputSchema ??
      section.definition?.inputMLSchema) as JzodObject | undefined;
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

function sectionLabel(section: ReportSection | undefined, fallback: string): string {
  const label = (section as { definition?: { label?: string } } | undefined)?.definition?.label;
  return typeof label === "string" && label.length > 0 ? label : fallback;
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
  const context = useMiroirContextService();
  const navigate = useNavigate();
  const modelEnvironment = useCurrentModelEnvironment(
    props.application,
    props.applicationDeploymentMap,
  );
  const { children: stepChildren } = useMemo(
    () => getMultistepChildSections(props.report),
    [props.report],
  );
  const rootSection = props.report.definition?.section;
  const listRoot = isMultistepListRoot(rootSection);
  const usesStepIds = useMemo(
    () => stepChildren.some(isMultistepStepEnvelope),
    [stepChildren],
  );
  const stepBagKeys = useMemo(
    () => collectStepBagKeys(rootSection),
    [rootSection],
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [visitedStepIds, setVisitedStepIds] = useState<string[]>(() => {
    const first = stepChildren[0];
    return isMultistepStepEnvelope(first) ? [first.stepId] : [];
  });
  const [stepBag, setStepBag] = useState<Record<string, any>>({});
  const stepBagRef = useRef<Record<string, any>>(stepBag);
  const finishInFlightRef = useRef(false);
  const [finishInFlight, setFinishInFlight] = useState(false);
  const [nextInFlight, setNextInFlight] = useState(false);
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
  const lastIndex = Math.max(0, stepChildren.length - 1);
  const currentChild = stepChildren[stepIndex];
  const currentSection = currentChild ? unwrapMultistepListChild(currentChild) : undefined;
  const currentLabel = sectionLabel(
    currentSection,
    props.report.defaultLabel ?? props.report.name,
  );

  const reportSectionPath = useMemo<(string | number)[]>(
    () =>
      multistepViewerReportSectionPath(
        rootSection,
        stepIndex,
        isViewerPaging,
        currentChild,
      ),
    [isViewerPaging, rootSection, stepIndex, currentChild],
  );

  const resolvedInputSchema = useMemo<JzodObject | undefined>(() => {
    if (!isMultistepStepEnvelope(currentChild) || !currentChild.inputSchemaFromBag) {
      return undefined;
    }
    const result = transformer_extended_apply_wrapper(
      context.miroirContext.miroirActivityTracker,
      "runtime",
      [],
      `inputSchemaFromBag:${currentChild.stepId}`,
      currentChild.inputSchemaFromBag,
      "value",
      modelEnvironment,
      stepBag,
      stepBag,
    );
    if (!result || result instanceof TransformerFailure) {
      return undefined;
    }
    return result as JzodObject;
  }, [
    context.miroirContext.miroirActivityTracker,
    currentChild,
    modelEnvironment,
    stepBag,
  ]);

  const stepBagWithResolvedDefaults = useMemo(() => {
    if (
      !resolvedInputSchema ||
      !isMultistepStepEnvelope(currentChild) ||
      currentChild.section.type !== "inputReportSection"
    ) {
      return stepBag;
    }
    const key = inputReportSectionBagKey(currentChild.section, reportSectionPath);
    if (stepBag[key] !== undefined) {
      return stepBag;
    }
    const defaults = getDefaultValueForJzodSchemaWithResolutionNonHook(
      "build",
      resolvedInputSchema,
      undefined,
      "",
      undefined,
      [],
      true,
      props.application,
      props.applicationDeploymentMap,
      props.applicationDeploymentMap[props.application],
      modelEnvironment,
      {},
    );
    return { ...stepBag, [key]: defaults };
  }, [
    currentChild,
    modelEnvironment,
    props.application,
    props.applicationDeploymentMap,
    reportSectionPath,
    resolvedInputSchema,
    stepBag,
  ]);

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
      stepBag: stepBagWithResolvedDefaults,
      isViewerPaging,
      reportSectionPath,
      resolvedInputSchema,
      captureStepBagFromFormikValues,
      mergeStepBagFromFormikValues,
    }),
    [
      stepIndex,
      stepBagWithResolvedDefaults,
      isViewerPaging,
      reportSectionPath,
      resolvedInputSchema,
      captureStepBagFromFormikValues,
      mergeStepBagFromFormikValues,
    ],
  );

  const indexOfStepId = useCallback(
    (stepId: string): number =>
      stepChildren.findIndex(
        (child) => isMultistepStepEnvelope(child) && child.stepId === stepId,
      ),
    [stepChildren],
  );

  const handleBack = useCallback(() => {
    setFinishError(undefined);
    if (usesStepIds) {
      setVisitedStepIds((previous) => {
        if (previous.length <= 1) {
          return previous;
        }
        const nextVisited = previous.slice(0, -1);
        const targetId = nextVisited[nextVisited.length - 1];
        const targetIndex = indexOfStepId(targetId);
        if (targetIndex >= 0) {
          setStepIndex(targetIndex);
        }
        return nextVisited;
      });
      return;
    }
    setStepIndex((current) => Math.max(0, current - 1));
  }, [indexOfStepId, usesStepIds]);

  const navigateToStepIndex = useCallback(
    (nextIndex: number, nextStepId: string | undefined) => {
      setStepIndex(nextIndex);
      if (typeof nextStepId === "string" && nextStepId.length > 0) {
        setVisitedStepIds((previous) =>
          previous[previous.length - 1] === nextStepId
            ? previous
            : [...previous, nextStepId],
        );
      }
    },
    [],
  );

  const handleNext = useCallback(async () => {
    if (nextInFlight) {
      return;
    }
    let liveBag = stepBagRef.current;
    if (
      !currentStepAllowsNext(
        currentSection,
        liveBag,
        modelEnvironment,
        reportSectionPath.join("_"),
        currentSection
          ? inputReportSectionBagKey(currentSection, reportSectionPath)
          : undefined,
        resolvedInputSchema,
      )
    ) {
      return;
    }
    setStepBag(liveBag);
    setFinishError(undefined);

    if (isMultistepStepEnvelope(currentChild) && currentChild.onNext) {
      setNextInFlight(true);
      try {
        const actionResult = await domainController.handleCompositeActionTemplate(
          currentChild.onNext,
          props.applicationDeploymentMap,
          modelEnvironment,
          liveBag,
        );
        if (actionResult instanceof Action2Error) {
          setFinishError(
            unwrapAction2ErrorMessage(
              actionResult,
              "Next action failed.",
            ),
          );
          return;
        }
        if (actionResult.returnedDomainElement !== undefined) {
          liveBag = {
            ...liveBag,
            [currentChild.stepId]: actionResult.returnedDomainElement,
          };
          stepBagRef.current = liveBag;
          setStepBag(liveBag);
        }
      } finally {
        setNextInFlight(false);
      }
    }

    if (isMultistepStepEnvelope(currentChild) && currentChild.branch) {
      const testResult = transformer_extended_apply_wrapper(
        context.miroirContext.miroirActivityTracker,
        "runtime",
        [],
        `branch.test:${currentChild.stepId}`,
        currentChild.branch.test,
        "value",
        modelEnvironment,
        liveBag,
        liveBag,
      );
      if (testResult instanceof TransformerFailure) {
        setFinishError(
          testResult.failureMessage ?? testResult.message ?? "Branch test failed.",
        );
        return;
      }
      const nextStepId = testResult ? currentChild.branch.whenTrue : currentChild.branch.whenFalse;
      const nextIndex = indexOfStepId(nextStepId);
      if (nextIndex < 0) {
        setFinishError(`Unknown branch target stepId: ${nextStepId}`);
        return;
      }
      navigateToStepIndex(nextIndex, nextStepId);
      return;
    }

    const nextIndex = Math.min(lastIndex, stepIndex + 1);
    const nextChild = stepChildren[nextIndex];
    navigateToStepIndex(
      nextIndex,
      isMultistepStepEnvelope(nextChild) ? nextChild.stepId : undefined,
    );
  }, [
    context.miroirContext.miroirActivityTracker,
    currentChild,
    currentSection,
    domainController,
    indexOfStepId,
    lastIndex,
    modelEnvironment,
    navigateToStepIndex,
    nextInFlight,
    props.applicationDeploymentMap,
    reportSectionPath,
    resolvedInputSchema,
    stepChildren,
    stepIndex,
  ]);

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

    const stepsToGate: MultistepListChild[] = usesStepIds
      ? stepChildren.filter(
          (child) =>
            isMultistepStepEnvelope(child) && visitedStepIds.includes(child.stepId),
        )
      : stepChildren;

    const resolvedForGate = stepsToGate.map((child) => {
      if (!isMultistepStepEnvelope(child) || !child.inputSchemaFromBag) {
        return undefined;
      }
      const result = transformer_extended_apply_wrapper(
        context.miroirContext.miroirActivityTracker,
        "runtime",
        [],
        `finishGate.inputSchemaFromBag:${child.stepId}`,
        child.inputSchemaFromBag,
        "value",
        modelEnvironment,
        liveBag,
        liveBag,
      );
      if (!result || result instanceof TransformerFailure) {
        return undefined;
      }
      return result as JzodObject;
    });

    if (
      !allGatedStepsAllowFinish(
        stepsToGate,
        liveBag,
        modelEnvironment,
        listRoot,
        resolvedForGate,
      )
    ) {
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
        setFinishError(unwrapAction2ErrorMessage(result, "Finish failed."));
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
    context.miroirContext.miroirActivityTracker,
    domainController,
    leaveProcess,
    listRoot,
    modelEnvironment,
    props.application,
    props.applicationDeploymentMap,
    props.report.definition?.compositeActionSequence,
    stepChildren,
    usesStepIds,
    visitedStepIds,
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

  const bagDump = omitSecretKeysFromBagDump(stepBag);

  if (dismissed) {
    return null;
  }

  return (
    <MultistepReportHostContext.Provider value={hostValue}>
      <div data-testid="multistep-report-host">
        <pre data-testid="multistep-step-bag" hidden>
          {JSON.stringify(bagDump)}
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
              disabled={stepIndex === 0 && visitedStepIds.length <= 1}
              onClick={handleBack}
            >
              Back
            </ThemedStyledButton>
            {stepIndex < lastIndex ? (
              <ThemedStyledButton
                type="button"
                variant="contained"
                disabled={nextInFlight}
                onClick={handleNext}
              >
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
            <ThemedSpan>The values you entered will be discarded.</ThemedSpan>
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
