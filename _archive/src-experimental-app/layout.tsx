import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Idea Stock Exchange",
  description:
    "A structured analysis platform where beliefs are scored through recursive argument trees, evidence verification, and linkage scoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="border-b border-[var(--color-border)] px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-xl font-bold no-underline">
              Idea Stock Exchange
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/">Beliefs</Link>
              <Link href="/concepts">Concepts</Link>
              <Link href="/concepts/scoring">Scoring</Link>
              <Link href="/concepts/reasonrank">ReasonRank</Link>
              <Link
                href="https://github.com/myklob/ideastockexchange"
                target="_blank"
                rel="noopener"
              >
                GitHub
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        <footer className="border-t border-[var(--color-border)] px-6 py-4 mt-12">
          <div className="max-w-6xl mx-auto text-center text-sm text-[var(--color-muted)]">
            <p>
              <Link href="/concepts/contact-me">Contact</Link>
              {" | "}
              <Link href="/concepts">All Concepts</Link>
              {" | "}
              <Link
                href="https://github.com/myklob/ideastockexchange"
                target="_blank"
                rel="noopener"
              >
                View on GitHub
              </Link>
            </p>
            <p className="mt-1">
              Together, we build humanity&apos;s knowledge infrastructure for
              better decisions.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
