import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
// ❌ Rimuovi AuthProvider da qui - ora è nel root layout
import { I18nProvider } from '@/contexts/I18nContext';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { LanguageSwitcher } from '@/components/language-switcher';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Locale } from '@/i18n/config';

interface AppShellLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function AppShellLayout({
  children,
  params,
}: AppShellLayoutProps) {
  // Ottieni i messaggi per la locale corrente
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {/* I18nProvider e AuthProvider sono ora nel root layout */}
      {/* 3. Il SidebarProvider gestisce lo stato compresso/espanso */}
      <SidebarProvider>
        {/* 4. La nostra AppSidebar viene renderizzata qui */}
        <AppSidebar />
        {/* 5. SidebarInset contiene tutto il resto della pagina */}
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumbs />
            {/* 6. Aggiungi il Language Switcher nella header */}
            <div className="ml-auto">
              <LanguageSwitcher size="icon" />
            </div>
          </header>
          {/* 7. Il contenuto specifico della pagina viene renderizzato qui */}
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NextIntlClientProvider>
  );
}