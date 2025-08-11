'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

export interface MaturityIndexData {
  otop: number;
  ot: number;
  ko: number;
  new?: number;
  incomplete?: number;
  notOffTool?: number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  lastUpdated?: Date;
}

interface MaturityIndexProps {
  data: MaturityIndexData;
  variant?: 'extended' | 'compact' | 'minimal';
  showLabels?: boolean;
  showTrend?: boolean;
  showDetails?: boolean;
  className?: string;
  title?: string;
  hideTitle?: boolean;
}

export function MaturityIndex({
  data,
  variant = 'extended',
  showLabels = true,
  showTrend = true,
  showDetails = true,
  className,
  title,
  hideTitle = false,
}: MaturityIndexProps) {
  const t = useTranslations('maturityIndex');

  // Calcola il totale per le percentuali "other"
  const total = data.otop + data.ot + data.ko + (data.new || 0) + (data.incomplete || 0) + (data.notOffTool || 0);
  const other = Math.max(0, 100 - total);

  // Determina il colore del trend
  const getTrendIcon = () => {
    if (!data.trend || !showTrend) return null;
    
    const iconClass = "h-4 w-4";
    switch (data.trend) {
      case 'up':
        return <TrendingUp className={cn(iconClass, "text-green-600")} />;
      case 'down':
        return <TrendingDown className={cn(iconClass, "text-red-600")} />;
      default:
        return <Minus className={cn(iconClass, "text-gray-500")} />;
    }
  };

  // Componente per i singoli status items nel tooltip
  const StatusItem = ({ 
    label, 
    value, 
    colorClass,
    colorStyle 
  }: { 
    label: string; 
    value: number; 
    colorClass?: string;
    colorStyle?: string;
  }) => (
    <div className="flex items-center gap-2">
      <span
        className={cn("h-2 w-2 rounded-full flex-shrink-0", colorClass)}
        style={colorStyle ? { backgroundColor: colorStyle } : undefined}
      />
      <span className="flex-1">{label}:</span>
      <span className="font-semibold">{value}%</span>
    </div>
  );

  // Componente per la barra di progresso
  const ProgressBar = () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            {/* OTOP - Verde scuro personalizzato */}
            <div
              className="transition-all duration-300"
              style={{
                width: `${data.otop}%`,
                backgroundColor: 'hsl(var(--maturity-otop))',
              }}
            />
            {/* OT - Verde lime personalizzato */}
            <div
              className="transition-all duration-300"
              style={{
                width: `${data.ot}%`,
                backgroundColor: 'hsl(var(--maturity-ot))',
              }}
            />
            {/* KO - Rosso personalizzato */}
            <div
              className="transition-all duration-300"
              style={{
                width: `${data.ko}%`,
                backgroundColor: 'hsl(var(--maturity-ko))',
              }}
            />
            {/* NEW - Blu personalizzato */}
            {data.new && data.new > 0 && (
              <div
                className="transition-all duration-300"
                style={{
                  width: `${data.new}%`,
                  backgroundColor: 'hsl(var(--maturity-new))',
                }}
              />
            )}
            {/* INCOMPLETE - Arancione personalizzato */}
            {data.incomplete && data.incomplete > 0 && (
              <div
                className="transition-all duration-300"
                style={{
                  width: `${data.incomplete}%`,
                  backgroundColor: 'hsl(var(--maturity-incomplete))',
                }}
              />
            )}
            {/* NOT OFF TOOL - Grigio */}
            {data.notOffTool && data.notOffTool > 0 && (
              <div
                className="transition-all duration-300"
                style={{
                  width: `${data.notOffTool}%`,
                  backgroundColor: 'hsl(var(--maturity-not-off-tool))',
                }}
              />
            )}
            {/* Altri - Grigio chiaro */}
            {other > 0 && (
              <div
                className="bg-muted-foreground/20 transition-all duration-300"
                style={{ width: `${other}%` }}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold text-sm">{t('breakdown')}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <StatusItem label="OTOP" value={data.otop} colorStyle="hsl(var(--maturity-otop))" />
              <StatusItem label="OT" value={data.ot} colorStyle="hsl(var(--maturity-ot))" />
              <StatusItem label="KO" value={data.ko} colorStyle="hsl(var(--maturity-ko))" />
              {data.new && data.new > 0 && (
                <StatusItem label={t('new')} value={data.new} colorStyle="hsl(var(--maturity-new))" />
              )}
              {data.incomplete && data.incomplete > 0 && (
                <StatusItem label={t('incomplete')} value={data.incomplete} colorStyle="hsl(var(--maturity-incomplete))" />
              )}
              {data.notOffTool && data.notOffTool > 0 && (
                <StatusItem label={t('notOffTool')} value={data.notOffTool} colorStyle="hsl(var(--maturity-not-off-tool))" />
              )}
            </div>
            {data.lastUpdated && (
              <p className="text-xs text-muted-foreground pt-2 border-t">
                {t('lastUpdated')}: {new Date(data.lastUpdated).toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Versione Minimal - ha due sottovarianti basate su hideTitle
  if (variant === 'minimal') {
    // Sottovariante 1: Solo testo compatto
    if (hideTitle) {
      const getStatusColor = () => {
        if (data.otop >= 50) return 'text-green-600 dark:text-green-400';
        if (data.otop >= 30) return 'text-lime-600 dark:text-lime-400';
        if (data.ko >= 30) return 'text-red-600 dark:text-red-400';
        return 'text-gray-600 dark:text-gray-400';
      };

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn("text-sm font-medium cursor-help", getStatusColor(), className)}>
                {Math.round(data.otop)}% OTOP
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <div>OTOP: {data.otop}%</div>
                <div>OT: {data.ot}%</div>
                <div>KO: {data.ko}%</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Sottovariante 2: Badge con stato dominante (default)
    const getDominantStatus = () => {
      if (data.otop >= data.ot && data.otop >= data.ko) {
        return { 
          label: 'OTOP', 
          value: data.otop, 
          color: 'hsl(var(--maturity-otop))',
          bgClass: 'bg-green-50 dark:bg-green-950',
          textClass: 'text-green-700 dark:text-green-300'
        };
      } else if (data.ot >= data.ko) {
        return { 
          label: 'OT', 
          value: data.ot, 
          color: 'hsl(var(--maturity-ot))',
          bgClass: 'bg-lime-50 dark:bg-lime-950',
          textClass: 'text-lime-700 dark:text-lime-300'
        };
      } else if (data.ko > 0) {
        return { 
          label: 'KO', 
          value: data.ko, 
          color: 'hsl(var(--maturity-ko))',
          bgClass: 'bg-red-50 dark:bg-red-950',
          textClass: 'text-red-700 dark:text-red-300'
        };
      } else {
        return { 
          label: 'NEW', 
          value: 100, 
          color: 'hsl(var(--maturity-new))',
          bgClass: 'bg-blue-50 dark:bg-blue-950',
          textClass: 'text-blue-700 dark:text-blue-300'
        };
      }
    };

    const dominant = getDominantStatus();

    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        {/* Badge con stato dominante */}
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          dominant.bgClass,
          dominant.textClass
        )}>
          <span 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: dominant.color }}
          />
          <span>{dominant.label}: {dominant.value}%</span>
        </div>
        
        {/* Mini indicatori per gli altri stati se presenti e significativi */}
        {(data.ot > 10 || data.ko > 10) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex gap-1">
                  {data.otop > 10 && dominant.label !== 'OTOP' && (
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: 'hsl(var(--maturity-otop))' }}
                    />
                  )}
                  {data.ot > 10 && dominant.label !== 'OT' && (
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: 'hsl(var(--maturity-ot))' }}
                    />
                  )}
                  {data.ko > 10 && dominant.label !== 'KO' && (
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: 'hsl(var(--maturity-ko))' }}
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <div>OTOP: {data.otop}%</div>
                  <div>OT: {data.ot}%</div>
                  <div>KO: {data.ko}%</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  // Versione Compact - barra con etichette principali
  if (variant === 'compact') {
    return (
      <div className={cn("space-y-2", className)}>
        {!hideTitle && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {title || t('title')}
            </span>
            {showTrend && data.trend && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                {data.trendValue && (
                  <span className="text-xs text-muted-foreground">
                    {data.trendValue > 0 ? '+' : ''}{data.trendValue}%
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        <ProgressBar />
        {showLabels && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>OTOP: {Math.round(data.otop)}%</span>
            <span>OT: {Math.round(data.ot)}%</span>
            <span>KO: {Math.round(data.ko)}%</span>
          </div>
        )}
      </div>
    );
  }

  // Versione Extended - card completa con tutti i dettagli
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {title || t('title')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{t('description')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          {showTrend && data.trend && (
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              {data.trendValue && (
                <Badge variant={data.trend === 'up' ? 'default' : data.trend === 'down' ? 'destructive' : 'secondary'}>
                  {data.trendValue > 0 ? '+' : ''}{data.trendValue}%
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressBar />
        
        {showDetails && (
          <div className="grid grid-cols-3 gap-4">
            <DetailItem
              label="OTOP"
              value={data.otop}
              colorStyle="hsl(var(--maturity-otop))"
              description={t('otopDescription')}
              showInfo={true}
              infoTooltip={t('otopDefinition')}
              fullName={t('otopFullName')}
            />
            <DetailItem
              label="OT"
              value={data.ot}
              colorStyle="hsl(var(--maturity-ot))"
              description={t('otDescription')}
              showInfo={true}
              infoTooltip={t('otDefinition')}
              fullName={t('otFullName')}
            />
            <DetailItem
              label="KO"
              value={data.ko}
              colorStyle="hsl(var(--maturity-ko))"
              description={t('koDescription')}
            />
          </div>
        )}

        {showDetails && (data.new || data.incomplete || data.notOffTool) && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">{t('otherStatuses')}</p>
            <div className="grid grid-cols-3 gap-4">
              {data.new && data.new > 0 && (
                <DetailItem
                  label={t('new')}
                  value={data.new}
                  colorStyle="hsl(var(--maturity-new))"
                  compact
                />
              )}
              {data.incomplete && data.incomplete > 0 && (
                <DetailItem
                  label={t('incomplete')}
                  value={data.incomplete}
                  colorStyle="hsl(var(--maturity-incomplete))"
                  compact
                />
              )}
              {data.notOffTool && data.notOffTool > 0 && (
                <DetailItem
                  label={t('notOffTool')}
                  value={data.notOffTool}
                  colorStyle="hsl(var(--maturity-not-off-tool))"
                  compact
                />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente per i dettagli nella versione extended
function DetailItem({ 
  label, 
  value, 
  colorClass,
  colorStyle,
  description,
  compact = false,
  showInfo = false,
  infoTooltip,
  fullName
}: { 
  label: string; 
  value: number; 
  colorClass?: string;
  colorStyle?: string;
  description?: string;
  compact?: boolean;
  showInfo?: boolean;
  infoTooltip?: string;
  fullName?: string;
}) {
  const t = useTranslations('maturityIndex');
  
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span
          className={cn("rounded-full", compact ? "h-2 w-2" : "h-2.5 w-2.5", colorClass)}
          style={colorStyle ? { backgroundColor: colorStyle } : undefined}
        />
        <span className={cn("font-medium flex items-center gap-1", compact ? "text-xs" : "text-xs")}>
          {label}
          {showInfo && infoTooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1">
                    {fullName && (
                      <p className="font-semibold text-sm">{fullName}</p>
                    )}
                    <p className="text-xs">{infoTooltip}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </span>
      </div>
      <p className={cn("font-bold", compact ? "text-base" : "text-lg")}>{value}%</p>
      {description && !compact && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}