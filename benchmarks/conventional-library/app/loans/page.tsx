import { prisma } from "../../lib/db";
import { DataTable, formatDate } from "../data-table";

export const dynamic = "force-dynamic";

export default async function LoansPage() {
  const loans = await prisma.lendingHistoryItem.findMany({
    include: { userRecord: true, bookRecord: true },
    orderBy: [{ startDate: "asc" }, { uuid: "asc" }],
  });
  return (
    <main>
      <h1>Loans ({loans.length})</h1>
      <DataTable
        headers={["User", "Book", "Start", "End", "Note", "uuid"]}
        rows={loans.map((l) => [
          l.userRecord.name,
          l.bookRecord.name,
          formatDate(l.startDate),
          formatDate(l.endDate),
          l.note ?? "",
          l.uuid,
        ])}
      />
    </main>
  );
}
