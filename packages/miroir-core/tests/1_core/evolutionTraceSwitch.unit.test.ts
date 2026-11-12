/**
 * #708: how the `evolutionTraces` switch of a SelfApplication row reads. Pure reading of a row:
 * the integration side is `evolutionTraceSwitch.integ` in miroir-standalone-app.
 */
import { describe, expect, it } from "vitest";

import {
  evolutionTracesIgnoredWarning,
  isEvolutionTraceOn,
} from "../../src/1_core/versioning/evolutionTraceRecording";

describe("evolutionTraces switch (#708)", () => {
  it("is on only for a versioned application that sets it", () => {
    expect(isEvolutionTraceOn({ versioningMode: "versioned-internal", evolutionTraces: true })).toBe(true);
    expect(isEvolutionTraceOn({ versioningMode: "versioned-internal" })).toBe(false);
    expect(isEvolutionTraceOn({ evolutionTraces: true })).toBe(false);
    expect(isEvolutionTraceOn(undefined)).toBe(false);
  });

  it("warns when an unversioned application sets it, and only then", () => {
    expect(evolutionTracesIgnoredWarning({ name: "Library", evolutionTraces: true })).toBe(
      "application Library has evolutionTraces on but is unversioned: its traces are off",
    );
    expect(evolutionTracesIgnoredWarning({ name: "Library", evolutionTraces: "true" })).toBeDefined();
    expect(evolutionTracesIgnoredWarning({ versioningMode: "versioned-internal", evolutionTraces: true })).toBeUndefined();
    expect(evolutionTracesIgnoredWarning({ name: "Library" })).toBeUndefined();
  });
});
