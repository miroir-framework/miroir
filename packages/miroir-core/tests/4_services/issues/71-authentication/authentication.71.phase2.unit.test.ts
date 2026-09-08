/**
 * #71 Slice 2 — login binds Alice; token opens the gate.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  assertRequestAllowed,
  extractPrincipalFromAuthorizationHeader,
  hashPassword,
  issueBearerToken,
  loginWithPassword,
  verifyBearerToken,
  verifyPassword,
  type AuthPrincipal,
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
      {
        uuid: String(alice.uuid),
        username: String(alice.username),
        status: String(alice.status),
      },
      {
        uuid: String(bob.uuid),
        username: String(bob.username),
        status: String(bob.status),
      },
    ],
    credentials: [
      {
        miroirUser: String(credential.miroirUser),
        passwordHash: String(credential.passwordHash),
      },
    ],
  };
}

if (runThis) {
  describe("authentication.71.phase2 Admin identity assets", () => {
    it("MiroirUser has required username and seed login ids", () => {
      const entity = readJson(
        join(ADMIN_ASSETS, `admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/${USER_ENTITY}.json`),
      );
      const definition = (entity.mlSchema as { definition?: Record<string, unknown> }).definition;
      expect(definition?.username).toBeDefined();
      expect((definition?.username as { optional?: boolean }).optional).not.toBe(true);
      expect(readJson(join(ADMIN_ASSETS, `admin_data/${USER_ENTITY}/${ALICE_UUID}.json`)).username).toBe(
        "alice",
      );
      expect(readJson(join(ADMIN_ASSETS, `admin_data/${USER_ENTITY}/${BOB_UUID}.json`)).username).toBe(
        "bob",
      );
    });

    it("MiroirUserCredential exists without a hash in viewAttributes and without a report", () => {
      const entityPath = join(
        ADMIN_ASSETS,
        `admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/${CREDENTIAL_ENTITY}.json`,
      );
      expect(existsSync(entityPath)).toBe(true);
      const entity = readJson(entityPath);
      expect(entity.name).toBe("MiroirUserCredential");
      expect(entity.viewAttributes).toEqual(["miroirUser", "uuid"]);
      const reportDir = join(ADMIN_ASSETS, "admin_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916");
      for (const name of readdirSync(reportDir)) {
        const report = readJson(join(reportDir, name));
        expect(String(report.name ?? "")).not.toMatch(/MiroirUserCredential/);
      }
    });

    it("seeds exactly one Alice credential and none for Bob", () => {
      const credential = readJson(
        join(ADMIN_ASSETS, `admin_data/${CREDENTIAL_ENTITY}/${ALICE_CREDENTIAL_UUID}.json`),
      );
      expect(credential.miroirUser).toBe(ALICE_UUID);
      expect(String(credential.passwordHash).startsWith("scrypt$")).toBe(true);
      const files = readdirSync(join(ADMIN_ASSETS, `admin_data/${CREDENTIAL_ENTITY}`));
      expect(files).toEqual([`${ALICE_CREDENTIAL_UUID}.json`]);
    });
  });

  describe("authentication.71.phase2 password and token", () => {
    it("hashPassword then verifyPassword accepts the same secret and rejects another", async () => {
      const hash = await hashPassword("alice-dev");
      expect(await verifyPassword("alice-dev", hash)).toBe(true);
      expect(await verifyPassword("wrong", hash)).toBe(false);
    });

    it("issueBearerToken / verifyBearerToken round-trip Alice with a fixed secret", async () => {
      const principal: AuthPrincipal = { miroirUserUuid: ALICE_UUID, username: "alice" };
      const token = await issueBearerToken(principal, TEST_SECRET, 1_700_000_000_000);
      expect(await verifyBearerToken(token, TEST_SECRET, 1_700_000_000_000)).toEqual(principal);
    });

    it("rejects an expired token", async () => {
      const principal: AuthPrincipal = { miroirUserUuid: ALICE_UUID, username: "alice" };
      const token = await issueBearerToken(principal, TEST_SECRET, 1_700_000_000_000, 60);
      expect(
        await verifyBearerToken(token, TEST_SECRET, 1_700_000_000_000 + 61_000),
      ).toBeUndefined();
    });

    it("rejects a tampered token", async () => {
      const principal: AuthPrincipal = { miroirUserUuid: ALICE_UUID, username: "alice" };
      const token = await issueBearerToken(principal, TEST_SECRET);
      expect(await verifyBearerToken(token + "x", TEST_SECRET)).toBeUndefined();
    });
  });

  describe("authentication.71.phase2 login against real Admin seed JSON", () => {
    it("alice / alice-dev returns Alice principal and a usable Bearer token", async () => {
      const directory = loadDirectoryFromAdminAssets();
      const result = await loginWithPassword(
        { username: "alice", password: "alice-dev" },
        directory,
        TEST_SECRET,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.principal).toEqual({ miroirUserUuid: ALICE_UUID, username: "alice" });
      const fromHeader = await extractPrincipalFromAuthorizationHeader(
        `Bearer ${result.token}`,
        TEST_SECRET,
      );
      expect(fromHeader).toEqual(result.principal);
      expect(
        assertRequestAllowed({ enabled: true, principal: fromHeader }),
      ).toEqual({ allowed: true });
    });
  });
}
