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
        <div className="bg-yellow-400" style={{ width: `${ot}%` }} />
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
  const handleClick = () => {
    onProjectClick(project.project_id);
  };

  if (listView) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-[192px]" onClick={handleClick}>
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header con badge nella stessa posizione della card espansa */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">{project.project_name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Last accessed {formatLastAccessed(project.last_accessed)}
              </p>
            </div>
            <Badge variant={project.project_status === 'Active' ? 'default' : 'secondary'}>
              {project.project_status}
            </Badge>
          </div>

          {/* Content area */}
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center space-x-6 flex-1">
              {/* Metrics compatti */}
              <div className="text-sm text-gray-500">
                {project.total_components} items
              </div>
              
              {project.overdue_action_plans_count > 0 && (
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="h-4 w-4 text-black" />
                  <span className="text-sm font-medium text-black">{project.overdue_action_plans_count} overdue</span>
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
            
            <Button size="sm" variant="outline">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Maturity Bar nella parte inferiore */}
          <div className="mt-auto pt-3">
            <MaturityBar 
              otop={project.otop_percentage} 
              ot={project.ot_percentage} 
              ko={project.ko_percentage}
              showPercentages={false}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-[192px]" onClick={handleClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg">
                {project.project_name}
              </CardTitle>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Last accessed {formatLastAccessed(project.last_accessed)}
            </p>
          </div>
          <Badge variant={project.project_status === 'Active' ? 'default' : 'secondary'}>
            {project.project_status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 flex-1 flex flex-col">
        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">Items</p>
            <p className="text-xl font-bold text-black">{project.total_components}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">Risks</p>
            <div className="flex items-center space-x-1">
              {project.overdue_action_plans_count > 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-black" />
                  <span className="text-xl font-bold text-black">{project.overdue_action_plans_count}</span>
                </>
              ) : (
                <span className="text-xl font-bold text-black">0</span>
              )}
            </div>
          </div>
        </div>

        {/* Maturity Index con percentuali scritte sotto */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Maturity Index</p>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
          <MaturityBar 
            otop={project.otop_percentage} 
            ot={project.ot_percentage} 
            ko={project.ko_percentage}
            showPercentages={true}
          />
        </div>

        {/* Next Milestone and Action Button */}
        <div className="flex items-center justify-between pt-2 mt-auto">
          {project.next_milestone_name ? (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">{project.next_milestone_name}</p>
                {project.next_milestone_date && (
                  <p className="text-xs text-gray-500">{formatMilestoneDate(project.next_milestone_date)}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-700">Project Team</p>
              <div className="flex -space-x-1">
                <Avatar className="h-6 w-6 border-2 border-white">
                  <AvatarFallback className="text-xs">SQ</AvatarFallback>
                </Avatar>
                <Avatar className="h-6 w-6 border-2 border-white">
                  <AvatarFallback className="text-xs">ENG</AvatarFallback>
                </Avatar>
              </div>
            </div>
          )}
          
          {/* Bottone Open sempre visibile con stile outline */}
          <Button size="sm" variant="outline">
            Open <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
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
            <span>Recent Projects</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-destructive mb-4">Error loading recent projects: {error}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
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
          <span>Recent Projects</span>
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            disabled={isLoading}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            disabled={isLoading}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Link href="/project-selection">
            <Button variant="outline" size="sm">
              View all
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
              <Skeleton key={i} className="h-[192px]" />
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
            <p className="text-gray-500 mb-2">No recent projects found</p>
            <p className="text-sm text-gray-400 mb-4">Projects you access will appear here</p>
            <Link href="/project-selection">
              <Button variant="outline" size="sm">
                <FolderOpen className="h-4 w-4 mr-2" />
                Browse projects
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}