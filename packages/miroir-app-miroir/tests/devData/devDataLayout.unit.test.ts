/**
 * #647: where the development information of the Miroir application lives. Its Entities are in the
 * model, its Reports and MiroirTests in the data section, and its rows in the devData section; no
 * application named Meta (#473) remains. Agent runs left for the AgentRuns application (#671).
 *
 * Not reachable through MiroirTest: it reads the package folders and the git index.
 * ```bash
 * npm run testByFile -w miroir-app-miroir -- devData/devDataLayout.unit
 * ```
 */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packagesRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../");

const ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const REPORT = "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916";
const MIROIR_TEST = "a311f363-e238-4203-bdfc-29e8c160c26b";

/** Where each kind lives, relative to packages/. */
const LOCATION = {
  entities: `miroir-app-miroir/assets/miroir_model/${ENTITY}`,
  reports: `miroir-app-miroir/assets/miroir_data/${REPORT}`,
  miroirTests: `miroir-app-miroir/assets/miroir_data/${MIROIR_TEST}`,
  rows: "miroir-app-miroir/assets/miroir_devData",
};

const ENTITIES: Record<string, string> = {
  "90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b": "BundleSizeMeasurement",
  "0266c0b8-4dc8-4a14-bcef-239a85a5de2d": "PageLoadMeasurement",
};
const REPORTS: Record<string, string> = {
  "e8c6faa5-a117-4afd-b7ae-4a40c6111f95": "BundleSizeHistory",
  "85077493-0fea-4969-96c8-b994272de284": "BundleSizeMeasurementDetails",
  "02dd2ead-7b8d-4160-99c9-9f4e9a1c051b": "PageLoadHistory",
  "193c3dea-792d-471a-88a0-546e4b5e81cf": "PageLoadMeasurementDetails",
};
const MIROIR_TESTS: Record<string, string> = {
  "d13c9b9e-36fa-4ef0-975b-53751862300a": "report.bundleSizeHistory",
  "24f5c213-c384-47b3-9648-0f91ddaa89ee": "report.pageLoadHistory",
};

/** Rows tracked on 2026-11-01: recording adds rows, so these must stay a subset. */
const BUNDLE_SIZE_ROWS = "0a439c56-a2e9-426e-8706-fec14fde3308 0b154bf7-6ede-483b-82cf-efd67da7f543 13c87979-c5ad-4a00-9cd0-b353451f1256 20593102-f83d-4cb9-b761-e1661b9dbbdb 4033f32b-1646-49ec-b22b-26bc5b9f74c2 4635dedc-0b71-48eb-b0af-f8a682dba80b 4c464d54-1d0b-42dc-a77b-8fe3b4124ebc 4dd9ed9c-282b-4978-97aa-e853e0ba37dd 55351ead-2226-4005-af81-50fb253b7ee0 5c1536e3-fded-49f7-9989-97416b411b16 5d89d824-6d13-41d3-af0e-7f82eaf89d51 7c852cdf-1765-4a57-9a11-307cda418393 8b80aa92-e89b-4d77-a550-a591f5026ebc 924f85a0-ec66-48fa-a6a6-5c3198379b97 92bb41c1-68b6-43ed-be16-d0cf224211cf 937a9520-844b-4092-9126-1f4e80b0db34 9f2a6504-e784-4044-8ce2-8fd8c5e73c41 b04933e9-558c-46c1-bc1d-d24d35e884c3 bb15df79-b5ff-457d-afc9-c4f011e7aa67 c1652fff-70ad-4403-a728-69bd6c6f6b88 c4f37ece-6b09-42a1-9ab4-388c4fe29ef6 c87a8952-27b3-4ff8-81cc-e1fcf0a56834 cc227681-a7da-4bf2-8d00-c83028a02693 d90d213d-ede5-4b38-adde-8389b36c3b87 e3b60263-1075-4330-9b5d-899a39c02913 e9276f45-2bbb-4a6a-bd5c-e005c2f77bec ed18922d-c7e9-4e59-9287-13960b964fa8 fccff018-c1fa-447f-8206-5e4982218ff8".split(" ");

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

describe("devData layout (#647)", () => {
  it("has the 2 measurement Entities", () => expectNamedFiles(LOCATION.entities, ENTITIES));
  it("has the 4 history Reports", () => expectNamedFiles(LOCATION.reports, REPORTS));
  it("has the 2 report MiroirTests", () => expectNamedFiles(LOCATION.miroirTests, MIROIR_TESTS));

  it("keeps every tracked bundle size row", () => {
    expect(rowUuids("90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b")).toEqual(expect.arrayContaining(BUNDLE_SIZE_ROWS));
  });

  it("holds no agent run: they are the AgentRuns application (#671)", () => {
    const AGENT_RUN_MEASUREMENT = "954de789-6350-4f54-a809-5f2b8b91d067";
    expect(existsSync(join(packagesRoot, LOCATION.entities, `${AGENT_RUN_MEASUREMENT}.json`))).toBe(false);
    expect(existsSync(join(packagesRoot, LOCATION.rows, AGENT_RUN_MEASUREMENT))).toBe(false);
  });

  it("keeps the devData helpers out of miroir-app-miroir's exports (D17)", () => {
    const index = readFileSync(join(packagesRoot, "miroir-app-miroir/index.ts"), "utf8");
    expect(index).not.toMatch(/from\s+["']\.\/scripts\//);
  });

  it("loads page load rows on demand", () => {
    const entity = readJson(join(packagesRoot, LOCATION.entities, "0266c0b8-4dc8-4a14-bcef-239a85a5de2d.json"));
    expect(entity.cache?.cacheAllInstancesOnRefresh).toBe(false);
  });

  it("leaves no Meta application (#647 G5)", () => {
    // package.json, not the folder: an older checkout keeps its ignored node_modules/ there
    expect(existsSync(join(packagesRoot, "miroir-app" + "-meta", "package.json"))).toBe(false);
    // built by concatenation, so that this file does not name them
    const names = [
      "miroir-app" + "-meta",
      "9ff432a9-89a1-460b" + "-a263-1672d084a9e0", // the Meta SelfApplication
      "40b74910-4c63-4bd9" + "-8e7d-2bc051342908", // the Meta Deployment
    ];
    const pattern = names.join("|");
    let found = "";
    try {
      found = execFileSync(
        "git",
        // code-helpers keeps the history of #473 and #647; a devData row may give a past reason
        ["grep", "-l", "-I", "-E", pattern, "--", ".", ":!code-helpers", ":!packages/*/assets/*_devData/*"],
        { cwd: join(packagesRoot, ".."), encoding: "utf8" },
      );
    } catch (error: any) {
      if (error.status !== 1) {
        throw error; // 1: no match
      }
    }
    expect(found.split("\n").filter(Boolean)).toEqual([]);
  });
});
