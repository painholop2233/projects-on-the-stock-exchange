import React, { useState } from 'react';
import {
  Newspaper,
  Flame,
  ShieldAlert,
  Landmark,
  ShoppingCart,
  Send,
  Sparkles,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Clock,
  Radio,
  TrendingUp,
  TrendingDown,
  Filter,
} from 'lucide-react';
import { NewsItem, FactorCategory } from '../types/market';

interface NewsFeedProps {
  news: NewsItem[];
  onAnalyzeCustomNews: (text: string) => Promise<{
    headline: string;
    category: FactorCategory;
    cnyDirection: 'UP' | 'DOWN' | 'NEUTRAL';
    expectedImpactKopecks: number;
    explanation: string;
    timeframe: string;
  } | null>;
  isAnalyzingNews: boolean;
  updatedAt: string;
  onRefreshNews?: () => void;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({
  news,
  onAnalyzeCustomNews,
  isAnalyzingNews,
  updatedAt,
  onRefreshNews,
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | FactorCategory>('all');
  const [customInput, setCustomInput] = useState('');
  const [isRefreshingLocal, setIsRefreshingLocal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    headline: string;
    category: FactorCategory;
    cnyDirection: 'UP' | 'DOWN' | 'NEUTRAL';
    expectedImpactKopecks: number;
    explanation: string;
    timeframe: string;
  } | null>(null);

  const filteredNews =
    filterCategory === 'all' ? news : news.filter((n) => n.category === filterCategory);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim() || isAnalyzingNews) return;
    const res = await onAnalyzeCustomNews(customInput.trim());
    if (res) {
      setAnalysisResult(res);
      setCustomInput('');
    }
  };

  const handleQuickAnalyze = async (headline: string) => {
    setCustomInput(headline);
    const res = await onAnalyzeCustomNews(headline);
    if (res) {
      setAnalysisResult(res);
    }
  };

  const handleManualRefresh = () => {
    if (onRefreshNews) {
      setIsRefreshingLocal(true);
      onRefreshNews();
      setTimeout(() => setIsRefreshingLocal(false), 800);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'oil':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case 'geopolitics':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
      case 'fiscal_rule':
        return <Landmark className="w-3.5 h-3.5 text-cyan-400" />;
      case 'import_demand':
        return <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Newspaper className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'oil':
        return 'Нефть & Экспорт';
      case 'geopolitics':
        return 'Геополитика & Санкции';
      case 'fiscal_rule':
        return 'Бюджетное правило';
      case 'import_demand':
        return 'Импорт & Спрос';
      default:
        return 'Макро';
    }
  };

  const getSourceBadgeColor = (source: string) => {
    if (/прайм/i.test(source)) return 'bg-blue-950/70 text-blue-300 border-blue-800/60';
    if (/рбк/i.test(source)) return 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60';
    if (/банк россии|цб/i.test(source)) return 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60';
    if (/интерфакс/i.test(source)) return 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60';
    if (/т-инвестиции|т-банк/i.test(source)) return 'bg-amber-950/70 text-amber-300 border-amber-800/60';
    return 'bg-slate-900 text-slate-300 border-slate-800';
  };

  const countsByCategory = {
    all: news.length,
    oil: news.filter((n) => n.category === 'oil').length,
    geopolitics: news.filter((n) => n.category === 'geopolitics').length,
    fiscal_rule: news.filter((n) => n.category === 'fiscal_rule').length,
    import_demand: news.filter((n) => n.category === 'import_demand').length,
  };

