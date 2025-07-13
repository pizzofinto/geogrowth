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

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  requiredRoles: string[];
  items?: NavItem[];
};

const allNavItems: NavItem[] = [
  { 
    label: 'Dashboard', 
    href: '/dashboard', 
    icon: Home, 
    requiredRoles: ['Super User', 'Supplier Quality', 'Engineering', 'External User'] 
  },
  { 
    label: 'Components', 
    href: '/components', 
    icon: Package, 
    requiredRoles: ['Super User', 'Supplier Quality', 'Engineering', 'External User'] 
  },
  { 
    label: 'Admin Panel', 
    href: '#',
    icon: Users, 
    requiredRoles: ['Super User'],
    items: [
        { label: 'Users', href: '/admin/users', icon: Users, requiredRoles: ['Super User'] },
        { label: 'Roles', href: '/admin/roles', icon: Users, requiredRoles: ['Super User'] },
    ]
  },
  { 
    label: 'Analytics', 
    href: '/analytics', 
    icon: LineChart, 
    requiredRoles: ['Super User', 'Supplier Quality'] 
  },
];

export function NavMain() {
  const pathname = usePathname();
  const { roles, isLoading } = useAuth();
  const { isCollapsed } = useSidebar();

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
                    <SidebarMenuItem key={item.label}>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Link
                                  href={item.items?.[0]?.href ?? item.href}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                                >
                                  {/* CORREZIONE: Dimensione icona uniformata a h-4 w-4 */}
                                  <item.icon className="h-4 w-4" />
                                  <span className="sr-only">{item.label}</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">{item.label}</TooltipContent>
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
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {navItems.map((item) =>
          item.items ? (
            <Collapsible
              key={item.label}
              defaultOpen={item.items.some(sub => pathname.startsWith(sub.href))}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.label} href="#">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items
                      .filter(subItem => subItem.requiredRoles.some(role => roles.includes(role)))
                      .map((subItem) => (
                      <SidebarMenuSubItem key={subItem.label}>
                        <SidebarMenuSubButton href={subItem.href}>
                          <span>{subItem.label}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
             <SidebarMenuItem key={item.label}>
                <SidebarMenuButton tooltip={item.label} href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                </SidebarMenuButton>
             </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}