'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Calendar, Clock } from 'lucide-react';

type Milestone = {
  milestone_name: string;
  milestone_target_date: string;
  milestone_status: 'Planned' | 'In Progress' | 'Completed' | 'Delayed' | 'Skipped' | 'Cancelled';
};

type ModernHorizontalTimelineProps = {
  milestones: Milestone[];
  startDate: string;
  endDate: string;
  className?: string;
  showToday?: boolean;
};

// Funzione helper per calcolare la posizione percentuale di una data in un intervallo
const getDatePosition = (date: Date, start: Date, end: Date): number => {
  const totalDuration = end.getTime() - start.getTime();
  if (totalDuration <= 0) return 0;
  const elapsed = date.getTime() - start.getTime();
  const position = (elapsed / totalDuration) * 100;
  return Math.max(0, Math.min(position, 100));
};

// Funzione helper per determinare lo stato visuale di una milestone
const getMilestoneStatus = (milestone: Milestone, today: Date) => {
  const milestoneDate = new Date(milestone.milestone_target_date);
  
  switch (milestone.milestone_status) {
    case 'Completed':
      return 'completed';
    case 'Cancelled':
    case 'Skipped':
      return 'cancelled';
    case 'Delayed':
      return 'delayed';
    case 'In Progress':
      return milestoneDate < today ? 'overdue' : 'in-progress';
    case 'Planned':
      return milestoneDate < today ? 'overdue' : 'planned';
    default:
      return 'planned';
  }
};

// Configurazione colori shadcn/ui
const statusConfig = {
  completed: {
    className: 'fill-primary stroke-primary'
  },
  cancelled: {
    className: 'fill-muted stroke-muted-foreground'
  },
  delayed: {
    className: 'fill-destructive stroke-destructive'
  },
  overdue: {
    className: 'fill-destructive stroke-destructive'
  },
  'in-progress': {
    className: 'fill-warning stroke-warning'
  },
  planned: {
    className: 'fill-background stroke-border'
  }
};

