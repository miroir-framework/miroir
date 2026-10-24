import { prisma } from "../../lib/db";
import { DataTable } from "../data-table";

export const dynamic = "force-dynamic";

export default async function CountriesPage() {
  const countries = await prisma.country.findMany({ orderBy: { name: "asc" } });
  return (
    <main>
      <h1>Countries ({countries.length})</h1>
      <DataTable
        headers={["Name", "Country Code", "uuid"]}
        rows={countries.map((c) => [c.name, c.iso3166_1Alpha2 ?? "", c.uuid])}
      />
    </main>
  );
}
