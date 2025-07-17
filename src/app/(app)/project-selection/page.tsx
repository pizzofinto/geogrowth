'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { columns, Project } from './columns';
import { DataTable } from './data-table';

export default function ProjectSelectionPage() {
  const { user, roles, isLoading: authLoading } = useAuth();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');

  useEffect(() => {
    document.title = 'Project Selection | GeoGrowth';

    async function fetchProjects() {
      if (!user) return;

      let projectQuery;

      if (roles.includes('Super User') || roles.includes('Supplier Quality') || roles.includes('Engineering')) {
        projectQuery = supabase.rpc('get_projects_with_details');
      } else {
        const { data: assignments, error: assignmentsError } = await supabase
          .from('user_project_assignments')
          .select('project_id')
          .eq('user_id', user.id);

        if (assignmentsError || !assignments || assignments.length === 0) {
          if(assignmentsError) console.error('Error fetching assignments:', assignmentsError);
          setAllProjects([]);
          setLoading(false);
          return;
        }
        
        const projectIds = assignments.map((a) => a.project_id);
        projectQuery = supabase.rpc('get_projects_with_details').in('id', projectIds);
      }
      
      const { data, error } = await projectQuery;

      if (error) {
        console.error('Error fetching project details:', error);
      } else {
        setAllProjects(data || []);
      }
      setLoading(false);
    }

    if (!authLoading && user) {
      fetchProjects();
    }
  }, [user, authLoading, roles]);

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
      return <div>Loading projects...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <DataTable 
        columns={columns} 
        data={filteredProjects}
        roles={roles} // Passa i ruoli al componente DataTable
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
    </div>
  );
}