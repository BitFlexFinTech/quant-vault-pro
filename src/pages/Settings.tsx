import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Save, Key, Palette, Shield, Bell, Loader2,
  DollarSign, Target, Percent, Lock, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showToken, setShowToken] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [formState, setFormState] = useState({
    profit_target: 0.35,
    stake_amount: 0.35,
    min_probability: 75,
    vault_threshold: 3,
    max_daily_loss: 50,
    max_position_size: 10,
    max_concurrent_trades: 3,
    api_token: '',
    app_id: '1089',
    theme: 'dark',
    sound_enabled: true,
    notifications_enabled: true,
  });

  useEffect(() => {
    if (settings) {
      setFormState({
        profit_target: Number(settings.profit_target) || 0.35,
        stake_amount: Number(settings.stake_amount) || 0.35,
        min_probability: settings.min_probability || 75,
        vault_threshold: Number(settings.vault_threshold) || 3,
        max_daily_loss: Number(settings.max_daily_loss) || 50,
        max_position_size: Number(settings.max_position_size) || 10,
        max_concurrent_trades: settings.max_concurrent_trades || 3,
        api_token: settings.api_token || '',
        app_id: settings.app_id || '1089',
        theme: settings.theme || 'dark',
        sound_enabled: settings.sound_enabled ?? true,
        notifications_enabled: settings.notifications_enabled ?? true,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (updates: typeof formState) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_settings')
        .update({
          profit_target: updates.profit_target,
          stake_amount: updates.stake_amount,
          min_probability: updates.min_probability,
          vault_threshold: updates.vault_threshold,
          max_daily_loss: updates.max_daily_loss,
          max_position_size: updates.max_position_size,
          max_concurrent_trades: updates.max_concurrent_trades,
          api_token: updates.api_token || null,
          app_id: updates.app_id,
          theme: updates.theme,
          sound_enabled: updates.sound_enabled,
          notifications_enabled: updates.notifications_enabled,
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast({
        title: 'Settings Saved',
        description: 'Your settings have been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formState);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 p-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">Configure your trading preferences</p>
            </div>
          </div>
          <Button onClick={handleSave} className="gap-2" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4">
        <Tabs defaultValue="trading" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trading" className="gap-2">
              <Target className="h-4 w-4" />
              Trading
            </TabsTrigger>
            <TabsTrigger value="risk" className="gap-2">
              <Shield className="h-4 w-4" />
              Risk
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              API
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Bell className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Trading Settings */}
          <TabsContent value="trading" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Trading Parameters</h3>
                <div className="space-y-6">
                  {/* Profit Target */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-success" />
                        Profit Target
                      </Label>
                      <span className="font-mono text-sm text-success">
                        ${formState.profit_target.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[formState.profit_target]}
                      onValueChange={([v]) => setFormState(s => ({ ...s, profit_target: v }))}
                      min={0.05}
                      max={2}
                      step={0.05}
                    />
                    <p className="text-xs text-muted-foreground">
                      Auto-sell when contract profit reaches this amount
                    </p>
                  </div>

                  {/* Stake Amount */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Default Stake
                      </Label>
                      <span className="font-mono text-sm text-primary">
                        ${formState.stake_amount.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[formState.stake_amount]}
                      onValueChange={([v]) => setFormState(s => ({ ...s, stake_amount: v }))}
                      min={0.35}
                      max={10}
                      step={0.05}
                    />
                  </div>

                  {/* Min Probability */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-warning" />
                        Min Probability
                      </Label>
                      <span className="font-mono text-sm text-warning">
                        {formState.min_probability}%
                      </span>
                    </div>
                    <Slider
                      value={[formState.min_probability]}
                      onValueChange={([v]) => setFormState(s => ({ ...s, min_probability: v }))}
                      min={60}
                      max={95}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Only execute trades with signal probability above this threshold
                    </p>
                  </div>

                  {/* Vault Threshold */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-gold" />
                        Vault Threshold
                      </Label>
                      <span className="font-mono text-sm text-gold">
                        ${formState.vault_threshold.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[formState.vault_threshold]}
                      onValueChange={([v]) => setFormState(s => ({ ...s, vault_threshold: v }))}
                      min={1}
                      max={10}
                      step={0.5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Lock profits to vault when reaching this amount
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Risk Settings */}
          <TabsContent value="risk" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 space-y-6">
              <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm font-medium text-foreground">Risk Management</p>
                  <p className="text-xs text-muted-foreground">
                    Configure limits to protect your capital
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Max Daily Loss */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Daily Loss</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={formState.max_daily_loss}
                      onChange={(e) => setFormState(s => ({ ...s, max_daily_loss: Number(e.target.value) }))}
                      className="font-mono"
                      min={1}
                      max={1000}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Stop trading when daily losses reach this amount
                  </p>
                </div>

                {/* Max Position Size */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Position Size</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={formState.max_position_size}
                      onChange={(e) => setFormState(s => ({ ...s, max_position_size: Number(e.target.value) }))}
                      className="font-mono"
                      min={0.35}
                      max={100}
                      step={0.05}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum stake per individual trade
                  </p>
                </div>

                {/* Max Concurrent Trades */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Concurrent Trades</Label>
                  <Input
                    type="number"
                    value={formState.max_concurrent_trades}
                    onChange={(e) => setFormState(s => ({ ...s, max_concurrent_trades: Number(e.target.value) }))}
                    className="font-mono"
                    min={1}
                    max={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of open positions at once
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* API Settings */}
          <TabsContent value="api" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Deriv API Credentials</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Deriv account to enable live trading
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">App ID</Label>
                  <Input
                    type="text"
                    value={formState.app_id}
                    onChange={(e) => setFormState(s => ({ ...s, app_id: e.target.value }))}
                    placeholder="1089"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">API Token</Label>
                  <div className="relative">
                    <Input
                      type={showToken ? 'text' : 'password'}
                      value={formState.api_token}
                      onChange={(e) => setFormState(s => ({ ...s, api_token: e.target.value }))}
                      placeholder="Your Deriv API token"
                      className="pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your API token is encrypted and stored securely
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Sound Notifications</Label>
                  <p className="text-xs text-muted-foreground">Play sounds for wins and losses</p>
                </div>
                <Switch
                  checked={formState.sound_enabled}
                  onCheckedChange={(v) => setFormState(s => ({ ...s, sound_enabled: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Desktop Notifications</Label>
                  <p className="text-xs text-muted-foreground">Show alerts for important events</p>
                </div>
                <Switch
                  checked={formState.notifications_enabled}
                  onCheckedChange={(v) => setFormState(s => ({ ...s, notifications_enabled: v }))}
                />
              </div>
            </div>

            {/* Account Actions */}
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
              <h3 className="text-lg font-medium text-foreground mb-2">Account</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Signed in as {user?.email}
              </p>
              <Button variant="destructive" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
