// CopilotRuntime factory — builds the runtime and service adapter from environment config.
// API keys are read from server-side environment variables; they never reach the browser.

import {
  CopilotRuntime,
  OpenAIAdapter,
  AnthropicAdapter,
  GoogleGenerativeAIAdapter,
  type CopilotServiceAdapter,
} from "@copilotkit/runtime";
import type { Parameter } from "@copilotkit/shared";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

import { miroirTools } from "../tools/miroirTools.js";

export type AiProviderType = "openai" | "anthropic" | "google" | "github";

export interface AiRuntimeConfig {
  providerType: AiProviderType;
  model: string;
  baseUrl?: string;
}

/**
 * Returns the API key for the given provider from environment variables.
 * Keys are never exposed to the browser.
 */
function getApiKey(providerType: AiProviderType): string {
  const envVarMap: Record<AiProviderType, string> = {
    openai: "AI_OPENAI_KEY",
    anthropic: "AI_ANTHROPIC_KEY",
    google: "AI_GOOGLE_KEY",
    github: "AI_GITHUB_TOKEN",
  };
  const envVar = envVarMap[providerType];
  const key = process.env[envVar];
  if (!key) {
    throw new Error(
      `Missing environment variable ${envVar}. ` +
        `Set it on the server to enable AI features with provider '${providerType}'.`
    );
  }
  return key;
}

/**
 * Builds a CopilotRuntime instance with Miroir tools and the appropriate
 * LLM service adapter for the given provider configuration.
 *
 * Called per-request so that provider/model changes take effect immediately
 * without restarting the server.
 */
export function buildCopilotRuntime(config: AiRuntimeConfig): {
  runtime: CopilotRuntime<Parameter[]>;
  serviceAdapter: CopilotServiceAdapter;
} {
  const { providerType, model, baseUrl } = config;

  const supportedProviders: AiProviderType[] = ["openai", "anthropic", "google", "github"];
  if (!supportedProviders.includes(providerType)) {
    throw new Error(`Unsupported AI provider type: ${providerType}`);
  }

  const apiKey = getApiKey(providerType);

  let serviceAdapter: CopilotServiceAdapter;

  switch (providerType) {
    case "openai": {
      const openai = new OpenAI({ apiKey, ...(baseUrl ? { baseURL: baseUrl } : {}) });
      serviceAdapter = new OpenAIAdapter({ openai, model });
      break;
    }
    case "anthropic": {
      const anthropic = new Anthropic({ apiKey, ...(baseUrl ? { baseURL: baseUrl } : {}) });
      serviceAdapter = new AnthropicAdapter({ anthropic, model });
      break;
    }
    case "google": {
      // GoogleGenerativeAIAdapter manages the Google AI SDK client internally
      serviceAdapter = new GoogleGenerativeAIAdapter({ apiKey, model });
      break;
    }
    case "github": {
      // GitHub Copilot / GitHub Models — OpenAI-compatible API.
      // Default endpoint: https://models.inference.ai.azure.com
      // Auth: personal access token with `models:read` scope (AI_GITHUB_TOKEN).
      const githubBaseUrl = baseUrl ?? "https://models.inference.ai.azure.com";
      const openai = new OpenAI({ apiKey, baseURL: githubBaseUrl });
      serviceAdapter = new OpenAIAdapter({ openai, model });
      break;
    }
    default: {
      throw new Error(`Unsupported AI provider type: ${providerType}`);
    }
  }

  const runtime = new CopilotRuntime({
    actions: miroirTools,
    // System instructions are passed from the frontend via <CopilotKit instructions="...">
    // using the exported MIROIR_SYSTEM_PROMPT constant.
  });

  return { runtime, serviceAdapter };
}

/**
 * Builds a minimal CopilotRuntime with a no-op service adapter.
 * Used for GET runtime-info requests (action discovery) which do not call any AI provider.
 */
export function buildMinimalCopilotRuntime(): {
  runtime: CopilotRuntime<Parameter[]>;
  serviceAdapter: CopilotServiceAdapter;
} {
  // CopilotKit requires the adapter to expose `provider` + `model` so it can build
  // an internal BuiltInAgent for the info/discovery probe. These are hint values only;
  // `process` is never called for info requests, and throws a clear error if it is.
  const noopAdapter: CopilotServiceAdapter = {
    name: "MiroirNoopAdapter",
    provider: "openai",
    model: "gpt-4o",
    process: async () => {
      throw new Error("No AI provider configured. Set AI_PROVIDER_TYPE and AI_MODEL environment variables.");
    },
  };
  const runtime = new CopilotRuntime({ actions: miroirTools });
  return { runtime, serviceAdapter: noopAdapter };
}

/**
 * Default runtime config — reads from environment variables with fallbacks.
 * Allows zero-config startup if environment variables are set.
 */
export function getDefaultRuntimeConfig(): AiRuntimeConfig | null {
  const providerType = process.env["AI_PROVIDER_TYPE"] as AiProviderType | undefined;
  const model = process.env["AI_MODEL"];

  if (!providerType || !model) {
    return null;
  }

  return {
    providerType,
    model,
    baseUrl: process.env["AI_BASE_URL"],
  };
}
