import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { RunExportBundle } from "miroir-core";

export async function writeFailedRunExportFile(
  bundle: RunExportBundle,
  directory: string = process.env.MIROIR_RUN_EXPORT_DIR ?? process.cwd(),
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
