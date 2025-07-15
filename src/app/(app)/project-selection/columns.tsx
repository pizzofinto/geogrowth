'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

// 1. Aggiorniamo il tipo di dati per includere i nuovi campi
export type Project = {
  id: number;
  project_name: string;
  project_code: string | null;
  project_status: 'Active' | 'Archived' | 'Closed';
  otop_percentage: number | null;
  ot_percentage: number | null;
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
  // Colonna % OTOP
  {
    accessorKey: 'otop_percentage',
    header: '% OTOP',
    cell: ({ row }) => {
      const percentage = row.original.otop_percentage;
      return (
        <div className="flex items-center gap-2">
          <Progress value={percentage ?? 0} className="w-24" />
          <span className="text-sm text-muted-foreground">{`${percentage ?? 0}%`}</span>
        </div>
      );
    },
  },
  // 2. NUOVA COLONNA: % OT
  {
    accessorKey: 'ot_percentage',
    header: '% OT',
    cell: ({ row }) => {
      const percentage = row.original.ot_percentage;
      return (
        <div className="flex items-center gap-2">
          <Progress value={percentage ?? 0} className="w-24" />
          <span className="text-sm text-muted-foreground">{`${percentage ?? 0}%`}</span>
        </div>
      );
    },
  },
  // 3. NUOVA COLONNA: Total Components
  {
    accessorKey: 'total_components',
    header: 'Total Comp.',
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
  // Colonna per le azioni
  {
    id: 'actions',
    cell: ({ row }) => {
      const project = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(project.id.toString())}>
              Copy project ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View project details</DropdownMenuItem>
            <DropdownMenuItem>Edit project</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];