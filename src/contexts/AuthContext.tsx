'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Definiamo un tipo più ricco per il nostro utente, che includa il nome completo E la lingua preferita
export interface UserProfile extends User {
  full_name?: string;
  avatar_url?: string;
  preferred_language?: 'en' | 'it'; // ← AGGIUNTO!
}

interface AuthContextType {
  user: UserProfile | null;
  roles: string[];
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // const [isProcessing, setIsProcessing] = useState(false); // Using ref instead

  // Use useRef to prevent dependency loops and track processing state
  const isProcessingRef = useRef(false);

  const processAuthUser = useCallback(async (authUser: User | null) => {
    // Prevent concurrent processing using ref instead of state
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    if (authUser) {
      try {
        // 1. Recuperiamo il profilo dalla tabella 'users' (INCLUSA LA LINGUA!)
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('full_name, preferred_language') // ← AGGIUNTO preferred_language!
          .eq('id', authUser.id)
          .single();

        if (profileError) {
          console.warn('Errore recupero profilo:', profileError);
        }

        // 2. Recuperiamo i ruoli
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_role_assignments')
          .select('user_roles(role_name)')
          .eq('user_id', authUser.id);
        
        if (rolesError) {
          console.error('Errore recupero ruoli:', rolesError);
        }

        // 3. Mappiamo i ruoli in modo sicuro
        const userRoles: string[] = [];
        if (rolesData && Array.isArray(rolesData)) {
          rolesData.forEach((item: { user_roles?: { role_name: string } }) => {
            if (item?.user_roles?.role_name) {
              userRoles.push(item.user_roles.role_name);
            }
          });
        }

        console.log('🔍 Ruoli utente:', userRoles);
        console.log('🔍 Lingua preferita:', profile?.preferred_language); // ← AGGIUNTO LOG!
        
        // ✅ FIXED: Get localStorage value outside of useCallback to prevent instability
        const localStorageLanguage = typeof window !== 'undefined' 
          ? (localStorage.getItem('preferred-language') as 'en' | 'it') 
          : null;
        
        // 4. Creiamo l'oggetto utente arricchito (CON LA LINGUA!)
        const userWithProfile: UserProfile = {
          ...authUser,
          full_name: profile?.full_name,
          // Fallback chain: DB preference → localStorage → 'en'
          preferred_language: profile?.preferred_language || 
                             localStorageLanguage || 
                             'en',
        };

        setUser(userWithProfile);
        setRoles(userRoles);

      } catch (error) {
        console.error('Errore durante il setup auth:', error);
        // ✅ FIXED: Get localStorage value outside of useCallback to prevent instability
        const localStorageLanguage = typeof window !== 'undefined' 
          ? (localStorage.getItem('preferred-language') as 'en' | 'it') 
          : null;
        
        // Anche nel fallback, includiamo la lingua di default con chain completa
        setUser({
          ...authUser,
          preferred_language: localStorageLanguage || 'en' // ← AGGIUNTO fallback chain!
        } as UserProfile);
        setRoles([]);
      }
    } else {
      console.log('🔍 Nessun utente autenticato');
      setUser(null);
      setRoles([]);
    }
    
    setIsLoading(false);
    isProcessingRef.current = false;
  }, []); // ✅ FIXED: Still empty deps but localStorage access is now stable

  useEffect(() => {
    let isMounted = true;
    
    // Get initial session first to avoid race condition
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
          if (isMounted) setIsLoading(false);
          return;
        }
        
        // Process initial session only if component is still mounted
        if (isMounted) {
          await processAuthUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error during initial session setup:', error);
        if (isMounted) setIsLoading(false);
      }
    };

    // Get initial session on mount
    getInitialSession();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 Auth state change:', event, !!session?.user);
      
      const authUser = session?.user ?? null;
      // Only process if component is still mounted
      if (isMounted) {
        await processAuthUser(authUser);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []); // Remove processAuthUser dependency to prevent loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // processAuthUser intentionally not included to prevent infinite loops

  // ✅ FIXED: Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    roles,
    isLoading,
  }), [user, roles, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}