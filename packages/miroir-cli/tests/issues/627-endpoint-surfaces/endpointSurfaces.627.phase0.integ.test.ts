// #627 slice 0: the CLI command list before the endpoint action catalog.
import { describe, expect, it } from "vitest";

import { getAllCommands } from "../../../src/commands/commandsFromEndpoint.js";

describe("endpoint surfaces before #627 (CLI)", () => {
  it("names the 7 instance endpoint commands and the Library lendDocument command, nothing else", () => {
    const commandNames = getAllCommands()
      .map((handler) => handler.commandDescription.name)
      .sort();

    expect(commandNames).toEqual(
      [
        "createInstance",
        "deleteInstance",
        "deleteInstanceWithCascade",
        "getInstance",
        "getInstances",
        "lendDocument",
        "loadNewInstancesInLocalCache",
        "updateInstance",
      ].sort(),
    );
  });
});
