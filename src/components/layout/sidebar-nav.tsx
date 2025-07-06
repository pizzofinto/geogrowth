'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Users, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const allNavItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', requiredRoles: ['Super User', 'Supplier Quality', 'Engineering', 'External User'] },
  { href: '/components', icon: Package, label: 'Components', requiredRoles: ['Super User', 'Supplier Quality', 'Engineering', 'External User'] },
  { href: '/admin', icon: Users, label: 'Admin Panel', requiredRoles: ['Super User'] },
  { href: '/analytics', icon: LineChart, label: 'Analytics', requiredRoles: ['Super User', 'Supplier Quality'] },
];

interface SidebarNavProps {
  isCollapsed: boolean;
}

export function SidebarNav({ isCollapsed }: SidebarNavProps) {
  const pathname = usePathname();
  const { roles, isLoading } = useAuth();

  const navItems = allNavItems.filter(item => 
    item.requiredRoles.some(requiredRole => roles.includes(requiredRole))
  );

  if (isLoading) {
    return (
      <div className="grid items-start gap-2 px-4 pt-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <nav className={cn("grid gap-1 px-2", isCollapsed && "justify-center")}>
        {navItems.map((item) =>
          isCollapsed ? (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    pathname === item.href && "bg-accent text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                pathname === item.href && 'bg-muted text-primary'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        )}
      </nav>
    </TooltipProvider>
  );
}
// Questo componente SidebarNav mostra i link di navigazione in base ai ruoli dell'utente.
// Se l'utente non ha ruoli sufficienti, i link non saranno visibili.
// Durante il caricamento, mostra uno scheletro di caricamento per migliorare l'esperienza utente.
// I link sono stilizzati per essere facilmente riconoscibili e accessibili.
// Utilizza la libreria Lucide React per le icone e le classi di utilità per la stilizzazione.
// Il componente è progettato per essere utilizzato all'interno di un layout più ampio, come un sidebar di navigazione in un'applicazione Next.js.
// Il componente utilizza il contesto di autenticazione per accedere ai ruoli dell'utente e determinare quali link mostrare.
// I link sono filtrati in base ai ruoli richiesti definiti per ciascun link di navigazione.
// Se l'utente non ha i ruoli richiesti, i link corrispondenti non saranno visibili.
// Durante il caricamento, viene mostrato uno scheletro di caricamento per migliorare l'esperienza utente, evitando che il layout salti o si sposti mentre i dati vengono caricati.
// Il componente utilizza la funzione `cn` per gestire le classi CSS condizionali, rendendo il codice più leggibile e mantenibile.
// Le icone sono importate da Lucide React, una libreria di icone SVG per React, che fornisce icone di alta qualità e facilmente personalizzabili.
//// Il componente è progettato per essere facilmente estendibile, consentendo l'aggiunta di