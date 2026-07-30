import { describe, expect, it } from "vitest";

import { resolveAppBarReportLinkApplication } from "../../src/miroir-fwk/4_view/components/Page/appBarReportNavigation.js";

const VERSIONING_UUID = "c2b89408-bed7-473d-ab0a-2f4adc6a85e1";
const MIROIR_APP = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const LIBRARY_APP = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const RUNNERS_UUID = "ac75382d-00fc-4f93-a169-3f76ef85834e";

describe("resolveAppBarReportLinkApplication (#225)", () => {
  it("Versioning always opens under Miroir (scaffolding report)", () => {
    expect(
      resolveAppBarReportLinkApplication({
        reportUuid: VERSIONING_UUID,
        itemSelfApplication: MIROIR_APP,
        versioningReportUuid: VERSIONING_UUID,
        applicationSelector: LIBRARY_APP,
      }),
    ).toBe(MIROIR_APP);
  });

  it("Versioning ignores empty applicationSelector and keeps Miroir", () => {
    expect(
      resolveAppBarReportLinkApplication({
        reportUuid: VERSIONING_UUID,
        itemSelfApplication: MIROIR_APP,
        versioningReportUuid: VERSIONING_UUID,
        applicationSelector: undefined,
      }),
    ).toBe(MIROIR_APP);
  });

  it("non-Versioning report links keep static selfApplication", () => {
    expect(
      resolveAppBarReportLinkApplication({
        reportUuid: RUNNERS_UUID,
        itemSelfApplication: MIROIR_APP,
        versioningReportUuid: VERSIONING_UUID,
        applicationSelector: LIBRARY_APP,
      }),
    ).toBe(MIROIR_APP);
  });
});
