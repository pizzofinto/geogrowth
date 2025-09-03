'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, ArrowLeft, Save, Loader2, Trash2, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { enUS, it } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface MilestoneDefinition {
  id: number;
  milestone_name: string;
  milestone_description: string | null;
  milestone_order: number;
}

interface ProjectMilestone {
  milestone_definition_id: number;
  milestone_target_date: Date | undefined;
  milestone_status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
}

interface ProjectFormData {
  project_name: string;
  project_code: string;
  project_description: string;
  project_start_date: Date | undefined;
  project_end_date: Date | undefined;
  project_status: 'Active' | 'Archived' | 'Closed';
  milestones: ProjectMilestone[];
}

const initialFormData: ProjectFormData = {
  project_name: '',
  project_code: '',
  project_description: '',
  project_start_date: undefined,
  project_end_date: undefined,
  project_status: 'Active',
  milestones: []
};

export default function CreateProjectPage() {
  const { user, roles } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');

  // Map locale to date-fns locale for formatting
  const dateLocale = useMemo(() => {
    switch (locale) {
      case 'it':
        return it;
      case 'en':
      default:
        return enUS;
    }
  }, [locale]);

  // Helper function to format dates with correct locale
  const formatDate = useCallback((date: Date, formatStr: string = 'PPP') => {
    return format(date, formatStr, { locale: dateLocale });
  }, [dateLocale]);

  // Form state
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ProjectFormData>>({});
  
  // Milestone state
  const [milestoneDefinitions, setMilestoneDefinitions] = useState<MilestoneDefinition[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(true);

  // Multi-tab safety with useRef
  const isProcessingRef = useRef(false);

  // ✅ Stable roles reference to prevent infinite loops
  const userRoles = useMemo(() => 
    JSON.stringify(roles?.sort() || []), [roles]
  );
  const canCreateProject = useMemo(() => {
    const parsedRoles = JSON.parse(userRoles);
    return parsedRoles.includes('Super User') || parsedRoles.includes('Supplier Quality');
  }, [userRoles]);

  // Load milestone definitions
  const loadMilestoneDefinitions = useCallback(async () => {
    try {
      setLoadingMilestones(true);
      
      const { data, error } = await supabase
        .from('milestone_definitions')
        .select('id, milestone_name, milestone_description, milestone_order')
        .order('milestone_order', { ascending: true });

      if (error) {
        console.error('❌ Error loading milestone definitions:', error);
        return;
      }

      setMilestoneDefinitions(data || []);
    } catch (err) {
      console.error('❌ Unexpected error loading milestones:', err);
    } finally {
      setLoadingMilestones(false);
    }
  }, []);

  useEffect(() => {
    loadMilestoneDefinitions();
  }, [loadMilestoneDefinitions]);

  // Form validation
  const validateForm = useCallback((data: ProjectFormData): Partial<ProjectFormData> => {
    const newErrors: Partial<ProjectFormData> = {};

    if (!data.project_name.trim()) {
      newErrors.project_name = t('validation.nameRequired');
    }

    if (data.project_start_date && data.project_end_date) {
      if (data.project_end_date < data.project_start_date) {
        newErrors.project_end_date = t('validation.endDateAfterStart');
      }
    }

    return newErrors;
  }, [t]);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof ProjectFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Milestone management functions
  const addMilestone = useCallback((milestoneDefinitionId: number) => {
    const newMilestone: ProjectMilestone = {
      milestone_definition_id: milestoneDefinitionId,
      milestone_target_date: undefined,
      milestone_status: 'Planned'
    };
    
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone]
    }));
  }, []);

  const removeMilestone = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  }, []);

  const updateMilestone = useCallback((index: number, field: keyof ProjectMilestone, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  }, []);

  // Get available milestone definitions (not already added)
  const availableMilestones = useMemo(() => {
    const addedMilestoneIds = new Set(formData.milestones.map(m => m.milestone_definition_id));
    return milestoneDefinitions.filter(def => !addedMilestoneIds.has(def.id));
  }, [milestoneDefinitions, formData.milestones]);

  // ✅ Multi-tab safe project creation
  const createProject = useCallback(async () => {
    console.log('🚀 createProject function called');
    
    // Prevent concurrent processing using ref
    if (isProcessingRef.current) {
      console.log('🚫 Already processing project creation, skipping...');
      return;
    }
    
    console.log('✅ Not currently processing, continuing...');

    // Multi-tab coordination
    const processKey = 'project_creation_processing';
    let currentlyProcessing = null;
    
    console.log('🔍 Checking multi-tab coordination...');
    
    try {
      currentlyProcessing = typeof window !== 'undefined' 
        ? localStorage.getItem(processKey) 
        : null;
      console.log('📝 Currently processing value:', currentlyProcessing);
    } catch (error) {
      console.warn('Error accessing localStorage:', error);
    }

    // Check if another tab is processing (within 10 seconds)
    if (currentlyProcessing && Date.now() - parseInt(currentlyProcessing) < 10000) {
      console.log('🚫 Another tab is processing project creation, skipping...');
      return;
    }
    
    console.log('✅ Multi-tab check passed, proceeding...');

    isProcessingRef.current = true;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(processKey, Date.now().toString());
      } catch (error) {
        console.warn('Error setting localStorage:', error);
      }
    }

    try {
      console.log('🔄 Setting isSubmitting to true...');
      setIsSubmitting(true);

      // Validate form
      console.log('🔍 Validating form data...');
      const formErrors = validateForm(formData);
      console.log('📋 Form validation errors:', formErrors);
      
      if (Object.keys(formErrors).length > 0) {
        console.log('❌ Form validation failed, setting errors and returning');
        setErrors(formErrors);
        return;
      }
      
      console.log('✅ Form validation passed, proceeding to create project...');

      // Create project using direct table access
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          project_name: formData.project_name.trim(),
          project_code: formData.project_code.trim() || null,
          project_description: formData.project_description.trim() || null,
          project_start_date: formData.project_start_date ? format(formData.project_start_date, 'yyyy-MM-dd') : null,
          project_end_date: formData.project_end_date ? format(formData.project_end_date, 'yyyy-MM-dd') : null,
          project_manager_user_id: user?.id,
          project_status: formData.project_status
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating project:', error);
        setErrors({ project_name: tErrors('projectCreationFailed') });
        return;
      }

      console.log('✅ Project created successfully:', newProject);

      // Create milestone instances if any were defined
      if (formData.milestones.length > 0) {
        const milestoneInstances = formData.milestones
          .filter(milestone => milestone.milestone_target_date) // Only create milestones with dates
          .map(milestone => ({
            project_id: newProject.id,
            milestone_definition_id: milestone.milestone_definition_id,
            milestone_target_date: format(milestone.milestone_target_date!, 'yyyy-MM-dd'),
            milestone_status: milestone.milestone_status,
            updated_by_user_id: user?.id
          }));

        if (milestoneInstances.length > 0) {
          const { error: milestoneError } = await supabase
            .from('project_milestone_instances')
            .insert(milestoneInstances);

          if (milestoneError) {
            console.error('❌ Error creating milestones:', milestoneError);
            // Don't fail the entire creation - project is created, just log the error
          } else {
            console.log('✅ Project milestones created successfully');
          }
        }
      }

      // Navigate to project selection with success message
      router.push('/project-selection?created=true');

    } catch (err) {
      console.error('❌ Unexpected error creating project:', err);
      setErrors({ project_name: tErrors('generic') });
    } finally {
      setIsSubmitting(false);
      isProcessingRef.current = false;
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(processKey);
        } catch (error) {
          console.warn('Error removing localStorage item:', error);
        }
      }
    }
  }, [formData, user?.id, validateForm, router, tErrors]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔄 Form submitted, starting project creation...');
    console.log('📋 Form data:', formData);
    createProject();
  }, [createProject, formData]);

  // Check permissions
  if (!canCreateProject) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-destructive">{tErrors('insufficientPermissions')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {tCommon('back')}
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('createProject')}</h1>
          <p className="text-muted-foreground">{t('createProjectDescription')}</p>
        </div>
      </div>

      {/* Project Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('projectDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="project_name">
                {t('projectName')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project_name"
                type="text"
                value={formData.project_name}
                onChange={(e) => handleFieldChange('project_name', e.target.value)}
                placeholder={t('projectNamePlaceholder')}
                className={cn(errors.project_name && "border-destructive")}
                disabled={isSubmitting}
              />
              {errors.project_name && (
                <p className="text-sm text-destructive">{errors.project_name}</p>
              )}
            </div>

            {/* Project Code */}
            <div className="space-y-2">
              <Label htmlFor="project_code">{t('projectCode')}</Label>
              <Input
                id="project_code"
                type="text"
                value={formData.project_code}
                onChange={(e) => handleFieldChange('project_code', e.target.value)}
                placeholder={t('projectCodePlaceholder')}
                disabled={isSubmitting}
              />
            </div>

            {/* Project Description */}
            <div className="space-y-2">
              <Label htmlFor="project_description">{t('projectDescription')}</Label>
              <Textarea
                id="project_description"
                value={formData.project_description}
                onChange={(e) => handleFieldChange('project_description', e.target.value)}
                placeholder={t('projectDescriptionPlaceholder')}
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label>{t('startDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.project_start_date && "text-muted-foreground"
                      )}
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.project_start_date ? (
                        formatDate(formData.project_start_date)
                      ) : (
                        <span>{t('selectStartDate')}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto min-w-fit p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.project_start_date}
                      onSelect={(date) => handleFieldChange('project_start_date', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label>{t('endDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.project_end_date && "text-muted-foreground",
                        errors.project_end_date && "border-destructive"
                      )}
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.project_end_date ? (
                        formatDate(formData.project_end_date)
                      ) : (
                        <span>{t('selectEndDate')}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto min-w-fit p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.project_end_date}
                      onSelect={(date) => handleFieldChange('project_end_date', date)}
                      disabled={(date) => 
                        formData.project_start_date ? date < formData.project_start_date : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.project_end_date && (
                  <p className="text-sm text-destructive">{errors.project_end_date}</p>
                )}
              </div>
            </div>

            {/* Project Status */}
            <div className="space-y-2">
              <Label>{t('projectStatus')}</Label>
              <Select
                value={formData.project_status}
                onValueChange={(value: 'Active' | 'Archived' | 'Closed') => 
                  handleFieldChange('project_status', value)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">{t('statusOptions.active')}</SelectItem>
                  <SelectItem value="Archived">{t('statusOptions.archived')}</SelectItem>
                  <SelectItem value="Closed">{t('statusOptions.closed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project Milestones */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {t('milestones.title')}
                </Label>
                {availableMilestones.length > 0 && (
                  <Select
                    disabled={isSubmitting || loadingMilestones}
                    onValueChange={(value) => {
                      addMilestone(parseInt(value));
                    }}
                    value=""
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={t('milestones.selectMilestone')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMilestones.map((milestone) => (
                        <SelectItem key={milestone.id} value={milestone.id.toString()}>
                          {milestone.milestone_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {formData.milestones.length > 0 && (
                <div className="space-y-3">
                  {formData.milestones.map((milestone, index) => {
                    const definition = milestoneDefinitions.find(def => def.id === milestone.milestone_definition_id);
                    
                    return (
                      <Card key={`${milestone.milestone_definition_id}-${index}`} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{definition?.milestone_name}</h4>
                            {definition?.milestone_description && (
                              <p className="text-sm text-muted-foreground">{definition.milestone_description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMilestone(index)}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Target Date */}
                          <div className="space-y-2">
                            <Label>{t('milestones.targetDate')}</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !milestone.milestone_target_date && "text-muted-foreground"
                                  )}
                                  disabled={isSubmitting}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {milestone.milestone_target_date ? (
                                    formatDate(milestone.milestone_target_date)
                                  ) : (
                                    <span>{t('milestones.selectTargetDate')}</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto min-w-fit p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={milestone.milestone_target_date}
                                  onSelect={(date) => updateMilestone(index, 'milestone_target_date', date)}
                                  disabled={(date) => 
                                    formData.project_start_date ? date < formData.project_start_date : false
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Status */}
                          <div className="space-y-2">
                            <Label>{t('milestones.milestoneStatus')}</Label>
                            <Select
                              value={milestone.milestone_status}
                              onValueChange={(value: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled') => 
                                updateMilestone(index, 'milestone_status', value)
                              }
                              disabled={isSubmitting}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Planned">{t('milestones.statusOptions.planned')}</SelectItem>
                                <SelectItem value="In Progress">{t('milestones.statusOptions.inProgress')}</SelectItem>
                                <SelectItem value="Completed">{t('milestones.statusOptions.completed')}</SelectItem>
                                <SelectItem value="Cancelled">{t('milestones.statusOptions.cancelled')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {formData.milestones.length === 0 && !loadingMilestones && (
                <div className="text-center py-6 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('milestones.noMilestonesAdded')}</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.project_name.trim()}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSubmitting ? t('creating') : t('createProject')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}