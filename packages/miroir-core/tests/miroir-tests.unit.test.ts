import { parseMiroirTestCliConfig } from "./helpers/parseMiroirTestCliConfig";
import { runMiroirTestsFromCliConfig } from "./helpers/runMiroirTestsFromCliConfig";

const config = parseMiroirTestCliConfig();
await runMiroirTestsFromCliConfig(config);
