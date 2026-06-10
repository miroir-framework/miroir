import { parseMiroirTestCliConfig } from "./helpers/parseMiroirTestCliConfig";
import { initMiroirTestIntegrationStore } from "./helpers/miroirTestIntegrationStore";
import { runMiroirTestsFromCliConfig } from "./helpers/runMiroirTestsFromCliConfig";

const config = parseMiroirTestCliConfig();
const postgresHostName = process.env.MIROIR_TEST_POSTGRES_HOST ?? "192.168.1.160";

let integrationStore: Awaited<ReturnType<typeof initMiroirTestIntegrationStore>> | undefined;

if (config.suiteKeys.length > 0) {
  integrationStore = await initMiroirTestIntegrationStore({ postgresHostName });
}

await runMiroirTestsFromCliConfig(config, {
  integrationStore: integrationStore?.sqlDbDataStore,
});
