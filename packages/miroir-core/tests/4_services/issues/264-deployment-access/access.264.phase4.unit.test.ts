/**
 * #264 Slice 4 — Dave sees Library via deployment grant; Carol still sees neither.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ALWAYS_ALLOW_APPLICATION_TARGETS,
  DESIGNER_APPLICATION_UUID,
  LIBRARY_APPLICATION_UUID,
  accessGrantsFromInstances,
  deploymentsFromInstances,
  hasAccess,
} from "../../../../src/1_core/authentication/AccessPolicy.js";
import {
  applicationIsReachable,
  nextPageWhenAccessDenied,
  visibleUserApplications,
} from "../../../../src/1_core/authentication/AuthenticationUi.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST === "access.264" || RUN_TEST.startsWith("access.264");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const ADMIN_DATA = join(REPO_ROOT, "packages/miroir-test-app_deployment-admin/assets/admin_data");
const RIGHT_DIR = join(ADMIN_DATA, "a6136fc7-949b-4d64-9f13-dd3afce1ab3c");
const DEPLOYMENT_DIR = join(ADMIN_DATA, "7959d814-400c-4e80-988f-a00fe582ab98");

const ALICE = { miroirUserUuid: "1c39328c-7de4-44ae-bcf1-5bbc38d8e267", username: "alice" };
const CAROL = { miroirUserUuid: "30634877-08ae-44f3-a230-d899e22333d5", username: "carol" };
const DAVE = { miroirUserUuid: "e2343a39-f5d9-4898-83b4-74e2ccc33125", username: "dave" };
const LIBRARY_REPORT = `/?page=report&application=${LIBRARY_APPLICATION_UUID}`;
const CANDIDATES = [LIBRARY_APPLICATION_UUID, DESIGNER_APPLICATION_UUID];

function readJsonDir(dir: string): Record<string, unknown>[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")) as Record<string, unknown>);
}

if (runThis) {
  describe("access.264.phase4 visibleUserApplications with deployments", () => {
    const grants = accessGrantsFromInstances(readJsonDir(RIGHT_DIR));
    const deployments = deploymentsFromInstances(readJsonDir(DEPLOYMENT_DIR));

    it("returns Library and Designer when the hatch is off", () => {
      expect(
        visibleUserApplications({
          enabled: false,
          principal: undefined,
          grants,
          deployments,
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
          deployments,
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
          deployments,
          candidates: CANDIDATES,
        }),
      ).toEqual([]);
    });

    it("lets Dave see Library but not Designer even without an application grant", () => {
      expect(
        hasAccess({
          principal: DAVE,
          target: { targetType: "application", targetUuid: LIBRARY_APPLICATION_UUID },
          grants,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toBe(false);
      expect(
        visibleUserApplications({
          enabled: true,
          principal: DAVE,
          grants,
          deployments,
          candidates: CANDIDATES,
        }),
      ).toEqual([LIBRARY_APPLICATION_UUID]);
    });
  });

  describe("access.264.phase4 applicationIsReachable / deep-link", () => {
    const grants = accessGrantsFromInstances(readJsonDir(RIGHT_DIR));
    const deployments = deploymentsFromInstances(readJsonDir(DEPLOYMENT_DIR));

    it("keeps Library for Dave and sends Carol home", () => {
      const daveCan = applicationIsReachable({
        principal: DAVE,
        applicationUuid: LIBRARY_APPLICATION_UUID,
        grants,
        deployments,
        alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
      });
      const carolCan = applicationIsReachable({
        principal: CAROL,
        applicationUuid: LIBRARY_APPLICATION_UUID,
        grants,
        deployments,
        alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
      });
      expect(daveCan).toBe(true);
      expect(carolCan).toBe(false);
      expect(
        nextPageWhenAccessDenied({
          enabled: true,
          hasAccess: daveCan,
          intended: LIBRARY_REPORT,
        }),
      ).toBe(LIBRARY_REPORT);
      expect(
        nextPageWhenAccessDenied({
          enabled: true,
          hasAccess: carolCan,
          intended: LIBRARY_REPORT,
        }),
      ).toBe("/?page=home");
    });
  });
}
