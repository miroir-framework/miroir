import { parseMiroirTestCliConfig } from "../src/5_tests/parseMiroirTestCliConfig";
import { initMiroirTestIntegrationStore } from "./helpers/miroirTestIntegrationStore";
import { runMiroirTestsFromCLI } from "./helpers/runMiroirTestsFromCLI";

const config = parseMiroirTestCliConfig();
const postgresHostName = process.env.MIROIR_TEST_POSTGRES_HOST ?? "192.168.1.160";

let integrationStore: Awaited<ReturnType<typeof initMiroirTestIntegrationStore>> | undefined;

if (config.suiteKeys.length > 0) {
  integrationStore = await initMiroirTestIntegrationStore({ postgresHostName });
}

await runMiroirTestsFromCLI(config, {
  integrationStore: integrationStore?.sqlDbDataStore,
});
