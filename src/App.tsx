import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { IntradayChart } from './components/IntradayChart';
import { FactorCards } from './components/FactorCards';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { AiForecastPanel } from './components/AiForecastPanel';
import { FactorImpactRadar } from './components/FactorImpactRadar';
import { OrderBookDOM } from './components/OrderBookDOM';
import { NewsFeed } from './components/NewsFeed';
import { ExportModal } from './components/ExportModal';

import {
  BASELINE_SIMULATION,
  INITIAL_TICKER,
  INITIAL_NEWS,
  DEFAULT_PUBLIC_BENCHMARKS,
  calculateFactorImpacts,
  generateIntradayCandles,
  generateOrderBook,
  generateOfflineAiForecast,
  getTimeframeTargetLevels,
  buildPlaybook,
  buildMacroAnalysisAndRisks,
} from './services/marketModel';
import {
  SimulationParams,
  MarketTickerState,
  AiForecastResult,
  NewsItem,
  CandleData,
  OrderBookRow,
  PublicBenchmarkSources,
} from './types/market';

export default function App() {
  const getNowFormatted = () =>
    new Date().toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const [params, setParams] = useState<SimulationParams>(BASELINE_SIMULATION);
  const [ticker, setTicker] = useState<MarketTickerState>(INITIAL_TICKER);
  const [benchmarks, setBenchmarks] = useState<PublicBenchmarkSources>(DEFAULT_PUBLIC_BENCHMARKS);

  // Timeframe and multi-timeframe candles cache
  const [selectedTimeframe, setSelectedTimeframe] = useState<'5M' | '15M' | '1H'>('15M');
  const [isLoadingCandles, setIsLoadingCandles] = useState<boolean>(false);
  const [candlesCache, setCandlesCache] = useState<Record<'5M' | '15M' | '1H', CandleData[]>>({
    '5M': [],
    '15M': [],
    '1H': [],
  });

  const [realOrderBook, setRealOrderBook] = useState<{
    bids: OrderBookRow[];
    asks: OrderBookRow[];
    ratio: number;
  } | null>(null);
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);
  const [excludedNewsIds, setExcludedNewsIds] = useState<Set<string>>(
    () => new Set(['n10', 'archive-news-9', 'archive-news-8', 'archive-news-7'])
  );

  // Timestamps for each window
  const [marketUpdatedAt, setMarketUpdatedAt] = useState<string>(getNowFormatted());
  const [chartUpdatedAt, setChartUpdatedAt] = useState<string>(getNowFormatted());
  const [factorsUpdatedAt, setFactorsUpdatedAt] = useState<string>(getNowFormatted());
  const [simUpdatedAt, setSimUpdatedAt] = useState<string>(getNowFormatted());
  const [forecastUpdatedAt, setForecastUpdatedAt] = useState<string>(getNowFormatted());
  const [orderBookUpdatedAt, setOrderBookUpdatedAt] = useState<string>(getNowFormatted());
  const [newsUpdatedAt, setNewsUpdatedAt] = useState<string>(getNowFormatted());

  const [isLiveTick, setIsLiveTick] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isAnalyzingNews, setIsAnalyzingNews] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [showWhatIf, setShowWhatIf] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch real intraday candles from T-Bank Invest API for a specific timeframe
  const fetchLiveCandles = useCallback(
    async (tf: '5M' | '15M' | '1H' = selectedTimeframe) => {
      setIsLoadingCandles(true);
      try {
        const res = await fetch(`/api/tinkoff/candles?interval=${tf}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.candles) && data.candles.length > 0) {
          setCandlesCache((prev) => ({
            ...prev,
            [tf]: data.candles,
          }));
          const time = data.updatedAt || getNowFormatted();
          setChartUpdatedAt(time);
        }
      } catch (err) {
        console.warn(`Candles fetch for ${tf} issue, using adaptive fallback:`, err);
      } finally {
        setIsLoadingCandles(false);
      }
    },
    [selectedTimeframe]
  );

  // Handle switching between timeframes
  const handleTimeframeChange = useCallback(
    (newTf: '5M' | '15M' | '1H') => {
      setSelectedTimeframe(newTf);
      const tfName = newTf === '5M' ? '5М (Скальпинг)' : newTf === '1H' ? '1Ч (Сессионный тренд)' : '15М (Свинг)';
      showToast(`Таймфрейм: ${tfName} • Прогноз адаптирован`);

      // If not yet cached for this timeframe, fetch immediately
      if (!candlesCache[newTf] || candlesCache[newTf].length === 0) {
        fetchLiveCandles(newTf);
      }
    },
    [candlesCache, fetchLiveCandles]
  );

  // Fetch real-time live data from T-Bank Invest API
  const fetchLiveTinkoffData = useCallback(async (silent: boolean = false) => {
    if (!silent) setIsPolling(true);
    try {
      const res = await fetch('/api/tinkoff/market-data', {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success && data.ticker) {
        setTicker(data.ticker);
        const time = data.updatedAt || getNowFormatted();
        setMarketUpdatedAt(time);
        setChartUpdatedAt(time);
        setOrderBookUpdatedAt(time);

        if (data.publicSources) {
          setBenchmarks(data.publicSources);
        }

        if (data.orderBook) {
          setRealOrderBook(data.orderBook);
        }
        if (!silent) {
          showToast(`Котировки обновлены: ${data.ticker.price.toFixed(3)} ₽ (Т-Инвестиции)`);
        }
      }
    } catch (err) {
      if (!silent) {
        console.warn('T-Bank API polling issue, keeping current quotes:', err);
      }
    } finally {
      if (!silent) setIsPolling(false);
    }
  }, []);

  // Sync stress test parameters with live T-Investments quote & central bank benchmarks
  const handleSyncWithLiveBenchmarks = useCallback(() => {
    const liveBrent = ticker.brentPrice || (typeof benchmarks.brent.value === 'number' ? benchmarks.brent.value : 104.71);
    const time = getNowFormatted();
    setParams({
      oilBrent: Number(liveBrent),
      oilUralsDiscount: 12.2,
      sanctionsScore: 64,
      fiscalVolumeBln:
        typeof benchmarks.fiscalRule.value === 'number' ? benchmarks.fiscalRule.value : 14.4,
      importDemandScore: 68,
      taxPeriodPhase: 'pre_tax', // 09.11.2026 falls into pre_tax (1-24 числа)
      rusfarCnyRate: 9.4,
    });
    setSimUpdatedAt(time);
    setFactorsUpdatedAt(time);
    showToast(
      `Синхронизировано: Brent $${Number(liveBrent).toFixed(2)}, Бюджетное правило ${
        benchmarks.fiscalRule.value
      } млрд ₽/день (Релиз Минфина)`
    );
  }, [ticker.brentPrice, benchmarks]);

  // Fetch fresh macro news
  const fetchFreshNews = useCallback(async () => {
    try {
      const res = await fetch('/api/market/fresh-news', {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.news)) {
        setNews(data.news);
        const time = data.updatedAt || getNowFormatted();
        setNewsUpdatedAt(time);
        // Automatically exclude outdated items from forecast
        const outdatedIds = data.news
          .filter((n: any) => n.isOutdated || n.isExcludedFromForecast)
          .map((n: any) => n.id);
        if (outdatedIds.length > 0) {
          setExcludedNewsIds((prev) => {
            const next = new Set(prev);
            outdatedIds.forEach((id: string) => next.add(id));
            return next;
          });
        }
        showToast('Лента макро-новостей обновлена (устаревшие новости отсечены от прогноза)');
      }
    } catch (err) {
      console.warn('Failed to fetch fresh news:', err);
    }
  }, []);

  const handleToggleNewsExclusion = useCallback((id: string) => {
    setExcludedNewsIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Новость включена в модель прогноза');
      } else {
        next.add(id);
        showToast('Новость исключена из расчета (прогноз очищен от искажения)');
      }
      return next;
    });
  }, []);

  const handleReplaceOutdatedNews = useCallback((id: string) => {
    const todayStr = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const nowTimeStr = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const freshItem: NewsItem = {
      id: `fresh-catalyst-${Date.now()}`,
      time: nowTimeStr,
      date: todayStr,
      headline:
        'ЦБ РФ и Минфин: спрос на юани в рамках налогового периода 28 ноября удовлетворяется в полном объеме',
      source: 'Банк России / Т-Инвестиции',
      category: 'fiscal_rule',
      impactKopecks: -1.8,
      effectiveImpactKopecks: -1.8,
      decayFactor: 1.0,
      ageHours: 0.1,
      isOutdated: false,
      marketAbsorbed: false,
      isExcludedFromForecast: false,
      sentiment: 'cny_down',
      summary:
        'Регулярный приток юаней от экспортеров под выплаты НДПИ стабилизирует фьючерс CNYRUBF в диапазоне 12.06–12.11 ₽.',
      verified: true,
      updatedAt: `${todayStr}, ${nowTimeStr} МСК`,
    };

    setNews((prev) => prev.map((item) => (item.id === id ? freshItem : item)));
    setExcludedNewsIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      next.delete(freshItem.id);
      return next;
    });
    showToast('Устаревшая новость заменена актуальным катализатором текущей сессии');
  }, []);

  // On mount: fetch live market data, initial candles for 15M, and fresh news
  useEffect(() => {
    fetchLiveTinkoffData(true);
    fetchLiveCandles('15M');
    fetchLiveCandles('5M');
    fetchLiveCandles('1H');
    fetchFreshNews();
  }, [fetchLiveTinkoffData, fetchLiveCandles, fetchFreshNews]);

  // Polling loop for online quotes from T-Bank API
  useEffect(() => {
    if (!isLiveTick) return;

    const interval = setInterval(() => {
      fetchLiveTinkoffData(true);
    }, 4000);

    // Periodic auto-refresh for live financial news every 30 seconds
    const newsInterval = setInterval(() => {
      fetchFreshNews();
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(newsInterval);
    };
  }, [isLiveTick, fetchLiveTinkoffData, fetchFreshNews]);

  // Compute quantitative factor analysis based on live price
  const factorAnalysis = useMemo(() => {
    return calculateFactorImpacts(params, ticker.price);
  }, [params, ticker.price]);

  // Update factors timestamp when params change
  useEffect(() => {
    const time = getNowFormatted();
    setFactorsUpdatedAt(time);
    setSimUpdatedAt(time);
  }, [params]);

  // Initial forecast derived from quantitative engine + baseline
  const [forecast, setForecast] = useState<AiForecastResult>(() =>
    generateOfflineAiForecast(BASELINE_SIMULATION, INITIAL_TICKER.price)
  );

  // Synchronize offline targets, playbook and macro rationale when params or factor impacts change
  useEffect(() => {
    const time = getNowFormatted();
    const rec = factorAnalysis.recommendation;
    const net = factorAnalysis.netImpactKopecks;

    const playbook = buildPlaybook(
      rec,
      ticker.price,
      factorAnalysis.target1h,
      factorAnalysis.targetClose,
      factorAnalysis.rangeLow,
      factorAnalysis.rangeHigh
    );

    const { macroAnalysis, riskTriggers } = buildMacroAnalysisAndRisks(
      params,
      ticker.price,
      rec,
      net,
      factorAnalysis.targetClose,
      factorAnalysis.rangeLow,
      factorAnalysis.rangeHigh
    );

    setForecast((prev) => ({
      ...prev,
      target1h: factorAnalysis.target1h,
      target4h: factorAnalysis.target4h,
      targetClose: factorAnalysis.targetClose,
      rangeLow: factorAnalysis.rangeLow,
      rangeHigh: factorAnalysis.rangeHigh,
      netImpactKopecks: net,
      recommendation: rec,
      recommendationLabel:
        rec === 'BUY'
          ? 'Покупка CNY (Ослабление рубля)'
          : rec === 'SELL'
          ? 'Продажа CNY (Укрепление рубля)'
          : 'Вне рынка / Диапазон',
      confidencePct: factorAnalysis.confidencePct,
      playbook,
      macroAnalysis,
      riskTriggers,
      updatedAt: time,
    }));
    setForecastUpdatedAt(time);
  }, [factorAnalysis, ticker.price, params]);

  // Determine timeframe in minutes for candle generator
  const timeframeMinutes = useMemo(() => {
    if (selectedTimeframe === '5M') return 5;
    if (selectedTimeframe === '1H') return 60;
    return 15;
  }, [selectedTimeframe]);

  // Generate intraday candles with forecast cone based on current params, active timeframe, and real T-Bank candles
  const currentRealCandles = candlesCache[selectedTimeframe];
  const { all: candles } = useMemo(() => {
    return generateIntradayCandles(
      params,
      ticker.price,
      currentRealCandles.length > 0 ? currentRealCandles : undefined,
      timeframeMinutes
    );
  }, [params, ticker.price, currentRealCandles, timeframeMinutes]);

  // Orderbook DOM: prefer real live orderbook from T-Bank API, otherwise fallback
  const { bids, asks, ratio } = useMemo(() => {
    if (realOrderBook && realOrderBook.bids.length > 0 && realOrderBook.asks.length > 0) {
      return realOrderBook;
    }
    return generateOrderBook(ticker.price);
  }, [realOrderBook, ticker.price]);

  // Trigger server-side AI macro analysis with Gemini 3.8 Flash
  const handleRefreshAi = useCallback(async () => {
    setIsAiLoading(true);
    showToast('Синтез макроэкономического прогноза через Gemini 3.8 Flash...');

    try {
      const response = await fetch('/api/gemini/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(12000),
        body: JSON.stringify({
          currentPrice: ticker.price,
          simulationOverrides: params,
          intradayMetrics: {
            change: `${ticker.change >= 0 ? '+' : ''}${ticker.change.toFixed(3)}`,
            changePct: `${ticker.changePct}%`,
            vwap: ticker.vwap,
            fundingRate: `+${ticker.fundingRate}%`,
            fundingAnnualized: `${ticker.fundingAnnualized}%`,
            openInterest: ticker.openInterest.toLocaleString('ru-RU'),
            timeframe: selectedTimeframe,
          },
          recentNews: news
            .filter((n, idx) => !excludedNewsIds.has(n.id) && !n.isOutdated && idx !== 9)
            .slice(0, 4)
            .map((n) => n.headline),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.forecast) {
        const time = data.updatedAt || getNowFormatted();
        setForecast(data.forecast);
        setForecastUpdatedAt(time);
        showToast('AI-прогноз успешно обновлен (очищен от устаревших новостей)');
      } else {
        throw new Error(data.error || 'Invalid forecast format');
      }
    } catch (err) {
      console.warn('AI Forecast fallback:', err);
      const fallback = generateOfflineAiForecast(params, ticker.price);
      setForecast(fallback);
      setForecastUpdatedAt(getNowFormatted());
      showToast('Использован квантово-факторный прогноз (локальный расчет)');
    } finally {
      setIsAiLoading(false);
    }
  }, [params, ticker, news, selectedTimeframe, excludedNewsIds]);

  // Trigger server-side news analysis
  const handleAnalyzeCustomNews = useCallback(
    async (newsText: string) => {
      setIsAnalyzingNews(true);
      try {
        const response = await fetch('/api/gemini/analyze-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            newsText,
            currentPrice: ticker.price,
          }),
        });

        if (!response.ok) throw new Error('Failed to analyze');
        const data = await response.json();
        if (data.success && data.analysis) {
          const nowStr = new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const time = data.updatedAt || getNowFormatted();
          const newItem: NewsItem = {
            id: `user-${Date.now()}`,
            time: nowStr,
            headline: data.analysis.headline || newsText,
            source: 'Пользовательский ввод / Gemini AI',
            category: data.analysis.category || 'geopolitics',
            impactKopecks: data.analysis.expectedImpactKopecks || 0,
            sentiment: data.analysis.cnyDirection === 'UP' ? 'cny_up' : 'cny_down',
            summary: data.analysis.explanation || '',
            verified: true,
            updatedAt: time,
          };
          setNews((prev) => [newItem, ...prev]);
          setNewsUpdatedAt(time);
          showToast(`Новость добавлена: ${data.analysis.expectedImpactKopecks > 0 ? '+' : ''}${data.analysis.expectedImpactKopecks} коп.`);
          return data.analysis;
        }
      } catch (err) {
        console.warn('Failed to analyze custom news:', err);
        showToast('Не удалось связаться с AI-моделью для анализа новости');
      } finally {
        setIsAnalyzingNews(false);
      }
      return null;
    },
    [ticker.price]
  );

  const handleResetParams = () => {
    handleSyncWithLiveBenchmarks();
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-xl text-xs font-mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Terminal Header */}
      <Header
        ticker={ticker}
        isAiLoading={isAiLoading}
        onRefreshAi={handleRefreshAi}
        onRefreshLive={() => {
          fetchLiveTinkoffData(false);
          fetchLiveCandles(selectedTimeframe);
        }}
        isPolling={isPolling}
        onResetParams={handleResetParams}
        onOpenWhatIf={() => setShowWhatIf(!showWhatIf)}
        onOpenExport={() => setIsExportOpen(true)}
        isLiveTick={isLiveTick}
        onToggleLiveTick={() => setIsLiveTick(!isLiveTick)}
        updatedAt={marketUpdatedAt}
      />

      {/* Main Terminal Grid Body */}
      <main className="flex-1 p-3 sm:p-4 max-w-[1680px] w-full mx-auto space-y-4">
        {/* What-If Simulator Drawer / Card */}
        {showWhatIf && (
          <WhatIfSimulator
            params={params}
            onChangeParams={setParams}
            onReset={handleResetParams}
            netImpactKopecks={factorAnalysis.netImpactKopecks}
            onClose={() => setShowWhatIf(false)}
            updatedAt={simUpdatedAt}
            benchmarks={benchmarks}
            onSyncWithLive={handleSyncWithLiveBenchmarks}
            oilFutures={ticker.oilFutures}
            liveBrentPrice={ticker.brentPrice}
            onSelectOilContract={(contract) => {
              showToast(`Выбран фьючерс ${contract.ticker} (${contract.code}): $${contract.price.toFixed(2)} (Т-Инвестиции)`);
            }}
          />
        )}

        {/* 2-Column Responsive Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column (8 cols): Interactive Chart & Factor Pillars */}
          <div className="lg:col-span-8 space-y-4">
            {/* Intraday Candlestick Chart with Forecast Cone */}
            <IntradayChart
              candles={candles}
              currentPrice={ticker.price}
              netImpactKopecks={factorAnalysis.netImpactKopecks}
              recommendation={forecast.recommendation}
              updatedAt={chartUpdatedAt}
              timeframe={selectedTimeframe}
              onTimeframeChange={handleTimeframeChange}
              isLoadingCandles={isLoadingCandles}
            />

            {/* 4 Core Pillars Cards (Requested by user) */}
            <FactorCards
              factors={factorAnalysis.factors}
              updatedAt={factorsUpdatedAt}
            />

            {/* News and Catalysts Feed with AI custom news evaluator */}
            <NewsFeed
              news={news}
              onAnalyzeCustomNews={handleAnalyzeCustomNews}
              isAnalyzingNews={isAnalyzingNews}
              updatedAt={newsUpdatedAt}
              onRefreshNews={fetchFreshNews}
              excludedNewsIds={excludedNewsIds}
              onToggleExclusion={handleToggleNewsExclusion}
              onReplaceOutdatedNews={handleReplaceOutdatedNews}
            />
          </div>

          {/* Right Column (4 cols): AI Forecast Playbook, DOM, Factor Radar */}
          <div className="lg:col-span-4 space-y-4">
            {/* AI Synthesized Verdict & Trading Playbook */}
            <AiForecastPanel
              forecast={forecast}
              isLoading={isAiLoading}
              onRefresh={handleRefreshAi}
              currentPrice={ticker.price}
              updatedAt={forecastUpdatedAt}
            />

            {/* Factor Decomposition & Net Impact Radar */}
            <FactorImpactRadar
              factors={factorAnalysis.factors}
              netImpactKopecks={factorAnalysis.netImpactKopecks}
              updatedAt={factorsUpdatedAt}
            />

            {/* Depth of Market (DOM) / Стакан котировок с фандингом */}
            <OrderBookDOM
              bids={bids}
              asks={asks}
              ratio={ratio}
              currentPrice={ticker.price}
              fundingRate={ticker.fundingRate}
              nextFundingTime={ticker.nextFundingTime}
              updatedAt={orderBookUpdatedAt}
            />
          </div>
        </div>
      </main>

      {/* Footer / Terminal Info Bar */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-4 py-2.5 text-center text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-semibold">
            CNYRUBF Intraday Terminal • Т-Инвестиции Open API v2
          </span>
          <span>•</span>
          <span>Таймфрейм: {selectedTimeframe}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>ЦБ РФ Бюджетное правило: 8.4 млрд ₽/день</span>
          <span>•</span>
          <span>Нефть Brent: ${params.oilBrent.toFixed(2)}</span>
          <span>•</span>
          <span>Синхронизация: каждые 4 сек.</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">API Online: 100% OK</span>
        </div>
      </footer>

      {/* Export Report Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        ticker={ticker}
        params={params}
        forecast={forecast}
        factors={factorAnalysis.factors}
        benchmarks={benchmarks}
      />
    </div>
  );
}