// Funzione per calcolare giorni rimanenti
const getDaysRemaining = (targetDate: Date, today: Date): string => {
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days ago`;
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else {
    return `${diffDays} days`;
  }
};

export function ModernHorizontalTimeline({ 
  milestones, 
  startDate, 
  endDate, 
  className,
  showToday = true 
}: ModernHorizontalTimelineProps) {
  // Validazione input
  if (!milestones || milestones.length === 0) {
    return (
      <div className={cn("w-full h-20 flex items-center justify-center text-muted-foreground", className)}>
        <Calendar className="w-4 h-4 mr-2" />
        <span className="text-sm">No milestones available</span>
      </div>
    );
  }

  // Validazione date
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return (
      <div className={cn("w-full h-20 flex items-center justify-center text-destructive", className)}>
        <span className="text-sm">Invalid project dates</span>
      </div>
    );
  }

  if (start >= end) {
    return (
      <div className={cn("w-full h-20 flex items-center justify-center text-destructive", className)}>
        <span className="text-sm">Start date must be before end date</span>
      </div>
    );
  }

  // Filtra milestone con date valide
  const validMilestones = milestones.filter(milestone => {
    const milestoneDate = new Date(milestone.milestone_target_date);
    return !isNaN(milestoneDate.getTime());
  });

  if (validMilestones.length === 0) {
    return (
      <div className={cn("w-full h-20 flex items-center justify-center text-muted-foreground", className)}>
        <span className="text-sm">No milestones with valid dates</span>
      </div>
    );
  }

  const todayPosition = getDatePosition(today, start, end);

  return (
    <TooltipProvider>
      <div className={cn("relative w-full h-20", className)}>
        {/* Contenitore principale con altezza fissa */}
        <div className="relative w-full h-full flex items-center">
          
          {/* SVG per la linea timeline - mantiene aspect ratio */}
          <svg 
            width="100%" 
            height="4" 
            viewBox="0 0 100 1" 
            preserveAspectRatio="none"
            className="absolute top-1/2 transform -translate-y-1/2"
          >
            {/* Linea di base della timeline */}
            <line 
              x1="0" 
              y1="0.5" 
              x2="100" 
              y2="0.5" 
              className="stroke-border" 
              strokeWidth="0.25" 
            />
            
            {/* Linea di progresso fino a oggi */}
            {showToday && todayPosition >= 0 && todayPosition <= 100 && (
              <line 
                x1="0" 
                y1="0.5" 
                x2={todayPosition} 
                y2="0.5" 
                className="stroke-primary" 
                strokeWidth="0.5" 
              />
            )}
          </svg>

          {/* Marcatori di inizio e fine progetto (quadrati) */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-3 h-3 bg-border border border-border rotate-45 cursor-pointer"></div>
              </TooltipTrigger>
              <TooltipContent>
                <div>
                  <p className="font-semibold">Project Start</p>
                  <p className="text-sm text-muted-foreground">
                    {start.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-3 h-3 bg-border border border-border rotate-45 cursor-pointer"></div>
              </TooltipTrigger>
              <TooltipContent>
                <div>
                  <p className="font-semibold">Project End</p>
                  <p className="text-sm text-muted-foreground">
                    {end.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Nodo per "Oggi" */}
          {showToday && todayPosition >= 0 && todayPosition <= 100 && (
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${todayPosition}%` }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-3 h-3 bg-primary rounded-full cursor-pointer ring-2 ring-background"></div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <div>
                      <p className="font-semibold">Today</p>
                      <p className="text-sm text-muted-foreground">
                        {today.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Milestone con etichette sopra e sotto */}
          {validMilestones.map((milestone, index) => {
            const milestoneDate = new Date(milestone.milestone_target_date);
            const position = getDatePosition(milestoneDate, start, end);
            
            // Skip milestone se fuori dal range visibile
            if (position < 0 || position > 100) return null;
            
            const status = getMilestoneStatus(milestone, today);
            const config = statusConfig[status];
            const daysRemaining = getDaysRemaining(milestoneDate, today);
            
            return (
              <div
                key={`${milestone.milestone_name}-${index}`}
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                {/* Nome milestone sopra */}
                <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs font-medium text-foreground bg-background px-1 rounded">
                    {milestone.milestone_name}
                  </span>
                </div>

                {/* Cerchio milestone */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 cursor-pointer ring-2 ring-background transition-all duration-200 hover:scale-110",
                      status === 'completed' && "bg-primary border-primary",
                      status === 'cancelled' && "bg-muted border-muted-foreground",
                      status === 'delayed' && "bg-destructive border-destructive",
                      status === 'overdue' && "bg-destructive border-destructive",
                      status === 'in-progress' && "bg-yellow-500 border-black",
                      status === 'planned' && "bg-background border-border"
                    )}>
                      {/* Indicatore speciale per milestone in progress e overdue */}
                      {(status === 'in-progress' || status === 'overdue') && (
                        <div className="w-2 h-2 bg-black rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="text-sm">{milestone.milestone_status}</span>
                  </TooltipContent>
                </Tooltip>

                {/* Data e countdown sotto */}
                <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap">
                  <div className="text-xs text-muted-foreground">
                    {milestoneDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className={cn(
                    "text-xs font-medium mt-1",
                    status === 'overdue' && "text-destructive",
                    status === 'completed' && "text-primary",
                    status === 'in-progress' && "text-yellow-600",
                    (status === 'planned' || status === 'delayed') && "text-foreground"
                  )}>
                    {daysRemaining}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Etichette date ai bordi - spostate più in basso */}
        <div className="absolute bottom-0 left-0">
          <span className="text-xs text-muted-foreground">
            {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div className="absolute bottom-0 right-0">
          <span className="text-xs text-muted-foreground">
            {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}