'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProjectTimeline, ProjectWithTimeline } from '@/components/dashboard/ProjectTimeline';
import { ProjectTimelineCard } from '@/components/dashboard/ProjectTimelineCard';
import { RefreshCw, Calendar, TestTube } from 'lucide-react';

// Mock data for testing
const createMockProjects = (): ProjectWithTimeline[] => [
  {
    project_id: '1',
    project_name: 'GeoGrowth Platform Development',
    project_start_date: '2024-01-15',
    project_end_date: '2024-12-31',
    milestones: [
      {
        milestone_name: 'UI Design System',
        milestone_target_date: '2024-03-15',
        milestone_status: 'Completed'
      },
      {
        milestone_name: 'Authentication System',
        milestone_target_date: '2024-04-30',
        milestone_status: 'Completed'
      },
      {
        milestone_name: 'Dashboard Implementation',
        milestone_target_date: '2024-06-15',
        milestone_status: 'In Progress'
      },
      {
        milestone_name: 'Project Management',
        milestone_target_date: '2024-09-30',
        milestone_status: 'Planned'
      },
      {
        milestone_name: 'Reporting System',
        milestone_target_date: '2024-11-15',
        milestone_status: 'Planned'
      }
    ]
  },
  {
    project_id: '2',
    project_name: 'Market Research Analytics',
    project_start_date: '2024-03-01',
    project_end_date: '2024-07-31',
    milestones: [
      {
        milestone_name: 'Data Collection Setup',
        milestone_target_date: '2024-03-15',
        milestone_status: 'Completed'
      },
      {
        milestone_name: 'Analysis Framework',
        milestone_target_date: '2024-05-01',
        milestone_status: 'Delayed'
      },
      {
        milestone_name: 'Report Generation',
        milestone_target_date: '2024-06-15',
        milestone_status: 'Planned'
      }
    ]
  },
  {
    project_id: '3',
    project_name: 'Customer Portal',
    project_start_date: '2023-10-01',
    project_end_date: '2024-02-28',
    milestones: [
      {
        milestone_name: 'User Registration',
        milestone_target_date: '2023-11-15',
        milestone_status: 'Completed'
      },
      {
        milestone_name: 'Dashboard Views',
        milestone_target_date: '2024-01-15',
        milestone_status: 'Completed'
      },
      {
        milestone_name: 'Integration Testing',
        milestone_target_date: '2024-02-20',
        milestone_status: 'Completed'
      }
    ]
  },
  {
    project_id: '4',
    project_name: 'At-Risk Project Example',
    project_start_date: '2024-01-01',
    project_end_date: '2024-08-31',
    milestones: [
      {
        milestone_name: 'Planning Phase',
        milestone_target_date: '2024-02-15',
        milestone_status: 'Completed'
      },
      {
        milestone_name: 'Development Start',
        milestone_target_date: '2024-04-01',
        milestone_status: 'Delayed'
      },
      {
        milestone_name: 'Testing Phase',
        milestone_target_date: '2024-06-01',
        milestone_status: 'Planned'
      }
    ]
  },
  {
    project_id: '5',
    project_name: 'Empty Milestones Project',
    project_start_date: '2024-06-01',
    project_end_date: '2024-12-31',
    milestones: []
  }
];

