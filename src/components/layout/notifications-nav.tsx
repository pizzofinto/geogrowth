'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NotificationsNavProps {
  isCollapsed: boolean;
}

export function NotificationsNav({ isCollapsed }: NotificationsNavProps) {
  // In futuro, recupereremo le notifiche reali da Supabase
  const notificationCount = 5;

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <DropdownMenu>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-lg">
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full p-0">
                      {notificationCount}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">Notifications</TooltipContent>
            <DropdownMenuContent className="w-80" align="end">
              {/* Il contenuto del menu rimane lo stesso */}
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>New component assigned</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 px-2">
          <Bell className="h-5 w-5" />
          <span>Notifications</span>
          {notificationCount > 0 && (
            <Badge className="ml-auto">{notificationCount}</Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium leading-none">Notifications</p>
            <Badge variant="secondary">{notificationCount} New</Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <div className="flex flex-col">
            <p className="text-sm font-semibold">Action Plan Due</p>
            <p className="text-xs text-muted-foreground">
              Component XYZ-123 is due tomorrow.
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <div className="flex flex-col">
            <p className="text-sm font-semibold">Status Change: KO</p>
            <p className="text-xs text-muted-foreground">
              Component ABC-456 has been marked as KO.
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-sm text-muted-foreground">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
// Questo componente NotificationsNav mostra un'icona di notifica con un badge per il conteggio delle notifiche.
// Quando la sidebar è collassata, mostra solo l'icona con un badge,
// altrimenti mostra un menu a discesa con le notifiche.
// Il menu a discesa include un titolo, un conteggio delle notifiche e un elenco di notifiche.
// Le notifiche sono stilizzate per essere facilmente leggibili e accessibili.
// Il componente utilizza le classi di utilità per la stilizzazione e le icone di Lucide React per le icone.
// Il badge delle notifiche è posizionato in alto a destra dell'icona per indicare il numero di notifiche non lette.
// Il menu a discesa include un titolo e un separatore per migliorare la leggibilità.
// Il componente è progettato per essere utilizzato all'interno di un layout più ampio, come un sidebar di navigazione in un'applicazione Next.js.
// Il componente è responsabile della visualizzazione delle notifiche dell'utente in modo chiaro e accessibile,
// consentendo all'utente di visualizzare le notifiche in modo semplice e intuitivo.
// Il componente è progettato per essere facilmente estendibile in futuro per includere funzionalità come la visualizzazione di notifiche in tempo reale
// o l'integrazione con un sistema di backend per la gestione delle notifiche.