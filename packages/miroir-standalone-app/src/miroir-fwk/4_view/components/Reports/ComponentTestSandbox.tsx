import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { MiroirLoggerFactory, type LoggerInterface } from "miroir-core";

import { packageName } from "../../../../constants.js";
import type { ComponentTestRegistration } from "../../../4-tests/componentTests/index.js";
import { cleanLevel } from "../../constants.js";

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
// ################################################################################################

export interface ComponentTestSandboxContextValue {
  /**
   * Loads the component test chunk, registers the runner over the sandbox, and shows the panel.
   * Throws when another display's component test run is active.
   */
  prepareComponentTests: () => Promise<void>;
  /** Ends the run started by `prepareComponentTests()`. The last case stays mounted. */
  finishComponentTests: () => void;
}

const ComponentTestSandboxContext = createContext<ComponentTestSandboxContextValue | undefined>(
  undefined,
);

export function useComponentTestSandbox(): ComponentTestSandboxContextValue | undefined {
  return useContext(ComponentTestSandboxContext);
}

// ################################################################################################
export const ComponentTestSandbox: React.FC<{
  open: boolean;
  /** A run is active: the close button is disabled. */
  running?: boolean;
  onClose: () => void;
  sandboxRef: React.RefObject<HTMLDivElement>;
}> = ({ open, running = false, onClose, sandboxRef }) => (
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
    <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
      <span style={{ fontWeight: "bold", color: "#4527a0", flexGrow: 1 }}>Component test sandbox</span>
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
    {/* Never a render target: the runner adds one container per case and a portal element. */}
    <div data-testid="component-test-sandbox" ref={sandboxRef} />
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

  const closeRegistration = useCallback(() => {
    const registration = registrationRef.current;
    registrationRef.current = undefined;
    registration?.close();
  }, []);

  const prepareComponentTests = useCallback(async () => {
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
    registrationRef.current = registerComponentTests({ sandboxElement });
    runningRef.current = true;
    setRunning(true);
    setOpen(true);
    log.info("component test sandbox ready");
  }, [closeRegistration]);

  const finishComponentTests = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    registrationRef.current?.endRun();
  }, []);

  const onClose = useCallback(() => {
    if (runningRef.current) {
      return;
    }
    closeRegistration();
    setOpen(false);
  }, [closeRegistration]);

  // On unmount, close after the current commit: unmounting the case's React root synchronously
  // while React commits this tree makes React warn about a race.
  useEffect(
    () => () => {
      const registration = registrationRef.current;
      registrationRef.current = undefined;
      if (registration) {
        setTimeout(() => registration.close(), 0);
      }
    },
    [],
  );

  const contextValue = useMemo(
    () => ({ prepareComponentTests, finishComponentTests }),
    [prepareComponentTests, finishComponentTests],
  );

  return (
    <ComponentTestSandboxContext.Provider value={contextValue}>
      {children}
      <ComponentTestSandbox open={open} running={running} onClose={onClose} sandboxRef={sandboxRef} />
    </ComponentTestSandboxContext.Provider>
  );
};
