/**
 * #341: Miroir actions run from the implementation their Endpoint definition references
 * (`libraryImplementation` in `miroirActionImplementations`, or a composite action template),
 * and declare their UI autocommit and log phase. DomainController holds no list of action types.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Action2Error,
  defaultMiroirModelEnvironment,
  getEndpointActions,
  logPhaseForActionType,
  type MiroirModelEnvironment,
} from "miroir-core";
import { defaultMiroirMetaModel } from "miroir-app-miroir";
import { miroirActionImplementations } from "../../src/3_controllers/ActionImplementations";
import { DomainController } from "../../src/3_controllers/DomainController";
import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { MiroirContext } from "../../src/3_controllers/MiroirContext";
import { MiroirEventService } from "../../src/3_controllers/MiroirEventService";
import { defaultExternalServiceClient } from "../../src/5_setup/externalServiceEnvironment";

const MIROIR_APPLICATION_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
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
  return new DomainController(
    "local",
    miroirContext,
    {} as any,
    {} as any,
    defaultExternalServiceClient({ fetch: async () => new Response(OPENAPI_DOCUMENT, { status: 200 }) }),
  );
}

const prepareOpenApiDocumentAction = {
  actionType: "prepareOpenApiDocument",
  endpoint: DOMAIN_ENDPOINT_UUID,
  payload: { url: DOCUMENT_URL },
} as any;

function newRemoteDomainController(): DomainController {
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirContext = new MiroirContext(
    miroirActivityTracker,
    new MiroirEventService(miroirActivityTracker),
  );
  return new DomainController("remote", miroirContext, {} as any, {} as any, defaultExternalServiceClient());
}

/** A copy of the DomainEndpoint whose prepareOpenApiDocument definition is changed by `change`. */
function domainEndpointWith(change: (action: any) => void, endpointUuid = DOMAIN_ENDPOINT_UUID): any {
  const domainEndpoint = structuredClone(
    defaultMiroirModelEnvironment.endpointsByUuid[DOMAIN_ENDPOINT_UUID],
  ) as any;
  domainEndpoint.uuid = endpointUuid;
  change(
    (getEndpointActions(domainEndpoint) ?? []).find(
      (a: any) => a.actionParameters.actionType.definition == "prepareOpenApiDocument",
    ),
  );
  return domainEndpoint;
}

function environmentWithEndpoint(endpoint: any): MiroirModelEnvironment {
  return {
    ...defaultMiroirModelEnvironment,
    endpointsByUuid: {
      ...defaultMiroirModelEnvironment.endpointsByUuid,
      [endpoint.uuid]: endpoint,
    },
  };
}

const expectedActionTypesByEndpoint: Record<string, string[]> = {
  ModelEndpoint: [
    "initModel",
    "commit",
    "rollback",
    "remoteLocalCacheRollback",
    "resetModel",
    "resetData",
    "alterEntityAttribute",
    "entity_DuplicateAttribute",
    "renameEntity",
    "createEntity",
    "dropEntity",
    "freezeApplicationVersion",
  ],
  InstanceEndpoint: [
    "createInstance",
    "deleteInstance",
    "deleteInstanceWithCascade",
    "updateInstance",
    "loadNewInstancesInLocalCache",
    "getInstance",
    "getInstances",
  ],
  DomainEndpoint: [
    "transactionalInstanceAction",
    "compositeActionSequence",
    "compositeRunBoxedQueryAction",
    "compositeRunBoxedQueryTemplateAction",
    "connectExternalService",
    "prepareOpenApiDocument",
    "probeExternalService",
  ],
  StoreManagementEndpoint: [
    "storeManagementAction_createStore",
    "storeManagementAction_deleteStore",
    "storeManagementAction_resetAndInitApplicationDeployment",
    "storeManagementAction_openStore",
    "storeManagementAction_closeStore",
  ],
  UndoRedoEndpoint: ["undo", "redo"],
  QueryEndpoint: ["runBoxedQueryTemplateAction", "runBoxedQueryAction"],
  PersistenceEndpoint: [
    "LocalPersistenceAction_create",
    "LocalPersistenceAction_read",
    "LocalPersistenceAction_update",
    "LocalPersistenceAction_delete",
    "RestPersistenceAction_create",
    "RestPersistenceAction_read",
    "RestPersistenceAction_update",
    "RestPersistenceAction_delete",
  ],
  LocalCacheEndpoint: [],
};

const miroirEndpoints = defaultMiroirMetaModel.endpoints.filter(
  (endpoint: any) => endpoint.application === MIROIR_APPLICATION_UUID,
);

