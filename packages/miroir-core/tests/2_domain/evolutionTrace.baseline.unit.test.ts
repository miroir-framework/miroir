import { describe, expect, it } from "vitest";

import type {
  ApplicationEvolutionTrace,
  ApplicationEvolutionTraceEvent,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  generateEvolutionBaseline,
  type EvolutionTraceDeploymentState,
} from "../../src/2_domain/evolutionTraceBaseline.js";

const APPLICATION_UUID = "dd986507-6b28-4aac-a27a-f2dfba2aa0e4";
const TIMESTAMP = "2024-01-01T00:00:00.000Z";

function emptyDeployment(): EvolutionTraceDeploymentState {
  return {
    applicationUuid: APPLICATION_UUID,
    roots: [] as ApplicationEvolutionTrace[],
    events: [] as ApplicationEvolutionTraceEvent[],
  };
}

describe("generateEvolutionBaseline", () => {
  it("empty history → exactly 1 ApplicationEvolutionTrace root and 1 squashedBaseline event", () => {
    const result = generateEvolutionBaseline(emptyDeployment(), TIMESTAMP);

    expect(result.roots).toHaveLength(1);
    expect(result.roots[0].applicationUuid).toBe(APPLICATION_UUID);
    expect(result.roots[0].branchName).toBe("master");

    expect(result.events).toHaveLength(1);
    expect(result.events[0].operationType).toBe("squashedBaseline");
    expect(result.events[0].compactionLevel).toBe("version");
    expect(result.events[0].traceRootUuid).toBe(result.roots[0].uuid);
  });

  it("calling twice is idempotent — still exactly 1 baseline event", () => {
    const first = generateEvolutionBaseline(emptyDeployment(), TIMESTAMP);
    const second = generateEvolutionBaseline(first, "2024-01-02T00:00:00.000Z");

    expect(second.roots).toHaveLength(1);
    expect(second.events).toHaveLength(1);
    expect(second.events[0].operationType).toBe("squashedBaseline");
    expect(second.roots[0].uuid).toBe(first.roots[0].uuid);
    expect(second.events[0].uuid).toBe(first.events[0].uuid);
  });
});
