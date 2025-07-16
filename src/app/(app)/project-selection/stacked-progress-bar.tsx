'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StackedProgressBarProps {
  otop: number;
  ot: number;
  ko: number;
}

export function StackedProgressBar({
  otop = 0,
  ot = 0,
  ko = 0,
}: StackedProgressBarProps) {
  const other = Math.max(0, 100 - otop - ot - ko);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            {/* Segmento OTOP (Verde Scuro) */}
            <div
              style={{
                width: `${otop}%`,
                backgroundColor: 'hsl(var(--success))',
              }}
            />
            {/* Segmento OT (Verde Chiaro) */}
            <div
              style={{
                width: `${ot}%`,
                backgroundColor: 'hsl(var(--ot-color))',
              }}
            />
            {/* Segmento KO (Rosso) */}
            <div
              style={{
                width: `${ko}%`,
                backgroundColor: 'hsl(var(--destructive))',
              }}
            />
            {/* Segmento Altro (Grigio) */}
            <div
              className="bg-muted-foreground/20"
              style={{ width: `${other}%` }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: 'hsl(var(--success))' }}
              ></span>
              <span>OTOP: {otop}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: 'hsl(var(--ot-color))' }}
              ></span>
              <span>OT: {ot}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: 'hsl(var(--destructive))' }}
              ></span>
              <span>KO: {ko}%</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}