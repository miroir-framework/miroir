/**
 * Fail-loud check that the agent SDK of the configured backend can be resolved on the
 * persistence process. Packaged Electron builds ship no agent SDK (#275, #409); this throws at
 * start instead of failing later inside a dynamic import.
 */

import { existsSync } from "node:fs";
import { createRequire } from "node:module";

import type { AgentBackend } from "miroir-core";

export const AGENT_SDK_PACKAGES: Record<Exclude<AgentBackend, "none">, string> = {
  cursor: "@cursor/sdk",
  claude: "@anthropic-ai/claude-agent-sdk",
};

export type AssertAgentSdkPackagedOptions = {
  existsSync?: (path: string) => boolean;
  resolveSdkPath?: (specifier: string) => string | undefined;
};

export function resolveAgentSdkPackageEntry(specifier: string): string | undefined {
  try {
    return createRequire(import.meta.url).resolve(specifier);
  } catch {
    try {
      // ESM-only packages have no `require` export condition.
      return new URL(import.meta.resolve(specifier)).pathname;
    } catch {
      return undefined;
    }
  }
}

export function assertAgentSdkPackaged(
  agentBackend: AgentBackend,
  options: AssertAgentSdkPackagedOptions = {},
): void {
  if (agentBackend === "none") {
    return;
  }
  const specifier = AGENT_SDK_PACKAGES[agentBackend];
  const resolveSdkPath = options.resolveSdkPath ?? resolveAgentSdkPackageEntry;
  const pathExists = options.existsSync ?? existsSync;
  const sdkPath = resolveSdkPath(specifier);
  if (!sdkPath || !pathExists(sdkPath)) {
    throw new Error(
      `Agent SDK is not packaged: could not resolve ${specifier}` +
        (sdkPath ? ` at ${sdkPath}` : "") +
        `. features.agentBackend is "${agentBackend}", but packaged Electron builds ship no agent SDK:` +
        ` use the development app or set features.agentBackend to "none".`,
    );
  }
}
