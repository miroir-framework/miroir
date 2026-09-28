/**
 * #341 Slice 0: characterization of Miroir action dispatch before actions reference
 * library implementations. Later slices edit these expectations deliberately.
 */
import { describe, expect, it } from "vitest";

import { getEndpointActions, logPhaseForActionType } from "miroir-core";
import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";
import { autocommitActionTypesFromUI } from "../../../../src/3_controllers/DomainController";

const MIROIR_APPLICATION_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";

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
  TestEndpoint: ["runTestCompositeAction", "runTestCase"],
  MenuEndpoint: ["menuAddItem"],
  ApplicationEndpoint: ["createApplication", "dropApplication"],
  LocalCacheEndpoint: [],
};

const miroirEndpoints = defaultMiroirMetaModel.endpoints.filter(
  (endpoint: any) => endpoint.application === MIROIR_APPLICATION_UUID,
);

function actionTypesOf(endpoint: any): string[] {
  return (getEndpointActions(endpoint) ?? []).map(
    (action: any) => action.actionParameters.actionType.definition,
  );
}

describe("#341 phase 0: Miroir action dispatch characterization", () => {
  it("bundles 10 of the 11 Miroir Endpoints, with their action types; MenuEndpoint is not bundled", () => {
    const actual = Object.fromEntries(
      miroirEndpoints.map((endpoint: any) => [endpoint.name, actionTypesOf(endpoint)]),
    );
    const { MenuEndpoint: _notBundled, ...expectedBundled } = expectedActionTypesByEndpoint;
    expect(actual).toEqual(expectedBundled);
  });

  it("lists InstanceEndpoint and StoreManagementEndpoint twice in the bundled meta-model", () => {
    const names = miroirEndpoints.map((endpoint: any) => endpoint.name);
    const duplicated = names.filter((name: string, index: number) => names.indexOf(name) !== index);
    expect(names.length).toBe(12);
    expect(duplicated.sort()).toEqual(["InstanceEndpoint", "StoreManagementEndpoint"]);
  });

  it("declares an actionImplementation only on entity_DuplicateAttribute, as a composite template", () => {
    const implemented = miroirEndpoints.flatMap((endpoint: any) =>
      (getEndpointActions(endpoint) ?? [])
        .filter((action: any) => action.actionImplementation)
        .map((action: any) => [
          action.actionParameters.actionType.definition,
          action.actionImplementation.actionImplementationType,
        ]),
    );
    expect(implemented).toEqual([["entity_DuplicateAttribute", "compositeActionTemplate"]]);
  });

  it("autocommits from the UI after 6 action types", () => {
    expect([...autocommitActionTypesFromUI].sort()).toEqual(
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

  it("assigns a log phase to 10 action types", () => {
    const allActionTypes = Object.values(expectedActionTypesByEndpoint).flat();
    const phases = Object.fromEntries(
      allActionTypes
        .map((actionType) => [actionType, logPhaseForActionType(actionType)])
        .filter(([, phase]) => phase !== undefined),
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
});
