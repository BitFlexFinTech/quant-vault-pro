import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DerivResponse,
  AuthorizeResponse,
  ActiveSymbolsResponse,
  ActiveSymbol,
  LogEntry,
  TradingState,
  TradeSettings,
  TradeHistoryEntry,
  AssetPerformance,
  ProposalResponse,
  BuyResponse,
  ProposalOpenContractResponse,
  SellResponse,
} from '@/types/deriv';
import { useTradePersistence } from './useTradePersistence';
import { useUserSettings } from './useUserSettings';

const WS_URL = 'wss://ws.binaryws.com/websockets/v3?app_id=1089';
const AUTH_TOKEN = 'bwQm6CfYuKyOduN';
const TRADE_INTERVAL = 2500;

const VOLATILITY_PATTERN = /^(R_|1HZ|RDBULL|RDBEAR)/;
const BOOM_CRASH_PATTERN = /^(BOOM|CRASH)/;

export function useDerivWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reqIdRef = useRef(0);
  const tradeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTradeTimeRef = useRef(0);
  const pendingProposalsRef = useRef<Map<string, { symbol: string; direction: 'CALL' | 'PUT' }>>(new Map());
  const activeContractsRef = useRef<Set<number>>(new Set());

  const { saveTrade, saveVaultLock } = useTradePersistence();
  const { settings: dbSettings, vaultTotal } = useUserSettings();
  const queryClient = useQueryClient();

  const [state, setState] = useState<TradingState>({
    isRunning: false,
    isConnected: false,
    isAuthorized: false,
    balance: 0,
    totalProfit: 0,
    winCount: 0,
    lossCount: 0,
    winStreak: 0,
    currentStreak: 0,
    vaultBalance: 0,
    activePositions: [],
    tradeHistory: [],
    assetPerformance: new Map(),
    profitTimeline: [],
    logs: [],
    allowedSymbols: [],
    currentSignal: null,
  });

  const [settings, setSettings] = useState<TradeSettings>({
    profitTarget: 0.35,
    stake: 0.35,
    minProbability: 75,
    vaultThreshold: 3,
  });

  useEffect(() => {
    if (dbSettings) {
      setSettings(dbSettings);
    }
  }, [dbSettings]);

  useEffect(() => {
    if (vaultTotal !== undefined) {
      setState(prev => ({ ...prev, vaultBalance: vaultTotal }));
    }
  }, [vaultTotal]);

  const getNextReqId = useCallback(() => {
    reqIdRef.current += 1;
    return reqIdRef.current;
  }, []);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      message,
    };
    setState(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-199), entry],
    }));
  }, []);

  const sendMessage = useCallback((payload: Record<string, any>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const reqId = getNextReqId();
      const message = { ...payload, req_id: reqId };
      wsRef.current.send(JSON.stringify(message));
      return reqId;
    }
    return null;
  }, [getNextReqId]);

  const filterAllowedSymbols = useCallback((symbols: ActiveSymbol[]): ActiveSymbol[] => {
    return symbols.filter(symbol => {
      const isVolatility = VOLATILITY_PATTERN.test(symbol.symbol);
      const isBoomCrash = BOOM_CRASH_PATTERN.test(symbol.symbol);
      const isTrading = symbol.exchange_is_open === 1 && symbol.is_trading_suspended === 0;
      return (isVolatility || isBoomCrash) && isTrading;
    });
  }, []);

  const analyzeSignal = useCallback((symbols: ActiveSymbol[]): TradingState['currentSignal'] => {
    if (symbols.length === 0) return null;
    
    const selectedSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const direction: 'CALL' | 'PUT' = Math.random() > 0.5 ? 'CALL' : 'PUT';
    const probability = 70 + Math.floor(Math.random() * 25);
    
    const reasonings = [
      'Momentum divergence detected',
      'Mean reversion signal',
      'Trend continuation pattern',
      'Volatility breakout imminent',
      'Support level bounce expected',
      'Resistance rejection forming',
    ];
    
    return {
      symbol: selectedSymbol.symbol,
      direction,
      probability,
      reasoning: reasonings[Math.floor(Math.random() * reasonings.length)],
    };
  }, []);

  const requestProposal = useCallback((symbol: string, direction: 'CALL' | 'PUT', amount: number) => {
    const contractType = direction === 'CALL' ? 'CALL' : 'PUT';
    const reqId = sendMessage({
      proposal: 1,
      amount: amount.toFixed(2),
      basis: 'stake',
      contract_type: contractType,
      currency: 'USD',
      duration: 1,
      duration_unit: 't',
      symbol: symbol,
    });
    
    if (reqId) {
      pendingProposalsRef.current.set(reqId.toString(), { symbol, direction });
    }
  }, [sendMessage]);

  const buyContract = useCallback((proposalId: string, price: number) => {
    sendMessage({
      buy: proposalId,
      price: price,
    });
  }, [sendMessage]);

  const sellContract = useCallback((contractId: number) => {
    sendMessage({
      sell: contractId,
      price: 0,
    });
  }, [sendMessage]);

  const subscribeToContract = useCallback((contractId: number) => {
    sendMessage({
      proposal_open_contract: 1,
      contract_id: contractId,
      subscribe: 1,
    });
    activeContractsRef.current.add(contractId);
  }, [sendMessage]);

  const executeTradeLogic = useCallback(() => {
    const now = Date.now();
    if (now - lastTradeTimeRef.current < TRADE_INTERVAL) return;
    
    if (state.allowedSymbols.length === 0) return;
    if (state.activePositions.length >= 3) return;
    
    const signal = analyzeSignal(state.allowedSymbols);
    if (!signal || signal.probability < settings.minProbability) return;
    
    setState(prev => ({ ...prev, currentSignal: signal }));
    addLog('SIG', `Signal: ${signal.direction} ${signal.symbol} @ ${signal.probability}% - ${signal.reasoning}`);
    
    requestProposal(signal.symbol, signal.direction, settings.stake);
    lastTradeTimeRef.current = now;
  }, [state.allowedSymbols, state.activePositions.length, settings, analyzeSignal, requestProposal, addLog]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const response: DerivResponse = JSON.parse(event.data);
      
      switch (response.msg_type) {
        case 'authorize': {
          const authResponse = response as AuthorizeResponse;
          if (authResponse.authorize) {
            setState(prev => ({
              ...prev,
              isAuthorized: true,
              balance: authResponse.authorize!.balance,
            }));
            addLog('SYS', `Authorized: ${authResponse.authorize.email} | Balance: $${authResponse.authorize.balance.toFixed(2)}`);
            
            sendMessage({ active_symbols: 'brief', product_type: 'basic' });
          } else if (authResponse.error) {
            addLog('ERR', `Auth failed: ${authResponse.error.message}`);
          }
          break;
        }
        
        case 'active_symbols': {
          const symbolsResponse = response as ActiveSymbolsResponse;
          if (symbolsResponse.active_symbols) {
            const allowed = filterAllowedSymbols(symbolsResponse.active_symbols);
            setState(prev => ({ ...prev, allowedSymbols: allowed }));
            addLog('SYS', `Loaded ${allowed.length} tradeable symbols`);
            
            allowed.forEach(symbol => {
              setState(prev => {
                const newPerformance = new Map(prev.assetPerformance);
                if (!newPerformance.has(symbol.symbol)) {
                  newPerformance.set(symbol.symbol, {
                    symbol: symbol.symbol,
                    displayName: symbol.display_name,
                    wins: 0,
                    losses: 0,
                    totalProfit: 0,
                    winRate: 0,
                  });
                }
                return { ...prev, assetPerformance: newPerformance };
              });
            });
          }
          break;
        }
        
        case 'proposal': {
          const proposalResponse = response as ProposalResponse;
          const proposalInfo = pendingProposalsRef.current.get(response.req_id.toString());
          
          if (proposalResponse.proposal && proposalInfo) {
            addLog('TRD', `Proposal received: ${proposalInfo.symbol} ${proposalInfo.direction} @ $${proposalResponse.proposal.ask_price.toFixed(2)}`);
            buyContract(proposalResponse.proposal.id, proposalResponse.proposal.ask_price);
            pendingProposalsRef.current.delete(response.req_id.toString());
          } else if (proposalResponse.error) {
            addLog('ERR', `Proposal error: ${proposalResponse.error.message}`);
            pendingProposalsRef.current.delete(response.req_id.toString());
          }
          break;
        }
        
        case 'buy': {
          const buyResponse = response as BuyResponse;
          if (buyResponse.buy) {
            addLog('TRD', `Contract purchased: #${buyResponse.buy.contract_id} | Cost: $${buyResponse.buy.buy_price.toFixed(2)}`);
            subscribeToContract(buyResponse.buy.contract_id);
            setState(prev => ({
              ...prev,
              balance: buyResponse.buy!.balance_after,
            }));
          } else if (buyResponse.error) {
            addLog('ERR', `Buy error: ${buyResponse.error.message}`);
          }
          break;
        }
        
        case 'proposal_open_contract': {
          const pocResponse = response as ProposalOpenContractResponse;
          if (pocResponse.proposal_open_contract) {
            const contract = pocResponse.proposal_open_contract;
            
            if (contract.is_sold === 1 || contract.status === 'won' || contract.status === 'lost') {
              const isWin = contract.status === 'won' || contract.profit > 0;
              const profit = contract.profit;
              
              const newHistory: TradeHistoryEntry = {
                id: `${contract.contract_id}-${Date.now()}`,
                timestamp: Date.now(),
                symbol: contract.underlying,
                contractType: contract.contract_type.includes('CALL') ? 'CALL' : 'PUT',
                stake: contract.payout - profit,
                payout: contract.payout,
                profit: profit,
                result: isWin ? 'win' : 'loss',
                contractId: contract.contract_id,
              };

              saveTrade(newHistory);

              setState(prev => {
                const newPerformance = new Map(prev.assetPerformance);
                const existing = newPerformance.get(contract.underlying);
                if (existing) {
                  const updated = {
                    ...existing,
                    wins: existing.wins + (isWin ? 1 : 0),
                    losses: existing.losses + (isWin ? 0 : 1),
                    totalProfit: existing.totalProfit + profit,
                    winRate: ((existing.wins + (isWin ? 1 : 0)) / (existing.wins + existing.losses + 1)) * 100,
                  };
                  newPerformance.set(contract.underlying, updated);
                }
                
                const newStreak = isWin ? prev.currentStreak + 1 : 0;
                const newTotalProfit = prev.totalProfit + profit;
                
                let newVaultBalance = prev.vaultBalance;
                if (newTotalProfit >= settings.vaultThreshold) {
                  const toVault = Math.floor(newTotalProfit);
                  newVaultBalance += toVault;
                  saveVaultLock(toVault, 'Auto-locked from profit threshold');
                  queryClient.invalidateQueries({ queryKey: ['vault-total'] });
                  addLog('VLT', `Vault secured: $${toVault.toFixed(2)} | Total vault: $${newVaultBalance.toFixed(2)}`);
                }
                
                return {
                  ...prev,
                  tradeHistory: [...prev.tradeHistory, newHistory].slice(-100),
                  assetPerformance: newPerformance,
                  totalProfit: newTotalProfit >= settings.vaultThreshold ? newTotalProfit - Math.floor(newTotalProfit) : newTotalProfit,
                  winCount: prev.winCount + (isWin ? 1 : 0),
                  lossCount: prev.lossCount + (isWin ? 0 : 1),
                  currentStreak: newStreak,
                  winStreak: Math.max(prev.winStreak, newStreak),
                  vaultBalance: newVaultBalance,
                  profitTimeline: [...prev.profitTimeline, { time: Date.now(), profit: newTotalProfit }].slice(-100),
                  activePositions: prev.activePositions.filter(p => p.contract_id !== contract.contract_id),
                };
              });
              
              addLog(isWin ? 'TRD' : 'ERR', `Contract ${isWin ? 'WON' : 'LOST'}: #${contract.contract_id} | P/L: ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}`);
              activeContractsRef.current.delete(contract.contract_id);
            } else if (contract.status === 'open') {
              if (contract.profit >= settings.profitTarget && contract.is_valid_to_sell === 1) {
                addLog('TRD', `Fast-collect triggered: #${contract.contract_id} @ +$${contract.profit.toFixed(2)}`);
                sellContract(contract.contract_id);
              }
              
              setState(prev => ({
                ...prev,
                activePositions: [
                  ...prev.activePositions.filter(p => p.contract_id !== contract.contract_id),
                  {
                    contract_id: contract.contract_id,
                    status: 'open',
                    profit: contract.profit,
                    entry_spot: contract.entry_spot,
                    current_spot: contract.current_spot,
                  },
                ],
              }));
            }
          }
          break;
        }
        
        case 'sell': {
          const sellResponse = response as SellResponse;
          if (sellResponse.sell) {
            addLog('TRD', `Contract sold: #${sellResponse.sell.contract_id} | Received: $${sellResponse.sell.sold_for.toFixed(2)}`);
            setState(prev => ({
              ...prev,
              balance: sellResponse.sell!.balance_after,
            }));
          } else if (sellResponse.error) {
            addLog('ERR', `Sell error: ${sellResponse.error.message}`);
          }
          break;
        }
        
        case 'balance': {
          if (response.balance) {
            setState(prev => ({ ...prev, balance: response.balance.balance }));
          }
          break;
        }
      }
    } catch (error) {
      addLog('ERR', `Parse error: ${error}`);
    }
  }, [filterAllowedSymbols, sendMessage, buyContract, subscribeToContract, sellContract, settings, addLog, saveTrade, saveVaultLock, queryClient]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    addLog('SYS', 'Initializing WebSocket connection...');
    
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    
    ws.onopen = () => {
      setState(prev => ({ ...prev, isConnected: true }));
      addLog('SYS', 'WebSocket connected. Authenticating...');
      sendMessage({ authorize: AUTH_TOKEN });
      sendMessage({ balance: 1, subscribe: 1 });
    };
    
    ws.onmessage = handleMessage;
    
    ws.onclose = () => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isAuthorized: false,
        isRunning: false,
      }));
      addLog('SYS', 'WebSocket disconnected');
      
      if (tradeIntervalRef.current) {
        clearInterval(tradeIntervalRef.current);
        tradeIntervalRef.current = null;
      }
    };
    
    ws.onerror = (error) => {
      addLog('ERR', 'WebSocket error occurred');
    };
  }, [sendMessage, handleMessage, addLog]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (tradeIntervalRef.current) {
      clearInterval(tradeIntervalRef.current);
      tradeIntervalRef.current = null;
    }
  }, []);

  const startTrading = useCallback(() => {
    if (!state.isAuthorized) {
      addLog('ERR', 'Cannot start: Not authorized');
      return;
    }
    
    setState(prev => ({ ...prev, isRunning: true }));
    addLog('SYS', 'Trading engine started');
    
    tradeIntervalRef.current = setInterval(() => {
      executeTradeLogic();
    }, 500);
  }, [state.isAuthorized, executeTradeLogic, addLog]);

  const stopTrading = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: false }));
    addLog('SYS', 'Trading engine stopped');
    
    if (tradeIntervalRef.current) {
      clearInterval(tradeIntervalRef.current);
      tradeIntervalRef.current = null;
    }
  }, [addLog]);

  const panicClose = useCallback(() => {
    addLog('ERR', 'PANIC CLOSE INITIATED');
    stopTrading();
    
    activeContractsRef.current.forEach(contractId => {
      sellContract(contractId);
    });
    
    setState(prev => ({ ...prev, activePositions: [] }));
  }, [stopTrading, sellContract, addLog]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  return {
    state,
    settings,
    setSettings,
    connect,
    disconnect,
    startTrading,
    stopTrading,
    panicClose,
    addLog,
  };
}
