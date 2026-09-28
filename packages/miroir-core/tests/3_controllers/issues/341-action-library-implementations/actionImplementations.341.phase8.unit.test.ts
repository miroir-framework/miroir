/**
 * #341 Slice 8: whether an action autocommits from the UI, and its log phase, are attributes of
 * its definition. The values read from the bundled Endpoints equal the Slice 0 locks.
 */
import { describe, expect, it } from "vitest";

import { getEndpointActions, logPhaseForActionType } from "miroir-core";
import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";

const bundledActions = defaultMiroirMetaModel.endpoints.flatMap(
  (endpoint: any) => getEndpointActions(endpoint) ?? [],
) as any[];

function actionTypesWhere(predicate: (action: any) => boolean): string[] {
  return [
    ...new Set(
      bundledActions
        .filter(predicate)
        .map((action) => action.actionParameters.actionType.definition as string),
    ),
  ].sort();
}

describe("#341 phase 8: autocommit and log phase from action definitions", () => {
  it("declares autocommitFromUI on the 6 action types locked in Slice 0", () => {
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

  it("declares the log phase locked in Slice 0 on 10 action types", () => {
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
