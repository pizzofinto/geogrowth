'use client';

import * as React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

// --- Hook per rilevare le dimensioni dello schermo ---
function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(false);

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = window.matchMedia(query);
    result.addEventListener('change', onChange);
    setValue(result.matches);

    return () => result.removeEventListener('change', onChange);
  }, [query]);

  return value;
}


// --- Context per gestire lo stato della Sidebar ---
interface SidebarContextProps {
  isCollapsed: boolean;
  isMobile: boolean;
  toggleSidebar?: () => void;
}
const SidebarContext = React.createContext<SidebarContextProps | undefined>(undefined);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider');
  return context;
}

// --- Provider per la logica della Sidebar ---
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, isMobile, toggleSidebar }}>
      <div className="group/sidebar-wrapper flex min-h-screen w-full" data-collapsible={isCollapsed ? 'icon' : 'full'}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

// --- Componente Principale Sidebar ---
const sidebarVariants = cva(
  'hidden md:flex md:flex-col border-r bg-muted/40 transition-[width] ease-in-out duration-300',
  {
    variants: { collapsible: { icon: 'w-14', full: 'w-64' } },
    defaultVariants: { collapsible: 'full' },
  }
);
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof sidebarVariants> {}
const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, collapsible, children, ...props }, ref) => {
    const { isCollapsed } = useSidebar();
    return (
      <aside ref={ref} className={cn(sidebarVariants({ collapsible: isCollapsed ? 'icon' : 'full' }), className)} {...props}>
        {children}
      </aside>
    );
  }
);
Sidebar.displayName = 'Sidebar';

// --- Componenti Interni ---
const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex h-16 shrink-0 items-center border-b px-4', className)} {...props} />
  )
);
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex-1 overflow-y-auto overflow-x-hidden py-2', className)} {...props} />
  )
);
SidebarContent.displayName = 'SidebarContent';

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-auto border-t p-2', className)} {...props} />
  )
);
SidebarFooter.displayName = 'SidebarFooter';

// --- Componenti per la Navigazione ---
const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1 p-2', className)} {...props} />
  )
);
SidebarGroup.displayName = 'SidebarGroup';

const SidebarGroupLabel = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('px-2 py-1 text-xs font-medium text-muted-foreground', className)} {...props} />
  )
);
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

const SidebarMenu = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col', className)} {...props} />
  )
);
SidebarMenu.displayName = 'SidebarMenu';

const SidebarMenuItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('w-full', className)} {...props} />
  )
);
SidebarMenuItem.displayName = 'SidebarMenuItem';

const sidebarMenuButtonVariants = cva(
  'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
  {
    variants: { size: { default: 'h-10', lg: 'h-12 items-start' } },
    defaultVariants: { size: 'default' },
  }
);
interface SidebarMenuButtonProps extends React.ComponentProps<typeof Link>, VariantProps<typeof sidebarMenuButtonVariants> {
  tooltip?: string;
}
const SidebarMenuButton = React.forwardRef<HTMLAnchorElement, SidebarMenuButtonProps>(
  ({ className, tooltip, size, children, ...props }, ref) => {
    const { isCollapsed } = useSidebar();
    const content = (
      <Link ref={ref} className={cn(sidebarMenuButtonVariants({size}), className)} {...props}>
        {children}
      </Link>
    );
    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right">{tooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return content;
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

const SidebarMenuSub = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('ml-7 flex flex-col border-l py-1', className)} {...props} />
  )
);
SidebarMenuSub.displayName = 'SidebarMenuSub';

const SidebarMenuSubItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('w-full', className)} {...props} />
  )
);
SidebarMenuSubItem.displayName = 'SidebarMenuSubItem';

const SidebarMenuSubButton = React.forwardRef<HTMLAnchorElement, React.ComponentProps<typeof Link>>(
  ({ className, children, ...props }, ref) => (
    <Link ref={ref} className={cn('block px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-accent-foreground', className)} {...props}>
      {children}
    </Link>
  )
);
SidebarMenuSubButton.displayName = 'SidebarMenuSubButton';

// --- Componenti Trigger e Inset ---
export function SidebarTrigger({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar, isCollapsed } = useSidebar();
  return (
    <Button variant="ghost" size="icon" onClick={toggleSidebar} className={cn('hidden md:flex', className)} {...props}>
      {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}
export function SidebarInset({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-y-auto overflow-x-hidden">{children}</div>;
}

// --- Esportazioni finali (ORA COMPLETE) ---
export {
  Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton,
};
