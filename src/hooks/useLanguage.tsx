'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition, useContext, useRef } from 'react';
import { Locale, locales } from '@/i18n/config';
import { supabase } from '@/lib/supabaseClient';
import { AuthContext } from '@/contexts/AuthContext';

export function useLanguage() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  // Use useContext directly to avoid throwing error when context is not ready
  const authContext = useContext(AuthContext);
  const [isPending, startTransition] = useTransition();
  const [isChangingLocale, setIsChangingLocale] = useState(false);
  
  // Track ongoing language changes to prevent loops
  const isChangingRef = useRef(false);
  const lastLocaleChangeRef = useRef<string>('');

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

    // Prevent rapid successive changes and loops
    if (isChangingRef.current || lastLocaleChangeRef.current === newLocale) {
      console.log('⚠️ Language change already in progress or same locale recently changed');
      return;
    }

    isChangingRef.current = true;
    lastLocaleChangeRef.current = newLocale;
    setIsChangingLocale(true);
    
    try {
      // 💾 Salva nel database se l'utente è autenticato e il context è pronto
      if (authContext?.user?.id && !authContext?.isLoading) {
        console.log('💾 Salvando preferenza lingua nel database...');
        const { error } = await supabase
          .from('users')
          .update({ preferred_language: newLocale })
          .eq('id', authContext.user.id);

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
      const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';
      const newPath = `/${newLocale}${pathWithoutLocale}`;
      
      console.log('🚀 Navigating from', pathname, 'to', newPath);
      
      // Add delay to prevent rapid navigation and allow for proper cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Usa startTransition per il cambio di locale
      startTransition(() => {
        router.replace(newPath);
      });
      
    } catch (error) {
      console.error('❌ Errore nel cambio lingua:', error);
    } finally {
      // Reset flags after a delay to allow navigation to complete
      setTimeout(() => {
        setIsChangingLocale(false);
        isChangingRef.current = false;
        // Clear last locale change after longer delay
        setTimeout(() => {
          lastLocaleChangeRef.current = '';
        }, 2000);
      }, 500);
    }
  };

  return {
    locale,
    setLocale,
    isChangingLocale: isChangingLocale || isPending
  };
}