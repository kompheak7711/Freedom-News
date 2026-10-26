import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Freedom News — see every side of the news",
  description: "World news grouped by story, with coverage split by left, center, and right outlets.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="border-b border-[var(--border)] bg-[var(--card)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Freedom<span className="text-[var(--left)]">News</span>
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">Top stories</Link>
              <Link href="/?view=blindspot" className="hover:underline">Blindspots</Link>
              <Link href="/sources" className="hover:underline">Sources</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
