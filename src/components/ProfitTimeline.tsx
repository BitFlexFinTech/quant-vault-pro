import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { cn } from '@/lib/utils';

interface ProfitTimelineProps {
  data: Array<{ time: number; profit: number }>;
}

export function ProfitTimeline({ data }: ProfitTimelineProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) {
      return Array.from({ length: 20 }, (_, i) => ({
        time: Date.now() - (20 - i) * 60000,
        profit: 0,
        label: new Date(Date.now() - (20 - i) * 60000).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      }));
    }
    
    return data.map(d => ({
      ...d,
      label: new Date(d.time).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }),
    }));
  }, [data]);

  const currentProfit = data.length > 0 ? data[data.length - 1].profit : 0;
  const minProfit = Math.min(...chartData.map(d => d.profit), 0);
  const maxProfit = Math.max(...chartData.map(d => d.profit), 1);

  return (
    <div className="h-full rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Profit Timeline</h3>
          <p className="text-xs text-muted-foreground">Real-time P/L tracking</p>
        </div>
        <div className={cn(
          "rounded-md px-3 py-1 font-mono text-sm font-bold",
          currentProfit >= 0 
            ? "bg-success/10 text-success" 
            : "bg-destructive/10 text-destructive"
        )}>
          {currentProfit >= 0 ? '+' : ''}${currentProfit.toFixed(2)}
        </div>
      </div>
      
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(145 80% 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(145 80% 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0 85% 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0 85% 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(220 20% 18%)" 
              vertical={false}
            />
            <XAxis 
              dataKey="label" 
              stroke="hsl(215 20% 55%)"
              tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215 20% 55%)"
              tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v.toFixed(2)}`}
              domain={[minProfit - 0.5, maxProfit + 0.5]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222 47% 10%)',
                border: '1px solid hsl(220 20% 18%)',
                borderRadius: '8px',
                fontFamily: 'JetBrains Mono',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(210 40% 98%)' }}
              formatter={(value: number) => [
                `${value >= 0 ? '+' : ''}$${value.toFixed(2)}`,
                'P/L'
              ]}
            />
            <Area
              type="monotone"
              dataKey="profit"
              stroke={currentProfit >= 0 ? 'hsl(145 80% 45%)' : 'hsl(0 85% 55%)'}
              strokeWidth={2}
              fill={currentProfit >= 0 ? 'url(#profitGradient)' : 'url(#lossGradient)'}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
