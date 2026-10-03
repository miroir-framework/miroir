/**
 * Builds the agent of the configured backend (#409). Each backend module imports its SDK only
 * when its agent is created, so a process loads the SDK of its own backend and no other.
 */

import type { AbstractAgent } from "@ag-ui/client";
import type { AgentBackend } from "miroir-core";

import { createClaudeAbstractAgent, type ImportClaudeSdk } from "./claudeAgent.js";
import { createCursorAbstractAgent, type ImportCursorSdk } from "./cursorAgent.js";

/** A configured agent backend: every `AgentBackend` except `"none"`. */
export type ActiveAgentBackend = Exclude<AgentBackend, "none">;

export type CreateAgentForBackendOptions = {
  mcpHttpUrl?: string;
  apiPort?: number;
  nodeVersion?: string;
  /** `features.agentModel`; Cursor always runs its `auto` model. */
  agentModel?: string;
  importCursorSdk?: ImportCursorSdk;
  importClaudeSdk?: ImportClaudeSdk;
};

export function createAgentForBackend(
  backend: ActiveAgentBackend,
  options: CreateAgentForBackendOptions = {},
): Promise<AbstractAgent> {
  if (backend === "claude") {
    return createClaudeAbstractAgent({
      mcpHttpUrl: options.mcpHttpUrl,
      apiPort: options.apiPort,
      model: options.agentModel,
      importSdk: options.importClaudeSdk,
    });
  }
  return createCursorAbstractAgent({
    mcpHttpUrl: options.mcpHttpUrl,
    apiPort: options.apiPort,
    nodeVersion: options.nodeVersion,
    importSdk: options.importCursorSdk,
  });
}
