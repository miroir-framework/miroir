import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Request } from 'express';
import { existsSync, readFileSync } from 'fs';
import * as https from 'https';
import loglevelnextLib from 'loglevelnext'; // TODO: use this? or plain "console" log?
import path from 'path';
import { fileURLToPath } from 'url';

import { createCopilotKitRouter } from "miroir-ai";
import {
  Action2Error,
  type ApplicationDeploymentMap,
  circularReplacer,
  ConfigurationService,
  defaultLevels,
  defaultMetaModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  type Deployment,
  getMiroirEnvironmentMode,
  LoggerFactoryInterface,
  LoggerInterface,
  LoggerOptions,
  MiroirActivityTracker,
  MiroirConfigServer,
  MiroirContext,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManager,
  ACCESS_DENIED,
  ALWAYS_ALLOW_APPLICATION_TARGETS,
  AUTH_CHANGE_PASSWORD_ACTION_LABEL,
  accessGrantsFromInstances,
  assertAccessForDeployment,
  assertRequestAllowed,
  bindPrincipalToDirectory,
  buildAuthStatusBody,
  deploymentsFromInstances,
  ENTITY_DEPLOYMENT_UUID,
  ENTITY_MIROIR_RIGHT_UUID,
  ENTITY_MIROIR_SECRET_UUID,
  ENTITY_MIROIR_USER_CREDENTIAL_UUID,
  ENTITY_MIROIR_USER_UUID,
  deploymentUuidFromHttpRequest,
  extractPrincipalFromAuthorizationHeader,
  findCredentialInstance,
  getProcessTokenSecret,
  identityDirectoryFromInstances,
  loginWithPassword,
  persistChangedPasswordHash,
  ParseServerArgsError,
  hydrateSecrets,
  parseServerArgs,
  registerSecrets,
  resolveAuthenticationEnabled,
  restServerDefaultHandlers,
  setProcessTokenSecret,
  setSecretsMasterKey,
  SpecificLoggerOptionsMap,
  StoreOrBundleAction,
  StoreUnitConfiguration,
  templateEvaluationParams,
} from "miroir-core";
import {
  adminSelfApplication,
  deployment_Admin,
  deployment_Miroir,
  entityDeployment,
} from "miroir-test-app_deployment-admin";

import { EndpointToolRegistry, setupMcpServer } from "miroir-mcp";
import { setupMiroirDomainController } from 'miroir-localcache-redux';
import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirMongoDbStoreSectionStartup } from 'miroir-store-mongodb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';

const packageName = "server"
const cleanLevel = "5"

// Consolidated log presets live in miroir-standalone-app/config/logging.
// Server selects one via MIROIR_LOG_CONFIG / VITE_MIROIR_LOG_CONFIG_FILENAME
// (preset name like "scope-query", or a path to a config JSON). Defaults to
// the quiet "catch-all". Kept repo-local to avoid a new package dependency.
function resolveServerLogConfig(): LoggerOptions {
  const fallback: LoggerOptions = {
    defaultLevel: "WARN",
    defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
    specificLoggerOptions: {},
  };
  const selection =
    process.env.MIROIR_LOG_CONFIG ?? process.env.VITE_MIROIR_LOG_CONFIG_FILENAME;
  if (!selection) {
    return fallback;
  }
  try {
    const base = selection.replace(/\.json$/i, "");
    const presetPath = selection.includes("/") || selection.includes("\\")
      ? selection
      : path.resolve(
          process.cwd(),
          `packages/miroir-standalone-app/config/logging/${base}.json`,
        );
    const abs = path.isAbsolute(presetPath) ? presetPath : path.resolve(process.cwd(), presetPath);
    if (!existsSync(abs)) {
      return fallback;
    }
    const parsed = JSON.parse(readFileSync(abs, "utf8")) as Partial<LoggerOptions>;
    return {
      defaultLevel: (parsed.defaultLevel as LoggerOptions["defaultLevel"]) ?? "WARN",
      defaultTemplate: parsed.defaultTemplate ?? "[{{time}}] {{level}} ({{name}}) -",
      specificLoggerOptions: parsed.specificLoggerOptions ?? {},
    };
  } catch {
    return fallback;
  }
}

