// miroir-ai public API
export { createCopilotKitRouter } from "./routes/copilotKitRoute.js";
export {
  AGENT_SDK_PACKAGES,
  assertAgentSdkPackaged,
  resolveAgentSdkPackageEntry,
} from "./runtime/assertAgentSdkPackaged.js";
export type { AssertAgentSdkPackagedOptions } from "./runtime/assertAgentSdkPackaged.js";
export { loopbackMcpHttpUrl, promptFromRunInput } from "./runtime/agentBridge.js";
export { createAgentForBackend } from "./runtime/agentBackends.js";
export type { ActiveAgentBackend, CreateAgentForBackendOptions } from "./runtime/agentBackends.js";
export { createClaudeAbstractAgent, DEFAULT_CLAUDE_AGENT_MODEL } from "./runtime/claudeAgent.js";
export { createCursorAbstractAgent, createCursorDummyCwd, isNodeVersionAtLeast } from "./runtime/cursorAgent.js";
export { buildCopilotRuntime, getApiKey, getDefaultRuntimeConfig } from "./runtime/copilotRuntimeFactory.js";
export { createMiroirCopilotKitActions } from "./tools/miroirCopilotKitActions.js";
export { MIROIR_SYSTEM_PROMPT } from "./prompts/miroirSystemPrompt.js";
export type { AiProviderType, AiRuntimeConfig } from "./runtime/copilotRuntimeFactory.js";
