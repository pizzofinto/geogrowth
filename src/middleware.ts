import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  // ABILITA la detection automatica della lingua del browser
  localeDetection: true,
  // Always show locale in URL
  localePrefix: 'always'
});

export const config = {
  // Matcher per tutte le route tranne quelle che iniziano con:
  // - _next (Next.js internals)
  // - _vercel (Vercel internals)
  // - api (API routes)
  // - file statici (immagini, font, etc.)
  matcher: [
    '/',
    '/(it|en)/:path*',
    '/((?!_next|_vercel|.*\\..*).*)'
  ]
};