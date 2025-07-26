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
import { useTranslations } from 'next-intl';
import React from 'react';

export function Breadcrumbs() {
  const pathname = usePathname();
  const tNavigation = useTranslations('navigation');
  const tBreadcrumbs = useTranslations('breadcrumbs');
  
  // Rimuove la locale dal pathname se presente e filtra elementi vuoti
  const pathSegments = pathname.split('/').filter(Boolean);
  
  // Se il primo segmento è una locale (en, it), rimuovilo
  const cleanSegments = pathSegments[0] && ['en', 'it'].includes(pathSegments[0]) 
    ? pathSegments.slice(1) 
    : pathSegments;

  // Se siamo alla radice del layout (es. /dashboard), non mostrare nulla
  if (cleanSegments.length === 0) {
    return null;
  }

  // Mappatura dei segmenti URL alle chiavi di traduzione
  const getSegmentLabel = (segment: string): string => {
    // Prima prova con le chiavi di navigazione specifiche
    const navigationKey = segment.toLowerCase();
    
    // Mappa comuni segmenti URL alle chiavi di traduzione
    switch (navigationKey) {
      case 'dashboard':
        return tNavigation('dashboard');
      case 'projects':
        return tNavigation('projects');
      case 'components':
        return tNavigation('components');
      case 'analytics':
        return tNavigation('analytics');
      case 'admin':
        return tNavigation('admin');
      case 'users':
        return tNavigation('users');
      case 'roles':
        return tNavigation('roles');
      case 'evaluations':
        return tNavigation('evaluations');
      case 'reports':
        return tNavigation('reports');
      // Breadcrumbs specifici
      case 'settings':
        return tBreadcrumbs('settings');
      case 'profile':
        return tBreadcrumbs('profile');
      case 'edit':
        return tBreadcrumbs('edit');
      case 'create':
        return tBreadcrumbs('create');
      case 'new':
        return tBreadcrumbs('new');
      case 'view':
        return tBreadcrumbs('view');
      case 'details':
        return tBreadcrumbs('details');
      default:
        // Se non trova una traduzione specifica, capitalizza il segmento
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
  };

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">{tNavigation('dashboard')}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {cleanSegments.map((segment, index) => {
          const href = `/${cleanSegments.slice(0, index + 1).join('/')}`;
          const isLast = index === cleanSegments.length - 1;
          const label = getSegmentLabel(segment);

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