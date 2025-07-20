'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Tipi di dati per il componente
type Milestone = {
  milestone_name: string;
  milestone_target_date: string;
  milestone_status: 'Planned' | 'In Progress' | 'Completed' | 'Delayed' | 'Skipped';
};

type HorizontalProjectTimelineProps = {
  projectName: string;
  milestones: Milestone[];
};

// Funzione helper per calcolare il tempo rimanente
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

export function HorizontalProjectTimeline({ projectName, milestones }: HorizontalProjectTimelineProps) {
  return (
    <div>
      <p className="font-semibold truncate mb-4">{projectName}</p>
      <div className="overflow-x-auto pb-4">
        <div className="inline-flex items-center">
          {milestones.map((milestone, index) => (
            <div key={index} className="flex items-center">
              {/* Gruppo Milestone: Badge a sinistra, testi a destra */}
              <div className="flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant={milestone.milestone_status === 'In Progress' ? 'default' : 'secondary'}
                        className="z-10 px-3 py-1 text-xs font-semibold"
                      >
                        {milestone.milestone_name}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Status: {milestone.milestone_status}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Data e conto alla rovescia a destra del badge */}
                <div className="ml-3 text-left">
                  <p className="text-xs text-muted-foreground">
                    {new Date(milestone.milestone_target_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                  </p>
                  <p className="text-xs text-amber-600 font-semibold">
                    {formatTimeRemaining(milestone.milestone_target_date)}
                  </p>
                </div>
              </div>

              {/* Linea di connessione (non mostrata dopo l'ultimo elemento) */}
              {index < milestones.length - 1 && (
                <div className="w-12 shrink-0 h-0.5 bg-border mx-4"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}