export default function TestTimelinePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showEmpty, setShowEmpty] = useState(false);
  
  const mockProjects = useMemo(() => createMockProjects(), []);
  
  const displayProjects = useMemo(() => {
    return showEmpty ? [] : mockProjects;
  }, [showEmpty, mockProjects]);
  
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate occasional error
    if (Math.random() < 0.2) {
      setError('Failed to fetch timeline data. Please try again.');
    }
    
    setLoading(false);
  };
  
  const handleProjectClick = (projectId: string | number) => {
    alert(`Navigate to project ${projectId} dashboard`);
  };
  
  const handleConfigClick = () => {
    alert('Open timeline configuration');
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <TestTube className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Project Timeline Component Test</h1>
        <Badge variant="outline">Dev Tools</Badge>
      </div>
      
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Test Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              variant={loading ? "secondary" : "default"}
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Test Loading State'}
            </Button>
            
            <Button
              variant={error ? "destructive" : "outline"}
              onClick={() => setError(error ? null : 'Test error message')}
            >
              {error ? 'Clear Error' : 'Test Error State'}
            </Button>
            
            <Button
              variant={showEmpty ? "secondary" : "outline"}
              onClick={() => setShowEmpty(!showEmpty)}
            >
              {showEmpty ? 'Show Projects' : 'Test Empty State'}
            </Button>
            
            <Button
              variant={viewMode === 'grid' ? "default" : "outline"}
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              View: {viewMode}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Separator />
      
      {/* Full ProjectTimeline Component Test */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Complete ProjectTimeline Component</h2>
        <ProjectTimeline
          projects={displayProjects}
          loading={loading}
          error={error}
          onRefresh={handleRefresh}
          isRefreshing={false}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showControls={true}
          onConfigClick={handleConfigClick}
          onProjectClick={handleProjectClick}
        />
      </div>
      
      <Separator />
      
      {/* Individual ProjectTimelineCard Tests */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Individual ProjectTimelineCard Components</h2>
        <div className="space-y-6">
          
          {/* Grid View Cards */}
          <div>
            <h3 className="text-lg font-medium mb-3">Grid View</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {mockProjects.slice(0, 3).map((project) => (
                <ProjectTimelineCard
                  key={project.project_id}
                  project={project}
                  viewMode="grid"
                  onProjectClick={handleProjectClick}
                />
              ))}
            </div>
          </div>
          
          {/* List View Cards */}
          <div>
            <h3 className="text-lg font-medium mb-3">List View</h3>
            <div className="space-y-4">
              {mockProjects.slice(0, 3).map((project) => (
                <ProjectTimelineCard
                  key={`list-${project.project_id}`}
                  project={project}
                  viewMode="list"
                  onProjectClick={handleProjectClick}
                  className="border-l-4 border-l-primary/20 pl-4"
                />
              ))}
            </div>
          </div>
          
          {/* Edge Cases */}
          <div>
            <h3 className="text-lg font-medium mb-3">Edge Cases</h3>
            <div className="space-y-4">
              {/* At-risk project */}
              <ProjectTimelineCard
                project={mockProjects[3]}
                viewMode="grid"
                onProjectClick={handleProjectClick}
              />
              
              {/* Empty milestones */}
              <ProjectTimelineCard
                project={mockProjects[4]}
                viewMode="grid"
                onProjectClick={handleProjectClick}
              />
              
              {/* Invalid dates */}
              <ProjectTimelineCard
                project={{
                  ...mockProjects[0],
                  project_id: 'invalid-dates',
                  project_name: 'Invalid Dates Project',
                  project_start_date: 'invalid-date',
                  project_end_date: 'also-invalid'
                }}
                viewMode="grid"
                onProjectClick={handleProjectClick}
              />
            </div>
          </div>

          {/* View Mode Comparison - Hybrid timeline display */}
          <div>
            <h3 className="text-lg font-medium mb-3">View Mode Comparison (Hybrid Timeline Display)</h3>
            <div className="space-y-6">
              {/* Grid Mode - Full Details + Labels Visible */}
              <div>
                <h4 className="text-md font-medium mb-2 text-blue-600">Grid View (Milestone Labels Visible)</h4>
                <ProjectTimelineCard
                  project={mockProjects[0]}
                  viewMode="grid"
                  onProjectClick={handleProjectClick}
                />
              </div>
              
              {/* List Mode - Minimal Details + Tooltip Only */}
              <div>
                <h4 className="text-md font-medium mb-2 text-green-600">List View (Milestone Details in Tooltips)</h4>
                <ProjectTimelineCard
                  project={mockProjects[0]}
                  viewMode="list"
                  onProjectClick={handleProjectClick}
                  className="border-l-4 border-l-primary/20 pl-4"
                />
              </div>
              
              {/* Multiple List Items to Test Overlapping */}
              <div>
                <h4 className="text-md font-medium mb-2 text-green-600">Multiple List Items (Testing Overlap Fix)</h4>
                <div className="space-y-2">
                  {mockProjects.slice(0, 3).map((project) => (
                    <ProjectTimelineCard
                      key={`overlap-test-${project.project_id}`}
                      project={project}
                      viewMode="list"
                      onProjectClick={handleProjectClick}
                      className="border-l-4 border-l-primary/20 pl-4"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Multi-tab Testing Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Multi-Tab Testing</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-200">
          <div className="space-y-2">
            <p><strong>To test multi-tab safety:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Open this page in multiple browser tabs</li>
              <li>Change view mode (grid/list) in one tab - should sync to others</li>
              <li>Click &quot;Test Loading State&quot; in multiple tabs quickly - only one should process</li>
              <li>Check browser console for multi-tab coordination messages</li>
              <li>Verify localStorage keys: projectTimeline_viewMode, projectTimeline_refreshing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}