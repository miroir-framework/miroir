// Express Router for the CopilotKit endpoint.
// Mounted at /api/copilotkit in miroir-server.
//
// The router accepts POST requests from the CopilotKit React frontend.
// Provider config is resolved per-request from the request body's `aiConfig`
// field (if provided) or falls back to environment variable defaults.

import { Router, type Request, type Response, type NextFunction } from "express";
import { CopilotRuntime, copilotRuntimeNodeHttpEndpoint } from "@copilotkit/runtime";
import type { AbstractAgent } from "@ag-ui/client";
import type { Action, Parameter } from "@copilotkit/shared";
import {
  Action2Error,
  assertProcessCapability,
  defaultMetaModelEnvironment,
  FAIL_CLOSED_PROCESS_CAPABILITIES,
  isCursorBackendAllowed,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type ProcessCapabilities,
  type ProcessCapabilityName,
} from "miroir-core";
import {
  buildCopilotRuntime,
  buildMinimalCopilotRuntime,
  getDefaultRuntimeConfig,
  type AiRuntimeConfig,
} from "../runtime/copilotRuntimeFactory.js";
import { createMiroirCopilotKitActions, createLendDocumentExecutor } from "../tools/miroirCopilotKitActions.js";
import {
  createCursorAbstractAgent as createDefaultCursorAbstractAgent,
  type ImportCursorSdk,
} from "../runtime/cursorAgent.js";

const CURSOR_RUNTIME_EXCLUDED_ACTION_NAMES = new Set([
  "generateMiroirReport",
  "getMiroirContext",
]);

export type CreateCopilotKitRouterOptions = {
  capabilities?: ProcessCapabilities;
  getCapabilities?: () => ProcessCapabilities;
  createCursorAbstractAgent?: () => AbstractAgent | Promise<AbstractAgent>;
  mcpHttpUrl?: string;
  apiPort?: number;
  nodeVersion?: string;
  importSdk?: ImportCursorSdk;
  createCopilotRuntime?: (options: {
    agents: { cursor: AbstractAgent };
    actions: Action<Parameter[]>[];
  }) => unknown;
  buildCopilotRuntime?: typeof buildCopilotRuntime;
  copilotRuntimeNodeHttpEndpoint?: typeof copilotRuntimeNodeHttpEndpoint;
};

/**
 * Resolve the CopilotKit backend pick from a 1.59 request envelope.
 * 1. forwardedProps on the nested body (properties sent by the client)
 * 2. top-level request aiConfig backend (fallback)
 */
export function resolveBackendPick(req: Request): "cursor" | undefined {
  const forwardedBackend = (req as any).body?.body?.forwardedProps?.aiConfig?.backend;
  if (forwardedBackend === "cursor") {
    return "cursor";
  }
  const topLevelBackend = (req as any).body?.aiConfig?.backend;
  if (topLevelBackend === "cursor") {
    return "cursor";
  }
  return undefined;
}

function resolveInjectedCapabilities(
  options?: CreateCopilotKitRouterOptions,
): ProcessCapabilities {
  if (options?.getCapabilities) {
    return options.getCapabilities();
  }
  return options?.capabilities ?? FAIL_CLOSED_PROCESS_CAPABILITIES;
}

function cursorRefuseCapability(snapshot: ProcessCapabilities): ProcessCapabilityName {
  if (snapshot.cursor !== true) {
    return "cursor";
  }
  if (snapshot.mcp !== true) {
    return "mcp";
  }
  return "cursor";
}

function filterCursorRuntimeActions(actions: Action<Parameter[]>[]): Action<Parameter[]>[] {
  return actions.filter((action) => !CURSOR_RUNTIME_EXCLUDED_ACTION_NAMES.has(action.name));
}

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

