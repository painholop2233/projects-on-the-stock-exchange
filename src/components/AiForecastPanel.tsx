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

  const badgeTheme = isBuy
    ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-rose-500/20'
    : isSell
    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20'
    : 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 font-mono">
                AI Внутридневной Вердикт & Торговый План
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Синтез 4 макро-факторов и биржевого стакана CNYRUBF
            </p>
          </div>
        </div>

        {/* Signal Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3.5 py-1.5 rounded-xl border font-mono font-extrabold text-xs flex items-center gap-2 shadow-lg ${badgeTheme}`}
          >
            {isBuy ? (
              <TrendingUp className="w-4 h-4 text-rose-400" />
            ) : isSell ? (
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            ) : (
              <Compass className="w-4 h-4 text-slate-400" />
            )}
            <span>{forecast.recommendationLabel}</span>
            <span className="text-slate-400 font-normal">|</span>
            <span className="text-white font-mono">
              Уверенность: {forecast.confidencePct}%
            </span>
          </div>
        </div>
      </div>

      {/* Intraday Targets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            Цель Т+1ч
          </div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {forecast.target1h.toFixed(3)} ₽
          </div>
          <div className="text-[10px] text-slate-500">
            {((forecast.target1h - currentPrice) * 100).toFixed(1)} коп. от тек.
          </div>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-400" />
            Цель Т+4ч
          </div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {forecast.target4h.toFixed(3)} ₽
          </div>
          <div className="text-[10px] text-slate-500">
            {((forecast.target4h - currentPrice) * 100).toFixed(1)} коп. от тек.
          </div>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
            <Target className="w-3 h-3 text-amber-400" />
            Закрытие 19:00
          </div>
          <div
            className={`text-lg font-bold mt-1 ${
              isBuy ? 'text-rose-400' : isSell ? 'text-emerald-400' : 'text-slate-200'
            }`}
          >
            {forecast.targetClose.toFixed(3)} ₽
          </div>
          <div className="text-[10px] text-slate-500">Ориентир клиринга</div>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Коридор дня
          </div>
          <div className="text-sm font-bold text-slate-200 mt-1">
            {forecast.rangeLow.toFixed(3)} – {forecast.rangeHigh.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500">Поддержка / Сопротивление</div>
        </div>
      </div>

      {/* Actionable Trading Playbook Card */}
      {forecast.playbook && (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/20 rounded-xl p-3.5 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800/80 pb-2">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Target className="w-4 h-4 text-cyan-400" />
              ТАКТИЧЕСКИЙ СЕТАП ДЛЯ ТРЕЙДЕРА (INTRADAY SETUP)
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              R/R: <strong className="text-amber-400">{forecast.playbook.riskRewardRatio}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div>
              <span className="text-[10px] text-slate-400 block">Зона входа:</span>
              <span className="text-white font-bold">{forecast.playbook.entry} ₽</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Тейк-профит 1:</span>
              <span className="text-emerald-400 font-bold">{forecast.playbook.takeProfit1} ₽</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Тейк-профит 2:</span>
              <span className="text-cyan-400 font-bold">{forecast.playbook.takeProfit2} ₽</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Стоп-лосс:</span>
              <span className="text-rose-400 font-bold">{forecast.playbook.stopLoss} ₽</span>
            </div>
          </div>
        </div>
      )}

      {/* Macro Analysis Paragraph */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
          Макроэкономическое обоснование баланса сил
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 font-sans">
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
                className="bg-amber-950/20 border border-amber-500/20 text-amber-200/90 p-2.5 rounded-lg text-[11px] leading-snug flex items-start gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0"></span>
                <span>{trigger}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Window Bottom Timestamp Bar */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span>Дата и время AI-прогноза:</span>
          <strong className="text-amber-300">{updatedAt}</strong>
        </span>
        <span className="text-slate-500">Модель: Gemini 3.8 Flash • Т-Банк</span>
      </div>
    </div>
  );
};
