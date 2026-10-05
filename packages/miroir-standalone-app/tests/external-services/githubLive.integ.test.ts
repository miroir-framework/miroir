/**
 * Opt-in live integration against the real GitHub REST API (#472).
 * Checks a personal access token with GET /user, then lists repositories with
 * GET /user/repos, both through the GitHubService Endpoint and its response validation.
 * Skipped unless LIVE_GITHUB_TOKEN is set. Never part of nonreg / CI.
 *
 * Run:
 * ```bash
 * LIVE_GITHUB_TOKEN=<token> \
 *   RUN_TEST=githubLive npm run testByFile -w miroir-standalone-app -- githubLive --profile emulatedServer-filesystem
 * ```
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Action2Error, clearSecrets } from "miroir-core";

import {
  applicationDeploymentMap,
  bootGitHubTestbed,
  GITHUB_APPLICATION_UUID,
  GITHUB_ENDPOINT_UUID,
  reseedGitHub,
  type GitHubTestbed,
} from "../helpers/githubAppTestbed.js";

const RUN_TEST = process.env.RUN_TEST;
const LIVE_GITHUB_TOKEN = process.env.LIVE_GITHUB_TOKEN;
const shouldRun =
  !!LIVE_GITHUB_TOKEN &&
  (!RUN_TEST || RUN_TEST === "githubLive" || RUN_TEST === "githubLive.integ.test");

let testbed: GitHubTestbed;

function probe(probeOperationId: string, probeParameters: Record<string, unknown> = {}) {
  return testbed.domainControllerForServer.handleAction(
    {
      actionType: "setExternalServiceCredential",
      actionLabel: "githubLive",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        application: GITHUB_APPLICATION_UUID,
        endpointUuid: GITHUB_ENDPOINT_UUID,
        credential: LIVE_GITHUB_TOKEN,
        probeOperationId,
        probeParameters,
        probeOnly: true,
      },
    } as any,
    applicationDeploymentMap,
    testbed.githubModelEnvironment,
  );
}

describe.skipIf(!shouldRun)("githubLive: real GitHub API", () => {
  beforeAll(async () => {
    testbed = await bootGitHubTestbed();
    await reseedGitHub(testbed, "https://api.github.com");
  }, 60000);

  afterAll(async () => {
    clearSecrets();
    await testbed?.fakeServer.close();
  });

  it("identifies the token's account", async () => {
    const result = await probe("users/get-authenticated");

    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
    const user = (result as { returnedDomainElement: { login?: unknown } }).returnedDomainElement;
    expect(typeof user.login).toBe("string");
  }, 30000);

  it("lists the account's repositories", async () => {
    const result = await probe("repos/list-for-authenticated-user", {
      per_page: "5",
      sort: "updated",
    });

    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
    const repositories = (result as { returnedDomainElement: unknown }).returnedDomainElement;
    expect(Array.isArray(repositories)).toBe(true);
    for (const repository of repositories as { full_name?: unknown }[]) {
      expect(typeof repository.full_name).toBe("string");
    }
  }, 30000);
});
