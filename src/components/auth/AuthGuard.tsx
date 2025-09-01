'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Don't redirect if we're still loading or already redirecting
    if (isLoading || isRedirecting) return;

    // Don't redirect if user is authenticated
    if (user) return;

    // Extract locale from pathname
    const pathSegments = pathname.split('/');
    const locale = pathSegments[1] || 'en';

    // Only redirect to login if we're not already on the login page
    if (!pathname.includes(`/${locale}`) || pathname === `/${locale}` || pathname === `/${locale}/`) {
      console.log('🔒 No authenticated user, redirecting to login...');
      setIsRedirecting(true);
      router.push(`/${locale}`);
    }
  }, [user, isLoading, router, pathname, isRedirecting]);

  // Show loading state while authentication is being determined
  if (isLoading || isRedirecting) {
    return (
      <div className="flex flex-col h-screen w-full">
        <div className="flex items-center gap-3 p-4 border-b">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-32 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Don't render children if user is not authenticated
  if (!user) {
    return null;
  }

  return <>{children}</>;
}