import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Idea Stock Exchange - Book Analysis System",
  description: "Combat Reports for Ideas - Systematic book analysis with transparent scoring",
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
