import { prisma } from "../../../../../lib/db";
import { loanToJson, parseDate } from "../../../../../lib/loans";

// POST /api/loans/<uuid>/return: the Book of that loan comes back (the Library's returnDocument).
// Body (optional): { endDate? } as an ISO date; now when absent. Answers 200 with the loan,
// 404 when no loan has that uuid, 409 when it was already returned, 400 on an invalid endDate.
export async function POST(request: Request, { params }: { params: Promise<{ uuid: string }> }): Promise<Response> {
  const { uuid } = await params;

  let body: Record<string, unknown> = {};
  const text = await request.text();
  if (text.trim() !== "") {
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return Response.json({ error: "body must be JSON" }, { status: 400 });
    }
  }
  let endDate = new Date();
  if (body?.endDate !== undefined && body?.endDate !== null) {
    const given = parseDate(body.endDate);
    if (!given) return Response.json({ error: "endDate must be an ISO date" }, { status: 400 });
    endDate = given;
  }

  const loan = await prisma.lendingHistoryItem.findUnique({ where: { uuid } });
  if (!loan) return Response.json({ error: `unknown loan ${uuid}` }, { status: 404 });
  if (loan.endDate) return Response.json({ error: `loan ${uuid} was already returned` }, { status: 409 });

  const returned = await prisma.lendingHistoryItem.update({ where: { uuid }, data: { endDate } });
  return Response.json(loanToJson(returned));
}
