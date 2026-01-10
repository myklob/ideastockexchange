import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "wikiLaw - The Operating System for Law",
  description: "Debug legislation. Test assumptions. Propose upgrades. wikiLaw makes the legal code auditable.",
  keywords: ["law", "legislation", "policy", "evidence", "reform", "government", "transparency"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
