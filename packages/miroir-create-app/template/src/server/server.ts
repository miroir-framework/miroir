// The server: reads environments/local.json, seeds .miroir/ on first start, opens the deployments, then serves
// Miroir's HTTP routes and the built client (dist/). `npm start` after `npm run build`; PORT overrides the port of
// the environment's server.rootApiUrl.
import loglevelnext from "loglevelnext";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ConfigurationService,
  defaultExternalServiceClient,
  getClientEnvironment,
  getProcessCapabilities,
  getProcessTokenSecret,
  type LoggerFactoryInterface,
} from "@miroir-framework/core";
import {
  bootEnvironment,
  describeSeedReport,
  environmentServerConfig,
  resolveEnvironmentFromFiles,
  seedEnvironmentStateAtStart,
} from "@miroir-framework/env";
import { createMiroirServerApp } from "@miroir-framework/server";
import { startMiroirNode } from "@miroir-framework/server/startup";
import { miroirFileSystemStoreSectionStartup } from "@miroir-framework/store-filesystem";

// dist-server/server.js → the project folder
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const environment = resolveEnvironmentFromFiles({ cwd: projectRoot, env: { ...process.env, MIROIR_ROOT: projectRoot } });
const seed = describeSeedReport(seedEnvironmentStateAtStart(environment));
if (seed) {
  console.log(seed);
}
const miroirConfig = environmentServerConfig(environment);
// the key signing session tokens: MIROIR_AUTH_TOKEN_SECRET, or one generated for the process
getProcessTokenSecret();

const { domainController, persistenceStoreControllerManager } = await startMiroirNode(miroirConfig, {
  stores: [miroirFileSystemStoreSectionStartup],
  loggers: {
    factory: loglevelnext as unknown as LoggerFactoryInterface,
    options: { defaultLevel: "WARN", defaultTemplate: "[{{time}}] {{level}} ({{name}}) -", specificLoggerOptions: {} },
  },
  externalServiceClient: defaultExternalServiceClient({ persistRotatedSecret: async () => {} }),
});
if (!persistenceStoreControllerManager) {
  throw new Error("startMiroirNode returned no store manager for a server configuration");
}
const { applicationDeploymentMap } = await bootEnvironment(domainController, environment, process.env);

const capabilities = getProcessCapabilities({
  config: miroirConfig,
  environment: getClientEnvironment(),
  storeSectionFactoryRegister: ConfigurationService.configurationService.StoreSectionFactoryRegister,
  adminStoreFactoryRegister: ConfigurationService.configurationService.adminStoreFactoryRegister,
});
domainController.setProcessCapabilities(capabilities);

const authenticationEnabled = environment.environment.server?.authentication?.enabled ?? false;
const { app } = await createMiroirServerApp({
  domainController,
  persistenceStoreControllerManager,
  applicationDeploymentMap,
  miroirConfig,
  capabilities,
  authentication: { enabled: authenticationEnabled, mcpEnabled: authenticationEnabled },
  clientDirectory: path.join(projectRoot, "dist"),
});

const port = Number(process.env.PORT ?? new URL(miroirConfig.server.rootApiUrl).port);
app.listen(port, () => {
  console.log(`Miroir server listening on http://localhost:${port}`);
});
