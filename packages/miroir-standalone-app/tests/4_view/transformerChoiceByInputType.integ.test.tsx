import { waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";

import { book1, book2, entityBook } from "miroir-example-library";

import {
  buildBooksIndex,
  getListTransformerPanel,
  getPanelTransformerTypeOptions,
  renderListTransformerPanelInteg,
  setPanelElementTransformerType,
} from "./helpers/listTransformerIntegRig.js";

// #383 — the transformerType select only offers the transformer types whose declared
// `inputOutput.input` accepts the input of their position (real editor tree, real definitions).
describe("transformer choice by input type (#383)", () => {
  describe("ListTransformerPanel, Book rows", () => {
    it("hides array-input transformers at the root and says how many are hidden", async () => {
      renderListTransformerPanelInteg(buildBooksIndex(book1, book2), {
        rowEntityUuid: entityBook.uuid,
      });

      const options = await getPanelTransformerTypeOptions();

      expect(options).toContain("getFromContext");
      expect(options).toContain("dataflowObject");
      expect(options).not.toContain("aggregate");
      expect(options).not.toContain("mapList");
      // The select's candidates are the 37 discriminator values of the transformer union; for a
      // Book input the 15 with an `array`, `string` or other-entity declared input are hidden.
      const panel = await getListTransformerPanel();
      await waitFor(() =>
        expect(
          panel.querySelector('[data-testid="transformer-type-restriction-hint"][data-restriction-path=""]'),
        ).toHaveTextContent("15 transformers hidden for input Book"),
      );
    });

    it("restricts a nested select by the input of its position", async () => {
      renderListTransformerPanelInteg(buildBooksIndex(book1, book2), {
        rowEntityUuid: entityBook.uuid,
      });
      await setPanelElementTransformerType("ifThenElse");

      // The `if` condition receives the row, like its parent.
      const options = await getPanelTransformerTypeOptions("elementTransformer.if.transformerType");

      expect(options).toContain("getObjectValues");
      expect(options).not.toContain("aggregate");
    });
  });
});
