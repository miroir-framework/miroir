import { parseMiroirTestCliConfig } from "../src/5_tests/parseMiroirTestCliConfig";
import { runMiroirTestsFromCLI } from "./helpers/runMiroirTestsFromCLI";

const config = parseMiroirTestCliConfig(process.env, process.argv.slice(2));
await runMiroirTestsFromCLI(config);
