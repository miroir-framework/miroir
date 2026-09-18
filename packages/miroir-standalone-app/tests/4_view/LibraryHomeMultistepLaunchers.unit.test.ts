import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MULTISTEP_COUNTRY_CREATE = "d2b2fbbd-6844-4422-8412-4e3c303296bc";

describe("LibraryHome multistep launchers", () => {
  it("exposes MultistepCountryCreate via openReportSection on the home page", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const homePath = join(
      here,
      "../../../miroir-test-app_deployment-library/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/9c0cdb97-9537-4ee2-8053-a6ece3e0afe8.json",
    );
    const home = JSON.parse(readFileSync(homePath, "utf8")) as {
      definition: {
        section: {
          definition: Array<{
            type: string;
            definition?: { reportUuid?: string; openAs?: string; label?: string };
          }>;
        };
      };
    };
    const openSections = home.definition.section.definition.filter(
      (section) => section.type === "openReportSection",
    );
    const reportUuids = openSections.map((section) => section.definition?.reportUuid);
    expect(reportUuids).toEqual([MULTISTEP_COUNTRY_CREATE]);
    expect(openSections.every((section) => section.definition?.openAs === "route")).toBe(true);
  });
});
