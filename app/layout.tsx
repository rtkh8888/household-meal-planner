import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Household Meal Planner',
  description: 'Plan meals, batches, leftovers, and groceries for your household.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