  return (
    <div className="bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-4 transition-all duration-300">
      {/* Top Header: Title, Live Radio Indicator & Refresh Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-100 font-mono tracking-tight">
                Лента Макро-Новостей & Катализаторов
              </h3>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>LIVE ТРАНСЛЯЦИЯ ОНЛАЙН</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Прямой поток финансово-экономических новостей (ПРАЙМ, РБК, Банк России, Т-Инвестиции)
            </p>
          </div>
        </div>

        {/* Live Refresh Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshingLocal}
            className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-mono font-semibold text-cyan-300 hover:text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
            title="Обновить поток новостей онлайн"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshingLocal ? 'animate-spin' : ''}`}
            />
            <span>Обновить ленту</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs with Dynamic Item Counts */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 pl-1 pr-1 font-sans">
            <Filter className="w-3 h-3 text-slate-400" />
            Фильтр:
          </span>
          {(
            [
              ['all', 'Все новости', countsByCategory.all],
              ['oil', 'Нефть & Экспорт', countsByCategory.oil],
              ['geopolitics', 'Санкции & Китай', countsByCategory.geopolitics],
              ['fiscal_rule', 'Бюджетное правило', countsByCategory.fiscal_rule],
              ['import_demand', 'Импорт & Спрос', countsByCategory.import_demand],
            ] as const
          ).map(([cat, label, count]) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat as any)}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 text-[11px] whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30'
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>{label}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] ${
                  filterCategory === cat ? 'bg-cyan-800 text-cyan-100' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Custom News Analyzer Bar */}
      <form onSubmit={handleAnalyze} className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Вставьте новость для экспресс-оценки влияния на CNYRUBF (например: ЦБ увеличил продажи валюты вдвое)..."
              className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none font-sans transition-colors"
            />
            {customInput && (
              <button
                type="button"
                onClick={() => setCustomInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isAnalyzingNews || !customInput.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shrink-0 shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            {isAnalyzingNews ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>Оценить в Gemini</span>
          </button>
        </div>
      </form>

      {/* Analysis Result Banner if present */}
      {analysisResult && (
        <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-slate-950/80 border border-cyan-500/50 rounded-xl p-3.5 font-mono text-xs space-y-2 animate-in fade-in slide-in-from-top-1 duration-300 shadow-xl">
          <div className="flex items-center justify-between border-b border-cyan-800/60 pb-2">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Экспресс-анализ Gemini: {analysisResult.headline}</span>
            </span>
            <span
              className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 ${
                analysisResult.cnyDirection === 'UP'
                  ? 'bg-rose-950 text-rose-300 border border-rose-700'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
              }`}
            >
              {analysisResult.cnyDirection === 'UP' ? (
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>
                {analysisResult.expectedImpactKopecks > 0 ? '+' : ''}
                {analysisResult.expectedImpactKopecks} коп. (CNY {analysisResult.cnyDirection === 'UP' ? '↑' : '↓'})
              </span>
            </span>
          </div>
          <p className="text-xs text-slate-200 font-sans leading-relaxed">
            {analysisResult.explanation}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>
              Горизонт трансмиссии: <strong className="text-slate-200">{analysisResult.timeframe}</strong>
            </span>
            <button
              onClick={() => setAnalysisResult(null)}
              className="text-cyan-400 hover:text-cyan-300 text-[11px] underline"
            >
              Свернуть анализ
            </button>
          </div>
        </div>
      )}

      {/* News List with Explicit Date Badges & Real Timestamps */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {filteredNews.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            Нет новостей в выбранной категории
          </div>
        ) : (
          filteredNews.map((item) => {
            const isCnyUp = item.sentiment === 'cny_up' || item.impactKopecks > 0;
            const impactSign = item.impactKopecks > 0 ? '+' : '';

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2 group"
              >
                {/* Meta Row: Date, Time, Category, Source & Impact */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Explicit Current Date Badge */}
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-bold text-[10px]">
                      <Calendar className="w-3 h-3 text-cyan-400" />
                      <span>{item.date || 'Сегодня'}</span>
                    </span>

                    {/* Exact Time Badge */}
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.time} МСК</span>
                    </span>

                    {/* Category Pill */}
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                      {getCategoryIcon(item.category)}
                      <span>{getCategoryLabel(item.category)}</span>
                    </span>

                    {/* Source Pill */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getSourceBadgeColor(
                        item.source
                      )}`}
                    >
                      {item.source}
                    </span>
                  </div>

                  {/* Impact on CNYRUBF Badge */}
                  <div
                    className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-bold flex items-center gap-1 ${
                      isCnyUp
                        ? 'bg-rose-950/80 text-rose-300 border-rose-700/70 shadow-sm shadow-rose-950'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/70 shadow-sm shadow-emerald-950'
                    }`}
                    title={
                      isCnyUp
                        ? 'Фактор толкает юань вверх (ослабляет рубль)'
                        : 'Фактор давит на юань вниз (укрепляет рубль)'
                    }
                  >
                    {isCnyUp ? (
                      <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>
                      {impactSign}
                      {item.impactKopecks} коп. (CNY {isCnyUp ? '↑' : '↓'})
                    </span>
                  </div>
                </div>

                {/* News Headline */}
                <h4 className="text-sm font-semibold text-slate-100 leading-snug group-hover:text-cyan-200 transition-colors">
                  {item.headline}
                </h4>

                {/* Summary / Economic Transmission */}
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {item.summary}
                </p>

                {/* Quick Action Button */}
                <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-900">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    Верифицировано биржевой аналитикой
                  </span>
                  <button
                    onClick={() => handleQuickAnalyze(item.headline)}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Рассчитать влияние в Gemini</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Window Bottom Timestamp & Auto-sync Bar */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Дата и время обновления ленты:</span>
          <strong className="text-amber-300">{updatedAt}</strong>
        </span>
        <span className="text-slate-500 flex items-center gap-1">
          <span>Автообновление: каждые 30 сек. • Потоки: ПРАЙМ, РБК, Банк России, Т-Инвестиции</span>
        </span>
      </div>
    </div>
  );
};
