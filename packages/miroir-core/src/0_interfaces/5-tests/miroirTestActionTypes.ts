import { z } from "zod";

/**
 * Provisional `actionTest` leaf (Phase 0 draft).
 * Full entity / fundamental-schema wiring lands in Phase 1.
 * Shape is intentionally a subset of `runnerTest` (no runnerRef / initialModel / preRunner*).
 */
export type MiroirTestForAction = {
  miroirTestType: "actionTest";
  miroirTestLabel: string;
  skip?: boolean;
  testTag?: string | string[];
  testParams?: Record<string, unknown>;
  /** End-state: action sequence under test (typed in Phase 1+). */
  compositeActionSequence?: unknown;
  /** End-state: assertions after the sequence (typed in Phase 1+). */
  testCompositeActionAssertions?: unknown[];
};

export const miroirTestForActionDraft: z.ZodType<MiroirTestForAction> = z
  .object({
    miroirTestType: z.literal("actionTest"),
    miroirTestLabel: z.string().min(1),
    skip: z.boolean().optional(),
    testTag: z.union([z.string(), z.array(z.string())]).optional(),
    testParams: z.record(z.string(), z.any()).optional(),
    compositeActionSequence: z.any().optional(),
    testCompositeActionAssertions: z.array(z.any()).optional(),
  })
  .strict();
