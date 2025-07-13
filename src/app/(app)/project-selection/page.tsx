'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

// Definiamo un tipo per i dati del progetto
type Project = {
  id: number;
  project_name: string;
  project_code: string | null;
};

export default function ProjectSelectionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Project Selection | GeoGrowth';

    async function fetchProjects() {
      if (!user) return;

      // Recupera gli ID dei progetti a cui l'utente è assegnato
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_project_assignments')
        .select('project_id')
        .eq('user_id', user.id);

      if (assignmentsError) {
        console.error('Error fetching project assignments:', assignmentsError);
        setLoading(false);
        return;
      }

      if (!assignments || assignments.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const projectIds = assignments.map((a) => a.project_id);

      // Recupera i dettagli dei progetti assegnati
      const { data: projectData, error: projectsError } = await supabase
        .from('projects')
        .select('id, project_name, project_code')
        .in('id', projectIds);

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
      } else {
        setProjects(projectData || []);
      }
      setLoading(false);
    }

    if (!authLoading && user) {
      fetchProjects();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Stato di caricamento
  if (loading || authLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  // Stato in cui l'utente non ha progetti assegnati
  if (projects.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-center">
        <div>
          <h2 className="text-2xl font-bold">No Projects Assigned</h2>
          <p className="text-muted-foreground">
            Please contact your administrator to be assigned to a project.
          </p>
        </div>
      </div>
    );
  }

  // Stato principale con la lista dei progetti
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Select a Project</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map((project) => (
          <Link href={`/projects/${project.id}/dashboard`} key={project.id}>
            <Card className="h-full transform-gpu transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <CardTitle>{project.project_name}</CardTitle>
                {project.project_code && (
                  <CardDescription>
                    Code: {project.project_code}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
