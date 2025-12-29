import { AssetPerformance } from '@/types/deriv';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AssetTableProps {
  performance: Map<string, AssetPerformance>;
}

export function AssetTable({ performance }: AssetTableProps) {
  const assets = Array.from(performance.values())
    .filter(a => a.wins + a.losses > 0)
    .sort((a, b) => b.totalProfit - a.totalProfit);

  if (assets.length === 0) {
    return (
      <div className="h-full rounded-lg border border-border bg-card p-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-foreground">Asset Performance</h3>
          <p className="text-xs text-muted-foreground">Win/Loss by symbol</p>
        </div>
        <div className="flex h-[180px] items-center justify-center text-muted-foreground">
          <p className="font-mono text-sm">No trades executed yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-lg border border-border bg-card p-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-foreground">Asset Performance</h3>
        <p className="text-xs text-muted-foreground">Win/Loss by symbol</p>
      </div>
      
      <div className="max-h-[180px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="pb-2 font-medium">Symbol</th>
              <th className="pb-2 text-center font-medium">W/L</th>
              <th className="pb-2 text-center font-medium">Rate</th>
              <th className="pb-2 text-right font-medium">P/L</th>
            </tr>
          </thead>
          <tbody className="font-mono text-sm">
            {assets.map((asset) => {
              const trend = asset.totalProfit > 0 ? 'up' : asset.totalProfit < 0 ? 'down' : 'neutral';
              
              return (
                <tr 
                  key={asset.symbol}
                  className="border-b border-border/50 transition-colors hover:bg-muted/30"
                >
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        trend === 'up' ? "bg-success" : trend === 'down' ? "bg-destructive" : "bg-muted-foreground"
                      )} />
                      <span className="text-foreground">{asset.symbol}</span>
                    </div>
                  </td>
                  <td className="py-2 text-center">
                    <span className="text-success">{asset.wins}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-destructive">{asset.losses}</span>
                  </td>
                  <td className="py-2 text-center">
                    <span className={cn(
                      asset.winRate >= 80 ? "text-success" : 
                      asset.winRate >= 60 ? "text-warning" : 
                      "text-destructive"
                    )}>
                      {asset.winRate.toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {trend === 'up' && <TrendingUp className="h-3 w-3 text-success" />}
                      {trend === 'down' && <TrendingDown className="h-3 w-3 text-destructive" />}
                      {trend === 'neutral' && <Minus className="h-3 w-3 text-muted-foreground" />}
                      <span className={cn(
                        trend === 'up' ? "text-success" : 
                        trend === 'down' ? "text-destructive" : 
                        "text-muted-foreground"
                      )}>
                        {asset.totalProfit >= 0 ? '+' : ''}${asset.totalProfit.toFixed(2)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
