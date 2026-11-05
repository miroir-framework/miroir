/**
 * #679 slice 8: a remote asking for a token. Without one, `gitAction_fetch` returns
 * `ExternalServiceUnauthorized` (D17); a credential in the payload serves one action and is not kept;
 * `gitAction_setCredential` saves it as the Admin secret `git.<host>` (D16), of the logged-in user or of
 * the process, which the next actions use. The secret's value and ciphertext never come back in a result.
 *
 * Not reachable through MiroirTest: the test starts a Git server asking for basic authentication.
 * Skipped when the `git` program, which the test server runs, is not on the PATH.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- gitCredentials.679.phase8
 * ```
 */
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  ADMIN_APPLICATION_UUID,
  clearSecrets,
  clearSecretsMasterKey,
  defaultSelfApplicationDeploymentMap,
  ENTITY_MIROIR_SECRET_UUID,
  resolveSecret,
  setSecretsMasterKey,
  type Action2ReturnType,
  type AuthPrincipal,
  type EndpointDefinition,
  type GitRemoteResult,
  type GitSetCredentialResult,
} from "@miroir-framework/core";
import { defaultMiroirMetaModel } from "@miroir-framework/core/meta-model";
import { endpointDocument, getDefaultLibraryModelEnvironmentDEFUNCT } from "miroir-example-library";

import { gitCli, gitProgramMissing, startGitHttpServer, type GitHttpServer } from "./gitHttpServer.js";
import {
  applicationDeploymentMap,
  expectGitError,
  expectOk,
  gitAction,
  gitActionOnServer,
  initCommittedRepository,
  LIBRARY_DEPLOYMENT,
  openGitTestContext,
  setGitCapability,
  type GitTestContext,
} from "./gitTestSetup.js";

const gitMissing = gitProgramMissing();
if (gitMissing) {
  console.warn(`gitCredentials.679.phase8 skipped: ${gitMissing}`);
}

const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";
const WRAPPING_KEY = "test-secrets-master-679-phase8";
const REMOTE_USER = { username: "miroir-designer", password: "ghp_test-token-679" };
const PRINCIPAL: AuthPrincipal = { miroirUserUuid: "679a0008-0000-4000-8000-000000000008", username: "designer" };

let context: GitTestContext;
let server: GitHttpServer;
let secretName: string;
/** Every result of the file, checked at the end for the token and the ciphertext. */
const results: Action2ReturnType[] = [];

async function run(
  actionType: Parameters<typeof gitAction>[1],
  payload: Record<string, unknown> = {},
  principal?: AuthPrincipal,
): Promise<Action2ReturnType> {
  const result = principal
    ? await gitActionOnServer(context, actionType, payload, principal)
    : await gitAction(context, actionType, payload);
  results.push(result);
  return result;
}

/** The MiroirSecret rows of Admin named `name`, as the store holds them. */
async function secretRows(name: string): Promise<Record<string, unknown>[]> {
  const result = await context.serverDomainController.handleBoxedExtractorOrQueryAction(
    {
      actionType: "runBoxedQueryAction",
      endpoint: QUERY_ENDPOINT,
      payload: {
        application: ADMIN_APPLICATION_UUID,
        applicationSection: "data",
        queryExecutionStrategy: "storage",
        query: {
          application: ADMIN_APPLICATION_UUID,
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          extractors: {
            secrets: { extractorOrCombinerType: "extractorInstancesByEntity", parentUuid: ENTITY_MIROIR_SECRET_UUID },
          },
        },
      },
    } as any,
    { ...defaultSelfApplicationDeploymentMap, ...applicationDeploymentMap },
    getDefaultLibraryModelEnvironmentDEFUNCT(
      defaultMiroirMetaModel,
      endpointDocument as EndpointDefinition,
      LIBRARY_DEPLOYMENT,
    ),
  );
  expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
  const secrets = (result as { returnedDomainElement?: { secrets?: unknown } }).returnedDomainElement?.secrets;
  const rows = Array.isArray(secrets) ? secrets : Object.values((secrets ?? {}) as Record<string, unknown>);
  return (rows as Record<string, unknown>[]).filter((row) => row.name === name);
}

function expectAuthenticationRequired(result: Action2ReturnType): void {
  expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
  expect((result as Action2Error).errorType).toBe("ExternalServiceUnauthorized");
  expect((result as Action2Error).errorContext).toMatchObject({ reason: "authenticationRequired", host: server.host });
}

