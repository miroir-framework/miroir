import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Library",
  description: "Authors, Countries, Publishers, Books, Users and their loans",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: "1rem 2rem" }}>
        <nav style={{ marginBottom: "1rem" }}>
          <Link href="/">Library</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
