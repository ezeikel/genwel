import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import PlausibleProvider from 'next-plausible';
import type React from 'react';
import CookieConsent from '@/components/CookieConsent';
import { OrganizationJsonLd, WebApplicationJsonLd } from '@/components/JsonLd';
import Providers from './providers';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://genwel.com'),
  title: {
    default: 'Genwel | One Clear View of Your Money',
    template: '%s | Genwel',
  },
  description:
    'The UK budgeting app that connects every bank and card, sorts your spending automatically, and shows you exactly what to fix — duplicate subscriptions, price rises, and money leaking each month.',
  keywords: [
    'UK budgeting app',
    'budget tracker UK',
    'money management app',
    'open banking app',
    'spending tracker UK',
    'subscription tracker',
    'personal finance UK',
    'account aggregation app',
  ],
  authors: [{ name: 'Genwel' }],
  creator: 'Genwel',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://genwel.com',
    siteName: 'Genwel',
    title: 'Genwel | One Clear View of Your Money',
    description:
      'Connect every bank and card, see all your spending in one place, and get smart insights that show you exactly what to fix.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Genwel | One Clear View of Your Money',
    description:
      'Connect every bank and card, see all your spending in one place, and get smart insights that show you exactly what to fix.',
    creator: '@genwelapp',
  },
  alternates: {
    canonical: 'https://genwel.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#1a5a5a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${geistMono.variable}`}>
      <head>
        <PlausibleProvider domain="genwel.com" trackOutboundLinks />
      </head>
      <body className="font-sans antialiased">
        <OrganizationJsonLd />
        <WebApplicationJsonLd />
        <Providers>{children}</Providers>
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
