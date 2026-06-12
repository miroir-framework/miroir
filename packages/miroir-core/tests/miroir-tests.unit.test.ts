import { parseMiroirTestCliConfig } from "../src/5_tests/parseMiroirTestCliConfig";
import { runMiroirTestsFromCLI } from "./helpers/runMiroirTestsFromCLI";

const config = parseMiroirTestCliConfig();
await runMiroirTestsFromCLI(config);
