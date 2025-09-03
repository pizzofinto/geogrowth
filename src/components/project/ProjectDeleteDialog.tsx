'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ProjectToDelete {
  id: number;
  project_name: string;
  project_code: string | null;
  total_components?: number;
}

interface ProjectDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectToDelete[];
  onConfirm: (projectIds: number[]) => Promise<void>;
  isDeleting: boolean;
}

/**
 * ProjectDeleteDialog - Confirmation dialog for project deletion
 * Supports both single and bulk deletion with safety warnings
 */
export function ProjectDeleteDialog({
  open,
  onOpenChange,
  projects,
  onConfirm,
  isDeleting
}: ProjectDeleteDialogProps) {
  const t = useTranslations('projects');
  const [confirmText, setConfirmText] = useState('');
  
  const isBulkDelete = projects.length > 1;
  const totalComponents = projects.reduce((sum, project) => sum + (project.total_components || 0), 0);
  const expectedConfirmText = isBulkDelete ? 'DELETE ALL' : 'DELETE';
  const isConfirmValid = confirmText === expectedConfirmText;

  const handleConfirm = async () => {
    if (!isConfirmValid || isDeleting) return;
    
    try {
      const projectIds = projects.map(p => p.id);
      await onConfirm(projectIds);
      
      // Reset confirmation text and close dialog only after successful completion
      setConfirmText('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error during project deletion:', error);
      // Don't close dialog on error, let user retry or cancel
    }
  };

  const handleCancel = () => {
    setConfirmText('');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-md p-6">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <SheetTitle className="text-left">
                {isBulkDelete 
                  ? t('confirmBulkDelete', { count: projects.length })
                  : t('confirmSingleDelete')
                }
              </SheetTitle>
            </div>
          </div>
        </SheetHeader>
        
        <SheetDescription asChild>
          <div className="space-y-4 py-2">
            {/* Warning message */}
            <div className="text-sm text-muted-foreground">
              {isBulkDelete 
                ? t('bulkDeleteWarning')
                : t('singleDeleteWarning')
              }
            </div>

            {/* Project list */}
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {isBulkDelete ? t('projectsToDelete') : t('projectToDelete')}:
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2 bg-muted/50">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{project.project_name}</div>
                      {project.project_code && (
                        <div className="text-xs text-muted-foreground">{project.project_code}</div>
                      )}
                    </div>
                    {project.total_components && project.total_components > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {t('componentsCount', { count: project.total_components })}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Components warning */}
            {totalComponents > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    {t('componentsWarning', { count: totalComponents })}
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation input */}
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {t('typeToConfirm').replace('{text}', expectedConfirmText)}
              </div>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isConfirmValid && !isDeleting) {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
                placeholder={expectedConfirmText}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isDeleting}
              />
            </div>
          </div>
        </SheetDescription>

        <SheetFooter className="gap-2 pt-4">
          <Button 
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!isConfirmValid || isDeleting}
            className={`transition-all duration-200 ${
              isConfirmValid && !isDeleting 
                ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
                : 'bg-gray-100 text-gray-400 border-gray-300'
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('deleting')}
              </>
            ) : (
              <>
                {isBulkDelete ? t('deleteProjects') : t('deleteProject')}
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}