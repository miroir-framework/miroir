// Agent backends (#409): `miroir-env check` warns about the `features.cursor` alias of `agentBackend`.
// vitest, not MiroirTest: the check command reads environment files and reports through the CLI.
import { describe, expect, it } from "vitest";

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

function check(features: Record<string, unknown>) {
  return run(["check", "--name", "dev"], temporaryRepository({ dev: { applications: { miroir, admin }, features } }));
}

describe("agentBackendAlias: miroir-env check and the features.cursor alias", () => {
  it("warns that features.cursor is replaced by features.agentBackend", async () => {
    const result = await check({ ai: true, mcp: true, cursor: true });
    expect(result.stdout).toMatch(/warning: .*features\.cursor.*features\.agentBackend: "cursor"/);
  });

  it("says agentBackend wins when both are set and differ", async () => {
    const result = await check({ ai: true, mcp: true, cursor: true, agentBackend: "claude" });
    expect(result.stdout).toMatch(/warning: .*features\.cursor.*ignored.*agentBackend "claude" wins/);
  });

  it("does not warn without features.cursor", async () => {
    const result = await check({ ai: true, mcp: true, agentBackend: "claude" });
    expect(result.stdout).not.toMatch(/features\.cursor/);
  });

  it("--strict turns the alias warning into an error", async () => {
    const result = await run(
      ["check", "--name", "dev", "--strict"],
      temporaryRepository({ dev: { applications: { miroir, admin }, features: { cursor: true } } }),
    );
    expect(result.stdout).toMatch(/error: .*features\.cursor/);
    expect(result.exitCode).toBe(1);
  });
});
