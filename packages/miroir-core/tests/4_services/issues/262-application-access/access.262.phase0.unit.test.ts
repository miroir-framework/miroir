/**
 * #262 Slice 0 — characterize today's identity-only gate and unevaluated rights seeds.
 * Not reachable as MiroirTest: access is a platform policy, not an ML concept yet.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { assertRequestAllowed } from "../../../../src/1_core/authentication/AuthenticationPolicy.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST === "access.262" || RUN_TEST.startsWith("access.262");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const ADMIN_DATA = join(REPO_ROOT, "packages/miroir-test-app_deployment-admin/assets/admin_data");
const RIGHT_DIR = join(ADMIN_DATA, "a6136fc7-949b-4d64-9f13-dd3afce1ab3c");
const USER_DIR = join(ADMIN_DATA, "d20d09e5-0685-4fc7-b9bd-fcfa3845127a");
const ACCESS_POLICY = join(
  REPO_ROOT,
  "packages/miroir-core/src/1_core/authentication/AccessPolicy.ts",
);

const ALICE = "1c39328c-7de4-44ae-bcf1-5bbc38d8e267";
const CAROL = "30634877-08ae-44f3-a230-d899e22333d5";
const LIBRARY_APP = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const ALICE_APP_GRANT = "48b2048f-507f-40ee-a890-b6eca83596f5";
const ALICE_DEPLOYMENT_GRANT = "587f92f8-7140-434b-b9ff-f7f5d2e461b2";

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

if (runThis) {
  describe("access.262.phase0 current open access", () => {
    it("assertRequestAllowed accepts an authenticated principal with no target argument", () => {
      expect(
        assertRequestAllowed({
          enabled: true,
          principal: { miroirUserUuid: ALICE, username: "alice" },
        }),
      ).toEqual({ allowed: true });
    });

    it("AccessPolicy.ts exists", () => {
      expect(existsSync(ACCESS_POLICY)).toBe(true);
    });

    it("seeds exactly two MiroirRight rows: Alice Library application + Alice Library deployment", () => {
      const files = readdirSync(RIGHT_DIR).filter((name) => name.endsWith(".json")).sort();
      expect(files).toEqual([`${ALICE_APP_GRANT}.json`, `${ALICE_DEPLOYMENT_GRANT}.json`]);

      const appGrant = readJson(join(RIGHT_DIR, `${ALICE_APP_GRANT}.json`));
      expect(appGrant.miroirUser).toBe(ALICE);
      expect(appGrant.targetType).toBe("application");
      expect(appGrant.targetUuid).toBe(LIBRARY_APP);

      const deploymentGrant = readJson(join(RIGHT_DIR, `${ALICE_DEPLOYMENT_GRANT}.json`));
      expect(deploymentGrant.miroirUser).toBe(ALICE);
      expect(deploymentGrant.targetType).toBe("deployment");
      expect(deploymentGrant.targetUuid).toBe(LIBRARY_DEPLOYMENT);
    });

    it("has no Carol user seed", () => {
      expect(existsSync(join(USER_DIR, `${CAROL}.json`))).toBe(false);
    });
  });
}
