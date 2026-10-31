import bodyParser from "body-parser";
import cors from "cors";
import express, { type Express, type Request, type RequestHandler } from "express";
import { existsSync } from "node:fs";
import type { ServerResponse } from "node:http";
import path from "node:path";

import {
  ACCESS_DENIED,
  accessDirectoryLoader,
  authenticateRequest,
  authorizeDeployment,
  bigintJsonReplacer,
  bigintJsonReviver,
  buildAuthStatusBody,
  ConfigurationService,
  createIdentityGateMiddleware,
  deploymentUuidsFromHttpRequest,
  getClientEnvironment,
  getProcessCapabilities,
  getProcessTokenSecret,
  loadAccessDirectory,
  loginWithPassword,
  MiroirLoggerFactory,
  persistChangedPasswordHash,
  persistPasswordChange,
  restServerDefaultHandlers,
  shouldMountMcpHttp,
  type ApplicationDeploymentMap,
  type AuthenticationGate,
  type AuthPrincipal,
  type DomainControllerInterface,
  type LoggerInterface,
  type MiroirConfigServer,
  type PersistenceStoreControllerManagerInterface,
  type ProcessCapabilities,
} from "miroir-core";
import { EndpointToolRegistry, setupMcpServer, type MiroirMcpServer } from "miroir-mcp";

const packageName = "miroir-server-library";
const loggerName = MiroirLoggerFactory.getLoggerName(packageName, "info", "createMiroirServerApp");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(loggerName);
MiroirLoggerFactory.registerLoggerToStart(loggerName).then((logger: LoggerInterface) => {
  log = logger;
});

/**
 * What the host gives the factory. The library reads no `process.env` and no `process.argv`:
 * everything comes through these fields.
 *
 * Preconditions: the store sections are registered on `ConfigurationService.configurationService`,
 * the deployments of `applicationDeploymentMap` are open in `domainController`, and the token
 * secret is set (`setProcessTokenSecret`).
 *
 * @public
 */
export interface MiroirServerAppOptions {
  domainController: DomainControllerInterface;
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  miroirConfig: MiroirConfigServer;
  /** The process capabilities, computed by the host (which also sets them on the domain controller). */
  capabilities: ProcessCapabilities;
  /** Resolved switches: the host decides how (command line, environment, config file). */
  authentication: { enabled: boolean; mcpEnabled: boolean };
  /** Origins allowed by CORS; no CORS middleware when absent. */
  corsAllowedOrigins?: string[];
  /** Static files served under `mountPath` (for instance `/assets`); not served when absent. */
  assets?: { directory: string; mountPath: string };
  /**
   * A built client (with an `index.html`), served after every API route, with `index.html` for any
   * other GET path (client-side routing); not served when absent.
   */
  clientDirectory?: string;
  /**
   * The host's assistant route (CopilotKit in miroir-server), registered after `/mcp` and before
   * the client folder. `requestGate` is the identity gate of {@link MiroirServerApp}.
   */
  assistantRoute?: (
    app: Express,
    context: { requestGate: RequestHandler; capabilities: ProcessCapabilities },
  ) => Promise<void>;
}

/**
 * Miroir's HTTP surface, not listening.
 *
 * Mount rules:
 * - mount `app` at the host's root (`hostApp.use(app)`): the client and `/mcp` URLs assume it;
 * - mount it before any host body parser: the first body parser to run wins, and Miroir's keeps
 *   BigInt values whole and accepts 50 MB bodies.
 *
 * @public
 */
export interface MiroirServerApp {
  app: Express;
  /** The gate shared by REST, MCP and the host's own routes: identity, then access per deployment. */
  authenticationGate: AuthenticationGate;
  /** Express middleware answering 401 without a valid token when authentication is on. */
  requestGate: RequestHandler;
  /**
   * The MCP server behind `/mcp`. `/mcp` is on `app` when the `mcp` capability is on; the host may
   * also start the dedicated MCP listener with `mcpServer.run(port)`.
   */
  mcpServer: MiroirMcpServer;
  /** Releases what the factory started. */
  close(): Promise<void>;
}

interface MiroirHttpRequest extends Request {
  body: any;
  originalUrl: string;
  params: Record<string, any>;
}

