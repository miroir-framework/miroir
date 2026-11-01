// #627: the MCP tools are the endpoint action catalog of miroir-core: every Endpoint action of every
// deployed application (here the appForTest fixture's), run with the model of the application it targets.
import { beforeAll, describe, expect, it } from "vitest";

import {
  defaultMiroirModelEnvironment,
  endpointActionTargetApplication,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type LoggerOptions,
} from "@miroir-framework/core";

import { EndpointToolRegistry } from "../../src/tools/EndpointToolRegistry.js";
import { startMcpTestPlatform } from "./mcpTestPlatform.js";

const loggerOptions: LoggerOptions = {
  defaultLevel: "WARN",
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
  specificLoggerOptions: {},
};

const globalTimeOut = 60000;

const appForTestApplicationUuid = "eef01001-0001-4000-8000-000000000001";
const entityCountryUuid = "d3139a6d-0486-4ec8-bded-2a83a3c3cee4";
const fixtureToolName = "appForTest_fixtureCreateItem";
const miroirApplicationUuid = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";

let domainController: DomainControllerInterface;
let applicationDeploymentMap: ApplicationDeploymentMap;

async function refreshApplication(application: string) {
  const result = await domainController.handleAction(
    {
      actionType: "rollback",
      actionLabel: `Refresh ${application} local cache`,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: { application },
    },
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
  );
  if (result.status !== "ok") {
    throw new Error(`Failed to refresh ${application}: ${JSON.stringify(result)}`);
  }
}

function countryNames(): string[] {
  const deploymentUuid = applicationDeploymentMap[appForTestApplicationUuid];
  const countries = (domainController.getLocalCache().getDomainState() as any)[deploymentUuid]?.["data"]?.[
    entityCountryUuid
  ];
  return Object.values(countries ?? {}).map((country: any) => country.name);
}

function createCountryPayload(uuid: string, name: unknown) {
  return {
    application: appForTestApplicationUuid,
    applicationSection: "data",
    parentUuid: entityCountryUuid,
    objects: [{ uuid, parentName: "Country", parentUuid: entityCountryUuid, name }],
  };
}

describe("MCP tools from the endpoint action catalog", () => {
  beforeAll(async () => {
    const platform = await startMcpTestPlatform(expect, loggerOptions);
    domainController = platform.domainController;
    applicationDeploymentMap = platform.applicationDeploymentMap;
    for (const application of Object.keys(applicationDeploymentMap)) {
      await refreshApplication(application);
    }
  }, globalTimeOut);

  it(
    "keeps the instance endpoint and Library lending tools under their names",
    async () => {
      const registry = new EndpointToolRegistry(domainController, applicationDeploymentMap);
      const toolNames = (await registry.listTools()).map((tool) => tool.name);

      expect(toolNames).toEqual(
        expect.arrayContaining(["Miroir_createInstance", "Miroir_getInstances", "Library_lendDocument"]),
      );
    },
    globalTimeOut,
  );

  it(
    "lists the fixture action as a tool whose input schema has the payload's attributes",
    async () => {
      const registry = new EndpointToolRegistry(domainController, applicationDeploymentMap);
      const fixtureTool = (await registry.listTools()).find((tool) => tool.name === fixtureToolName);

      expect(Object.keys(fixtureTool?.inputSchema?.properties ?? {}).sort()).toEqual(["code", "name"]);
    },
    globalTimeOut,
  );

  it(
    "creates a Country in the fixture application when the tool is called",
    async () => {
      const registry = new EndpointToolRegistry(domainController, applicationDeploymentMap);
      const result = await registry.callTool(fixtureToolName, { name: "Fixtureland", code: "FX" });
      expect(result.content[0].parsed?.status).toBe("success");

      await refreshApplication(appForTestApplicationUuid);
      expect(countryNames()).toContain("Fixtureland");
    },
    globalTimeOut,
  );

  it(
    "refuses a fixture Country whose name is not a string, naming the Entity and the attribute",
    async () => {
      const registry = new EndpointToolRegistry(domainController, applicationDeploymentMap);
      const result = await registry.callTool(
        "Miroir_createInstance",
        createCountryPayload("65434538-bc31-4d02-a55c-6cd23f77720c", 42),
      );

      expect(result.content[0].parsed?.error?.message).toMatch(/Country.*name/);
    },
    globalTimeOut,
  );

  it(
    "creates a fixture Country whose attributes match its Entity",
    async () => {
      const registry = new EndpointToolRegistry(domainController, applicationDeploymentMap);
      const result = await registry.callTool(
        "Miroir_createInstance",
        createCountryPayload("11d3cd67-18b0-4a13-89f8-5939df789ad8", "Matchland"),
      );

      expect(result.content[0].parsed?.status).toBe("success");
    },
    globalTimeOut,
  );

  it("runs a Miroir action naming an application that is not deployed with the Miroir model", () => {
    expect(
      endpointActionTargetApplication(
        { applicationUuid: miroirApplicationUuid },
        { application: "00000000-0000-4000-8000-000000000000" },
        applicationDeploymentMap,
      ),
    ).toBe(miroirApplicationUuid);
  });
});
