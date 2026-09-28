/**
 * #330 PR review: a Report test answers the outbound requests of its session's DomainController,
 * not those of the other controllers of the process (the app around the test sandbox).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { Action2Error, executeExternalServiceOperation } from "miroir-core";
import { DomainController } from "../../src/3_controllers/DomainController";

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

describe("DomainController outbound fetch (#330)", () => {
  it("answers the requests of the controller it is set on, not those of another controller", async () => {
    const globalFetch = vi.fn(async () => new Response("", { status: 503 }));
    vi.stubGlobal("fetch", globalFetch);
    const sessionController = new DomainController("local", {} as any, {} as any, {} as any);
    const otherController = new DomainController("local", {} as any, {} as any, {} as any);
    const fakeFetch = vi.fn(async () => new Response(OPENAPI_DOCUMENT, { status: 200 }));
    sessionController.setOutboundFetch(fakeFetch);

    expect(await prepareOpenApiDocument(sessionController)).not.toBeInstanceOf(Action2Error);
    expect(fakeFetch).toHaveBeenCalledWith(DOCUMENT_URL, { redirect: "manual" });

    const otherResult = await prepareOpenApiDocument(otherController);
    expect(otherResult).toBeInstanceOf(Action2Error);
    expect((otherResult as Action2Error).errorMessage).toContain("HTTP 503");
    expect(globalFetch).toHaveBeenCalledTimes(1);
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });

  it("goes back to the global fetch when the replacement is removed", async () => {
    const globalFetch = vi.fn(async () => new Response("", { status: 503 }));
    vi.stubGlobal("fetch", globalFetch);
    const controller = new DomainController("local", {} as any, {} as any, {} as any);
    controller.setOutboundFetch(async () => new Response(OPENAPI_DOCUMENT, { status: 200 }));
    controller.setOutboundFetch(undefined);

    expect(await prepareOpenApiDocument(controller)).toBeInstanceOf(Action2Error);
    expect(globalFetch).toHaveBeenCalledTimes(1);
  });

  it("sends an external service operation through the fetch it is given", async () => {
    const globalFetch = vi.fn(async () => new Response("", { status: 503 }));
    vi.stubGlobal("fetch", globalFetch);
    const fakeFetch = vi.fn(async () => new Response(JSON.stringify({ id: "42" }), { status: 200 }));

    const result = await executeExternalServiceOperation(
      publicServiceEndpoint() as any,
      "get-item",
      { item_id: "42" },
      undefined,
      fakeFetch,
    );

    expect(result).not.toBeInstanceOf(Action2Error);
    expect(fakeFetch).toHaveBeenCalledTimes(1);
    expect(String((fakeFetch.mock.calls[0] as unknown[])[0])).toBe("https://api.example.com/items/42");
    expect(globalFetch).not.toHaveBeenCalled();
  });
});
