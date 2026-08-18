/**
 * deleteCascade reverse-FK discovery from present-model Entity schema carriers.
 */
import { describe, expect, it } from "vitest";

import { reverseForeignKeysPointingToEntity } from "../../src/miroir-fwk/4_view/scripts.js";

const authorEntity = {
  uuid: "author-uuid",
  name: "Author",
  mlSchema: {
    type: "object" as const,
    definition: {
      name: { type: "string" as const },
    },
  },
};

const bookEntity = {
  uuid: "book-uuid",
  name: "Book",
  mlSchema: {
    type: "object" as const,
    definition: {
      title: { type: "string" as const },
      authorUuid: {
        type: "uuid" as const,
        tag: { value: { foreignKeyParams: { targetEntity: "author-uuid" } } },
      },
    },
  },
};

describe("deleteCascade reverse foreign keys", () => {
  it("discovers reverse FKs from Entity-only schema carriers", () => {
    const pointing = reverseForeignKeysPointingToEntity(
      [authorEntity, bookEntity] as any,
      "author-uuid",
    );
    expect(pointing).toEqual({ "book-uuid": "authorUuid" });
  });
});
