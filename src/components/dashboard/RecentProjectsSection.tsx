'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowRight, 
  TrendingUp, 
  AlertTriangle,
  FolderOpen,
  Grid3X3,
  List,
  Calendar,
  ExternalLink,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { useRecentProjects } from '@/hooks/useRecentProjects';
import { formatLastAccessed, formatMilestoneDate } from '@/utils/dateUtils';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation'
import { MaturityIndex, MaturityIndexData }  from '@/components/shared/MaturityIndex';
import { cn } from '@/lib/utils';

{/* Utility function for conditional class names
const cn = (...classes: (string | undefined | null | false)[]) => 
  classes.filter(Boolean).join(' ');*/}

{/*/ MaturityBar component with OTOP/OT/KO colors and percentages below
const MaturityBar = ({ otop, ot, ko, showPercentages = true }: { 
  otop: number; 
  ot: number; 
  ko: number; 
  showPercentages?: boolean;
}) => (
  <div className="space-y-2">
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full flex">
        <div className="bg-green-500" style={{ width: `${otop}%` }} />
        <div className="bg-[hsl(var(--ot-color))]" style={{ width: `${ot}%` }} />
        <div className="bg-red-500" style={{ width: `${ko}%` }} />
      </div>
    </div>
    {showPercentages && (
      <div className="flex justify-between text-xs text-gray-500">
        <span>OTOP {Math.round(otop)}%</span>
        <span>OT {Math.round(ot)}%</span>
        <span>KO {Math.round(ko)}%</span>
      </div>
    )}
  </div>
); */}

interface ProjectCardProps {
  project: any;
  compact?: boolean;
  listView?: boolean;
  onProjectClick: (projectId: number) => void;
}

