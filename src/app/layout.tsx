import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IdeaStockExchange",
  description:
    "A prediction market for ideas. Profit from the gap between logical fundamentals and market price.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <nav className="border-b border-[var(--border)] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="text-xl font-bold tracking-tight">
              IdeaStockExchange
            </a>
            <div className="flex gap-6 text-sm">
              <a href="/" className="hover:text-white transition-colors">
                Markets
              </a>
              <a
                href="/arbitrage"
                className="hover:text-white transition-colors"
              >
                Arbitrage
              </a>
              <a
                href="/portfolio"
                className="hover:text-white transition-colors"
              >
                Portfolio
              </a>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
