'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Tipi di dati per il componente
type Milestone = {
  milestone_name: string;
  milestone_target_date: string;
  milestone_status: 'Planned' | 'In Progress' | 'Completed' | 'Delayed' | 'Skipped';
};

type ProjectTimelineProps = {
  projectName: string;
  milestones: Milestone[];
};

// Funzione helper per calcolare il tempo rimanente e il colore
const formatTimeRemaining = (dateString: string): { text: string; className: string } => {
    const milestoneDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = milestoneDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Overdue`, className: 'text-destructive' };
    if (diffDays === 0) return { text: `Today`, className: 'text-amber-600 font-bold' };
    if (diffDays <= 7) return { text: `in ${diffDays} days`, className: 'text-amber-600' };
    return { text: `in ${diffDays} days`, className: 'text-muted-foreground' };
};

// Funzione helper per lo stile dei nodi della timeline
const getStatusClass = (status: Milestone['milestone_status']) => {
    switch (status) {
        case 'Completed': return 'bg-green-500';
        case 'In Progress': return 'bg-blue-500 ring-4 ring-blue-500/30';
        case 'Delayed': return 'bg-destructive';
        default: return 'bg-muted-foreground';
    }
}

export function ProjectTimeline({ projectName, milestones }: ProjectTimelineProps) {
  return (
    <div className="flex items-start space-x-4">
      <div className="w-1/4 pt-1">
        <p className="font-semibold truncate">{projectName}</p>
      </div>
      <div className="w-3/4 relative pl-4">
        {/* Linea orizzontale della timeline */}
        <div className="absolute left-2 top-2 h-full w-0.5 bg-border -translate-x-1/2"></div>
        
        <div className="space-y-6">
          {milestones.map((milestone, index) => {
            const dateInfo = formatTimeRemaining(milestone.milestone_target_date);
            return (
              <div key={index} className="flex items-start space-x-4 relative">
                {/* Nodo della timeline */}
                <div className={cn("mt-1 flex-shrink-0 h-4 w-4 rounded-full", getStatusClass(milestone.milestone_status))}></div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{milestone.milestone_name}</p>
                    <Badge variant="outline">
                      {new Date(milestone.milestone_target_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                    </Badge>
                  </div>
                  <p className={cn("text-sm", dateInfo.className)}>{dateInfo.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}