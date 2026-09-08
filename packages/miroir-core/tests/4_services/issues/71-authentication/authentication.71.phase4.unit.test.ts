/**
 * #71 Slice 4 — self-change password.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  AUTHENTICATION_FAILED,
  changePassword,
  loginWithPassword,
  persistChangedPasswordHash,
  setProcessTokenSecret,
  type IdentityDirectory,
} from "../../../../src/1_core/authentication/AuthenticationPolicy.js";
import { RestClientStub } from "../../../../src/4_services/RestClientStub.js";

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

function loadMutableDirectory(): IdentityDirectory {
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
  describe("authentication.71.phase4 self-change password", () => {
    it("alice can change her password; old secret fails; other rows untouched", async () => {
      const directory = loadMutableDirectory();
      const otherHash = directory.credentials[0].passwordHash;
      const login = await loginWithPassword(
        { username: "alice", password: "alice-dev" },
        directory,
        TEST_SECRET,
      );
      expect(login.ok).toBe(true);
      if (!login.ok) {
        return;
      }
      const changed = await changePassword(
        {
          principal: login.principal,
          currentPassword: "alice-dev",
          newPassword: "alice-new",
        },
        directory,
      );
      expect(changed.ok).toBe(true);
      if (!changed.ok) {
        return;
      }
      directory.credentials[0].passwordHash = changed.passwordHash;
      expect(directory.credentials[0].passwordHash).not.toBe(otherHash);

      const oldLogin = await loginWithPassword(
        { username: "alice", password: "alice-dev" },
        directory,
        TEST_SECRET,
      );
      expect(oldLogin).toEqual({
        ok: false,
        status: 401,
        body: AUTHENTICATION_FAILED,
      });
      const newLogin = await loginWithPassword(
        { username: "alice", password: "alice-new" },
        directory,
        TEST_SECRET,
      );
      expect(newLogin.ok).toBe(true);
    });

    it("rejects a wrong current password without changing the hash", async () => {
      const directory = loadMutableDirectory();
      const before = directory.credentials[0].passwordHash;
      const result = await changePassword(
        {
          principal: { miroirUserUuid: ALICE_UUID, username: "alice" },
          currentPassword: "nope",
          newPassword: "alice-new",
        },
        directory,
      );
      expect(result).toEqual({ ok: false, status: 401, body: AUTHENTICATION_FAILED });
      expect(directory.credentials[0].passwordHash).toBe(before);
    });

    it("persistChangedPasswordHash updates only the principal credential", async () => {
      const directory = loadMutableDirectory();
      const other = { miroirUser: BOB_UUID, passwordHash: "untouched" };
      directory.credentials.push(other);
      const persisted = await persistChangedPasswordHash({
        directory,
        principal: { miroirUserUuid: ALICE_UUID, username: "alice" },
        currentPassword: "alice-dev",
        newPassword: "alice-new",
      });
      expect(persisted.ok).toBe(true);
      if (!persisted.ok) {
        return;
      }
      expect(persisted.directory.credentials[1].passwordHash).toBe("untouched");
      const oldLogin = await loginWithPassword(
        { username: "alice", password: "alice-dev" },
        persisted.directory,
        TEST_SECRET,
      );
      expect(oldLogin).toEqual({ ok: false, status: 401, body: AUTHENTICATION_FAILED });
    });

    it("POST /auth/change-password requires a Bearer token and then accepts the new password", async () => {
      setProcessTokenSecret(TEST_SECRET);
      const stub = new RestClientStub("http://localhost");
      stub.setIdentityDirectory(loadMutableDirectory());

      const unauthenticated = await stub.post(
        "/auth/change-password",
        "/auth/change-password",
        { currentPassword: "alice-dev", newPassword: "alice-new" },
      );
      expect(unauthenticated.status).toBe(401);
      expect(unauthenticated.data).toEqual({
        status: "error",
        errorType: "AuthenticationRequired",
      });

      const login = await stub.post("/auth/login", "/auth/login", {
        username: "alice",
        password: "alice-dev",
      });
      expect(login.status).toBe(200);
      const token = (login.data as { token: string }).token;
      const changed = await stub.post(
        "/auth/change-password",
        "/auth/change-password",
        { currentPassword: "alice-dev", newPassword: "alice-new" },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      expect(changed.status).toBe(200);
      expect(changed.data).toEqual({ changed: true });

      const oldLogin = await stub.post("/auth/login", "/auth/login", {
        username: "alice",
        password: "alice-dev",
      });
      expect(oldLogin.status).toBe(401);
      const newLogin = await stub.post("/auth/login", "/auth/login", {
        username: "alice",
        password: "alice-new",
      });
      expect(newLogin.status).toBe(200);
    });
  });
}
