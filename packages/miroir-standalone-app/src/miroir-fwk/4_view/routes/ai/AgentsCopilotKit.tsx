/**
 * Lazy-loaded CopilotKit shell (#244).
 *
 * Bundles @copilotkit/react-core (provider) and, when an AI AppBar control is
 * open, AiActionsProvider (@copilotkit/react-ui). RootComponent first mounts
 * this when ViewParams.agents is enabled and the user opens the assistant
 * sidebar or dev console (so vendor-copilotkit is not fetched at startup), then
 * keeps it mounted while agents stay enabled so CopilotKit chat state survives
 * closing both controls.
 */
import React from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { useMiroirContextService } from "miroir-react";

import { AiActionsProvider } from "./AiActionsProvider.js";

const isStaticDemo = (import.meta as any).env?.MIROIR_IS_SANDBOX === "true";

export function AgentsCopilotKit(): React.JSX.Element | null {
  if (isStaticDemo) {
    return null;
  }

  const { showCopilotDevConsole, showAiSidebar } = useMiroirContextService();

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      showDevConsole={false}
      enableInspector={showCopilotDevConsole}
    >
      {(showAiSidebar || showCopilotDevConsole) && <AiActionsProvider />}
    </CopilotKit>
  );
}
