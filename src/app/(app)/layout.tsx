import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AuthProvider } from '@/contexts/AuthContext';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 1. Il Provider di Autenticazione avvolge tutto
    <AuthProvider>
      {/* 2. Il SidebarProvider gestisce lo stato compresso/espanso */}
      <SidebarProvider>
        {/* 3. La nostra nuova AppSidebar viene renderizzata qui */}
        <AppSidebar />
        {/* 4. SidebarInset contiene tutto il resto della pagina */}
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumbs />
          </header>
          {/* 5. Il contenuto specifico della pagina viene renderizzato qui */}
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}