import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MCAT Prep',
  description: 'Private MCAT study guide with an AI study counselor.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
