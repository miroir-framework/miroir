import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../lib/db";
import type { LoanJson } from "../lib/loans";
import { GET } from "../app/api/loans/overdue/route";

describe("/api/loans/overdue", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns the open loans started before the cutoff", async () => {
    const response = await GET(new Request("http://localhost/api/loans/overdue?startedBefore=2026-07-02"));
    expect(response.status).toBe(200);
    const loans = (await response.json()) as LoanJson[];
    expect(loans).toHaveLength(21);
    expect(loans.every((loan) => loan.endDate === null && loan.startDate < "2026-07-02")).toBe(true);
  });

  it("answers 400 without a cutoff", async () => {
    const response = await GET(new Request("http://localhost/api/loans/overdue"));
    expect(response.status).toBe(400);
  });
});
