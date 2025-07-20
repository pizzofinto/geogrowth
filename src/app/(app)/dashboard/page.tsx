'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertTriangle, Clock } from 'lucide-react';
import { ModernHorizontalTimeline } from './modern-horizontal-timeline'; // Importa il nuovo componente
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import React from 'react';

// Tipi di dati aggiornati
type Milestone = {
  milestone_name: string;
  milestone_target_date: string;
  milestone_status: 'Planned' | 'In Progress' | 'Completed' | 'Delayed' | 'Skipped';
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

export default function GlobalDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timelines, setTimelines] = useState<ProjectWithTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLimit, setTimelineLimit] = useState(3);

  useEffect(() => {
    document.title = 'Global Dashboard | GeoGrowth';

    async function fetchDashboardData() {
      setLoading(true);
      const statsPromise = supabase.rpc('get_global_dashboard_stats');
      const timelinesPromise = supabase.rpc('get_upcoming_project_timelines', {
        project_limit: timelineLimit,
      });
      const [statsResult, timelinesResult] = await Promise.all([statsPromise, timelinesPromise]);

      if (statsResult.error) console.error('Error fetching dashboard stats:', statsResult.error);
      else setStats(statsResult.data);

      if (timelinesResult.error) console.error('Error fetching timelines:', timelinesResult.error);
      else setTimelines(timelinesResult.data || []);
      
      setLoading(false);
    }
    fetchDashboardData();
  }, [timelineLimit]);

  return (
    <div className="flex flex-col gap-6 mt-4">
      {/* Sezione KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Active Projects" value={stats?.active_projects ?? 0} icon={Activity} />
        <KpiCard title="Projects at Risk" value={stats?.projects_at_risk ?? 0} icon={AlertTriangle} variant={stats?.projects_at_risk ?? 0 > 0 ? 'destructive' : 'default'} />
        <KpiCard title="Upcoming Deadlines" description="In the next 7 days" value={stats?.upcoming_deadlines ?? 0} icon={Clock} />
      </div>

      {/* Nuova Sezione Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project Timelines</CardTitle>
          <Select value={String(timelineLimit)} onValueChange={(value) => setTimelineLimit(Number(value))}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Show 3 Projects</SelectItem>
              <SelectItem value="5">Show 5 Projects</SelectItem>
              <SelectItem value="10">Show 10 Projects</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48" />
          ) : timelines && timelines.length > 0 ? (
            <div className="space-y-6">
              {timelines.map((project, index) => (
                <React.Fragment key={project.project_id}>
                  <div className="flex items-center gap-4">
                    <p className="w-1/4 font-semibold truncate">{project.project_name}</p>
                    <div className="w-3/4">
                      <ModernHorizontalTimeline 
                        milestones={project.milestones}
                      />
                    </div>
                  </div>
                  {index < timelines.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No projects with upcoming deadlines found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componenti KpiCard e DashboardSkeleton (invariati)
function KpiCard({ title, value, icon: Icon, description, variant = 'default' }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  variant?: 'default' | 'destructive';
}) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader>
      <CardContent className="relative">
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <Icon className={`absolute bottom-2 right-2 h-10 w-10 opacity-15 ${variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground'}`} />
      </CardContent>
    </Card>
  );
}
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 mt-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}