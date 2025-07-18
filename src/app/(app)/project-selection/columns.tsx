'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown, FilePenLine, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { StackedProgressBar } from './stacked-progress-bar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
  overdue_action_plans_count: number | null;
  next_milestone_name: string | null;
  next_milestone_date: string | null;
};

// Funzione helper per calcolare il tempo rimanente
const formatTimeRemaining = (dateString: string | null): { text: string; className: string } => {
    if (!dateString) return { text: '-', className: 'text-muted-foreground' };
    const milestoneDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = milestoneDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)} days`, className: 'text-destructive' };
    if (diffDays <= 7) return { text: `in ${diffDays} days`, className: 'text-amber-600' };
    return { text: `in ${diffDays} days`, className: 'text-muted-foreground' };
};

export const columns: ColumnDef<Project>[] = [
  // Colonna per la selezione multipla
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
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
      <Button variant="ghost" className="font-medium" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
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
  // Colonna "Status"
  {
    accessorKey: 'project_status',
    header: () => <div className="font-medium text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.getValue('project_status') as string;
      return (
        <div className="text-center">
            <Badge variant={status === 'Active' ? 'default' : 'secondary'}>{status}</Badge>
        </div>
      );
    },
  },
  // Colonna "Risks"
  {
    id: 'risks',
    header: () => <div className="font-medium text-center">Risks</div>,
    cell: ({ row }) => {
        const count = row.original.overdue_action_plans_count;
        if (!count || count === 0) {
            return (
                <div className="flex justify-center">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">no overdues</Badge>
                </div>
            );
        }
        return (
            <div className="flex justify-center">
                <Badge variant="destructive" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                    {count} overdue
                </Badge>
            </div>
        );
    }
  },
  // Colonna: Items (ex Comps.)
  {
    accessorKey: 'total_components',
    header: () => <div className="font-medium text-center">Items</div>,
    cell: ({ row }) => {
      const total = row.original.total_components ?? 0;
      return (
        <div className="flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="default">{total}</Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total items in this project</p>
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
    header: () => <div className="font-medium">Maturity Index</div>,
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
  // Colonna "Next Milestone"
  {
    accessorKey: 'next_milestone_date',
    header: ({ column }) => (
        <Button variant="ghost" className="font-medium" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Next Milestone
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => {
      const milestone = row.original.next_milestone_name;
      const dateInfo = formatTimeRemaining(row.original.next_milestone_date);
      if (!milestone) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <div className="flex flex-col">
          <span className="font-medium">{milestone}</span>
          <span className={cn("text-xs", dateInfo.className)}>
            {dateInfo.text}
          </span>
        </div>
      );
    },
  },
  // Colonna: Edit (ex Actions)
  {
    id: 'actions',
    header: () => <div className="font-medium text-center">Edit</div>,
    cell: ({ row }) => {
      return (
        <div className="flex justify-center">
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
                        <p>Edit This Project</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      );
    },
  },
];