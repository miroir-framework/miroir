// miroir-ai public API
export { createCopilotKitRouter } from "./routes/copilotKitRoute.js";
export { assertCursorSdkPackaged, resolveCursorSdkPackageEntry } from "./runtime/assertCursorSdkPackaged.js";
export type { AssertCursorSdkPackagedOptions } from "./runtime/assertCursorSdkPackaged.js";
export {
  createCursorAbstractAgent,
  createCursorDummyCwd,
  isNodeVersionAtLeast,
  loopbackMcpHttpUrl,
  promptFromRunInput,
} from "./runtime/cursorAgent.js";
export { buildCopilotRuntime, getApiKey, getDefaultRuntimeConfig } from "./runtime/copilotRuntimeFactory.js";
export { createMiroirCopilotKitActions } from "./tools/miroirCopilotKitActions.js";
export { MIROIR_SYSTEM_PROMPT } from "./prompts/miroirSystemPrompt.js";
export type { AiProviderType, AiRuntimeConfig } from "./runtime/copilotRuntimeFactory.js";
