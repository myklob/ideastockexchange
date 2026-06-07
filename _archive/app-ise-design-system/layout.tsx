import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Idea Stock Exchange',
  description: 'Computational Epistemology Platform — where arguments are scored, not just shouted.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
