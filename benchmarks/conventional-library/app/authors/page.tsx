import { prisma } from "../../lib/db";
import { DataTable, formatDate } from "../data-table";

export const dynamic = "force-dynamic";

export default async function AuthorsPage() {
  const authors = await prisma.author.findMany({ include: { countryRecord: true }, orderBy: { name: "asc" } });
  return (
    <main>
      <h1>Authors ({authors.length})</h1>
      <DataTable
        headers={["Name", "Language", "Birth", "Death", "Country", "uuid"]}
        rows={authors.map((a) => [
          a.name,
          a.language ?? "",
          formatDate(a.birthDate),
          formatDate(a.deathDate),
          a.countryRecord?.name ?? "",
          a.uuid,
        ])}
      />
    </main>
  );
}
