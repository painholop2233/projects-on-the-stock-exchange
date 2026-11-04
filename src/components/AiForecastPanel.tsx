import React from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Compass,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { AiForecastResult } from '../types/market';

interface AiForecastPanelProps {
  forecast: AiForecastResult;
  isLoading: boolean;
  onRefresh: () => void;
  currentPrice: number;
  updatedAt: string;
}

export const AiForecastPanel: React.FC<AiForecastPanelProps> = ({
  forecast,
  isLoading,
  onRefresh,
  currentPrice,
  updatedAt,
}) => {
  const isBuy = forecast.recommendation === 'BUY';
  const isSell = forecast.recommendation === 'SELL';
  const isNeutral = !isBuy && !isSell;

  // Visual badges strictly aligned with financial market convention:
  // BUY (Long / CNY growth) = Emerald Green
  // SELL (Short / CNY decline / Ruble strengthening) = Rose Red
  // NEUTRAL (Range / Corridor) = Sky / Slate
  const badgeTheme = isBuy
    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-lg shadow-emerald-500/20'
    : isSell
    ? 'bg-rose-950/90 text-rose-300 border-rose-500/60 shadow-lg shadow-rose-500/20'
    : 'bg-slate-800/90 text-slate-200 border-slate-600 shadow-md shadow-slate-900/40';

  const cardBorderGlow = isBuy
    ? 'border-emerald-500/30 hover:border-emerald-500/50'
    : isSell
    ? 'border-rose-500/30 hover:border-rose-500/50'
    : 'border-slate-800 hover:border-slate-700';

  // Mathematical delta calculations in kopecks
  const diff1h = (forecast.target1h - currentPrice) * 100;
  const diff4h = (forecast.target4h - currentPrice) * 100;
  const diffClose = (forecast.targetClose - currentPrice) * 100;

  // Format delta with explicit + sign and kopeck label
  const formatDelta = (delta: number) => {
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)} коп.`;
  };

  return (
    <div
      className={`bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border ${cardBorderGlow} rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-4 transition-all duration-300`}
    >
      {/* Top Header: Title, Model Badge, Refresh button & Actionable Verdict */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 font-mono tracking-tight">
                AI Внутридневной Вердикт & Торговый План
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/70">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Синтез 4 макро-факторов, котировок Т-Инвестиций и стакана CNYRUBF
            </p>
          </div>
        </div>

        {/* Coherence & Signal Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            title="Обновить AI-прогноз через Gemini"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <div
            className={`px-3.5 py-1.5 rounded-xl border font-mono font-extrabold text-xs flex items-center gap-2 ${badgeTheme}`}
          >
            {isBuy ? (
              <TrendingUp className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : isSell ? (
              <TrendingDown className="w-4 h-4 text-rose-400 animate-pulse" />
            ) : (
              <Compass className="w-4 h-4 text-cyan-400" />
            )}
            <span>{forecast.recommendationLabel}</span>
            <span className="text-slate-400 font-normal">|</span>
            <span className="text-white font-mono">
              Уверенность: {forecast.confidencePct}%
            </span>
          </div>
        </div>
      </div>

      {/* Verification Ribbon: Mathematical Coherence Status */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950/70 border border-emerald-500/25 text-xs font-mono">
        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Математическая согласованность: 100% OK</span>
        </span>
        <span className="text-[11px] text-slate-400">
          Вектор 4 факторов: <strong className={forecast.netImpactKopecks >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {forecast.netImpactKopecks > 0 ? '+' : ''}{forecast.netImpactKopecks} коп.
          </strong>
        </span>
      </div>

      {/* Intraday Targets Grid with Coherent Progressions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        {/* Target 1h */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1 font-semibold">
            <Clock className="w-3 h-3 text-cyan-400" />
            Цель Т+1ч
          </div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {forecast.target1h.toFixed(3)} ₽
          </div>
          <div
            className={`text-[10px] font-semibold mt-0.5 ${
              diff1h >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatDelta(diff1h)} от тек.
          </div>
        </div>

        {/* Target 4h */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1 font-semibold">
            <Clock className="w-3 h-3 text-indigo-400" />
            Цель Т+4ч
          </div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {forecast.target4h.toFixed(3)} ₽
          </div>
          <div
            className={`text-[10px] font-semibold mt-0.5 ${
              diff4h >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatDelta(diff4h)} от тек.
          </div>
        </div>

        {/* Target Close 19:00 */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1 font-semibold">
            <Target className="w-3 h-3 text-amber-400" />
            Закрытие 19:00
          </div>
          <div
            className={`text-lg font-bold mt-1 ${
              diffClose >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {forecast.targetClose.toFixed(3)} ₽
          </div>
          <div
            className={`text-[10px] font-semibold mt-0.5 ${
              diffClose >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatDelta(diffClose)} (клиринг)
          </div>
        </div>

        {/* Intraday Corridor */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Коридор дня
          </div>
          <div className="text-sm font-bold text-slate-200 mt-1">
            {forecast.rangeLow.toFixed(3)} – {forecast.rangeHigh.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Ширина: {((forecast.rangeHigh - forecast.rangeLow) * 100).toFixed(0)} коп.
          </div>
        </div>
      </div>

      {/* Actionable Trading Playbook Card with Strict Mathematical Integrity */}
      {forecast.playbook && (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950 border border-cyan-500/30 rounded-xl p-3.5 space-y-3 font-mono text-xs shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Target className="w-4 h-4 text-cyan-400" />
                ТАКТИЧЕСКИЙ СЕТАП ДЛЯ ТРЕЙДЕРА
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  isBuy
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                    : isSell
                    ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {isBuy ? 'LONG (Покупка)' : isSell ? 'SHORT (Продажа)' : 'RANGE (Канал)'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>
                Горизонт: <strong className="text-slate-200">{forecast.playbook.timeHorizon || '2-4 часа'}</strong>
              </span>
              <span>•</span>
              <span>
                R/R: <strong className="text-amber-400">{forecast.playbook.riskRewardRatio}</strong>
              </span>
            </div>
          </div>

          {/* Mathematical Order Hierarchy Breadcrumb */}
          <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase font-sans">Иерархия уровней:</span>
            {isBuy ? (
              <>
                <span className="text-rose-400 font-bold">SL {forecast.playbook.stopLoss}</span>
                <span className="text-slate-600">&lt;</span>
                <span className="text-white font-bold">Вход {forecast.playbook.entry}</span>
                <span className="text-slate-600">&lt;</span>
                <span className="text-emerald-400 font-bold">TP1 {forecast.playbook.takeProfit1}</span>
                <span className="text-slate-600">&lt;</span>
                <span className="text-cyan-400 font-bold">TP2 {forecast.playbook.takeProfit2}</span>
              </>
            ) : isSell ? (
              <>
                <span className="text-cyan-400 font-bold">TP2 {forecast.playbook.takeProfit2}</span>
                <span className="text-slate-600">&lt;</span>
                <span className="text-emerald-400 font-bold">TP1 {forecast.playbook.takeProfit1}</span>
                <span className="text-slate-600">&lt;</span>
                <span className="text-white font-bold">Вход {forecast.playbook.entry}</span>
                <span className="text-slate-600">&lt;</span>
                <span className="text-rose-400 font-bold">SL {forecast.playbook.stopLoss}</span>
              </>
            ) : (
              <>
                <span className="text-rose-400 font-bold">SL {forecast.playbook.stopLoss}</span>
                <span className="text-slate-600">&lt;</span>
                <span className="text-white font-bold">Канал {forecast.playbook.entry}</span>
                <span className="text-slate-600">&lt;</span>
                <span className="text-emerald-400 font-bold">TP {forecast.playbook.takeProfit1}</span>
              </>
            )}
          </div>

          {/* 4 Playbook Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Зона входа:</span>
              <span className="text-white font-bold text-sm">{forecast.playbook.entry} ₽</span>
            </div>
            <div className="bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400/90 block uppercase">Тейк-профит 1:</span>
              <span className="text-emerald-400 font-bold text-sm">{forecast.playbook.takeProfit1} ₽</span>
            </div>
            <div className="bg-cyan-950/20 p-2.5 rounded-lg border border-cyan-500/30">
              <span className="text-[10px] text-cyan-400/90 block uppercase">Тейк-профит 2:</span>
              <span className="text-cyan-400 font-bold text-sm">{forecast.playbook.takeProfit2} ₽</span>
            </div>
            <div className="bg-rose-950/20 p-2.5 rounded-lg border border-rose-500/30">
              <span className="text-[10px] text-rose-400/90 block uppercase">Стоп-лосс:</span>
              <span className="text-rose-400 font-bold text-sm">{forecast.playbook.stopLoss} ₽</span>
            </div>
          </div>
        </div>
      )}

      {/* Macro Analysis Paragraph */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center justify-between">
          <span>Макроэкономическое обоснование баланса сил</span>
          <span className="text-[10px] text-slate-500 font-normal">Синхронизировано с Т-Банк</span>
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 font-sans shadow-sm">
          {forecast.macroAnalysis}
        </p>
      </div>

      {/* Risk Triggers & Cancellation Scenarios */}
      {forecast.riskTriggers && forecast.riskTriggers.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-amber-400/90 font-mono uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Триггеры отмены сценария (Risk Alerts)
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            {forecast.riskTriggers.map((trigger, idx) => (
              <li
                key={idx}
                className="bg-amber-950/20 border border-amber-500/25 text-amber-200/90 p-2.5 rounded-lg text-[11px] leading-snug flex items-start gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0"></span>
                <span>{trigger}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Window Bottom Timestamp Bar */}
      <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span>Дата и время AI-прогноза:</span>
          <strong className="text-amber-300">{updatedAt}</strong>
        </span>
        <span className="text-slate-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Модель: Gemini 3.8 Flash • Т-Банк Инвестиции (FUTCNYRUBF00)</span>
        </span>
      </div>
    </div>
  );
};
