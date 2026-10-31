export interface CandleData {
  time: string; // '10:00', '10:15', etc.
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
  isForecast?: boolean;
  predictedBase?: number;
  predictedHigh?: number;
  predictedLow?: number;
}

export type FactorCategory = 'oil' | 'geopolitics' | 'fiscal_rule' | 'import_demand';

export interface FactorDetail {
  id: FactorCategory;
  name: string;
  shortTitle: string;
  currentValueDisplay: string;
  subMetric: string;
  sentiment: 'bullish_rub' | 'bearish_rub' | 'neutral'; // bullish_rub means ruble strengthens (cny goes down)
  impactKopecks: number; // e.g. -3.5 or +4.2
  weightPct: number; // e.g. 30%
  description: string;
  transmissionChannel: string;
  historicalCorrelation: string;
}

export interface PublicBenchmarkItem {
  title: string;
  source: string;
  value: number | string;
  unit?: string;
  status?: string;
  asOf: string;
}

export interface PublicBenchmarkSources {
  brent: PublicBenchmarkItem;
  uralsDiscount: PublicBenchmarkItem;
  fiscalRule: PublicBenchmarkItem;
  rusfarCny: PublicBenchmarkItem;
  sanctionsScore: PublicBenchmarkItem;
  importDemand: PublicBenchmarkItem;
  taxPeriod: PublicBenchmarkItem;
}

export interface SimulationParams {
  oilBrent: number; // $/barrel
  oilUralsDiscount: number; // $/barrel discount
  sanctionsScore: number; // 0-100 index
  fiscalVolumeBln: number; // billion rubles daily FX sale by CB
  importDemandScore: number; // 0-100 index
  taxPeriodPhase: 'pre_tax' | 'tax_peak' | 'post_tax'; // NDPI phase
  rusfarCnyRate: number; // % annual
}

export interface OrderBookRow {
  price: number;
  volume: number;
  total: number;
  type: 'bid' | 'ask';
}

export interface NewsItem {
  id: string;
  time: string;
  headline: string;
  source: string;
  category: FactorCategory | 'monetary';
  impactKopecks: number;
  sentiment: 'cny_up' | 'cny_down' | 'neutral';
  summary: string;
  verified: boolean;
  updatedAt?: string;
}

export interface AiForecastResult {
  recommendation: 'BUY' | 'SELL' | 'NEUTRAL';
  recommendationLabel: string;
  confidencePct: number;
  target1h: number;
  target4h: number;
  targetClose: number;
  rangeLow: number;
  rangeHigh: number;
  netImpactKopecks: number;
  playbook: {
    entry: string;
    takeProfit1: string;
    takeProfit2: string;
    stopLoss: string;
    riskRewardRatio: string;
    timeHorizon: string;
  };
  factorBreakdown: {
    name: string;
    impactKopecks: number;
    sentiment: 'bullish_rub' | 'bearish_rub' | 'neutral';
    commentary: string;
  }[];
  macroAnalysis: string;
  riskTriggers: string[];
  updatedAt?: string;
}

export interface MarketTickerState {
  symbol: string;
  name: string;
  price: number;
  closePrice?: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  vwap: number;
  openInterest: number;
  volumeTotal: number;
  fundingRate: number; // e.g. +0.038%
  fundingAnnualized: number; // e.g. 14.2%
  fundingSpreadKopecks?: number;
  spotPrice?: number;
  brentPrice?: number;
  nextFundingTime: string;
  sessionState: 'MAIN_SESSION' | 'EVENING_SESSION' | 'PRE_MARKET';
  lastUpdated: string;
  apiSource?: string;
}
