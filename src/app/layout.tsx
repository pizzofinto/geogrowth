import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
// 🌍 Importa next-intl
import { getLocale, getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
// 🔐 Importa AuthProvider
import { AuthProvider } from '@/contexts/AuthContext';
// 🌍 Importa I18nProvider
import { I18nProvider } from '@/contexts/I18nContext';
import { Locale } from '@/i18n/config';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | GeoGrowth',
    default: 'GeoGrowth',
  },
  description: 'A component maturity tracking application.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 🌍 Ottieni locale e messaggi dal server
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 🌍 Wrappa tutto con NextIntlClientProvider */}
        <NextIntlClientProvider messages={messages}>
          {/* 🔐 Aggiungi AuthProvider qui */}
          <AuthProvider>
            {/* 🌍 Aggiungi I18nProvider qui per tutte le pagine */}
            <I18nProvider initialLocale={locale as Locale}>
              {children}
              <Toaster />
            </I18nProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}