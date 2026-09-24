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
// ################################################################################################

export interface ComponentTestSandboxContextValue {
  /** Loads the component test chunk, registers the runner over the sandbox, and shows the panel. */
  prepareComponentTests: () => Promise<void>;
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
  onClose: () => void;
  sandboxRef: React.RefObject<HTMLDivElement>;
}> = ({ open, onClose, sandboxRef }) => (
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
      <button type="button" aria-label="Close component test sandbox" onClick={onClose}>
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
  const [open, setOpen] = useState(false);

  const closeRegistration = useCallback(() => {
    const registration = registrationRef.current;
    registrationRef.current = undefined;
    registration?.close();
  }, []);

  const prepareComponentTests = useCallback(async () => {
    closeRegistration();
    const { registerComponentTests } = await import("../../../4-tests/componentTests/index.js");
    const sandboxElement = sandboxRef.current;
    if (!sandboxElement) {
      throw new Error("component test sandbox element is not mounted");
    }
    registrationRef.current = registerComponentTests({ sandboxElement });
    setOpen(true);
    log.info("component test sandbox ready");
  }, [closeRegistration]);

  const onClose = useCallback(() => {
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

  const contextValue = useMemo(() => ({ prepareComponentTests }), [prepareComponentTests]);

  return (
    <ComponentTestSandboxContext.Provider value={contextValue}>
      {children}
      <ComponentTestSandbox open={open} onClose={onClose} sandboxRef={sandboxRef} />
    </ComponentTestSandboxContext.Provider>
  );
};
