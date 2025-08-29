'use client';

import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Calendar, Clock } from 'lucide-react';

type Milestone = {
  milestone_name: string;
  milestone_target_date: string;
  milestone_status: 'Planned' | 'In Progress' | 'Completed' | 'Delayed' | 'Skipped' | 'Cancelled';
};

interface ProjectTimelineItemProps {
  milestones: Milestone[];
  startDate: string;
  endDate: string;
  className?: string;
  showToday?: boolean;
  compact?: boolean;
  showLabels?: boolean; // New prop to control milestone label visibility
}

/**
 * ProjectTimelineItem - Timeline visualization component
 * ✅ MULTI-TAB SAFE: Pure component with no local state
 * ✅ INFINITE LOOP SAFE: All calculations memoized with stable dependencies
 * 
 * This is a reusable version of the ModernHorizontalTimeline component
 * with improved multi-tab safety and better performance
 */
export function ProjectTimelineItem({ 
  milestones, 
  startDate, 
  endDate, 
  className,
  showToday = true,
  compact = false,
  showLabels = false
}: ProjectTimelineItemProps) {

  // ✅ FIXED: Define helper functions first
  const getMilestoneStatus = useMemo(() => 
    (milestone: Milestone, today: Date) => {
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
    }, []
  );

  // ✅ FIXED: Memoized date calculations to prevent infinite loops
  const timelineData = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        isValid: false,
        start: null,
        end: null,
        today: null,
        todayPosition: 0,
        validMilestones: []
      };
    }

    if (start >= end) {
      return {
        isValid: false,
        start: null,
        end: null,
        today: null,
        todayPosition: 0,
        validMilestones: []
      };
    }

    // Calculate today's position
    const totalDuration = end.getTime() - start.getTime();
    const todayElapsed = today.getTime() - start.getTime();
    const todayPosition = totalDuration > 0 ? Math.max(0, Math.min(100, (todayElapsed / totalDuration) * 100)) : 0;

    // Filter and process milestones
    const validMilestones = milestones.filter(milestone => {
      const milestoneDate = new Date(milestone.milestone_target_date);
      return !isNaN(milestoneDate.getTime());
    }).map(milestone => {
      const milestoneDate = new Date(milestone.milestone_target_date);
      const elapsed = milestoneDate.getTime() - start.getTime();
      const position = totalDuration > 0 ? Math.max(0, Math.min(100, (elapsed / totalDuration) * 100)) : 0;
      
      return {
        ...milestone,
        date: milestoneDate,
        position,
        status: getMilestoneStatus(milestone, today)
      };
    });

    return {
      isValid: true,
      start,
      end,
      today,
      todayPosition,
      validMilestones
    };
  }, [milestones, startDate, endDate, getMilestoneStatus]);

  const getDaysRemaining = useMemo(() => 
    (targetDate: Date, today: Date): string => {
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
    }, []
  );

  // Early return for invalid data
  if (!timelineData.isValid || !milestones || milestones.length === 0) {
    // Dynamic height: h-8 for no labels, h-20 for labels above+below, h-20 for full timeline
    const height = compact && !showLabels ? "h-8" : showLabels ? "h-20" : "h-20";
    return (
      <div className={cn(`w-full ${height} flex items-center justify-center text-muted-foreground`, className)}>
        <Calendar className="w-4 h-4 mr-2" />
        <span className="text-sm">
          {!timelineData.isValid ? 'Invalid project dates' : 'No milestones available'}
        </span>
      </div>
    );
  }

  const { start, end, today, todayPosition, validMilestones } = timelineData;

  // Render progress bar timeline (hybrid version)
  if (compact) {
    // Dynamic height: h-8 for no labels, h-20 for labels above+below
    const containerHeight = showLabels ? "h-24" : "h-8";
    
    return (
      <TooltipProvider>
        <div className={cn(`relative w-full ${containerHeight}`, className)}>
          {/* Progress bar timeline container */}
          <div className="flex items-center gap-2 w-full h-full">
            {/* Progress bar */}
            <div className="flex-1 relative h-full flex items-center">
              {/* Simple timeline progress bar */}
              <div className="w-full h-2 bg-secondary rounded-full relative">
                {/* Progress indicator up to today */}
                {showToday && todayPosition > 0 && (
                  <div 
                    className="absolute top-0 h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(todayPosition, 100)}%` }}
                  />
                )}
                
                {/* Milestone markers */}
                {validMilestones.map((milestone, index) => {
                  if (milestone.position < 0 || milestone.position > 100) return null;
                  
                  const daysRemaining = getDaysRemaining(milestone.date, today!);
                  
                  return (
                    <div key={`${milestone.milestone_name}-${index}`}>
                      {/* Milestone name above dot (only if showLabels) */}
                      {showLabels && (
                        <div 
                          className="absolute bottom-full mb-2 z-10"
                          style={{ left: `${milestone.position}%`, transform: 'translateX(-50%)' }}
                        >
                          <div className="text-xs font-medium text-foreground bg-background px-2 py-1 rounded border shadow-sm whitespace-nowrap">
                            {milestone.milestone_name}
                          </div>
                        </div>
                      )}
                      
                      {/* Date and day count below dot (only if showLabels) */}
                      {showLabels && (
                        <div 
                          className="absolute top-full mt-1"
                          style={{ left: `${milestone.position}%`, transform: 'translateX(-50%)' }}
                        >
                          <div className="text-center whitespace-nowrap">
                            <div className="text-xs text-muted-foreground">
                              {milestone.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                            <div className={cn(
                              "text-xs font-medium",
                              milestone.status === 'overdue' && "text-destructive",
                              milestone.status === 'completed' && "text-green-600",
                              milestone.status === 'in-progress' && "text-blue-600",
                              milestone.status === 'delayed' && "text-orange-600",
                              (milestone.status === 'planned' || milestone.status === 'cancelled') && "text-muted-foreground"
                            )}>
                              {daysRemaining}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Milestone dot */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                            style={{ left: `${milestone.position}%` }}
                          >
                            <div className={cn(
                              "w-3 h-3 rounded-full border-2 border-background cursor-pointer transition-all duration-200 hover:scale-110",
                              // ✅ Improved color scheme for better UX
                              milestone.status === 'completed' && "bg-green-500 border-green-500",
                              milestone.status === 'in-progress' && "bg-blue-500 border-blue-500", 
                              milestone.status === 'planned' && "bg-transparent border-gray-400 border-2",
                              milestone.status === 'delayed' && "bg-orange-500 border-orange-500",
                              milestone.status === 'overdue' && "bg-red-500 border-red-500",
                              milestone.status === 'cancelled' && "bg-gray-400 border-gray-400"
                            )} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div>
                            <p className="font-semibold">{milestone.milestone_name}</p>
                            <p className="text-sm text-muted-foreground">{milestone.milestone_status}</p>
                            <p className="text-xs text-muted-foreground">
                              {milestone.date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })} • {daysRemaining}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
                
                {/* Today marker - Black diamond */}
                {showToday && todayPosition >= 0 && todayPosition <= 100 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                        style={{ left: `${todayPosition}%` }}
                      >
                        <div className="w-2.5 h-2.5 bg-black dark:bg-white rotate-45 border border-gray-300 dark:border-gray-700 shadow-sm cursor-pointer" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">Today</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            
            {/* Milestone summary (only show if not showing labels) */}
            {!showLabels && (
              <div className="flex items-center gap-2 text-xs">
                {validMilestones.filter(m => m.status === 'completed').length > 0 && (
                  <span className="text-green-600 font-medium">{validMilestones.filter(m => m.status === 'completed').length}✓</span>
                )}
                {validMilestones.filter(m => m.status === 'in-progress').length > 0 && (
                  <span className="text-blue-600 font-medium">{validMilestones.filter(m => m.status === 'in-progress').length}🔄</span>
                )}
                {validMilestones.filter(m => m.status === 'overdue' || m.status === 'delayed').length > 0 && (
                  <span className="text-red-600 font-medium">{validMilestones.filter(m => m.status === 'overdue' || m.status === 'delayed').length}⚠</span>
                )}
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Render full version for grid view
  return (
    <TooltipProvider>
      <div className={cn("relative w-full h-20", className)}>
        {/* Main container with fixed height */}
        <div className="relative w-full h-full flex items-center">
          
          {/* SVG timeline - maintains aspect ratio */}
          <svg 
            width="100%" 
            height="4" 
            viewBox="0 0 100 1" 
            preserveAspectRatio="none"
            className="absolute top-1/2 transform -translate-y-1/2"
          >
            {/* Base timeline */}
            <line 
              x1="0" 
              y1="0.5" 
              x2="100" 
              y2="0.5" 
              className="stroke-border" 
              strokeWidth="0.75" 
            />
            
            {/* Progress line up to today */}
            {showToday && todayPosition >= 0 && todayPosition <= 100 && (
              <line 
                x1="0" 
                y1="0.5" 
                x2={todayPosition} 
                y2="0.5" 
                className="stroke-primary" 
                strokeWidth="1" 
              />
            )}
          </svg>

          {/* Start marker */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-3 h-3 bg-black border border-black rotate-45 cursor-pointer"></div>
              </TooltipTrigger>
              <TooltipContent>
                <div>
                  <p className="font-semibold">Project Start</p>
                  <p className="text-sm text-muted-foreground">
                    {start?.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* End marker */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-3 h-3 bg-black border border-black rotate-45 cursor-pointer"></div>
              </TooltipTrigger>
              <TooltipContent>
                <div>
                  <p className="font-semibold">Project End</p>
                  <p className="text-sm text-muted-foreground">
                    {end?.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Today marker */}
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
                        {today?.toLocaleDateString('en-US', { 
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

          {/* Milestone markers */}
          {validMilestones.map((milestone, index) => {
            // Skip if outside visible range
            if (milestone.position < 0 || milestone.position > 100) return null;
            
            const daysRemaining = getDaysRemaining(milestone.date, today!);
            
            return (
              <div
                key={`${milestone.milestone_name}-${index}`}
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${milestone.position}%` }}
              >
                {/* Milestone name above */}
                <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs font-medium text-foreground bg-background px-1 rounded">
                    {milestone.milestone_name}
                  </span>
                </div>

                {/* Milestone circle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      {/* Background mask to hide timeline line */}
                      <div className="absolute inset-0 w-4 h-4 rounded-full bg-white dark:bg-gray-900"></div>
                      {/* Milestone dot */}
                      <div className={cn(
                        "relative w-4 h-4 rounded-full border-2 cursor-pointer ring-2 ring-background transition-all duration-200 hover:scale-110",
                        milestone.status === 'completed' && "bg-primary border-primary",
                        milestone.status === 'cancelled' && "bg-muted border-muted-foreground", 
                        milestone.status === 'delayed' && "bg-destructive border-destructive",
                        milestone.status === 'overdue' && "bg-destructive border-destructive",
                        milestone.status === 'in-progress' && "bg-yellow-500 border-black",
                        milestone.status === 'planned' && "bg-transparent border-border"
                      )}>
                      {/* Enhanced animated indicator for in-progress and overdue */}
                      {(milestone.status === 'in-progress' || milestone.status === 'overdue') && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          {/* Pulsating ring effect */}
                          <div className="w-6 h-6 rounded-full border border-white/50 animate-ping absolute"></div>
                          <div className="w-4 h-4 rounded-full border border-white/30 animate-pulse absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                          {/* Main pulsating dot */}
                          <div className="w-3 h-3 bg-white rounded-full shadow-lg animate-pulse absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                        </div>
                      )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="text-sm">{milestone.milestone_status}</span>
                  </TooltipContent>
                </Tooltip>

                {/* Date and countdown below */}
                <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap">
                  <div className="text-xs text-muted-foreground">
                    {milestone.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className={cn(
                    "text-xs font-medium mt-1",
                    milestone.status === 'overdue' && "text-destructive",
                    milestone.status === 'completed' && "text-primary",
                    milestone.status === 'in-progress' && "text-yellow-600",
                    (milestone.status === 'planned' || milestone.status === 'delayed') && "text-foreground"
                  )}>
                    {daysRemaining}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Date labels at edges */}
        <div className="absolute bottom-0 left-0">
          <span className="text-xs text-muted-foreground">
            {start?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div className="absolute bottom-0 right-0">
          <span className="text-xs text-muted-foreground">
            {end?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}