// Load timings (#580): `client.loadTimings` of an environment reaches both client configurations, and
// `miroir-env check` refuses a malformed value.
// vitest, not MiroirTest: environments are files read before any Miroir store opens.
import { describe, expect, it } from "vitest";

import { environmentClientConfig, environmentRealServerClientConfig } from "../src/environmentState";
import { resolveEnvironmentFromFiles } from "../src/environmentFiles";
import { run, temporaryRepository } from "./cliTestSupport";

const miroir = {
  package: "miroir-app-miroir",
  selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  deployment: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  store: "filesystem",
  mode: "live",
};
const admin = {
  package: "miroir-app-admin",
  selfApplication: "55af124e-8c05-4bae-a3ef-0933d41daa92",
  deployment: "18db21bf-f8d3-4f6a-8296-84b69f6dc48b",
  store: "filesystem",
  mode: "live",
};

function environment(client: Record<string, unknown>) {
  return {
    server: { rootApiUrl: "https://localhost:3080" },
    client,
    applications: { miroir, admin },
  };
}

describe("loadTimingsClientConfig: client.loadTimings in the client configurations", () => {
  it("carries client.loadTimings into both client configurations", () => {
    const loadTimings = { enabled: true, record: false, quietWindowMs: 2000 };
    const cwd = temporaryRepository({ dev: environment({ mode: "realServer", loadTimings }) });
    const resolved = resolveEnvironmentFromFiles({ cwd, env: {}, name: "dev" });
    expect(environmentRealServerClientConfig(resolved).loadTimings).toEqual(loadTimings);
    expect(environmentClientConfig(resolved).loadTimings).toEqual(loadTimings);
  });

  it("leaves it out when the environment does not set it", () => {
    const cwd = temporaryRepository({ dev: environment({ mode: "realServer" }) });
    const resolved = resolveEnvironmentFromFiles({ cwd, env: {}, name: "dev" });
    expect("loadTimings" in environmentRealServerClientConfig(resolved)).toBe(false);
  });

  it("refuses a malformed value", async () => {
    const cwd = temporaryRepository({ dev: environment({ mode: "realServer", loadTimings: { enabled: "yes" } }) });
    const result = await run(["check", "--name", "dev"], cwd);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toMatch(/error: .*dev/);
  });
});
