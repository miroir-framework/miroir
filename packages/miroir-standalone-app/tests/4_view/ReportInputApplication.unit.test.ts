import { describe, expect, it } from "vitest";

import {
  buildReportApplicationSwitchUrl,
  resolveReportInputApplicationDefault,
  seedReportInputApplicationFromPageParams,
} from "../../src/miroir-fwk/4_view/components/Reports/reportInputApplication.js";

const MIROIR_APP = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const LIBRARY_APP = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const NO_VALUE = "31f3a03a-f150-416d-9315-d3a752cb4eb4";

describe("reportInputApplication (#225 Versioning input)", () => {
  it("defaults to Miroir when page application is missing or noValue", () => {
    expect(resolveReportInputApplicationDefault(undefined)).toBe(MIROIR_APP);
    expect(resolveReportInputApplicationDefault(NO_VALUE)).toBe(MIROIR_APP);
  });

  it("keeps page application when set", () => {
    expect(resolveReportInputApplicationDefault(LIBRARY_APP)).toBe(LIBRARY_APP);
  });

  it("seeds versioningInput.application from pageParams", () => {
    const seeded = seedReportInputApplicationFromPageParams(
      { versioningInput: { application: MIROIR_APP } },
      {
        type: "list",
        definition: [
          {
            type: "inputReportSection",
            definition: {
              inputPrefix: "versioningInput",
              inputMLSchema: {
                type: "object",
                definition: { application: { type: "uuid" } },
              },
            },
          },
        ],
      },
      LIBRARY_APP,
    );
    expect(seeded.versioningInput.application).toBe(LIBRARY_APP);
  });

  it("builds a report URL switching application + deployment", () => {
    const url = buildReportApplicationSwitchUrl({
      application: LIBRARY_APP,
      applicationDeploymentMap: {
        [LIBRARY_APP]: LIBRARY_DEPLOYMENT,
        [MIROIR_APP]: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      },
      reportUuid: "c2b89408-bed7-473d-ab0a-2f4adc6a85e1",
      instanceUuid: "xxxxxx",
      reportUrl: (a, d, s, r, i) =>
        `/?page=report&application=${a}&deploymentUuid=${d}&applicationSection=${s}&reportUuid=${r}&instanceUuid=${i}`,
    });
    expect(url).toContain(`application=${LIBRARY_APP}`);
    expect(url).toContain(`deploymentUuid=${LIBRARY_DEPLOYMENT}`);
    // Non-Miroir apps expose Miroir scaffolding reports under model.
    expect(url).toContain("applicationSection=model");
  });

  it("uses data section when switching back to Miroir", () => {
    const url = buildReportApplicationSwitchUrl({
      application: MIROIR_APP,
      applicationDeploymentMap: {
        [LIBRARY_APP]: LIBRARY_DEPLOYMENT,
        [MIROIR_APP]: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
      },
      reportUuid: "c2b89408-bed7-473d-ab0a-2f4adc6a85e1",
      reportUrl: (a, d, s, r, i) =>
        `/?page=report&application=${a}&deploymentUuid=${d}&applicationSection=${s}&reportUuid=${r}&instanceUuid=${i ?? ""}`,
    });
    expect(url).toContain("applicationSection=data");
  });
});