// Card per singolo progetto con MaturityIndex integrato
const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  compact = false,
  listView = false,
  onProjectClick 
  }) => {
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  // Prepara i dati per il MaturityIndex
  const maturityData: MaturityIndexData = {
    otop: project.otop_percentage ?? 0,
    ot: project.ot_percentage ?? 0,
    ko: project.ko_percentage ?? 0,
    lastUpdated: project.last_accessed ? new Date(project.last_accessed) : undefined,
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Active': return tCommon('active');
      case 'Archived': return tCommon('archived');
      case 'Closed': return tCommon('closed');
      default: return status;
    }
  };

  const handleClick = () => {
    if (onProjectClick) {
      console.log('Clicking project:', project.project_id);  // Aggiungi log
      onProjectClick(project.project_id);
    }
  };

  // Vista Lista
  if (listView) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={project.project_status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                  {getStatusText(project.project_status)}
                </Badge>
                <h3 className="font-semibold text-base truncate">{project.project_name}</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {tDashboard('lastAccessed')} {formatLastAccessed(project.last_accessed)}
              </p>
            </div>
            
            {/* MaturityIndex nella versione lista */}
            <div className="hidden sm:block w-32 md:w-40">
              <MaturityIndex 
                data={maturityData}
                variant="minimal"
              />
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="font-semibold">{project.total_components}</p>
                <p className="text-xs text-muted-foreground">{tDashboard('items')}</p>
              </div>
              {project.overdue_action_plans_count > 0 && (
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="font-semibold text-amber-600">{project.overdue_action_plans_count}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{tDashboard('risks')}</p>
                </div>
              )}
            </div>

            <Button size="sm" variant="ghost" className="ml-2" onClick={(e) => { e.stopPropagation(); }}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vista Card (grid)
  return (
    <Card className={cn("hover:shadow-lg transition-shadow cursor-pointer", compact && "h-full")} onClick={handleClick}>
      <CardHeader className={cn("pb-3", compact && "pb-2")}>
        <div className="flex flex-col gap-2">
          {/* Prima riga: Badge status e pulsante */}
          <div className="flex items-center justify-between gap-2">
            <Badge variant={project.project_status === 'Active' ? 'default' : 'secondary'} className="shrink-0">
              {getStatusText(project.project_status)}
            </Badge>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={(e) => { e.stopPropagation(); }} 
              className="shrink-0 min-w-0"
            >
              <span className="hidden md:inline">{tCommon('open')}</span>
              <ExternalLink className="h-3 w-3 md:ml-1" />
            </Button>
          </div>
          
          {/* Seconda riga: Nome progetto */}
          <div className="min-w-0 flex-1">
            <CardTitle className={cn("text-lg truncate leading-tight", compact && "text-base")} title={project.project_name}>
              {project.project_name}
            </CardTitle>
          </div>
        </div>
        {/* Data ultimo accesso */}
        <p className="text-sm text-muted-foreground mt-2">
          {tDashboard('lastAccessed')} {formatLastAccessed(project.last_accessed)}
        </p>
      </CardHeader>

      <CardContent className={cn("space-y-4", compact && "space-y-3")}>
      {/* Maturity Index integrato - Responsive */}
        <div>
          {/* Desktop: Compact with labels */}
          <div className="hidden sm:block">
            <MaturityIndex 
              data={maturityData}
              variant="compact"
              showLabels={true}
              showTrend={false}
              hideTitle={false}
            />
          </div>
          
          {/* Mobile: Minimal badge style */}
          <div className="block sm:hidden">
            <MaturityIndex 
              data={maturityData}
              variant="minimal"
              hideTitle={false}  // Mostra il badge style
            />
          </div>
        </div>

        {/* Metrics con la prossima milestone */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">{tDashboard('items')}</p>
            <p className="text-xl sm:text-2xl font-bold">{project.total_components}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">{tDashboard('risks')}</p>
            <div className="flex items-center space-x-1">
              {project.overdue_action_plans_count > 0 ? (
                <>
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                  <span className="text-xl sm:text-2xl font-bold text-amber-600">{project.overdue_action_plans_count}</span>
                </>
              ) : (
                <span className="text-xl sm:text-2xl font-bold text-green-600">0</span>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">{tDashboard('nextMilestone')}</p>
            {project.next_milestone_name ? (
              <div>
                <p className="text-xs sm:text-sm font-semibold truncate">{project.next_milestone_name}</p>
                {project.next_milestone_date && (
                  <p className="text-xs text-muted-foreground">
                    {formatMilestoneDate(project.next_milestone_date)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">{tDashboard('noMilestone')}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface RecentProjectsSectionProps {
  limit?: number;
  className?: string;
}

export default function RecentProjectsSection({ limit = 4, className }: RecentProjectsSectionProps) {
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const { projects, isLoading, error, refetch, updateProjectAccess } = useRecentProjects(limit);
  const router = useRouter();

  // Translations
  const tDashboard = useTranslations('dashboard');
  const tProjects = useTranslations('projects');
  const tCommon = useTranslations('common');
  const tMessages = useTranslations('messages');

  const handleProjectClick = async (projectId: number) => {
    console.log('🔗 Navigating to project:', projectId);
    
    // Update access timestamp
    await updateProjectAccess(projectId);
    
    // Navigate to project dashboard
    // TODO: Replace with actual project dashboard route when implemented
    router.push(`/projects/${projectId}/dashboard`);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>{tDashboard('recentProjects')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-destructive mb-4">
            {tMessages('errorLoadingData')}: {error}
          </p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {tCommon('retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          <FolderOpen className="h-5 w-5" />
          <span>{tDashboard('recentProjects')}</span>
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            disabled={isLoading}
            aria-label={tDashboard('gridView')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            disabled={isLoading}
            aria-label={tDashboard('listView')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label={tCommon('refresh')}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Link href="/project-selection">
            <Button variant="outline" size="sm">
              {tDashboard('viewAll')}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 gap-4"
              : "space-y-3"
          )}>
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className={viewMode === 'grid' ? "h-48" : "h-24"} />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 gap-4"
              : "space-y-3"
          )}>
            {projects.map(project => (
              <ProjectCard 
                key={project.project_id} 
                project={project} 
                compact={viewMode === 'list'} 
                listView={viewMode === 'list'}
                onProjectClick={handleProjectClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">{tDashboard('noRecentProjects')}</p>
            <p className="text-sm text-gray-400 mb-4">
              {tDashboard('projectsAccessedHere')}
            </p>
            <Link href="/project-selection">
              <Button variant="outline" size="sm">
                <FolderOpen className="h-4 w-4 mr-2" />
                {tDashboard('browseProjects')}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}