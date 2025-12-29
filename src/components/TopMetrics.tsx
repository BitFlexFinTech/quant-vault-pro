import { cn } from '@/lib/utils';
import { TrendingUp, Percent, Lock, Flame, Wallet } from 'lucide-react';

interface TopMetricsProps {
  balance: number;
  totalProfit: number;
  winRate: number;
  vaultBalance: number;
  winStreak: number;
}

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  colorClass: string;
  glowClass?: string;
}

function MetricCard({ label, value, subValue, icon, trend, colorClass, glowClass }: MetricCardProps) {
  return (
    <div className={cn(
      "metric-card group relative transition-all duration-300 hover:scale-[1.02]",
      glowClass
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={cn("mt-1 font-mono text-2xl font-bold", colorClass)}>
            {value}
          </p>
          {subValue && (
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{subValue}</p>
          )}
        </div>
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
          "bg-muted/50 group-hover:bg-muted"
        )}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className={cn(
          "absolute bottom-2 right-2 h-8 w-16",
          "opacity-20"
        )}>
          <svg viewBox="0 0 64 32" className="h-full w-full">
            <path
              d={trend === 'up' 
                ? "M0 28 L16 20 L32 24 L48 12 L64 4"
                : trend === 'down'
                ? "M0 4 L16 12 L32 8 L48 20 L64 28"
                : "M0 16 L64 16"
              }
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={colorClass}
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export function TopMetrics({ balance, totalProfit, winRate, vaultBalance, winStreak }: TopMetricsProps) {
  const profitTrend = totalProfit > 0 ? 'up' : totalProfit < 0 ? 'down' : 'neutral';
  
  return (
    <header className="border-b border-border bg-card/50 p-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          label="Account Balance"
          value={`$${balance.toFixed(2)}`}
          icon={<Wallet className="h-5 w-5 text-primary" />}
          colorClass="text-primary"
          glowClass="hover:glow-primary"
        />
        
        <MetricCard
          label="Total Profit"
          value={`${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`}
          icon={<TrendingUp className="h-5 w-5 text-success" />}
          trend={profitTrend}
          colorClass={totalProfit >= 0 ? "text-success" : "text-destructive"}
          glowClass={totalProfit >= 0 ? "hover:glow-success" : "hover:glow-danger"}
        />
        
        <MetricCard
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          subValue="Target: 80%"
          icon={<Percent className="h-5 w-5 text-warning" />}
          colorClass={winRate >= 80 ? "text-success" : winRate >= 60 ? "text-warning" : "text-destructive"}
        />
        
        <MetricCard
          label="Vault Balance"
          value={`$${vaultBalance.toFixed(2)}`}
          subValue="Secured profits"
          icon={<Lock className="h-5 w-5 text-gold" />}
          colorClass="text-gold"
          glowClass="hover:glow-gold"
        />
        
        <MetricCard
          label="Win Streak"
          value={winStreak.toString()}
          subValue="Consecutive wins"
          icon={<Flame className="h-5 w-5 text-destructive" />}
          colorClass={winStreak >= 5 ? "text-success" : winStreak >= 3 ? "text-warning" : "text-foreground"}
        />
      </div>
    </header>
  );
}
