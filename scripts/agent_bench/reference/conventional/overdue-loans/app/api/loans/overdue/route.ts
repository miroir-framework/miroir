import { prisma } from "../../../../lib/db";
import { loanToJson, parseDate } from "../../../../lib/loans";

// GET /api/loans/overdue?startedBefore=<ISO date>: the loans with no endDate started before the cutoff.
export async function GET(request: Request): Promise<Response> {
  const startedBefore = parseDate(new URL(request.url).searchParams.get("startedBefore"));
  if (!startedBefore) {
    return Response.json({ error: "startedBefore (ISO date) is required" }, { status: 400 });
  }
  const loans = await prisma.lendingHistoryItem.findMany({
    where: { endDate: null, startDate: { lt: startedBefore } },
    orderBy: [{ user: "asc" }, { startDate: "asc" }],
  });
  return Response.json(loans.map(loanToJson));
}
