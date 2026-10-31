import React from 'react';
import { Layers, ArrowDown, ArrowUp, Clock, AlertCircle } from 'lucide-react';
import { OrderBookRow } from '../types/market';

interface OrderBookDOMProps {
  bids: OrderBookRow[];
  asks: OrderBookRow[];
  ratio: number;
  currentPrice: number;
  fundingRate: number;
  nextFundingTime: string;
  updatedAt: string;
}

export const OrderBookDOM: React.FC<OrderBookDOMProps> = ({
  bids,
  asks,
  ratio,
  currentPrice,
  fundingRate,
  nextFundingTime,
  updatedAt,
}) => {
  const maxTotal = Math.max(
    bids[bids.length - 1]?.total || 1,
    asks[0]?.total || 1
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-3 flex flex-col h-full font-mono text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-mono">
              Биржевой Стакан (DOM)
            </h3>
            <p className="text-[10px] text-slate-400">Лимитные заявки CNYRUBF</p>
          </div>
        </div>

        {/* Funding Rate Pill */}
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Фандинг (19:00 МСК)</span>
          <span className="text-cyan-400 font-bold">+{fundingRate}%</span>
        </div>
      </div>

      {/* Pressure Bar (Bids vs Asks Ratio) */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-emerald-400 font-bold flex items-center gap-0.5">
            <ArrowUp className="w-3 h-3" />
            Покупатели {ratio}%
          </span>
          <span className="text-rose-400 font-bold flex items-center gap-0.5">
            Продавцы {(100 - ratio).toFixed(1)}%
            <ArrowDown className="w-3 h-3" />
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${ratio}%` }}
          ></div>
          <div
            className="h-full bg-rose-500 transition-all duration-300"
            style={{ width: `${100 - ratio}%` }}
          ></div>
        </div>
      </div>

      {/* Table Headers */}
      <div className="grid grid-cols-3 text-[10px] text-slate-500 border-b border-slate-800/80 pb-1">
        <span>Цена (₽)</span>
        <span className="text-right">Объем (лот)</span>
        <span className="text-right">Всего</span>
      </div>

      {/* Asks (Sell orders, red) */}
      <div className="space-y-0.5 flex-1 overflow-hidden">
        {asks.slice(-5).map((ask, idx) => {
          const depthPct = Math.min(100, (ask.total / maxTotal) * 100);
          const isLarge = ask.volume > 2500;
          return (
            <div
              key={`ask-${idx}`}
              className="grid grid-cols-3 py-0.5 px-1 relative rounded hover:bg-slate-800/40 text-[11px]"
            >
              <div
                className="absolute right-0 top-0 bottom-0 bg-rose-500/15 rounded-r pointer-events-none"
                style={{ width: `${depthPct}%` }}
              ></div>
              <span className="text-rose-400 font-bold z-10 flex items-center gap-1">
                {ask.price.toFixed(3)}
                {isLarge && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-normal">
                    Плотность
                  </span>
                )}
              </span>
              <span className="text-right text-slate-300 z-10">
                {ask.volume.toLocaleString('ru-RU')}
              </span>
              <span className="text-right text-slate-500 z-10">
                {ask.total.toLocaleString('ru-RU')}
              </span>
            </div>
          );
        })}

        {/* Current Mid Price Banner */}
        <div className="my-1.5 py-1 px-2 rounded-lg bg-cyan-950/70 border border-cyan-800/70 flex items-center justify-between text-xs font-bold text-white shadow-sm">
          <span className="text-cyan-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            ТЕКУЩАЯ СДЕЛКА
          </span>
          <span className="text-sm font-extrabold font-mono text-cyan-200">
            {currentPrice.toFixed(3)} ₽
          </span>
        </div>

        {/* Bids (Buy orders, green) */}
        {bids.slice(0, 5).map((bid, idx) => {
          const depthPct = Math.min(100, (bid.total / maxTotal) * 100);
          const isLarge = bid.volume > 2500;
          return (
            <div
              key={`bid-${idx}`}
              className="grid grid-cols-3 py-0.5 px-1 relative rounded hover:bg-slate-800/40 text-[11px]"
            >
              <div
                className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 rounded-r pointer-events-none"
                style={{ width: `${depthPct}%` }}
              ></div>
              <span className="text-emerald-400 font-bold z-10 flex items-center gap-1">
                {bid.price.toFixed(3)}
                {isLarge && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-normal">
                    Плотность
                  </span>
                )}
              </span>
              <span className="text-right text-slate-300 z-10">
                {bid.volume.toLocaleString('ru-RU')}
              </span>
              <span className="text-right text-slate-500 z-10">
                {bid.total.toLocaleString('ru-RU')}
              </span>
            </div>
          );
        })}
      </div>

      {/* DOM Micro Note & Bottom Timestamp Bar */}
      <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span>Шаг цены: 0.001 ₽</span>
          <span>Лотность: 1000 ¥</span>
        </div>
        <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Обновлено: <strong className="text-amber-300">{updatedAt}</strong>
          </span>
          <span className="text-slate-500">T-Bank L2</span>
        </div>
      </div>
    </div>
  );
};
