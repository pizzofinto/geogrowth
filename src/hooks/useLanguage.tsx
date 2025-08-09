'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Locale, locales } from '@/i18n/config';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export function useLanguage() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [isChangingLocale, setIsChangingLocale] = useState(false);

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
      const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';
      const newPath = `/${newLocale}${pathWithoutLocale}`;
      
      console.log('🚀 Navigating from', pathname, 'to', newPath);
      
      // Usa startTransition per il cambio di locale
      startTransition(() => {
        router.replace(newPath);
      });
      
    } catch (error) {
      console.error('❌ Errore nel cambio lingua:', error);
    } finally {
      setIsChangingLocale(false);
    }
  };

  return {
    locale,
    setLocale,
    isChangingLocale: isChangingLocale || isPending
  };
}