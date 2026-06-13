import { parseMiroirTestCliConfig } from "../src/5_tests/parseMiroirTestCliConfig";
import { initMiroirCoreTestIntegrationStore } from "./helpers/initMiroirCoreTestIntegrationStore";
import { runMiroirCoreTestsFromCLI } from "./helpers/runMiroirCoreTestsFromCLI";

const config = parseMiroirTestCliConfig(process.env, process.argv.slice(2));
const postgresHostName = process.env.MIROIR_TEST_POSTGRES_HOST ?? "192.168.1.160";

let integrationStore: Awaited<ReturnType<typeof initMiroirCoreTestIntegrationStore>> | undefined;

if (config.suiteKeys.length > 0) {
  integrationStore = await initMiroirCoreTestIntegrationStore({ postgresHostName });
  await runMiroirCoreTestsFromCLI(config, {
    integrationDataStore: integrationStore.sqlDbDataStore,
    applicationDeploymentMap: integrationStore.applicationDeploymentMap,
  });
}

