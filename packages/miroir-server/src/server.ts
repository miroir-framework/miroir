import { existsSync, readFileSync } from 'fs';
import * as https from 'https';
import loglevelnextLib from 'loglevelnext'; // TODO: use this? or plain "console" log?
import path from 'path';
import { fileURLToPath } from 'url';

import {
  Action2Error,
  type ApplicationDeploymentMap,
  circularReplacer,
  ConfigurationService,
  defaultMetaModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  type Deployment,
  getClientEnvironment,
  getMiroirEnvironmentMode,
  getProcessCapabilities,
  shouldMountMcpHttp,
  LoggerFactoryInterface,
  LoggerInterface,
  LoggerOptions,
  MiroirConfigServer,
  MiroirLoggerFactory,
  ENTITY_MIROIR_SECRET_UUID,
  getProcessTokenSecret,
  ParseServerArgsError,
  assembleSecretImportSet,
  hydrateSecrets,
  importProcessSecrets,
  parseServerArgs,
  persistImportedProcessSecrets,
  persistRotatedSecretRow,
  requireWrappingKeyForSecretImport,
  defaultExternalServiceClient,
  resolveAuthenticationEnabled,
  resolveMcpAuthenticationEnabled,
  setProcessTokenSecret,
  setSecretsMasterKey,
  StoreOrBundleAction,
  StoreUnitConfiguration,
  templateEvaluationParams,
} from "@miroir-framework/core";
import {
  adminSelfApplication,
  deployment_Admin,
  deployment_Miroir,
  entityDeployment,
} from "miroir-app-admin";

import {
  describeEnvironmentStateStatus,
  EnvironmentError,
  environmentServerConfig,
  environmentStateStatus,
  hasEnvironmentDefinitions,
  openEnvironmentBootDeployments,
  reconcileEnvironmentDeployments,
  recordInstallsOf,
  resolveEnvironmentFromFiles,
  describeSeedReport,
  seedEnvironmentStateAtStart,
  type ResolvedEnvironment,
} from "@miroir-framework/env";
import { createMiroirServerApp } from "@miroir-framework/server";
import { startMiroirNode } from 'miroir-localcache-redux/node';
import { miroirFileSystemStoreSectionStartup } from '@miroir-framework/store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from '@miroir-framework/store-indexeddb';
import { miroirMongoDbStoreSectionStartup } from '@miroir-framework/store-mongodb';
import { miroirPostgresStoreSectionStartup } from '@miroir-framework/store-postgres';
import { agentMcpHttpUrl, mountCopilotKitRoute } from './mountCopilotKitRoute.js';
import { resolveServerConfigFilePath } from './serverConfigFile.js';

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

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "server");
let myLogger: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => { myLogger = logger; });

// Argument parsing
function printUsageAndExit(exitCode = 1): never {
  console.error(`Usage: node server.js [OPTIONS]`);
  myLogger.error(``);
  console.error(`OPTIONS:`);
  console.error(`  --config   <path>   Path to the server config JSON file, relative to the working directory, instead of the selected environment`);
  myLogger.error(`                      (default: ../config/miroirConfig.server.json relative to the server bundle, used when no environments/ folder is found)`);
  console.error(`  --certsdir <dir>    Directory containing TLS certificate files`);
  myLogger.error(`                      (default: <repo-root>/certs/)`);
  console.error(`  --cert     <path>   Path to the TLS certificate file (.pem)`);
  console.error(`                      Overrides --certsdir. Also reads from env: MIROIR_TLS_CERT`);
  myLogger.error(`                      (default: <certsdir>/localhost.pem)`);
  console.error(`  --key      <path>   Path to the TLS private key file (.pem)`);
  console.error(`                      Overrides --certsdir. Also reads from env: MIROIR_TLS_KEY`);
  myLogger.error(`                      (default: <certsdir>/localhost-key.pem)`);
  console.error(`  --secret   <name>=<value>  Bootstrap import only (repeatable). Env: MIROIR_SECRET_<NAME>`);
  myLogger.error(`                      plus AI_OPENAI_KEY / AI_ANTHROPIC_KEY / AI_GOOGLE_KEY / AI_GITHUB_TOKEN / CURSOR_API_KEY.`);
  myLogger.error(`                      Requires a wrapping key. Steady-state is --secrets-master-key only.`);
  console.error(`  --secrets-master-key <value>  Wrapping key for persisted secrets. Env: MIROIR_SECRETS_MASTER_KEY`);
  console.error(`  --disable-auth      Disable user authentication (today's open API)`);
  console.error(`  --enable-auth       Enable user authentication (overrides config/env)`);
  console.error(`  -h, --help          Show this help message and exit`);
  process.exit(exitCode);
}

