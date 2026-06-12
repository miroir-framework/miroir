import { parseMiroirTestCliConfig } from "../src/5_tests/parseMiroirTestCliConfig";
import { runMiroirCoreTestsFromCLI } from "./helpers/runMiroirCoreTestsFromCLI";

const config = parseMiroirTestCliConfig(process.env, process.argv.slice(2));
await runMiroirCoreTestsFromCLI(config);
