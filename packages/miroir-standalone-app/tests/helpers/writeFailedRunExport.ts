import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { RunExportBundle } from "@miroir-framework/core";

/** `<repo>/test-results/run-exports`: gitignored, unlike the cwd (the package folder under npm -w). */
export const defaultRunExportDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../test-results/run-exports",
);

export async function writeFailedRunExportFile(
  bundle: RunExportBundle,
  directory: string = process.env.MIROIR_RUN_EXPORT_DIR ?? defaultRunExportDirectory,
): Promise<string> {
  await mkdir(directory, { recursive: true });
  const path = join(directory, `miroir-run-${bundle.runId}-error.json`);
  await writeFile(path, JSON.stringify(bundle, null, 2), "utf8");
  return path;
}

export async function onFailedRunExport(bundle: RunExportBundle): Promise<void> {
  const path = await writeFailedRunExportFile(bundle);
  console.log(`Wrote failed run export ${path}`);
}
