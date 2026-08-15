import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { writeFailedRunExportFile } from "./writeFailedRunExport.js";

describe("writeFailedRunExportFile", () => {
  it("writes miroir-run-{runId}-error.json", async () => {
    const directory = await mkdtemp(join(tmpdir(), "miroir-run-export-"));
    try {
      const path = await writeFailedRunExportFile(
        {
          runId: "K7X2NQ",
          timestamp: "2026-08-15T00:00:00.000Z",
          activities: [],
          events: [],
        },
        directory,
      );
      expect(path).toBe(join(directory, "miroir-run-K7X2NQ-error.json"));
      const written = JSON.parse(await readFile(path, "utf8"));
      expect(written.runId).toBe("K7X2NQ");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
