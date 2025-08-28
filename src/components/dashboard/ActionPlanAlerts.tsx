'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, TrendingUp, RefreshCw, ChevronRight, Settings, Grid3X3, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useActionPlanAlerts } from '@/hooks/useActionPlanAlerts';
import { ActionPlanAlertCard } from './ActionPlanAlertCard';
import { cn } from '@/lib/utils';

interface ActionPlanAlertsProps {
  className?: string;
  onViewAllActionPlans?: () => void;
  /** Configurazione opzionale per i filtri temporali */
  config?: {
    dueSoonDays?: number;
    overdueMaxDays?: number;
    highPriorityThreshold?: number;
    highPriorityMaxDays?: number;
  };
  /** Callback when config badge is clicked */
  onConfigClick?: () => void;
}

/**
 * ActionPlanAlerts - Componente dashboard per mostrare alerts degli action plans 
 * ✅ FIXED: Hook dependencies resolved for stable rendering
 * @param props - Component properties
 * @returns JSX Element
 */
export function ActionPlanAlerts({ 
  className, 
  onViewAllActionPlans,
  config,
  onConfigClick 
}: ActionPlanAlertsProps) {
  const t = useTranslations('dashboard.actionPlans');
  const router = useRouter();
  const { data, isLoading, error, refetch } = useActionPlanAlerts(config);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ✅ FIXED: useCallback per prevenire infinite loop
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  // ✅ Navigate to project dashboard for action plan details
  const handleViewDetails = useCallback((actionPlanId: number) => {
    // Find the action plan to get project information
    const allActionPlans = [
      ...data.overdue,
      ...data.dueSoon, 
      ...data.highPriority
    ];
    
    const actionPlan = allActionPlans.find(ap => ap.id === actionPlanId);
    
    if (actionPlan?.component?.project_id) {
      const projectId = actionPlan.component.project_id;
      console.log(`🚀 Navigating to project ${projectId} dashboard for action plan ${actionPlanId}`);
      router.push(`/projects/${projectId}/dashboard?actionPlan=${actionPlanId}`);
    } else {
      console.error('❌ Could not find project for action plan:', actionPlanId);
      // Fallback: navigate to project selection if no project found
      router.push('/project-selection');
    }
  }, [data, router]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {t('title')}
            </CardTitle>
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="mb-4">{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={handleRefresh} 
            variant="ghost" 
            size="icon" 
            className="mt-2"
            title={t('retry')}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!data || data.totalCount === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {t('title')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="ghost"
                size="icon"
                disabled={isRefreshing}
                title={t('retry')}
              >
                <RefreshCw className={cn(
                  'h-4 w-4',
                  isRefreshing && 'animate-spin'
                )} />
              </Button>
              {config && (
                <Badge variant="outline" className="text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  Custom Config
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-sm mb-2">{t('noAlerts.title')}</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {t('noAlerts.description')}
            </p>
            {onViewAllActionPlans && (
              <Button onClick={onViewAllActionPlans} variant="outline" size="sm">
                {t('viewAllActionPlans')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">
          {t('title')}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            disabled={isRefreshing}
            aria-label="Grid View"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            disabled={isRefreshing}
            aria-label="List View"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="icon"
            disabled={isRefreshing}
            title={t('retry')}
          >
            <RefreshCw className={cn(
              'h-4 w-4',
              isRefreshing && 'animate-spin'
            )} />
          </Button>
          {config && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                onConfigClick && "cursor-pointer hover:bg-muted/50 transition-colors"
              )}
              onClick={onConfigClick}
            >
              <Settings className="h-3 w-3 mr-1" />
              Custom Config
            </Badge>
          )}
          {onViewAllActionPlans && (
            <Button onClick={onViewAllActionPlans} variant="outline" size="sm">
              {t('viewAll')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Statistics Summary - Clean white cards with shadows */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background border hover:shadow-md transition-shadow">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">{t('overdue')}</p>
              <p className="text-lg font-semibold text-foreground">
                {data.overdueCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-background border hover:shadow-md transition-shadow">
            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-xs text-muted-foreground">{t('dueSoon')}</p>
              <p className="text-lg font-semibold text-foreground">
                {data.dueSoonCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-background border hover:shadow-md transition-shadow">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-muted-foreground">{t('highPriority')}</p>
              <p className="text-lg font-semibold text-foreground">
                {data.highPriorityCount}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs for different alert types */}
        <Tabs defaultValue="overdue" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overdue" className="text-xs">
              {t('overdue')}
              {data.overdueCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-2 text-xs">
                  {data.overdueCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="dueSoon" className="text-xs">
              {t('dueSoon')}
              {data.dueSoonCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  {data.dueSoonCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="highPriority" className="text-xs">
              {t('highPriority')}
              {data.highPriorityCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {data.highPriorityCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overdue">
            <ScrollArea className="h-[300px]">
              <div className={cn(
                viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4 pr-4" : "space-y-3 pr-4"
              )}>
                {data.overdue.length === 0 ? (
                  <div className="text-center py-8 col-span-full">
                    <p className="text-sm text-muted-foreground">
                      {t('noOverdueActions')}
                    </p>
                  </div>
                ) : (
                  data.overdue.map((actionPlan) => (
                    <ActionPlanAlertCard
                      key={actionPlan.id}
                      actionPlan={actionPlan}
                      alertType="overdue"
                      viewMode={viewMode}
                      onViewDetails={handleViewDetails}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="dueSoon">
            <ScrollArea className="h-[300px]">
              <div className={cn(
                viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4 pr-4" : "space-y-3 pr-4"
              )}>
                {data.dueSoon.length === 0 ? (
                  <div className="text-center py-8 col-span-full">
                    <p className="text-sm text-muted-foreground">
                      {t('noDueSoonActions')}
                    </p>
                  </div>
                ) : (
                  data.dueSoon.map((actionPlan) => (
                    <ActionPlanAlertCard
                      key={actionPlan.id}
                      actionPlan={actionPlan}
                      alertType="dueSoon"
                      viewMode={viewMode}
                      onViewDetails={handleViewDetails}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="highPriority">
            <ScrollArea className="h-[300px]">
              <div className={cn(
                viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4 pr-4" : "space-y-3 pr-4"
              )}>
                {data.highPriority.length === 0 ? (
                  <div className="text-center py-8 col-span-full">
                    <p className="text-sm text-muted-foreground">
                      {t('noHighPriorityActions')}
                    </p>
                  </div>
                ) : (
                  data.highPriority.map((actionPlan) => (
                    <ActionPlanAlertCard
                      key={actionPlan.id}
                      actionPlan={actionPlan}
                      alertType="highPriority"
                      viewMode={viewMode}
                      onViewDetails={handleViewDetails}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}