export interface DerivResponse {
  echo_req: { req_id: number; [key: string]: any };
  msg_type: string;
  req_id: number;
  [key: string]: any;
}

export interface AuthorizeResponse extends DerivResponse {
  authorize?: {
    account_list: Array<{
      account_type: string;
      currency: string;
      is_disabled: number;
      is_virtual: number;
      loginid: string;
    }>;
    balance: number;
    currency: string;
    email: string;
    fullname: string;
    loginid: string;
    user_id: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ActiveSymbol {
  allow_forward_starting: number;
  display_name: string;
  exchange_is_open: number;
  is_trading_suspended: number;
  market: string;
  market_display_name: string;
  pip: number;
  submarket: string;
  submarket_display_name: string;
  symbol: string;
  symbol_type: string;
}

export interface ActiveSymbolsResponse extends DerivResponse {
  active_symbols?: ActiveSymbol[];
  error?: {
    code: string;
    message: string;
  };
}

export interface TickResponse extends DerivResponse {
  tick?: {
    ask: number;
    bid: number;
    epoch: number;
    id: string;
    pip_size: number;
    quote: number;
    symbol: string;
  };
}

export interface ProposalResponse extends DerivResponse {
  proposal?: {
    ask_price: number;
    date_start: number;
    display_value: string;
    id: string;
    longcode: string;
    payout: number;
    spot: number;
    spot_time: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface BuyResponse extends DerivResponse {
  buy?: {
    balance_after: number;
    buy_price: number;
    contract_id: number;
    longcode: string;
    payout: number;
    purchase_time: number;
    start_time: number;
    transaction_id: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ContractUpdate {
  contract_id: number;
  status: 'open' | 'sold' | 'won' | 'lost';
  profit?: number;
  entry_spot?: number;
  current_spot?: number;
  exit_spot?: number;
  is_sold?: boolean;
}

export interface PortfolioResponse extends DerivResponse {
  portfolio?: {
    contracts: Array<{
      contract_id: number;
      contract_type: string;
      currency: string;
      date_start: number;
      expiry_time: number;
      longcode: string;
      payout: number;
      purchase_time: number;
      symbol: string;
      buy_price: number;
    }>;
  };
}

export interface ProposalOpenContractResponse extends DerivResponse {
  proposal_open_contract?: {
    contract_id: number;
    contract_type: string;
    currency: string;
    current_spot: number;
    current_spot_time: number;
    date_expiry: number;
    date_start: number;
    entry_spot: number;
    exit_tick?: number;
    exit_tick_time?: number;
    is_expired: number;
    is_forward_starting: number;
    is_intraday: number;
    is_path_dependent: number;
    is_settleable: number;
    is_sold: number;
    is_valid_to_cancel: number;
    is_valid_to_sell: number;
    longcode: string;
    payout: number;
    profit: number;
    profit_percentage: number;
    purchase_time: number;
    status: 'open' | 'won' | 'lost' | 'sold';
    transaction_ids: {
      buy: number;
      sell?: number;
    };
    underlying: string;
    validation_error?: string;
  };
}

export interface SellResponse extends DerivResponse {
  sell?: {
    balance_after: number;
    contract_id: number;
    reference_id: number;
    sold_for: number;
    transaction_id: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface TradeSettings {
  profitTarget: number;
  stake: number;
  minProbability: number;
  vaultThreshold: number;
}

export interface TradeHistoryEntry {
  id: string;
  timestamp: number;
  symbol: string;
  contractType: 'CALL' | 'PUT';
  stake: number;
  payout: number;
  profit: number;
  result: 'win' | 'loss';
  contractId: number;
}

export interface AssetPerformance {
  symbol: string;
  displayName: string;
  wins: number;
  losses: number;
  totalProfit: number;
  winRate: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'SYS' | 'SIG' | 'TRD' | 'VLT' | 'ERR';
  message: string;
}

export interface TradingState {
  isRunning: boolean;
  isConnected: boolean;
  isAuthorized: boolean;
  balance: number;
  totalProfit: number;
  winCount: number;
  lossCount: number;
  winStreak: number;
  currentStreak: number;
  vaultBalance: number;
  activePositions: ContractUpdate[];
  tradeHistory: TradeHistoryEntry[];
  assetPerformance: Map<string, AssetPerformance>;
  profitTimeline: Array<{ time: number; profit: number }>;
  logs: LogEntry[];
  allowedSymbols: ActiveSymbol[];
  currentSignal: {
    symbol: string;
    direction: 'CALL' | 'PUT';
    probability: number;
    reasoning: string;
  } | null;
}