const loggerOptions: LoggerOptions = resolveServerLogConfig();

const loglevelnext: LoggerFactoryInterface = loglevelnextLib as any as LoggerFactoryInterface;

// MiroirLoggerFactory.setEffectiveLoggerFactoryWithLogLevelNext(
//   loglevelnext,
//   defaultLevels.INFO,
//   "[{{time}}] {{level}} ({{name}}) -",
//   specificLoggerOptions,
// );

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Server");
let myLogger: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => { myLogger = logger; });

// Argument parsing
function printUsageAndExit(exitCode = 1): never {
  console.error(`Usage: node server.js [OPTIONS]`);
  myLogger.error(``);
  console.error(`OPTIONS:`);
  console.error(`  --config   <path>   Path to the server config JSON file`);
  myLogger.error(`                      (default: ../config/miroirConfig.server.json)`);
  console.error(`  --certsdir <dir>    Directory containing TLS certificate files`);
  myLogger.error(`                      (default: <repo-root>/certs/)`);
  console.error(`  --cert     <path>   Path to the TLS certificate file (.pem)`);
  console.error(`                      Overrides --certsdir. Also reads from env: MIROIR_TLS_CERT`);
  myLogger.error(`                      (default: <certsdir>/localhost.pem)`);
  console.error(`  --key      <path>   Path to the TLS private key file (.pem)`);
  console.error(`                      Overrides --certsdir. Also reads from env: MIROIR_TLS_KEY`);
  myLogger.error(`                      (default: <certsdir>/localhost-key.pem)`);
  console.error(`  --secret   <name>=<value>  Named secret (repeatable). Env fallback: MIROIR_SECRET_<NAME>`);
  console.error(`  --secrets-master-key <value>  Wrapping key for persisted secrets. Env: MIROIR_SECRETS_MASTER_KEY`);
  console.error(`  --disable-auth      Disable user authentication (today's open API)`);
  console.error(`  --enable-auth       Enable user authentication (overrides config/env)`);
  console.error(`  -h, --help          Show this help message and exit`);
  process.exit(exitCode);
}

let configFilePath = "../config/miroirConfig.server.json";
let argCertsDir: string | undefined;
let argCertFile: string | undefined;
let argKeyFile: string | undefined;
let registeredSecretNames: string[] = [];
let secretsMasterKey: string | undefined;

try {
  const parsed = parseServerArgs(process.argv.slice(2), process.env);
  if (parsed.help) {
    printUsageAndExit(0);
  }
  configFilePath = parsed.configFilePath;
  argCertsDir = parsed.certsDir;
  argCertFile = parsed.certFile;
  argKeyFile = parsed.keyFile;
  registerSecrets(parsed.secrets);
  registeredSecretNames = Object.keys(parsed.secrets);
  secretsMasterKey = parsed.secretsMasterKey;
  if (secretsMasterKey) {
    setSecretsMasterKey(secretsMasterKey);
  }
} catch (error) {
  if (error instanceof ParseServerArgsError) {
    console.error(`Error: ${error.message}`);
    printUsageAndExit();
  }
  throw error;
}

console.log(`Server startup parameters:`);
console.log(`  --config   : ${configFilePath}`);
console.log(`  --certsdir : ${argCertsDir ?? '(default: <repo-root>/certs/)'}`);
console.log(`  --cert     : ${argCertFile ?? process.env.MIROIR_TLS_CERT ?? '(default: <certsdir>/localhost.pem)'}`);
console.log(`  --key      : ${argKeyFile  ?? process.env.MIROIR_TLS_KEY  ?? '(default: <certsdir>/localhost-key.pem)'}`);
const secretsSummary = registeredSecretNames.length > 0
  ? `${registeredSecretNames.length} named secret(s) registered: ${registeredSecretNames.join(", ")}`
  : "(none registered — external-service endpoints with a credentialKey will fail at call time)";
console.log(`  --secret   : ${secretsSummary}`);
console.log(`  --secrets-master-key : ${secretsMasterKey ? "(set)" : "(not set)"}`);

