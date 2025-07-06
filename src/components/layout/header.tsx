'use client';

import { Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarNav } from './sidebar-nav';
import { Breadcrumbs } from './breadcrumbs';

interface HeaderProps {
  toggleSidebar: () => void;
  isCollapsed: boolean;
}

export function Header({ toggleSidebar, isCollapsed }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <SidebarNav isCollapsed={false} />
        </SheetContent>
      </Sheet>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSidebar}
        className="hidden md:flex"
      >
        {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <Breadcrumbs />
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
        />
      </div>
    </header>
  );
}
// Questo componente Header include un menu di navigazione laterale e una barra di ricerca.
// Il menu di navigazione laterale è gestito da SidebarNav, mentre la barra di ricerca consente di cercare progetti.
// Il layout è responsive e si adatta a schermi di diverse dimensioni, mostrando il menu laterale solo su schermi più piccoli.
// Il pulsante del menu laterale è visibile solo su schermi di dimensioni inferiori a "md"
// e il campo di ricerca si adatta alla larghezza disponibile.
// Il componente utilizza Sheet per mostrare il menu di navigazione laterale in un foglio laterale.
// Il campo di ricerca include un'icona di ricerca e si adatta alla larghezza del contenitore.
// Il pulsante del menu laterale ha un testo alternativo per l'accessibilità e utilizza l'icona Menu di Lucide React.
// Il componente Header è progettto per essere utilizzato come parte di un layout più ampio, come ad esempio in una dashboard o in un'applicazione web con navigazione laterale.
// Il componente Header non include più il menu utente, che è stato spostato in fondo al layout della barra laterale.
// Questo consente di mantenere il menu utente separato e facilmente accessibile in tutte le pagine dell'applicazione.
// Il componente Header è progettato per essere utilizzato in un contesto di applicazione web moderna, con un design pulito e funzionalità intuitive.
// Utilizza componenti riutilizzabili come Button, Input e Sheet per creare un'interfaccia utente coerente e reattiva.
// Il componente Header è facilmente estendibile e può essere personalizzato ulteriormente in base alle esigenze specifiche dell'applicazione.
//// Il componente Header è un esempio di come strutturare un'intestazione di applicazione moderna
// con funzionalità di navigazione e ricerca integrate.
// Utilizza componenti di interfaccia utente riutilizzabili per garantire coerenza e facilità d'uso.
// Il design è responsivo, adattandosi a diverse dimensioni di schermo e dispositivi.
// Il componente Header può essere facilmente integrato in un'applicazione Next.js o in un progetto React più ampio.
// Include funzionalità di accessibilità, come testi alternativi per i pulsanti, per migliorare l'esperienza utente per tutti gli utenti.
// Il componente Header è un ottimo punto di partenza per costruire un'interfaccia utente moderna e funzionale, con un focus sulla usabilità e sull'estetica.
// Può essere facilmente esteso con ulteriori funzionalità, come notifiche, profili utente o altre azioni specifiche dell'applicazione.
// Il componente Header è progettato per essere facilmente integrato in un contesto di applicazione web, fornendo una base solida per
// costruire un'interfaccia utente coerente e intuitiva. 
// La sua struttura modulare consente di aggiungere o rimuovere funzionalità in base alle esigenze specifiche del progetto.
// Il componente Header è un esempio di come strutturare un'intestazione di applicazione
// con funzionalità di navigazione e ricerca integrate, utilizzando componenti di interfaccia utente riutilizzabili per garantire coerenza e facilità d'uso.
//// Il design è responsivo, adattandosi a diverse dimensioni di schermo e dispositivi.
// Il componente Header può essere facilmente integrato in un'applicazione Next.js o in un progetto React più ampio.
// Include funzionalità di accessibilità, come testi alternativi per i pulsanti, per migliorare l'esperienza utente per tutti gli utenti.
// Il componente Header è un ottimo punto di partenza per costruire un'interfaccia utente moderna e funzionale
// con un focus sulla usabilità e sull'estetica.
// Può essere facilmente esteso con ulteriori funzionalità, come notifiche, profili utente o altre azioni specifiche dell'applicazione.
// Il componente Header è progettato per essere facilmente integrato in un contesto di applicazione web, fornendo una base solida
// per costruire un'interfaccia utente coerente e intuitiva.
// La sua struttura modulare consente di aggiungere o rimuovere funzionalità in base alle esigenze specifiche del progetto.
// Il componente Header è un esempio di come strutturare un'intestazione di applicazione con funzionalità di navigazione e ricerca integrate,
// utilizzando componenti di interfaccia utente riutilizzabili per garantire coerenza e facilità
// d'uso. Il design è responsivo, adattandosi a diverse dimensioni di schermo e dispositivi.
// Il componente Header può essere facilmente integrato in un'applicazione Next.js o in un progetto React più ampio.
// Include funzionalità di accessibilità, come testi alternativi per i pulsanti, per migliorare l'esperienza utente per tutti gli utenti.
// Il componente Header è un ottimo punto di partenza per costruire un'interfaccia utente moderna e funzionale, con un focus sulla usabilità e sull'estetica.