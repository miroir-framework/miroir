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
// The settings next to the Run buttons (`ComponentTestRunSettings`) are passed to
// `prepareComponentTests()` when a run starts:
// - "Show transformer types": the value the TransformerEditor's switch (#453) starts with in every
//   case, fixed for the run; a toggle in a case changes only that case, and nothing is saved.
// - "Show test sandbox": the panel is shown, or rendered off-screen so that the cases still run
//   out of the user's sight. `setSandboxShown()` changes it at once, during or after a run. A
//   hidden panel is inert outside a run, and a run's end takes the focus out of it.
// While a run is in progress, a banner at the top of the page asks the user to stay on the
// window: a page that loses focus or goes to the background renders late.
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
  /** A component or report test run is in progress. */
  running: boolean;
  /** Shows the sandbox panel, or renders it off-screen ("Show test sandbox"). */
  setSandboxShown: (shown: boolean) => void;
}

export interface ComponentTestRunOptions {
  /** #303 T7: replaces the `iterations` of every `measureRendering` step of the run. */
  iterationsOverride?: number;
  /** The value the TransformerEditor's "Show transformer types" switch starts with in every case. Default false. */
  showTransformerTypes?: boolean;
  /** Shows the sandbox panel during the run; otherwise it is rendered off-screen. Unchanged when absent. */
  showSandbox?: boolean;
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
  /** "Show test sandbox": when false, the open panel is rendered off-screen. Default true. */
  shown?: boolean;
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
  shown = true,
  glowOn = true,
  onGlowOnChange,
  paused = false,
  onPausedChange,
}) => (
  <div
    data-testid="component-test-sandbox-panel"
    data-sandbox-shown={String(shown)}
    // Not shown and no run: out of keyboard navigation and focus. Not during a run, whose steps
    // focus and type into the case.
    {...(!shown && !running ? { inert: "" } : {})}
    style={{
      display: open ? "block" : "none",
      marginTop: "8px",
      padding: "8px",
      border: "1px dashed #7e57c2",
      borderRadius: "6px",
      backgroundColor: "white",
      // Not shown: rendered off-screen, at the page's width, so that the cases lay out and run as
      // when shown. The transform also holds the MUI dialogs and menus of the cases (fixed
      // position) off-screen, and nothing is aria-hidden, so that the role queries still see them.
      ...(shown ? {} : { position: "fixed", top: 0, left: 0, width: "100vw", transform: "translateX(-200vw)" }),
    }}
  >
    {/* #438: steps of a displayed run glow; every case container and the portal element are inside.
        Unchecking the header box marks the boundary "off", which also overrides the global switch. */}
    <FeedbackGlowBoundary enabled={glowOn}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px", fontSize: "0.85em" }}>
        <span style={{ fontWeight: "bold", color: "#4527a0", flexGrow: 1 }}>Component test sandbox</span>
        {/* mounted with the panel only: it reads ViewParams, which needs the app's providers */}
        {open && stepDelayMsRef && <ComponentTestStepDelaySlider stepDelayMsRef={stepDelayMsRef} />}
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
/** Shown at the top of the page while a component test run is in progress. */
export const ComponentTestStayOnWindowBanner: React.FC = () => (
  <div
    role="status"
    data-testid="component-test-stay-on-window"
    style={{
      position: "fixed",
      top: "8px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 2000,
      padding: "6px 16px",
      borderRadius: "6px",
      backgroundColor: "#fff3e0",
      border: "1px solid #ef6c00",
      color: "#e65100",
      fontWeight: "bold",
      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
      pointerEvents: "none",
    }}
  >
    Component tests are running: please stay on this window.
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
  // #453: set when a run starts, fixed for the run, read by the runner when each case is rendered
  const showTransformerTypesRef = useRef(false);
  // "Show test sandbox": the open panel is shown, or rendered off-screen; the ref for the run's end
  const [sandboxShown, setSandboxShownState] = useState(false);
  const sandboxShownRef = useRef(false);
  const setSandboxShown = useCallback((shown: boolean) => {
    sandboxShownRef.current = shown;
    setSandboxShownState(shown);
  }, []);
  /** At the end of a run: a hidden panel keeps no focus, which a step may have left in its case. */
  const releaseHiddenSandboxFocus = useCallback(() => {
    const panel = sandboxRef.current?.closest('[data-testid="component-test-sandbox-panel"]');
    const focused = panel?.ownerDocument.activeElement;
    if (!sandboxShownRef.current && focused instanceof HTMLElement && panel?.contains(focused)) {
      focused.blur();
    }
  }, []);
  const runControls = useMemo(
    () => ({
      onCaseStart: setTestName,
      stepDelayMs: () => stepDelayMsRef.current,
      waitWhilePaused: () => pauseGateRef.current.waitWhilePaused(),
      showTransformerTypes: () => showTransformerTypesRef.current,
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
    showTransformerTypesRef.current = options?.showTransformerTypes ?? false;
    if (options?.showSandbox !== undefined) {
      setSandboxShown(options.showSandbox);
    }
    registrationRef.current = registerComponentTests({
      sandboxElement,
      ...runControls,
      ...(options?.iterationsOverride !== undefined ? { iterationsOverride: options.iterationsOverride } : {}),
    });
    runningRef.current = true;
    setRunning(true);
    setOpen(true);
    log.info("component test sandbox ready", options ?? {});
  }, [closeRegistration, runControls, setSandboxShown]);

  const finishComponentTests = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    onPausedChange(false);
    registrationRef.current?.endRun();
    releaseHiddenSandboxFocus();
  }, [onPausedChange, releaseHiddenSandboxFocus]);

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
      releaseHiddenSandboxFocus();
    };
  }, [closeRegistration, runControls, onPausedChange, releaseHiddenSandboxFocus]);

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
    () => ({ prepareComponentTests, finishComponentTests, prepareReportTests, running, setSandboxShown }),
    [prepareComponentTests, finishComponentTests, prepareReportTests, running, setSandboxShown],
  );

  return (
    <ComponentTestSandboxContext.Provider value={contextValue}>
      {children}
      {running && <ComponentTestStayOnWindowBanner />}
      <ComponentTestSandbox
        open={open}
        running={running}
        onClose={onClose}
        sandboxRef={sandboxRef}
        testName={testName}
        stepDelayMsRef={stepDelayMsRef}
        shown={sandboxShown}
        glowOn={glowOn}
        onGlowOnChange={setGlowOn}
        paused={paused}
        onPausedChange={onPausedChange}
      />
    </ComponentTestSandboxContext.Provider>
  );
};
