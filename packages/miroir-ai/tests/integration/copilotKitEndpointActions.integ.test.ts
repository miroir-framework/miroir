// #627: the Endpoint actions of every deployed application other than the framework's own
// are CopilotKit actions, executed as the caller, from the live model.
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import express, { type NextFunction, type Request, type Response } from "express";
import { beforeAll, describe, expect, it } from "vitest";

import {
  defaultMiroirModelEnvironment,
  type ApplicationDeploymentMap,
  type AuthenticatedRequest,
  type DomainControllerInterface,
} from "miroir-core";

import { createCopilotKitRouter } from "../../src/routes/copilotKitRoute.js";
import { createMiroirCopilotKitActions } from "../../src/tools/miroirCopilotKitActions.js";
import { startAiTestPlatform } from "./aiTestPlatform.js";

const globalTimeOut = 60000;
const appForTestApplicationUuid = "eef01001-0001-4000-8000-000000000001";
const entityCountryUuid = "d3139a6d-0486-4ec8-bded-2a83a3c3cee4";
const fixtureActionName = "appForTest_fixtureCreateItem";
const allowedUser = { miroirUserUuid: "627a0001-0000-4000-8000-000000000001", username: "granted" };
const deniedUser = { miroirUserUuid: "627a0002-0000-4000-8000-000000000002", username: "denied" };

let domainController: DomainControllerInterface;
let applicationDeploymentMap: ApplicationDeploymentMap;

async function refreshFixture() {
  await domainController.handleAction(
    {
      actionType: "rollback",
      actionLabel: "Refresh appForTest",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: { application: appForTestApplicationUuid },
    },
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
  );
}

function countryNames(): string[] {
  const deploymentUuid = applicationDeploymentMap[appForTestApplicationUuid];
  const countries = (domainController.getLocalCache().getDomainState() as any)[deploymentUuid]?.["data"]?.[
    entityCountryUuid
  ];
  return Object.values(countries ?? {}).map((country: any) => country.name);
}

/** What the identity middleware leaves on the request when the gate is on. */
function authentication(principal: AuthenticatedRequest & { allowed: true }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as any).miroirAuthentication = principal;
    next();
  };
}

function signedIn(principal: { miroirUserUuid: string; username: string }) {
  return {
    allowed: true as const,
    principal,
    access: {
      directory: { users: [], credentials: [] },
      grants: [{ miroirUser: allowedUser.miroirUserUuid, targetType: "application", targetUuid: appForTestApplicationUuid }],
      deployments: [{ uuid: applicationDeploymentMap[appForTestApplicationUuid], selfApplication: appForTestApplicationUuid }],
    },
  };
}

async function postEndpointAction(
  name: string,
  body: unknown,
  options: { authenticationEnabled?: boolean; principal?: ReturnType<typeof signedIn> } = {},
) {
  const app = express();
  app.use(express.json());
  if (options.principal) {
    app.use(authentication(options.principal));
  }
  app.use(
    createCopilotKitRouter(domainController, applicationDeploymentMap, {
      authenticationEnabled: options.authenticationEnabled,
    }),
  );
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  try {
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/endpointAction/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: (await response.json()) as any };
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("CopilotKit actions from the endpoint action catalog", () => {
  beforeAll(async () => {
    const platform = await startAiTestPlatform(expect);
    domainController = platform.domainController;
    applicationDeploymentMap = platform.applicationDeploymentMap;
  }, globalTimeOut);

  it(
    "offers the deployed applications' actions and the static tools, not the framework's own actions",
    () => {
      const names = createMiroirCopilotKitActions(domainController, applicationDeploymentMap).map(
        (action) => action.name,
      );

      expect({
        offered: [fixtureActionName, "Library_lendDocument", "generateMiroirReport", "getMiroirContext"].filter(
          (name) => names.includes(name),
        ),
        framework: names.filter((name) => name.startsWith("Miroir_") || name.startsWith("Admin_")),
      }).toEqual({
        offered: [fixtureActionName, "Library_lendDocument", "generateMiroirReport", "getMiroirContext"],
        framework: [],
      });
    },
    globalTimeOut,
  );

  it(
    "creates a fixture Country when the assistant runs the fixture action",
    async () => {
      const fixtureAction = createMiroirCopilotKitActions(domainController, applicationDeploymentMap).find(
        (action) => action.name === fixtureActionName,
      )!;
      await (fixtureAction.handler as Function)({ name: "Copilotia" });
      await refreshFixture();

      expect(countryNames()).toContain("Copilotia");
    },
    globalTimeOut,
  );

  it(
    "runs an offered action through the endpointAction route",
    async () => {
      const response = await postEndpointAction(fixtureActionName, { name: "Routeland" });
      await refreshFixture();

      expect({ status: response.status, created: countryNames().includes("Routeland") }).toEqual({
        status: 200,
        created: true,
      });
    },
    globalTimeOut,
  );

  it(
    "does not reach a framework action through the endpointAction route",
    async () => {
      const response = await postEndpointAction("Miroir_createInstance", {});

      expect(response.status).toBe(404);
    },
    globalTimeOut,
  );

  it(
    "refuses the route to a principal without access to the fixture deployment when authentication is on",
    async () => {
      const response = await postEndpointAction(
        fixtureActionName,
        { name: "Deniedland" },
        { authenticationEnabled: true, principal: signedIn(deniedUser) },
      );
      await refreshFixture();

      expect({ status: response.status, created: countryNames().includes("Deniedland") }).toEqual({
        status: 403,
        created: false,
      });
    },
    globalTimeOut,
  );

  it(
    "runs the route for a principal with access to the fixture deployment when authentication is on",
    async () => {
      const response = await postEndpointAction(
        fixtureActionName,
        { name: "Grantland" },
        { authenticationEnabled: true, principal: signedIn(allowedUser) },
      );
      await refreshFixture();

      expect({ status: response.status, created: countryNames().includes("Grantland") }).toEqual({
        status: 200,
        created: true,
      });
    },
    globalTimeOut,
  );
});
