/**
 * External service calls (#472): bound query parameters are sent; responses are checked
 * against the operation's responseSchema (unknown fields stripped, wrong types fail,
 * a nullable field accepts null, as GitHub's `description: null`).
 */
import { describe, expect, it } from "vitest";

import { Action2Error } from "../../src/0_interfaces/2_domain/DomainElement";
import type { OutboundFetch } from "../../src/0_interfaces/4-services/ExternalServiceClientInterface";
import {
  createExternalServiceClient,
  createExternalServiceTokenCache,
} from "../../src/4_services/ExternalServiceClient";

const BASE_URL = "http://127.0.0.1:9";

function endpointReturning() {
  return {
    definition: {
      externalService: {
        openApiDocument: "{}",
        baseUrl: BASE_URL,
        securityScheme: { type: "none" as const },
        enabledOperations: ["list-repos"],
        operations: [
          {
            operationId: "list-repos",
            method: "GET",
            path: "/repos",
            parameterMappings: [
              { name: "per_page", in: "query" },
              { name: "sort", in: "query" },
            ],
            responseSchema: {
              type: "array",
              definition: {
                type: "object",
                definition: {
                  name: { type: "string" },
                  description: { type: "string", nullable: true },
                },
              },
            },
          },
        ],
      },
    },
  };
}

async function listReposAnswering(
  body: unknown,
  bindings: Record<string, unknown> = {},
  requests: string[] = [],
) {
  const fetch: OutboundFetch = async (input) => {
    requests.push(String(input));
    return new Response(JSON.stringify(body), { status: 200 });
  };
  const client = createExternalServiceClient({
    fetch,
    resolveSecret: () => {
      throw new Error("Unknown or empty secret");
    },
    tokenCache: createExternalServiceTokenCache(),
    insecureBaseUrls: [BASE_URL],
  });
  return client.executeOperation(endpointReturning(), "list-repos", bindings);
}

describe("external service calls", () => {
  it("sends bound query parameters, and leaves unbound ones out", async () => {
    const requests: string[] = [];
    await listReposAnswering([], { per_page: 100 }, requests);

    expect(requests).toEqual([`${BASE_URL}/repos?per_page=100`]);
  });

  it("encodes query parameter values", async () => {
    const requests: string[] = [];
    await listReposAnswering([], { per_page: "1", sort: "a b&c" }, requests);

    expect(requests).toEqual([`${BASE_URL}/repos?per_page=1&sort=a%20b%26c`]);
  });

  it("accepts null for a nullable field", async () => {
    const result = await listReposAnswering([{ name: "hello", description: null }]);

    expect(result).not.toBeInstanceOf(Action2Error);
    expect((result as { returnedDomainElement: unknown }).returnedDomainElement).toEqual([
      { name: "hello", description: null },
    ]);
  });

  it("refuses null for a field that is not nullable", async () => {
    const result = await listReposAnswering([{ name: null, description: "x" }]);

    expect(result).toBeInstanceOf(Action2Error);
    expect((result as Action2Error).errorMessage).toMatch(/type mismatch at \[0\]\.name: expected string/);
  });

  it("strips fields the schema does not declare", async () => {
    const result = await listReposAnswering([{ name: "hello", description: "d", archive_url: "u" }]);

    expect((result as { returnedDomainElement: unknown }).returnedDomainElement).toEqual([
      { name: "hello", description: "d" },
    ]);
  });
});
