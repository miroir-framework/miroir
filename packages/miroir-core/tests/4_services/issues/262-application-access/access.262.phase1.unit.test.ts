/**
 * #262 Slice 1 — hasAccess against real Admin MiroirRight seeds.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ALWAYS_ALLOW_APPLICATION_TARGETS,
  accessGrantsFromInstances,
  hasAccess,
  type AccessGrant,
} from "../../../../src/1_core/authentication/AccessPolicy.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST === "access.262" || RUN_TEST.startsWith("access.262");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const RIGHT_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-admin/assets/admin_data/a6136fc7-949b-4d64-9f13-dd3afce1ab3c",
);

const ALICE = { miroirUserUuid: "1c39328c-7de4-44ae-bcf1-5bbc38d8e267", username: "alice" };
const LIBRARY_APP = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const DESIGNER_APP = "880831db-4f76-40b1-97c0-6a2f3f4ffccb";
const ADMIN_APP = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const MIROIR_APP = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";

function loadSeedGrants(): AccessGrant[] {
  const rows = readdirSync(RIGHT_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(RIGHT_DIR, name), "utf8")));
  return accessGrantsFromInstances(rows);
}

function applicationGrantsOnly(grants: AccessGrant[]): AccessGrant[] {
  return grants.filter((grant) => grant.targetType === "application");
}

if (runThis) {
  describe("access.262.phase1 hasAccess on Admin seeds", () => {
    const seedGrants = loadSeedGrants();
    const applicationGrants = applicationGrantsOnly(seedGrants);

    it("allows Alice on Library via the seed application grant", () => {
      expect(
        hasAccess({
          principal: ALICE,
          target: { targetType: "application", targetUuid: LIBRARY_APP },
          grants: applicationGrants,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toBe(true);
    });

    it("denies Alice on Designer (no grant)", () => {
      expect(
        hasAccess({
          principal: ALICE,
          target: { targetType: "application", targetUuid: DESIGNER_APP },
          grants: applicationGrants,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toBe(false);
    });

    it("allows Alice on Admin and Miroir without grant rows", () => {
      expect(
        hasAccess({
          principal: ALICE,
          target: { targetType: "application", targetUuid: ADMIN_APP },
          grants: applicationGrants,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toBe(true);
      expect(
        hasAccess({
          principal: ALICE,
          target: { targetType: "application", targetUuid: MIROIR_APP },
          grants: applicationGrants,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toBe(true);
    });

    it("denies a missing principal", () => {
      expect(
        hasAccess({
          principal: undefined,
          target: { targetType: "application", targetUuid: LIBRARY_APP },
          grants: applicationGrants,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toBe(false);
    });

    it("does not treat a deployment target as granted when only application grants are passed", () => {
      expect(
        hasAccess({
          principal: ALICE,
          target: { targetType: "deployment", targetUuid: LIBRARY_DEPLOYMENT },
          grants: applicationGrants,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toBe(false);
    });

    it("matches a grant regardless of capability string", () => {
      const extra: AccessGrant = {
        miroirUser: ALICE.miroirUserUuid,
        targetType: "application",
        targetUuid: DESIGNER_APP,
      };
      expect(
        hasAccess({
          principal: ALICE,
          target: { targetType: "application", targetUuid: DESIGNER_APP },
          grants: [...applicationGrants, extra],
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toBe(true);
    });
  });
}
