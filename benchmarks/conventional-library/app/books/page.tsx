import { prisma } from "../../lib/db";
import { DataTable } from "../data-table";

export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const books = await prisma.book.findMany({
    include: { authorRecord: true, publisherRecord: true },
    orderBy: { name: "asc" },
  });
  return (
    <main>
      <h1>Books ({books.length})</h1>
      <DataTable
        headers={["Title", "Year", "Author", "Publisher", "uuid"]}
        rows={books.map((b) => [b.name, b.year ?? "", b.authorRecord.name, b.publisherRecord.name, b.uuid])}
      />
    </main>
  );
}
