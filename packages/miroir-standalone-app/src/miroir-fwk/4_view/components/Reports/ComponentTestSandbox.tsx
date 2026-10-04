import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { MiroirLoggerFactory, type LoggerInterface } from "miroir-core";
import { FeedbackGlowBoundary } from "miroir-react";

import { packageName } from "../../../../constants.js";
import type { ComponentTestRegistration } from "../../../4-tests/componentTests/index.js";
import type { UiIntegrationReportTestSession } from "../../../4-tests/uiIntegrationTestLauncherTypes.js";
import { cleanLevel } from "../../constants.js";
import { useAdminViewParams } from "../useAdminViewParams.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ComponentTestSandbox");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI").then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
// Component test sandbox (#286, analysis §5.6).
//
// `ComponentTestSandboxProvider` owns a sandbox element, hidden until a run starts. Its
// `prepareComponentTests()` loads the component test chunk (the one dynamic `import()` of
// `4-tests/componentTests/index.ts`) and registers a component test runner over that element. Each
// case renders under the sandbox with its own providers and `LocalCache`, so the app's store is not
// touched. The last case stays mounted after the run; the close button unmounts it, destroys the
// suite wrapper, and hides the panel.
//
// One component test run at a time across displays: `prepareComponentTests()` throws while another
// display's run is active, and `finishComponentTests()` (called by the Run buttons when the run
// ends, success or error) destroys the open suite wrappers and releases the run lock. The close
// button is disabled during the run.
//
// `prepareReportTests()` (#330) is the same for an integration run of a suite of `reportTest`
// leaves: it registers a report test runner over the sandbox, for the run's session, and returns
// the release that ends the run. Each Report is unmounted when its leaf ends.
//
// The panel's header (#435) shows the name of the case being run (the last one after the run) and
// a slider of the delay the runner waits before each step. The delay is the ViewParams attribute
// `componentTestStepDelayMs`, saved when the slider is released; the runner reads the current
// value when each step starts, so moving the slider acts on the running case. The slider mounts
// with the panel, so that a closed sandbox needs no Redux store or DomainController.
//
// The TransformerEditor's "Show transformer types" switch (#453) is the ViewParams attribute
// `showTransformerTypes`. The cases render over their own store, without ViewParams: the sandbox
// passes the app's value to the runner, which gives it to each case, and saves the switch's
// changes in the app's ViewParams, so that it keeps its value from one case to the next.
//
// The header's play / pause button (#443) holds the run before its next step: the runner awaits
// `waitWhilePaused()` before each step, after the step delay. The end of a run resumes it, so the
// next run starts unpaused. The paused state is in memory only.
// ################################################################################################

export interface ComponentTestSandboxContextValue {
  /**
   * Loads the component test chunk, registers the runner over the sandbox, and shows the panel.
   * Throws when another display's component test run is active. `iterationsOverride` replaces
   * the `iterations` of every `measureRendering` step of the run (#303 T7).
   */
  prepareComponentTests: (options?: ComponentTestRunOptions) => Promise<void>;
  /** Ends the run started by `prepareComponentTests()`. The last case stays mounted. */
  finishComponentTests: () => void;
  /**
   * #330: loads the component test chunk, registers the report test runner over the sandbox for
   * the session of an integration run, and shows the panel. Returns the release that ends the run.
   * Throws when another display's component test run is active.
   */
  prepareReportTests: (session: UiIntegrationReportTestSession) => Promise<() => void>;
}

export interface ComponentTestRunOptions {
  /** #303 T7: replaces the `iterations` of every `measureRendering` step of the run. */
  iterationsOverride?: number;
}

const ComponentTestSandboxContext = createContext<ComponentTestSandboxContextValue | undefined>(
  undefined,
);

export function useComponentTestSandbox(): ComponentTestSandboxContextValue | undefined {
  return useContext(ComponentTestSandboxContext);
}

const maxStepDelayMs = 2000;

// ################################################################################################
/**
 * #443: the pause of a run. `waitWhilePaused()` resolves at once when the run is not paused, or
 * when `resume()` is called otherwise.
 */
export interface ComponentTestPauseGate {
  pause: () => void;
  resume: () => void;
  isPaused: () => boolean;
  waitWhilePaused: () => Promise<void>;
}

