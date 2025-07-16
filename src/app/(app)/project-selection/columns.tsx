'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown, FilePenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { StackedProgressBar } from './stacked-progress-bar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Il tipo di dati del progetto rimane lo stesso
export type Project = {
  id: number;
  project_name: string;
  project_code: string | null;
  project_status: 'Active' | 'Archived' | 'Closed';
  otop_percentage: number | null;
  ot_percentage: number | null;
  ko_percentage: number | null;
  total_components: number | null;
  next_milestone_name: string | null;
  next_milestone_date: string | null;
};

export const columns: ColumnDef<Project>[] = [
  // Colonna per la selezione multipla
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // Colonna per il nome del progetto
  {
    accessorKey: 'project_name',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Project Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link href={`/projects/${row.original.id}/dashboard`} className="font-medium hover:underline">
        {row.getValue('project_name')}
      </Link>
    ),
  },
  // Colonna per lo stato
  {
    accessorKey: 'project_status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('project_status') as string;
      return <Badge variant={status === 'Active' ? 'default' : 'secondary'}>{status}</Badge>;
    },
  },
  // Colonna: Conteggio Componenti (modificata)
  {
    accessorKey: 'total_components',
    header: 'Components',
    cell: ({ row }) => {
      const total = row.original.total_components ?? 0;
      return (
        // Contenitore modificato per centrare il contenuto con flexbox
        <div className="flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="default">{total}</Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total components in this project</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },
  // Colonna: Maturity Index
  {
    id: 'maturity_index',
    header: 'Maturity Index',
    cell: ({ row }) => {
      const project = row.original;
      return (
        <div className="w-32">
          <StackedProgressBar
            otop={project.otop_percentage ?? 0}
            ot={project.ot_percentage ?? 0}
            ko={project.ko_percentage ?? 0}
          />
        </div>
      );
    },
  },
  // Colonna Next Milestone
  {
    accessorKey: 'next_milestone_name',
    header: 'Next Milestone',
    cell: ({ row }) => {
      const milestone = row.original.next_milestone_name;
      const date = row.original.next_milestone_date;
      if (!milestone) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <div className="flex flex-col">
          <span className="font-medium">{milestone}</span>
          {date && (
            <span className="text-xs text-muted-foreground">
              {new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
      );
    },
  },
  // Colonna: Actions
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href={`/projects/${row.original.id}/edit`}>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Edit project</span>
                            <FilePenLine className="h-4 w-4" />
                        </Button>
                    </Link>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Edit Project</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      );
    },
  },
];