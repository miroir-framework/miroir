/**
 * Lazy-loaded CopilotKit shell (#244).
 *
 * Bundles @copilotkit/react-core (provider) and, when the sidebar is open,
 * AiActionsProvider (@copilotkit/react-ui). RootComponent mounts this only when
 * ViewParams.agents is enabled and the user opens an AI AppBar control
 * (assistant sidebar or dev console). RootComponent mounts this only when both
 * conditions hold so vendor-copilotkit is not fetched at startup.
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
