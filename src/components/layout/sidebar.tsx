import Link from 'next/link';
import { Package2 } from 'lucide-react';
import { SidebarNav } from './sidebar-nav';
import { UserNav } from './user-nav';
import { NotificationsNav } from './notifications-nav';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <Package2 className="h-6 w-6" />
            {!isCollapsed && <span>GeoGrowth Inc.</span>}
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {/* Passiamo lo stato alla navigazione */}
          <SidebarNav isCollapsed={isCollapsed} />
        </div>
        <div
          className={cn(
            'mt-auto flex flex-col gap-1 border-t p-4',
            isCollapsed && 'items-center justify-center p-2'
          )}
        >
          <NotificationsNav isCollapsed={isCollapsed} />
          <UserNav isCollapsed={isCollapsed} />
        </div>
      </div>
    </div>
  );
}
// Questo componente Sidebar include un menu di navigazione laterale e un menu utente in fondo.
// Il menu di navigazione laterale è gestito da SidebarNav, mentre il menu utente è gestito da UserNav.
// Il menu utente mostra le informazioni dell'utente e consente di accedere a impostazioni, profilo e logout.
// Il layout è responsive e si adatta a schermi di diverse dimensioni, mostrando il menu laterale solo su schermi più grandi
// e riducendo il padding quando la sidebar è collassata.