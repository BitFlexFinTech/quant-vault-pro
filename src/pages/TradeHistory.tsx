import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  ArrowLeft, Search, Download, Filter, TrendingUp, TrendingDown, 
  Calendar, BarChart3, PieChartIcon, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CHART_COLORS = {
  profit: 'hsl(145, 80%, 45%)',
  loss: 'hsl(0, 85%, 55%)',
  primary: 'hsl(185, 100%, 50%)',
  gold: 'hsl(45, 100%, 55%)',
};

const TradeHistory = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [symbolFilter, setSymbolFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['trade-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('trade_history')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const symbols = useMemo(() => {
    const uniqueSymbols = [...new Set(trades.map(t => t.symbol))];
    return uniqueSymbols.sort();
  }, [trades]);

  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.contract_id.toString().includes(searchTerm);
      const matchesSymbol = symbolFilter === 'all' || trade.symbol === symbolFilter;
      const matchesResult = resultFilter === 'all' || trade.result === resultFilter;
      
      let matchesDate = true;
      if (dateRange !== 'all') {
        const tradeDate = new Date(trade.executed_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dateRange === '7d') matchesDate = daysDiff <= 7;
        else if (dateRange === '30d') matchesDate = daysDiff <= 30;
        else if (dateRange === '90d') matchesDate = daysDiff <= 90;
      }
      
      return matchesSearch && matchesSymbol && matchesResult && matchesDate;
    });
  }, [trades, searchTerm, symbolFilter, resultFilter, dateRange]);

  const stats = useMemo(() => {
    const wins = filteredTrades.filter(t => t.result === 'win').length;
    const losses = filteredTrades.filter(t => t.result === 'loss').length;
    const totalProfit = filteredTrades.reduce((sum, t) => sum + Number(t.profit), 0);
    const totalStake = filteredTrades.reduce((sum, t) => sum + Number(t.stake), 0);
    const winRate = filteredTrades.length > 0 ? (wins / filteredTrades.length) * 100 : 0;
    
    return { wins, losses, totalProfit, totalStake, winRate, total: filteredTrades.length };
  }, [filteredTrades]);

  const profitByDay = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredTrades.forEach(trade => {
      const day = format(new Date(trade.executed_at), 'MMM dd');
      grouped[day] = (grouped[day] || 0) + Number(trade.profit);
    });
    return Object.entries(grouped).map(([date, profit]) => ({ date, profit })).reverse().slice(-14);
  }, [filteredTrades]);

  const performanceBySymbol = useMemo(() => {
    const grouped: Record<string, { wins: number; losses: number; profit: number }> = {};
    filteredTrades.forEach(trade => {
      if (!grouped[trade.symbol]) {
        grouped[trade.symbol] = { wins: 0, losses: 0, profit: 0 };
      }
      if (trade.result === 'win') grouped[trade.symbol].wins++;
      else grouped[trade.symbol].losses++;
      grouped[trade.symbol].profit += Number(trade.profit);
    });
    return Object.entries(grouped)
      .map(([symbol, data]) => ({ symbol, ...data }))
      .sort((a, b) => b.profit - a.profit);
  }, [filteredTrades]);

  const resultDistribution = useMemo(() => {
    return [
      { name: 'Wins', value: stats.wins, color: CHART_COLORS.profit },
      { name: 'Losses', value: stats.losses, color: CHART_COLORS.loss },
    ];
  }, [stats]);

  const exportToCSV = () => {
    const headers = ['Date', 'Symbol', 'Type', 'Stake', 'Payout', 'Profit', 'Result', 'Contract ID'];
    const rows = filteredTrades.map(t => [
      format(new Date(t.executed_at), 'yyyy-MM-dd HH:mm:ss'),
      t.symbol,
      t.contract_type,
      t.stake,
      t.payout,
      t.profit,
      t.result,
      t.contract_id,
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 p-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Trade History</h1>
              <p className="text-sm text-muted-foreground">
                {stats.total} trades • {stats.winRate.toFixed(1)}% win rate
              </p>
            </div>
          </div>
          <Button onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="metric-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Profit</p>
            <p className={cn(
              "mt-1 font-mono text-2xl font-bold",
              stats.totalProfit >= 0 ? "text-success" : "text-destructive"
            )}>
              {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(2)}
            </p>
          </div>
          <div className="metric-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Win Rate</p>
            <p className="mt-1 font-mono text-2xl font-bold text-primary">
              {stats.winRate.toFixed(1)}%
            </p>
          </div>
          <div className="metric-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Wins / Losses</p>
            <p className="mt-1 font-mono text-2xl font-bold">
              <span className="text-success">{stats.wins}</span>
              <span className="text-muted-foreground"> / </span>
              <span className="text-destructive">{stats.losses}</span>
            </p>
          </div>
          <div className="metric-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Volume</p>
            <p className="mt-1 font-mono text-2xl font-bold text-gold">
              ${stats.totalStake.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Profit Over Time */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-foreground">Profit Over Time</h3>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profitByDay}>
                  <defs>
                    <linearGradient id="profitGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.profit} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.profit} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
                  <XAxis dataKey="date" stroke="hsl(215 20% 55%)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(215 20% 55%)" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222 47% 10%)',
                      border: '1px solid hsl(220 20% 18%)',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke={CHART_COLORS.profit}
                    fill="url(#profitGradient2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Win/Loss Distribution */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-foreground">Win/Loss Distribution</h3>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resultDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {resultDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222 47% 10%)',
                      border: '1px solid hsl(220 20% 18%)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance by Symbol */}
          <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-foreground">Performance by Symbol</h3>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceBySymbol.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
                  <XAxis dataKey="symbol" stroke="hsl(215 20% 55%)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(215 20% 55%)" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222 47% 10%)',
                      border: '1px solid hsl(220 20% 18%)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="profit" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by symbol or contract ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={symbolFilter} onValueChange={setSymbolFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Symbol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Symbols</SelectItem>
              {symbols.map(symbol => (
                <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="win">Wins</SelectItem>
              <SelectItem value="loss">Losses</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[130px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trade Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Symbol</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium text-right">Stake</th>
                  <th className="p-4 font-medium text-right">Payout</th>
                  <th className="p-4 font-medium text-right">Profit</th>
                  <th className="p-4 font-medium text-center">Result</th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Loading trades...
                    </td>
                  </tr>
                ) : filteredTrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No trades found
                    </td>
                  </tr>
                ) : (
                  filteredTrades.slice(0, 100).map((trade) => (
                    <tr 
                      key={trade.id}
                      className="border-b border-border/50 transition-colors hover:bg-muted/30"
                    >
                      <td className="p-4 text-muted-foreground">
                        {format(new Date(trade.executed_at), 'MMM dd, HH:mm')}
                      </td>
                      <td className="p-4 text-foreground">{trade.symbol}</td>
                      <td className="p-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
                          trade.contract_type === 'CALL'
                            ? "bg-success/20 text-success"
                            : "bg-destructive/20 text-destructive"
                        )}>
                          {trade.contract_type === 'CALL' 
                            ? <TrendingUp className="h-3 w-3" /> 
                            : <TrendingDown className="h-3 w-3" />
                          }
                          {trade.contract_type}
                        </span>
                      </td>
                      <td className="p-4 text-right text-foreground">${Number(trade.stake).toFixed(2)}</td>
                      <td className="p-4 text-right text-foreground">${Number(trade.payout).toFixed(2)}</td>
                      <td className={cn(
                        "p-4 text-right font-bold",
                        Number(trade.profit) >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {Number(trade.profit) >= 0 ? '+' : ''}${Number(trade.profit).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-bold uppercase",
                          trade.result === 'win'
                            ? "bg-success/20 text-success"
                            : "bg-destructive/20 text-destructive"
                        )}>
                          {trade.result}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TradeHistory;
