import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { TradeSettings } from '@/types/deriv';
import { 
  Play, 
  Square, 
  AlertTriangle, 
  Target, 
  DollarSign, 
  Percent, 
  Lock,
  Activity,
  Zap
} from 'lucide-react';

interface ControlSidebarProps {
  settings: TradeSettings;
  onSettingsChange: (settings: TradeSettings) => void;
  isRunning: boolean;
  isConnected: boolean;
  isAuthorized: boolean;
  onStart: () => void;
  onStop: () => void;
  onPanic: () => void;
}

export function ControlSidebar({
  settings,
  onSettingsChange,
  isRunning,
  isConnected,
  isAuthorized,
  onStart,
  onStop,
  onPanic,
}: ControlSidebarProps) {
  const updateSetting = <K extends keyof TradeSettings>(key: K, value: TradeSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-mono text-lg font-bold text-foreground">QUANT-BOT</h1>
            <p className="font-mono text-xs text-muted-foreground">PRO v2.0</p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Connection</span>
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-success animate-pulse" : "bg-destructive"
            )} />
            <span className={cn(
              "font-mono text-xs",
              isConnected ? "text-success" : "text-destructive"
            )}>
              {isAuthorized ? 'AUTHORIZED' : isConnected ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Start/Stop Toggle */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Activity className="h-4 w-4 text-primary" />
              Trading Engine
            </span>
            <Switch
              checked={isRunning}
              onCheckedChange={(checked) => checked ? onStart() : onStop()}
              disabled={!isAuthorized}
            />
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {isRunning ? 'Engine active, executing trades' : 'Engine standby'}
          </p>
        </div>

        {/* Panic Button */}
        <Button
          variant="destructive"
          className="mb-6 w-full gap-2 font-mono"
          onClick={onPanic}
          disabled={!isRunning}
        >
          <AlertTriangle className="h-4 w-4" />
          PANIC CLOSE
        </Button>

        {/* Sliders */}
        <div className="space-y-6">
          {/* Profit Target */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Target className="h-4 w-4 text-success" />
                Profit Target
              </label>
              <span className="font-mono text-sm text-success">
                ${settings.profitTarget.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[settings.profitTarget]}
              onValueChange={([v]) => updateSetting('profitTarget', v)}
              min={0.05}
              max={2}
              step={0.05}
              className="cursor-pointer"
            />
            <div className="flex justify-between font-mono text-xs text-muted-foreground">
              <span>$0.05</span>
              <span>$2.00</span>
            </div>
          </div>

          {/* Stake */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <DollarSign className="h-4 w-4 text-primary" />
                Stake Amount
              </label>
              <span className="font-mono text-sm text-primary">
                ${settings.stake.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[settings.stake]}
              onValueChange={([v]) => updateSetting('stake', v)}
              min={0.35}
              max={10}
              step={0.05}
              className="cursor-pointer"
            />
            <div className="flex justify-between font-mono text-xs text-muted-foreground">
              <span>$0.35</span>
              <span>$10.00</span>
            </div>
          </div>

          {/* Min Probability */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Percent className="h-4 w-4 text-warning" />
                Min Probability
              </label>
              <span className="font-mono text-sm text-warning">
                {settings.minProbability}%
              </span>
            </div>
            <Slider
              value={[settings.minProbability]}
              onValueChange={([v]) => updateSetting('minProbability', v)}
              min={60}
              max={95}
              step={1}
              className="cursor-pointer"
            />
            <div className="flex justify-between font-mono text-xs text-muted-foreground">
              <span>60%</span>
              <span>95%</span>
            </div>
          </div>

          {/* Vault Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Lock className="h-4 w-4 text-gold" />
                Vault Threshold
              </label>
              <span className="font-mono text-sm text-gold">
                ${settings.vaultThreshold.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[settings.vaultThreshold]}
              onValueChange={([v]) => updateSetting('vaultThreshold', v)}
              min={1}
              max={10}
              step={0.5}
              className="cursor-pointer"
            />
            <div className="flex justify-between font-mono text-xs text-muted-foreground">
              <span>$1.00</span>
              <span>$10.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className={cn(
            "h-1.5 w-1.5 rounded-full",
            isRunning ? "bg-success animate-pulse" : "bg-muted-foreground"
          )} />
          <span className="font-mono">
            {isRunning ? 'LIVE TRADING' : 'STANDBY MODE'}
          </span>
        </div>
      </div>
    </aside>
  );
}
