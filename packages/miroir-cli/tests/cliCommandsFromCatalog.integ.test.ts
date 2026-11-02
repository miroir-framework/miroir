// #627: the CLI commands are the endpoint action catalog, named as the MCP tools, with
// the action type as an alias when exactly one command has it.
import { Command } from "commander";
import { beforeAll, describe, expect, it } from "vitest";

import {
  ConfigurationService,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
} from "@miroir-framework/core";
import { openTestEnvironment, selectedTestEnvironment } from "@miroir-framework/env";

import { getAllCommands, type CliCommandHandler } from "../src/commands/commandsFromEndpoint.js";
import { registerCatalogCommands } from "../src/commands/registerCatalogCommands.js";
import { initializePlatform } from "../src/platform.js";

const globalTimeOut = 120000;
const appForTestApplicationUuid = "eef01001-0001-4000-8000-000000000001";
const entityCountryUuid = "d3139a6d-0486-4ec8-bded-2a83a3c3cee4";

let domainController: DomainControllerInterface;
let applicationDeploymentMap: ApplicationDeploymentMap;
let commands: CliCommandHandler<any>[];

function programWith(handlers: CliCommandHandler<any>[]) {
  const program = new Command();
  program.exitOverride();
  program.command("list").action(() => undefined);
  const registration = registerCatalogCommands(program, handlers, domainController, applicationDeploymentMap);
  return { program, registration };
}

function countryNames(): string[] {
  const deploymentUuid = applicationDeploymentMap[appForTestApplicationUuid];
  const countries = (domainController.getLocalCache().getDomainState() as any)[deploymentUuid]?.["data"]?.[
    entityCountryUuid
  ];
  return Object.values(countries ?? {}).map((country: any) => country.name);
}

describe("CLI commands from the endpoint action catalog", () => {
  beforeAll(async () => {
    const environmentName = selectedTestEnvironment(process.env) ?? "test-filesystem";
    openTestEnvironment(environmentName, { reseed: true });
    ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });
    const platform = await initializePlatform({ env: { ...process.env, MIROIR_ENV: environmentName } });
    domainController = platform.domainController;
    applicationDeploymentMap = platform.applicationDeploymentMap;
    commands = getAllCommands(domainController, applicationDeploymentMap);
  }, globalTimeOut);

  it(
    "runs the fixture application's Endpoint action as a command",
    async () => {
      const { program } = programWith(commands);
      await program.parseAsync(
        ["appForTest_fixtureCreateItem", "--payload", JSON.stringify({ name: "Clitopia" })],
        { from: "user" },
      );
      await domainController.handleAction(
        {
          actionType: "rollback",
          actionLabel: "Refresh appForTest",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: { application: appForTestApplicationUuid },
        },
        applicationDeploymentMap,
      );

      expect(countryNames()).toContain("Clitopia");
    },
    globalTimeOut,
  );

  it("keeps today's short command names as aliases", () => {
    const { registration } = programWith(commands);

    expect(registration.aliases).toMatchObject({
      createInstance: "Miroir_createInstance",
      lendDocument: "Library_lendDocument",
    });
  });

  it("never registers a reserved name as an alias, and skips a command whose name is taken", () => {
    const createInstance = commands.find((command) => command.commandDescription.name === "Miroir_createInstance")!;
    const listAction = {
      ...createInstance,
      commandDescription: { ...createInstance.commandDescription, name: "Fixture_list" },
      entry: { ...createInstance.entry, actionType: "list" },
    };
    const { registration } = programWith([listAction, createInstance, createInstance]);

    expect({ aliases: registration.aliases, skipped: registration.skipped.map((skip) => skip.name) }).toEqual({
      aliases: {},
      skipped: ["Miroir_createInstance"],
    });
  });
});
