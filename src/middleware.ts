import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale: 'en',
  // Non fare auto-detection - rispetta sempre l'URL
  localeDetection: false
});

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)']
};