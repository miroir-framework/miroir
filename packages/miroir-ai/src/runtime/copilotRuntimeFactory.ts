// CopilotRuntime factory — builds the runtime and service adapter from environment config.
// API keys are read from server-side environment variables; they never reach the browser.

import {
  CopilotRuntime,
  OpenAIAdapter,
  AnthropicAdapter,
  GoogleGenerativeAIAdapter,
  type ServiceAdapter,
} from "@copilotkit/runtime";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { miroirTools } from "../tools/miroirTools.js";
import { MIROIR_SYSTEM_PROMPT } from "../prompts/miroirSystemPrompt.js";

export type AiProviderType = "openai" | "anthropic" | "google";

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
  runtime: CopilotRuntime;
  serviceAdapter: ServiceAdapter;
} {
  const { providerType, model, baseUrl } = config;
  const apiKey = getApiKey(providerType);

  let serviceAdapter: ServiceAdapter;

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
      const genAI = new GoogleGenerativeAI(apiKey);
      serviceAdapter = new GoogleGenerativeAIAdapter({ googleGenerativeAI: genAI, model });
      break;
    }
    default: {
      throw new Error(`Unsupported AI provider type: ${providerType}`);
    }
  }

  const runtime = new CopilotRuntime({
    actions: miroirTools,
    middleware: {
      onBeforeRequest: ({ properties }: any) => ({
        properties: {
          ...properties,
          instructions: MIROIR_SYSTEM_PROMPT,
        },
      }),
    },
  });

  return { runtime, serviceAdapter };
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
