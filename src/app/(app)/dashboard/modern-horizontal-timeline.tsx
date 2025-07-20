'use client';

import * as React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Tipi di dati per il componente
type Milestone = {
  milestone_name: string;
  milestone_target_date: string;
  milestone_status: 'Planned' | 'In Progress' | 'Completed' | 'Delayed' | 'Skipped';
};

type ModernHorizontalTimelineProps = {
  milestones: Milestone[];
};

// Funzione helper per lo stile dei nodi della timeline
const getStatusClasses = (status: Milestone['milestone_status']) => {
    switch (status) {
        case 'Completed': 
            return 'fill-primary stroke-primary';
        case 'In Progress': 
            return 'fill-primary stroke-primary animate-pulse';
        case 'Delayed': 
            return 'fill-destructive stroke-destructive';
        default: 
            return 'fill-background stroke-muted-foreground';
    }
}

// Funzione helper per il conto alla rovescia
const formatTimeRemaining = (dateString: string): string => {
    const milestoneDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = milestoneDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Overdue`;
    if (diffDays === 0) return `Today`;
    return `in ${diffDays} days`;
};

export function ModernHorizontalTimeline({ milestones }: ModernHorizontalTimelineProps) {
  const milestonesPerPage = 4; // Numero di milestone da mostrare alla volta

  // Logica per impostare la vista iniziale sulla milestone "In Progress"
  const [startIndex, setStartIndex] = React.useState(() => {
    const inProgressIndex = milestones.findIndex(m => m.milestone_status === 'In Progress');
    if (inProgressIndex !== -1) {
      // Centra la vista sulla milestone in corso
      const centeredStartIndex = inProgressIndex - Math.floor(milestonesPerPage / 2);
      // Assicurati che l'indice non sia negativo o troppo alto
      return Math.max(0, Math.min(centeredStartIndex, milestones.length - milestonesPerPage));
    }
    return 0; // Altrimenti, parti dall'inizio
  });

  const canGoBack = startIndex > 0;
  const canGoForward = startIndex < milestones.length - milestonesPerPage;

  const handlePrevious = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(milestones.length - milestonesPerPage, prev + 1));
  };

  const visibleMilestones = milestones.slice(startIndex, startIndex + milestonesPerPage);

  return (
    <div className="flex items-center gap-2">
      {/* Pulsante Sinistro */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevious}
        disabled={!canGoBack}
        className="h-8 w-8 shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous milestones</span>
      </Button>

      {/* Contenitore della Timeline */}
      <div className="relative w-full px-4 py-2 flex-1">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0"></div>
        
        <div className="relative flex justify-between">
          {visibleMilestones.map((milestone, index) => (
            <div key={index} className="flex flex-col items-center text-center z-10 bg-background px-1">
              <p className="text-xs font-medium text-muted-foreground mb-2 whitespace-nowrap h-8 flex items-end">{milestone.milestone_name}</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-4 w-4 rounded-full flex items-center justify-center">
                       <svg width="12" height="12" viewBox="0 0 12 12">
                          <circle 
                              cx="6" 
                              cy="6" 
                              r="5" 
                              className={cn("stroke-2", getStatusClasses(milestone.milestone_status))}
                          />
                      </svg>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Status: {milestone.milestone_status}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="mt-2 text-xs h-8">
                <p className="text-muted-foreground">
                  {new Date(milestone.milestone_target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="font-semibold text-amber-600">
                  {formatTimeRemaining(milestone.milestone_target_date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pulsante Destro */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        disabled={!canGoForward}
        className="h-8 w-8 shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next milestones</span>
      </Button>
    </div>
  );
}