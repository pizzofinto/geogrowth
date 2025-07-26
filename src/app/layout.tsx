import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from 'next-intl';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { Locale, defaultLocale } from '@/i18n/config';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata statici di base
export const metadata: Metadata = {
  title: "GeoGrowth",
  description: "Component maturity tracking application",
};

// Funzione per estrarre locale dall'URL
function getLocaleFromUrl(): Locale {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    const segments = pathname.split('/');
    const possibleLocale = segments[1];
    
    if (possibleLocale && (possibleLocale === 'en' || possibleLocale === 'it')) {
      return possibleLocale as Locale;
    }
  }
  return defaultLocale;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Per il root layout, usiamo la locale di default
  // La locale corretta verrà gestita dal layout [locale]
  const locale = defaultLocale;

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}