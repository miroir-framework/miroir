import type { LendingHistoryItem } from "../generated/prisma/client";

// The JSON shape of a loan in the API.
export type LoanJson = {
  uuid: string;
  user: string;
  book: string;
  startDate: string;
  endDate: string | null;
  note: string | null;
};

export function loanToJson(loan: LendingHistoryItem): LoanJson {
  return {
    uuid: loan.uuid,
    user: loan.user,
    book: loan.book,
    startDate: loan.startDate.toISOString(),
    endDate: loan.endDate ? loan.endDate.toISOString() : null,
    note: loan.note,
  };
}

// A date given as an ISO string, or null when the value is not one.
export function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
