import React, { useState } from 'react';
import {
  Flame,
  ShieldAlert,
  Landmark,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from 'lucide-react';
import { FactorDetail } from '../types/market';

interface FactorCardsProps {
  factors: FactorDetail[];
  onOpenWhatIfForFactor?: (factorId: string) => void;
  updatedAt: string;
}

export const FactorCards: React.FC<FactorCardsProps> = ({
  factors,
  onOpenWhatIfForFactor,
  updatedAt,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getIcon = (id: string) => {
    switch (id) {
      case 'oil':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'geopolitics':
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'fiscal_rule':
        return <Landmark className="w-5 h-5 text-cyan-400" />;
      case 'import_demand':
        return <ShoppingCart className="w-5 h-5 text-emerald-400" />;
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getBorderColor = (id: string) => {
    switch (id) {
      case 'oil':
        return 'border-amber-500/30 hover:border-amber-500/60 bg-gradient-to-b from-amber-950/20 to-slate-900/60';
      case 'geopolitics':
        return 'border-rose-500/30 hover:border-rose-500/60 bg-gradient-to-b from-rose-950/20 to-slate-900/60';
      case 'fiscal_rule':
        return 'border-cyan-500/30 hover:border-cyan-500/60 bg-gradient-to-b from-cyan-950/20 to-slate-900/60';
      case 'import_demand':
        return 'border-emerald-500/30 hover:border-emerald-500/60 bg-gradient-to-b from-emerald-950/20 to-slate-900/60';
      default:
        return 'border-slate-800 bg-slate-900/60';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
          <span>4 Ключевых Фактора Внутридневного Прогноза</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
            Весовая модель
          </span>
        </h2>
        <span className="text-xs text-slate-400">
          Суммарное воздействие на курс в копейках
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {factors.map((factor) => {
          const isExpanded = expandedId === factor.id;
          const isBullishRub = factor.sentiment === 'bullish_rub';
          const impactSign = factor.impactKopecks > 0 ? '+' : '';

          return (
            <div
              key={factor.id}
              className={`rounded-xl border p-3.5 transition-all duration-200 shadow-md ${getBorderColor(
                factor.id
              )}`}
            >
              {/* Header: Icon, Name & Impact Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
                    {getIcon(factor.id)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 font-mono leading-tight">
                      {factor.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {factor.currentValueDisplay}
                    </p>
                  </div>
                </div>

                {/* Impact Badge */}
                <div
                  className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-bold shrink-0 flex items-center gap-1 ${
                    isBullishRub
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                      : 'bg-rose-950/60 text-rose-400 border-rose-500/40'
                  }`}
                  title={
                    isBullishRub
                      ? 'Давит на CNY вниз (укрепляет рубль)'
                      : 'Толкает CNY вверх (ослабляет рубль)'
                  }
                >
                  {isBullishRub ? (
                    <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>
                    {impactSign}
                    {factor.impactKopecks} коп.
                  </span>
                </div>
              </div>

              {/* Sub-metric & weight bar */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="truncate pr-2 text-slate-400">{factor.subMetric}</span>
                <span className="shrink-0 text-slate-400">
                  Вес: <strong className="text-slate-200">{factor.weightPct}%</strong>
                </span>
              </div>

              {/* Expand Toggle */}
              <button
                onClick={() => toggleExpand(factor.id)}
                className="mt-2.5 w-full flex items-center justify-center gap-1 text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition-colors pt-1 border-t border-slate-800/40"
              >
                <span>{isExpanded ? 'Скрыть детали механизма' : 'Механизм влияния на курс'}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 text-xs text-slate-300 space-y-2 bg-slate-950/60 p-2.5 rounded-lg font-sans">
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    <strong className="text-cyan-300 font-mono">Суть:</strong> {factor.description}
                  </p>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    <strong className="text-amber-300 font-mono">Трансмиссия:</strong>{' '}
                    {factor.transmissionChannel}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Корреляция: {factor.historicalCorrelation}</span>
                    <span
                      className={isBullishRub ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}
                    >
                      {isBullishRub ? 'В пользу Рубля (CNY ↓)' : 'В пользу Юаня (CNY ↑)'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Window Bottom Timestamp Bar */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          <span>Дата и время обновления факторов:</span>
          <strong className="text-amber-300">{updatedAt}</strong>
        </span>
        <span className="text-slate-500">Мультифакторная квантовая модель</span>
      </div>
    </div>
  );
};
