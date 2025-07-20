'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { ModernHorizontalTimeline } from './modern-horizontal-timeline';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import React from 'react';

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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timelines, setTimelines] = useState<ProjectWithTimeline[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ stats: true, timelines: true });
  const [error, setError] = useState<ErrorState>({ stats: null, timelines: null });
  const [timelineLimit, setTimelineLimit] = useState(3);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento delle statistiche';
      setError(prev => ({ ...prev, stats: errorMessage }));
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

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
      const validatedTimelines = (data || []).filter((project: any) => {
        return project && 
               typeof project.project_id === 'number' &&
               typeof project.project_name === 'string' &&
               typeof project.project_start_date === 'string' &&
               typeof project.project_end_date === 'string' &&
               Array.isArray(project.milestones);
      });
      
      setTimelines(validatedTimelines);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento delle timeline';
      setError(prev => ({ ...prev, timelines: errorMessage }));
      console.error('Error fetching timelines:', err);
    } finally {
      setLoading(prev => ({ ...prev, timelines: false }));
    }
  }, [timelineLimit]);

  // Funzione di refresh generale
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      await Promise.all([fetchStats(), fetchTimelines()]);
      toast.success("Dashboard aggiornata", {
        description: "I dati sono stati aggiornati con successo.",
      });
    } catch (err) {
      toast.error("Errore nell'aggiornamento", {
        description: "Si è verificato un errore durante l'aggiornamento dei dati.",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchStats, fetchTimelines]);

  // Effect per il caricamento iniziale
  useEffect(() => {
    document.title = 'Global Dashboard | GeoGrowth';
    fetchStats();
  }, [fetchStats]);

  // Effect separato per le timeline (quando cambia il limite)
  useEffect(() => {
    fetchTimelines();
  }, [fetchTimelines]);

  return (
    <div className="flex flex-col gap-6 mt-4">
      {/* Header con refresh button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing || loading.stats || loading.timelines}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Aggiorna
        </Button>
      </div>

      {/* Sezione KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading.stats ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))
        ) : error.stats ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex items-center justify-center h-28">
              <p className="text-sm text-destructive">Errore: {error.stats}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <KpiCard 
              title="Active Projects" 
              value={stats?.active_projects ?? 0} 
              icon={Activity} 
            />
            <KpiCard 
              title="Projects at Risk" 
              value={stats?.projects_at_risk ?? 0} 
              icon={AlertTriangle} 
              variant={stats?.projects_at_risk && stats.projects_at_risk > 0 ? 'destructive' : 'default'} 
            />
            <KpiCard 
              title="Upcoming Deadlines" 
              description="In the next 7 days" 
              value={stats?.upcoming_deadlines ?? 0} 
              icon={Clock} 
            />
          </>
        )}
      </div>

      {/* Sezione Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Project Timelines</CardTitle>
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
              <p className="text-sm text-destructive">Errore: {error.timelines}</p>
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
                No projects with upcoming deadlines found.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente KpiCard migliorato
function KpiCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  variant = 'default' 
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  variant?: 'default' | 'destructive';
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        <Icon 
          className={`absolute bottom-2 right-2 h-10 w-10 opacity-15 ${
            variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground'
          }`} 
        />
      </CardContent>
    </Card>
  );
}