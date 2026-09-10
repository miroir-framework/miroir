/**
 * #264 Slice 1 — union in assertAccessForDeployment (application or deployment grant).
 */
import { readdirSync, readFileSync } from "node:fs";
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
const DESIGNER_DEPLOYMENT = "f0359240-e849-4546-8158-75f4a8ae5831";
const ADMIN_DEPLOYMENT = "18db21bf-f8d3-4f6a-8296-84b69f6dc48b";
const MIROIR_DEPLOYMENT = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
const UNKNOWN_DEPLOYMENT = "00000000-0000-4000-8000-000000000000";

function readJsonDir(dir: string): Record<string, unknown>[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")) as Record<string, unknown>);
}

if (runThis) {
  describe("access.264.phase1 assertAccessForDeployment union", () => {
    const grants = accessGrantsFromInstances(readJsonDir(RIGHT_DIR));
    const applicationGrants = grants.filter((grant) => grant.targetType === "application");
    const deploymentGrants = grants.filter((grant) => grant.targetType === "deployment");
    const deployments = deploymentsFromInstances(readJsonDir(DEPLOYMENT_DIR));

    it("skips rights when the hatch is off", () => {
      expect(
        assertAccessForDeployment({
          enabled: false,
          principal: undefined,
          deploymentUuid: LIBRARY_DEPLOYMENT,
          grants,
          deployments,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toEqual({ allowed: true });
    });

    it("denies an unknown deployment", () => {
      expect(
        assertAccessForDeployment({
          enabled: true,
          principal: ALICE,
          deploymentUuid: UNKNOWN_DEPLOYMENT,
          grants,
          deployments,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toEqual({ allowed: false, status: 403, body: ACCESS_DENIED });
    });

    it("allows Alice on Library from full grants or either grant kind alone", () => {
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
      expect(
        assertAccessForDeployment({
          enabled: true,
          principal: ALICE,
          deploymentUuid: LIBRARY_DEPLOYMENT,
          grants: deploymentGrants,
          deployments,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toEqual({ allowed: true });
      expect(
        assertAccessForDeployment({
          enabled: true,
          principal: ALICE,
          deploymentUuid: LIBRARY_DEPLOYMENT,
          grants: applicationGrants,
          deployments,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toEqual({ allowed: true });
    });

    it("does not let Alice's Library deployment grant open Designer", () => {
      expect(
        assertAccessForDeployment({
          enabled: true,
          principal: ALICE,
          deploymentUuid: DESIGNER_DEPLOYMENT,
          grants: deploymentGrants,
          deployments,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toEqual({ allowed: false, status: 403, body: ACCESS_DENIED });
    });

    it("denies Carol on Library and allows Admin and Miroir", () => {
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
      expect(
        assertAccessForDeployment({
          enabled: true,
          principal: CAROL,
          deploymentUuid: ADMIN_DEPLOYMENT,
          grants,
          deployments,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toEqual({ allowed: true });
      expect(
        assertAccessForDeployment({
          enabled: true,
          principal: CAROL,
          deploymentUuid: MIROIR_DEPLOYMENT,
          grants,
          deployments,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toEqual({ allowed: true });
    });

    it("does not treat a deployment grant as an application grant", () => {
      expect(
        hasAccess({
          principal: ALICE,
          target: { targetType: "application", targetUuid: LIBRARY_APP },
          grants: deploymentGrants,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toBe(false);
    });
  });
}
