'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { getColumns, Project } from './columns';
import { DataTable } from './data-table';
import { useTranslations } from 'next-intl';

export default function ProjectSelectionPage() {
  const { user, roles, isLoading: authLoading } = useAuth();
  const t = useTranslations('projects');
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');

  // Genera le colonne con le traduzioni
    const columns = React.useMemo(() => getColumns(t), [t]);

  useEffect(() => {
    document.title = `${t('title')} | GeoGrowth`;

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
      return <div>{t('loadingProjects')}</div>;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      <DataTable 
        columns={columns} 
        data={filteredProjects}
        roles={roles}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        t={t}
      />
    </div>
  );
}