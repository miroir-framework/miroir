// #627 slice 0: what the MCP surface exposes before the endpoint action catalog moves to core.
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

describe("endpoint surfaces before #627 (MCP)", () => {
  beforeAll(async () => {
    const platform = await startMcpTestPlatform(expect, loggerOptions);
    domainController = platform.domainController;
    applicationDeploymentMap = platform.applicationDeploymentMap;
    // the environment boot opens the stores; each application's model reaches the local cache on rollback
    for (const application of Object.keys(applicationDeploymentMap)) {
      await refreshApplication(application);
    }
  }, globalTimeOut);

  it(
    "lists the instance endpoint and the Library lending tools under their current names",
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
    "has no truncated tool name, so changing the truncation hash renames nothing",
    async () => {
      const registry = new EndpointToolRegistry(domainController, applicationDeploymentMap);
      const toolNames = (await registry.listTools()).map((tool) => tool.name);

      expect(toolNames.filter((name) => name.length >= 64)).toEqual([]);
    },
    globalTimeOut,
  );
});
