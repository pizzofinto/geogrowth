'use client'; // Questo layout ora gestisce uno stato, quindi deve essere un Client Component

import * as React from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { AuthProvider } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Aggiungiamo lo stato per gestire la sidebar
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <AuthProvider>
      {/* 2. Applichiamo le classi dinamicamente in base allo stato */}
      <div
        className={cn(
          'grid min-h-screen w-full transition-[grid-template-columns]',
          isCollapsed
            ? 'md:grid-cols-[56px_1fr]'
            : 'md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]'
        )}
      >
        {/* 3. Passiamo lo stato e la funzione ai componenti figli */}
        <Sidebar isCollapsed={isCollapsed} />
        <div className="flex flex-col overflow-hidden">
          <Header toggleSidebar={toggleSidebar} isCollapsed={isCollapsed} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
// Questo file definisce il layout principale dell'applicazione, che include un sidebar e un header.
// Il layout utilizza il contesto di autenticazione per fornire informazioni sull'utente e
// i suoi ruoli a tutti i componenti figli. Il layout è responsabile della struttura
// della pagina, gestendo la disposizione del sidebar e dell'header, e applicando stili dinamici
// in base allo stato della sidebar (espansa o compressa).