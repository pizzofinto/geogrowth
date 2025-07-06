'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Definiamo il tipo di dati che il nostro context conterrà
interface AuthContextType {
  user: User | null;
  roles: string[];
  isLoading: boolean;
}

// Creiamo il Context con un valore di default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Creiamo il componente Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // La funzione onAuthStateChange restituisce un oggetto { data: { subscription } }
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Se l'utente è loggato, recuperiamo i suoi ruoli
          const { data, error } = await supabase
            .from('user_role_assignments')
            .select('user_roles(role_name)')
            .eq('user_id', currentUser.id);

          if (error) {
            console.error('Error fetching user roles:', error);
            setRoles([]);
          } else {
            // Estraiamo i nomi dei ruoli dall'array di oggetti
            const userRoles = data.map(item => item.user_roles.role_name);
            setRoles(userRoles);
          }
        } else {
          // Se l'utente non è loggato, svuotiamo i ruoli
          setRoles([]);
        }
        setIsLoading(false);
      }
    );

    // La funzione di pulizia ora chiama unsubscribe sull'oggetto 'subscription'
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    roles,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Creiamo un custom hook per usare facilmente il nostro context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}