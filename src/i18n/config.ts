import { getRequestConfig } from 'next-intl/server';

// Definisci le lingue supportate
export const locales = ['en', 'it'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // Valida che la locale sia supportata, fallback a defaultLocale
  const validLocale = locales.includes(locale as Locale) 
    ? (locale as Locale) 
    : defaultLocale;

  return {
    locale: validLocale, // ← QUESTA PROPRIETÀ È NECESSARIA!
    messages: (await import(`./messages/${validLocale}.json`)).default,
    timeZone: 'Europe/Rome',
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        },
        medium: {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }
      },
      number: {
        precise: {
          maximumFractionDigits: 3
        }
      }
    }
  };
});