'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import React from 'react';

export function Breadcrumbs() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean); // Rimuove gli elementi vuoti

  // Se siamo alla radice del layout (es. /dashboard), non mostrare nulla
  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const isLast = index === pathSegments.length - 1;
          const label = segment.charAt(0).toUpperCase() + segment.slice(1);

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
// Questo componente Breadcrumbs genera un percorso di navigazione basato sull'URL corrente.
// Utilizza il percorso per creare un elenco di link che rappresentano la gerarchia delle pagine.
// Ogni segmento del percorso è trasformato in un link, con l'ultimo segmento mostrato come pagina corrente senza link.
// Il percorso inizia sempre con "Dashboard" e si adatta dinamicamente in base alla struttura dell'URL.
// Il componente è visibile solo su schermi di dimensioni medie e superiori, grazie alla classe "hidden md:flex".
// Utilizza il componente Breadcrumb di Shadcn per una presentazione visiva coerente e accessibile del percorso di navigazione.