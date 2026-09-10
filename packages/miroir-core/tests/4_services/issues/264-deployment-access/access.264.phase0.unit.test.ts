/**
 * #264 Slice 0 — characterize application-only REST adapter and absence of Dave.
 * Not reachable as MiroirTest: access is a platform policy, not an ML concept.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ACCESS_DENIED,
  ALWAYS_ALLOW_APPLICATION_TARGETS,
  accessGrantsFromInstances,
  assertAccessForDeployment,
  deploymentsFromInstances,
  hasAccess,
} from "../../../../src/1_core/authentication/AccessPolicy.js";
import { visibleUserApplications } from "../../../../src/1_core/authentication/AuthenticationUi.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST === "access.264" || RUN_TEST.startsWith("access.264");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const ADMIN_DATA = join(REPO_ROOT, "packages/miroir-test-app_deployment-admin/assets/admin_data");
const RIGHT_DIR = join(ADMIN_DATA, "a6136fc7-949b-4d64-9f13-dd3afce1ab3c");
const DEPLOYMENT_DIR = join(ADMIN_DATA, "7959d814-400c-4e80-988f-a00fe582ab98");

const ALICE = { miroirUserUuid: "1c39328c-7de4-44ae-bcf1-5bbc38d8e267", username: "alice" };
const CAROL = { miroirUserUuid: "30634877-08ae-44f3-a230-d899e22333d5", username: "carol" };
const LIBRARY_APP = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const ALICE_APP_GRANT = "48b2048f-507f-40ee-a890-b6eca83596f5";
const ALICE_DEPLOYMENT_GRANT = "587f92f8-7140-434b-b9ff-f7f5d2e461b2";

function readJsonDir(dir: string): Record<string, unknown>[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")) as Record<string, unknown>);
}

if (runThis) {
  describe("access.264.phase0 current application-only adapter", () => {
    const rightRows = readJsonDir(RIGHT_DIR);
    const grants = accessGrantsFromInstances(rightRows);
    const deploymentGrants = grants.filter((grant) => grant.targetType === "deployment");
    const deployments = deploymentsFromInstances(readJsonDir(DEPLOYMENT_DIR));

    it("keeps Alice Library application and deployment grant files", () => {
      expect(existsSync(join(RIGHT_DIR, `${ALICE_APP_GRANT}.json`))).toBe(true);
      expect(existsSync(join(RIGHT_DIR, `${ALICE_DEPLOYMENT_GRANT}.json`))).toBe(true);
    });

    it("hasAccess matches a deployment target only when a deployment grant is in the list", () => {
      expect(
        hasAccess({
          principal: ALICE,
          target: { targetType: "deployment", targetUuid: LIBRARY_DEPLOYMENT },
          grants,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toBe(true);
      expect(
        hasAccess({
          principal: ALICE,
          target: { targetType: "application", targetUuid: LIBRARY_APP },
          grants: deploymentGrants,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toBe(false);
    });

    it("assertAccessForDeployment allows Alice on full grants via the application path", () => {
      expect(
        assertAccessForDeployment({
          enabled: true,
          principal: ALICE,
          deploymentUuid: LIBRARY_DEPLOYMENT,
          grants,
          deployments,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toEqual({ allowed: true });
    });

    it("assertAccessForDeployment denies Carol on Library", () => {
      expect(
        assertAccessForDeployment({
          enabled: true,
          principal: CAROL,
          deploymentUuid: LIBRARY_DEPLOYMENT,
          grants,
          deployments,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toEqual({ allowed: false, status: 403, body: ACCESS_DENIED });
    });

    it("visibleUserApplications ignores deployment grants (Alice with deployment rows only sees nothing)", () => {
      expect(
        visibleUserApplications({
          enabled: true,
          principal: ALICE,
          grants: deploymentGrants,
        }),
      ).toEqual([]);
    });
  });
}
