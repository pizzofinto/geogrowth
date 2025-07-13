'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Users, LineChart, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/components/ui/sidebar';

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
      <div className="grid items-start gap-1 px-2 pt-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-full rounded-lg" />
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
                    pathname.startsWith(item.href) && "bg-accent text-accent-foreground"
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
                pathname.startsWith(item.href) && 'bg-muted text-primary'
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
