import { prisma } from "../../lib/db";
import { DataTable } from "../data-table";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.user.findMany({ include: { countryRecord: true }, orderBy: { name: "asc" } });
  return (
    <main>
      <h1>Users ({users.length})</h1>
      <DataTable
        headers={["Name", "Street", "Postal Code", "City", "Country", "uuid"]}
        rows={users.map((u) => [u.name, u.street, u.postalCode, u.city, u.countryRecord?.name ?? "", u.uuid])}
      />
    </main>
  );
}
