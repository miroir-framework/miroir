import { describe, expect, it } from "vitest";

import { environmentClientConfig, resolveEnvironmentFromFiles } from "miroir-env";

import { deriveTestSessionDefaultsFromMiroirConfig, parsePostgresHostFromConnectionString } from "./deriveTestSessionDefaultsFromMiroirConfig.js";
import { resolveRepoRoot } from "./integrationTestProfiles.js";

const MIROIR_DEPLOYMENT = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";

describe("deriveTestSessionDefaultsFromMiroirConfig (Gap D2)", () => {
  it("derives postgresHost and adminStoreType from the test-sql environment", () => {
    const defaults = deriveTestSessionDefaultsFromMiroirConfig(
      environmentClientConfig(resolveEnvironmentFromFiles({ cwd: resolveRepoRoot(), env: { MIROIR_ENV: "test-sql" } })),
    );

    expect(defaults.adminStoreType).toBe("filesystem");
    expect(defaults.appStoreType).toBe("sql");
    expect(defaults.postgresHost).toBe("localhost");
  });

  it("returns partial result when deployment sections are missing (no throw)", () => {
    expect(deriveTestSessionDefaultsFromMiroirConfig({ client: {} })).toEqual({});
    expect(
      deriveTestSessionDefaultsFromMiroirConfig({ client: { deploymentStorageConfig: {} } }),
    ).toEqual({});
    expect(
      deriveTestSessionDefaultsFromMiroirConfig({
        client: {
          deploymentStorageConfig: {
            [MIROIR_DEPLOYMENT]: {
              model: { emulatedServerType: "filesystem" },
            },
          },
        },
      }),
    ).toEqual({ appStoreType: "filesystem" });
  });

  it("derives app store + postgres host from a configuration without admin deployment", () => {
    const defaults = deriveTestSessionDefaultsFromMiroirConfig({
      client: {
        deploymentStorageConfig: {
          [MIROIR_DEPLOYMENT]: {
            model: {
              emulatedServerType: "sql",
              connectionString: "postgres://postgres@host.docker.internal:5432/postgres",
            },
          },
        },
      },
    });

    expect(defaults.adminStoreType).toBeUndefined();
    expect(defaults.appStoreType).toBe("sql");
    expect(defaults.postgresHost).toBe("host.docker.internal");
  });

  it("parsePostgresHostFromConnectionString extracts hostname", () => {
    expect(
      parsePostgresHostFromConnectionString(
        "postgres://postgres:postgres@localhost:5432/postgres",
      ),
    ).toBe("localhost");
    expect(
      parsePostgresHostFromConnectionString(
        "postgresql://postgres:postgres@host.docker.internal:5432/postgres",
      ),
    ).toBe("host.docker.internal");
  });
});
