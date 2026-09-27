import { expect, test } from "vitest";

import { loads } from "./sharedModuleState.mjs";

// Passes only when no other test file has loaded the shared module in this module graph.
loads.count += 1;

test("is the only file that loaded the shared module", () => {
  expect(loads.count).toBe(1);
});
