'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
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
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name, project_code, project_status');

      if (error) {
        console.error('Error fetching projects:', error);
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

  if (authLoading) {
      return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Titolo della pagina */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Projects</h1>
      </div>

      {/* Barra dei controlli (Ricerca, Filtro e Pulsante) */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Project
        </Button>
      </div>
      
      {/* Tabella dei dati */}
      <DataTable columns={columns} data={filteredProjects} />
    </div>
  );
}
