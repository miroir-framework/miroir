import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { readMeasurements } from "../src/bundleSizeHistory";
import { main } from "../scripts/backfillBundleSize";

// Bundle size history (#473): `npm run bundle-size:backfill` writes one BundleSizeMeasurement per
// change of eagerGzipBaseline in the git history of the bundle policies.

const POLICY = "packages/miroir-standalone-app/bundle-policy.json";

function git(repo: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: repo, encoding: "utf-8" }).trim();
}

function commitPolicy(repo: string, policy: object, subject: string): string {
  writeFileSync(join(repo, POLICY), JSON.stringify(policy, null, 2));
  git(repo, "add", POLICY);
  git(repo, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-q", "-m", subject);
  return git(repo, "rev-parse", "HEAD");
}

/** A repository whose web policy changes its baseline twice and its lists once. */
function repositoryWithPolicyHistory(): { repo: string; commits: string[] } {
  const repo = mkdtempSync(join(tmpdir(), "meta-backfill-repo-"));
  git(repo, "init", "-q");
  mkdirSync(join(repo, "packages/miroir-standalone-app"), { recursive: true });
  const commits = [
    commitPolicy(repo, { eagerGzipBaseline: 900, eager: ["a"] }, "first baseline"),
    commitPolicy(repo, { eagerGzipBaseline: 900, eager: ["a", "b"] }, "lists only"),
    commitPolicy(repo, { eagerGzipBaseline: 800, eager: ["a", "b"] }, "smaller page"),
  ];
  return { repo, commits };
}

describe("bundle-size:backfill", () => {
  it("writes one instance per baseline change", async () => {
    const { repo, commits } = repositoryWithPolicyHistory();
    const dataDir = mkdtempSync(join(tmpdir(), "meta-backfill-data-"));

    expect(await main(["--repo-root", repo, "--data-dir", dataDir])).toBe(0);

    const instances = readMeasurements(dataDir).sort((a, b) => a.baseline - b.baseline).reverse();
    expect(instances).toHaveLength(2);
    expect(instances[0]).toMatchObject({
      application: "miroir-standalone-app",
      gitCommit: commits[0],
      reason: "first baseline",
      eagerGzipBytes: 900,
      baseline: 900,
    });
    expect(instances[0].previousBaseline).toBeUndefined();
    expect(instances[1]).toMatchObject({
      gitCommit: commits[2],
      reason: "smaller page",
      baseline: 800,
      previousBaseline: 900,
      baselineChange: -100,
    });
    expect(instances[1].measuredAt).toBe(new Date(git(repo, "log", "-1", "--format=%cI", commits[2])).toISOString());
  });

  it("is idempotent", async () => {
    const { repo } = repositoryWithPolicyHistory();
    const dataDir = mkdtempSync(join(tmpdir(), "meta-backfill-data-"));
    expect(await main(["--repo-root", repo, "--data-dir", dataDir])).toBe(0);

    expect(await main(["--repo-root", repo, "--data-dir", dataDir])).toBe(0);

    expect(readMeasurements(dataDir)).toHaveLength(2);
  });

  it("--dry-run writes nothing", async () => {
    const { repo } = repositoryWithPolicyHistory();
    const dataDir = mkdtempSync(join(tmpdir(), "meta-backfill-data-"));

    expect(await main(["--repo-root", repo, "--data-dir", dataDir, "--dry-run"])).toBe(0);

    expect(readdirSync(dataDir)).toEqual([]);
  });
});
