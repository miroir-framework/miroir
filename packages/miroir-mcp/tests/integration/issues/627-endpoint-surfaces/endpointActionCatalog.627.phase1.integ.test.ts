// #627 slice 1: an Endpoint added to a deployed application (the appForTest fixture) becomes an MCP
// tool, with no code naming it.
import { beforeAll, describe, expect, it } from "vitest";

import {
  defaultMiroirModelEnvironment,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type LoggerOptions,
} from "miroir-core";

import { EndpointToolRegistry } from "../../../../src/tools/EndpointToolRegistry.js";
import { startMcpTestPlatform } from "../../mcpTestPlatform.js";

const loggerOptions: LoggerOptions = {
  defaultLevel: "WARN",
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
  specificLoggerOptions: {},
};

const globalTimeOut = 60000;

const appForTestApplicationUuid = "eef01001-0001-4000-8000-000000000001";
const entityCountryUuid = "d3139a6d-0486-4ec8-bded-2a83a3c3cee4";
const fixtureToolName = "appForTest_fixtureCreateItem";

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

describe("endpoint action catalog: a fixture Endpoint as an MCP tool", () => {
  beforeAll(async () => {
    const platform = await startMcpTestPlatform(expect, loggerOptions);
    domainController = platform.domainController;
    applicationDeploymentMap = platform.applicationDeploymentMap;
    for (const application of Object.keys(applicationDeploymentMap)) {
      await refreshApplication(application);
    }
  }, globalTimeOut);

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
});
