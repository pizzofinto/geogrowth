'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { getColumns, Project } from './columns';
import { DataTable } from './data-table';
import { useTranslations } from 'next-intl';
import { ProjectDeleteDialog, ProjectToDelete } from '@/components/project/ProjectDeleteDialog';
import { useProjectDeletion } from '@/hooks/useProjectDeletion';
import { toast } from 'sonner';

export default function ProjectSelectionPage() {
  const { user, roles, isLoading: authLoading } = useAuth();
  const t = useTranslations('projects');
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectsToDelete, setProjectsToDelete] = useState<ProjectToDelete[]>([]);
  
  // Project deletion hook
  const { deleteProject, deleteProjects, isDeleting, error } = useProjectDeletion();

  // Individual project deletion handler
  const handleDeleteProject = useCallback((project: Project) => {
    const projectToDelete: ProjectToDelete = {
      id: project.id,
      project_name: project.project_name,
      project_code: project.project_code,
      total_components: project.total_components || 0
    };
    setProjectsToDelete([projectToDelete]);
    setDeleteDialogOpen(true);
  }, []);

  // Bulk project deletion handler
  const handleBulkDelete = useCallback((selectedProjects: Project[]) => {
    const projectsToDeleteData: ProjectToDelete[] = selectedProjects.map(project => ({
      id: project.id,
      project_name: project.project_name,
      project_code: project.project_code,
      total_components: project.total_components || 0
    }));
    setProjectsToDelete(projectsToDeleteData);
    setDeleteDialogOpen(true);
  }, []);

  // Confirm deletion handler
  const handleConfirmDelete = useCallback(async (projectIds: number[]) => {
    const isBulk = projectIds.length > 1;
    
    try {
      if (isBulk) {
        const result = await deleteProjects(projectIds);
        if (result.success) {
          toast.success(t('projectsDeletedSuccessfully', { count: projectIds.length }));
          // Refresh the project list
          if (user && hasRoles) {
            fetchProjects();
          }
        } else {
          throw new Error('Bulk deletion failed');
        }
      } else {
        const success = await deleteProject(projectIds[0]);
        if (success) {
          toast.success(t('projectDeletedSuccessfully'));
          // Refresh the project list
          if (user && hasRoles) {
            fetchProjects();
          }
        } else {
          throw new Error('Project deletion failed');
        }
      }
    } catch (err) {
      console.error('Delete operation failed:', err);
      toast.error(error || t('deletionFailed'));
    }
  }, [deleteProject, deleteProjects, error, user, hasRoles, t, fetchProjects]);

  // Genera le colonne con le traduzioni e callbacks
  const columns = React.useMemo(() => getColumns({
    t,
    roles: roles || [],
    onDeleteProject: handleDeleteProject
  }), [t, roles, handleDeleteProject]);

  // ✅ FIXED: Memoize roles to prevent infinite loops  
  // ✅ FIXED: Memoize roles to prevent infinite loops  
  const rolesString = useMemo(() => {
    try {
      return JSON.stringify((roles || []).sort());
    } catch {
      return '[]';
    }
  }, [roles]);
  const hasRoles = useMemo(() => roles && roles.length > 0, [roles]);

  // Extract fetchProjects function so it can be reused
  const fetchProjects = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase.rpc('get_projects_with_details');

    if (error) {
      console.error('Error fetching project details:', error);
    } else {
      setAllProjects(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    document.title = `${t('title')} | GeoGrowth`;

    if (!authLoading && user && hasRoles) {
      fetchProjects();
    }
  }, [user, authLoading, hasRoles, rolesString, t, fetchProjects]);
  // ✅ FIXED: Using stable references instead of direct roles dependency

  useEffect(() => {
    let projects = allProjects;

    if (statusFilter !== 'All') {
      projects = projects.filter((p) => p.project_status === statusFilter);
    }

    if (searchTerm) {
      projects = projects.filter(
        (p) =>
          p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.project_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProjects(projects);
  }, [searchTerm, statusFilter, allProjects]);

  if (authLoading || loading) {
      return <div>{t('loadingProjects')}</div>;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      <DataTable 
        columns={columns} 
        data={filteredProjects}
        roles={roles || []}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onBulkDelete={handleBulkDelete}
        t={t}
      />
      
      {/* Delete confirmation dialog */}
      <ProjectDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        projects={projectsToDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}