'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Definiamo un tipo più ricco per il nostro utente, che includa il nome completo
// preso dalla nostra tabella 'users'
export interface UserProfile extends User {
  full_name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  roles: string[];
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const authUser = session?.user ?? null;

      if (authUser) {
        // 1. Se l'utente è loggato, recuperiamo il suo profilo dalla tabella 'users'
        const { data: profile } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', authUser.id)
          .single();

        // 2. Recuperiamo i ruoli come prima
        const { data: rolesData } = await supabase
          .from('user_role_assignments')
          .select('user_roles(role_name)')
          .eq('user_id', authUser.id);
        
        const userRoles = rolesData?.map((item) => item.user_roles.role_name) ?? [];
        
        // 3. Creiamo un oggetto utente "arricchito" con il nome completo
        const userWithProfile: UserProfile = {
          ...authUser,
          full_name: profile?.full_name,
        };

        setUser(userWithProfile);
        setRoles(userRoles);

      } else {
        setUser(null);
        setRoles([]);
      }
      setIsLoading(false);
    });

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}