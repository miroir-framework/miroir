import { prisma } from "../../../lib/db";
import { parseDate } from "../../../lib/loans";
import { DataTable, formatDate } from "../../data-table";

export const dynamic = "force-dynamic";

// The overdue loans per User, for the cutoff ?startedBefore=<ISO date> (today when absent).
export default async function OverdueLoansPage({ searchParams }: { searchParams: Promise<{ startedBefore?: string }> }) {
  const startedBefore = parseDate((await searchParams).startedBefore) ?? new Date();
  const loans = await prisma.lendingHistoryItem.findMany({
    where: { endDate: null, startDate: { lt: startedBefore } },
    include: { userRecord: true, bookRecord: true },
    orderBy: [{ startDate: "asc" }],
  });
  const perUser = new Map<string, typeof loans>();
  for (const loan of loans) {
    perUser.set(loan.userRecord.name, [...(perUser.get(loan.userRecord.name) ?? []), loan]);
  }
  return (
    <main>
      <h1>Overdue loans started before {formatDate(startedBefore)} ({loans.length})</h1>
      {[...perUser.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([user, userLoans]) => (
          <section key={user}>
            <h2>{user}</h2>
            <DataTable headers={["Book", "Start"]} rows={userLoans.map((l) => [l.bookRecord.name, formatDate(l.startDate)])} />
          </section>
        ))}
    </main>
  );
}
