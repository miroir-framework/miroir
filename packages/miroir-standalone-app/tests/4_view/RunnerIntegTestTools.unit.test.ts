import { describe, expect, it } from "vitest";

import { testApplicationStorageConfiguration } from "./RunnerIntegTestTools.js";

describe("testApplicationStorageConfiguration", () => {
  it("creates a distinct MongoDB database for the ephemeral test deployment", () => {
    const configuration = testApplicationStorageConfiguration(
      {
        admin: {
          emulatedServerType: "mongodb",
          connectionString: "mongodb://localhost:27017",
          database: "miroir-admin",
        },
        model: {
          emulatedServerType: "mongodb",
          connectionString: "mongodb://localhost:27017",
          database: "library",
        },
        data: {
          emulatedServerType: "mongodb",
          connectionString: "mongodb://localhost:27017",
          database: "library",
        },
      },
      "runner_library_ephemeral",
    );

    expect(configuration).toMatchObject({
      admin: {
        emulatedServerType: "mongodb",
        database: "miroir-admin",
      },
      model: {
        emulatedServerType: "mongodb",
        connectionString: "mongodb://localhost:27017",
        database: "runner_library_ephemeral",
      },
      data: {
        emulatedServerType: "mongodb",
        connectionString: "mongodb://localhost:27017",
        database: "runner_library_ephemeral",
      },
    });
  });
});
