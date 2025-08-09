import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  // Lista di tutte le locali supportate
  locales,
  
  // Locale di default
  defaultLocale,
  
  // Usa sempre il prefisso locale nell'URL
  localePrefix: 'always'
});

export const config = {
  // Abbina tutti i percorsi tranne i file statici
  matcher: [
    // Abilita un reindirizzamento a una locale corrispondente alla radice
    '/',
    
    // Abbina tutti i percorsi internazionalizzati
    '/(it|en)/:path*'
  ]
};