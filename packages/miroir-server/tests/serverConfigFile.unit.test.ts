/**
 * #323: `--config <path>` is read relative to the working directory; the default stays beside the
 * server module (src/ or the release/ bundle), with the release/config/ copy as fallback.
 */
import path from "node:path";
import { describe, expect, it } from "vitest";

import { resolveServerConfigFilePath } from "../src/serverConfigFile.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("serverConfigFile");

const cwd = path.resolve("/work/dir");
const serverModuleDir = path.resolve("/miroir/packages/miroir-server/release");
const DEFAULT = "../config/miroirConfig.server.json";

describe.runIf(runThis)("resolveServerConfigFilePath (#323)", () => {
  it("resolves a given relative --config against the working directory", () => {
    expect(
      resolveServerConfigFilePath({ configFilePath: "conf/my.json", configFileGiven: true, cwd, serverModuleDir }),
    ).toBe(path.resolve(cwd, "conf/my.json"));
  });

  it("keeps a given absolute --config as is", () => {
    const absolute = path.resolve("/etc/miroir/server.json");
    expect(
      resolveServerConfigFilePath({ configFilePath: absolute, configFileGiven: true, cwd, serverModuleDir }),
    ).toBe(absolute);
  });

  it("resolves a given --config equal to the default against the working directory", () => {
    expect(
      resolveServerConfigFilePath({ configFilePath: DEFAULT, configFileGiven: true, cwd, serverModuleDir }),
    ).toBe(path.resolve(cwd, DEFAULT));
  });

  it("resolves the default beside the server module when that file exists", () => {
    const expected = path.resolve(serverModuleDir, DEFAULT);
    expect(
      resolveServerConfigFilePath({
        configFilePath: DEFAULT,
        configFileGiven: false,
        cwd,
        serverModuleDir,
        fileExists: (p) => p === expected,
      }),
    ).toBe(expected);
  });

  it("falls back to the release/config copy when the default is absent", () => {
    const releaseCopy = path.resolve(serverModuleDir, "config", "miroirConfig.server.json");
    expect(
      resolveServerConfigFilePath({
        configFilePath: DEFAULT,
        configFileGiven: false,
        cwd,
        serverModuleDir,
        fileExists: (p) => p === releaseCopy,
      }),
    ).toBe(releaseCopy);
  });

  it("reports the default path when neither file exists", () => {
    expect(
      resolveServerConfigFilePath({
        configFilePath: DEFAULT,
        configFileGiven: false,
        cwd,
        serverModuleDir,
        fileExists: () => false,
      }),
    ).toBe(path.resolve(serverModuleDir, DEFAULT));
  });
});
