import { ContractUpdate } from '@/types/deriv';
import { cn } from '@/lib/utils';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface ActivePositionsProps {
  positions: ContractUpdate[];
}

export function ActivePositions({ positions }: ActivePositionsProps) {
  if (positions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="h-4 w-4" />
          <span className="font-mono text-sm">No active positions</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {positions.map((position) => {
        const isProfit = (position.profit ?? 0) >= 0;
        
        return (
          <div
            key={position.contract_id}
            className={cn(
              "min-w-[180px] rounded-lg border p-3 transition-all",
              isProfit 
                ? "border-success/30 bg-success/5" 
                : "border-destructive/30 bg-destructive/5"
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">
                #{position.contract_id}
              </span>
              <div className={cn(
                "flex h-5 w-5 items-center justify-center rounded",
                isProfit ? "bg-success/20" : "bg-destructive/20"
              )}>
                {isProfit 
                  ? <TrendingUp className="h-3 w-3 text-success" />
                  : <TrendingDown className="h-3 w-3 text-destructive" />
                }
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Entry</span>
                <span className="font-mono text-foreground">
                  {position.entry_spot?.toFixed(4) ?? '-'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Current</span>
                <span className="font-mono text-foreground">
                  {position.current_spot?.toFixed(4) ?? '-'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">P/L</span>
                <span className={cn(
                  "font-mono font-bold",
                  isProfit ? "text-success" : "text-destructive"
                )}>
                  {isProfit ? '+' : ''}${(position.profit ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
