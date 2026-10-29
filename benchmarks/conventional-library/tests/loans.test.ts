import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../lib/db";
import type { LoanJson } from "../lib/loans";
import { GET, POST } from "../app/api/loans/route";
import { POST as RETURN } from "../app/api/loans/[uuid]/return/route";

const JEANNE_DIELMAN = "04c371ed-702d-4dd9-a06d-8a04eda5d24f";
const UBIK = "03ffcae1-b83f-4970-b3d9-04780d3d0780";

function postJson(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/loans", () => {
  const created: string[] = [];

  afterAll(async () => {
    await prisma.lendingHistoryItem.deleteMany({ where: { uuid: { in: created } } });
    await prisma.$disconnect();
  });

  it("GET lists the loans", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const loans = (await response.json()) as LoanJson[];
    expect(loans).toHaveLength(60);
    expect(Object.keys(loans[0]).sort()).toEqual(["book", "endDate", "note", "startDate", "user", "uuid"]);
  });

  it("POST creates a loan and answers 201 with it", async () => {
    const response = await POST(
      postJson("http://localhost/api/loans", { user: JEANNE_DIELMAN, book: UBIK, startDate: "2026-08-01" }),
    );
    expect(response.status).toBe(201);
    const loan = (await response.json()) as LoanJson;
    created.push(loan.uuid);

    expect(loan.uuid).toMatch(/^[0-9a-f-]{36}$/);
    expect(loan).toMatchObject({ user: JEANNE_DIELMAN, book: UBIK, startDate: "2026-08-01T00:00:00.000Z", endDate: null });
    expect(await prisma.lendingHistoryItem.findUnique({ where: { uuid: loan.uuid } })).not.toBeNull();
  });

  it("POST answers 400 when a field is missing", async () => {
    const before = await prisma.lendingHistoryItem.count();
    const response = await POST(postJson("http://localhost/api/loans", { user: JEANNE_DIELMAN, book: UBIK }));
    expect(response.status).toBe(400);
    expect(await prisma.lendingHistoryItem.count()).toBe(before);
  });

  it("POST /api/loans/<uuid>/return sets the endDate", async () => {
    const lent = (await (
      await POST(postJson("http://localhost/api/loans", { user: JEANNE_DIELMAN, book: UBIK, startDate: "2026-08-02" }))
    ).json()) as LoanJson;
    created.push(lent.uuid);

    const url = `http://localhost/api/loans/${lent.uuid}/return`;
    const params = Promise.resolve({ uuid: lent.uuid });
    const response = await RETURN(postJson(url, { endDate: "2026-08-20" }), { params });
    expect(response.status).toBe(200);
    expect(((await response.json()) as LoanJson).endDate).toBe("2026-08-20T00:00:00.000Z");

    const again = await RETURN(postJson(url, {}), { params: Promise.resolve({ uuid: lent.uuid }) });
    expect(again.status).toBe(409);
  });
});