export function createComponentTestPauseGate(): ComponentTestPauseGate {
  let held: { promise: Promise<void>; release: () => void } | undefined;
  return {
    pause: () => {
      if (held) {
        return;
      }
      let release: () => void = () => {};
      const promise = new Promise<void>((resolve) => {
        release = resolve;
      });
      held = { promise, release };
    },
    resume: () => {
      held?.release();
      held = undefined;
    },
    isPaused: () => held !== undefined,
    waitWhilePaused: () => held?.promise ?? Promise.resolve(),
  };
}

// ################################################################################################
/**
 * #435: the step delay of the ViewParams instance, within the slider's range, and its save. Before
 * the admin store is loaded, the delay is 0 and the save does nothing.
 */
function useComponentTestStepDelay(): { stepDelayMs: number; saveStepDelayMs: (value: number) => void } {
  const { viewParamsData, saveViewParams } = useAdminViewParams();
  const saveStepDelayMs = useCallback(
    (value: number) => saveViewParams({ componentTestStepDelayMs: value }),
    [saveViewParams],
  );
  // the attribute is editable elsewhere (ViewParams report): kept in the slider's range
  const saved = Number(viewParamsData?.componentTestStepDelayMs ?? 0);
  const stepDelayMs = Number.isFinite(saved) ? Math.min(Math.max(saved, 0), maxStepDelayMs) : 0;
  return { stepDelayMs, saveStepDelayMs };
}

// ################################################################################################
/**
 * #435: the slider of the step delay. It shows its own value while it moves, the saved one
 * otherwise, and writes the shown value to `stepDelayMsRef` for the runner.
 */
const ComponentTestStepDelaySlider: React.FC<{ stepDelayMsRef: React.MutableRefObject<number> }> = ({
  stepDelayMsRef,
}) => {
  const { stepDelayMs: savedStepDelayMs, saveStepDelayMs } = useComponentTestStepDelay();
  const [movingStepDelayMs, setMovingStepDelayMs] = useState<number | undefined>(undefined);
  if (movingStepDelayMs !== undefined && movingStepDelayMs === savedStepDelayMs) {
    setMovingStepDelayMs(undefined);
  }
  const stepDelayMs = movingStepDelayMs ?? savedStepDelayMs;
  stepDelayMsRef.current = stepDelayMs;
  const onCommit = () => {
    if (movingStepDelayMs !== undefined) {
      saveStepDelayMs(movingStepDelayMs);
    }
  };
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "4px", color: "#555", whiteSpace: "nowrap" }}>
      Step delay
      <input
        type="range"
        aria-label="Component test step delay"
        min={0}
        max={maxStepDelayMs}
        step={100}
        value={stepDelayMs}
        onChange={(event) => setMovingStepDelayMs(Number(event.target.value))}
        onPointerUp={onCommit}
        onPointerCancel={onCommit}
        onKeyUp={onCommit}
        style={{ width: "100px" }}
      />
      <span style={{ display: "inline-block", minWidth: "4.5em", textAlign: "right" }}>{stepDelayMs} ms</span>
    </label>
  );
};

// ################################################################################################
/**
 * #453: the TransformerEditor switch value of the cases, kept in `valueRef` for the runner, from
 * the app's ViewParams; `saveRef` saves a change there. A change saved by a case is the value of
 * the next case at once, the ViewParams update arriving later.
 */
export interface ComponentTestTransformerTypesRefs {
  valueRef: React.MutableRefObject<boolean>;
  saveRef: React.MutableRefObject<(showTransformerTypes: boolean) => void>;
}

const ComponentTestTransformerTypesSetting: React.FC<ComponentTestTransformerTypesRefs> = ({
  valueRef,
  saveRef,
}) => {
  const { viewParamsData, saveViewParams } = useAdminViewParams();
  const saved = viewParamsData?.showTransformerTypes === true;
  const lastSavedRef = useRef<boolean | undefined>(undefined);
  if (lastSavedRef.current !== saved) {
    lastSavedRef.current = saved;
    valueRef.current = saved;
  }
  saveRef.current = (showTransformerTypes: boolean) => saveViewParams({ showTransformerTypes });
  return null;
};

