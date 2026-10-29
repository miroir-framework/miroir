import type { ReactNode } from "react";

export type Cell = ReactNode;

// A plain HTML table: one header row, then one row per item.
export function DataTable({ headers, rows }: { headers: string[]; rows: Cell[][] }) {
  return (
    <table style={{ borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} style={{ textAlign: "left", borderBottom: "1px solid #999", padding: "0.25rem 0.75rem" }}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} style={{ padding: "0.25rem 0.75rem", borderBottom: "1px solid #ddd" }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function formatDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}
