/**
 * #262 Slice 3 — REST access after identity: Library 403 for Carol, allow Alice.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  ACCESS_DENIED,
  ALWAYS_ALLOW_APPLICATION_TARGETS,
  accessGrantsFromInstances,
  applicationTargetForDeployment,
  assertAccessForDeployment,
  deploymentsFromInstances,
} from "../../../../src/1_core/authentication/AccessPolicy.js";
import {
  identityDirectoryFromInstances,
  loginWithPassword,
  setProcessTokenSecret,
} from "../../../../src/1_core/authentication/AuthenticationPolicy.js";
import { RestClientStub } from "../../../../src/4_services/RestClientStub.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST === "access.262" || RUN_TEST.startsWith("access.262");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const ADMIN_DATA = join(REPO_ROOT, "packages/miroir-test-app_deployment-admin/assets/admin_data");
const USER_DIR = join(ADMIN_DATA, "d20d09e5-0685-4fc7-b9bd-fcfa3845127a");
const CREDENTIAL_DIR = join(ADMIN_DATA, "6c3ab489-1a36-4981-b5d0-bb3e02cfceed");
const RIGHT_DIR = join(ADMIN_DATA, "a6136fc7-949b-4d64-9f13-dd3afce1ab3c");
const DEPLOYMENT_DIR = join(ADMIN_DATA, "7959d814-400c-4e80-988f-a00fe582ab98");

const LIBRARY_APP = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const ADMIN_DEPLOYMENT = "18db21bf-f8d3-4f6a-8296-84b69f6dc48b";
const MIROIR_DEPLOYMENT = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
const DESIGNER_DEPLOYMENT = "f0359240-e849-4546-8158-75f4a8ae5831";
const UNKNOWN_DEPLOYMENT = "00000000-0000-4000-8000-000000000000";
const TEST_SECRET = "test-secret-262";

function readJsonDir(dir: string): Record<string, unknown>[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")) as Record<string, unknown>);
}

function loadAccessFixtures() {
  const users = readJsonDir(USER_DIR);
  const credentials = readJsonDir(CREDENTIAL_DIR);
  const grants = accessGrantsFromInstances(readJsonDir(RIGHT_DIR));
  const deployments = deploymentsFromInstances(readJsonDir(DEPLOYMENT_DIR));
  const directory = identityDirectoryFromInstances(users, credentials);
  return { grants, deployments, directory };
}

async function tokenFor(username: string, password: string) {
  const { directory } = loadAccessFixtures();
  setProcessTokenSecret(TEST_SECRET);
  const result = await loginWithPassword({ username, password }, directory, TEST_SECRET);
  if (!result.ok) {
    throw new Error(`expected ${username} login to succeed`);
  }
  return result.token;
}

function stubWithDirectory() {
  const { grants, deployments, directory } = loadAccessFixtures();
  const stub = new RestClientStub("http://test");
  stub.setIdentityDirectory(directory);
  stub.setAccessDirectory({ grants, deployments });
  return stub;
}

async function stubCall(
  stub: RestClientStub,
  deploymentUuid: string,
  authorization?: string,
) {
  try {
    return await stub.call(
      "/CRUD/:deploymentUuid/:section/entity/:parentUuid/all",
      "get",
      `/CRUD/${deploymentUuid}/data/entity/00000000-0000-4000-8000-000000000001/all`,
      {
        deploymentUuid,
        headers: authorization ? { Authorization: authorization } : {},
      },
    );
  } catch (error) {
    return { passedAccessGate: true as const, error: String(error) };
  }
}

if (runThis) {
  describe("access.262.phase3 applicationTargetForDeployment", () => {
    const { deployments } = loadAccessFixtures();

    it("maps Library / Admin / Miroir / Designer deployments to their selfApplication", () => {
      expect(applicationTargetForDeployment(LIBRARY_DEPLOYMENT, deployments)).toEqual({
        targetType: "application",
        targetUuid: LIBRARY_APP,
      });
      expect(applicationTargetForDeployment(ADMIN_DEPLOYMENT, deployments)?.targetUuid).toBe(
        "55af124e-8c05-4bae-a3ef-0933d41daa92",
      );
      expect(applicationTargetForDeployment(MIROIR_DEPLOYMENT, deployments)?.targetUuid).toBe(
        "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      );
      expect(applicationTargetForDeployment(DESIGNER_DEPLOYMENT, deployments)?.targetUuid).toBe(
        "880831db-4f76-40b1-97c0-6a2f3f4ffccb",
      );
    });

    it("returns undefined for an unknown deployment", () => {
      expect(applicationTargetForDeployment(UNKNOWN_DEPLOYMENT, deployments)).toBeUndefined();
    });
  });

  describe("access.262.phase3 assertAccessForDeployment", () => {
    const { grants, deployments } = loadAccessFixtures();
    const alice = { miroirUserUuid: "1c39328c-7de4-44ae-bcf1-5bbc38d8e267", username: "alice" };
    const carol = { miroirUserUuid: "30634877-08ae-44f3-a230-d899e22333d5", username: "carol" };

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

    it("allows Alice on Library and denies Carol", () => {
      expect(
        assertAccessForDeployment({
          enabled: true,
          principal: alice,
          deploymentUuid: LIBRARY_DEPLOYMENT,
          grants,
          deployments,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toEqual({ allowed: true });
      expect(
        assertAccessForDeployment({
          enabled: true,
          principal: carol,
          deploymentUuid: LIBRARY_DEPLOYMENT,
          grants,
          deployments,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toEqual({ allowed: false, status: 403, body: ACCESS_DENIED });
    });

    it("allows Carol on Admin and Miroir and denies Designer and unknown", () => {
      expect(
        assertAccessForDeployment({
          enabled: true,
          principal: carol,
          deploymentUuid: ADMIN_DEPLOYMENT,
          grants,
          deployments,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toEqual({ allowed: true });
      expect(
        assertAccessForDeployment({
          enabled: true,
          principal: carol,
          deploymentUuid: MIROIR_DEPLOYMENT,
          grants,
          deployments,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toEqual({ allowed: true });
      expect(
        assertAccessForDeployment({
          enabled: true,
          principal: carol,
          deploymentUuid: DESIGNER_DEPLOYMENT,
          grants,
          deployments,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toEqual({ allowed: false, status: 403, body: ACCESS_DENIED });
      expect(
        assertAccessForDeployment({
          enabled: true,
          principal: alice,
          deploymentUuid: UNKNOWN_DEPLOYMENT,
          grants,
          deployments,
          alwaysAllow: ALWAYS_ALLOW_APPLICATION_TARGETS,
        }),
      ).toEqual({ allowed: false, status: 403, body: ACCESS_DENIED });
    });
  });

  describe("access.262.phase3 RestClientStub after identity", () => {
    const previousAuth = process.env.MIROIR_AUTH_ENABLED;

    afterEach(() => {
      if (previousAuth === undefined) {
        delete process.env.MIROIR_AUTH_ENABLED;
      } else {
        process.env.MIROIR_AUTH_ENABLED = previousAuth;
      }
    });

    it("lets a Library call through without a token when the hatch is off", async () => {
      process.env.MIROIR_AUTH_ENABLED = "0";
      const result = await stubCall(stubWithDirectory(), LIBRARY_DEPLOYMENT);
      expect(result).toMatchObject({ passedAccessGate: true });
    });

    it("allows Alice on Library and 403s Carol", async () => {
      process.env.MIROIR_AUTH_ENABLED = "1";
      const aliceToken = await tokenFor("alice", "alice-dev");
      const carolToken = await tokenFor("carol", "carol-dev");
      const stub = stubWithDirectory();
      const alice = await stubCall(stub, LIBRARY_DEPLOYMENT, `Bearer ${aliceToken}`);
      const carol = await stubCall(stub, LIBRARY_DEPLOYMENT, `Bearer ${carolToken}`);
      expect(alice).toMatchObject({ passedAccessGate: true });
      expect(carol).toEqual(
        expect.objectContaining({
          status: 403,
          data: ACCESS_DENIED,
        }),
      );
    });

    it("allows Carol on Admin and Miroir, 403s Designer and unknown, and 401s a missing token", async () => {
      process.env.MIROIR_AUTH_ENABLED = "1";
      const carolToken = await tokenFor("carol", "carol-dev");
      const aliceToken = await tokenFor("alice", "alice-dev");
      const stub = stubWithDirectory();
      const auth = `Bearer ${carolToken}`;
      expect(await stubCall(stub, ADMIN_DEPLOYMENT, auth)).toMatchObject({ passedAccessGate: true });
      expect(await stubCall(stub, MIROIR_DEPLOYMENT, auth)).toMatchObject({ passedAccessGate: true });
      expect(await stubCall(stub, DESIGNER_DEPLOYMENT, auth)).toEqual(
        expect.objectContaining({ status: 403, data: ACCESS_DENIED }),
      );
      expect(await stubCall(stub, UNKNOWN_DEPLOYMENT, `Bearer ${aliceToken}`)).toEqual(
        expect.objectContaining({ status: 403, data: ACCESS_DENIED }),
      );
      expect(await stubCall(stub, LIBRARY_DEPLOYMENT)).toEqual(
        expect.objectContaining({
          status: 401,
          data: { status: "error", errorType: "AuthenticationRequired" },
        }),
      );
    });
  });
}
