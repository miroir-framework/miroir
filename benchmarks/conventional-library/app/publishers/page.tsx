import { prisma } from "../../lib/db";
import { DataTable } from "../data-table";

export const dynamic = "force-dynamic";

export default async function PublishersPage() {
  const publishers = await prisma.publisher.findMany({ include: { countryRecord: true }, orderBy: { name: "asc" } });
  return (
    <main>
      <h1>Publishers ({publishers.length})</h1>
      <DataTable
        headers={["Name", "Country", "uuid"]}
        rows={publishers.map((p) => [p.name, p.countryRecord?.name ?? "", p.uuid])}
      />
    </main>
  );
}
