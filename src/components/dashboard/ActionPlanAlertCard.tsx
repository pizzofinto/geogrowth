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

  // Determina il colore e l'icona in base al tipo di alert
  const getAlertConfig = () => {
    switch (alertType) {
      case 'overdue':
        return {
          color: 'destructive',
          icon: AlertTriangle,
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-500',
          textColor: 'text-red-600 dark:text-red-400',
        };
      case 'dueSoon':
        return {
          color: 'orange',
          icon: Clock,
          bgColor: 'bg-orange-50 dark:bg-orange-950/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          textColor: 'text-orange-600 dark:text-orange-400',
        };
      case 'highPriority':
        return {
          color: 'blue',
          icon: AlertTriangle,
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-600 dark:text-blue-400',
        };
      default:
        return {
          color: 'secondary',
          icon: Clock,
          bgColor: 'bg-secondary/10',
          borderColor: 'border-secondary/20',
          textColor: 'text-muted-foreground',
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

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md cursor-pointer',
      config.bgColor,
      config.borderColor,
      className
    )} onClick={() => onViewDetails(actionPlan.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className={cn('h-4 w-4', config.textColor)} />
            <CardTitle className="text-sm font-medium line-clamp-1">
              {actionPlan.action_type?.action_type_name || t('unknownActionType')}
            </CardTitle>
          </div>
          <Badge variant={getPriorityVariant(actionPlan.priority_level)} className="text-xs shrink-0">
            {getPriorityText(actionPlan.priority_level)}
          </Badge>
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
            <span className={cn(
              'font-medium text-xs',
              config.textColor
            )}>
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

        {/* Pulsante azione */}
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 h-8"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(actionPlan.id);
            }}
          >
            <span className="text-xs">{t('viewDetails')}</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}