export function createCopilotKitRouter(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  options?: CreateCopilotKitRouterOptions,
): Router {
  const actions = createMiroirCopilotKitActions(domainController, applicationDeploymentMap);
  const lendDocumentExecutor = createLendDocumentExecutor(domainController, applicationDeploymentMap);
  const buildTokenRuntime = options?.buildCopilotRuntime ?? buildCopilotRuntime;
  const nodeHttpEndpoint =
    options?.copilotRuntimeNodeHttpEndpoint ?? copilotRuntimeNodeHttpEndpoint;
  const createRuntime =
    options?.createCopilotRuntime ??
    ((runtimeOptions) => new CopilotRuntime(runtimeOptions));

  const router = Router();

  // REST endpoint called by the frontend useCopilotAction("lendDocument") handler.
  // CopilotKit in agent/run mode forwards ALL tool calls to the frontend; this endpoint
  // is what the frontend's useCopilotAction handler calls to actually execute the action.
  router.post("/lendDocument", async (req: Request, res: Response) => {
    try {
      const result = await lendDocumentExecutor(req.body);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", message: `Internal error: ${message}` });
    }
  });

  // REST endpoint: look up entity instances by name (partial, case-insensitive).
  // Called from the frontend useCopilotAction("findLibraryInstanceByName") handler.
  // Returns:
  //   { status: "not_found", message }             — 0 matches
  //   { status: "single", uuid, name, instance }   — exactly 1 match
  //   { status: "multiple", count, instances, message } — 2–10 matches
  //   { status: "too_many", count, message }        — > 10 matches
  router.post("/findInstanceByName", async (req: Request, res: Response) => {
    try {
      const {
        entityUuid,
        entityParentName,
        namePattern,
        applicationUuid,
        deploymentUuid,
        applicationSection,
      } = req.body as {
        entityUuid?: string;
        entityParentName?: string;
        namePattern?: string;
        applicationUuid?: string;
        deploymentUuid?: string;
        applicationSection?: string;
      };

      if (!entityUuid || !namePattern || !applicationUuid) {
        res.status(400).json({
          status: "error",
          message: "Missing required parameters: entityUuid, namePattern, applicationUuid",
        });
        return;
      }

      const section = applicationSection ?? "data";

      // Ensure the target application is in the deployment map.
      // The client should always supply deploymentUuid (obtained via lookupDeploymentByApplicationUuid);
      // we fall back to the server-side map only as a convenience.
      const resolvedDeploymentUuid = deploymentUuid ?? applicationDeploymentMap[applicationUuid];

      if (!resolvedDeploymentUuid) {
        res.status(400).json({
          status: "error",
          message:
            `Cannot resolve deployment UUID for application "${applicationUuid}". ` +
            "Call lookupDeploymentByApplicationUuid first to obtain the deploymentUuid.",
        });
        return;
      }

      const targetDeploymentMap: ApplicationDeploymentMap = {
        ...applicationDeploymentMap,
        [applicationUuid]: resolvedDeploymentUuid,
      };

      const runQuery = {
        actionType: "runBoxedQueryAction" as const,
        endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        payload: {
          application: applicationUuid,
          applicationSection: section,
          queryExecutionStrategy: "storage" as const,
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer" as const,
            application: applicationUuid,
            contextResults: {},
            pageParams: { applicationSection: section },
            queryParams: {},
            extractors: {
              results: {
                extractorOrCombinerType: "extractorInstancesByEntity" as const,
                applicationSection: section,
                parentName: entityParentName ?? "",
                parentUuid: entityUuid,
                filter: {
                  attributeName: "name",
                  value: namePattern,
                },
              },
            },
          },
        },
      };

      const result = await domainController.handleBoxedExtractorOrQueryAction(
        runQuery as any,
        targetDeploymentMap,
        defaultMetaModelEnvironment,
      );

      if (result instanceof Action2Error || (result as any).status === "error") {
        res.status(500).json({
          status: "error",
          message:
            (result as any).errorMessage ?? (result as any).message ?? "Query execution failed",
        });
        return;
      }

      // Result shape for boxedQueryWithExtractorCombinerTransformer:
      //   returnedDomainElement = { results: EntityInstancesUuidIndex }
      const instancesMap: Record<string, any> =
        (result as any).returnedDomainElement?.results ?? {};
      const instances: Array<{ uuid?: string; name?: string }> = Object.values(instancesMap);

      if (instances.length === 0) {
        res.json({
          status: "not_found",
          message: `No ${entityParentName ?? "entity"} matching "${namePattern}" was found.`,
        });
      } else if (instances.length === 1) {
        const inst = instances[0];
        res.json({ status: "single", uuid: inst.uuid, name: inst.name, instance: inst });
      } else if (instances.length <= 10) {
        res.json({
          status: "multiple",
          count: instances.length,
          instances: instances.map((i) => ({ uuid: i.uuid, name: i.name })),
          message: `Found ${instances.length} ${entityParentName ?? "entity"} matches for "${namePattern}". Please specify which one.`,
        });
      } else {
        res.json({
          status: "too_many",
          count: instances.length,
          message: `Too many matches (${instances.length}) for "${namePattern}". Please be more specific.`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", message: `Internal error: ${message}` });
    }
  });

  // Health/config check endpoint — GET /api/copilotkit/health
  // Returns whether an AI provider is configured, with a human-readable message.
  router.get("/health", (_req: Request, res: Response) => {
    const config = getDefaultRuntimeConfig();
    if (config) {
      res.json({ configured: true, provider: config.providerType, model: config.model });
    } else {
      res.status(503).json({
        configured: false,
        message:
          "AI provider not configured. " +
          "Set AI_PROVIDER_TYPE, AI_MODEL, and the corresponding API key " +
          "environment variable on the server (AI_OPENAI_KEY / AI_ANTHROPIC_KEY / AI_GOOGLE_KEY / AI_GITHUB_TOKEN / CURSOR_API_KEY).",
      });
    }
  });

  router.use(async (req: Request, res: Response, next: NextFunction) => {
    // Runtime-info discovery is a POST with { method: "info" } — no AI call needed.
    // Using the minimal no-op runtime lets CopilotKit enumerate available actions
    // without requiring an AI provider to be configured at startup.
    if (req.body?.method === "info") {
      const { runtime, serviceAdapter } = buildMinimalCopilotRuntime(actions);
      const handler = nodeHttpEndpoint({ endpoint: "/", runtime, serviceAdapter });
      try {
        return await handler(req as any, res as any);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!res.headersSent) res.status(500).json({ error: `AI runtime error: ${message}` });
        return;
      }
    }

    if (resolveBackendPick(req) === "cursor") {
      const snapshot = resolveInjectedCapabilities(options);
      if (!isCursorBackendAllowed(snapshot)) {
        const refused = assertProcessCapability(cursorRefuseCapability(snapshot), snapshot);
        if (refused) {
          res.status(403).json(refused);
          return;
        }
      }

      const createCursorAbstractAgent =
        options?.createCursorAbstractAgent ??
        (() =>
          createDefaultCursorAbstractAgent({
            mcpHttpUrl: options?.mcpHttpUrl,
            apiPort: options?.apiPort,
            nodeVersion: options?.nodeVersion,
            importSdk: options?.importSdk,
          }));

      let runtime: ReturnType<typeof createRuntime>;
      try {
        runtime = createRuntime({
          agents: { cursor: await createCursorAbstractAgent() },
          actions: filterCursorRuntimeActions(actions),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.status(503).json({ error: `AI configuration error: ${message}` });
        return;
      }

      const handler = nodeHttpEndpoint({
        endpoint: "/",
        runtime: runtime as any,
      });

      try {
        return await handler(req as any, res as any);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!res.headersSent) res.status(500).json({ error: `AI runtime error: ${message}` });
      }
      return;
    }

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

    let runtime: ReturnType<typeof buildTokenRuntime>["runtime"];
    let serviceAdapter: ReturnType<typeof buildTokenRuntime>["serviceAdapter"];

    try {
      ({ runtime, serviceAdapter } = buildTokenRuntime(config, actions));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(503).json({ error: `AI configuration error: ${message}` });
      return;
    }

    const handler = nodeHttpEndpoint({
      endpoint: "/",
      runtime,
      serviceAdapter,
    });

    try {
      return await handler(req as any, res as any);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!res.headersSent) res.status(500).json({ error: `AI runtime error: ${message}` });
    }
  });

  return router;
}
