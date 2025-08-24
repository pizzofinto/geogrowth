import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { locales, type Locale } from '@/i18n/config';
import { notFound } from 'next/navigation';
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// 🌍 Genera metadata dinamici basati sulla locale
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  
  return {
    title: {
      template: `%s | ${t('companyName')}`,
      default: t('companyName'),
    },
    description: t('description'),
    keywords: t('keywords'),
    authors: [{ name: t('companyName') }],
    creator: t('companyName'),
    publisher: t('companyName'),
    applicationName: t('appName'),
    openGraph: {
      title: t('appName'),
      description: t('description'),
      type: 'website',
      locale: locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('appName'),
      description: t('description'),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// Generate static params for all locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: Props) {
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // IMPORTANTE: Importa i messaggi specifici per la locale corrente
  let messages;
  try {
    messages = (await import(`@/i18n/messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
          </NextIntlClientProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}