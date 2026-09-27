/**
 * MiroirTest naming (#316): `<kind>.<subject>[.<variant>]` names, root label equal to the name,
 * one-sentence descriptions. Rules: docs/reference/testing.md, "Names and descriptions".
 */
import { describe, expect, it } from "vitest";

import type { MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { inferUiIntegrationRunnerSuiteKind } from "../../src/5_tests/applicationMiroirTestCatalog";
import { walkMiroirTestLeaves } from "../../src/5_tests/inferIntegrationSessionKind";
import {
  loadApplicationMiroirTestCatalog,
  resolveMonorepoRoot,
} from "../../src/5_tests/loadApplicationMiroirTestsFromFolders";

const catalog = loadApplicationMiroirTestCatalog(resolveMonorepoRoot());

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Kind of a suite, from its leaf types; the first match wins. */
function kindFromLeaves(suite: MiroirTestSuite): string {
  const types = new Set(walkMiroirTestLeaves(suite).map((leaf) => leaf.miroirTestType));
  if (types.has("reactComponentTest")) return "ui";
  if (types.has("reportTest")) return "report";
  if (types.has("runnerTest")) return "runner";
  if (types.has("actionTest")) return "action";
  if (types.has("queryTest")) return "query";
  if (types.has("functionCallTest")) return "fn";
  return "tr";
}

describe("MiroirTest naming", () => {
  it("names use only letters, digits, '.', '_', '-'", () => {
    expect(catalog.map((entry) => entry.suiteKey).filter((name) => !/^[A-Za-z0-9._-]+$/.test(name))).toEqual([]);
  });

  it("a name is its kind followed by camelCase segments", () => {
    const wrong = catalog
      .filter((entry) => {
        const kind = kindFromLeaves(entry.suiteDefinition);
        return !new RegExp(`^${kind}(\\.[a-z][A-Za-z0-9]*)+$`).test(entry.suiteKey);
      })
      .map((entry) => entry.suiteKey);
    expect(wrong).toEqual([]);
  });

  it("the root miroirTestLabel equals the name", () => {
    expect(
      catalog
        .filter((entry) => entry.suiteDefinition.miroirTestLabel !== entry.suiteKey)
        .map((entry) => `${entry.suiteKey} / ${entry.suiteDefinition.miroirTestLabel}`),
    ).toEqual([]);
  });

  it("a description is one sentence with no issue number, uuid or history", () => {
    const wrong = catalog
      .filter((entry) => {
        const description = entry.instance.description ?? "";
        return (
          !description.endsWith(".") ||
          /\. [A-Z]/.test(description) ||
          /#\d|\b(Issue|Feature|Phase|Slice|Migrated)\b/.test(description) ||
          UUID.test(description)
        );
      })
      .map((entry) => `${entry.suiteKey}: ${entry.instance.description}`);
    expect(wrong).toEqual([]);
  });

  it("UI launch kinds follow the name: action.domainController.*, action.scenario.*, runner.*", () => {
    const wrong = catalog
      .map((entry) => ({
        name: entry.suiteKey,
        kind: inferUiIntegrationRunnerSuiteKind(entry.suiteDefinition, entry.suiteKey),
      }))
      .filter(({ name, kind }) =>
        name.startsWith("action.domainController.")
          ? kind !== "domainControllerTest"
          : name.startsWith("action.scenario.")
            ? kind !== "actionTest"
            : name.startsWith("runner.")
              ? kind !== "runnerTest"
              : false,
      );
    expect(wrong).toEqual([]);
  });
});
