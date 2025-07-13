import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-2xl font-bold tracking-tight">
          ✅ Stai vedendo la Dashboard Corretta!
        </h3>
        <p className="text-sm text-muted-foreground">
          Questa pagina è stata renderizzata all'interno del nuovo layout AppShell.
        </p>
      </div>
    </div>
  );
}