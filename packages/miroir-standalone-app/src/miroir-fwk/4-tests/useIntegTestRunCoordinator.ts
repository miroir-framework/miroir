import { useEffect, useState } from "react";

import { getIntegTestRunCoordinator } from "./integTestRunCoordinator.js";

export function useIntegTestRunCoordinator(): { isRunning: boolean } {
  const coordinator = getIntegTestRunCoordinator();
  const [isRunning, setIsRunning] = useState(() => coordinator.isRunning);

  useEffect(() => {
    return coordinator.subscribe(() => setIsRunning(coordinator.isRunning));
  }, []);

  return { isRunning };
}
