/**
 * Column definitions built from present-model Entity mlSchema + viewAttributes.
 */
import { describe, expect, it } from "vitest";

import { getMDataGridColumnDefinitionsFromEntity } from "../../src/miroir-fwk/4_view/getColumnDefinitionsFromEntityAttributes.js";

const bookEntityShape = {
  uuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  name: "Book",
  viewAttributes: ["title", "author"],
  mlSchema: {
    type: "object" as const,
    definition: {
      title: { type: "string" as const },
      author: { type: "uuid" as const },
      isbn: { type: "string" as const },
    },
  },
};

describe("getMDataGridColumnDefinitionsFromEntity", () => {
  it("builds columns from Entity mlSchema + viewAttributes", () => {
    const cols = getMDataGridColumnDefinitionsFromEntity(
      "deployment-uuid",
      bookEntityShape.mlSchema,
      undefined,
      bookEntityShape,
    );
    expect(cols.map((c) => c.field)).toEqual(["title", "author"]);
    expect(cols.every((c) => c.headerName)).toBe(true);
  });
});
