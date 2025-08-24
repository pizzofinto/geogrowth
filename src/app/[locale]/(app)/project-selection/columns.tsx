'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown, FilePenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MaturityIndex, MaturityIndexData } from '@/components/shared/MaturityIndex';
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
  last_accessed?: string;
  // Aggiungi se disponibili:
  // new_percentage?: number;
  // incomplete_percentage?: number;
  // not_off_tool_percentage?: number;
};

// Funzione helper per calcolare il tempo rimanente
type TranslationFunction = (key: string, values?: Record<string, string | number>) => string;

const formatTimeRemaining = (dateString: string | null, t: TranslationFunction): { text: string; className: string } => {
    if (!dateString) return { text: '-', className: 'text-muted-foreground' };
    const milestoneDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = milestoneDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { 
            text: t('overdueByDays', { days: Math.abs(diffDays) }), 
            className: 'text-destructive' 
        };
    }
    if (diffDays <= 7) {
        return { 
            text: t('inDays', { days: diffDays }), 
            className: 'text-amber-600' 
        };
    }
    return { 
        text: t('inDays', { days: diffDays }), 
        className: 'text-muted-foreground' 
    };
};

export const getColumns = (t: TranslationFunction): ColumnDef<Project>[] => [
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
        {t('projectName')}
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
    header: () => <div className="font-medium text-center">{t('status')}</div>,
    cell: ({ row }) => {
      const status = row.getValue('project_status') as string;
      return (
        <div className="text-center">
            <Badge variant={status === 'Active' ? 'default' : 'secondary'}>
              {t(status.toLowerCase())}
            </Badge>
        </div>
      );
    },
  },
  // Colonna "Risks"
  {
    id: 'risks',
    header: () => <div className="font-medium text-center">{t('risks')}</div>,
    cell: ({ row }) => {
        const count = row.original.overdue_action_plans_count;
        if (!count || count === 0) {
            return (
                <div className="flex justify-center">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      {t('noOverdues')}
                    </Badge>
                </div>
            );
        }
        return (
            <div className="flex justify-center">
                <Badge variant="destructive" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                    {count} {t('overdue')}
                </Badge>
            </div>
        );
    }
  },
  // Colonna: Items (ex Comps.)
  {
    accessorKey: 'total_components',
    header: () => <div className="font-medium text-center">{t('items')}</div>,
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
                <p>{t('totalItemsTooltip')}</p>
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
    header: () => <div className="font-medium">{t('maturityIndex')}</div>,
    cell: ({ row }) => {
      const project = row.original;
      
      // Prepara i dati per il componente MaturityIndex
      const maturityData: MaturityIndexData = {
        otop: project.otop_percentage ?? 0,
        ot: project.ot_percentage ?? 0,
        ko: project.ko_percentage ?? 0,
        // Aggiungi altri stati se disponibili nel database
        // new: project.new_percentage,
        // incomplete: project.incomplete_percentage,
        // notOffTool: project.not_off_tool_percentage,
      };

      return (
        <div className="w-48">
          <MaturityIndex 
            data={maturityData}
            variant="compact"
            showLabels={false}
            showTrend={false}
            hideTitle={true}
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
            {t('nextMilestone')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => {
      const milestone = row.original.next_milestone_name;
      const dateInfo = formatTimeRemaining(row.original.next_milestone_date, t);
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
    header: () => <div className="font-medium text-center">{t('projectEdit')}</div>,
    cell: ({ row }) => {
      return (
        <div className="flex justify-center">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link href={`/projects/${row.original.id}/edit`}>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{t('projectEdit')}</span>
                                <FilePenLine className="h-4 w-4" />
                            </Button>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t('projectEdit')}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      );
    },
  },
]; // Fine dell'array columns, ora è il return della funzione