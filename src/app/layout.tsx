import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Idea Stock Exchange - Computational Epistemology Platform",
  description: "The Architecture of Reason: AI-powered truth verification through adversarial protocol.",
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
