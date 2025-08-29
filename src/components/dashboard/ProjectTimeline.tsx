'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar, RefreshCw, Grid3X3, List, Settings, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectTimelineCard } from './ProjectTimelineCard';
import { cn } from '@/lib/utils';

export interface ProjectWithTimeline {
  project_id: string | number;
  project_name: string;
  project_start_date: string;
  project_end_date: string;
  milestones: Array<{
    milestone_name: string;
    milestone_target_date: string;
    milestone_status: 'Planned' | 'In Progress' | 'Completed' | 'Delayed' | 'Skipped' | 'Cancelled';
  }>;
}

interface ProjectTimelineProps {
  projects: ProjectWithTimeline[];
  loading?: boolean;
  error?: string | null;
  className?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  /** View mode configuration */
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  /** Show timeline controls */
  showControls?: boolean;
  /** Configuration callback */
  onConfigClick?: () => void;
  /** Project limit configuration */
  limit?: number;
  onLimitChange?: (limit: number) => void;
  /** Project click handler for Open button */
  onProjectClick?: (projectId: string | number) => void;
}

/**
 * ProjectTimeline - Reusable component for displaying project timelines
 * ✅ MULTI-TAB SAFE: Implements cross-tab synchronization and operation locking
 * ✅ INFINITE LOOP SAFE: Proper dependency management with useMemo/useCallback
 */
export function ProjectTimeline({
  projects,
  loading = false,
  error = null,
  className,
  onRefresh,
  isRefreshing = false,
  viewMode = 'grid',
  onViewModeChange,
  showControls = true,
  onConfigClick,
  limit = 5,
  onLimitChange,
  onProjectClick
}: ProjectTimelineProps) {
  const t = useTranslations('dashboard.timelines');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  
  // ✅ MULTI-TAB SAFE: Ref to prevent concurrent refresh operations
  const isRefreshingRef = useRef(false);
  
  // ✅ MULTI-TAB SAFE: Use localStorage for view mode persistence across tabs
  // ✅ HYDRATION SAFE: Always start with 'grid' to match server render
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'list'>('grid');
  
  // ✅ HYDRATION SAFE: Load from localStorage only after client hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('projectTimeline_viewMode');
      if (saved && (saved === 'grid' || saved === 'list')) {
        setInternalViewMode(saved);
      }
    }
  }, []);
  
  // ✅ MULTI-TAB SAFE: Listen for localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'projectTimeline_viewMode' && e.newValue) {
        setInternalViewMode(e.newValue as 'grid' | 'list');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // ✅ FIXED: useMemo to prevent infinite loops with stable project count
  const projectCount = useMemo(() => projects?.length || 0, [projects?.length]);
  
  // ✅ MULTI-TAB SAFE: View mode change with cross-tab synchronization
  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setInternalViewMode(mode);
    
    // ✅ MULTI-TAB SAFE: Persist to localStorage for cross-tab sync
    if (typeof window !== 'undefined') {
      localStorage.setItem('projectTimeline_viewMode', mode);
    }
    
    onViewModeChange?.(mode);
  }, [onViewModeChange]);
  
  // ✅ MULTI-TAB SAFE: Refresh with operation locking
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    // Prevent concurrent refresh operations using ref
    if (isRefreshingRef.current) return;
    
    // ✅ MULTI-TAB SAFE: Check if another tab is refreshing (within 30 seconds)
    const refreshKey = 'projectTimeline_refreshing';
    const currentlyRefreshing = typeof window !== 'undefined' 
      ? localStorage.getItem(refreshKey) 
      : null;
    
    if (currentlyRefreshing && Date.now() - parseInt(currentlyRefreshing) < 30000) {
      console.log('🚫 Another tab is refreshing project timeline, skipping...');
      return;
    }
    
    isRefreshingRef.current = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem(refreshKey, Date.now().toString());
    }
    
    try {
      await onRefresh();
    } finally {
      isRefreshingRef.current = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(refreshKey);
      }
    }
  }, [onRefresh]);
  
  // ✅ FIXED: Stable view mode calculation
  const currentViewMode = useMemo(() => 
    onViewModeChange ? viewMode : internalViewMode, 
    [onViewModeChange, viewMode, internalViewMode]
  );
  
  // ✅ FIXED: Memoized loading state check to prevent re-renders
  const isLoadingOrRefreshing = useMemo(() => 
    loading || isRefreshing, 
    [loading, isRefreshing]
  );
  
  return (
    <Card className={cn("transition-shadow hover:shadow-lg bg-background", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">
              {t('title')}
            </CardTitle>
            {projectCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {projectCount}
              </Badge>
            )}
          </div>
          
          {showControls && (
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex border rounded-lg p-1">
                <Button
                  variant={currentViewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('grid')}
                  className="h-7 px-2"
                  aria-label={t('viewMode.grid')}
                >
                  <Grid3X3 className="h-3 w-3" />
                </Button>
                <Button
                  variant={currentViewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewModeChange('list')}
                  className="h-7 px-2"
                  aria-label={t('viewMode.list')}
                >
                  <List className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Project limit selector */}
              {onLimitChange && (
                <Select 
                  value={String(limit)} 
                  onValueChange={(value) => onLimitChange(Number(value))}
                  disabled={isLoadingOrRefreshing}
                >
                  <SelectTrigger className="w-20 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              {/* Configuration button */}
              {onConfigClick && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onConfigClick}
                  className="h-8 w-8 p-0"
                  aria-label={t('configure')}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              )}
              
              {/* Refresh button */}
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoadingOrRefreshing}
                  className="h-8 w-8 p-0"
                  aria-label={tCommon('refresh')}
                >
                  <RefreshCw className={cn(
                    "h-3 w-3",
                    isLoadingOrRefreshing && "animate-spin"
                  )} />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-16 w-full" />
                {i < 2 && <div className="border-b" />}
              </div>
            ))}
          </div>
        )}
        
        {/* Error state */}
        {error && !loading && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {tErrors('generic')}: {error}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Empty state */}
        {!loading && !error && projectCount === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-2">
              {t('empty.title')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t('empty.description')}
            </p>
          </div>
        )}
        
        {/* Projects timeline content */}
        {!loading && !error && projectCount > 0 && (
          <div className={cn(
            currentViewMode === 'grid' 
              ? "space-y-6" 
              : "space-y-3"
          )}>
            {projects.map((project, index) => (
              <ProjectTimelineCard
                key={`timeline-${project.project_id}-${index}`}
                project={project}
                viewMode={currentViewMode}
                onProjectClick={onProjectClick}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}