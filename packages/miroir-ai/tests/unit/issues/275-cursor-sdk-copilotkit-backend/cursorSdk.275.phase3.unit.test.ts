/**
 * #275 Slice 3 — Cursor secret import only; health 503 mentions CURSOR_API_KEY.
 * Do not register in FunctionCallTestRegistry.
 */
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Router } from "express";
import { afterEach, describe, expect, it } from "vitest";
import { clearSecrets } from "miroir-core";

import { createCopilotKitRouter } from "../../../../src/routes/copilotKitRoute.js";
import { getApiKey } from "../../../../src/runtime/copilotRuntimeFactory.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "cursorSdk.275" ||
  RUN_TEST.startsWith("cursorSdk.275") ||
  RUN_TEST === "cursorSdk.275.phase3";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const FACTORY_SRC = join(REPO_ROOT, "packages/miroir-ai/src/runtime/copilotRuntimeFactory.ts");

function readFactorySource(): string {
  return readFileSync(FACTORY_SRC, "utf8");
}

async function getJson(router: Router, path: string): Promise<{ status: number; body: any }> {
  const app = express();
  app.use(express.json());
  app.use(router);
  const server = createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  try {
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { method: "GET" });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

if (runThis) {
  describe("cursorSdk.275.phase3 — AiProviderType stays four token providers", () => {
    it("copilotRuntimeFactory.ts AiProviderType is openai | anthropic | google | github only", () => {
      const src = readFactorySource();
      const match = src.match(
        /export type AiProviderType\s*=\s*"openai"\s*\|\s*"anthropic"\s*\|\s*"google"\s*\|\s*"github"/,
      );
      expect(match).not.toBeNull();
      expect(src).not.toMatch(/AiProviderType[^;]*"cursor"/);
    });
  });

  describe("cursorSdk.275.phase3 — getApiKey rejects cursor", () => {
    it('getApiKey("cursor") throws Unsupported AI provider', () => {
      expect(() => getApiKey("cursor" as any)).toThrow(/Unsupported AI provider/i);
    });
  });

  describe("cursorSdk.275.phase3 — GET /health 503 mentions CURSOR_API_KEY", () => {
    afterEach(() => {
      clearSecrets();
      delete process.env.AI_PROVIDER_TYPE;
      delete process.env.AI_MODEL;
    });

    it("503 message includes CURSOR_API_KEY or aiCursorKey when no token provider configured", async () => {
      const router = createCopilotKitRouter(undefined as any, {});
      const result = await getJson(router, "/health");

      expect(result.status).toBe(503);
      expect(result.body.configured).toBe(false);
      const message = String(result.body.message ?? "");
      expect(message.includes("CURSOR_API_KEY") || message.includes("aiCursorKey")).toBe(true);
    });
  });
}
