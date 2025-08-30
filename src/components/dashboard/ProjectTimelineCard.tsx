'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar, Clock, TrendingUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProjectTimelineItem } from './ProjectTimelineItem';
import { ProjectWithTimeline } from './ProjectTimeline';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { enUS, it } from 'date-fns/locale';
import { useLocale } from 'next-intl';

interface ProjectTimelineCardProps {
  project: ProjectWithTimeline;
  viewMode: 'grid' | 'list';
  className?: string;
  onProjectClick?: (projectId: string | number) => void;
}

/**
 * ProjectTimelineCard - Individual project timeline card component
 * ✅ MULTI-TAB SAFE: No local state, pure presentation component
 * ✅ INFINITE LOOP SAFE: Memoized calculations with stable dependencies
 */
export function ProjectTimelineCard({
  project,
  viewMode,
  className,
  onProjectClick
}: ProjectTimelineCardProps) {
  const t = useTranslations('dashboard.timelines');
  const tCommon = useTranslations('common');
  const locale = useLocale() as 'en' | 'it';
  
  // ✅ FIXED: useMemo for date locale to prevent infinite loops 
  const dateLocale = useMemo(() => locale === 'it' ? it : enUS, [locale]);
  
  // ✅ FIXED: Memoized project dates calculation
  const projectDates = useMemo(() => {
    const startDate = new Date(project.project_start_date);
    const endDate = new Date(project.project_end_date);
    const today = new Date();
    
    // Validate dates
    const isValidStartDate = !isNaN(startDate.getTime());
    const isValidEndDate = !isNaN(endDate.getTime());
    
    if (!isValidStartDate || !isValidEndDate) {
      return {
        isValid: false,
        startDate: null,
        endDate: null,
        formattedStartDate: 'Invalid Date',
        formattedEndDate: 'Invalid Date',
        daysRemaining: 0,
        isOverdue: false,
        progress: 0
      };
    }
    
    // Calculate progress and remaining days
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();
    const progress = totalDuration > 0 ? Math.max(0, Math.min(100, (elapsed / totalDuration) * 100)) : 0;
    
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysRemaining < 0;
    
    return {
      isValid: true,
      startDate,
      endDate,
      formattedStartDate: format(startDate, 'MMM d, yyyy', { locale: dateLocale }),
      formattedEndDate: format(endDate, 'MMM d, yyyy', { locale: dateLocale }),
      daysRemaining: Math.abs(daysRemaining),
      isOverdue,
      progress: Math.round(progress)
    };
  }, [project.project_start_date, project.project_end_date, dateLocale]);
  
  // ✅ FIXED: Memoized milestone statistics
  const milestoneStats = useMemo(() => {
    const total = project.milestones?.length || 0;
    if (total === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0,
        planned: 0,
        completionRate: 0
      };
    }
    
    const today = new Date();
    let completed = 0;
    let inProgress = 0;
    let overdue = 0;
    let planned = 0;
    
    project.milestones.forEach(milestone => {
      const milestoneDate = new Date(milestone.milestone_target_date);
      
      switch (milestone.milestone_status) {
        case 'Completed':
          completed++;
          break;
        case 'In Progress':
          inProgress++;
          if (milestoneDate < today) overdue++;
          break;
        case 'Delayed':
          overdue++;
          break;
        case 'Planned':
          planned++;
          if (milestoneDate < today) overdue++;
          break;
        default:
          planned++;
      }
    });
    
    return {
      total,
      completed,
      inProgress,
      overdue,
      planned,
      completionRate: Math.round((completed / total) * 100)
    };
  }, [project.milestones]);
  
  // ✅ FIXED: Memoized project status determination
  const projectStatus = useMemo(() => {
    if (!projectDates.isValid) return 'invalid';
    if (projectDates.isOverdue) return 'overdue';
    if (milestoneStats.overdue > 0) return 'at-risk';
    if (milestoneStats.inProgress > 0) return 'in-progress';
    if (milestoneStats.completed === milestoneStats.total && milestoneStats.total > 0) return 'completed';
    return 'on-track';
  }, [projectDates.isValid, projectDates.isOverdue, milestoneStats]);
  
  // ✅ FIXED: Memoized status styling
  const statusConfig = useMemo(() => ({
    'invalid': {
      badge: 'destructive' as const,
      label: t('status.invalid'),
      description: t('status.invalidDesc')
    },
    'overdue': {
      badge: 'destructive' as const,
      label: t('status.overdue'),
      description: t('status.overdueDesc', { days: projectDates.daysRemaining })
    },
    'at-risk': {
      badge: 'destructive' as const,
      label: t('status.atRisk'),
      description: t('status.atRiskDesc', { count: milestoneStats.overdue })
    },
    'in-progress': {
      badge: 'default' as const,
      label: t('status.inProgress'),
      description: t('status.inProgressDesc')
    },
    'completed': {
      badge: 'secondary' as const,
      label: t('status.completed'),
      description: t('status.completedDesc')
    },
    'on-track': {
      badge: 'secondary' as const,
      label: t('status.onTrack'),
      description: t('status.onTrackDesc')
    }
  }), [t, projectDates.daysRemaining, milestoneStats.overdue]);
  
  const currentStatusConfig = statusConfig[projectStatus];
  
  // List View (Following Standard Dashboard Pattern)
  if (viewMode === 'list') {
    return (
      <Card className={cn(
        'hover:shadow-md transition-shadow cursor-pointer bg-background',
        className
      )} onClick={() => onProjectClick && onProjectClick(project.project_id)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left Section: Badge + Title + Timeline */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {/* Move milestone tracker to badge in left corner */}
                {milestoneStats.total > 0 && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {milestoneStats.completed}/{milestoneStats.total}
                  </Badge>
                )}
                <Badge 
                  variant={currentStatusConfig.badge}
                  className="text-xs"
                >
                  {currentStatusConfig.label}
                </Badge>
                <h3 className="font-semibold text-sm truncate">
                  {project.project_name}
                </h3>
              </div>
              
              {/* Compact timeline */}
              {projectDates.isValid && project.milestones && project.milestones.length > 0 && (
                <ProjectTimelineItem
                  milestones={project.milestones}
                  startDate={project.project_start_date}
                  endDate={project.project_end_date}
                  showToday={true}
                  compact={true}
                  showLabels={false}
                />
              )}
              
              {/* Project dates with proper icons */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <Calendar className="h-3 w-3" />
                <span>{projectDates.formattedStartDate}</span>
                <span>→</span>
                <Clock className="h-3 w-3" />
                <span>{projectDates.formattedEndDate}</span>
                {projectDates.isValid && (
                  <span className="ml-2">{projectDates.progress}% complete</span>
                )}
              </div>
            </div>
            
            {/* Right Section: Progress + Action Button */}
            <div className="flex items-center gap-4">
              {projectDates.isValid && (
                <div className="text-center">
                  <div className="w-8 sm:w-12 bg-secondary rounded-full h-2 mb-1">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${projectDates.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground hidden sm:block">{projectDates.progress}%</p>
                </div>
              )}
              
              {/* Add Open button like recent project card - icon only in list view */}
              {onProjectClick && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="ml-2" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onProjectClick(project.project_id);
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Grid View - Clean Implementation
  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg cursor-pointer bg-background",
      className
    )}>
      <CardHeader>
        <div className="flex flex-col gap-2">
          {/* ROW 1: Milestone Badge + Status Badge + Progress Bar + Action Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Move milestone tracker to badge in left corner */}
              {milestoneStats.total > 0 && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {milestoneStats.completed}/{milestoneStats.total}
                </Badge>
              )}
              <Badge variant={currentStatusConfig.badge}>
                {currentStatusConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              {/* Progress bar aligned to right */}
              {projectDates.isValid && (
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${projectDates.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground min-w-fit">
                    {projectDates.progress}%
                  </span>
                </div>
              )}
              {/* Add Open button like recent project card */}
              {onProjectClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onProjectClick(project.project_id);
                  }}
                  className="shrink-0 min-w-0"
                  aria-label="View project"
                >
                  <span className="hidden md:inline mr-1">{tCommon('open')}</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          {/* ROW 2: Project Title */}
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg truncate leading-tight">
              {project.project_name}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* ROW 3: Date Metadata with proper icons (ActionPlan Pattern) */}
        <p className="text-sm text-muted-foreground mt-2">
          <Calendar className="h-3 w-3 inline mr-1" />
          {projectDates.formattedStartDate} → 
          <Clock className="h-3 w-3 inline ml-1 mr-1" />
          {projectDates.formattedEndDate}
        </p>
        
        {/* Timeline visualization - Hybrid style with labels for grid view */}
        {projectDates.isValid && project.milestones && project.milestones.length > 0 && (
          <ProjectTimelineItem
            milestones={project.milestones}
            startDate={project.project_start_date}
            endDate={project.project_end_date}
            showToday={true}
            compact={true}
            showLabels={viewMode === 'grid'}
            className={cn(
              "mt-4",
              viewMode === 'list' && "mt-2"
            )}
          />
        )}
        
        {/* Metadata Footer (ActionPlan Pattern) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50 mt-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {milestoneStats.completed > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                <span className="whitespace-nowrap">{milestoneStats.completed} completed</span>
              </div>
            )}
            {milestoneStats.inProgress > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                <span className="whitespace-nowrap">{milestoneStats.inProgress} in progress</span>
              </div>
            )}
            {milestoneStats.overdue > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                <span className="whitespace-nowrap">{milestoneStats.overdue} overdue</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 self-start sm:self-auto">
            <TrendingUp className="h-3 w-3 shrink-0" />
            <span className="whitespace-nowrap">{milestoneStats.completionRate}% complete</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}