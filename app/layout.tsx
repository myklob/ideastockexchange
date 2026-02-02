import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Idea Stock Exchange - One Page Per Topic',
  description: 'The Architecture of Reason: Organizing beliefs in three simultaneous dimensions',
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "wikiLaw - The Operating System for Law",
  description: "Debug legislation. Test assumptions. Propose upgrades. wikiLaw makes the legal code auditable.",
  keywords: ["law", "legislation", "policy", "evidence", "reform", "government", "transparency"],
  title: "Idea Stock Exchange - Book Analysis System",
  description: "Combat Reports for Ideas - Systematic book analysis with transparent scoring",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="bg-blue-900 text-white py-6 shadow-lg">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold">Idea Stock Exchange</h1>
            <p className="text-blue-200 mt-2">
              The Architecture of Reason: One Page Per Topic
            </p>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">{children}</main>
        <footer className="bg-gray-800 text-white py-6 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p>
              Ready to help build it?{' '}
              <a href="mailto:contact@example.com" className="text-blue-400 hover:underline">
                Contact me
              </a>{' '}
              to contribute.
            </p>
          </div>
        </footer>
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