const configFileContents = JSON.parse(
  readFileSync(new URL(configFilePath, import.meta.url)).toString()
);

const miroirConfig: MiroirConfigServer = configFileContents as MiroirConfigServer;
myLogger.info('miroirConfig',miroirConfig)
myLogger.info(`import.meta`, JSON.stringify((import.meta as any), null, 2));

const restPortFromConfig: number = Number(
  miroirConfig.server.rootApiUrl.substring(miroirConfig.server.rootApiUrl.lastIndexOf(":") + 1),
);
const mcpPortFromConfig: number = Number(
  miroirConfig.server.mcpUrl?.substring(miroirConfig.server.mcpUrl.lastIndexOf(":") + 1) ?? 0,
);

// Derive CORS allowed origins: prefer explicit config, otherwise allow both http/https on common dev ports
// For production: set corsAllowedOrigins in the server config to only the exact production frontend URL(s) (e.g., ["https://app.example.com"]). No code change needed.
const serverUrl = new URL(miroirConfig.server.rootApiUrl);
const devPorts = ['5173', '3000'];
const defaultCorsOrigins = devPorts.flatMap(p => [
  `http://${serverUrl.hostname}:${p}`,
  `https://${serverUrl.hostname}:${p}`,
]);
const corsAllowedOrigins: string[] =
  (miroirConfig.server as any).corsAllowedOrigins ?? defaultCorsOrigins;
myLogger.info('CORS allowed origins:', corsAllowedOrigins);

