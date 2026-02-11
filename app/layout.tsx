import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SplitDecision — AI Agents Debate So You Don\'t Have To',
  description:
    'Enter two options, watch 4 AI agents debate from different angles, and get a verdict. Themed panels from Shark Tank to Bar Arguments.',
  metadataBase: new URL('https://splitdecision.app'),
  openGraph: {
    title: 'SplitDecision — AI Agents Debate So You Don\'t Have To',
    description:
      'Enter two options, watch 4 AI agents debate from different angles, and get a verdict. Themed panels from Shark Tank to Bar Arguments.',
    url: 'https://splitdecision.app',
    siteName: 'SplitDecision',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SplitDecision — AI Agents Debate So You Don\'t Have To',
    description:
      'Enter two options, watch 4 AI agents debate, and get a verdict.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
