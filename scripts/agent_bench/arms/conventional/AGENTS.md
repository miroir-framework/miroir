# Working on the Library application

This folder is a Next.js application (App Router, TypeScript) with Prisma on SQLite and Vitest. It
holds the Library: Authors, Countries, Publishers, Books, Users and their loans.

## Layout

- `prisma/schema.prisma`: the data model. Models `Author`, `Country`, `Publisher`, `Book`, `User`,
  `LendingHistoryItem` (`user`, `book`, `startDate`, `endDate`, `note`). Primary keys are uuids.
- `prisma/seed.ts`: loads the Library data (`prisma/library-data/`, one JSON file per instance) into
  `prisma/dev.db`.
- `app/`: pages and API routes. `app/api/loans/route.ts` lends a Book (`POST`) and lists loans (`GET`).
- `lib/db.ts`: the Prisma client, generated in `generated/prisma`.
- `tests/`: Vitest tests.

## Commands

| What | Command |
|---|---|
| Run the tests | `npm test` |
| Type check | `npx tsc --noEmit` |
| Start the app | `npm run dev` (http://localhost:3000) |
| Apply a schema change | `npx prisma migrate dev --name <name>`, then `npx prisma generate` |
| Reset and reseed the database | `npm run db:reset` |

Dependencies are installed. Keep the existing routes working.
