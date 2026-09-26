import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { MlElement } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultMiroirModelEnvironment } from "../../src/1_core/Model";
import { ENTITY_MIROIR_TEST_UUID } from "../../src/5_tests/applicationMiroirTestFolders";
import {
  listCliUnitSuiteKeysFromFolders,
  loadApplicationMiroirTestCatalog,
  loadApplicationMiroirTestsFromFolders,
  loadMiroirTestEntityFromFolders,
  resolveCliSuiteKeysFromCatalog,
  resolveMonorepoRoot,
} from "../../src/5_tests/loadApplicationMiroirTestsFromFolders";
import { getMiroirTestAllowedTags } from "../../src/5_tests/miroirTestTags";
import { checkModelValidationInstance } from "../../src/5_tests/ModelValidationTools";
import {
  miroirTestCliConfigToEnv,
  parseMiroirTestCliConfig,
} from "../../src/5_tests/parseMiroirTestCliConfig";

const repoRoot = resolveMonorepoRoot();
const miroirTestEntityVersionPath = join(
  repoRoot,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/51c647fe-07ec-411c-89cc-02689dc66d6a.json",
);

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function miroirTestInstanceNamed(name: string): any {
  const instance = loadApplicationMiroirTestsFromFolders(repoRoot).find(
    (candidate) => candidate.name === name,
  );
  if (!instance) {
    throw new Error(`no MiroirTest instance named ${name}`);
  }
  return instance;
}

describe("MiroirTest tags: CLI config", () => {
  it("reads --tags from argv, trimmed", () => {
    const config = parseMiroirTestCliConfig({}, ["--tags", "tools, data"], ["mustache"]);
    expect(config.tags).toEqual(["tools", "data"]);
  });

  it("falls back to MIROIR_TEST_TAGS, argv wins", () => {
    expect(parseMiroirTestCliConfig({ MIROIR_TEST_TAGS: "tools" }, [], ["mustache"]).tags).toEqual([
      "tools",
    ]);
    expect(
      parseMiroirTestCliConfig({ MIROIR_TEST_TAGS: "tools" }, ["--tags", "data"], ["mustache"]).tags,
    ).toEqual(["data"]);
  });

  it("writes MIROIR_TEST_TAGS back for the vitest process", () => {
    const env = miroirTestCliConfigToEnv({
      suiteKeys: ["mustache"],
      executionMode: "unit",
      tags: ["tools", "data"],
    });
    expect(env.MIROIR_TEST_TAGS).toBe("tools,data");
  });
});

describe("MiroirTest tags: selection over the folder catalog", () => {
  const catalog = loadApplicationMiroirTestCatalog(repoRoot);
  const unitKeys = listCliUnitSuiteKeysFromFolders(repoRoot);

  it("selects the suites carrying a tag when no suite is named", () => {
    expect(resolveCliSuiteKeysFromCatalog([], unitKeys, catalog, ["tools"])).toContain("mustache");
    expect(resolveCliSuiteKeysFromCatalog([], unitKeys, catalog, ["tools"])).not.toContain(
      "miroirCoreTransformers",
    );
  });

  it("intersects tags with named suites", () => {
    expect(
      resolveCliSuiteKeysFromCatalog(["mustache", "miroirCoreTransformers"], unitKeys, catalog, [
        "tools",
      ]),
    ).toEqual(["mustache"]);
  });

  it("leaves the selection alone without tags", () => {
    expect(resolveCliSuiteKeysFromCatalog(["mustache"], unitKeys, catalog)).toEqual(["mustache"]);
  });
});

describe("MiroirTest tags: schema", () => {
  it("a tagged instance passes model validation against the MiroirTest EntityVersion", () => {
    const mustache = miroirTestInstanceNamed("mustache");
    expect(mustache.tags).toEqual(["tools"]);
    const entityVersion = readJson(miroirTestEntityVersionPath);
    expect(entityVersion.entityUuid ?? ENTITY_MIROIR_TEST_UUID).toBe(ENTITY_MIROIR_TEST_UUID);
    const check = checkModelValidationInstance(
      entityVersion.mlSchema as MlElement,
      mustache,
      "mustache",
      defaultMiroirModelEnvironment,
    );
    expect(check.status).toBe("ok");
  });
});

describe("MiroirTest tags: vocabulary from the MiroirTest Entity", () => {
  const catalog = loadApplicationMiroirTestCatalog(repoRoot);
  const unitKeys = listCliUnitSuiteKeysFromFolders(repoRoot);
  const miroirTestEntity = loadMiroirTestEntityFromFolders(repoRoot);

  it("reads the allowed tags from the live Entity row, in declaration order", () => {
    expect(miroirTestEntity.uuid).toBe(ENTITY_MIROIR_TEST_UUID);
    const allowed = getMiroirTestAllowedTags(miroirTestEntity);
    expect(allowed).toHaveLength(20);
    expect(allowed?.slice(0, 3)).toEqual(["transformer", "ml-schema", "ml-union"]);
    expect(allowed).toContain("tools");
  });

  it("accepts any tag when the Entity declares plain string tags", () => {
    const unconstrained: any = structuredClone(miroirTestEntity);
    unconstrained.mlSchema.definition.tags.definition = { type: "string" };
    expect(getMiroirTestAllowedTags(unconstrained)).toBeUndefined();
  });

  it("rejects an unknown tag, listing the allowed ones", () => {
    expect(() => resolveCliSuiteKeysFromCatalog([], unitKeys, catalog, ["toolz"])).toThrow(
      /Unknown tag "toolz".*transformer, ml-schema/,
    );
  });

  it("rejects a tag selection that matches no available suite", () => {
    expect(() => resolveCliSuiteKeysFromCatalog([], unitKeys, catalog, ["mcp"])).toThrow(
      /No suite carries any of the tags mcp/,
    );
  });
});