describe.skipIf(gitMissing)("Git credentials (#679 slice 8)", () => {
  beforeAll(async () => {
    context = await openGitTestContext();
    setGitCapability(context, true);
    await initCommittedRepository(context.libraryRoot);
    server = await startGitHttpServer({ basicAuth: REMOTE_USER });
    const url = server.createBareRepository("library");
    // the remote holds the branch: written through the folder, which asks for no token
    gitCli(context.libraryRoot, "push", "--quiet", path.join(server.root, "library.git"), "main");
    expectOk(await run("gitAction_setRemote", { url }));
    secretName = `git.${server.host}`;
  });

  afterAll(async () => {
    clearSecrets();
    clearSecretsMasterKey();
    await server?.close();
  });

  it("says the remote needs a credential, naming its host", async () => {
    const requestsBefore = server.requests.length;
    expectAuthenticationRequired(await run("gitAction_fetch"));
    expect(server.requests.slice(requestsBefore).map((request) => request.status)).toEqual([401]);
  });

  it("refuses a wrong token once, without retrying it", async () => {
    const requestsBefore = server.requests.length;
    expectAuthenticationRequired(
      await run("gitAction_fetch", { credential: { username: REMOTE_USER.username, token: "wrong" } }),
    );
    expect(server.requests.slice(requestsBefore).map((request) => request.status)).toEqual([401, 401]);
  });

  it("fetches with the credential of the payload, and keeps it nowhere", async () => {
    const result = expectOk<GitRemoteResult>(
      await run("gitAction_fetch", { credential: { username: REMOTE_USER.username, token: REMOTE_USER.password } }),
    );
    expect(result.branches.remote).toContain("origin/main");
    expect(() => resolveSecret(secretName)).toThrow();
    expect(await secretRows(secretName)).toEqual([]);
    expectAuthenticationRequired(await run("gitAction_fetch"));
  });

  it("refuses to save a credential without a wrapping key", async () => {
    clearSecretsMasterKey();
    const refused = expectGitError(
      await run("gitAction_setCredential", { host: server.host, username: REMOTE_USER.username, token: REMOTE_USER.password }),
      "secretsUnavailable",
    );
    expect(refused.errorMessage).toContain("a wrapping key is required to save the credential");
    expect(await secretRows(secretName)).toEqual([]);
  });

  it("refuses a host that is not a host name", async () => {
    setSecretsMasterKey(WRAPPING_KEY);
    for (const host of ["", "https://github.com", "github.com/owner", "a b"]) {
      expectGitError(
        await run("gitAction_setCredential", { host, username: REMOTE_USER.username, token: REMOTE_USER.password }),
        "invalidPayload",
      );
    }
  });

  it("names the secret after the host as a remote URL gives it", async () => {
    setSecretsMasterKey(WRAPPING_KEY);
    const saved = expectOk<GitSetCredentialResult>(
      await run(
        "gitAction_setCredential",
        { host: "GitHub.com:443", username: REMOTE_USER.username, token: REMOTE_USER.password },
        PRINCIPAL,
      ),
    );
    expect(saved.name).toBe("git.github.com");
  });

  it("saves the logged-in user's credential, which serves that user only", async () => {
    setSecretsMasterKey(WRAPPING_KEY);
    const saved = expectOk<GitSetCredentialResult>(
      await run(
        "gitAction_setCredential",
        { host: server.host, username: REMOTE_USER.username, token: REMOTE_USER.password },
        PRINCIPAL,
      ),
    );
    expect(saved).toEqual({ name: secretName, scope: "user" });
    const rows = await secretRows(secretName);
    // a user's row names its MiroirUser; a process row names none
    expect(rows.map((row) => row.miroirUser)).toEqual([PRINCIPAL.miroirUserUuid]);

    expectOk<GitRemoteResult>(await run("gitAction_fetch", {}, PRINCIPAL));
    expectAuthenticationRequired(await run("gitAction_fetch"));
  });

  it("saves the process' credential when nobody is logged in, which the next fetch uses", async () => {
    setSecretsMasterKey(WRAPPING_KEY);
    const saved = expectOk<GitSetCredentialResult>(
      await run("gitAction_setCredential", {
        host: server.host,
        username: REMOTE_USER.username,
        token: REMOTE_USER.password,
      }),
    );
    expect(saved).toEqual({ name: secretName, scope: "process" });
    expect((await secretRows(secretName)).map((row) => row.miroirUser ?? "process").sort()).toEqual(
      [PRINCIPAL.miroirUserUuid, "process"].sort(),
    );
    const requestsBefore = server.requests.length;
    expectOk<GitRemoteResult>(await run("gitAction_fetch"));
    expect(server.requests.slice(requestsBefore).every((request) => request.status === 200)).toBe(false);
    expect(server.requests.at(-1)?.status).toBe(200);
  });

  it("never returns the token or the stored ciphertext", async () => {
    const ciphertexts = (await secretRows(secretName))
      .map((row) => row.ciphertext)
      .filter((ciphertext): ciphertext is string => typeof ciphertext === "string" && ciphertext !== "");
    expect(ciphertexts.length).toBe(2);
    const returned = JSON.stringify(results);
    expect(returned).not.toContain(REMOTE_USER.password);
    for (const ciphertext of ciphertexts) {
      expect(returned).not.toContain(ciphertext);
    }
  });
});
