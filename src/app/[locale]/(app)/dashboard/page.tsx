'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertTriangle, Clock, TrendingUp, TrendingDown, Minus, CheckCircle, RefreshCw } from 'lucide-react';
import { ModernHorizontalTimeline } from './modern-horizontal-timeline';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import React from 'react';
import RecentProjectsSection from '@/components/dashboard/RecentProjectsSection';
import { ActionPlanAlerts } from '@/components/dashboard/ActionPlanAlerts';
import { useTranslations } from 'next-intl';

// Tipi di dati aggiornati per includere 'Cancelled'
type Milestone = {
  milestone_name: string;
  milestone_target_date: string;
  milestone_status: 'Planned' | 'In Progress' | 'Completed' | 'Delayed' | 'Skipped' | 'Cancelled';
};

type ProjectWithTimeline = {
  project_id: number;
  project_name: string;
  project_start_date: string;
  project_end_date: string;
  milestones: Milestone[];
};

type DashboardStats = {
  active_projects: number;
  projects_at_risk: number;
  upcoming_deadlines: number;
};

// Stato di loading separato per sezioni
type LoadingState = {
  stats: boolean;
  timelines: boolean;
};

// Stato di errore
type ErrorState = {
  stats: string | null;
  timelines: string | null;
};

export default function GlobalDashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tMessages = useTranslations('messages');
  const tErrors = useTranslations('errors');
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timelines, setTimelines] = useState<ProjectWithTimeline[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ stats: true, timelines: true });
  const [error, setError] = useState<ErrorState>({ stats: null, timelines: null });
  const [timelineLimit, setTimelineLimit] = useState(3);

  // Funzione per fetch delle statistiche
  const fetchStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    setError(prev => ({ ...prev, stats: null }));
    
    try {
      const { data, error: statsError } = await supabase.rpc('get_global_dashboard_stats');
      
      if (statsError) {
        throw new Error(statsError.message);
      }
      
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : tMessages('errorLoadingData');
      setError(prev => ({ ...prev, stats: errorMessage }));
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, [tMessages]);

  // Funzione per fetch delle timeline
  const fetchTimelines = useCallback(async () => {
    setLoading(prev => ({ ...prev, timelines: true }));
    setError(prev => ({ ...prev, timelines: null }));
    
    try {
      const { data, error: timelinesError } = await supabase.rpc('get_upcoming_project_timelines', {
        project_limit: timelineLimit,
      });
      
      if (timelinesError) {
        throw new Error(timelinesError.message);
      }
      
      // Validazione dati ricevuti
      interface ProjectData {
        project_id: number;
        project_name: string;
        timelines: string | null;
      }
      const validatedTimelines = (data || []).filter((project: ProjectData) => {
        return project && 
               typeof project.project_id === 'number' &&
               typeof project.project_name === 'string' &&
               typeof project.project_start_date === 'string' &&
               typeof project.project_end_date === 'string' &&
               Array.isArray(project.milestones);
      });
      
      setTimelines(validatedTimelines);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : tMessages('errorLoadingData');
      setError(prev => ({ ...prev, timelines: errorMessage }));
      console.error('Error fetching timelines:', err);
    } finally {
      setLoading(prev => ({ ...prev, timelines: false }));
    }
  }, [timelineLimit, tMessages]);

  // Effect per il caricamento iniziale
  useEffect(() => {
    console.log('🔄 Dashboard useEffect triggered - setting title and fetching stats');
    document.title = `${t('title')} | GeoGrowth`;
    fetchStats();
  }, [fetchStats, t]);

  // Effect separato per le timeline (quando cambia il limite)
  useEffect(() => {
    fetchTimelines();
  }, [fetchTimelines]);

  return (
    <div className="flex flex-col gap-6 mt-4">
      {/* Header semplificato senza refresh button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      </div>

      {/* KPI Cards Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('statistics')}</h2>
          <p className="text-sm text-muted-foreground">{t('overview')}</p>
        </div>
        <Button 
          onClick={() => { fetchStats(); fetchTimelines(); }}
          variant="ghost" 
          size="icon"
          disabled={loading.stats || loading.timelines}
          title={tCommon('refresh')}
        >
          <RefreshCw className={`h-4 w-4 ${(loading.stats || loading.timelines) ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Sezione KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading.stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-28">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : error.stats ? (
          <Card className="md:col-span-2 lg:col-span-4">
            <CardContent className="flex items-center justify-center h-28">
              <p className="text-sm text-destructive">{tErrors('generic')}: {error.stats}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <KpiCard 
              title={t('activeProjects')} 
              value={stats?.active_projects ?? 0} 
              icon={Activity}
              trend="up"
              previousValue={stats?.active_projects ? stats.active_projects - 2 : undefined}
              description={t('totalProjects')}
            />
            <KpiCard 
              title={t('risks')} 
              value={stats?.projects_at_risk ?? 0} 
              icon={AlertTriangle} 
              variant={stats?.projects_at_risk && stats.projects_at_risk > 0 ? 'destructive' : 'default'}
              trend={stats?.projects_at_risk && stats.projects_at_risk > 0 ? "up" : "down"}
              previousValue={stats?.projects_at_risk ? Math.max(0, stats.projects_at_risk - 1) : undefined}
              description={t('projectsNeedingAttention')}
            />
            <KpiCard 
              title={t('upcomingDeadlines')} 
              description={t('nextSevenDays')}
              value={stats?.upcoming_deadlines ?? 0} 
              icon={Clock}
              trend="neutral"
              previousValue={stats?.upcoming_deadlines ? stats.upcoming_deadlines + 1 : undefined}
            />
            <KpiCard 
              title={t('completedEvaluations')} 
              value="85%" 
              icon={CheckCircle}
              trend="up"
              description={t('thisMonth')}
            />
          </>
        )}
      </div>

      {/* Action Plan Alerts Section - FIXED ✅ */}
      <ActionPlanAlerts />

      {/* Sezione Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{t('projectProgress')}</CardTitle>
          <Select 
            value={String(timelineLimit)} 
            onValueChange={(value) => setTimelineLimit(Number(value))}
            disabled={loading.timelines}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Show 3 Projects</SelectItem>
              <SelectItem value="5">Show 5 Projects</SelectItem>
              <SelectItem value="10">Show 10 Projects</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading.timelines ? (
            <div className="space-y-6">
              {Array.from({ length: timelineLimit }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-1/4 h-6" />
                  <Skeleton className="w-3/4 h-12" />
                </div>
              ))}
            </div>
          ) : error.timelines ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-destructive">{tErrors('generic')}: {error.timelines}</p>
            </div>
          ) : timelines && timelines.length > 0 ? (
            <div className="space-y-6">
              {timelines.map((project, index) => (
                <React.Fragment key={project.project_id}>
                  <div className="flex items-center gap-4">
                    <div className="w-1/4 min-w-0">
                      <p className="font-semibold truncate" title={project.project_name}>
                        {project.project_name}
                      </p>
                    </div>
                    <div className="w-3/4">
                      <ModernHorizontalTimeline 
                        milestones={project.milestones || []}
                        startDate={project.project_start_date}
                        endDate={project.project_end_date}
                        showToday={true}
                      />
                    </div>
                  </div>
                  {index < timelines.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">
                {tMessages('noResults')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Projects Section - RESTORED */}
      <RecentProjectsSection limit={4} />
    </div>
  );
}

