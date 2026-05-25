// Express Router for the CopilotKit endpoint.
// Mounted at /api/copilotkit in miroir-server.
//
// The router accepts POST requests from the CopilotKit React frontend.
// Provider config is resolved per-request from the request body's `aiConfig`
// field (if provided) or falls back to environment variable defaults.

import { Router, type Request, type Response, type NextFunction } from "express";
import { copilotRuntimeNodeHttpEndpoint } from "@copilotkit/runtime";

import { buildCopilotRuntime, getDefaultRuntimeConfig, type AiRuntimeConfig } from "../runtime/copilotRuntimeFactory.js";

const ENDPOINT_PATH = "/api/copilotkit";

/**
 * Resolve provider config from the current request.
 * 1. If the request body contains `aiConfig` (set by the frontend via useCopilotReadable),
 *    use it.
 * 2. Otherwise fall back to environment variable defaults.
 * 3. If no config is available, return null and the handler will return 503.
 */
function resolveConfig(req: Request): AiRuntimeConfig | null {
  const bodyConfig = (req as any).body?.aiConfig;
  if (
    bodyConfig &&
    typeof bodyConfig.providerType === "string" &&
    typeof bodyConfig.model === "string"
  ) {
    return {
      providerType: bodyConfig.providerType,
      model: bodyConfig.model,
      baseUrl: bodyConfig.baseUrl ?? undefined,
    };
  }
  return getDefaultRuntimeConfig();
}

export function createCopilotKitRouter(): Router {
  const router = Router();

  router.use(async (req: Request, res: Response, next: NextFunction) => {
    const config = resolveConfig(req);

    if (!config) {
      res.status(503).json({
        error:
          "AI provider not configured. " +
          "Set AI_PROVIDER_TYPE, AI_MODEL, and the corresponding API key " +
          "environment variable on the server, or configure an AiConfiguration " +
          "instance in the admin deployment.",
      });
      return;
    }

    let runtime: ReturnType<typeof buildCopilotRuntime>["runtime"];
    let serviceAdapter: ReturnType<typeof buildCopilotRuntime>["serviceAdapter"];

    try {
      ({ runtime, serviceAdapter } = buildCopilotRuntime(config));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(503).json({ error: `AI configuration error: ${message}` });
      return;
    }

    const handler = copilotRuntimeNodeHttpEndpoint({
      endpoint: ENDPOINT_PATH,
      runtime,
      serviceAdapter,
    });

    return handler(req, res, next);
  });

  return router;
}
