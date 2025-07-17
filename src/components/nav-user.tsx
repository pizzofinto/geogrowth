'use client';

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Settings,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Skeleton } from './ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function NavUser() {
  const { isMobile, isCollapsed } = useSidebar();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Usa un reindirizzamento completo per garantire la pulizia dello stato.
    // Questa è la soluzione più robusta per evitare problemi di sincronizzazione.
    window.location.assign('/');
  };

  if (isLoading) {
    return (
        <div className="flex items-center gap-3 p-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            {!isCollapsed && (
                <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-32" />
                </div>
            )}
        </div>
    );
  }

  if (!user) return null;

  const displayName = user.full_name || user.email;
  const fallbackLetters = (displayName || '..').substring(0, 2).toUpperCase();
  
  // Logica per la modalità compressa
  if (isCollapsed) {
    return (
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="h-auto justify-center rounded-lg p-2"
                  href="#"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar_url} alt={displayName} />
                    <AvatarFallback className="rounded-lg">{fallbackLetters.substring(0,1)}</AvatarFallback>
                  </Avatar>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" align="start">
              <div className="flex flex-col items-start text-left">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent
            className="w-56 rounded-lg"
            side="right"
            align="start"
            sideOffset={12}
          >
          <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar_url} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{fallbackLetters}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck className="mr-2 h-4 w-4" />
                <span>Account</span>
              </DropdownMenuItem>
              {/*
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </DropdownMenuItem>
              */}
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Logica per la modalità espansa
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
              href="#"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar_url} alt={displayName} />
                <AvatarFallback className="rounded-lg">{fallbackLetters}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar_url} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{fallbackLetters}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck className="mr-2 h-4 w-4" />
                <span>Account</span>
              </DropdownMenuItem>
              {/*
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </DropdownMenuItem>
              */}
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}