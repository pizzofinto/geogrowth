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
import { useI18n } from '@/contexts/I18nContext';

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
  const { locale } = useI18n();
  
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

  // Funzione helper per costruire URL con locale
  const buildHref = (href: string) => {
    if (href === '#') return href;
    return `/${locale}${href}`;
  };

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
                      href={item.items?.[0]?.href ? buildHref(item.items[0].href) : buildHref(item.href)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="sr-only">{t(item.labelKey)}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="start">
                    <p>{t(item.labelKey)}</p>
                  </TooltipContent>
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
        {navItems.map((item) => {
          const isActive = pathname.includes(item.href) && item.href !== '#';
          
          return (
            <SidebarMenuItem key={item.labelKey}>
              {item.items ? (
                <Collapsible defaultOpen={isActive}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton href={buildHref(item.href)}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{t(item.labelKey)}</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform data-[state=open]:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => {
                        const isSubActive = pathname.includes(subItem.href);
                        return (
                          <SidebarMenuSubItem key={subItem.labelKey}>
                            <SidebarMenuSubButton
                              href={buildHref(subItem.href)}
                              className={cn(isSubActive && "bg-accent text-accent-foreground")}
                            >
                              <subItem.icon className="mr-2 h-3 w-3" />
                              <span>{t(subItem.labelKey)}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuButton href={''}>
                  <Link 
                    href={buildHref(item.href)}
                    className={cn(
                      isActive && "bg-accent text-accent-foreground"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}