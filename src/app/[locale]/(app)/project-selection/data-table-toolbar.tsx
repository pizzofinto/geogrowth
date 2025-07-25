'use client';

import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Trash2, FileUp, Settings2 } from 'lucide-react';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  roles: string[];
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export function DataTableToolbar<TData>({
  table,
  roles,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
}: DataTableToolbarProps<TData>) {
  const numSelected = table.getFilteredSelectedRowModel().rows.length;

  // Definiamo i permessi in base ai ruoli aggiornati
  const canCreateProject = roles.includes('Super User') || roles.includes('Supplier Quality');
  const canDeleteProject = roles.includes('Super User') || roles.includes('Supplier Quality');
  const canChangeStatus = roles.includes('Super User') || roles.includes('Supplier Quality');

  return (
    <div className="flex items-center justify-between mb-4">
      {/* Controlli a sinistra: Azioni, Ricerca, Filtro */}
      <div className="flex items-center space-x-2">
        {numSelected > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10">
                Actions ({numSelected})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Mostra "Change Status" solo se l'utente ha i permessi */}
              {canChangeStatus && (
                <DropdownMenuItem>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Change Status
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <FileUp className="mr-2 h-4 w-4" />
                Export Selected
              </DropdownMenuItem>
              {/* Mostra "Delete Selected" solo se l'utente ha i permessi */}
              {canDeleteProject && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <Input
          placeholder="Search by name or code..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="h-10 w-[150px] lg:w-[250px]"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-10">
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
      
      {/* Pulsante a destra */}
      {canCreateProject && (
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Project
        </Button>
      )}
    </div>
  );
}