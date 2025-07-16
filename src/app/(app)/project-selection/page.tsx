'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { columns, Project } from './columns';
import { DataTable } from './data-table';

export default function ProjectSelectionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');

  useEffect(() => {
    document.title = 'Project Selection | GeoGrowth';

    async function fetchProjects() {
      if (!user) return;
      
      const { data, error } = await supabase.rpc('get_projects_with_details');

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
  }, [user, authLoading]);

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
      {/* La barra degli strumenti è stata rimossa da qui e ora è gestita da DataTable */}
      <DataTable 
        columns={columns} 
        data={filteredProjects}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
    </div>
  );
}