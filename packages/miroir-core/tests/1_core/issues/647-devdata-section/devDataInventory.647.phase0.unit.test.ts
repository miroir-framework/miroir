/**
 * #647 — inventory of the development information that moves from miroir-app-meta to the devData
 * section of the Miroir application. The LOCATION table says where each kind lives; the slices of
 * the plan change it, so the same test proves the move.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packagesRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../../../");

const ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const REPORT = "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916";
const MIROIR_TEST = "a311f363-e238-4203-bdfc-29e8c160c26b";

/** Where each kind lives, relative to packages/. */
const LOCATION = {
  entities: `miroir-app-miroir/assets/miroir_model/${ENTITY}`,
  reports: `miroir-app-meta/assets/meta_model/${REPORT}`,
  miroirTests: `miroir-app-meta/assets/meta_model/${MIROIR_TEST}`,
  rows: "miroir-app-miroir/assets/miroir_devData",
};

const ENTITIES: Record<string, string> = {
  "90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b": "BundleSizeMeasurement",
  "0266c0b8-4dc8-4a14-bcef-239a85a5de2d": "PageLoadMeasurement",
  "954de789-6350-4f54-a809-5f2b8b91d067": "AgentRunMeasurement",
};
const REPORTS: Record<string, string> = {
  "e8c6faa5-a117-4afd-b7ae-4a40c6111f95": "BundleSizeHistory",
  "85077493-0fea-4969-96c8-b994272de284": "BundleSizeMeasurementDetails",
  "02dd2ead-7b8d-4160-99c9-9f4e9a1c051b": "PageLoadHistory",
  "193c3dea-792d-471a-88a0-546e4b5e81cf": "PageLoadMeasurementDetails",
  "7a695632-338e-4c33-8b39-dba7f6d4c988": "AgentRunHistory",
  "49a3c09a-c7cd-4438-9730-c691c70741af": "AgentRunMeasurementDetails",
};
const MIROIR_TESTS: Record<string, string> = {
  "d13c9b9e-36fa-4ef0-975b-53751862300a": "report.bundleSizeHistory",
  "24f5c213-c384-47b3-9648-0f91ddaa89ee": "report.pageLoadHistory",
  "ed680b8e-ae0b-40a8-873d-92d92c7191e5": "report.agentRunHistory",
};

