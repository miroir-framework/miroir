import * as vitest from "vitest";

import { parseMiroirTestCliConfig } from "../src/5_tests/parseMiroirTestCliConfig";
import { runMiroirCoreTestsFromCLI } from "../src/5_tests/runMiroirCoreTestsFromCLI";
import { runMiroirTests } from "../src/5_tests/MiroirTestTools";

const config = parseMiroirTestCliConfig(process.env, process.argv.slice(2));
await runMiroirCoreTestsFromCLI(runMiroirTests, vitest, config);
