import { getRequestConfig } from 'next-intl/server';

// Definisci le lingue supportate
export const locales = ['en', 'it'] as const;
export const defaultLocale = 'en' as const; // Inglese come fallback

export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // Garantisci che locale sia sempre definita
  // Se non è definita o non è supportata, usa defaultLocale
  const validLocale: string = (locale && locales.includes(locale as Locale)) 
    ? locale 
    : defaultLocale;

  try {
    const messages = (await import(`./messages/${validLocale}.json`)).default;
    
    return {
      locale: validLocale,
      messages,
      timeZone: 'Europe/Rome',
      formats: {
        dateTime: {
          short: {
            day: 'numeric' as const,
            month: 'short' as const,
            year: 'numeric' as const
          },
          medium: {
            day: 'numeric' as const,
            month: 'long' as const,
            year: 'numeric' as const
          }
        },
        number: {
          precise: {
            maximumFractionDigits: 3
          }
        }
      }
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${validLocale}`, error);
    
    // In caso di errore, carica i messaggi di default
    const fallbackMessages = (await import(`./messages/${defaultLocale}.json`)).default;
    
    return {
      locale: defaultLocale as string,
      messages: fallbackMessages,
      timeZone: 'Europe/Rome',
      formats: {
        dateTime: {
          short: {
            day: 'numeric' as const,
            month: 'short' as const,
            year: 'numeric' as const
          },
          medium: {
            day: 'numeric' as const,
            month: 'long' as const,
            year: 'numeric' as const
          }
        },
        number: {
          precise: {
            maximumFractionDigits: 3
          }
        }
      }
    };
  }
});