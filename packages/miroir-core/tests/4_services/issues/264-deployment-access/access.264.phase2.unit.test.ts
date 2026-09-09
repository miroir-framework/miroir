/**
 * #264 Slice 2 — Dave can log in and has only a Library deployment grant.
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
const runThis = !RUN_TEST || RUN_TEST === "access.264" || RUN_TEST.startsWith("access.264");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const ADMIN_DATA = join(REPO_ROOT, "packages/miroir-test-app_deployment-admin/assets/admin_data");
const USER_DIR = join(ADMIN_DATA, "d20d09e5-0685-4fc7-b9bd-fcfa3845127a");
const CREDENTIAL_DIR = join(ADMIN_DATA, "6c3ab489-1a36-4981-b5d0-bb3e02cfceed");
const RIGHT_DIR = join(ADMIN_DATA, "a6136fc7-949b-4d64-9f13-dd3afce1ab3c");

const DAVE = "e2343a39-f5d9-4898-83b4-74e2ccc33125";
const DAVE_CREDENTIAL = "cc3bc0aa-023f-4f8c-b4c8-a8c1f44b3a93";
const DAVE_RIGHT = "0509f559-2a1f-4bf2-ae2d-732aa6cc3202";
const LIBRARY_APP = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const DESIGNER_APP = "880831db-4f76-40b1-97c0-6a2f3f4ffccb";
const ADMIN_APP = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const MIROIR_APP = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const TEST_SECRET = "test-secret-264";

function readJsonDir(dir: string): Record<string, unknown>[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")) as Record<string, unknown>);
}

if (runThis) {
  describe("access.264.phase2 Dave seed and login", () => {
    const users = readJsonDir(USER_DIR);
    const credentials = readJsonDir(CREDENTIAL_DIR);
    const grants = accessGrantsFromInstances(readJsonDir(RIGHT_DIR));
    const directory = identityDirectoryFromInstances(users, credentials);
    const dave = users.find((row) => row.uuid === DAVE);
    const daveRights = grants.filter((grant) => grant.miroirUser === DAVE);

    it("seeds Dave as an active user with one Library deployment grant", () => {
      expect(dave?.username).toBe("dave");
      expect(dave?.status).toBe("active");
      expect(credentials.some((row) => row.uuid === DAVE_CREDENTIAL && row.miroirUser === DAVE)).toBe(
        true,
      );
      expect(daveRights).toEqual([
        {
          miroirUser: DAVE,
          targetType: "deployment",
          targetUuid: LIBRARY_DEPLOYMENT,
        },
      ]);
      expect(readJsonDir(RIGHT_DIR).some((row) => row.uuid === DAVE_RIGHT)).toBe(true);
    });

    it("logs Dave in and grants deployment Library but not application Library or Designer", async () => {
      const result = await loginWithPassword(
        { username: "dave", password: "dave-dev" },
        directory,
        TEST_SECRET,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.principal).toEqual({ miroirUserUuid: DAVE, username: "dave" });
      expect(
        hasAccess({
          principal: result.principal,
          target: { targetType: "deployment", targetUuid: LIBRARY_DEPLOYMENT },
          grants,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toBe(true);
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
          target: { targetType: "application", targetUuid: DESIGNER_APP },
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
      expect(
        hasAccess({
          principal: result.principal,
          target: { targetType: "application", targetUuid: MIROIR_APP },
          grants,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toBe(true);
    });

    it("still logs Alice and Carol and refuses bob", async () => {
      expect((await loginWithPassword({ username: "alice", password: "alice-dev" }, directory, TEST_SECRET)).ok).toBe(
        true,
      );
      expect((await loginWithPassword({ username: "carol", password: "carol-dev" }, directory, TEST_SECRET)).ok).toBe(
        true,
      );
      expect(await loginWithPassword({ username: "bob", password: "alice-dev" }, directory, TEST_SECRET)).toEqual({
        ok: false,
        status: 401,
        body: AUTHENTICATION_FAILED,
      });
    });
  });
}
