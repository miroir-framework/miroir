/**
 * #636 Slice 5 — the mount rules: Miroir's app mounted at the root of a host's Express app, before
 * the host's own body parser, keeps BigInt values whole; the host's routes still answer.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createMiroirServerApp, type MiroirServerApp } from "../../../src/index.js";
import {
  LIBRARY_APPLICATION,
  listen,
  startServerTestPlatform,
  type Listening,
  type ServerTestPlatform,
} from "../../support/serverTestPlatform.js";

const BIG_DIGITS = "9007199254740993";

let platform: ServerTestPlatform;
let miroir: MiroirServerApp;
let http: Listening;

beforeAll(async () => {
  platform = await startServerTestPlatform();
  miroir = await createMiroirServerApp({
    ...platform,
    authentication: { enabled: false, mcpEnabled: false },
  });
  const host = express();
  host.use(miroir.app);
  host.use(express.json());
  host.post("/mine", (request, response) => {
    response.json({ mine: request.body });
  });
  http = await listen(host);
});

afterAll(async () => {
  await http.close();
  await miroir.close();
});

describe("serverApp.636.phase5 — mounted on a host app", () => {
  it("keeps a BigInt whole through the host", async () => {
    const response = await fetch(`${http.baseUrl}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: {
          actionType: "runBoxedQueryAction",
          actionLabel: "#636 BigInt echo through a host",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: LIBRARY_APPLICATION,
            applicationSection: "data",
            queryExecutionStrategy: "localCacheOrFetch",
            query: {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              application: LIBRARY_APPLICATION,
              pageParams: {},
              queryParams: {},
              contextResults: {},
              extractors: {},
              runtimeTransformers: {
                echo: { transformerType: "returnValue", interpolation: "runtime", value: { $bigint: BIG_DIGITS } },
              },
            },
          },
        },
        applicationDeploymentMap: platform.applicationDeploymentMap,
      }),
    });
    expect((await response.json()).returnedDomainElement).toEqual({ echo: { $bigint: BIG_DIGITS } });
  });

  it("lets the host's own routes answer", async () => {
    const response = await fetch(`${http.baseUrl}/mine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a: 1 }),
    });
    expect(await response.json()).toEqual({ mine: { a: 1 } });
  });

  it("states both mount rules in the published types", () => {
    const declarations = readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../dist/index.d.ts"),
      "utf8",
    );
    expect(declarations).toContain("mount `app` at the host's root");
    expect(declarations).toContain("mount it before any host body parser");
  });
});
