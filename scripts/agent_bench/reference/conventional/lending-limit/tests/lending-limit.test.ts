import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../lib/db";
import type { LoanJson } from "../lib/loans";
import { POST } from "../app/api/loans/route";

const PIERRE_MARTIN_HOLDING_8 = "054518f7-f626-4e76-8633-6b6ece7dcfc3";
const UBIK = "03ffcae1-b83f-4970-b3d9-04780d3d0780";

function lend(user: string): Promise<Response> {
  return POST(
    new Request("http://localhost/api/loans", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user, book: UBIK, startDate: "2026-08-01" }),
    }),
  );
}

describe("POST /api/loans lending limit", () => {
  const created: string[] = [];

  afterAll(async () => {
    await prisma.lendingHistoryItem.deleteMany({ where: { uuid: { in: created } } });
    await prisma.$disconnect();
  });

  it("refuses a ninth Book with 409 and creates no loan", async () => {
    const before = await prisma.lendingHistoryItem.count({ where: { user: PIERRE_MARTIN_HOLDING_8 } });
    const response = await lend(PIERRE_MARTIN_HOLDING_8);
    expect(response.status).toBe(409);
    expect(await prisma.lendingHistoryItem.count({ where: { user: PIERRE_MARTIN_HOLDING_8 } })).toBe(before);
  });

  it("lends to a User below the limit", async () => {
    const marieMartin = await prisma.user.findFirstOrThrow({ where: { name: "Marie Martin" } });
    const response = await lend(marieMartin.uuid);
    expect(response.status).toBe(201);
    created.push(((await response.json()) as LoanJson).uuid);
  });
});
