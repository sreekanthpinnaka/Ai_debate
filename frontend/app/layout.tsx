import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:5173'),
  title: 'AI Debate Simulator',
  description:
    'Watch two AI advocates debate a proposition and receive a structured, impartial verdict.',
  openGraph: {
    title: 'AI Debate Simulator',
    description: 'Two advocates. One impartial judge.',
    images: [{ url: '/og.png', width: 1733, height: 907, alt: 'AI Debate Simulator debate chamber' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Debate Simulator',
    description: 'Two advocates. One impartial judge.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
