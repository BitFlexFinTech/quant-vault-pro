import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TradeHistoryEntry } from '@/types/deriv';

export function useTradePersistence() {
  const { user } = useAuth();

  const saveTrade = useCallback(async (trade: TradeHistoryEntry) => {
    if (!user) return;

    const { error } = await supabase.from('trade_history').insert({
      user_id: user.id,
      contract_id: trade.contractId,
      symbol: trade.symbol,
      contract_type: trade.contractType,
      stake: trade.stake,
      payout: trade.payout,
      profit: trade.profit,
      result: trade.result,
      executed_at: new Date(trade.timestamp).toISOString(),
    });

    if (error) {
      console.error('Failed to save trade:', error);
    }
  }, [user]);

  const saveVaultLock = useCallback(async (amount: number, notes?: string) => {
    if (!user) return;

    const { error } = await supabase.from('vault_locks').insert({
      user_id: user.id,
      amount,
      notes,
    });

    if (error) {
      console.error('Failed to save vault lock:', error);
    }
  }, [user]);

  return { saveTrade, saveVaultLock };
}
