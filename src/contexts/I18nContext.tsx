'use client';

import { createContext, useContext, useState } from 'react';
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
  const { user } = useAuth(); // ← Ora usa AuthContext

  const setLocale = async (newLocale: Locale) => {
    console.log('🔥 setLocale chiamata con:', newLocale);
    console.log('🔥 Locale attuale:', locale);
    
    if (!locales.includes(newLocale)) {
      console.error('❌ Locale non supportata:', newLocale);
      return;
    }

    if (newLocale === locale) {
      console.log('⚠️ Stessa locale, nessun cambio necessario');
      return;
    }

    console.log('🌍 Cambio lingua da', locale, 'a', newLocale);
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
          // Continua comunque con localStorage
        } else {
          console.log('✅ Preferenza salvata nel database');
        }
      }

      // 💾 Salva sempre anche nel localStorage
      localStorage.setItem('preferred-language', newLocale);
      console.log('💾 Salvato in localStorage:', newLocale);
      
      // 🔄 Costruisci il nuovo URL
      const currentPath = window.location.pathname;
      console.log('📍 Current path:', currentPath);
      
      let pathWithoutLocale = currentPath;
      if (currentPath.match(/^\/[a-z]{2}\//)) {
        pathWithoutLocale = currentPath.substring(3);
      } else if (currentPath.match(/^\/[a-z]{2}$/)) {
        pathWithoutLocale = '/';
      }
      
      console.log('📍 Path without locale:', pathWithoutLocale);
      const newPath = `/${newLocale}${pathWithoutLocale}`;
      console.log('📍 New path:', newPath);
      
      setLocaleState(newLocale);
      console.log('🚀 Navigating to:', newPath);
      window.location.href = newPath;
      
    } catch (error) {
      console.error('❌ Errore nel cambio lingua:', error);
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