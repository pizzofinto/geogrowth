'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';

// 1. Definita l'icona SVG personalizzata di GeoGrowth
const GeoGrowthIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
  </svg>
);

// 2. Il componente AppLogo ora usa la nuova icona
function AppLogo() {
  const { isCollapsed } = useSidebar();
  return (
    <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
      <GeoGrowthIcon />
      {!isCollapsed && <span>GeoGrowth Inc.</span>}
    </Link>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