function corsMiddleware(corsAllowedOrigins: string[]): RequestHandler {
  return cors({
    origin: corsAllowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}

function mountStatusRoutes(app: Express, options: MiroirServerAppOptions): void {
  app.get("/auth/status", (_request, response) => {
    response.json(buildAuthStatusBody(options.authentication.enabled));
  });
  // recomputed per request: a store type registered later shows up
  app.get("/capabilities", (_request, response) => {
    const capabilities = getProcessCapabilities({
      config: options.miroirConfig,
      environment: getClientEnvironment(),
      storeSectionFactoryRegister: ConfigurationService.configurationService.StoreSectionFactoryRegister,
      adminStoreFactoryRegister: ConfigurationService.configurationService.adminStoreFactoryRegister,
    });
    response.status(200).json({ status: "ok", capabilities });
  });
}

/** Long cache for static files; none for HTML, so a new client build shows at once. */
function staticFolder(directory: string): RequestHandler {
  return express.static(directory, {
    maxAge: "1d",
    setHeaders: (response: ServerResponse, filePath: string) => {
      if (filePath.endsWith(".html")) {
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  });
}

function mountAssets(app: Express, options: MiroirServerAppOptions): void {
  if (!options.assets) {
    return;
  }
  log.info(`Mounting static assets at ${options.assets.mountPath} -> ${options.assets.directory}`);
  app.use(options.assets.mountPath, staticFolder(options.assets.directory));
}

/** The client's `index.html`; a missing build fails the factory before anything starts. */
function clientIndexPath(clientDirectory: string): string {
  const indexPath = path.join(clientDirectory, "index.html");
  if (!existsSync(indexPath)) {
    throw new Error(
      `React client build not found at ${indexPath}. Please run "npm run build" in the miroir-standalone-app package and ensure the output is copied to the server's client directory.`,
    );
  }
  return indexPath;
}

/** MUST come after every API, MCP and assistant route: its catch-all answers any GET path. */
function mountClient(app: Express, client: { directory: string; indexPath: string }): void {
  log.info(`Serving the client from ${client.directory}`);
  app.use(staticFolder(client.directory));
  app.get("/{*splat}", (_request, response) => {
    if (existsSync(client.indexPath)) {
      response.sendFile(client.indexPath);
    } else {
      response.status(404).send('React client build not found. Run "npm run build" first.');
    }
  });
}

function directoryMissing(response: any, errorMessage: string): void {
  response.status(500).json({
    status: "error",
    errorType: "AuthenticationDirectoryMissing",
    errorMessage,
  });
}

function mountAuthenticationRoutes(app: Express, options: MiroirServerAppOptions, authenticationGate: AuthenticationGate): void {
  const { domainController, applicationDeploymentMap } = options;

  async function resolveGatedPrincipal(authorizationHeader: string | undefined): Promise<AuthPrincipal | undefined> {
    const authenticated = await authenticateRequest({ ...authenticationGate, enabled: true }, authorizationHeader);
    return authenticated.allowed ? authenticated.principal : undefined;
  }

  app.post("/auth/login", async (request: MiroirHttpRequest, response: any) => {
    const identity = await loadAccessDirectory(domainController, applicationDeploymentMap);
    if (!identity.ok) {
      directoryMissing(response, identity.errorMessage);
      return;
    }
    const result = await loginWithPassword(
      {
        username: String(request.body?.username ?? ""),
        password: String(request.body?.password ?? ""),
      },
      identity.directory,
      getProcessTokenSecret(),
    );
    if (!result.ok) {
      response.status(result.status).json(result.body);
      return;
    }
    response.json({ token: result.token, principal: result.principal });
  });

  app.post("/auth/change-password", async (request: MiroirHttpRequest, response: any) => {
    const principal = await resolveGatedPrincipal(
      typeof request.headers?.authorization === "string" ? request.headers.authorization : undefined,
    );
    if (!principal) {
      response.status(401).json({ status: "error", errorType: "AuthenticationRequired" });
      return;
    }
    const identity = await loadAccessDirectory(domainController, applicationDeploymentMap);
    if (!identity.ok) {
      directoryMissing(response, identity.errorMessage);
      return;
    }
    const changed = await persistChangedPasswordHash({
      directory: identity.directory,
      principal,
      currentPassword: String(request.body?.currentPassword ?? ""),
      newPassword: String(request.body?.newPassword ?? ""),
    });
    if (!changed.ok) {
      response.status(changed.status).json(changed.body);
      return;
    }
    const updatedHash = changed.directory.credentials.find(
      (row) => row.miroirUser === principal.miroirUserUuid,
    )?.passwordHash;
    const persisted =
      !!updatedHash &&
      (await persistPasswordChange(domainController, applicationDeploymentMap, {
        principal,
        credentialsValue: identity.credentialsValue,
        passwordHash: updatedHash,
      }));
    if (!persisted) {
      response.status(401).json({ status: "error", errorType: "AuthenticationFailed" });
      return;
    }
    response.json({ changed: true });
  });
}

async function setupMcp(
  app: Express,
  options: MiroirServerAppOptions,
  authenticationGate: AuthenticationGate,
): Promise<MiroirMcpServer> {
  const endpointToolRegistry = new EndpointToolRegistry(options.domainController, options.applicationDeploymentMap);
  // the dedicated MCP app: no BigInt reviver or replacer, as before #636
  const mcpApp = express();
  if (options.corsAllowedOrigins) {
    mcpApp.use(corsMiddleware(options.corsAllowedOrigins));
  }
  mcpApp.use(bodyParser.json({ limit: "50mb" }));
  // #263: MCP has its own switch, under the global one
  const mcpAuthenticationGate: AuthenticationGate = { ...authenticationGate, enabled: options.authentication.mcpEnabled };
  const mcpServer = await setupMcpServer(
    mcpApp,
    options.applicationDeploymentMap,
    endpointToolRegistry,
    options.domainController,
    mcpAuthenticationGate,
  );
  if (shouldMountMcpHttp(options.capabilities.mcp)) {
    mcpServer.mountHttpRoutes(app, mcpAuthenticationGate);
  }
  return mcpServer;
}

function mountRestHandlers(app: Express, options: MiroirServerAppOptions, authenticationGate: AuthenticationGate): void {
  for (const op of restServerDefaultHandlers) {
    const operationHandler = async (request: MiroirHttpRequest, response: any) => {
      const authorizationHeader =
        typeof request.headers?.authorization === "string" ? request.headers.authorization : undefined;
      const authenticated = await authenticateRequest(authenticationGate, authorizationHeader);
      if (!authenticated.allowed) {
        response.status(authenticated.status).json(authenticated.body);
        return;
      }
      const principal = authenticated.principal;
      const access = authorizeDeployment(
        options.authentication.enabled,
        authenticated,
        deploymentUuidsFromHttpRequest(request),
      );
      if (!access.allowed) {
        log.warn(
          `access denied: user=${principal?.username ?? "anonymous"} deployments=${deploymentUuidsFromHttpRequest(request).join(",") || "(none)"} url=${request.originalUrl}`,
        );
        response.status(access.status).json(access.body ?? ACCESS_DENIED);
        return;
      }
      log.info(`[REQUEST START] ${op.method} ${request.originalUrl} - params:`, JSON.stringify(request.params));
      try {
        await op.handler(
          true, // on the server, the local cache is the intermediate step to the persistence store
          (response: any) => response.json.bind(response),
          response,
          options.persistenceStoreControllerManager,
          options.domainController,
          op.method,
          request.originalUrl,
          request.body,
          { ...request.params, ...request.query, authPrincipal: principal },
        );
        log.info(`[AFTER HANDLER] ${op.method} ${request.originalUrl}`);
      } catch (error) {
        log.error(`server could not handle action: ${op.method} on URL: ${op.url} error: ${error}`);
        if (response.headersSent) {
          log.warn(`cannot send error response for ${request.originalUrl}: headers already sent`);
          return;
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        try {
          response.status(500).json({
            status: "error",
            errorType: "ServerError",
            errorMessage: `Failed to handle ${op.method} request on ${request.originalUrl}: ${errorMessage}`,
            timestamp: new Date().toISOString(),
          });
        } catch (responseError) {
          log.error(`failed to send error response: ${responseError}`);
        }
      }
    };
    (app as any)[op.method](op.url, operationHandler);
  }
}

/**
 * Builds Miroir's HTTP surface from a running domain controller, without listening.
 * See {@link MiroirServerApp} for the mount rules and {@link MiroirServerAppOptions} for the
 * preconditions.
 *
 * @public
 */
export async function createMiroirServerApp(options: MiroirServerAppOptions): Promise<MiroirServerApp> {
  const app = express();
  if (options.corsAllowedOrigins) {
    app.use(corsMiddleware(options.corsAllowedOrigins));
  }
  // BigInt values cross the wire as {"$bigint": "<digits>"}, both ways, so none loses digits (#48)
  app.set("json replacer", bigintJsonReplacer);
  app.use(bodyParser.json({ limit: "50mb", reviver: bigintJsonReviver }));

  // #263: one gate for REST, CopilotKit and MCP; the Admin directory is read on every gated request.
  const authenticationGate: AuthenticationGate = {
    enabled: options.authentication.enabled,
    loadDirectory: accessDirectoryLoader(options.domainController, options.applicationDeploymentMap),
  };
  const identityGate = createIdentityGateMiddleware(authenticationGate);
  const requestGate: RequestHandler = (request, response, next) => identityGate(request, response, () => next());

  const client = options.clientDirectory
    ? { directory: options.clientDirectory, indexPath: clientIndexPath(options.clientDirectory) }
    : undefined;
  mountStatusRoutes(app, options);
  mountAssets(app, options);
  mountRestHandlers(app, options, authenticationGate);
  mountAuthenticationRoutes(app, options, authenticationGate);
  const mcpServer = await setupMcp(app, options, authenticationGate);
  // AI / CopilotKit: after the API routes and MCP, before the client catch-all
  await options.assistantRoute?.(app, { requestGate, capabilities: options.capabilities });
  if (client) {
    mountClient(app, client);
  }

  let closed = false;
  return {
    app,
    authenticationGate,
    requestGate,
    mcpServer,
    close: async () => {
      if (closed) {
        return;
      }
      closed = true;
      await mcpServer.shutdown();
    },
  };
}
