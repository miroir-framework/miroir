/**
 * #262 Slice 4 — selector visibility and denied deep-link.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  accessGrantsFromInstances,
  DESIGNER_APPLICATION_UUID,
  LIBRARY_APPLICATION_UUID,
} from "../../../../src/1_core/authentication/AccessPolicy.js";
import {
  nextPageWhenAccessDenied,
  visibleUserApplications,
} from "../../../../src/1_core/authentication/AuthenticationUi.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST === "access.262" || RUN_TEST.startsWith("access.262");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const RIGHT_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-admin/assets/admin_data/a6136fc7-949b-4d64-9f13-dd3afce1ab3c",
);

const ALICE = { miroirUserUuid: "1c39328c-7de4-44ae-bcf1-5bbc38d8e267", username: "alice" };
const CAROL = { miroirUserUuid: "30634877-08ae-44f3-a230-d899e22333d5", username: "carol" };
const LIBRARY_REPORT = `/?page=report&application=${LIBRARY_APPLICATION_UUID}`;
const CANDIDATES = [LIBRARY_APPLICATION_UUID, DESIGNER_APPLICATION_UUID];

function loadSeedGrants() {
  const rows = readdirSync(RIGHT_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(RIGHT_DIR, name), "utf8")));
  return accessGrantsFromInstances(rows);
}

if (runThis) {
  describe("access.262.phase4 visibleUserApplications", () => {
    const grants = loadSeedGrants();

    it("returns Library and Designer when the hatch is off", () => {
      expect(
        visibleUserApplications({
          enabled: false,
          principal: undefined,
          grants,
          candidates: CANDIDATES,
        }),
      ).toEqual(CANDIDATES);
    });

    it("lets Alice see Library but not Designer", () => {
      expect(
        visibleUserApplications({
          enabled: true,
          principal: ALICE,
          grants,
          candidates: CANDIDATES,
        }),
      ).toEqual([LIBRARY_APPLICATION_UUID]);
    });

    it("lets Carol see neither Library nor Designer", () => {
      expect(
        visibleUserApplications({
          enabled: true,
          principal: CAROL,
          grants,
          candidates: CANDIDATES,
        }),
      ).toEqual([]);
    });
  });

  describe("access.262.phase4 nextPageWhenAccessDenied", () => {
    it("keeps the intended page when access is allowed or the hatch is off", () => {
      expect(
        nextPageWhenAccessDenied({
          enabled: false,
          hasAccess: false,
          intended: LIBRARY_REPORT,
        }),
      ).toBe(LIBRARY_REPORT);
      expect(
        nextPageWhenAccessDenied({
          enabled: true,
          hasAccess: true,
          intended: LIBRARY_REPORT,
        }),
      ).toBe(LIBRARY_REPORT);
    });

    it("sends a denied report to home", () => {
      expect(
        nextPageWhenAccessDenied({
          enabled: true,
          hasAccess: false,
          intended: LIBRARY_REPORT,
        }),
      ).toBe("/?page=home");
    });
  });
}