const bundledActions = miroirEndpoints.flatMap(
  (endpoint: any) => getEndpointActions(endpoint) ?? [],
) as any[];

function actionTypesOf(endpoint: any): string[] {
  return (getEndpointActions(endpoint) ?? []).map(
    (action: any) => action.actionParameters.actionType.definition,
  );
}

function actionTypesWhere(predicate: (action: any) => boolean): string[] {
  return [
    ...new Set(
      bundledActions
        .filter(predicate)
        .map((action) => action.actionParameters.actionType.definition as string),
    ),
  ].sort();
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Miroir Endpoint inventory", () => {
  it("bundles the 8 Miroir Endpoints, with their action types", () => {
    const actual = Object.fromEntries(
      miroirEndpoints.map((endpoint: any) => [endpoint.name, actionTypesOf(endpoint)]),
    );
    expect(actual).toEqual(expectedActionTypesByEndpoint);
  });

  it("lists InstanceEndpoint and StoreManagementEndpoint twice in the bundled meta-model", () => {
    const names = miroirEndpoints.map((endpoint: any) => endpoint.name);
    const duplicated = names.filter((name: string, index: number) => names.indexOf(name) !== index);
    expect(names.length).toBe(10);
    expect(duplicated.sort()).toEqual(["InstanceEndpoint", "StoreManagementEndpoint"]);
  });
});

describe("Miroir actions run from their implementation reference", () => {
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
    const endpointUuid = "0b7b1b62-4e0d-4a57-9a3e-7c1f0e6d2a11";
    const applicationUuid = "5c3f0a8e-1d2b-4c6f-8e9a-2b4d6f8a0c13";
    const result = await newRemoteDomainController().handleAction(
      { ...prepareOpenApiDocumentAction, endpoint: endpointUuid },
      {},
      environmentWithEndpoint(
        domainEndpointWith((action) => {
          action.actionImplementation = {
            actionImplementationType: "libraryImplementation",
            inMemoryImplementationFunctionName: "handleAction_doesNotExist",
          };
        }, endpointUuid),
      ),
      { [endpointUuid]: applicationUuid },
    );
    expect(result).toBeInstanceOf(Action2Error);
    expect((result as Action2Error).errorType).toBe("InvalidAction");
    expect((result as Action2Error).errorMessage).toContain("handleAction_doesNotExist");
  });

  it("runs a Miroir action from its bundled definition when the model environment holds an older copy", async () => {
    const result = await newDomainController().handleAction(
      prepareOpenApiDocumentAction,
      {},
      environmentWithEndpoint(
        domainEndpointWith((action) => {
          delete action.actionImplementation;
        }),
      ),
    );
    expect(result).not.toBeInstanceOf(Action2Error);
    expect((result as any).returnedDomainElement).toBeDefined();
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

  it("runs entity_DuplicateAttribute from its composite action template", () => {
    expect(
      actionTypesWhere(
        (action) => action.actionImplementation?.actionImplementationType == "compositeActionTemplate",
      ),
    ).toEqual(["entity_DuplicateAttribute"]);
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

describe("UI autocommit and log phase declared on action definitions", () => {
  it("declares autocommitFromUI on 6 action types", () => {
    expect(actionTypesWhere((action) => action.autocommitFromUI === true)).toEqual(
      [
        "alterEntityAttribute",
        "compositeActionSequence",
        "createEntity",
        "dropEntity",
        "renameEntity",
        "transactionalInstanceAction",
      ].sort(),
    );
  });

  it("declares a log phase on 10 action types", () => {
    const phases = Object.fromEntries(
      bundledActions
        .filter((action) => action.logPhase !== undefined)
        .map((action) => [action.actionParameters.actionType.definition, action.logPhase]),
    );
    expect(phases).toEqual({
      rollback: "rollback",
      remoteLocalCacheRollback: "rollback",
      initModel: "bootstrap",
      resetModel: "bootstrap",
      resetData: "bootstrap",
      storeManagementAction_createStore: "bootstrap",
      storeManagementAction_openStore: "bootstrap",
      storeManagementAction_resetAndInitApplicationDeployment: "bootstrap",
      runBoxedQueryAction: "query",
      compositeRunBoxedQueryAction: "query",
    });
  });

  it("logPhaseForActionType reads the log phase of the bundled definitions", () => {
    for (const action of bundledActions) {
      const actionType = action.actionParameters.actionType.definition;
      expect(logPhaseForActionType(actionType), actionType).toBe(action.logPhase);
    }
  });
});
