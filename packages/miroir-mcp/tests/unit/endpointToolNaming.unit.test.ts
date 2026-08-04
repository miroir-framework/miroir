import { describe, expect, it } from "vitest";

import {
  MCP_TOOL_NAME_MAX_LENGTH,
  sanitizeToolNamePart,
  toolNameFor,
  truncateToolName,
} from "../../src/tools/EndpointToolRegistry.js";

describe("sanitizeToolNamePart", () => {
  it("keeps allowed characters unchanged", () => {
    expect(sanitizeToolNamePart("Miroir")).toBe("Miroir");
    expect(sanitizeToolNamePart("create-Instance_2")).toBe("create-Instance_2");
    expect(sanitizeToolNamePart("ABCdef019_-")).toBe("ABCdef019_-");
  });

  it("replaces forbidden characters with underscores", () => {
    expect(sanitizeToolNamePart("My App")).toBe("My_App");
    expect(sanitizeToolNamePart("do.it")).toBe("do_it");
    expect(sanitizeToolNamePart("a/b\\c")).toBe("a_b_c");
    expect(sanitizeToolNamePart("app!name?")).toBe("app_name_");
  });

  it("replaces every occurrence, including unicode", () => {
    expect(sanitizeToolNamePart("éèê")).toBe("___");
    expect(sanitizeToolNamePart("a b c")).toBe("a_b_c");
  });
});

describe("truncateToolName", () => {
  it("leaves names at or below the limit unchanged", () => {
    expect(truncateToolName("Miroir_createInstance")).toBe("Miroir_createInstance");
    const exactly64 = "a".repeat(MCP_TOOL_NAME_MAX_LENGTH);
    expect(truncateToolName(exactly64)).toBe(exactly64);
  });

  it("truncates names above the limit to exactly the limit with a hash suffix", () => {
    const long = "A".repeat(100);
    const result = truncateToolName(long);
    expect(result.length).toBe(MCP_TOOL_NAME_MAX_LENGTH);
    expect(result.startsWith("A".repeat(MCP_TOOL_NAME_MAX_LENGTH - 9) + "_")).toBe(true);
    expect(result.slice(-8)).toMatch(/^[0-9a-f]{8}$/);
  });

  it("is deterministic", () => {
    const long = "SomeVeryLongApplicationName_" + "x".repeat(80);
    expect(truncateToolName(long)).toBe(truncateToolName(long));
  });

  it("keeps distinct long names with a common prefix distinct", () => {
    const prefix = "CommonPrefix_".repeat(6);
    const a = truncateToolName(prefix + "first");
    const b = truncateToolName(prefix + "second");
    expect(a).not.toBe(b);
    expect(a.length).toBe(MCP_TOOL_NAME_MAX_LENGTH);
    expect(b.length).toBe(MCP_TOOL_NAME_MAX_LENGTH);
  });
});

describe("toolNameFor", () => {
  it("builds <application>_<action> by default", () => {
    expect(toolNameFor("Miroir", "InstanceEndpoint", "createInstance", new Set())).toBe(
      "Miroir_createInstance",
    );
    expect(toolNameFor("Library", "LendingEndpoint", "lendDocument", new Set())).toBe(
      "Library_lendDocument",
    );
  });

  it("sanitizes application and action parts", () => {
    expect(toolNameFor("My App", "Endpoint", "do.it", new Set())).toBe("My_App_do_it");
  });

  it("disambiguates with the endpoint name on collision", () => {
    const taken = new Set(["App_doThing"]);
    expect(toolNameFor("App", "PingEndpoint", "doThing", taken)).toBe("App_PingEndpoint_doThing");
  });

  it("adds a numeric suffix when the disambiguated name is also taken", () => {
    const taken = new Set(["App_doThing", "App_PingEndpoint_doThing"]);
    expect(toolNameFor("App", "PingEndpoint", "doThing", taken)).toBe("App_PingEndpoint_doThing_2");
  });

  it("is deterministic for a given enumeration order", () => {
    const run = () => {
      const taken = new Set<string>();
      return [
        toolNameFor("App", "EndpointA", "doThing", taken),
        ...(() => {
          taken.add("App_doThing");
          return [toolNameFor("App", "EndpointB", "doThing", taken)];
        })(),
      ];
    };
    expect(run()).toEqual(run());
  });

  it("truncates overlong names to the MCP limit", () => {
    const app = "ExtremelyLongApplicationName".repeat(4);
    const name = toolNameFor(app, "Endpoint", "doSomething", new Set());
    expect(name.length).toBeLessThanOrEqual(MCP_TOOL_NAME_MAX_LENGTH);
    expect(name).toMatch(/^[a-zA-Z0-9_-]{1,64}$/);
  });
});