// Enhanced KPI Card with animations and trends
function KpiCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  variant = 'default',
  trend,
  previousValue 
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  variant?: 'default' | 'destructive';
  trend?: 'up' | 'down' | 'neutral';
  previousValue?: number;
}) {
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  const change = previousValue !== undefined ? numericValue - previousValue : 0;
  const changePercent = previousValue !== undefined && previousValue > 0 
    ? Math.round((change / previousValue) * 100) 
    : 0;

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = () => {
    if (variant === 'destructive') {
      return trend === 'down' ? 'text-green-600' : trend === 'up' ? 'text-red-600' : 'text-muted-foreground';
    }
    return trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground';
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {trend && (
            <TrendIcon className={`h-4 w-4 ${getTrendColor()}`} />
          )}
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">
            {value}
          </div>
          {change !== 0 && previousValue !== undefined && (
            <div className={`text-xs font-medium ${getTrendColor()}`}>
              {change > 0 ? '+' : ''}{change}
              {changePercent !== 0 && (
                <span className="ml-1">({changePercent}%)</span>
              )}
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        <Icon 
          className={`absolute bottom-2 right-2 h-10 w-10 opacity-15 transition-opacity duration-200 hover:opacity-25 ${
            variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground'
          }`} 
        />
      </CardContent>
    </Card>
  );
}