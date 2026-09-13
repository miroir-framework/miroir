/**
 * Lazy-loaded CopilotKit shell (#244, #275).
 *
 * Bundles @copilotkit/react-core (provider) and, when an AI AppBar control is
 * open, AiActionsProvider (@copilotkit/react-ui). RootComponent first mounts
 * this when processCapabilities.ai is enabled and the user opens the assistant
 * sidebar or dev console (so vendor-copilotkit is not fetched at startup), then
 * keeps it mounted while snapshot ai stays enabled so CopilotKit chat state
 * survives closing both controls.
 *
 * Backend pick lives in sessionStorage (`miroirAiBackend`). When the pick is
 * `"cursor"` and processCapabilities.cursor is true, CopilotKit receives
 * properties={{ aiConfig: { backend: "cursor" } }} (forwarded as
 * forwardedProps). Default omitted pick uses the token AI_PROVIDER_TYPE path
 * (no properties backend).
 */
import React, { useSyncExternalStore } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import {
  copilotRuntimeUrl,
  ELECTRON_LOOPBACK_ROOT_API_URL,
  electronRuntimeBaseUrl,
  getClientEnvironment,
} from "miroir-core";
import { useMiroirContextService } from "miroir-react";

import { AiActionsProvider } from "./AiActionsProvider.js";
import {
  readMiroirAiBackend,
  subscribeMiroirAiBackend,
} from "./miroirAiBackend.js";

const isStaticDemo = (import.meta as any).env?.MIROIR_IS_SANDBOX === "true";

export function AgentsCopilotKit(): React.JSX.Element | null {
  const { showCopilotDevConsole, showAiSidebar, processCapabilities } =
    useMiroirContextService();
  useSyncExternalStore(subscribeMiroirAiBackend, readMiroirAiBackend, readMiroirAiBackend);
  const useCursorBackend =
    readMiroirAiBackend() === "cursor" && processCapabilities.cursor === true;

  if (isStaticDemo) {
    return null;
  }

  return (
    <CopilotKit
      runtimeUrl={copilotRuntimeUrl(
        getClientEnvironment(),
        electronRuntimeBaseUrl({ rootApiUrl: ELECTRON_LOOPBACK_ROOT_API_URL }),
      )}
      showDevConsole={false}
      enableInspector={showCopilotDevConsole}
      properties={
        useCursorBackend
          ? { aiConfig: { backend: "cursor" } }
          : undefined
      }
    >
      {(showAiSidebar || showCopilotDevConsole) && <AiActionsProvider />}
    </CopilotKit>
  );
}
