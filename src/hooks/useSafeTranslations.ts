import { useTranslations } from 'next-intl';

export function useSafeTranslations(namespace?: string) {
  const t = useTranslations(namespace);

  const safeT = (key: string, fallback?: string): string => {
    try {
      return t(key);
    } catch (error) {
      console.warn(`Missing translation: ${namespace ? `${namespace}.` : ''}${key}`);
      return fallback || key;
    }
  };

  return { t: safeT };
}