import { execFileSync } from "node:child_process";

import { EnvironmentError } from "./environmentFiles.js";

// ################################################################################################
// Asset folders hold application source (models, seed data, test fixtures): a run must not write
// into them (#321). Same scope as scripts/tracked_assets_guard.py, which nonreg uses with a
// snapshot of the developer's own edits; `miroir-env check --tracked-clean` is the CI form.
// ################################################################################################

const ASSET_PATHSPECS = [
  ":(glob)packages/*/assets/**",
  ":(glob)packages/*/tests/assets/**",
  ":(glob)packages/*/tests/test_assets/**",
];

/** Asset files that differ from HEAD or are untracked, according to git (ignored files excluded). */
export function changedAssetFiles(repositoryRoot: string): string[] {
  let output: string;
  try {
    output = execFileSync(
      "git",
      ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--", ...ASSET_PATHSPECS],
      { cwd: repositoryRoot, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim();
    throw new EnvironmentError(`cannot list changed asset files: ${stderr || (error as Error).message}`);
  }
  const entries = output.split("\0");
  const files: string[] = [];
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    if (!entry) {
      continue;
    }
    const status = entry.slice(0, 2);
    files.push(entry.slice(3));
    if (status.includes("R") || status.includes("C")) {
      files.push(entries[++index]); // original path of a rename or copy
    }
  }
  return [...new Set(files)].sort();
}
