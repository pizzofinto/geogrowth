'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, Package, Users, LineChart, type LucideIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type NavItem = {
  labelKey: string; // Chiave di traduzione che corrisponde ai tuoi file
  href: string;
  icon: LucideIcon;
  requiredRoles: string[];
  items?: NavItem[];
};

const allNavItems: NavItem[] = [
  { 
    labelKey: 'dashboard', // navigation.dashboard nei tuoi file
    href: '/dashboard', 
    icon: Home, 
    requiredRoles: ['Super User', 'Supplier Quality', 'Engineering', 'External User'] 
  },
  { 
    labelKey: 'components', // navigation.components nei tuoi file
    href: '/components', 
    icon: Package, 
    requiredRoles: ['Super User', 'Supplier Quality', 'Engineering', 'External User'] 
  },
  { 
    labelKey: 'admin', // navigation.admin nei tuoi file
    href: '#',
    icon: Users, 
    requiredRoles: ['Super User'],
    items: [
      { labelKey: 'users', href: '/admin/users', icon: Users, requiredRoles: ['Super User'] },
      { labelKey: 'roles', href: '/admin/roles', icon: Users, requiredRoles: ['Super User'] },
    ]
  },
  { 
    labelKey: 'analytics', // navigation.analytics nei tuoi file
    href: '/analytics', 
    icon: LineChart, 
    requiredRoles: ['Super User', 'Supplier Quality'] 
  },
];

export function NavMain() {
  const pathname = usePathname();
  const { roles, isLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  
  // Hook per traduzioni di next-intl con namespace navigation
  const t = useTranslations('navigation');

  const navItems = allNavItems.filter(item => 
    item.requiredRoles.some(requiredRole => roles.includes(requiredRole))
  );

  if (isLoading) {
    return (
      <div className="grid items-start gap-2 px-2 pt-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // Logica di rendering per la modalità compressa
  if (isCollapsed) {
    return (
      <TooltipProvider>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.labelKey}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.items?.[0]?.href ?? item.href}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                        pathname.startsWith(item.href) && item.href !== '#' && "bg-accent text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="sr-only">{t(item.labelKey)}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </TooltipProvider>
    );
  }

  // Logica di rendering per la modalità espansa
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('platform')}</SidebarGroupLabel>
      <SidebarMenu>
        {navItems.map((item) =>
          item.items ? (
            <Collapsible
              key={item.labelKey}
              defaultOpen={item.items.some(sub => pathname.startsWith(sub.href))}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip={t(item.labelKey)} 
                    href="#"
                    className={cn(
                      pathname.startsWith('/admin') && item.labelKey === 'admin' && "bg-accent text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.labelKey)}</span>
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items
                      .filter(subItem => subItem.requiredRoles.some(role => roles.includes(role)))
                      .map((subItem) => (
                        <SidebarMenuSubItem key={subItem.labelKey}>
                          <SidebarMenuSubButton 
                            href={subItem.href}
                            className={cn(
                              pathname === subItem.href && "bg-accent text-accent-foreground"
                            )}
                          >
                            <span>{t(subItem.labelKey)}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.labelKey}>
              <SidebarMenuButton 
                tooltip={t(item.labelKey)} 
                href={item.href}
                className={cn(
                  pathname.startsWith(item.href) && item.href !== '#' && "bg-accent text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{t(item.labelKey)}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}