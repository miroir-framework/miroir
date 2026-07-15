import { useEffect, useState } from "react";

import {
  getUiIntegrationTestRunPreferences,
  subscribeUiIntegrationTestRunPreferences,
  type UiIntegrationTestRunPreferences,
} from "./uiIntegrationTestRunPreferences.js";

export function useUiIntegrationTestRunPreferences(): UiIntegrationTestRunPreferences {
  const [preferences, setPreferences] = useState(() => getUiIntegrationTestRunPreferences());

  useEffect(
    () =>
      subscribeUiIntegrationTestRunPreferences(() => {
        setPreferences(getUiIntegrationTestRunPreferences());
      }),
    [],
  );

  return preferences;
}
