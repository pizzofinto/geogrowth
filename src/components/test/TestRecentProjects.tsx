'use client';

import { useRecentProjects } from '@/hooks/useRecentProjects';
import { formatLastAccessed, formatMilestoneDate } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function TestRecentProjects() {
  const { projects, isLoading, error, refetch, updateProjectAccess } = useRecentProjects(4);

  const handleProjectClick = async (projectId: number) => {
    console.log('🖱️ Project clicked:', projectId);
    await updateProjectAccess(projectId);
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    refetch();
  };

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">Errore Hook</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={handleRefresh}>Riprova</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>🧪 Test Hook Recent Projects</CardTitle>
        <Button onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? 'Caricamento...' : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nessun progetto trovato
          </p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div 
                key={project.project_id}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleProjectClick(project.project_id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{project.project_name}</h3>
                  <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {project.project_status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Ultimo accesso:</span>
                    <br />
                    <span className="font-medium">{formatLastAccessed(project.last_accessed)}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Componenti:</span>
                    <br />
                    <span className="font-medium">{project.total_components}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Scaduti:</span>
                    <br />
                    <span className={`font-medium ${project.overdue_action_plans_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {project.overdue_action_plans_count}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">OTOP:</span>
                    <br />
                    <span className="font-medium">{Math.round(project.otop_percentage)}%</span>
                  </div>
                </div>

                {project.next_milestone_name && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-gray-500 text-sm">Prossima milestone: </span>
                    <span className="font-medium">{project.next_milestone_name}</span>
                    {project.next_milestone_date && (
                      <span className="text-gray-500 text-sm ml-2">
                        ({formatMilestoneDate(project.next_milestone_date)})
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-400">
                  ID: {project.project_id} | OTOP: {project.otop_percentage}% | OT: {project.ot_percentage}% | KO: {project.ko_percentage}%
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}