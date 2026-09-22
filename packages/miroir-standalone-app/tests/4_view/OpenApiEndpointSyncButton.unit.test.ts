import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(import.meta.dirname, "../../../..");

const BUTTON_PATH = join(
  REPO_ROOT,
  "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/OpenApiEndpointSyncButton.tsx",
);

const INSTANCE_SECTION_PATH = join(
  REPO_ROOT,
  "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionEntityInstance.tsx",
);

describe("OpenAPI Endpoint Sync button wiring", () => {
  it("mounts on Endpoint instance details and stays hidden unless the Endpoint is OpenAPI-based", () => {
    const buttonSource = readFileSync(BUTTON_PATH, "utf8");
    const instanceSource = readFileSync(INSTANCE_SECTION_PATH, "utf8");

    expect(instanceSource).toContain("OpenApiEndpointSyncButton");
    expect(instanceSource).toContain("endpoint={instance}");
    expect(instanceSource).toContain("ThemedHeaderSection");
    expect(buttonSource).toContain("looksLikeOpenApiEndpoint");
    expect(buttonSource).toContain("elementToDisplay");
    expect(buttonSource).toContain("buildOpenApiEndpointSyncComposite");
    expect(buttonSource).toContain('label="Sync"');
    expect(buttonSource).toContain("handleActionFromUI");
    expect(buttonSource).toContain("Endpoint definition synchronized with OpenAPI.");
    expect(buttonSource).not.toContain("handleCompositeAction");
  });
});
