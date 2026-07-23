import { describe, expect, it } from "vitest";

import { resolveDefinitionVersionForTraceEvent } from "../../src/2_domain/evolutionTraceDefVersion.js";

const DEF_VERSION_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("resolveDefinitionVersionForTraceEvent", () => {
  it("path 1: instance.parentDefinitionVersionUuid → instanceParentDefinitionVersion", () => {
    const result = resolveDefinitionVersionForTraceEvent({
      instance: { parentDefinitionVersionUuid: DEF_VERSION_UUID },
    });

    expect(result).toEqual({
      definitionVersionUuid: DEF_VERSION_UUID,
      resolution: "instanceParentDefinitionVersion",
    });
  });

  it("path 2: action payload entityDefinitionUuid → actionPayload", () => {
    const result = resolveDefinitionVersionForTraceEvent({
      instance: {},
      entityDefinitionUuidFromPayload: DEF_VERSION_UUID,
    });

    expect(result).toEqual({
      definitionVersionUuid: DEF_VERSION_UUID,
      resolution: "actionPayload",
    });
  });

  it("path 3: ApplicationVersionCrossEntityDefinition lookup → applicationVersionCrossEntityDefinition", () => {
    const result = resolveDefinitionVersionForTraceEvent({
      crossEntityLookup: {
        currentApplicationVersionUuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        targetEntityUuid: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        entries: [
          {
            applicationVersion: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            entityDefinition: DEF_VERSION_UUID,
            entityUuid: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          },
        ],
      },
    });

    expect(result).toEqual({
      definitionVersionUuid: DEF_VERSION_UUID,
      resolution: "applicationVersionCrossEntityDefinition",
    });
  });

  it("path 4: all absent → unresolved and emits a warning", () => {
    const warnings: string[] = [];
    const result = resolveDefinitionVersionForTraceEvent({
      warn: (message) => warnings.push(message),
    });

    expect(result).toEqual({
      definitionVersionUuid: undefined,
      resolution: "unresolved",
    });
    expect(warnings.length).toBeGreaterThanOrEqual(1);
  });
});
