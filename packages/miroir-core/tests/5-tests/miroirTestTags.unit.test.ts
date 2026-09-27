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
import {
  getMiroirTestAllowedTags,
  getMiroirTestInstanceTags,
  MIROIR_TEST_MODE_TAGS,
  miroirTestSuiteModeTags,
} from "../../src/5_tests/miroirTestTags";
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
    const config = parseMiroirTestCliConfig({}, ["--tags", "tools, data"], ["fn.mustache.extractDoubleBracePatterns"]);
    expect(config.tags).toEqual(["tools", "data"]);
  });

  it("falls back to MIROIR_TEST_TAGS, argv wins", () => {
    expect(parseMiroirTestCliConfig({ MIROIR_TEST_TAGS: "tools" }, [], ["fn.mustache.extractDoubleBracePatterns"]).tags).toEqual([
      "tools",
    ]);
    expect(
      parseMiroirTestCliConfig({ MIROIR_TEST_TAGS: "tools" }, ["--tags", "data"], ["fn.mustache.extractDoubleBracePatterns"]).tags,
    ).toEqual(["data"]);
  });

  it("an empty --tags clears MIROIR_TEST_TAGS, also for the vitest process", () => {
    const config = parseMiroirTestCliConfig({ MIROIR_TEST_TAGS: "tools" }, ["--tags", ""], ["fn.mustache.extractDoubleBracePatterns"]);
    expect(config.tags).toEqual([]);
    expect(miroirTestCliConfigToEnv(config).MIROIR_TEST_TAGS).toBe("");
  });

  it("writes MIROIR_TEST_TAGS back for the vitest process", () => {
    const env = miroirTestCliConfigToEnv({
      suiteKeys: ["fn.mustache.extractDoubleBracePatterns"],
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
    expect(resolveCliSuiteKeysFromCatalog([], unitKeys, catalog, ["tools"])).toContain("fn.mustache.extractDoubleBracePatterns");
    expect(resolveCliSuiteKeysFromCatalog([], unitKeys, catalog, ["tools"])).not.toContain(
      "tr.core",
    );
  });

  it("intersects tags with named suites", () => {
    expect(
      resolveCliSuiteKeysFromCatalog(["fn.mustache.extractDoubleBracePatterns", "tr.core"], unitKeys, catalog, [
        "tools",
      ]),
    ).toEqual(["fn.mustache.extractDoubleBracePatterns"]);
  });

  it("leaves the selection alone without tags", () => {
    expect(resolveCliSuiteKeysFromCatalog(["fn.mustache.extractDoubleBracePatterns"], unitKeys, catalog)).toEqual(["fn.mustache.extractDoubleBracePatterns"]);
  });
});

describe("MiroirTest tags: schema", () => {
  it("a tagged instance passes model validation against the MiroirTest EntityVersion", () => {
    const mustache = miroirTestInstanceNamed("fn.mustache.extractDoubleBracePatterns");
    expect(mustache.tags).toEqual(["unit", "tools"]);
    const entityVersion = readJson(miroirTestEntityVersionPath);
    expect(entityVersion.entityUuid ?? ENTITY_MIROIR_TEST_UUID).toBe(ENTITY_MIROIR_TEST_UUID);
    const check = checkModelValidationInstance(
      entityVersion.mlSchema as MlElement,
      mustache,
      "fn.mustache.extractDoubleBracePatterns",
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
    expect(allowed).toHaveLength(23);
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

describe("MiroirTest tags: every test is tagged", () => {
  const allowedTags = getMiroirTestAllowedTags(loadMiroirTestEntityFromFolders(repoRoot)) ?? [];
  const instances = loadApplicationMiroirTestsFromFolders(repoRoot);

  it("every MiroirTest instance has at least one tag", () => {
    const untagged = instances
      .filter((instance) => getMiroirTestInstanceTags(instance).length === 0)
      .map((instance) => instance.name);
    expect(untagged).toEqual([]);
  });

  it("every tag of every MiroirTest instance is allowed by the MiroirTest Entity", () => {
    const unknown = instances.flatMap((instance) =>
      getMiroirTestInstanceTags(instance)
        .filter((tag) => !allowedTags.includes(tag))
        .map((tag) => `${instance.name}: ${tag}`),
    );
    expect(unknown).toEqual([]);
  });
});

describe("MiroirTest issue", () => {
  const instances = loadApplicationMiroirTestsFromFolders(repoRoot);

  it("an instance with an issue passes model validation against the MiroirTest EntityVersion", () => {
    const testPattern = miroirTestInstanceNamed("ui.mlElementEditor.allTypesPattern");
    expect(testPattern.issue).toBe("303");
    const check = checkModelValidationInstance(
      readJson(miroirTestEntityVersionPath).mlSchema as MlElement,
      testPattern,
      "ui.mlElementEditor.allTypesPattern",
      defaultMiroirModelEnvironment,
    );
    expect(check.status).toBe("ok");
  });

  it("every issue, when present, is a GitHub issue number", () => {
    const malformed = instances
      .filter((instance: any) => instance.issue !== undefined && !/^[1-9]\d*$/.test(instance.issue))
      .map((instance: any) => `${instance.name}: ${instance.issue}`);
    expect(malformed).toEqual([]);
  });
});

describe("MiroirTest mode tags (#316)", () => {
  const catalog = loadApplicationMiroirTestCatalog(repoRoot);

  it("the MiroirTest Entity allows unit, integ and ui, identically in its EntityVersion", () => {
    const allowed = getMiroirTestAllowedTags(loadMiroirTestEntityFromFolders(repoRoot));
    expect(allowed).toEqual(expect.arrayContaining([...MIROIR_TEST_MODE_TAGS]));
    expect(getMiroirTestAllowedTags(readJson(miroirTestEntityVersionPath))).toEqual(allowed);
  });

  it("every MiroirTest instance carries exactly the mode tags derived from its leaves, first", () => {
    const wrong = catalog
      .map((entry) => {
        const expected = miroirTestSuiteModeTags(entry.suiteDefinition);
        const tags = getMiroirTestInstanceTags(entry.instance);
        return { name: entry.suiteKey, expected, actual: tags.slice(0, expected.length), tags };
      })
      .filter(
        (row) =>
          row.expected.join(",") !== row.actual.join(",") ||
          row.tags.filter((tag) => (MIROIR_TEST_MODE_TAGS as readonly string[]).includes(tag)).length !==
            row.expected.length,
      );
    expect(wrong).toEqual([]);
  });

  it("--tags ui selects exactly the suites with reactComponentTest leaves", () => {
    const uiSuites = catalog
      .filter((entry) => miroirTestSuiteModeTags(entry.suiteDefinition).includes("ui"))
      .map((entry) => entry.suiteKey)
      .sort();
    expect(uiSuites.length).toBeGreaterThan(0);
    expect(
      resolveCliSuiteKeysFromCatalog([], listCliUnitSuiteKeysFromFolders(repoRoot), catalog, ["ui"]).sort(),
    ).toEqual(uiSuites);
  });
});