// ################################################################################################
export const ComponentTestSandbox: React.FC<{
  open: boolean;
  /** A run is active: the close button is disabled. */
  running?: boolean;
  onClose: () => void;
  sandboxRef: React.RefObject<HTMLDivElement>;
  /** #435: the name of the case being run, or of the last case run. */
  testName?: string;
  /** #435: receives the step delay of the slider, for the runner. */
  stepDelayMsRef?: React.MutableRefObject<number>;
  /** #453: receive the TransformerEditor switch value of the cases and its save. */
  transformerTypesRefs?: ComponentTestTransformerTypesRefs;
  /** #438: the header checkbox "Glow on interactions"; the glow is on when omitted. */
  glowOn?: boolean;
  onGlowOnChange?: (glowOn: boolean) => void;
  /** #443: the run is paused; the play / pause button shows only with `onPausedChange`. */
  paused?: boolean;
  onPausedChange?: (paused: boolean) => void;
}> = ({
  open,
  running = false,
  onClose,
  sandboxRef,
  testName,
  stepDelayMsRef,
  transformerTypesRefs,
  glowOn = true,
  onGlowOnChange,
  paused = false,
  onPausedChange,
}) => (
  <div
    data-testid="component-test-sandbox-panel"
    style={{
      display: open ? "block" : "none",
      marginTop: "8px",
      padding: "8px",
      border: "1px dashed #7e57c2",
      borderRadius: "6px",
      backgroundColor: "white",
    }}
  >
    {/* #438: steps of a displayed run glow; every case container and the portal element are inside.
        Unchecking the header box marks the boundary "off", which also overrides the global switch. */}
    <FeedbackGlowBoundary enabled={glowOn}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px", fontSize: "0.85em" }}>
        <span style={{ fontWeight: "bold", color: "#4527a0", flexGrow: 1 }}>Component test sandbox</span>
        {/* mounted with the panel only: it reads ViewParams, which needs the app's providers */}
        {open && stepDelayMsRef && <ComponentTestStepDelaySlider stepDelayMsRef={stepDelayMsRef} />}
        {open && transformerTypesRefs && <ComponentTestTransformerTypesSetting {...transformerTypesRefs} />}
        {onPausedChange && (
          <button
            type="button"
            aria-label={paused ? "Resume component test run" : "Pause component test run"}
            title={running ? undefined : "No component test run in progress"}
            disabled={!running}
            onClick={() => onPausedChange(!paused)}
            style={{ minWidth: "5.5em" }}
          >
            {paused ? "\u25B6 Play" : "\u23F8 Pause"}
          </button>
        )}
        {onGlowOnChange && (
          <label style={{ display: "flex", alignItems: "center", gap: "4px", color: "#555", whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={glowOn} onChange={(event) => onGlowOnChange(event.target.checked)} />
            Glow on interactions
          </label>
        )}
        <button
          type="button"
          aria-label="Close component test sandbox"
          title={running ? "A component test run is in progress" : undefined}
          disabled={running}
          onClick={onClose}
        >
          Close
        </button>
      </div>
      {/* the whole name, wrapped: its last segment, the case, matters most */}
      <div
        data-testid="component-test-sandbox-test-name"
        style={{
          display: testName ? "block" : "none",
          marginBottom: "6px",
          padding: "4px 8px",
          borderLeft: "4px solid #7e57c2",
          backgroundColor: "#ede7f6",
          color: "#311b92",
          fontFamily: "monospace",
          fontSize: "1.05em",
          fontWeight: "bold",
          overflowWrap: "anywhere",
        }}
      >
        {testName ?? ""}
      </div>
      {/* Never a render target: the runner adds one container per case and a portal element. */}
      <div data-testid="component-test-sandbox" ref={sandboxRef} />
    </FeedbackGlowBoundary>
  </div>
);

// ################################################################################################
export const ComponentTestSandboxProvider: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const sandboxRef = useRef<HTMLDivElement>(null);
  const registrationRef = useRef<ComponentTestRegistration | undefined>(undefined);
  const runningRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [testName, setTestName] = useState<string | undefined>(undefined);
  // #438: in memory only, so every page load starts with the glow on
  const [glowOn, setGlowOn] = useState(true);
  // #443: read by the runner before each step; `paused` mirrors it for the button
  const pauseGateRef = useRef(createComponentTestPauseGate());
  const [paused, setPaused] = useState(false);
  const onPausedChange = useCallback((pause: boolean) => {
    if (pause) {
      pauseGateRef.current.pause();
    } else {
      pauseGateRef.current.resume();
    }
    setPaused(pauseGateRef.current.isPaused());
  }, []);

  // #435: set by the slider, read by the runner when each step starts
  const stepDelayMsRef = useRef(0);
  // #453: set from the app's ViewParams, read by the runner when each case is rendered
  const transformerTypesValueRef = useRef(false);
  const transformerTypesSaveRef = useRef<(showTransformerTypes: boolean) => void>(() => {});
  const transformerTypesRefs = useMemo(
    () => ({ valueRef: transformerTypesValueRef, saveRef: transformerTypesSaveRef }),
    [],
  );
  const runControls = useMemo(
    () => ({
      onCaseStart: setTestName,
      stepDelayMs: () => stepDelayMsRef.current,
      waitWhilePaused: () => pauseGateRef.current.waitWhilePaused(),
      showTransformerTypes: () => transformerTypesValueRef.current,
      saveShowTransformerTypes: (showTransformerTypes: boolean) => {
        transformerTypesValueRef.current = showTransformerTypes;
        transformerTypesSaveRef.current(showTransformerTypes);
      },
    }),
    [],
  );

  const closeRegistration = useCallback(() => {
    const registration = registrationRef.current;
    registrationRef.current = undefined;
    registration?.close();
  }, []);

  const prepareComponentTests = useCallback(async (options?: ComponentTestRunOptions) => {
    const { componentTestRunInProgressMessage, isComponentTestRunActive, registerComponentTests } =
      await import("../../../4-tests/componentTests/index.js");
    // Checked before closing this display's previous registration, so that a refused run leaves
    // the last case of the previous run in place.
    if (isComponentTestRunActive()) {
      throw new Error(componentTestRunInProgressMessage);
    }
    closeRegistration();
    const sandboxElement = sandboxRef.current;
    if (!sandboxElement) {
      throw new Error("component test sandbox element is not mounted");
    }
    setTestName(undefined);
    registrationRef.current = registerComponentTests({
      sandboxElement,
      ...runControls,
      ...(options?.iterationsOverride !== undefined ? { iterationsOverride: options.iterationsOverride } : {}),
    });
    runningRef.current = true;
    setRunning(true);
    setOpen(true);
    log.info("component test sandbox ready", options ?? {});
  }, [closeRegistration, runControls]);

  const finishComponentTests = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    onPausedChange(false);
    registrationRef.current?.endRun();
  }, [onPausedChange]);

  const prepareReportTests = useCallback(async (session: UiIntegrationReportTestSession) => {
    const { componentTestRunInProgressMessage, isComponentTestRunActive, registerReportTests } =
      await import("../../../4-tests/componentTests/index.js");
    if (isComponentTestRunActive()) {
      throw new Error(componentTestRunInProgressMessage);
    }
    closeRegistration();
    const sandboxElement = sandboxRef.current;
    if (!sandboxElement) {
      throw new Error("component test sandbox element is not mounted");
    }
    setTestName(undefined);
    const registration = registerReportTests({
      sandboxElement,
      ...runControls,
      miroirActivityTracker: session.miroirActivityTracker,
      miroirEventService: session.miroirEventService,
      ...(session.miroirReports ? { miroirReports: session.miroirReports } : {}),
    });
    registrationRef.current = registration;
    runningRef.current = true;
    setRunning(true);
    setOpen(true);
    log.info("report test sandbox ready");
    return () => {
      runningRef.current = false;
      setRunning(false);
      onPausedChange(false);
      registration.endRun();
    };
  }, [closeRegistration, runControls, onPausedChange]);

  const onClose = useCallback(() => {
    if (runningRef.current) {
      return;
    }
    closeRegistration();
    setOpen(false);
  }, [closeRegistration]);

  // On unmount, close after the current commit: unmounting the case's React root synchronously
  // while React commits this tree makes React warn about a race.
  // A run paused at that time is resumed, so that it ends instead of waiting for a gone button.
  useEffect(
    () => () => {
      pauseGateRef.current.resume();
      const registration = registrationRef.current;
      registrationRef.current = undefined;
      if (registration) {
        setTimeout(() => registration.close(), 0);
      }
    },
    [],
  );

  const contextValue = useMemo(
    () => ({ prepareComponentTests, finishComponentTests, prepareReportTests }),
    [prepareComponentTests, finishComponentTests, prepareReportTests],
  );

  return (
    <ComponentTestSandboxContext.Provider value={contextValue}>
      {children}
      <ComponentTestSandbox
        open={open}
        running={running}
        onClose={onClose}
        sandboxRef={sandboxRef}
        testName={testName}
        stepDelayMsRef={stepDelayMsRef}
        transformerTypesRefs={transformerTypesRefs}
        glowOn={glowOn}
        onGlowOnChange={setGlowOn}
        paused={paused}
        onPausedChange={onPausedChange}
      />
    </ComponentTestSandboxContext.Provider>
  );
};
