import type { Metadata } from "next";
import { getTranslations, getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { I18nProvider } from '@/contexts/I18nContext';
import { locales, type Locale } from '@/i18n/config';
import { notFound } from 'next/navigation';

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

  // Ottieni i messaggi per questa locale
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <I18nProvider initialLocale={locale as Locale}>
            {children}
          </I18nProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}