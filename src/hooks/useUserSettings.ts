import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TradeSettings } from '@/types/deriv';

export function useUserSettings() {
  const { user } = useAuth();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async (): Promise<TradeSettings | null> => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Failed to fetch settings:', error);
        return null;
      }
      
      return {
        profitTarget: Number(data.profit_target) || 0.35,
        stake: Number(data.stake_amount) || 0.35,
        minProbability: data.min_probability || 75,
        vaultThreshold: Number(data.vault_threshold) || 3,
      };
    },
    enabled: !!user,
  });

  const { data: vaultTotal = 0 } = useQuery({
    queryKey: ['vault-total', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { data, error } = await supabase
        .from('vault_locks')
        .select('amount')
        .eq('user_id', user.id);
      
      if (error) return 0;
      
      return data.reduce((sum, v) => sum + Number(v.amount), 0);
    },
    enabled: !!user,
  });

  return { settings, vaultTotal, isLoading };
}
