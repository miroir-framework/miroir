/**
 * #264 Slice 3 — REST access after identity: Library allowed for Dave, 403 for Carol.
 *
 * This stub has no persistence manager. Passing the access gate therefore throws
 * `RestClientStub: persistenceStoreControllerManager is not set`. Denied calls
 * return 401/403 without throwing. Do not treat arbitrary exceptions as success.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  ACCESS_DENIED,
  accessGrantsFromInstances,
  deploymentsFromInstances,
} from "../../../../src/1_core/authentication/AccessPolicy.js";
import {
  identityDirectoryFromInstances,
  loginWithPassword,
  setProcessTokenSecret,
} from "../../../../src/1_core/authentication/AuthenticationPolicy.js";
import { RestClientStub } from "../../../../src/4_services/RestClientStub.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST === "access.264" || RUN_TEST.startsWith("access.264");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const ADMIN_DATA = join(REPO_ROOT, "packages/miroir-test-app_deployment-admin/assets/admin_data");
const USER_DIR = join(ADMIN_DATA, "d20d09e5-0685-4fc7-b9bd-fcfa3845127a");
const CREDENTIAL_DIR = join(ADMIN_DATA, "6c3ab489-1a36-4981-b5d0-bb3e02cfceed");
const RIGHT_DIR = join(ADMIN_DATA, "a6136fc7-949b-4d64-9f13-dd3afce1ab3c");
const DEPLOYMENT_DIR = join(ADMIN_DATA, "7959d814-400c-4e80-988f-a00fe582ab98");

const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const ADMIN_DEPLOYMENT = "18db21bf-f8d3-4f6a-8296-84b69f6dc48b";
const MIROIR_DEPLOYMENT = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
const DESIGNER_DEPLOYMENT = "f0359240-e849-4546-8158-75f4a8ae5831";
const UNKNOWN_DEPLOYMENT = "00000000-0000-4000-8000-000000000000";
const TEST_SECRET = "test-secret-264";

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

const POST_ACCESS_GATE_ERROR =
  "RestClientStub: persistenceStoreControllerManager is not set";

function stubCall(
  stub: RestClientStub,
  deploymentUuid: string,
  authorization?: string,
) {
  return stub.call(
    "/CRUD/:deploymentUuid/:section/entity/:parentUuid/all",
    "get",
    `/CRUD/${deploymentUuid}/data/entity/00000000-0000-4000-8000-000000000001/all`,
    {
      deploymentUuid,
      headers: authorization ? { Authorization: authorization } : {},
    },
  );
}

async function expectAccessAllowed(
  stub: RestClientStub,
  deploymentUuid: string,
  authorization?: string,
) {
  await expect(stubCall(stub, deploymentUuid, authorization)).rejects.toThrow(
    POST_ACCESS_GATE_ERROR,
  );
}

if (runThis) {
  describe("access.264.phase3 RestClientStub after identity", () => {
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
      await expectAccessAllowed(stubWithDirectory(), LIBRARY_DEPLOYMENT);
    });

    it("allows Dave on Library and 403s Designer", async () => {
      process.env.MIROIR_AUTH_ENABLED = "1";
      const daveToken = await tokenFor("dave", "dave-dev");
      const stub = stubWithDirectory();
      const auth = `Bearer ${daveToken}`;
      await expectAccessAllowed(stub, LIBRARY_DEPLOYMENT, auth);
      expect(await stubCall(stub, DESIGNER_DEPLOYMENT, auth)).toEqual(
        expect.objectContaining({ status: 403, data: ACCESS_DENIED }),
      );
    });

    it("allows Dave on Admin and Miroir and 403s unknown", async () => {
      process.env.MIROIR_AUTH_ENABLED = "1";
      const daveToken = await tokenFor("dave", "dave-dev");
      const stub = stubWithDirectory();
      const auth = `Bearer ${daveToken}`;
      await expectAccessAllowed(stub, ADMIN_DEPLOYMENT, auth);
      await expectAccessAllowed(stub, MIROIR_DEPLOYMENT, auth);
      expect(await stubCall(stub, UNKNOWN_DEPLOYMENT, auth)).toEqual(
        expect.objectContaining({ status: 403, data: ACCESS_DENIED }),
      );
    });

    it("keeps Carol 403 and Alice allowed on Library, and 401s a missing token", async () => {
      process.env.MIROIR_AUTH_ENABLED = "1";
      const carolToken = await tokenFor("carol", "carol-dev");
      const aliceToken = await tokenFor("alice", "alice-dev");
      const stub = stubWithDirectory();
      expect(await stubCall(stub, LIBRARY_DEPLOYMENT, `Bearer ${carolToken}`)).toEqual(
        expect.objectContaining({ status: 403, data: ACCESS_DENIED }),
      );
      await expectAccessAllowed(stub, LIBRARY_DEPLOYMENT, `Bearer ${aliceToken}`);
      expect(await stubCall(stub, LIBRARY_DEPLOYMENT)).toEqual(
        expect.objectContaining({
          status: 401,
          data: { status: "error", errorType: "AuthenticationRequired" },
        }),
      );
    });
  });
}
