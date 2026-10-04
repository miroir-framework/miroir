import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { materializeExternalServiceOperations } from "miroir-core";

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), "../assets");
const excerpt = JSON.parse(
  readFileSync(join(assetsDir, "test-resources/githubOpenApiExcerpt.json"), "utf8"),
);
const endpoint = JSON.parse(
  readFileSync(
    join(
      assetsDir,
      "github_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0c642e2a-3922-4ce7-99a6-88f91f6a103f.json",
    ),
    "utf8",
  ),
);
const externalService = endpoint.definition.externalService;

describe("GitHubService Endpoint", () => {
  it("enables the authenticated-user and repositories operations", () => {
    expect(externalService.enabledOperations).toEqual([
      "users/get-authenticated",
      "repos/list-for-authenticated-user",
    ]);
  });

  it("stores the committed excerpt as its OpenAPI document", () => {
    expect(JSON.parse(externalService.openApiDocument)).toEqual(excerpt);
  });

  it("names the GitHub description commit the excerpt comes from", () => {
    expect(excerpt.info.description).toMatch(
      /github\/rest-api-description\/blob\/[0-9a-f]{40}\/descriptions\/api\.github\.com\/api\.github\.com\.json/,
    );
  });

  it("has the operations the sync derives from the excerpt (npm run dogfood-sync)", () => {
    const result = materializeExternalServiceOperations({
      openApiDocument: excerpt,
      scope: externalService.enabledOperations,
      operationSync: externalService.operationSync,
    });
    expect(result).toEqual({ ok: true, operations: externalService.operations });
  });

  it("sends the token as a bearer header with GitHub's recommended headers", () => {
    expect(externalService.securityScheme).toEqual({ type: "http", scheme: "bearer" });
    expect(externalService.credentialKey).toBe("githubToken");
    expect(externalService.extraHeaders).toEqual({
      "User-Agent": "miroir-example-github",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    });
  });
});
