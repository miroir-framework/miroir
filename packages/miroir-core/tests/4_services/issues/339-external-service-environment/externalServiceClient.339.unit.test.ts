/**
 * #339: an external service client runs on the environment it is built with (fetch, secrets, token
 * cache, insecure base URLs); two clients share nothing.
 */
import { describe, expect, it } from "vitest";

import { Action2Error } from "../../../../src/0_interfaces/2_domain/DomainElement";
import type {
  ExternalServiceEnvironment,
  OutboundFetch,
} from "../../../../src/0_interfaces/4-services/ExternalServiceClientInterface";
import {
  createExternalServiceClient,
  createExternalServiceTokenCache,
} from "../../../../src/4_services/ExternalServiceClient";

const BASE_URL = "http://127.0.0.1:9";
const SECRETS: Record<string, string> = { clientId: "id-123", clientSecret: "secret-abc" };

function clientCredentialsEndpoint() {
  return {
    definition: {
      externalService: {
        openApiDocument: "{}",
        baseUrl: BASE_URL,
        securityScheme: {
          type: "oauth2ClientCredentials" as const,
          tokenUrl: `${BASE_URL}/token`,
          clientIdKey: "clientId",
          clientSecretKey: "clientSecret",
        },
        enabledOperations: ["get-item"],
        operations: [
          {
            operationId: "get-item",
            method: "GET",
            path: "/items/{item_id}",
            parameterMappings: [{ name: "item_id", in: "path", required: true }],
            responseSchema: {},
          },
        ],
      },
    },
  };
}

/** A fake external service: a token endpoint and an item endpoint; records the URLs it is sent. */
function fakeService(): { fetch: OutboundFetch; requests: string[] } {
  const requests: string[] = [];
  const fetch: OutboundFetch = async (input) => {
    const url = String(input);
    requests.push(url);
    if (url.endsWith("/token")) {
      return new Response(JSON.stringify({ access_token: `token-${requests.length}`, expires_in: 3600 }), {
        status: 200,
      });
    }
    return new Response(JSON.stringify({ id: "42" }), { status: 200 });
  };
  return { fetch, requests };
}

function environmentOn(
  fetch: OutboundFetch,
  overrides: Partial<ExternalServiceEnvironment> = {},
): ExternalServiceEnvironment {
  return {
    fetch,
    resolveSecret: (name) => {
      if (!SECRETS[name]) {
        throw new Error("Unknown or empty secret");
      }
      return { value: SECRETS[name], scope: "process", source: "hatch" };
    },
    tokenCache: createExternalServiceTokenCache(),
    insecureBaseUrls: [BASE_URL],
    ...overrides,
  };
}

async function getItem(client: ReturnType<typeof createExternalServiceClient>) {
  return client.executeOperation(clientCredentialsEndpoint(), "get-item", { item_id: "42" });
}

describe("externalServiceClient.339", () => {
  it("reuses the token of its own cache, and never the token of another client's cache", async () => {
    const service = fakeService();
    const client = createExternalServiceClient(environmentOn(service.fetch));
    const otherClient = createExternalServiceClient(environmentOn(service.fetch));

    expect(await getItem(client)).not.toBeInstanceOf(Action2Error);
    expect(await getItem(client)).not.toBeInstanceOf(Action2Error);
    expect(await getItem(otherClient)).not.toBeInstanceOf(Action2Error);

    expect(service.requests.filter((url) => url.endsWith("/token"))).toHaveLength(2);
  });

  it("rejects an insecure base URL that its environment does not allow, whatever another client allows", async () => {
    const service = fakeService();
    createExternalServiceClient(environmentOn(service.fetch));
    const strictClient = createExternalServiceClient(environmentOn(service.fetch, { insecureBaseUrls: [] }));

    const result = await getItem(strictClient);

    expect(result).toBeInstanceOf(Action2Error);
    expect((result as Action2Error).errorMessage).toMatch(/insecure or private/i);
    expect(service.requests).toHaveLength(0);
  });

  it("resolves its secrets through its environment", async () => {
    const service = fakeService();
    const client = createExternalServiceClient(
      environmentOn(service.fetch, {
        resolveSecret: () => {
          throw new Error("Unknown or empty secret");
        },
      }),
    );

    const result = await getItem(client);

    expect(result).toBeInstanceOf(Action2Error);
    expect((result as Action2Error).errorMessage).toMatch(/unknown or empty secret/i);
    expect(service.requests).toHaveLength(0);
  });
});
