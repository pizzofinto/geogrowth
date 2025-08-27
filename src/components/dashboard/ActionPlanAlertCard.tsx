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

  // Supporto per modalità lista
  if (viewMode === 'list') {
    return (
      <Card className={cn(
        'transition-all duration-200 hover:shadow-md cursor-pointer bg-background',
        className
      )} onClick={() => onViewDetails && onViewDetails(actionPlan.id)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <IconComponent className={cn('h-4 w-4', config.iconColor)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={config.badgeVariant} className="text-xs">
                    {config.badgeText}
                  </Badge>
                  <h3 className="font-semibold text-sm truncate">
                    {actionPlan.action_type?.action_type_name || t('unknownActionType')}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {actionPlan.action_plan_description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <p className="font-semibold">
                  {format(dueDate, 'dd MMM', { locale: dateLocale })}
                </p>
                <p className="text-xs text-muted-foreground">{getDaysMessage()}</p>
              </div>
              <Badge variant={getPriorityVariant(actionPlan.priority_level)} className="text-xs">
                {getPriorityText(actionPlan.priority_level)}
              </Badge>
              {/* Action button aligned with RecentProjects list view */}
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
          {/* First row: Alert badge and action button (aligned with RecentProjects) */}
          <div className="flex items-center justify-between gap-2">
            <Badge variant={config.badgeVariant} className="shrink-0 text-xs">
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
                <span className="hidden md:inline text-xs">{t('viewDetails')}</span>
                <ArrowRight className="h-3 w-3 md:ml-1" />
              </Button>
            )}
          </div>
          
          {/* Second row: Title and priority */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <IconComponent className={cn('h-4 w-4', config.iconColor)} />
              <CardTitle className="text-sm font-medium line-clamp-1">
                {actionPlan.action_type?.action_type_name || t('unknownActionType')}
              </CardTitle>
            </div>
            <Badge variant={getPriorityVariant(actionPlan.priority_level)} className="text-xs shrink-0">
              {getPriorityText(actionPlan.priority_level)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Descrizione Action Plan */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {actionPlan.action_plan_description}
        </p>

        <Separator />

        {/* Informazioni Progetto e Componente */}
        <div className="space-y-2">
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="font-medium">{t('project')}:</span>
            <span className="ml-1 truncate">
              {actionPlan.component?.project?.project_name || t('unknownProject')}
            </span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="font-medium">{t('component')}:</span>
            <span className="ml-1 truncate">
              {actionPlan.component?.component_name || t('unknownComponent')}
            </span>
          </div>
          {/* Debug info temporarily removed */}
        </div>

        <Separator />

        {/* Data di scadenza e responsabile */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(dueDate, 'dd MMM yyyy', { locale: dateLocale })}</span>
            </div>
            <span className="font-medium text-xs text-muted-foreground">
              {getDaysMessage()}
            </span>
          </div>

          {actionPlan.responsible_user && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{responsibleUserName}</span>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}