let configFilePath = "../config/miroirConfig.server.json";
let configFileGiven = false;
let argCertsDir: string | undefined;
let argCertFile: string | undefined;
let argKeyFile: string | undefined;
let registeredSecretNames: string[] = [];
let secretsMasterKey: string | undefined;
let secretImportSet: Record<string, string> = {};

try {
  const parsed = parseServerArgs(process.argv.slice(2), process.env);
  if (parsed.help) {
    printUsageAndExit(0);
  }
  configFilePath = parsed.configFilePath;
  configFileGiven = parsed.configFileGiven;
  argCertsDir = parsed.certsDir;
  argCertFile = parsed.certFile;
  argKeyFile = parsed.keyFile;
  secretImportSet = assembleSecretImportSet(parsed.secrets, process.env);
  requireWrappingKeyForSecretImport(secretImportSet, parsed.secretsMasterKey);
  registeredSecretNames = Object.keys(secretImportSet);
  secretsMasterKey = parsed.secretsMasterKey;
  if (secretsMasterKey) {
    setSecretsMasterKey(secretsMasterKey);
  }
} catch (error) {
  if (error instanceof ParseServerArgsError) {
    console.error(`Error: ${error.message}`);
    printUsageAndExit();
  }
  if (error instanceof Error && /wrapping key/i.test(error.message)) {
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
  ? `${registeredSecretNames.length} named secret(s) queued for bootstrap import: ${registeredSecretNames.join(", ")}`
  : "(none — steady-state uses wrapping key + persisted MiroirSecret rows)";
console.log(`  --secret   : ${secretsSummary}`);
console.log(`  --secrets-master-key : ${secretsMasterKey ? "(set)" : "(not set)"}`);

// #321: the selected environment (environments/*.json, see `miroir-env show`) gives the server
// settings and the deployments to open. The config file is used when --config is given or when no
// environments/ folder is found above the working directory (release binary, Docker image).
function loadEnvironment(): ResolvedEnvironment | undefined {
  if (configFileGiven || !hasEnvironmentDefinitions(process.cwd(), process.env)) {
    return undefined;
  }
  try {
    return resolveEnvironmentFromFiles({ cwd: process.cwd(), env: process.env });
  } catch (error) {
    if (error instanceof EnvironmentError) {
      console.error(`Error: ${error.message}`);
      process.exit(2);
    }
    throw error;
  }
}

const resolvedEnvironment: ResolvedEnvironment | undefined = loadEnvironment();

let miroirConfig: MiroirConfigServer;
if (resolvedEnvironment) {
  const { name, source, files } = resolvedEnvironment;
  console.log(`  environment: ${name}, selected by ${source}, defined by ${files.join(" <- ")}`);
  const state = environmentStateStatus(resolvedEnvironment);
  if (state.status === "changed") {
    console.log(`  environment ${describeEnvironmentStateStatus(state)}`);
  }
  const seedLine = describeSeedReport(seedEnvironmentStateAtStart(resolvedEnvironment));
  if (seedLine) {
    console.log(`  ${seedLine}`);
  }
  miroirConfig = environmentServerConfig(resolvedEnvironment);
} else {
  const configFile = resolveServerConfigFilePath({
    configFilePath,
    configFileGiven,
    cwd: process.cwd(),
    serverModuleDir: path.dirname(fileURLToPath(import.meta.url)),
  });
  console.log(`  environment: none, server settings and boot deployments from ${configFile}`);
  miroirConfig = JSON.parse(readFileSync(configFile, "utf8")) as MiroirConfigServer;
}
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


const serverAuthentication = (
  miroirConfig.server as { authentication?: { enabled?: boolean; tokenSecret?: string; mcp?: boolean } }
).authentication;
const authenticationEnabled = resolveAuthenticationEnabled({
  argv: process.argv,
  env: process.env,
  config: { enabled: serverAuthentication?.enabled },
});
// #263: MCP gating has its own switch; global hatch off wins.
const mcpAuthenticationEnabled = resolveMcpAuthenticationEnabled({
  argv: process.argv,
  env: process.env,
  config: { mcp: serverAuthentication?.mcp },
  globalEnabled: authenticationEnabled,
});
myLogger.info(`Authentication enabled: ${authenticationEnabled}, on MCP: ${mcpAuthenticationEnabled}`);
if (serverAuthentication?.tokenSecret) {
  setProcessTokenSecret(serverAuthentication.tokenSecret);
} else {
  getProcessTokenSecret();
}


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


// // Expose server configuration to browser clients.
// // Currently exposes the filesystem deployment root directory so clients don't need to guess it.
const filesystemDeploymentRootDirectory: string =
  (miroirConfig.server as any).filesystemDeploymentRootDirectory ?? "./tests/deployments/";

// app.get('/api/serverConfig', (_req: any, res: any) => {
//   res.json({ filesystemDeploymentRootDirectory });
// });

// #639: one startup call builds the local domain controller on the four Node stores
const {
  domainController,
  persistenceStoreControllerManager: serverPersistenceStoreControllerManager,
} = await startMiroirNode(miroirConfig, {
  stores: [
    miroirFileSystemStoreSectionStartup,
    miroirIndexedDbStoreSectionStartup,
    miroirMongoDbStoreSectionStartup,
    miroirPostgresStoreSectionStartup,
  ],
  loggers: { factory: loglevelnext, options: loggerOptions },
  externalServiceClient: defaultExternalServiceClient({
    // a rotated refresh token of a persisted secret row goes back to its row; called only by an
    // external service call, once the server has opened its deployments
    persistRotatedSecret: async (args) => {
      await persistRotatedSecretRow(domainController, args, applicationDeploymentMap);
    },
  }),
});
if (!serverPersistenceStoreControllerManager) {
  throw new Error("startMiroirNode returned no store manager for a server configuration");
}
const persistenceStoreControllerManager = serverPersistenceStoreControllerManager;

// without an environment: Admin and Miroir from the Deployment rows of the Admin package
const configurations: Record<string, Deployment> = resolvedEnvironment
  ? {}
  : {
      [deployment_Admin.uuid]: deployment_Admin as Deployment,
      [deployment_Miroir.uuid]: deployment_Miroir as Deployment,
    };

if (resolvedEnvironment) {
  await openEnvironmentBootDeployments(domainController, resolvedEnvironment, process.env);
}

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

if (Object.keys(secretImportSet).length > 0 && secretsMasterKey) {
  const importedInstances = importProcessSecrets({
    wrappingKey: secretsMasterKey,
    secrets: secretImportSet,
  });
  await persistImportedProcessSecrets(domainController, importedInstances);
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

async function openRegisteredDeployments(): Promise<{
  deployments: Deployment[];
  applicationDeploymentMap: ApplicationDeploymentMap;
}> {
  if (resolvedEnvironment) {
    const reconciliation = await reconcileEnvironmentDeployments(domainController, resolvedEnvironment, process.env);
    for (const change of reconciliation.changes) {
      console.log(`[miroir-env] ${change}`);
    }
    for (const warning of reconciliation.warnings) {
      console.warn(`[miroir-env] warning: ${warning}`);
    }
    return reconciliation;
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
  return { deployments, applicationDeploymentMap };
}

const { applicationDeploymentMap } = await openRegisteredDeployments();

// applications installed or dropped from now on are recorded in environments/local.json
if (resolvedEnvironment) {
  recordInstallsOf(domainController, resolvedEnvironment, (line) => console.log(`[miroir-env] ${line}`));
}

const capabilities = getProcessCapabilities({
  config: miroirConfig,
  environment: getClientEnvironment(),
  storeSectionFactoryRegister:
    ConfigurationService.configurationService.StoreSectionFactoryRegister,
  adminStoreFactoryRegister: ConfigurationService.configurationService.adminStoreFactoryRegister,
});
domainController.setProcessCapabilities(capabilities);

// TLS certificates: present → HTTPS on the API port (listener at the end of this file).
// run scripts/setup-https.sh (or .ps1) once to generate the certificates.
const defaultCertsDir = argCertsDir ?? path.resolve(__dirname, '../../../certs');
const certFile = argCertFile ?? process.env.MIROIR_TLS_CERT ?? path.join(defaultCertsDir, 'localhost.pem');
const keyFile  = argKeyFile  ?? process.env.MIROIR_TLS_KEY  ?? path.join(defaultCertsDir, 'localhost-key.pem');
const tlsEnabled = existsSync(certFile) && existsSync(keyFile);

// In production the server serves the React client from release/client (scripts/copy-client.mjs)
// after every API and MCP route; otherwise the Vite dev server serves it.
const pathToClient = path.join(__dirname, 'client');
if (getMiroirEnvironmentMode() === 'prod') {
  myLogger.info(`Running in production mode - serving React SPA from ${pathToClient}`);
}

// #636: Miroir's HTTP surface (REST behind the gate, authentication and capabilities routes, assets, /mcp,
// the CopilotKit route, the client folder) comes from miroir-server-library. mcpServer.run starts the
// dedicated MCP listener at the end of this file.
const { app, mcpServer } = await createMiroirServerApp({
  domainController,
  persistenceStoreControllerManager,
  applicationDeploymentMap,
  miroirConfig,
  capabilities,
  authentication: { enabled: authenticationEnabled, mcpEnabled: mcpAuthenticationEnabled },
  corsAllowedOrigins,
  assets: { directory: pathToPublic, mountPath: assetsMountPath },
  ...(getMiroirEnvironmentMode() === 'prod' ? { clientDirectory: pathToClient } : {}),
  // miroir-ai is imported only when the ai capability is on (#409)
  assistantRoute: async (miroirApp, { requestGate }) => {
    await mountCopilotKitRoute(miroirApp, {
      capabilities,
      domainController,
      applicationDeploymentMap,
      mcpHttpUrl: agentMcpHttpUrl({ restPort: restPortFromConfig, mcpPort: mcpPortFromConfig, tls: tlsEnabled }),
      agentModel: miroirConfig.features?.agentModel,
      requestGate,
      authenticationEnabled,
    });
  },
});

if (getMiroirEnvironmentMode() !== 'prod') {
  myLogger.info('Not in production mode - no client folder');
  app.get('/', (req: any,res: any) => {
    res.send('App Works !!!!');
  });
}

// ##############################################################################################
// Start HTTPS server. Certificate paths are resolved from environment variables
// (MIROIR_TLS_CERT / MIROIR_TLS_KEY) or default to <repo-root>/certs/ relative to this file.
// If the certificate files are absent, the server falls back to plain HTTP with a warning —
myLogger.info(`TLS configuration:`);
myLogger.info(`  certsdir : ${defaultCertsDir}`);
myLogger.info(`  certFile : ${certFile}`);
myLogger.info(`  keyFile  : ${keyFile}`);

if (tlsEnabled) {
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
    myLogger.info("templateEvaluationParams", {
      ...templateEvaluationParams,
      ...(miroirConfig.environment ? { environmentAppsDirectory: miroirConfig.environment.appsDirectory } : {}),
    });
    myLogger.info(`Server running in ${getMiroirEnvironmentMode()} mode`);
    myLogger.info(`Server accesses filesystem deployment root directory at: ${filesystemDeploymentRootDirectory}`);
    myLogger.info(`HTTP server listening on port ${restPortFromConfig} (no TLS — run setup-https to enable HTTPS)`);
  });
}
if ( mcpPortFromConfig) {
  if (shouldMountMcpHttp(capabilities.mcp)) {
    myLogger.info(`MCP Server being set-up, going to execute on the port::${mcpPortFromConfig}`);
    mcpServer.run(mcpPortFromConfig);
  }
} else {
  myLogger.warn(`MCP port not configured, skipping MCP server startup`);
}
