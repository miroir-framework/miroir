/**
 * setExternalServiceCredential (#472): check a bearer token against an external service,
 * then save it as the endpoint's credential (MiroirSecret row, per user when a principal exists).
 *
 * Vitest integ: the action persists encrypted rows and reads them back on the emulated server,
 * which a MiroirTest cannot inspect (the client query path redacts ciphertext).
 *
 * Run:
 * ```bash
 * RUN_TEST=setExternalServiceCredential npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem setExternalServiceCredential
 * ```
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { AuthPrincipal, DomainControllerInterface } from "miroir-core";
import {
  Action2Error,
  clearSecrets,
  clearSecretsMasterKey,
  miroirSecretInstanceUuid,
  registerHydratedUserSecret,
  resolveSecret,
  setSecretsMasterKey,
} from "miroir-core";

import {
  ADMIN_APPLICATION_UUID,
  applicationDeploymentMap,
  bootGitHubTestbed,
  ENTITY_MIROIR_SECRET_UUID,
  GITHUB_APPLICATION_UUID,
  GITHUB_ENDPOINT_UUID,
  queryMiroirSecretRows,
  reseedGitHub,
  type GitHubTestbed,
} from "../helpers/githubAppTestbed.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "setExternalServiceCredential" ||
  RUN_TEST === "setExternalServiceCredential.integ.test";

const DOMAIN_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const WRAPPING_KEY = "test-secrets-master";
const CREDENTIAL_KEY = "githubToken";
const GOOD_TOKEN = "ghp_good-token";
const OTHER_GOOD_TOKEN = "ghp_other-good-token";
const ALICE: AuthPrincipal = { miroirUserUuid: "1c39328c-7de4-44ae-bcf1-5bbc38d8e267", username: "alice" };
const OCTOCAT = {
  login: "octocat",
  id: 1,
  name: "The Octocat",
  avatar_url: "https://example.test/octocat.png",
  html_url: "https://github.com/octocat",
  bio: "not bound, stripped by the client",
};

let testbed: GitHubTestbed;

function setCredential(
  domainController: DomainControllerInterface,
  payload: { credential: string; probeOnly?: boolean },
  principal?: AuthPrincipal,
) {
  return domainController.handleAction(
    {
      actionType: "setExternalServiceCredential",
      actionLabel: "connectGitHub",
      endpoint: DOMAIN_ENDPOINT,
      payload: {
        application: GITHUB_APPLICATION_UUID,
        endpointUuid: GITHUB_ENDPOINT_UUID,
        probeOperationId: "users/get-authenticated",
        ...payload,
      },
    } as any,
    applicationDeploymentMap,
    testbed.githubModelEnvironment,
    undefined,
    undefined,
    principal,
  );
}

async function credentialRows() {
  return (await queryMiroirSecretRows(testbed)).filter((row) => row.name === CREDENTIAL_KEY);
}

async function deleteCredentialRows() {
  const rows = await credentialRows();
  if (rows.length === 0) {
    return;
  }
  const result = await testbed.domainControllerForServer.handleAction(
    {
      actionType: "deleteInstance",
      actionLabel: "secrets.delete",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: ADMIN_APPLICATION_UUID,
        applicationSection: "data",
        parentUuid: ENTITY_MIROIR_SECRET_UUID,
        objects: rows.map((row) => ({
          uuid: row.uuid,
          parentName: "MiroirSecret",
          parentUuid: ENTITY_MIROIR_SECRET_UUID,
        })),
      },
    } as any,
    applicationDeploymentMap,
  );
  expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
}

beforeAll(async () => {
  testbed = await bootGitHubTestbed();
}, 60000);

beforeEach(async () => {
  clearSecrets();
  setSecretsMasterKey(WRAPPING_KEY);
  testbed.fakeServer.receivedRequests.length = 0;
  testbed.fakeServer.setFixture("GET", "/user", {
    status: 401,
    body: { message: "Bad credentials", status: "401" },
  });
  for (const token of [GOOD_TOKEN, OTHER_GOOD_TOKEN]) {
    testbed.fakeServer.setFixtureForAuth("GET", "/user", `Bearer ${token}`, { body: OCTOCAT });
  }
  await reseedGitHub(testbed);
  await deleteCredentialRows();
}, 60000);

afterAll(async () => {
  clearSecrets();
  clearSecretsMasterKey();
  await testbed?.fakeServer.close();
});

describe.skipIf(!shouldRun)("setExternalServiceCredential", () => {
  it("checks a token without saving it, returning whom it identifies", async () => {
    const result = await setCredential(testbed.domainControllerForServer, {
      credential: GOOD_TOKEN,
      probeOnly: true,
    });

    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
    expect((result as { returnedDomainElement: unknown }).returnedDomainElement).toEqual({
      login: "octocat",
      id: 1,
      name: "The Octocat",
      avatar_url: "https://example.test/octocat.png",
      html_url: "https://github.com/octocat",
    });
    expect(testbed.fakeServer.receivedRequests[0]?.headers.authorization).toBe(`Bearer ${GOOD_TOKEN}`);
    expect(await credentialRows()).toEqual([]);
    expect(() => resolveSecret(CREDENTIAL_KEY)).toThrow();
  });

  it("refuses a token the service rejects, with the service's status, and saves nothing", async () => {
    const result = await setCredential(testbed.domainControllerForServer, { credential: "ghp_revoked" });

    expect(result).toBeInstanceOf(Action2Error);
    expect((result as Action2Error).errorMessage).toMatch(/401/);
    expect(await credentialRows()).toEqual([]);
  });

  it("saves the token as the process credential when nobody is logged in", async () => {
    const result = await setCredential(testbed.domainControllerForServer, { credential: GOOD_TOKEN });

    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
    const rows = await credentialRows();
    expect(rows.map((row) => row.uuid)).toEqual([miroirSecretInstanceUuid(CREDENTIAL_KEY, "process")]);
    expect(rows[0].miroirUser).toBeUndefined();
    expect(String(rows[0].ciphertext)).not.toContain(GOOD_TOKEN);
    expect(resolveSecret(CREDENTIAL_KEY).value).toBe(GOOD_TOKEN);
  });

  it("saves the token for the logged-in user, probing the typed token rather than the user's saved one", async () => {
    registerHydratedUserSecret(ALICE.miroirUserUuid, CREDENTIAL_KEY, "ghp_revoked");

    const result = await setCredential(testbed.domainControllerForServer, { credential: GOOD_TOKEN }, ALICE);

    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
    const rows = await credentialRows();
    expect(rows.map((row) => row.uuid)).toEqual([
      miroirSecretInstanceUuid(CREDENTIAL_KEY, "user", ALICE.miroirUserUuid),
    ]);
    expect(rows[0].miroirUser).toBe(ALICE.miroirUserUuid);
    expect(resolveSecret(CREDENTIAL_KEY, ALICE).value).toBe(GOOD_TOKEN);
    expect(() => resolveSecret(CREDENTIAL_KEY)).toThrow();
  });

  it("replaces the saved token when the user connects again", async () => {
    await setCredential(testbed.domainControllerForServer, { credential: GOOD_TOKEN }, ALICE);
    const first = await credentialRows();

    const result = await setCredential(testbed.domainControllerForServer, { credential: OTHER_GOOD_TOKEN }, ALICE);

    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
    const second = await credentialRows();
    expect(second.map((row) => row.uuid)).toEqual(first.map((row) => row.uuid));
    expect(second[0].ciphertext).not.toBe(first[0].ciphertext);
    expect(resolveSecret(CREDENTIAL_KEY, ALICE).value).toBe(OTHER_GOOD_TOKEN);
  });

  it("refuses to save without a wrapping key", async () => {
    clearSecretsMasterKey();

    const result = await setCredential(testbed.domainControllerForServer, { credential: GOOD_TOKEN });

    expect(result).toBeInstanceOf(Action2Error);
    expect((result as Action2Error).errorMessage).toMatch(/wrapping key/i);
    expect(await credentialRows()).toEqual([]);
  });
});
