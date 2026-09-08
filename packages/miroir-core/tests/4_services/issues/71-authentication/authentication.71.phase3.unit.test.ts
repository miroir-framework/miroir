/**
 * #71 Slice 3 — login refusals share one body and do not issue a token.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  AUTHENTICATION_FAILED,
  loginWithPassword,
  type IdentityDirectory,
} from "../../../../src/1_core/authentication/AuthenticationPolicy.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "authentication.71" ||
  RUN_TEST.startsWith("authentication.71");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const ADMIN_ASSETS = join(REPO_ROOT, "packages/miroir-test-app_deployment-admin/assets");
const USER_ENTITY = "d20d09e5-0685-4fc7-b9bd-fcfa3845127a";
const CREDENTIAL_ENTITY = "6c3ab489-1a36-4981-b5d0-bb3e02cfceed";
const ALICE_UUID = "1c39328c-7de4-44ae-bcf1-5bbc38d8e267";
const BOB_UUID = "95fa298f-79f8-428c-8980-3443d486c1d8";
const ALICE_CREDENTIAL_UUID = "c179dcf9-f39b-4b16-b8d6-3e39895bfd35";
const TEST_SECRET = "test-secret-71";

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function loadDirectoryFromAdminAssets(): IdentityDirectory {
  const alice = readJson(join(ADMIN_ASSETS, `admin_data/${USER_ENTITY}/${ALICE_UUID}.json`));
  const bob = readJson(join(ADMIN_ASSETS, `admin_data/${USER_ENTITY}/${BOB_UUID}.json`));
  const credential = readJson(
    join(ADMIN_ASSETS, `admin_data/${CREDENTIAL_ENTITY}/${ALICE_CREDENTIAL_UUID}.json`),
  );
  return {
    users: [
      { uuid: String(alice.uuid), username: String(alice.username), status: String(alice.status) },
      { uuid: String(bob.uuid), username: String(bob.username), status: String(bob.status) },
    ],
    credentials: [
      { miroirUser: String(credential.miroirUser), passwordHash: String(credential.passwordHash) },
    ],
  };
}

if (runThis) {
  describe("authentication.71.phase3 login refusals", () => {
    const expected = { ok: false as const, status: 401 as const, body: AUTHENTICATION_FAILED };

    it("rejects inactive bob with the same body as unknown and bad password", async () => {
      const directory = loadDirectoryFromAdminAssets();
      const bob = await loginWithPassword(
        { username: "bob", password: "alice-dev" },
        directory,
        TEST_SECRET,
      );
      const wrong = await loginWithPassword(
        { username: "alice", password: "wrong" },
        directory,
        TEST_SECRET,
      );
      const nobody = await loginWithPassword(
        { username: "nobody", password: "alice-dev" },
        directory,
        TEST_SECRET,
      );
      const empty = await loginWithPassword(
        { username: "", password: "alice-dev" },
        directory,
        TEST_SECRET,
      );
      expect(bob).toEqual(expected);
      expect(wrong).toEqual(expected);
      expect(nobody).toEqual(expected);
      expect(empty).toEqual(expected);
    });
  });
}
