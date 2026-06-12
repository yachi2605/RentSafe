import './globals.css';
import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RentSafe — Renter-first housing platform',
  description: 'Analyze leases, detect scams, understand rights, and find renter roommates.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F1B2D',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-brand-navy text-white">
        <Navbar />
        <main className="mx-auto min-h-[calc(100vh-160px)] max-w-6xl px-6 py-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
