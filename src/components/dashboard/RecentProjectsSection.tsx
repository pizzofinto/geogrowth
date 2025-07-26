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
import { useRouter } from 'next/navigation';

// Utility function for conditional class names
const cn = (...classes: (string | undefined | null | false)[]) => 
  classes.filter(Boolean).join(' ');

// MaturityBar component with OTOP/OT/KO colors and percentages below
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
);

interface ProjectCardProps {
  project: any;
  compact?: boolean;
  listView?: boolean;
  onProjectClick: (projectId: number) => void;
}

const ProjectCard = ({ project, compact = false, listView = false, onProjectClick }: ProjectCardProps) => {
  const tDashboard = useTranslations('dashboard');
  const tProjects = useTranslations('projects');
  const tCommon = useTranslations('common');

  const handleClick = () => {
    onProjectClick(project.project_id);
  };

  // Get translated status
  const getStatusText = (status: string) => {
    switch(status) {
      case 'Active': return tProjects('active');
      case 'Archived': return tProjects('archived');
      case 'Closed': return tProjects('closed');
      default: return status;
    }
  };

  if (listView) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">{project.project_name}</h3>
                  <Badge variant={project.project_status === 'Active' ? 'default' : 'secondary'}>
                    {getStatusText(project.project_status)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-3 mt-1">
                  <p className="text-sm text-gray-500">
                    {project.total_components} {tDashboard('items')} • {tDashboard('lastAccessed')} {formatLastAccessed(project.last_accessed)}
                  </p>
                  {project.overdue_action_plans_count > 0 && (
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4 text-black" />
                      <span className="text-sm font-medium text-black">
                        {project.overdue_action_plans_count} {tDashboard('overdue')}
                      </span>
                    </div>
                  )}
                  {project.next_milestone_name && (
                    <div className="flex items-center space-x-1 text-xs text-blue-600">
                      <Calendar className="h-3 w-3" />
                      <span>{project.next_milestone_name}</span>
                      {project.next_milestone_date && (
                        <span>({formatMilestoneDate(project.next_milestone_date)})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-24">
                  <MaturityBar 
                    otop={project.otop_percentage} 
                    ot={project.ot_percentage} 
                    ko={project.ko_percentage}
                    showPercentages={false}
                  />
                </div>
              </div>
            </div>
            
            <Button size="sm" variant="outline">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={handleClick}>
      <CardHeader className={cn("pb-3", compact && "pb-2")}>
        <div className="flex items-start justify-between">
          <div className="flex-1 flex items-center space-x-2">
            {/* Badge spostato a sinistra del nome */}
            <Badge variant={project.project_status === 'Active' ? 'default' : 'secondary'}>
              {getStatusText(project.project_status)}
            </Badge>
            <CardTitle className={cn("text-lg", compact && "text-base")}>
              {project.project_name}
            </CardTitle>
          </div>
          {/* Pulsante Open spostato in alto a destra */}
          <Button size="sm" variant="outline">
            {tCommon('open')} <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {tDashboard('lastAccessed')} {formatLastAccessed(project.last_accessed)}
        </p>
      </CardHeader>
      
      <CardContent className={cn("space-y-4", compact && "space-y-3")}>
        {/* Metrics con la prossima milestone */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">{tDashboard('items')}</p>
            <p className="text-2xl font-bold text-black">{project.total_components}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">{tDashboard('risks')}</p>
            <div className="flex items-center space-x-1">
              {project.overdue_action_plans_count > 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-black" />
                  <span className="text-2xl font-bold text-black">{project.overdue_action_plans_count}</span>
                </>
              ) : (
                <span className="text-2xl font-bold text-black">0</span>
              )}
            </div>
          </div>
          {/* Nuova sezione: Next Milestone */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">{tDashboard('nextMilestone')}</p>
            {project.next_milestone_name ? (
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <Calendar className="h-4 w-4 text-black" />
                  <p className="text-sm font-bold text-black">{project.next_milestone_name}</p>
                </div>
                {project.next_milestone_date && (
                  <p className="text-xs text-gray-500">{formatMilestoneDate(project.next_milestone_date)}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <p className="text-sm text-gray-500">{tDashboard('noMilestone')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Maturity Index */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">{tDashboard('maturityIndex')}</p>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
          <MaturityBar 
            otop={project.otop_percentage} 
            ot={project.ot_percentage} 
            ko={project.ko_percentage}
            showPercentages={true}
          />
        </div>

        {/* Project Team - sezione semplificata */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-700">{tDashboard('projectTeam')}</p>
            <div className="flex -space-x-1">
              <Avatar className="h-6 w-6 border-2 border-white">
                <AvatarFallback className="text-xs">SQ</AvatarFallback>
              </Avatar>
              <Avatar className="h-6 w-6 border-2 border-white">
                <AvatarFallback className="text-xs">ENG</AvatarFallback>
              </Avatar>
            </div>
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