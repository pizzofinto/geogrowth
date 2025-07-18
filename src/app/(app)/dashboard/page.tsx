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
import { Badge } from '@/components/ui/badge';

// Definiamo i tipi per i dati che riceveremo dalla funzione RPC
type Milestone = {
  project_name: string;
  milestone_name: string;
  milestone_target_date: string;
};

type DashboardStats = {
  active_projects: number;
  projects_at_risk: number;
  upcoming_deadlines: number;
  next_milestones: Milestone[];
};

export default function GlobalDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Global Dashboard | GeoGrowth';

    async function fetchDashboardStats() {
      const { data, error } = await supabase.rpc('get_global_dashboard_stats');
      if (error) {
        console.error('Error fetching dashboard stats:', error);
      } else {
        setStats(data);
      }
      setLoading(false);
    }
    fetchDashboardStats();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    // 1. Aggiunto margine superiore per distanziare dai breadcrumbs
    <div className="flex flex-col gap-6 mt-4">
      {/* Sezione KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Active Projects"
          value={stats?.active_projects ?? 0}
          icon={Activity}
        />
        <KpiCard
          title="Projects at Risk"
          value={stats?.projects_at_risk ?? 0}
          icon={AlertTriangle}
          variant={stats?.projects_at_risk ?? 0 > 0 ? 'destructive' : 'default'}
        />
        <KpiCard
          title="Upcoming Deadlines"
          description="In the next 7 days"
          value={stats?.upcoming_deadlines ?? 0}
          icon={Clock}
        />
      </div>

      {/* Sezione Scadenze Imminenti */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.next_milestones && stats.next_milestones.length > 0 ? (
              stats.next_milestones.map((milestone, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{milestone.milestone_name}</p>
                    <p className="text-sm text-muted-foreground">{milestone.project_name}</p>
                  </div>
                  <Badge>
                    {new Date(milestone.milestone_target_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente per le card KPI (MODIFICATO)
function KpiCard({ title, value, icon: Icon, description, variant = 'default' }: {
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
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <Icon className={`absolute bottom-2 right-2 h-10 w-10 opacity-15 ${variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground'}`} />
      </CardContent>
    </Card>
  );
}

// Componente per lo scheletro di caricamento
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 mt-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}