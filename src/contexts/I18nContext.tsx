'use client';

import { createContext, useContext, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Locale, locales, defaultLocale } from '@/i18n/config';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  isChangingLocale: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale = defaultLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isChangingLocale, setIsChangingLocale] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const setLocale = async (newLocale: Locale) => {
    console.log('🌍 Changing language from', locale, 'to', newLocale);
    
    if (!locales.includes(newLocale)) {
      console.error('❌ Locale non supportata:', newLocale);
      return;
    }

    if (newLocale === locale) {
      console.log('⚠️ Stessa locale, nessun cambio necessario');
      return;
    }

    setIsChangingLocale(true);
    
    try {
      // 💾 Salva nel database se l'utente è autenticato
      if (user?.id) {
        console.log('💾 Salvando preferenza lingua nel database...');
        const { error } = await supabase
          .from('users')
          .update({ preferred_language: newLocale })
          .eq('id', user.id);

        if (error) {
          console.error('❌ Errore salvataggio database:', error);
        } else {
          console.log('✅ Preferenza salvata nel database');
        }
      }

      // 💾 Salva sempre anche nel localStorage
      localStorage.setItem('preferred-language', newLocale);
      console.log('💾 Salvato in localStorage:', newLocale);
      
      // 🔄 Costruisci il nuovo URL mantenendo il path attuale
      let pathWithoutLocale = pathname;
      
      // Rimuovi la locale attuale dal path
      if (pathname.startsWith(`/${locale}`)) {
        pathWithoutLocale = pathname.substring(3) || '/';
      }
      
      const newPath = `/${newLocale}${pathWithoutLocale}`;
      console.log('🚀 Navigating from', pathname, 'to', newPath);
      
      // Aggiorna lo stato locale
      setLocaleState(newLocale);
      
      // Naviga al nuovo URL
      router.push(newPath);
      
    } catch (error) {
      console.error('❌ Errore nel cambio lingua:', error);
    } finally {
      setIsChangingLocale(false);
    }
  };

  const value = {
    locale,
    setLocale,
    isChangingLocale
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}