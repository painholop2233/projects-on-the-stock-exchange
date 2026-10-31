import React from 'react';
import { FactorDetail } from '../types/market';
import { Scale, ArrowLeftRight } from 'lucide-react';

interface FactorImpactRadarProps {
  factors: FactorDetail[];
  netImpactKopecks: number;
  updatedAt: string;
}

export const FactorImpactRadar: React.FC<FactorImpactRadarProps> = ({
  factors,
  netImpactKopecks,
  updatedAt,
}) => {
  const maxAbsKopeck = Math.max(
    8,
    ...factors.map((f) => Math.abs(f.impactKopecks)),
    Math.abs(netImpactKopecks)
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-800/60">
            <Scale className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-mono">
              Баланс Сил & Декомпозиция Факторов
            </h3>
            <p className="text-[11px] text-slate-400">
              Вклад каждого макро-драйвера в отклонение цены CNYRUBF
            </p>
          </div>
        </div>

        <div className="text-xs font-mono">
          Итоговое давление:{' '}
          <span
            className={`font-bold ${
              netImpactKopecks >= 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {netImpactKopecks > 0 ? '+' : ''}
            {netImpactKopecks} коп.
          </span>
        </div>
      </div>

      {/* Divergent Bars (- to + kopecks) */}
      <div className="space-y-3 pt-1 font-mono text-xs">
        {/* Scale Header */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-800/60 pb-1">
          <span className="text-emerald-400 font-semibold">◀ Укрепление Рубля (CNY ↓)</span>
          <span>0.0</span>
          <span className="text-rose-400 font-semibold">Ослабление Рубля (CNY ↑) ▶</span>
        </div>

        {factors.map((factor) => {
          const isNegative = factor.impactKopecks < 0;
          const absVal = Math.abs(factor.impactKopecks);
          const barWidthPct = Math.min(100, (absVal / maxAbsKopeck) * 50);

          return (
            <div key={factor.id} className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300 font-medium">{factor.shortTitle}</span>
                <span
                  className={`font-bold ${
                    isNegative ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {factor.impactKopecks > 0 ? '+' : ''}
                  {factor.impactKopecks} коп.
                </span>
              </div>

              {/* Centered zero dual bar */}
              <div className="h-2.5 bg-slate-950 rounded-full flex items-center relative overflow-hidden border border-slate-800">
                {/* Center zero line marker */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-600 z-10"></div>

                {/* Left side (negative / ruble bullish) */}
                <div className="w-1/2 h-full flex justify-end">
                  {isNegative && (
                    <div
                      className="h-full bg-emerald-500 rounded-l-sm transition-all duration-300"
                      style={{ width: `${barWidthPct * 2}%` }}
                    ></div>
                  )}
                </div>

                {/* Right side (positive / ruble bearish / cny bullish) */}
                <div className="w-1/2 h-full flex justify-start">
                  {!isNegative && (
                    <div
                      className="h-full bg-rose-500 rounded-r-sm transition-all duration-300"
                      style={{ width: `${barWidthPct * 2}%` }}
                    ></div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Total Net Vector Row */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-white font-bold uppercase tracking-wider">
              Результирующий вектор
            </span>
            <span
              className={`font-extrabold text-sm ${
                netImpactKopecks >= 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {netImpactKopecks > 0 ? '+' : ''}
              {netImpactKopecks} коп.
            </span>
          </div>

          <div className="h-3.5 bg-slate-950 rounded-full flex items-center relative overflow-hidden border border-cyan-800/60 shadow-inner">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-cyan-400 z-10"></div>
            {/* Net Bar */}
            <div className="w-1/2 h-full flex justify-end">
              {netImpactKopecks < 0 && (
                <div
                  className="h-full bg-gradient-to-l from-emerald-400 to-emerald-600 rounded-l-sm transition-all duration-300 shadow-md"
                  style={{
                    width: `${Math.min(100, (Math.abs(netImpactKopecks) / maxAbsKopeck) * 100)}%`,
                  }}
                ></div>
              )}
            </div>
            <div className="w-1/2 h-full flex justify-start">
              {netImpactKopecks >= 0 && (
                <div
                  className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-r-sm transition-all duration-300 shadow-md"
                  style={{
                    width: `${Math.min(100, (Math.abs(netImpactKopecks) / maxAbsKopeck) * 100)}%`,
                  }}
                ></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Window Bottom Timestamp Bar */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          <span>Дата и время расчета баланса сил:</span>
          <strong className="text-amber-300">{updatedAt}</strong>
        </span>
        <span className="text-slate-500">Векторная декомпозиция факторов</span>
      </div>
    </div>
  );
};