/** Rows tracked on 2026-11-01: recording adds rows, so these must stay a subset. */
const BUNDLE_SIZE_ROWS = "0a439c56-a2e9-426e-8706-fec14fde3308 0b154bf7-6ede-483b-82cf-efd67da7f543 13c87979-c5ad-4a00-9cd0-b353451f1256 20593102-f83d-4cb9-b761-e1661b9dbbdb 4033f32b-1646-49ec-b22b-26bc5b9f74c2 4635dedc-0b71-48eb-b0af-f8a682dba80b 4c464d54-1d0b-42dc-a77b-8fe3b4124ebc 4dd9ed9c-282b-4978-97aa-e853e0ba37dd 55351ead-2226-4005-af81-50fb253b7ee0 5c1536e3-fded-49f7-9989-97416b411b16 5d89d824-6d13-41d3-af0e-7f82eaf89d51 7c852cdf-1765-4a57-9a11-307cda418393 8b80aa92-e89b-4d77-a550-a591f5026ebc 924f85a0-ec66-48fa-a6a6-5c3198379b97 92bb41c1-68b6-43ed-be16-d0cf224211cf 937a9520-844b-4092-9126-1f4e80b0db34 9f2a6504-e784-4044-8ce2-8fd8c5e73c41 b04933e9-558c-46c1-bc1d-d24d35e884c3 bb15df79-b5ff-457d-afc9-c4f011e7aa67 c1652fff-70ad-4403-a728-69bd6c6f6b88 c4f37ece-6b09-42a1-9ab4-388c4fe29ef6 c87a8952-27b3-4ff8-81cc-e1fcf0a56834 cc227681-a7da-4bf2-8d00-c83028a02693 d90d213d-ede5-4b38-adde-8389b36c3b87 e3b60263-1075-4330-9b5d-899a39c02913 e9276f45-2bbb-4a6a-bd5c-e005c2f77bec ed18922d-c7e9-4e59-9287-13960b964fa8 fccff018-c1fa-447f-8206-5e4982218ff8".split(" ");
const AGENT_RUN_ROWS = "001d9c4f-3589-4c00-a2f2-705800d685ac 059a6dfa-5176-4837-8fb3-f1d838097423 1f8818d7-cebd-4756-a315-7faa7ec50f93 25330ff4-9765-438e-9e6d-a7237c53e57a 2631e019-dc7c-4f36-b6ec-26b02aab2cd6 4b315479-3a81-4171-9fac-7c340e595e2f 50a30266-c429-4f87-b1f3-4180aff0a38b 587a7192-a159-41b3-aecb-c81029aaeb2c 5bf75438-9ff1-464f-8592-69b18e72f8c3 672275a8-6ac4-4096-a993-7677cd632f43 6a5503f1-1692-4334-8c15-9975a930f5f8 6e63687d-9d51-48bc-a9d8-6f98ee3146bd 7c3fda97-493f-428d-abae-291bbad9b4e6 8673fac9-bf94-4d9f-9f76-1e067f22b1bc 8794a892-47ce-4a31-a920-b6db593c2c53 8af7d763-62bf-40df-b871-b164ff035940 a28ea77d-a021-48b6-b5d9-f7e58ce8cf24 a9376d13-062b-4e4b-910e-6bae7ad290cc ab2d126b-f9bd-45e7-b2e2-88fb1ad87856 c627612d-cf0b-45bb-abf8-d7e2c47bceaf ceb640ad-db41-42ac-bb70-dd31a8d120fc d779aca1-e246-476c-8601-52a650373160 ee2b2ee6-bbf8-4b7c-aecd-dcba39014769 fa7a88db-8406-4460-b2c2-737d2d88d4a8".split(" ");

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, "utf8"));
}

function expectNamedFiles(folder: string, expected: Record<string, string>) {
  for (const [uuid, name] of Object.entries(expected)) {
    const file = join(packagesRoot, folder, `${uuid}.json`);
    expect(existsSync(file), file).toBe(true);
    expect(readJson(file).name).toBe(name);
  }
}

function rowUuids(entityUuid: string): string[] {
  const folder = join(packagesRoot, LOCATION.rows, entityUuid);
  return readdirSync(folder)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

describe("devData inventory (#647)", () => {
  it("has the 3 measurement Entities", () => expectNamedFiles(LOCATION.entities, ENTITIES));
  it("has the 6 history Reports", () => expectNamedFiles(LOCATION.reports, REPORTS));
  it("has the 3 report MiroirTests", () => expectNamedFiles(LOCATION.miroirTests, MIROIR_TESTS));

  it("keeps every tracked bundle size row", () => {
    expect(rowUuids("90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b")).toEqual(expect.arrayContaining(BUNDLE_SIZE_ROWS));
  });

  it("keeps every tracked agent run row", () => {
    expect(rowUuids("954de789-6350-4f54-a809-5f2b8b91d067")).toEqual(expect.arrayContaining(AGENT_RUN_ROWS));
  });

  it("keeps the devData helpers out of miroir-app-miroir's exports (D17)", () => {
    const index = readFileSync(join(packagesRoot, "miroir-app-miroir/index.ts"), "utf8");
    expect(index).not.toMatch(/from\s+["']\.\/scripts\//);
  });

  it("loads page load rows on demand", () => {
    const entity = readJson(join(packagesRoot, LOCATION.entities, "0266c0b8-4dc8-4a14-bcef-239a85a5de2d.json"));
    expect(entity.cache?.cacheAllInstancesOnRefresh).toBe(false);
  });
});
