'use client';

import { Check, ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Locale, locales } from '@/i18n/config';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
}

const languageNames: Record<Locale, string> = {
  en: 'English',
  it: 'Italiano',
};

const languageFlags: Record<Locale, string> = {
  en: '🇺🇸',
  it: '🇮🇹',
};

export function LanguageSwitcher({ 
  variant = 'ghost', 
  size = 'default',
  showText = true,
  className 
}: LanguageSwitcherProps) {
  // Simplified approach - don't use useLanguage hook which depends on auth
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const tCommon = useTranslations('common');
  const [isChangingLocale, setIsChangingLocale] = useState(false);

  const handleLanguageChange = async (newLocale: Locale) => {
    if (newLocale === locale || isChangingLocale) return;
    
    setIsChangingLocale(true);
    
    try {
      // Save to localStorage (auth-based saving will happen later when user logs in)
      localStorage.setItem('preferred-language', newLocale);
      
      // Navigate to new locale
      const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';
      const newPath = `/${newLocale}${pathWithoutLocale}`;
      
      router.replace(newPath);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsChangingLocale(false);
    }
  };

  const currentLanguage = languageNames[locale];
  const currentFlag = languageFlags[locale];

  if (size === 'icon') {
    return (
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={variant}
                  size="icon"
                  disabled={isChangingLocale}
                  className={cn('h-8 w-8', className)}
                  aria-label={tCommon('changeLanguage')}
                >
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{tCommon('language')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end" className="w-40">
          {locales.map((availableLocale) => (
            <DropdownMenuItem
              key={availableLocale}
              onClick={() => handleLanguageChange(availableLocale)}
              className="flex items-center justify-between"
              disabled={isChangingLocale}
            >
              <div className="flex items-center gap-2">
                <span className="text-base" role="img" aria-label={`${languageNames[availableLocale]} flag`}>
                  {languageFlags[availableLocale]}
                </span>
                <span>{languageNames[availableLocale]}</span>
              </div>
              {locale === availableLocale && (
                <Check className="h-4 w-4" aria-label={tCommon('currentLanguage')} />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          disabled={isChangingLocale}
          className={className}
        >
          <span className="text-base mr-2">{currentFlag}</span>
          {showText && <span>{currentLanguage}</span>}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {locales.map((availableLocale) => (
          <DropdownMenuItem
            key={availableLocale}
            onClick={() => handleLanguageChange(availableLocale)}
            className="flex items-center justify-between"
            disabled={isChangingLocale}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{languageFlags[availableLocale]}</span>
              <span>{languageNames[availableLocale]}</span>
            </div>
            {locale === availableLocale && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}