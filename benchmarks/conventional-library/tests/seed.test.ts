import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../lib/db";

// Needs a seeded database: npx prisma migrate reset --force
describe("seed", () => {
  afterAll(() => prisma.$disconnect());

  it("loads the Library data with its uuids", async () => {
    expect(await prisma.book.count()).toBe(48);
    expect(await prisma.lendingHistoryItem.count()).toBe(60);
    expect(await prisma.user.count()).toBe(5);
    expect(await prisma.author.count()).toBe(18);
    expect(await prisma.publisher.count()).toBe(10);
    expect(await prisma.country.count()).toBe(7);

    const ubik = await prisma.book.findUnique({ where: { uuid: "03ffcae1-b83f-4970-b3d9-04780d3d0780" } });
    expect(ubik?.name).toBe("Ubik");
  });
});
