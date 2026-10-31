/**
 * #636 Slice 1 — REST through createMiroirServerApp, behind the authentication gate, on port 0.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createMiroirServerApp, type MiroirServerApp } from "../../../src/index.js";
import {
  BOOK_ENTITY,
  LIBRARY_APPLICATION,
  LIBRARY_DEPLOYMENT,
  listen,
  startServerTestPlatform,
  type Listening,
  type ServerTestPlatform,
} from "../../support/serverTestPlatform.js";

const MODEL_ENDPOINT_UUID = "7947ae40-eb34-4149-887b-15a9021e714e";
const BIG_DIGITS = "9007199254740993"; // 2^53 + 1: a Number would read 9007199254740992
const BIG_SUM = "9007199254740994";

let platform: ServerTestPlatform;

async function startApp(authenticationEnabled: boolean): Promise<{ miroir: MiroirServerApp; http: Listening }> {
  const miroir = await createMiroirServerApp({
    ...platform,
    authentication: { enabled: authenticationEnabled, mcpEnabled: false },
  });
  return { miroir, http: await listen(miroir.app) };
}

function booksUrl(baseUrl: string): string {
  return `${baseUrl}/CRUD/${LIBRARY_DEPLOYMENT}/data/entity/${BOOK_ENTITY}/all`;
}

beforeAll(async () => {
  platform = await startServerTestPlatform();
});

describe("serverApp.636.phase1 — REST without authentication", () => {
  let started: { miroir: MiroirServerApp; http: Listening };
  beforeAll(async () => {
    started = await startApp(false);
  });
  afterAll(async () => {
    await started.http.close();
    await started.miroir.close();
  });

  it("reads the Library's books", async () => {
    const response = await fetch(booksUrl(started.http.baseUrl));
    expect(response.status).toBe(200);
    expect(await response.text()).toContain(BOOK_ENTITY);
  });

  it("runs an action", async () => {
    const response = await fetch(`${started.http.baseUrl}/action/rollback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: {
          actionType: "rollback",
          actionLabel: "#636 rollback through REST",
          endpoint: MODEL_ENDPOINT_UUID,
          payload: { application: LIBRARY_APPLICATION },
        },
        applicationDeploymentMap: platform.applicationDeploymentMap,
      }),
    });
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("ok");
  });

  it("keeps a BigInt whole, in and out", async () => {
    const response = await fetch(`${started.http.baseUrl}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: {
          actionType: "runBoxedQueryAction",
          actionLabel: "#636 BigInt echo",
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
                // only a revived BigInt reaches BigInt addition (the sum comes back as digits)
                sum: {
                  transformerType: "+",
                  interpolation: "runtime",
                  args: [
                    { transformerType: "returnValue", interpolation: "runtime", value: { $bigint: BIG_DIGITS } },
                    { transformerType: "returnValue", interpolation: "runtime", value: { $bigint: "1" } },
                  ],
                },
                // a revived BigInt goes back out tagged only through the app's json replacer
                echo: { transformerType: "returnValue", interpolation: "runtime", value: { $bigint: BIG_DIGITS } },
              },
            },
          },
        },
        applicationDeploymentMap: platform.applicationDeploymentMap,
      }),
    });
    expect(response.status).toBe(200);
    const result = (await response.json()).returnedDomainElement;
    expect(result).toEqual({ sum: BIG_SUM, echo: { $bigint: BIG_DIGITS } });
  });
});

describe("serverApp.636.phase1 — REST with authentication", () => {
  let started: { miroir: MiroirServerApp; http: Listening };
  beforeAll(async () => {
    started = await startApp(true);
  });
  afterAll(async () => {
    await started.http.close();
    await started.miroir.close();
  });

  it("answers 401 without a token", async () => {
    const response = await fetch(booksUrl(started.http.baseUrl));
    expect(response.status).toBe(401);
  });
});
