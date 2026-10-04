/**
 * Writes the GitHubService Endpoint's openApiDocument and operations[] from the
 * committed GitHub OpenAPI excerpt, with the same conversion as syncExternalServiceSchema.
 * operationSync.<operationId>.boundPaths on the Endpoint chooses the response fields.
 *
 * Usage (from repo root):
 *   npm run dogfood-sync -w miroir-example-github
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { materializeExternalServiceOperations } from "miroir-core";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const excerptPath = join(packageRoot, "assets/test-resources/githubOpenApiExcerpt.json");
const endpointPath = join(
  packageRoot,
  "assets/github_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0c642e2a-3922-4ce7-99a6-88f91f6a103f.json",
);

const excerpt = JSON.parse(readFileSync(excerptPath, "utf8"));
const endpoint = JSON.parse(readFileSync(endpointPath, "utf8"));
const externalService = endpoint.definition.externalService;

const result = materializeExternalServiceOperations({
  openApiDocument: excerpt,
  scope: externalService.enabledOperations,
  operationSync: externalService.operationSync,
});
if (!result.ok) {
  throw new Error(`sync-github-schema: ${result.message}`);
}

endpoint.definition.externalService = {
  ...externalService,
  openApiDocument: JSON.stringify(excerpt),
  operations: result.operations,
};
writeFileSync(endpointPath, `${JSON.stringify(endpoint, null, 2)}\n`, "utf8");
console.log(
  `sync-github-schema: wrote ${result.operations.length} operations to ${endpointPath}`,
);
