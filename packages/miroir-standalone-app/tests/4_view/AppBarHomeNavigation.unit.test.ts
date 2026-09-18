import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveAppBarHomeNavigationUrl } from "../../src/miroir-fwk/4_view/components/Page/appBarReportNavigation.js";
import { pageUrl, reportUrl } from "../../src/miroir-fwk/4_view/navigation.js";

const LIBRARY_APP = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const LIBRARY_HOME_REPORT = "9c0cdb97-9537-4ee2-8053-a6ece3e0afe8";
const NO_VALUE = "cccccccc-cccc-cccc-cccc-cccccccccccc";

const libraryHomePageUrl = {
  label: "Library Home Page",
  section: "data" as const,
  selfApplication: LIBRARY_APP,
  reportUuid: LIBRARY_HOME_REPORT,
};

const deploymentMap = {
  [LIBRARY_APP]: LIBRARY_DEPLOYMENT,
};

describe("resolveAppBarHomeNavigationUrl (selected application home)", () => {
  it("navigates to the selected application's homePageUrl report", () => {
    expect(
      resolveAppBarHomeNavigationUrl({
        applicationSelector: LIBRARY_APP,
        noValueUuid: NO_VALUE,
        homePageUrl: libraryHomePageUrl,
        applicationDeploymentMap: deploymentMap,
      }),
    ).toBe(
      reportUrl(
        LIBRARY_APP,
        LIBRARY_DEPLOYMENT,
        "data",
        LIBRARY_HOME_REPORT,
        "xxxxxx",
      ),
    );
  });

  it("falls back to Miroir platform home when no application is selected", () => {
    expect(
      resolveAppBarHomeNavigationUrl({
        applicationSelector: undefined,
        noValueUuid: NO_VALUE,
        homePageUrl: libraryHomePageUrl,
        applicationDeploymentMap: deploymentMap,
      }),
    ).toBe(pageUrl("home"));
  });

  it("falls back to Miroir platform home when selector is noValue", () => {
    expect(
      resolveAppBarHomeNavigationUrl({
        applicationSelector: NO_VALUE,
        noValueUuid: NO_VALUE,
        homePageUrl: libraryHomePageUrl,
        applicationDeploymentMap: deploymentMap,
      }),
    ).toBe(pageUrl("home"));
  });

  it("falls back to Miroir platform home when selected app has no homePageUrl", () => {
    expect(
      resolveAppBarHomeNavigationUrl({
        applicationSelector: LIBRARY_APP,
        noValueUuid: NO_VALUE,
        homePageUrl: undefined,
        applicationDeploymentMap: deploymentMap,
      }),
    ).toBe(pageUrl("home"));
  });

  it("passes through string homePageUrl values", () => {
    const legacy = `/report/${LIBRARY_APP}/${LIBRARY_DEPLOYMENT}/data/${LIBRARY_HOME_REPORT}/xxxxx`;
    expect(
      resolveAppBarHomeNavigationUrl({
        applicationSelector: LIBRARY_APP,
        noValueUuid: NO_VALUE,
        homePageUrl: legacy,
        applicationDeploymentMap: deploymentMap,
      }),
    ).toBe(legacy);
  });

  it("AppBar Home icon uses resolveAppBarHomeNavigationUrl (not hardcoded pageUrl home)", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(
      join(here, "../../src/miroir-fwk/4_view/components/Page/AppBar.tsx"),
      "utf8",
    );
    expect(src).toContain("resolveAppBarHomeNavigationUrl");
    expect(src).not.toMatch(/onClick=\{\(\)\s*=>\s*navigate\(pageUrl\("home"\)\)\}/);
  });
});
