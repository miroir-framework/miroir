import Link from "next/link";

const PAGES = [
  { href: "/authors", label: "Authors" },
  { href: "/countries", label: "Countries" },
  { href: "/publishers", label: "Publishers" },
  { href: "/books", label: "Books" },
  { href: "/users", label: "Users" },
  { href: "/loans", label: "Loans (LendingHistoryItem)" },
];

export default function Home() {
  return (
    <main>
      <h1>Library</h1>
      <ul>
        {PAGES.map((page) => (
          <li key={page.href}>
            <Link href={page.href}>{page.label}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
