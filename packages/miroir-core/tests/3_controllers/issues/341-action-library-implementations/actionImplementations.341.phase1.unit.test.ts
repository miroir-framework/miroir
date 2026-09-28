/**
 * #341 Slice 1 (tracer): a Miroir action runs from the libraryImplementation its Endpoint
 * definition references, through DomainController.handleAction.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Action2Error,
  defaultMiroirModelEnvironment,
  getEndpointActions,
  type MiroirModelEnvironment,
} from "miroir-core";
import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";
import { miroirActionImplementations } from "../../../../src/3_controllers/ActionImplementations";
import { DomainController } from "../../../../src/3_controllers/DomainController";
import { MiroirActivityTracker } from "../../../../src/3_controllers/MiroirActivityTracker";
import { MiroirContext } from "../../../../src/3_controllers/MiroirContext";
import { MiroirEventService } from "../../../../src/3_controllers/MiroirEventService";

const DOMAIN_ENDPOINT_UUID = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";
const DOCUMENT_URL = "https://api.example.com/openapi.json";
const OPENAPI_DOCUMENT = JSON.stringify({
  openapi: "3.0.0",
  info: { title: "Example", version: "1.0.0" },
  paths: {},
});

function newDomainController(): DomainController {
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirContext = new MiroirContext(
    miroirActivityTracker,
    new MiroirEventService(miroirActivityTracker),
  );
  const controller = new DomainController("local", miroirContext, {} as any, {} as any);
  controller.setOutboundFetch(async () => new Response(OPENAPI_DOCUMENT, { status: 200 }));
  return controller;
}

const prepareOpenApiDocumentAction = {
  actionType: "prepareOpenApiDocument",
  endpoint: DOMAIN_ENDPOINT_UUID,
  payload: { url: DOCUMENT_URL },
} as any;

function environmentWithImplementationName(name: string): MiroirModelEnvironment {
  const domainEndpoint = structuredClone(
    defaultMiroirModelEnvironment.endpointsByUuid[DOMAIN_ENDPOINT_UUID],
  );
  const action = (getEndpointActions(domainEndpoint) ?? []).find(
    (a: any) => a.actionParameters.actionType.definition == "prepareOpenApiDocument",
  ) as any;
  action.actionImplementation = {
    actionImplementationType: "libraryImplementation",
    inMemoryImplementationFunctionName: name,
  };
  return {
    ...defaultMiroirModelEnvironment,
    endpointsByUuid: {
      ...defaultMiroirModelEnvironment.endpointsByUuid,
      [DOMAIN_ENDPOINT_UUID]: domainEndpoint,
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("#341 phase 1: Miroir actions run from their library implementation reference", () => {
  it("runs prepareOpenApiDocument through handleAction from its Endpoint definition", async () => {
    const result = await newDomainController().handleAction(prepareOpenApiDocumentAction, {});
    expect(result).not.toBeInstanceOf(Action2Error);
    expect((result as any).returnedDomainElement).toBeDefined();
  });

  it("runs prepareOpenApiDocument through handleActionFromUI from its Endpoint definition", async () => {
    const result = await newDomainController().handleActionFromUI(prepareOpenApiDocumentAction, {});
    expect(result).not.toBeInstanceOf(Action2Error);
    expect((result as any).returnedDomainElement).toBeDefined();
  });

  it("returns InvalidAction naming an implementation missing from the map", async () => {
    const result = await newDomainController().handleAction(
      prepareOpenApiDocumentAction,
      {},
      environmentWithImplementationName("handleAction_doesNotExist"),
    );
    expect(result).toBeInstanceOf(Action2Error);
    expect((result as Action2Error).errorType).toBe("InvalidAction");
    expect((result as Action2Error).errorMessage).toContain("handleAction_doesNotExist");
  });

  it("returns InvalidAction for an action no Miroir Endpoint declares", async () => {
    const result = await newDomainController().handleAction(
      { actionType: "doesNotExist", endpoint: DOMAIN_ENDPOINT_UUID, payload: {} } as any,
      {},
    );
    expect(result).toBeInstanceOf(Action2Error);
    expect((result as Action2Error).errorType).toBe("InvalidAction");
  });

  it("declares an implementation for every action of the Endpoints DomainController dispatches", () => {
    const inScopeEndpoints = [
      "ModelEndpoint",
      "InstanceEndpoint",
      "DomainEndpoint",
      "StoreManagementEndpoint",
      "UndoRedoEndpoint",
      "QueryEndpoint",
    ];
    const withoutImplementation = defaultMiroirMetaModel.endpoints
      .filter((endpoint: any) => inScopeEndpoints.includes(endpoint.name))
      .flatMap((endpoint: any) =>
        (getEndpointActions(endpoint) ?? [])
          .filter((action: any) => !action.actionImplementation)
          .map((action: any) => endpoint.name + "." + action.actionParameters.actionType.definition),
      );
    expect(withoutImplementation).toEqual([]);
  });

  it("resolves every libraryImplementation declared in the bundled Endpoints", () => {
    const declared = defaultMiroirMetaModel.endpoints.flatMap((endpoint: any) =>
      (getEndpointActions(endpoint) ?? [])
        .filter(
          (action: any) =>
            action.actionImplementation?.actionImplementationType == "libraryImplementation",
        )
        .map((action: any) => action.actionImplementation.inMemoryImplementationFunctionName),
    );
    expect(declared).toContain("handleAction_prepareOpenApiDocument");
    expect(declared.filter((name: string) => !miroirActionImplementations[name])).toEqual([]);
  });
});
