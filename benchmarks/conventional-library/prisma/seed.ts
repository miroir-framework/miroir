// Loads the Library data (packages/miroir-example-library/assets/library_data) with the same uuids.
// Run by `npx prisma migrate reset --force` and `npx prisma db seed`.
// LIBRARY_DATA_DIR overrides the data folder (needed when the app is copied outside the repository).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../lib/db";

const ENTITY = {
  Country: "d3139a6d-0486-4ec8-bded-2a83a3c3cee4",
  Author: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
  Publisher: "a027c379-8468-43a5-ba4d-bf618be25cab",
  Book: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  User: "ca794e28-b2dc-45b3-8137-00151557eea8",
  LendingHistoryItem: "e81078f3-2de7-4301-bd79-d3a156aec149",
} as const;

type Instance = Record<string, unknown>;

const dataDir = path.resolve(
  process.cwd(),
  process.env.LIBRARY_DATA_DIR ?? "../../packages/miroir-example-library/assets/library_data",
);

function instances(entityUuid: string): Instance[] {
  const dir = path.join(dataDir, entityUuid);
  if (!existsSync(dir)) {
    throw new Error(`Library data folder not found: ${dir} (set LIBRARY_DATA_DIR)`);
  }
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => JSON.parse(readFileSync(path.join(dir, file), "utf8")) as Instance);
}

const str = (value: unknown): string => String(value);
const optStr = (value: unknown): string | null => (typeof value === "string" ? value : null);
const optNum = (value: unknown): number | null => (typeof value === "number" ? value : null);
const optDate = (value: unknown): Date | null => (typeof value === "string" && value ? new Date(value) : null);

async function main(): Promise<void> {
  // Children first, so the seed can run on a database that already holds data.
  await prisma.lendingHistoryItem.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
  await prisma.publisher.deleteMany();
  await prisma.author.deleteMany();
  await prisma.country.deleteMany();

  const countries = await prisma.country.createMany({
    data: instances(ENTITY.Country).map((i) => ({
      uuid: str(i.uuid),
      name: str(i.name),
      iso3166_1Alpha2: optStr(i["iso3166-1Alpha-2"]),
      icon: optStr(i.icon),
    })),
  });
  const authors = await prisma.author.createMany({
    data: instances(ENTITY.Author).map((i) => ({
      uuid: str(i.uuid),
      name: str(i.name),
      language: optStr(i.language),
      birthDate: optDate(i.birthDate),
      deathDate: optDate(i.deathDate),
      country: optStr(i.country),
      icon: optStr(i.icon),
      icons: optNum(i.icons),
    })),
  });
  const publishers = await prisma.publisher.createMany({
    data: instances(ENTITY.Publisher).map((i) => ({
      uuid: str(i.uuid),
      name: str(i.name),
      country: optStr(i.country),
      icon: optStr(i.icon),
    })),
  });
  const books = await prisma.book.createMany({
    data: instances(ENTITY.Book).map((i) => ({
      uuid: str(i.uuid),
      name: str(i.name),
      year: optNum(i.year),
      author: str(i.author),
      publisher: str(i.publisher),
    })),
  });
  const users = await prisma.user.createMany({
    data: instances(ENTITY.User).map((i) => ({
      uuid: str(i.uuid),
      name: str(i.name),
      firstName: str(i.firstName),
      lastName: str(i.lastName),
      street: str(i.street),
      postalCode: str(i.postalCode),
      city: str(i.city),
      state: str(i.state),
      country: optStr(i.country),
    })),
  });
  const loans = await prisma.lendingHistoryItem.createMany({
    data: instances(ENTITY.LendingHistoryItem).map((i) => ({
      uuid: str(i.uuid),
      user: str(i.user),
      book: str(i.book),
      startDate: new Date(str(i.startDate)),
      endDate: optDate(i.endDate),
      note: optStr(i.note),
    })),
  });

  console.log(
    `Seeded ${countries.count} Countries, ${authors.count} Authors, ${publishers.count} Publishers, ` +
      `${books.count} Books, ${users.count} Users, ${loans.count} LendingHistoryItems from ${dataDir}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
