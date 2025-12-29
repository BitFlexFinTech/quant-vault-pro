import { TradingState } from '@/types/deriv';
import { cn } from '@/lib/utils';
import { Brain, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

interface AISignalCardProps {
  signal: TradingState['currentSignal'];
}

export function AISignalCard({ signal }: AISignalCardProps) {
  if (!signal) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Brain className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">AI Signal</h4>
            <p className="text-xs text-muted-foreground">Analyzing market conditions...</p>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-center py-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="font-mono text-sm">Waiting for signal...</span>
          </div>
        </div>
      </div>
    );
  }

  const isCall = signal.direction === 'CALL';

  return (
    <div className={cn(
      "rounded-lg border p-4 transition-all",
      isCall 
        ? "border-success/30 bg-gradient-to-br from-success/5 to-transparent" 
        : "border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            isCall ? "bg-success/20" : "bg-destructive/20"
          )}>
            <Brain className={cn(
              "h-4 w-4",
              isCall ? "text-success" : "text-destructive"
            )} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">AI Signal</h4>
            <p className="text-xs text-muted-foreground">Best trade opportunity</p>
          </div>
        </div>
        
        <div className={cn(
          "rounded-full px-3 py-1 font-mono text-xs font-bold",
          isCall ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
        )}>
          {signal.probability}% CONF
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className={cn(
          "flex items-center gap-2 rounded-lg px-4 py-2",
          isCall ? "bg-success/10" : "bg-destructive/10"
        )}>
          {isCall 
            ? <TrendingUp className="h-5 w-5 text-success" />
            : <TrendingDown className="h-5 w-5 text-destructive" />
          }
          <span className={cn(
            "font-mono text-lg font-bold",
            isCall ? "text-success" : "text-destructive"
          )}>
            {signal.direction}
          </span>
        </div>
        
        <div className="flex-1">
          <p className="font-mono text-sm text-foreground">{signal.symbol}</p>
          <p className="text-xs text-muted-foreground">{signal.reasoning}</p>
        </div>
      </div>
    </div>
  );
}
