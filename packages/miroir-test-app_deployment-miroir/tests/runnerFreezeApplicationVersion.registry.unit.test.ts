/**
 * #225 Phase 1 — freeze Runner registry resolve.
 */
import { describe, expect, it } from "vitest";

import {
  resolveRunnerMiroirEntityRunnerRef,
  RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY,
} from "../src/runnerMiroirEntityTestRegistry.js";

describe("225 Phase 1 — freeze Runner registry", () => {
  it("resolves freezeApplicationVersion and keeps createEntity / dropEntity", () => {
    expect(Object.keys(RUNNER_MIROIR_ENTITY_RUNNER_REGISTRY).sort()).toEqual([
      "createEntity",
      "dropEntity",
      "freezeApplicationVersion",
    ]);
    const runner = resolveRunnerMiroirEntityRunnerRef("freezeApplicationVersion");
    expect(runner.name).toBe("freezeApplicationVersion");
    expect((runner as any).uuid).toBe("20d51c4c-52e5-4077-baf3-5e87bd75e496");
  });
});
