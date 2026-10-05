// `miroir-env check --snapshot <file>` records the warnings of the check; `check --since <file>`
// reports those warnings as info, so `--strict` fails only on warnings that appeared since. The
// nonreg run bracket uses it: a developer's own state (an application deployed by hand) is not
// the run's doing.
// vitest, not MiroirTest: a CLI command on filesystem Admin data in a temporary checkout.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

import { ENTITY_DEPLOYMENT_UUID } from "miroir-core";

import { run } from "./cliTestSupport";
import { temporaryCheckout } from "./bootTestSupport";

/** A Deployment row the dev definition does not install: `check` warns about it. */
function deployByHand(root: string, uuid: string, name: string): void {
  const directory = path.join(root, ".miroir/dev/admin/data", ENTITY_DEPLOYMENT_UUID);
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    path.join(directory, `${uuid}.json`),
    JSON.stringify({
      uuid,
      parentName: "Deployment",
      parentUuid: ENTITY_DEPLOYMENT_UUID,
      name,
      selfApplication: "3f0e7b1c-6d2a-4c11-9a3e-477000000009",
      configuration: { admin: { emulatedServerType: "filesystem", directory: `.miroir/dev/apps/${name}` } },
    }),
  );
}

const BY_HAND = "3f0e7b1c-6d2a-4c11-9a3e-477000000001";
const BY_THE_RUN = "3f0e7b1c-6d2a-4c11-9a3e-477000000002";

describe("miroir-env check --snapshot / --since", () => {
  let root: string;
  let snapshot: string;
  beforeEach(() => {
    root = temporaryCheckout();
    mkdirSync(path.join(root, ".miroir/dev/admin/data"), { recursive: true });
    snapshot = path.join(mkdtempSync(path.join(tmpdir(), "miroir-env-snapshot-")), "environment-check-before.json");
  });

  it("records the warnings of the check", async () => {
    deployByHand(root, BY_HAND, "byHand");

    const result = await run(["check", "--snapshot", snapshot], root);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`snapshot: 1 warning recorded in ${snapshot}`);
    const { warnings } = JSON.parse(readFileSync(snapshot, "utf-8"));
    expect(warnings).toEqual([expect.stringContaining(`deployment ${BY_HAND} (byHand)`)]);
  });

  it("does not fail --strict on the warnings recorded in the snapshot", async () => {
    deployByHand(root, BY_HAND, "byHand");
    await run(["check", "--snapshot", snapshot], root);

    const result = await run(["check", "--strict", "--since", snapshot], root);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`info: deployment ${BY_HAND} (byHand)`);
    expect(result.stdout).toContain("(already there at the snapshot)");
    expect(result.stdout).toContain("check: ok (strict)");
  });

  it("fails --strict on a warning that appeared since the snapshot", async () => {
    deployByHand(root, BY_HAND, "byHand");
    await run(["check", "--snapshot", snapshot], root);
    deployByHand(root, BY_THE_RUN, "byTheRun");

    const result = await run(["check", "--strict", "--since", snapshot], root);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain(`error: deployment ${BY_THE_RUN} (byTheRun)`);
    expect(result.stdout).toContain("check: 1 error (strict)");
  });

  it("counts every warning when the snapshot file is missing", async () => {
    deployByHand(root, BY_HAND, "byHand");

    const result = await run(["check", "--strict", "--since", path.join(path.dirname(snapshot), "absent.json")], root);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain(`error: deployment ${BY_HAND} (byHand)`);
  });
});
