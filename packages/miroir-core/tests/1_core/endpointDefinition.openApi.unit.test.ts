import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { isOpenApiExternalServiceEndpoint } from "../../src/0_interfaces/1_core/endpointDefinition.js";

const REPO_ROOT = join(import.meta.dirname, "../../../..");

const SPOTIFY_ENDPOINT = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-spotify/assets/spotify_model",
  "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
  "0e5cb172-12ea-4467-8598-5889338ae454.json",
);

const MODEL_ENDPOINT = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
  "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
  "7947ae40-eb34-4149-887b-15a9021e714e.json",
);

describe("isOpenApiExternalServiceEndpoint", () => {
  it("is true for the Spotify OpenAPI Endpoint asset", () => {
    const endpoint = JSON.parse(readFileSync(SPOTIFY_ENDPOINT, "utf8"));
    expect(isOpenApiExternalServiceEndpoint(endpoint)).toBe(true);
  });

  it("is false for an actions Endpoint", () => {
    const endpoint = JSON.parse(readFileSync(MODEL_ENDPOINT, "utf8"));
    expect(isOpenApiExternalServiceEndpoint(endpoint)).toBe(false);
  });

  it("is false for missing or empty definition", () => {
    expect(isOpenApiExternalServiceEndpoint(undefined)).toBe(false);
    expect(isOpenApiExternalServiceEndpoint(null)).toBe(false);
    expect(isOpenApiExternalServiceEndpoint({})).toBe(false);
    expect(
      isOpenApiExternalServiceEndpoint({
        definition: { externalService: { openApiDocument: "   " } },
      }),
    ).toBe(false);
  });

  it("is true when the details form also keeps the unused actions union key", () => {
    expect(
      isOpenApiExternalServiceEndpoint({
        definition: {
          actions: [],
          externalService: { openApiDocument: "{}" },
        },
      }),
    ).toBe(true);
  });

  it("is true when openApiDocument is a parsed object", () => {
    expect(
      isOpenApiExternalServiceEndpoint({
        definition: {
          externalService: { openApiDocument: { openapi: "3.0.0" } },
        },
      }),
    ).toBe(true);
  });
});
