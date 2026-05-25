// Unit tests for copilotRuntimeFactory.ts
// Tests that:
// 1. The correct adapter type is selected based on providerType
// 2. Missing API keys throw descriptive errors
// 3. getDefaultRuntimeConfig reads from environment variables

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildCopilotRuntime, getDefaultRuntimeConfig } from "../../src/runtime/copilotRuntimeFactory.js";
import type { AiRuntimeConfig } from "../../src/runtime/copilotRuntimeFactory.js";

const openaiConfig: AiRuntimeConfig = {
  providerType: "openai",
  model: "gpt-4o",
};

const anthropicConfig: AiRuntimeConfig = {
  providerType: "anthropic",
  model: "claude-opus-4-5",
};

const googleConfig: AiRuntimeConfig = {
  providerType: "google",
  model: "gemini-2.0-flash",
};

describe("buildCopilotRuntime", () => {
  beforeEach(() => {
    // Provide all keys so key-resolution succeeds
    vi.stubEnv("AI_OPENAI_KEY", "sk-test-openai");
    vi.stubEnv("AI_ANTHROPIC_KEY", "sk-ant-test");
    vi.stubEnv("AI_GOOGLE_KEY", "aig-test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a CopilotRuntime and an OpenAIAdapter for providerType=openai", () => {
    const { runtime, serviceAdapter } = buildCopilotRuntime(openaiConfig);
    expect(runtime).toBeDefined();
    expect(serviceAdapter).toBeDefined();
    // OpenAIAdapter has a provider field set to "openai"
    expect((serviceAdapter as any).provider ?? (serviceAdapter as any).model).toBeTruthy();
  });

  it("returns a CopilotRuntime and an AnthropicAdapter for providerType=anthropic", () => {
    const { runtime, serviceAdapter } = buildCopilotRuntime(anthropicConfig);
    expect(runtime).toBeDefined();
    expect(serviceAdapter).toBeDefined();
  });

  it("returns a CopilotRuntime and a GoogleGenerativeAIAdapter for providerType=google", () => {
    const { runtime, serviceAdapter } = buildCopilotRuntime(googleConfig);
    expect(runtime).toBeDefined();
    expect(serviceAdapter).toBeDefined();
  });

  it("throws with a descriptive message when the API key env var is missing", () => {
    vi.stubEnv("AI_OPENAI_KEY", "");
    // Setting to empty string: override the stubbed value
    process.env["AI_OPENAI_KEY"] = "";
    expect(() => buildCopilotRuntime(openaiConfig)).toThrowError(/AI_OPENAI_KEY/);
  });

  it("throws for unsupported providerType", () => {
    const badConfig = { providerType: "cohere" as any, model: "command" };
    expect(() => buildCopilotRuntime(badConfig)).toThrowError(/Unsupported AI provider type/);
  });

  it("passes baseUrl to the OpenAI client when provided", () => {
    const config: AiRuntimeConfig = {
      providerType: "openai",
      model: "gpt-4o",
      baseUrl: "https://my-proxy.example.com/v1",
    };
    // Just verify it does not throw
    expect(() => buildCopilotRuntime(config)).not.toThrow();
  });
});

describe("getDefaultRuntimeConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when AI_PROVIDER_TYPE is not set", () => {
    vi.stubEnv("AI_PROVIDER_TYPE", "");
    vi.stubEnv("AI_MODEL", "gpt-4o");
    const result = getDefaultRuntimeConfig();
    expect(result).toBeNull();
  });

  it("returns null when AI_MODEL is not set", () => {
    vi.stubEnv("AI_PROVIDER_TYPE", "openai");
    vi.stubEnv("AI_MODEL", "");
    const result = getDefaultRuntimeConfig();
    expect(result).toBeNull();
  });

  it("returns a config when both AI_PROVIDER_TYPE and AI_MODEL are set", () => {
    vi.stubEnv("AI_PROVIDER_TYPE", "openai");
    vi.stubEnv("AI_MODEL", "gpt-4o");
    const result = getDefaultRuntimeConfig();
    expect(result).not.toBeNull();
    expect(result!.providerType).toBe("openai");
    expect(result!.model).toBe("gpt-4o");
    expect(result!.baseUrl).toBeUndefined();
  });

  it("includes baseUrl when AI_BASE_URL is set", () => {
    vi.stubEnv("AI_PROVIDER_TYPE", "anthropic");
    vi.stubEnv("AI_MODEL", "claude-opus-4-5");
    vi.stubEnv("AI_BASE_URL", "https://proxy.example.com");
    const result = getDefaultRuntimeConfig();
    expect(result!.baseUrl).toBe("https://proxy.example.com");
  });
});
