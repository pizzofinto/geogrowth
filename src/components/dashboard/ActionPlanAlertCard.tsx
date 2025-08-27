'use client';

import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import { Calendar, Clock, AlertTriangle, User, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Definizione dei tipi per Action Plan (allineati con l'hook)
interface ActionPlan {
  id: number;
  action_plan_description: string;
  due_date: string;
  action_plan_status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
  priority_level: number;
  component: {
    id: number;
    component_name: string;
    project_id: number;
    project: {
      id: number;
      project_name: string;
    };
  } | null;
  action_type: {
    action_type_name: string;
  } | null;
  responsible_user: {
    first_name: string;
    last_name: string;
  } | null;
}

interface ActionPlanAlertCardProps {
  actionPlan: ActionPlan;
  alertType: 'overdue' | 'dueSoon' | 'highPriority';
  viewMode?: 'grid' | 'list';
  className?: string;
  onViewDetails?: (id: number) => void;
}

/**
 * ActionPlanAlertCard - Componente per mostrare singoli alert degli action plans
 * @param props - Component properties
 * @returns JSX Element
 */
export function ActionPlanAlertCard({ 
  actionPlan, 
  alertType,
  viewMode = 'grid',
  className,
  onViewDetails 
}: ActionPlanAlertCardProps) {
  const t = useTranslations('dashboard.actionPlans');
  const locale = useLocale();

  // ✅ FIXED: useMemo per prevenire infinite loop 
  const dateLocale = useMemo(() => locale === 'it' ? it : enUS, [locale]);

  // Calcola i giorni di differenza dalla due date
  const today = new Date();
  const dueDate = new Date(actionPlan.due_date);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determina l'icona e variant badge in base al tipo di alert
  const getAlertConfig = () => {
    switch (alertType) {
      case 'overdue':
        return {
          icon: AlertTriangle,
          badgeVariant: 'destructive' as const,
          badgeText: t('overdue'),
          iconColor: 'text-destructive',
        };
      case 'dueSoon':
        return {
          icon: Clock,
          badgeVariant: 'secondary' as const,
          badgeText: t('dueSoon'),
          iconColor: 'text-orange-600 dark:text-orange-400',
        };
      case 'highPriority':
        return {
          icon: AlertTriangle,
          badgeVariant: 'default' as const,
          badgeText: t('highPriority'),
          iconColor: 'text-blue-600 dark:text-blue-400',
        };
      default:
        return {
          icon: Clock,
          badgeVariant: 'outline' as const,
          badgeText: 'Alert',
          iconColor: 'text-muted-foreground',
        };
    }
  };

  const config = getAlertConfig();
  const IconComponent = config.icon;

  // Formatta il nome dell'utente responsabile
  const responsibleUserName = actionPlan.responsible_user
    ? `${actionPlan.responsible_user.first_name} ${actionPlan.responsible_user.last_name}`
    : t('noResponsible');

  // Formatta la priorità
  const getPriorityText = (level: number): string => {
    if (level <= 2) return t('priority.critical');
    if (level <= 4) return t('priority.high');
    if (level <= 6) return t('priority.medium');
    return t('priority.low');
  };

  const getPriorityVariant = (level: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (level <= 2) return 'destructive';
    if (level <= 4) return 'default';
    if (level <= 6) return 'secondary';
    return 'outline';
  };

  // Formatta il messaggio dei giorni
  const getDaysMessage = (): string => {
    if (diffDays < 0) {
      return t('daysOverdue', { days: Math.abs(diffDays) });
    } else if (diffDays === 0) {
      return t('dueToday');
    } else if (diffDays === 1) {
      return t('dueTomorrow');
    } else {
      return t('dueInDays', { days: diffDays });
    }
  };

  // List View (Standard Pattern)
  if (viewMode === 'list') {
    return (
      <Card className={cn(
        'hover:shadow-md transition-shadow cursor-pointer bg-background',
        className
      )} onClick={() => onViewDetails && onViewDetails(actionPlan.id)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left Section: Badge + Title + Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={config.badgeVariant} className="text-xs">
                  {config.badgeText}
                </Badge>
                <h3 className="font-semibold text-base truncate">
                  {actionPlan.action_type?.action_type_name || t('unknownActionType')}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(dueDate, 'dd MMM yyyy', { locale: dateLocale })} • {getDaysMessage()}
              </p>
            </div>
            
            {/* Right Section: Metadata + Priority + Action Button */}
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center hidden sm:block">
                <p className="font-semibold text-xs">{actionPlan.component?.project?.project_name || 'No Project'}</p>
                <p className="text-xs text-muted-foreground">{t('project')}</p>
              </div>
              
              <Badge variant={getPriorityVariant(actionPlan.priority_level)} className="text-xs">
                {getPriorityText(actionPlan.priority_level)}
              </Badge>
              
              {onViewDetails && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="ml-2" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onViewDetails(actionPlan.id);
                  }}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Modalità grid (default)
  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-lg cursor-pointer bg-background',
      className
    )} onClick={() => onViewDetails && onViewDetails(actionPlan.id)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2">
          {/* ROW 1: Alert Type Badge + Action Button (Standard Pattern) */}
          <div className="flex items-center justify-between gap-2">
            <Badge variant={config.badgeVariant} className="shrink-0">
              {config.badgeText}
            </Badge>
            {onViewDetails && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onViewDetails(actionPlan.id);
                }} 
                className="shrink-0 min-w-0"
              >
                <span className="hidden md:inline">{t('viewDetails')}</span>
                <ArrowRight className="h-3 w-3 md:ml-1" />
              </Button>
            )}
          </div>
          
          {/* ROW 2: Action Plan Title + Priority Badge (Standard Pattern) */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg truncate leading-tight flex-1" title={actionPlan.action_type?.action_type_name || t('unknownActionType')}>
                {actionPlan.action_type?.action_type_name || t('unknownActionType')}
              </CardTitle>
              <Badge variant={getPriorityVariant(actionPlan.priority_level)} className="text-xs shrink-0">
                {getPriorityText(actionPlan.priority_level)}
              </Badge>
            </div>
          </div>
        </div>
        {/* ROW 3: Due Date Metadata (Standard Pattern) */}
        <p className="text-sm text-muted-foreground mt-2">
          <Calendar className="h-3 w-3 inline mr-1" />
          {format(dueDate, 'dd MMM yyyy', { locale: dateLocale })} • {getDaysMessage()}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Main Content: Description (Standard Pattern) */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {actionPlan.action_plan_description}
        </p>

        {/* Metadata Footer (Standard Pattern) */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <span className="truncate">
              {actionPlan.component?.project?.project_name || t('unknownProject')}
            </span>
            {actionPlan.component?.project?.project_name && actionPlan.component?.component_name && (
              <>
                <span>•</span>
                <span className="truncate">
                  {actionPlan.component.component_name}
                </span>
              </>
            )}
          </div>
          {actionPlan.responsible_user && (
            <div className="flex items-center gap-1 shrink-0">
              <User className="h-3 w-3" />
              <span className="truncate">{responsibleUserName}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}