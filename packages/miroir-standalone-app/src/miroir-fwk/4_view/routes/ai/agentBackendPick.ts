/**
 * Browser side of the agent backend pick (#409). The server runs at most one agent backend,
 * chosen in the environment config; the browser only switches between token chat and "the agent".
 */
import type { AgentBackend, ProcessCapabilities } from "miroir-core";

import type { MiroirAiBackendPick } from "./miroirAiBackend.js";

const AGENT_BACKEND_LABELS = {
  cursor: "Cursor",
  claude: "Claude",
} as const;

/** Name of the configured agent backend for the AppBar toggle, or undefined when there is none. */
export function agentBackendLabel(capabilities: ProcessCapabilities): string | undefined {
  if (capabilities.agentBackend === "none") {
    return undefined;
  }
  return AGENT_BACKEND_LABELS[capabilities.agentBackend];
}

/** CopilotKit `properties` asking the server for its agent backend, or undefined for token chat. */
export function agentRequestProperties(
  pick: MiroirAiBackendPick | undefined,
  agentBackend: AgentBackend,
): { aiConfig: { backend: "agent" } } | undefined {
  if (pick !== "agent" || agentBackend === "none") {
    return undefined;
  }
  return { aiConfig: { backend: "agent" } };
}
