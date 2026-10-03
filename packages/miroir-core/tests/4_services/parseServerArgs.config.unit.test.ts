/**
 * #323: parseServerArgs records whether --config was given, so the server resolves a given path
 * against the working directory and the default beside its own module.
 */
import { describe, expect, it } from "vitest";

import { parseServerArgs } from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("parseServerArgs.config");

describe.runIf(runThis)("parseServerArgs --config (#323)", () => {
  it("returns the default path, not marked as given, without --config", () => {
    const parsed = parseServerArgs([]);
    expect(parsed.configFilePath).toBe("../config/miroirConfig.server.json");
    expect(parsed.configFileGiven).toBe(false);
  });

  it("returns the given path, marked as given, with --config", () => {
    const parsed = parseServerArgs(["--config", "my/server.json"]);
    expect(parsed.configFilePath).toBe("my/server.json");
    expect(parsed.configFileGiven).toBe(true);
  });
});
