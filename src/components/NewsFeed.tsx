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
  const [analysisResult, setAnalysisResult] = useState<{
    headline: string;
    category: FactorCategory;
    cnyDirection: 'UP' | 'DOWN' | 'NEUTRAL';
    expectedImpactKopecks: number;
    explanation: string;
    timeframe: string;
  } | null>(null);

  const filteredNews = filterCategory === 'all'
    ? news
    : news.filter((n) => n.category === filterCategory);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim() || isAnalyzingNews) return;
    const res = await onAnalyzeCustomNews(customInput.trim());
    if (res) {
      setAnalysisResult(res);
      setCustomInput('');
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

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-3.5">
      {/* Header & Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
            <Newspaper className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-mono">
              Лента Новостей & Макро-Катализаторов
            </h3>
            <p className="text-[10px] text-slate-400">
              Оценка влияния новостей на CNYRUBF
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 text-[11px] font-mono overflow-x-auto">
          {(
            [
              ['all', 'Все'],
              ['oil', 'Нефть'],
              ['geopolitics', 'Санкции'],
              ['fiscal_rule', 'Бюджет'],
              ['import_demand', 'Импорт'],
            ] as const
          ).map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat as any)}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                filterCategory === cat
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Custom News Analyzer Bar */}
      <form onSubmit={handleAnalyze} className="relative">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Вставьте новость (например: ЦБ увеличил продажи валюты вдвое)..."
            className="flex-1 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none font-sans"
          />
          <button
            type="submit"
            disabled={isAnalyzingNews || !customInput.trim()}
            className="px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
          >
            {isAnalyzingNews ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>Оценить эффект</span>
          </button>
        </div>
      </form>

      {/* Analysis Result Banner if present */}
      {analysisResult && (
        <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-3 font-mono text-xs space-y-1.5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Экспресс-анализ Gemini: {analysisResult.headline}
            </span>
            <span
              className={`px-2 py-0.5 rounded font-bold ${
                analysisResult.cnyDirection === 'UP'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {analysisResult.expectedImpactKopecks > 0 ? '+' : ''}
              {analysisResult.expectedImpactKopecks} коп. (CNY {analysisResult.cnyDirection === 'UP' ? '↑' : '↓'})
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            {analysisResult.explanation}
          </p>
          <div className="text-[10px] text-slate-400">
            Горизонт трансмиссии: <strong className="text-slate-200">{analysisResult.timeframe}</strong>
          </div>
        </div>
      )}

      {/* News List */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {filteredNews.map((item) => (
          <div
            key={item.id}
            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-1.5"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{item.time}</span>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  {getCategoryIcon(item.category)}
                  {getCategoryLabel(item.category)}
                </span>
                <span className="text-slate-400 truncate max-w-[120px]">{item.source}</span>
              </div>

              {/* Impact Badge */}
              <span
                className={`px-2 py-0.5 rounded font-bold ${
                  item.impactKopecks >= 0
                    ? 'bg-rose-950/70 text-rose-400 border border-rose-800/60'
                    : 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
                }`}
              >
                {item.impactKopecks > 0 ? '+' : ''}
                {item.impactKopecks} коп.
              </span>
            </div>

            <h4 className="text-xs font-semibold text-slate-100 leading-snug">
              {item.headline}
            </h4>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              {item.summary}
            </p>
          </div>
        ))}
      </div>

      {/* Window Bottom Timestamp Bar */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Дата и время обновления ленты новостей:</span>
          <strong className="text-amber-300">{updatedAt}</strong>
        </span>
        {onRefreshNews && (
          <button
            onClick={onRefreshNews}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Обновить ленту</span>
          </button>
        )}
      </div>
    </div>
  );
};