const app = express();
app.use(cors({
  origin: corsAllowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({limit: '50mb'}));

const serverAuthentication = (miroirConfig.server as { authentication?: { enabled?: boolean; tokenSecret?: string } })
  .authentication;
const authenticationEnabled = resolveAuthenticationEnabled({
  argv: process.argv,
  env: process.env,
  config: { enabled: serverAuthentication?.enabled },
});
myLogger.info(`Authentication enabled: ${authenticationEnabled}`);
if (serverAuthentication?.tokenSecret) {
  setProcessTokenSecret(serverAuthentication.tokenSecret);
} else {
  getProcessTokenSecret();
}

app.get("/auth/status", (_req: any, res: any) => {
  res.json(buildAuthStatusBody(authenticationEnabled));
});

myLogger.info(`Server being set-up, going to execute on the port::${restPortFromConfig}`);

// ##############################################################################################
// Serve static assets (images, etc.) from a `public` directory.
// The mount path may be configured in the miroir server config under `server.assetsMountPath`.
// Default to `/assets` so files in `packages/miroir-server/public/...` are available at `/<assetsMountPath>/...`.
const rawAssetsMountPath = (miroirConfig.server && (miroirConfig.server as any).assetsMountPath) || '/assets';
// sanitize mount path: ensure leading slash and no trailing slash (unless root)
let assetsMountPath = String(rawAssetsMountPath || '/assets');
if (!assetsMountPath.startsWith('/')) assetsMountPath = '/' + assetsMountPath;
if (assetsMountPath.length > 1 && assetsMountPath.endsWith('/')) assetsMountPath = assetsMountPath.replace(/\/+$|\/+$/g, '');

// Resolve a Windows-safe absolute path to the public folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pathToPublic = path.join(__dirname, '..', 'public');
myLogger.info(`Mounting static assets at ${assetsMountPath} -> ${pathToPublic}`);

// quick existence check for common file to help debugging
try {
  const sample = path.join(pathToPublic, 'images', 'logo.png');
  const exists = existsSync(sample);
  myLogger.info(`Static asset sample check: ${sample} exists=${exists}`);
} catch (e) {
  myLogger.warn(`Error while checking sample static asset: ${e}`);
}

// set long cache headers for static assets (1 day) and fall back to no-cache for HTML-like responses
app.use(
  assetsMountPath,
  express.static(pathToPublic, {
    maxAge: "1d",
    // express.static expects a Node http.ServerResponse here; using that type ensures setHeader is available
    setHeaders: (
      res: import("http").ServerResponse,
      filePath: string,
      // stat: import("fs").Stats
    ) => {
      // If it's an HTML file, don't cache
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  })
);

// // Expose server configuration to browser clients.
// // Currently exposes the filesystem deployment root directory so clients don't need to guess it.
const filesystemDeploymentRootDirectory: string =
  (miroirConfig.server as any).filesystemDeploymentRootDirectory ?? "./tests/deployments/";

// app.get('/api/serverConfig', (_req: any, res: any) => {
//   res.json({ filesystemDeploymentRootDirectory });
// });

miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);

await MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions
  // (defaultLevels as any)[(miroirConfig as any).server.defaultLevel],
  // (miroirConfig as any).server.defaultTemplate,
  // (miroirConfig as any).server.specificLoggerOptions
);

const miroirContext = new MiroirContext(
  miroirActivityTracker,
  miroirEventService,
  miroirConfig
);

const persistenceStoreControllerManager = new PersistenceStoreControllerManager(
  ConfigurationService.configurationService.adminStoreFactoryRegister,
  ConfigurationService.configurationService.StoreSectionFactoryRegister,
  miroirConfig.server.filesystemDeploymentRootDirectory,
);

const domainController = await setupMiroirDomainController(
  miroirContext, 
  {
    persistenceStoreAccessMode: "local",
    localPersistenceStoreControllerManager: persistenceStoreControllerManager
  }
); // even when emulating server, we use remote persistence store, since MSW makes it appear as if we are using a remote server.

const configurations: Record<string, Deployment> = {
  [deployment_Admin.uuid]: deployment_Admin as Deployment,
  [deployment_Miroir.uuid]: deployment_Miroir as Deployment,
};

myLogger.info(`Initial deployments to open: ${JSON.stringify(configurations, circularReplacer(), 2)}`);

// open all configured stores
for (const c of Object.entries(configurations)) {
  const openStoreAction: StoreOrBundleAction = {
    actionType: "storeManagementAction_openStore",
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
    payload: {
      application: c[1].selfApplication,
      deploymentUuid: c[0],
      configuration: {
        [c[0]]: c[1].configuration as StoreUnitConfiguration,
      },
    },
  };
  await domainController.handleAction(
    openStoreAction,
    defaultSelfApplicationDeploymentMap,
    defaultMetaModelEnvironment
  );
}

const secretRowsQuery = await domainController.handleBoxedExtractorOrQueryAction(
  {
    actionType: "runBoxedQueryAction",
    endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
    payload: {
      application: adminSelfApplication.uuid,
      applicationSection: "data",
      queryExecutionStrategy: "storage",
      query: {
        application: adminSelfApplication.uuid,
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        extractors: {
          secrets: {
            extractorOrCombinerType: "extractorInstancesByEntity",
            parentUuid: ENTITY_MIROIR_SECRET_UUID,
          },
        },
      },
    },
  },
  defaultSelfApplicationDeploymentMap,
  defaultMetaModelEnvironment,
);
if (secretRowsQuery instanceof Action2Error) {
  throw new Error(`Error fetching MiroirSecret rows: ${secretRowsQuery.errorMessage}`);
}
const secretRowsRaw = secretRowsQuery.returnedDomainElement?.secrets;
const secretRows = Array.isArray(secretRowsRaw)
  ? secretRowsRaw
  : secretRowsRaw && typeof secretRowsRaw === "object"
    ? Object.values(secretRowsRaw)
    : [];
if (secretRows.length > 0 && !secretsMasterKey) {
  throw new Error("MiroirSecret rows exist but no wrapping key was provided");
}
if (secretsMasterKey) {
  hydrateSecrets({ wrappingKey: secretsMasterKey, rows: secretRows });
}

const deploymentsQueryResults = await domainController.handleBoxedExtractorOrQueryAction({
  actionType: "runBoxedQueryAction",
  endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  payload: {
    application: adminSelfApplication.uuid,
    applicationSection: "data",
    queryExecutionStrategy: "storage",
    query: {
      application: adminSelfApplication.uuid,
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      extractors: {
        deployments: {
          extractorOrCombinerType: "extractorInstancesByEntity",
          parentUuid: entityDeployment.uuid,
        }
      }
    },
  }
}, defaultSelfApplicationDeploymentMap, defaultMetaModelEnvironment);

if (deploymentsQueryResults instanceof Action2Error) {
  throw new Error(`Error fetching deployments: ${deploymentsQueryResults.errorMessage}`);
}

const deployments: Deployment[] = deploymentsQueryResults.returnedDomainElement.deployments;

myLogger.info(`Deployments fetched: ${JSON.stringify(deployments, circularReplacer(), 2)}`);

const deploymentsToOpen: [string, Deployment][] = deployments
  .filter((d) => !configurations[d.uuid.toString()])
  .map((d) => [d.uuid.toString(), d]);

myLogger.info(`Deployments to open: ${JSON.stringify(deploymentsToOpen, circularReplacer(), 2)}`);

const applicationDeploymentMap: ApplicationDeploymentMap = deployments.reduce(
  (acc, curr) => {
    return {...acc, [curr.selfApplication??("NO ADMIN APPLICATION for " + curr.name)] : curr.uuid};
  },
  {}
);

myLogger.info(`ApplicationDeploymentMap for new deployments: ${JSON.stringify(applicationDeploymentMap, circularReplacer(), 2)}`);

// open all newly found stores
for (const c of deploymentsToOpen) {
  const openStoreAction: StoreOrBundleAction = {
    actionType: "storeManagementAction_openStore",
    endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
    payload: {
      application: c[1].selfApplication,
      deploymentUuid: c[0],
      configuration: {
        [c[0]]: c[1].configuration as StoreUnitConfiguration,
      },
    },
  };
  await domainController.handleAction(
    openStoreAction,
    applicationDeploymentMap,
    defaultMetaModelEnvironment
  );
}

async function loadAdminIdentityDirectory(): Promise<
  | {
      ok: true;
      directory: ReturnType<typeof identityDirectoryFromInstances>;
      credentialsValue: unknown;
      grants: ReturnType<typeof accessGrantsFromInstances>;
      deployments: ReturnType<typeof deploymentsFromInstances>;
    }
  | { ok: false; errorMessage: string }
> {
  const identityQuery = await domainController.handleBoxedExtractorOrQueryAction(
    {
      actionType: "runBoxedQueryAction",
      endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
      payload: {
        application: adminSelfApplication.uuid,
        applicationSection: "data",
        queryExecutionStrategy: "storage",
        query: {
          application: adminSelfApplication.uuid,
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          extractors: {
            users: {
              extractorOrCombinerType: "extractorInstancesByEntity",
              parentUuid: ENTITY_MIROIR_USER_UUID,
            },
            credentials: {
              extractorOrCombinerType: "extractorInstancesByEntity",
              parentUuid: ENTITY_MIROIR_USER_CREDENTIAL_UUID,
            },
            rights: {
              extractorOrCombinerType: "extractorInstancesByEntity",
              parentUuid: ENTITY_MIROIR_RIGHT_UUID,
            },
            deployments: {
              extractorOrCombinerType: "extractorInstancesByEntity",
              parentUuid: ENTITY_DEPLOYMENT_UUID,
            },
          },
        },
      },
    },
    applicationDeploymentMap,
    defaultMetaModelEnvironment,
  );
  if (identityQuery instanceof Action2Error) {
    return {
      ok: false,
      errorMessage: identityQuery.errorMessage ?? "Authentication directory query failed",
    };
  }
  return {
    ok: true,
    directory: identityDirectoryFromInstances(
      identityQuery.returnedDomainElement?.users,
      identityQuery.returnedDomainElement?.credentials,
    ),
    credentialsValue: identityQuery.returnedDomainElement?.credentials,
    grants: accessGrantsFromInstances(identityQuery.returnedDomainElement?.rights),
    deployments: deploymentsFromInstances(identityQuery.returnedDomainElement?.deployments),
  };
}

async function resolveGatedPrincipal(
  authorizationHeader: string | undefined,
): Promise<ReturnType<typeof bindPrincipalToDirectory>> {
  const extracted = await extractPrincipalFromAuthorizationHeader(
    authorizationHeader,
    getProcessTokenSecret(),
  );
  if (!extracted) {
    return undefined;
  }
  const identity = await loadAdminIdentityDirectory();
  if (!identity.ok) {
    return undefined;
  }
  return bindPrincipalToDirectory(extracted, identity.directory);
}

// ##############################################################################################
// CREATING ENDPOINTS SERVICING CRUD HANDLERS
for (const op of restServerDefaultHandlers) {
  const operationHandler = async (request: CustomRequest, response: any, context: any) => {
    const authorizationHeader =
      typeof request.headers?.authorization === "string" ? request.headers.authorization : undefined;
    let principal = undefined;
    let grants: ReturnType<typeof accessGrantsFromInstances> = [];
    let deployments: ReturnType<typeof deploymentsFromInstances> = [];
    if (authenticationEnabled) {
      const extracted = await extractPrincipalFromAuthorizationHeader(
        authorizationHeader,
        getProcessTokenSecret(),
      );
      const directory = await loadAdminIdentityDirectory();
      if (extracted && directory.ok) {
        principal = bindPrincipalToDirectory(extracted, directory.directory);
      }
      if (directory.ok) {
        grants = directory.grants;
        deployments = directory.deployments;
      }
    }
    const gate = assertRequestAllowed({
      enabled: authenticationEnabled,
      principal,
    });
    if (!gate.allowed) {
      response.status(gate.status).json(gate.body);
      return;
    }
    const access = assertAccessForDeployment({
      enabled: authenticationEnabled,
      principal,
      deploymentUuid: deploymentUuidFromHttpRequest(request),
      grants,
      deployments,
      alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
    });
    if (!access.allowed) {
      myLogger.warn(
        `access denied: user=${principal?.username ?? "anonymous"} deployment=${deploymentUuidFromHttpRequest(request) ?? "(none)"} url=${request.originalUrl}`
      );
      response.status(access.status).json(access.body ?? ACCESS_DENIED);
      return;
    }
    const body = request.body;
    myLogger.info(`[CONSOLE DEBUG] Request received: ${op.method} ${request.originalUrl}`);
    myLogger.info(
      `[REQUEST START] ${op.method} ${request.originalUrl} - params:`,
      JSON.stringify(request.params)
    );

    try {
      myLogger.info(`[CONSOLE DEBUG] About to call handler`);
      myLogger.info(
        `[BEFORE HANDLER] About to call handler for ${op.method} ${request.originalUrl}`
      );

      await op.handler(
        true, // useDomainControllerToHandleModelAndInstanceActions: since we're on the server, we use the localCache as intermediate step, to access the persistenceStore
        (response: any) => response.json.bind(response),
        response,
        persistenceStoreControllerManager,
        domainController,
        op.method,
        request.originalUrl,
        body,
        { ...request.params, ...request.query, authPrincipal: principal }
      );

      myLogger.info(`[CONSOLE DEBUG] Handler completed successfully`);
      myLogger.info(
        `[AFTER HANDLER] Handler completed successfully for ${op.method} ${request.originalUrl}`
      );
      // Don't return anything - the handler should have already sent the response
    } catch (error) {
      myLogger.info(`[CONSOLE DEBUG] Error caught:`, error);
      myLogger.error(
        `[ERROR CAUGHT] server could not handle action: ${op.method} on URL: ${op.url} error: ${error}`
      );

      // Send proper error response to client
      if (!response.headersSent) {
        myLogger.info(`[CONSOLE DEBUG] Sending error response`);
        myLogger.info(
          `[SENDING ERROR RESPONSE] Headers not sent, sending 500 error response for ${request.originalUrl}`
        );
        const errorMessage = error instanceof Error ? error.message : String(error);
        try {
          response.status(500).json({
            status: "error",
            errorType: "ServerError",
            errorMessage: `Failed to handle ${op.method} request on ${request.originalUrl}: ${errorMessage}`,
            timestamp: new Date().toISOString(),
          });
          myLogger.info(`[CONSOLE DEBUG] Error response sent successfully`);
          myLogger.info(
            `[ERROR RESPONSE SENT] Error response sent successfully for ${request.originalUrl}`
          );
        } catch (responseError) {
          myLogger.info(`[CONSOLE DEBUG] Failed to send error response:`, responseError);
          myLogger.error(
            `[ERROR SENDING RESPONSE] Failed to send error response: ${responseError}`
          );
        }
      } else {
        myLogger.info(`[CONSOLE DEBUG] Headers already sent, cannot send error response`);
        myLogger.warn(
          `[HEADERS ALREADY SENT] Cannot send error response for ${request.originalUrl} - headers already sent`
        );
      }
      // Don't return anything - we've already handled the response
    }
  };

  (app as any)[op.method](
    op.url,
    operationHandler,
  );
}

app.post("/auth/login", async (request: CustomRequest, response: any) => {
  const identity = await loadAdminIdentityDirectory();
  if (!identity.ok) {
    response.status(500).json({
      status: "error",
      errorType: "AuthenticationDirectoryMissing",
      errorMessage: identity.errorMessage,
    });
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

app.post("/auth/change-password", async (request: CustomRequest, response: any) => {
  const principal = await resolveGatedPrincipal(
    typeof request.headers?.authorization === "string" ? request.headers.authorization : undefined,
  );
  if (!principal) {
    response.status(401).json({
      status: "error",
      errorType: "AuthenticationRequired",
    });
    return;
  }
  const identity = await loadAdminIdentityDirectory();
  if (!identity.ok) {
    response.status(500).json({
      status: "error",
      errorType: "AuthenticationDirectoryMissing",
      errorMessage: identity.errorMessage,
    });
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
  const existing = findCredentialInstance(identity.credentialsValue, principal.miroirUserUuid);
  const updatedHash = changed.directory.credentials.find(
    (row) => row.miroirUser === principal.miroirUserUuid,
  )?.passwordHash;
  if (!existing || !updatedHash) {
    response.status(401).json({
      status: "error",
      errorType: "AuthenticationFailed",
    });
    return;
  }
  const persistResult = await domainController.handleAction(
    {
      actionType: "updateInstance",
      actionLabel: AUTH_CHANGE_PASSWORD_ACTION_LABEL,
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: adminSelfApplication.uuid,
        applicationSection: "data",
        parentUuid: ENTITY_MIROIR_USER_CREDENTIAL_UUID,
        objects: [
          {
            ...existing,
            passwordHash: updatedHash,
          } as any,
        ],
      },
    },
    applicationDeploymentMap,
    defaultMetaModelEnvironment,
    undefined,
    undefined,
    principal,
  );
  if (persistResult instanceof Action2Error) {
    response.status(500).json({
      status: "error",
      errorType: "AuthenticationDirectoryMissing",
      errorMessage: persistResult.errorMessage,
    });
    return;
  }
  response.json({ changed: true });
});

const endpointToolRegistry = new EndpointToolRegistry(domainController, applicationDeploymentMap);
myLogger.info("Setting up MCP server with dynamic EndpointToolRegistry");
const mcpApp = express();
mcpApp.use(cors({
  origin: corsAllowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

mcpApp.use(bodyParser.json({limit: '50mb'}));

myLogger.info(`MCP Server being set-up, going to execute on the port::${mcpPortFromConfig}`);
const mcpServer = await setupMcpServer(
  mcpApp,
  applicationDeploymentMap,
  endpointToolRegistry,
  domainController,
);
mcpServer.mountHttpRoutes(app);

// AI / CopilotKit endpoint — MUST be after API routes and MCP, before SPA catch-all.
app.use("/api/copilotkit", async (request: any, response: any, next: any) => {
  const principal = authenticationEnabled
    ? await resolveGatedPrincipal(
        typeof request.headers?.authorization === "string" ? request.headers.authorization : undefined,
      )
    : undefined;
  const gate = assertRequestAllowed({
    enabled: authenticationEnabled,
    principal,
  });
  if (!gate.allowed) {
    response.status(gate.status).json(gate.body);
    return;
  }
  next();
});
app.use('/api/copilotkit', createCopilotKitRouter(domainController, applicationDeploymentMap));

// ##############################################################################################
// ##############################################################################################
// Serve React SPA — MUST be registered AFTER all API/MCP routes.
// Static files are served from dist/client/ (built from miroir-standalone-app).
// All unmatched routes fall through to index.html to support client-side routing.
if (getMiroirEnvironmentMode() === 'prod') {
  myLogger.info('Running in production mode - serving React SPA');
  myLogger.info(`Found dirname: ${__dirname}`);
  const pathToClient = path.join(__dirname, 'client');
  myLogger.info(`Serving React SPA from ${pathToClient}`);
  
  const indexPath = path.join(pathToClient, 'index.html');
   if (!existsSync(indexPath)) {
    throw new Error(`React client build not found at ${indexPath}. Please run "npm run build" in the miroir-standalone-app package and ensure the output is copied to the server's client directory.`);
  }
  app.use(express.static(pathToClient, {
    maxAge: "1d",
    setHeaders: (res: import("http").ServerResponse, filePath: string) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  }));
  
  // SPA catch-all: serve index.html for all routes not matched above
  app.get('*', (req: any, res: any) => {
    
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('React client build not found. Run "npm run build" first.');
    }
  });
} else {
  myLogger.info('Not in production mode - skipping React SPA setup');
  app.get('/', (req: any,res: any) => {
    res.send('App Works !!!!');
  });
}

// ##############################################################################################
// Start HTTPS server. Certificate paths are resolved from environment variables
// (MIROIR_TLS_CERT / MIROIR_TLS_KEY) or default to <repo-root>/certs/ relative to this file.
// If the certificate files are absent, the server falls back to plain HTTP with a warning —
// run scripts/setup-https.sh (or .ps1) once to generate the certificates.
const defaultCertsDir = argCertsDir ?? path.resolve(__dirname, '../../../certs');
const certFile = argCertFile ?? process.env.MIROIR_TLS_CERT ?? path.join(defaultCertsDir, 'localhost.pem');
const keyFile  = argKeyFile  ?? process.env.MIROIR_TLS_KEY  ?? path.join(defaultCertsDir, 'localhost-key.pem');

myLogger.info(`TLS configuration:`);
myLogger.info(`  certsdir : ${defaultCertsDir}`);
myLogger.info(`  certFile : ${certFile}`);
myLogger.info(`  keyFile  : ${keyFile}`);

if (existsSync(certFile) && existsSync(keyFile)) {
  const tlsOptions = {
    cert: readFileSync(certFile),
    key:  readFileSync(keyFile),
  };
  https.createServer(tlsOptions, app).listen(restPortFromConfig, () => {
    myLogger.info(`HTTPS server listening on port ${restPortFromConfig}`);
    myLogger.info(`  cert: ${certFile}`);
    myLogger.info(`  key:  ${keyFile}`);
  });
} else {
  myLogger.warn(
    `TLS certificate files not found — falling back to plain HTTP.\n` +
    `  Expected cert: ${certFile}\n` +
    `  Expected key:  ${keyFile}\n` +
    `  Run  scripts/setup-https.sh  (bash) or  scripts/setup-https.ps1  (PowerShell)` +
    ` to generate local certificates.`
  );
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const http = await import('http');
  http.createServer(app).listen(restPortFromConfig, () => {
    myLogger.info("templateEvaluationParams", templateEvaluationParams);
    myLogger.info(`Server running in ${getMiroirEnvironmentMode()} mode`);
    myLogger.info(`Server accesses filesystem deployment root directory at: ${filesystemDeploymentRootDirectory}`);
    myLogger.info(`HTTP server listening on port ${restPortFromConfig} (no TLS — run setup-https to enable HTTPS)`);
  });
}
if ( mcpPortFromConfig) {
  mcpServer.run(mcpPortFromConfig);
} else {
  myLogger.warn(`MCP port not configured, skipping MCP server startup`);
}

// Adjust Request type
interface CustomRequest extends Request {
  body: any;
  originalUrl: string;
  params: Record<string, any>;
}