/**
 * #262 Slice 2 — Carol can log in and has no application grants.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ALWAYS_ALLOW_APPLICATION_TARGETS,
  accessGrantsFromInstances,
  hasAccess,
} from "../../../../src/1_core/authentication/AccessPolicy.js";
import {
  AUTHENTICATION_FAILED,
  identityDirectoryFromInstances,
  loginWithPassword,
} from "../../../../src/1_core/authentication/AuthenticationPolicy.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST === "access.262" || RUN_TEST.startsWith("access.262");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const ADMIN_DATA = join(REPO_ROOT, "packages/miroir-test-app_deployment-admin/assets/admin_data");
const USER_DIR = join(ADMIN_DATA, "d20d09e5-0685-4fc7-b9bd-fcfa3845127a");
const CREDENTIAL_DIR = join(ADMIN_DATA, "6c3ab489-1a36-4981-b5d0-bb3e02cfceed");
const RIGHT_DIR = join(ADMIN_DATA, "a6136fc7-949b-4d64-9f13-dd3afce1ab3c");

const CAROL = "30634877-08ae-44f3-a230-d899e22333d5";
const CAROL_CREDENTIAL = "23f39cd9-f56e-4400-bd87-87e5d51798c1";
const LIBRARY_APP = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const ADMIN_APP = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const TEST_SECRET = "test-secret-262";

function readJsonDir(dir: string): Record<string, unknown>[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")) as Record<string, unknown>);
}

if (runThis) {
  describe("access.262.phase2 Carol seed and login", () => {
    const users = readJsonDir(USER_DIR);
    const credentials = readJsonDir(CREDENTIAL_DIR);
    const grants = accessGrantsFromInstances(readJsonDir(RIGHT_DIR)).filter(
      (grant) => grant.targetType === "application",
    );
    const directory = identityDirectoryFromInstances(users, credentials);
    const carol = users.find((row) => row.uuid === CAROL);

    it("seeds Carol as an active user with a credential and no application grants", () => {
      expect(carol?.username).toBe("carol");
      expect(carol?.status).toBe("active");
      expect(credentials.some((row) => row.uuid === CAROL_CREDENTIAL && row.miroirUser === CAROL)).toBe(
        true,
      );
      expect(readJsonDir(RIGHT_DIR)).toHaveLength(2);
      expect(grants.some((grant) => grant.miroirUser === CAROL)).toBe(false);
    });

    it("logs Carol in with carol-dev and denies Library while allowing Admin", async () => {
      const result = await loginWithPassword(
        { username: "carol", password: "carol-dev" },
        directory,
        TEST_SECRET,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.principal).toEqual({ miroirUserUuid: CAROL, username: "carol" });
      expect(
        hasAccess({
          principal: result.principal,
          target: { targetType: "application", targetUuid: LIBRARY_APP },
          grants,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toBe(false);
      expect(
        hasAccess({
          principal: result.principal,
          target: { targetType: "application", targetUuid: ADMIN_APP },
          grants,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toBe(true);
    });

    it("still refuses bob", async () => {
      expect(await loginWithPassword({ username: "bob", password: "alice-dev" }, directory, TEST_SECRET)).toEqual({
        ok: false,
        status: 401,
        body: AUTHENTICATION_FAILED,
      });
    });
  });
}
