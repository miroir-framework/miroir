import * as vitest from "vitest";

import { parseMiroirTestCliConfig } from "../src/5_tests/parseMiroirTestCliConfig";
import { runMiroirCoreTestsFromCLI } from "../src/5_tests/runMiroirCoreTestsFromCLI";
import { runMiroirTests } from "../src/5_tests/MiroirTestTools";
import { MiroirActivityTracker } from "../src/3_controllers/MiroirActivityTracker";

const config = parseMiroirTestCliConfig(process.env, process.argv.slice(2));
const miroirActivityTracker = new MiroirActivityTracker();
await runMiroirCoreTestsFromCLI(runMiroirTests, vitest, config, miroirActivityTracker);
