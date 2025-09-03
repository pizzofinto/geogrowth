'use client';

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface UseProjectDeletionReturn {
  deleteProject: (projectId: number) => Promise<boolean>;
  deleteProjects: (projectIds: number[]) => Promise<{ success: boolean; failedIds: number[] }>;
  isDeleting: boolean;
  error: string | null;
}

interface DeleteProjectsResult {
  success: boolean;
  failedIds: number[];
  deletedCount: number;
}

export function useProjectDeletion(): UseProjectDeletionReturn {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isProcessingRef = useRef(false);

  const deleteProject = useCallback(async (projectId: number): Promise<boolean> => {
    // Multi-tab safety implementation following code conventions
    if (isProcessingRef.current) {
      console.log('🚫 Already processing deletion, skipping...');
      return false;
    }

    // Cross-tab coordination using localStorage
    const processKey = `project_deletion_processing_${projectId}`;
    let currentlyProcessing = null;
    
    try {
      currentlyProcessing = typeof window !== 'undefined' 
        ? localStorage.getItem(processKey) 
        : null;
    } catch (error) {
      console.warn('Error accessing localStorage:', error);
    }

    // Check if another tab is processing (within timeout window)
    const PROCESS_TIMEOUT = 10000; // 10 seconds
    if (currentlyProcessing && Date.now() - parseInt(currentlyProcessing) < PROCESS_TIMEOUT) {
      console.log('🚫 Another tab is processing this project deletion, skipping...');
      return false;
    }

    // Set processing flags
    isProcessingRef.current = true;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(processKey, Date.now().toString());
      } catch (error) {
        console.warn('Error setting localStorage:', error);
      }
    }

    try {
      setIsDeleting(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('🗑️ Starting soft delete for project:', projectId);

      // Perform soft delete - add deleted_at timestamp, deleted_by_user_id, and update status
      const { error: deleteError } = await supabase
        .from('projects')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by_user_id: user.id,
          project_status: 'Closed'
        })
        .eq('id', projectId)
        .is('deleted_at', null); // Only delete if not already deleted

      if (deleteError) {
        console.error('❌ Error soft deleting project:', deleteError);
        throw new Error(`Failed to delete project: ${deleteError.message}`);
      }

      console.log('✅ Project soft deleted successfully:', projectId);
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Project deletion failed:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsDeleting(false);
      isProcessingRef.current = false;
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(processKey);
        } catch (error) {
          console.warn('Error removing localStorage item:', error);
        }
      }
    }
  }, [user?.id]);

  const deleteProjects = useCallback(async (projectIds: number[]): Promise<{ success: boolean; failedIds: number[] }> => {
    // Multi-tab safety for bulk operations
    if (isProcessingRef.current) {
      console.log('🚫 Already processing bulk deletion, skipping...');
      return { success: false, failedIds: projectIds };
    }

    // Cross-tab coordination for bulk deletion
    const processKey = 'bulk_project_deletion_processing';
    let currentlyProcessing = null;
    
    try {
      currentlyProcessing = typeof window !== 'undefined' 
        ? localStorage.getItem(processKey) 
        : null;
    } catch (error) {
      console.warn('Error accessing localStorage:', error);
    }

    const PROCESS_TIMEOUT = 15000; // 15 seconds for bulk operations
    if (currentlyProcessing && Date.now() - parseInt(currentlyProcessing) < PROCESS_TIMEOUT) {
      console.log('🚫 Another tab is processing bulk deletion, skipping...');
      return { success: false, failedIds: projectIds };
    }

    // Set processing flags
    isProcessingRef.current = true;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(processKey, Date.now().toString());
      } catch (error) {
        console.warn('Error setting localStorage:', error);
      }
    }

    try {
      setIsDeleting(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('🗑️ Starting bulk soft delete for projects:', projectIds);

      // Perform bulk soft delete
      const { error: deleteError } = await supabase
        .from('projects')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by_user_id: user.id,
          project_status: 'Closed'
        })
        .in('id', projectIds)
        .is('deleted_at', null); // Only delete if not already deleted

      if (deleteError) {
        console.error('❌ Error bulk soft deleting projects:', deleteError);
        throw new Error(`Failed to delete projects: ${deleteError.message}`);
      }

      console.log('✅ Projects bulk soft deleted successfully:', projectIds.length);
      return { success: true, failedIds: [] };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Bulk project deletion failed:', err);
      setError(errorMessage);
      return { success: false, failedIds: projectIds };
    } finally {
      setIsDeleting(false);
      isProcessingRef.current = false;
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(processKey);
        } catch (error) {
          console.warn('Error removing localStorage item:', error);
        }
      }
    }
  }, [user?.id]);

  return {
    deleteProject,
    deleteProjects,
    isDeleting,
    error
  };
}