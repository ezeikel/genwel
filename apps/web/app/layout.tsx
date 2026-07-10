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
    default: 'Genwel | UK Budgeting App for Family Supporters & Debt Recovery',
    template: '%s | Genwel',
  },
  description:
    'UK budgeting app for people who support family financially. Track remittances, escape debt, and build wealth—starting from wherever you are today.',
  keywords: [
    'UK budgeting app',
    'budget tracker UK',
    'money management app',
    'remittance budgeting',
    'family support finances',
    'debt recovery app',
    'personal finance UK',
    'spending tracker',
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
    title: 'Genwel | UK Budgeting App for Family Supporters & Debt Recovery',
    description:
      'UK budgeting app for people who support family financially. Track remittances, escape debt, and build wealth.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Genwel | UK Budgeting App for Family Supporters & Debt Recovery',
    description:
      'UK budgeting app for people who support family financially. Track remittances, escape debt, and build wealth.',
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
