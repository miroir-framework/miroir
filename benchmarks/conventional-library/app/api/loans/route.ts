import { randomUUID } from "node:crypto";
import { prisma } from "../../../lib/db";
import { loanToJson, parseDate } from "../../../lib/loans";

// GET /api/loans: every loan (LendingHistoryItem), oldest first.
export async function GET(): Promise<Response> {
  const loans = await prisma.lendingHistoryItem.findMany({ orderBy: [{ startDate: "asc" }, { uuid: "asc" }] });
  return Response.json(loans.map(loanToJson));
}

// POST /api/loans: lends a Book to a User (the Library's lendDocument).
// Body: { user, book, startDate, note? }. Answers 201 with the new loan, 400 when a field is missing or invalid.
export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  if (body === null || typeof body !== "object") {
    return Response.json({ error: "body must be a JSON object" }, { status: 400 });
  }

  const { user, book, note } = body;
  const startDate = parseDate(body.startDate);
  if (typeof user !== "string" || !user || typeof book !== "string" || !book || !startDate) {
    return Response.json({ error: "user, book and startDate (ISO date) are required" }, { status: 400 });
  }
  if (note !== undefined && note !== null && typeof note !== "string") {
    return Response.json({ error: "note must be a string" }, { status: 400 });
  }

  const [userRow, bookRow] = await Promise.all([
    prisma.user.findUnique({ where: { uuid: user } }),
    prisma.book.findUnique({ where: { uuid: book } }),
  ]);
  if (!userRow) return Response.json({ error: `unknown user ${user}` }, { status: 400 });
  if (!bookRow) return Response.json({ error: `unknown book ${book}` }, { status: 400 });

  const loan = await prisma.lendingHistoryItem.create({
    data: { uuid: randomUUID(), user, book, startDate, note: note ?? null },
  });
  return Response.json(loanToJson(loan), { status: 201 });
}
