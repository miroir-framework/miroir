/**
 * #330 PR review, #339: a DomainController sends its outbound requests through the external service
 * client it is built with, not through those of the other controllers of the process.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { Action2Error } from "miroir-core";
import { DomainController } from "../../src/3_controllers/DomainController";
import type { OutboundFetch } from "../../src/0_interfaces/4-services/ExternalServiceClientInterface";
import { defaultExternalServiceClient } from "../../src/5_setup/externalServiceEnvironment";

const DOCUMENT_URL = "https://api.example.com/openapi.json";
const OPENAPI_DOCUMENT = JSON.stringify({
  openapi: "3.0.0",
  info: { title: "Example", version: "1.0.0" },
  paths: {},
});

function publicServiceEndpoint() {
  return {
    definition: {
      externalService: {
        openApiDocument: "{}",
        baseUrl: "https://api.example.com",
        securityScheme: { type: "none" as const },
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

function controllerOn(fetch?: OutboundFetch): DomainController {
  return new DomainController(
    "local",
    {} as any,
    {} as any,
    {} as any,
    defaultExternalServiceClient(fetch ? { fetch } : {}),
  );
}

function prepareOpenApiDocument(controller: DomainController) {
  return (controller as any).handlePrepareOpenApiDocument({
    actionType: "prepareOpenApiDocument",
    endpoint: "",
    payload: { url: DOCUMENT_URL },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DomainController outbound fetch (#330, #339)", () => {
  it("sends the requests of a controller through the fetch of its client, not through another controller's", async () => {
    const globalFetch = vi.fn(async () => new Response("", { status: 503 }));
    vi.stubGlobal("fetch", globalFetch);
    const fakeFetch = vi.fn(async () => new Response(OPENAPI_DOCUMENT, { status: 200 }));
    const sessionController = controllerOn(fakeFetch);
    const otherController = controllerOn();

    expect(await prepareOpenApiDocument(sessionController)).not.toBeInstanceOf(Action2Error);
    expect(fakeFetch).toHaveBeenCalledWith(DOCUMENT_URL, { redirect: "manual" });

    const otherResult = await prepareOpenApiDocument(otherController);
    expect(otherResult).toBeInstanceOf(Action2Error);
    expect((otherResult as Action2Error).errorMessage).toContain("HTTP 503");
    expect(globalFetch).toHaveBeenCalledTimes(1);
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });

  it("sends an external service operation through the fetch of the client", async () => {
    const globalFetch = vi.fn(async () => new Response("", { status: 503 }));
    vi.stubGlobal("fetch", globalFetch);
    const fakeFetch = vi.fn(async () => new Response(JSON.stringify({ id: "42" }), { status: 200 }));

    const result = await defaultExternalServiceClient({ fetch: fakeFetch }).executeOperation(
      publicServiceEndpoint() as any,
      "get-item",
      { item_id: "42" },
    );

    expect(result).not.toBeInstanceOf(Action2Error);
    expect(fakeFetch).toHaveBeenCalledTimes(1);
    expect(String((fakeFetch.mock.calls[0] as unknown[])[0])).toBe("https://api.example.com/items/42");
    expect(globalFetch).not.toHaveBeenCalled();
  });
});
