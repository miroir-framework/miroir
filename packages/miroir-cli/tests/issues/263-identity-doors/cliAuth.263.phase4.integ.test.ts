/**
 * #263 Slice 4 — the CLI on test-filesystem with authentication on: commands run as the
 * platform user given by --user (password from MIROIR_PASSWORD) or --token, and are refused
 * without one. Admin seed users: alice (Library grant), carol (no grant), bob (inactive).
 */
import { beforeAll, describe, expect, it } from "vitest";
import {
  ConfigurationService,
  issueBearerToken,
  setProcessTokenSecret,
} from "miroir-core";
import { openTestEnvironment, selectedTestEnvironment } from "miroir-env";
import { entityBook, selfApplicationLibrary } from "miroir-example-library";

import { authenticateCli, type CliIdentityOptions } from "../../../src/authentication.js";
import { cliRequestHandlers_EntityEndpoint } from "../../../src/commands/commandsFromEndpoint.js";
import { initializePlatform, type CliPlatform } from "../../../src/platform.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("cliAuth.263");

const SECRET = "cli-secret-263";
const ALICE = { miroirUserUuid: "1c39328c-7de4-44ae-bcf1-5bbc38d8e267", username: "alice" };
const globalTimeOut = 120000;

let platform: CliPlatform;

async function authenticate(
  options: CliIdentityOptions,
  env: Record<string, string | undefined> = {},
  argv: string[] = [],
) {
  return authenticateCli({
    platform,
    argv,
    env: { MIROIR_AUTH_ENABLED: "1", ...env },
    options,
    readPassword: async () => undefined,
  });
}

async function readLibraryBooks() {
  return cliRequestHandlers_EntityEndpoint.getInstances.execute(
    {
      application: selfApplicationLibrary.uuid,
      applicationSection: "data",
      parentUuid: entityBook.uuid,
    },
    platform.domainController,
    platform.applicationDeploymentMap,
  );
}

if (runThis) {
  describe("cliAuth.263.phase4 CLI identity", () => {
    beforeAll(async () => {
      const environmentName = selectedTestEnvironment(process.env) ?? "test-filesystem";
      openTestEnvironment(environmentName, { reseed: true });
      ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });
      setProcessTokenSecret(SECRET);
      platform = await initializePlatform({ env: { ...process.env, MIROIR_ENV: environmentName } });
    }, globalTimeOut);

    it("refuses to start without identity, and the gate refuses the command", async () => {
      const authentication = await authenticate({});
      expect(authentication).toMatchObject({ ok: false, error: { type: "AuthenticationRequired" } });
      expect(await readLibraryBooks()).toMatchObject({ status: "error" });
    }, globalTimeOut);

    it("runs a Library read as alice (--user, MIROIR_PASSWORD)", async () => {
      const authentication = await authenticate({ user: "alice" }, { MIROIR_PASSWORD: "alice-dev" });
      expect(authentication).toMatchObject({ ok: true, principal: { username: "alice" } });
      expect(await readLibraryBooks()).toMatchObject({ status: "success" });
    }, globalTimeOut);

    it("denies carol the Library read", async () => {
      const authentication = await authenticate({ user: "carol" }, { MIROIR_PASSWORD: "carol-dev" });
      expect(authentication).toMatchObject({ ok: true, principal: { username: "carol" } });
      const result = await readLibraryBooks();
      expect(result.status).toBe("error");
      expect(result).toMatchObject({ error: { type: "AccessDenied" } });
    }, globalTimeOut);

    it("fails the same way for an inactive user and a wrong password", async () => {
      const bob = await authenticate({ user: "bob" }, { MIROIR_PASSWORD: "bob-dev" });
      const wrong = await authenticate({ user: "alice" }, { MIROIR_PASSWORD: "not-alice" });
      expect(bob).toMatchObject({ ok: false, error: { type: "AuthenticationFailed" } });
      expect(wrong).toEqual(bob);
    }, globalTimeOut);

    it("fails without a password when it cannot prompt", async () => {
      expect(await authenticate({ user: "alice" })).toMatchObject({
        ok: false,
        error: { type: "AuthenticationFailed" },
      });
    }, globalTimeOut);

    it("accepts a token issued with the shared secret, refuses one from another secret", async () => {
      const shared = await issueBearerToken(ALICE, SECRET);
      expect(await authenticate({ token: shared })).toMatchObject({ ok: true, principal: { username: "alice" } });
      expect(await readLibraryBooks()).toMatchObject({ status: "success" });

      const foreign = await issueBearerToken(ALICE, "another-secret");
      expect(await authenticate({}, { MIROIR_AUTH_TOKEN: foreign })).toMatchObject({
        ok: false,
        error: { type: "AuthenticationFailed" },
      });
    }, globalTimeOut);

    it("needs no identity when the hatch is off", async () => {
      expect(await authenticate({}, {}, ["--disable-auth"])).toEqual({ ok: true, enabled: false });
      expect(await authenticate({}, { MIROIR_AUTH_ENABLED: "0" })).toEqual({ ok: true, enabled: false });
      expect(await readLibraryBooks()).toMatchObject({ status: "success" });
    }, globalTimeOut);
  });
}
