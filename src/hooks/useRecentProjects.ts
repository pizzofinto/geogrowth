'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export interface RecentProject {
  project_id: number;
  project_name: string;
  project_status: 'Active' | 'Archived' | 'Closed';
  last_accessed: string;
  total_components: number;
  overdue_action_plans_count: number;
  otop_percentage: number;
  ot_percentage: number;
  ko_percentage: number;
  next_milestone_name?: string;
  next_milestone_date?: string;
}

interface UseRecentProjectsReturn {
  projects: RecentProject[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProjectAccess: (projectId: number) => Promise<void>;
}

export function useRecentProjects(limit: number = 4): UseRecentProjectsReturn {
  const [projects, setProjects] = useState<RecentProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRecentProjects = useCallback(async () => {
    if (!user?.id) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching recent projects for user:', user.id, 'limit:', limit);
      
      const { data, error: fetchError } = await supabase
        .rpc('get_recent_projects_for_user', {
          user_id_param: user.id,
          limit_param: limit
        });

      if (fetchError) {
        throw new Error(`Database error: ${fetchError.message}`);
      }

      console.log('✅ Recent projects fetched:', data?.length || 0, 'projects');
      console.log('📊 Projects data:', data);
      
      setProjects(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento dei progetti recenti';
      setError(errorMessage);
      console.error('❌ Error fetching recent projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, limit]);

  const updateProjectAccess = useCallback(async (projectId: number) => {
    if (!user?.id) {
      console.warn('⚠️ Cannot update project access: no user');
      return;
    }

    try {
      console.log('🔄 Updating project access for project:', projectId);
      
      const { error } = await supabase
        .rpc('update_project_last_accessed', {
          project_id_param: projectId,
          user_id_param: user.id
        });

      if (error) {
        console.error('❌ Error updating project access:', error);
        throw new Error(`Failed to update project access: ${error.message}`);
      } else {
        console.log('✅ Project access updated successfully');
        // Ricarica la lista dopo aver aggiornato l'accesso
        await fetchRecentProjects();
      }
    } catch (err) {
      console.error('❌ Error updating project access:', err);
      // Non bloccare l'UI per questo errore, continua con la navigazione
    }
  }, [user?.id, fetchRecentProjects]);

  // Effect per il caricamento iniziale
  useEffect(() => {
    fetchRecentProjects();
  }, [fetchRecentProjects]);

  return {
    projects,
    isLoading,
    error,
    refetch: fetchRecentProjects,
    updateProjectAccess
  };
}