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
 *
 * `/api/copilotkit` is identity-gated (#71). CopilotKit has its own HTTP client,
 * so REST's RestClient token getter does not apply. Pass the session Bearer on
 * CopilotKit `headers` (same helper as REST).
 *
 * CopilotKit 1.59 CopilotChat binds the message list to a local agent named
 * `"default"`. Messages and the composer each call `useAgent`; if getAgent
 * misses, each hook builds its own provisional agent. The composer POST can
 * stream while the list stays on the greeting. Register one shared
 * ProxiedCopilotRuntimeAgent as `selfManagedAgents.default` (single-endpoint
 * envelope) so both widgets subscribe to the same SSE.
 */
import React, { useMemo, useSyncExternalStore } from "react";
import { ProxiedCopilotRuntimeAgent } from "@copilotkit/core";
import { CopilotKit } from "@copilotkit/react-core";
import {
  authorizationHeaders,
  copilotRuntimeUrl,
  ELECTRON_LOOPBACK_ROOT_API_URL,
  electronRuntimeBaseUrl,
  getClientEnvironment,
} from "miroir-core";
import { useMiroirContextService } from "miroir-react";

import { useAuthSession } from "../../auth/authSession.js";
import { AiActionsProvider } from "./AiActionsProvider.js";
import {
  readMiroirAiBackend,
  subscribeMiroirAiBackend,
} from "./miroirAiBackend.js";

const isStaticDemo = (import.meta as any).env?.MIROIR_IS_SANDBOX === "true";

export function AgentsCopilotKit(): React.JSX.Element | null {
  const { showCopilotDevConsole, showAiSidebar, processCapabilities } =
    useMiroirContextService();
  const { token } = useAuthSession();
  const copilotHeaders = useMemo(() => authorizationHeaders(token), [token]);
  useSyncExternalStore(subscribeMiroirAiBackend, readMiroirAiBackend, readMiroirAiBackend);
  const useCursorBackend =
    readMiroirAiBackend() === "cursor" && processCapabilities.cursor === true;
  const runtimeUrl = copilotRuntimeUrl(
    getClientEnvironment(),
    electronRuntimeBaseUrl({ rootApiUrl: ELECTRON_LOOPBACK_ROOT_API_URL }),
  );
  const copilotProperties = useMemo(
    () =>
      useCursorBackend ? { aiConfig: { backend: "cursor" as const } } : undefined,
    [useCursorBackend],
  );
  const defaultAgent = useMemo(
    () =>
      new ProxiedCopilotRuntimeAgent({
        runtimeUrl,
        agentId: "default",
        transport: "single",
        headers: copilotHeaders,
      }),
    [runtimeUrl, copilotHeaders],
  );
  const selfManagedAgents = useMemo(
    () => ({ default: defaultAgent }),
    [defaultAgent],
  );

  if (isStaticDemo) {
    return null;
  }

  return (
    <CopilotKit
      runtimeUrl={runtimeUrl}
      headers={copilotHeaders}
      showDevConsole={false}
      enableInspector={showCopilotDevConsole}
      useSingleEndpoint={true}
      properties={copilotProperties}
      selfManagedAgents={selfManagedAgents}
    >
      {(showAiSidebar || showCopilotDevConsole) && <AiActionsProvider />}
    </CopilotKit>
  );
}
