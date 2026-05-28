// miroir-ai public API
export { createCopilotKitRouter } from "./routes/copilotKitRoute.js";
export { buildCopilotRuntime, getDefaultRuntimeConfig } from "./runtime/copilotRuntimeFactory.js";
export { createMiroirCopilotKitActions } from "./tools/miroirCopilotKitActions.js";
export { MIROIR_SYSTEM_PROMPT } from "./prompts/miroirSystemPrompt.js";
export type { AiProviderType, AiRuntimeConfig } from "./runtime/copilotRuntimeFactory.js";
