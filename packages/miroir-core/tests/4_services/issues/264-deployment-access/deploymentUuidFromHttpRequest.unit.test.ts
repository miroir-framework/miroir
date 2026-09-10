/**
 * #267 follow-up — the access gate must find the target deployment on query routes.
 * `/query` and `/queryTemplate` carry the deployment uuid in `payload.application`
 * (legacy query-action naming), optionally wrapped as `{ action, applicationDeploymentMap }`.
 * Not reachable as MiroirTest: HTTP request shape is a platform concern.
 */
import { describe, expect, it } from "vitest";

import { deploymentUuidFromHttpRequest } from "../../../../src/1_core/authentication/deploymentUuidFromHttpRequest.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("deploymentUuidFromHttpRequest");

const DEPLOYMENT = "fd47d115-67e2-4870-8339-1c26665d1d15";

describe("deploymentUuidFromHttpRequest", () => {
  (runThis ? it : it.skip)("extracts the deployment from the route params (CRUD routes)", () => {
    expect(
      deploymentUuidFromHttpRequest({ params: { deploymentUuid: DEPLOYMENT }, body: {} }),
    ).toBe(DEPLOYMENT);
  });

  (runThis ? it : it.skip)("extracts a top-level body deploymentUuid", () => {
    expect(deploymentUuidFromHttpRequest({ params: {}, body: { deploymentUuid: DEPLOYMENT } })).toBe(
      DEPLOYMENT,
    );
  });

  (runThis ? it : it.skip)("extracts payload.deploymentUuid from a bare action body", () => {
    expect(
      deploymentUuidFromHttpRequest({
        params: {},
        body: { actionType: "runBoxedQueryAction", payload: { deploymentUuid: DEPLOYMENT } },
      }),
    ).toBe(DEPLOYMENT);
  });

  (runThis ? it : it.skip)("extracts payload.application from a bare query action body", () => {
    expect(
      deploymentUuidFromHttpRequest({
        params: {},
        body: {
          actionType: "runBoxedQueryTemplateAction",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: { application: DEPLOYMENT, applicationSection: "data", query: {} },
        },
      }),
    ).toBe(DEPLOYMENT);
  });

  (runThis ? it : it.skip)("unwraps { action, applicationDeploymentMap } bodies", () => {
    expect(
      deploymentUuidFromHttpRequest({
        params: {},
        body: {
          action: {
            actionType: "runBoxedQueryTemplateAction",
            payload: { application: DEPLOYMENT, applicationSection: "data", query: {} },
          },
          applicationDeploymentMap: {},
        },
      }),
    ).toBe(DEPLOYMENT);
  });

  (runThis ? it : it.skip)("resolves payload.application through body.applicationDeploymentMap", () => {
    const APPLICATION = "00514586-bf72-4de3-beea-0a627c821404";
    expect(
      deploymentUuidFromHttpRequest({
        params: {},
        body: {
          action: {
            actionType: "runBoxedQueryTemplateAction",
            payload: { application: APPLICATION, applicationSection: "data", query: {} },
          },
          applicationDeploymentMap: { [APPLICATION]: DEPLOYMENT },
        },
      }),
    ).toBe(DEPLOYMENT);
  });

  (runThis ? it : it.skip)("falls back to the raw payload.application when the map has no entry", () => {
    const APPLICATION = "00514586-bf72-4de3-beea-0a627c821404";
    expect(
      deploymentUuidFromHttpRequest({
        params: {},
        body: {
          action: { actionType: "runBoxedQueryAction", payload: { application: APPLICATION } },
          applicationDeploymentMap: {},
        },
      }),
    ).toBe(APPLICATION);
  });

  (runThis ? it : it.skip)("prefers payload.deploymentUuid over payload.application", () => {
    expect(
      deploymentUuidFromHttpRequest({
        params: {},
        body: { payload: { deploymentUuid: DEPLOYMENT, application: "aaaaaaaa-aaaa-4aaa-9aaa-aaaaaaaaaaaa" } },
      }),
    ).toBe(DEPLOYMENT);
  });

  (runThis ? it : it.skip)("returns undefined when no deployment can be found", () => {
    expect(deploymentUuidFromHttpRequest({ params: {}, body: {} })).toBeUndefined();
    expect(
      deploymentUuidFromHttpRequest({ params: {}, body: { payload: { application: 42 } } }),
    ).toBeUndefined();
    expect(deploymentUuidFromHttpRequest({})).toBeUndefined();
  });
});
