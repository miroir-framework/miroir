import type { Runner } from "miroir-core";

import lendDocument from "../assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/cc853632-f158-43fa-b9ed-437c9c25f539.json" with { type: "json" };
import returnDocument from "../assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/98a38a84-e702-4540-a056-c7676a193a2b.json" with { type: "json" };

/**
 * Typed Runners for the single-leaf library runner MiroirTest suites.
 * Each runnerTest leaf declares `runnerRef`; the host passes `runnerUuidIndex`
 * for lookup at session / execution time.
 */
export const lendDocumentRunner = lendDocument as unknown as Runner;
export const returnDocumentRunner = returnDocument as unknown as Runner;
