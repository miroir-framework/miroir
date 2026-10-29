import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

// The database is prisma/dev.db unless DATABASE_URL says otherwise ("file:<path>", relative to the app folder).
function databaseFile(): string {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), url.replace(/^file:/, ""));
}

function createClient(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseFile() }) });
}

// One client per process, kept across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
