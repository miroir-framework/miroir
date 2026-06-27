import { describe, expect, it } from "vitest";

import emulatedServerSqlConfig from "../miroirConfig.test-emulatedServer-sql.json" assert { type: "json" };
import ciHostSqlConfig from "../miroirConfig.test-ci-emulatedServer-host-sql.json" assert { type: "json" };

import { deriveTestSessionDefaultsFromMiroirConfig, parsePostgresHostFromConnectionString } from "./deriveTestSessionDefaultsFromMiroirConfig.js";

describe("deriveTestSessionDefaultsFromMiroirConfig (Gap D2)", () => {
  it("derives postgresHost and adminStoreType from emulatedServer-sql fixture", () => {
    const defaults = deriveTestSessionDefaultsFromMiroirConfig(emulatedServerSqlConfig);

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
            "10ff36f2-50a3-48d8-b80f-e48e5d13af8e": {
              model: { emulatedServerType: "filesystem" },
            },
          },
        },
      }),
    ).toEqual({ appStoreType: "filesystem" });
  });

  it("derives app store + postgres host from CI host-sql fixture without admin deployment", () => {
    const defaults = deriveTestSessionDefaultsFromMiroirConfig(ciHostSqlConfig);

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
