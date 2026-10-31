import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Maximize2,
  Eye,
  Target,
  Sparkles,
  Info,
  RefreshCw,
  Clock,
  Zap,
} from 'lucide-react';
import { CandleData } from '../types/market';
import { getTimeframeTargetLevels, TimeframeTargetInfo } from '../services/marketModel';

interface IntradayChartProps {
  candles: CandleData[];
  currentPrice: number;
  netImpactKopecks: number;
  recommendation: 'BUY' | 'SELL' | 'NEUTRAL';
  updatedAt: string;
  timeframe: '5M' | '15M' | '1H';
  onTimeframeChange: (tf: '5M' | '15M' | '1H') => void;
  isLoadingCandles?: boolean;
}

export const IntradayChart: React.FC<IntradayChartProps> = ({
  candles,
  currentPrice,
  netImpactKopecks,
  recommendation,
  updatedAt,
  timeframe,
  onTimeframeChange,
  isLoadingCandles = false,
}) => {
  const [showVwap, setShowVwap] = useState(true);
  const [showForecastCone, setShowForecastCone] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Compute adaptive timeframe target levels and labels
  const targets: TimeframeTargetInfo = useMemo(() => {
    return getTimeframeTargetLevels(currentPrice, netImpactKopecks, timeframe);
  }, [currentPrice, netImpactKopecks, timeframe]);

  // Compute bounds for chart scaling
  const { minPrice, maxPrice, maxVolume, historicalCutoffIndex } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;
    let cutoff = 0;

    candles.forEach((c, idx) => {
      if (!c.isForecast) cutoff = idx;
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.predictedLow && c.predictedLow < min) min = c.predictedLow;
      if (c.predictedHigh && c.predictedHigh > max) max = c.predictedHigh;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    const padding = (max - min) * 0.12 || 0.04;
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      maxVolume: maxVol * 1.25 || 1,
      historicalCutoffIndex: cutoff,
    };
  }, [candles]);

  // SVG dimensions
  const width = 880;
  const height = 420;
  const paddingLeft = 55;
  const paddingRight = 75;
  const paddingTop = 25;
  const paddingBottom = showVolume ? 80 : 35;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const priceToY = (price: number) => {
    const ratio = (price - minPrice) / (maxPrice - minPrice || 1);
    return height - paddingBottom - ratio * plotHeight;
  };

  const volumeToH = (vol: number) => {
    return (vol / maxVolume) * 60;
  };

  const indexToX = (index: number) => {
    const step = plotWidth / (candles.length - 1 || 1);
    return paddingLeft + index * step;
  };

  // Generate path for VWAP
  const vwapPath = useMemo(() => {
    let path = '';
    candles.forEach((c, i) => {
      if (!c.vwap) return;
      const x = indexToX(i);
      const y = priceToY(c.vwap);
      if (i === 0) path += `M ${x} ${y}`;
      else path += ` L ${x} ${y}`;
    });
    return path;
  }, [candles, minPrice, maxPrice]);

  // Generate path for Central Forecast Trajectory
  const forecastTrajectoryPath = useMemo(() => {
    let path = '';
    candles.forEach((c, i) => {
      if (i < historicalCutoffIndex) return;
      const x = indexToX(i);
      const y = priceToY(c.isForecast ? (c.predictedBase || c.close) : c.close);
      if (i === historicalCutoffIndex) path += `M ${x} ${y}`;
      else path += ` L ${x} ${y}`;
    });
    return path;
  }, [candles, historicalCutoffIndex, minPrice, maxPrice]);

  // Generate shaded polygon for Forecast Cone
  const forecastConePolygon = useMemo(() => {
    if (!showForecastCone) return '';
    const upperPoints: { x: number; y: number }[] = [];
    const lowerPoints: { x: number; y: number }[] = [];

    candles.forEach((c, i) => {
      if (i < historicalCutoffIndex) return;
      const x = indexToX(i);
      const highY = priceToY(c.isForecast ? (c.predictedHigh || c.high) : c.close);
      const lowY = priceToY(c.isForecast ? (c.predictedLow || c.low) : c.close);
      upperPoints.push({ x, y: highY });
      lowerPoints.push({ x, y: lowY });
    });

    if (upperPoints.length < 2) return '';

    let d = `M ${upperPoints[0].x} ${upperPoints[0].y}`;
    for (let i = 1; i < upperPoints.length; i++) {
      d += ` L ${upperPoints[i].x} ${upperPoints[i].y}`;
    }
    for (let i = lowerPoints.length - 1; i >= 0; i--) {
      d += ` L ${lowerPoints[i].x} ${lowerPoints[i].y}`;
    }
    d += ' Z';
    return d;
  }, [candles, historicalCutoffIndex, showForecastCone, minPrice, maxPrice]);

  // Active hovered candle
  const hoveredCandle = hoverIndex !== null ? candles[hoverIndex] : candles[historicalCutoffIndex];

  // Adaptive target markers indices on forecast line
  const t1Index = Math.min(
    candles.length - 1,
    historicalCutoffIndex + (timeframe === '5M' ? 3 : timeframe === '1H' ? 2 : 4)
  );
  const t2Index = Math.min(
    candles.length - 1,
    historicalCutoffIndex + (timeframe === '5M' ? 6 : timeframe === '1H' ? 4 : 8)
  );
  const closeIndex = candles.length - 1;

  const lastRealTime = candles[historicalCutoffIndex]?.time || 'СЕЙЧАС';

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 p-4 shadow-xl flex flex-col relative overflow-hidden backdrop-blur-sm">
      {/* Chart Top Bar with Timeframe Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800/70">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-200">
              График CNYRUBF
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>{targets.modeLabel}</span>
            </span>
          </div>

          {/* Timeframe switch buttons */}
          <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs font-mono">
            {(['5M', '15M', '1H'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-3 py-1 rounded-md transition-all font-bold flex items-center gap-1 ${
                  timeframe === tf
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
                title={`Переключить на таймфрейм ${tf}`}
              >
                {isLoadingCandles && timeframe === tf && (
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-white" />
                )}
                <span>{tf}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Indicator Toggles & Legend */}
        <div className="flex items-center gap-2.5 text-xs flex-wrap font-mono">
          <button
            onClick={() => setShowForecastCone(!showForecastCone)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
              showForecastCone
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Конус прогноза
          </button>

          <button
            onClick={() => setShowVwap(!showVwap)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
              showVwap
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span className="w-2 h-0.5 bg-amber-400 rounded"></span>
            VWAP
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all ${
              showVolume
                ? 'bg-blue-950/60 border-blue-500/40 text-blue-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Eye className="w-3 h-3" />
            Объемы
          </button>
        </div>
      </div>

      {/* Candle details ticker strip on hover */}
      {hoveredCandle && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-400 mb-2 px-1">
          <span className="text-slate-200 font-bold">
            {hoveredCandle.isForecast ? `[Прогноз] ${hoveredCandle.time}` : hoveredCandle.time}
          </span>
          <span>
            O: <strong className="text-slate-100">{hoveredCandle.open.toFixed(3)}</strong>
          </span>
          <span>
            H: <strong className="text-slate-100">{hoveredCandle.high.toFixed(3)}</strong>
          </span>
          <span>
            L: <strong className="text-slate-100">{hoveredCandle.low.toFixed(3)}</strong>
          </span>
          <span>
            C:{' '}
            <strong
              className={
                hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400' : 'text-rose-400'
              }
            >
              {hoveredCandle.close.toFixed(3)}
            </strong>
          </span>
          {hoveredCandle.isForecast && (
            <span className="text-cyan-300 font-semibold">
              Диапазон: {hoveredCandle.predictedLow?.toFixed(3)} – {hoveredCandle.predictedHigh?.toFixed(3)}
            </span>
          )}
          <span>
            Vol: <strong className="text-slate-300">{hoveredCandle.volume.toLocaleString('ru-RU')}</strong>
          </span>
        </div>
      )}

      {/* Interactive SVG Chart Container */}
      <div className="relative w-full overflow-hidden flex-1 select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="forecastConeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.10" />
            </linearGradient>

            <linearGradient id="bullVolGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id="bearVolGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal price lines) */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const price = minPrice + pct * (maxPrice - minPrice);
            const y = priceToY(price);
            return (
              <g key={pct}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={width - paddingRight + 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {price.toFixed(3)}
                </text>
              </g>
            );
          })}

          {/* Shaded Forecast Area Background */}
          {historicalCutoffIndex < candles.length - 1 && (
            <rect
              x={indexToX(historicalCutoffIndex)}
              y={paddingTop}
              width={width - paddingRight - indexToX(historicalCutoffIndex)}
              height={plotHeight}
              fill="rgba(6, 182, 212, 0.03)"
            />
          )}

          {/* Forecast Cone Polygon */}
          {showForecastCone && forecastConePolygon && (
            <path
              d={forecastConePolygon}
              fill="url(#forecastConeGrad)"
              stroke="rgba(6, 182, 212, 0.4)"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
          )}

          {/* Dividing Vertical Line: Real Time cutoff */}
          {historicalCutoffIndex < candles.length && (
            <g>
              <line
                x1={indexToX(historicalCutoffIndex)}
                y1={paddingTop}
                x2={indexToX(historicalCutoffIndex)}
                y2={height - paddingBottom}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <rect
                x={indexToX(historicalCutoffIndex) - 48}
                y={paddingTop - 18}
                width="96"
                height="18"
                rx="4"
                fill="#0e7490"
              />
              <text
                x={indexToX(historicalCutoffIndex)}
                y={paddingTop - 5}
                fill="#ecfeff"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                ● {lastRealTime} ФАКТ
              </text>
            </g>
          )}

          {/* VWAP Line */}
          {showVwap && vwapPath && (
            <path
              d={vwapPath}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.85"
            />
          )}

          {/* Forecast Central Trajectory Line */}
          {forecastTrajectoryPath && (
            <path
              d={forecastTrajectoryPath}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeDasharray="5 3"
            />
          )}

          {/* Volume bars */}
          {showVolume &&
            candles.map((c, i) => {
              const x = indexToX(i);
              const barW = Math.max(2.5, (plotWidth / candles.length) * 0.65);
              const h = volumeToH(c.volume);
              const y = height - paddingBottom - h;
              const isBull = c.close >= c.open;
              return (
                <rect
                  key={`vol-${i}`}
                  x={x - barW / 2}
                  y={y}
                  width={barW}
                  height={h}
                  fill={c.isForecast ? 'rgba(56, 189, 248, 0.25)' : isBull ? 'url(#bullVolGrad)' : 'url(#bearVolGrad)'}
                  rx="1"
                />
              );
            })}

          {/* Candlesticks (Historical & Forecast) */}
          {candles.map((c, i) => {
            const x = indexToX(i);
            const openY = priceToY(c.open);
            const closeY = priceToY(c.close);
            const highY = priceToY(c.high);
            const lowY = priceToY(c.low);
            const isBull = c.close >= c.open;
            const barW = Math.max(3, (plotWidth / candles.length) * 0.72);
            const bodyY = Math.min(openY, closeY);
            const bodyH = Math.max(2, Math.abs(openY - closeY));

            const candleColor = c.isForecast
              ? isBull
                ? '#38bdf8'
                : '#818cf8'
              : isBull
              ? '#10b981'
              : '#f43f5e';

            return (
              <g
                key={`candle-${i}`}
                className="transition-opacity hover:opacity-100"
                onMouseEnter={() => setHoverIndex(i)}
              >
                {/* Candle Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={candleColor}
                  strokeWidth="1.2"
                  opacity={c.isForecast ? 0.6 : 1}
                />
                {/* Candle Body */}
                <rect
                  x={x - barW / 2}
                  y={bodyY}
                  width={barW}
                  height={bodyH}
                  fill={c.isForecast ? 'transparent' : candleColor}
                  stroke={candleColor}
                  strokeWidth={c.isForecast ? 1.5 : 1}
                  rx="1"
                />
              </g>
            );
          })}

          {/* Target Callout Marker 1 (e.g. T+15m for 5M, T+1h for 15M, T+2h for 1H) */}
          {t1Index < candles.length && (
            <g>
              <circle
                cx={indexToX(t1Index)}
                y={priceToY(targets.price1)}
                r="4.5"
                fill="#38bdf8"
                stroke="#082f49"
                strokeWidth="2"
              />
              <rect
                x={indexToX(t1Index) - 34}
                y={priceToY(targets.price1) - 24}
                width="68"
                height="18"
                rx="4"
                fill="#0369a1"
              />
              <text
                x={indexToX(t1Index)}
                y={priceToY(targets.price1) - 11}
                fill="#f0f9ff"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {targets.timeLabel1} {targets.price1.toFixed(3)}
              </text>
            </g>
          )}

          {/* Target Callout Marker 2: Terminal Target for Timeframe */}
          {closeIndex < candles.length && (
            <g>
              <circle
                cx={indexToX(closeIndex)}
                y={priceToY(targets.price3)}
                r="5.5"
                fill={netImpactKopecks >= 0 ? '#f43f5e' : '#10b981'}
                stroke="#0f172a"
                strokeWidth="2"
              />
              <rect
                x={indexToX(closeIndex) - 48}
                y={priceToY(targets.price3) - 26}
                width="96"
                height="20"
                rx="5"
                fill={netImpactKopecks >= 0 ? '#9f1239' : '#065f46'}
                stroke={netImpactKopecks >= 0 ? '#f43f5e' : '#10b981'}
                strokeWidth="1"
              />
              <text
                x={indexToX(closeIndex)}
                y={priceToY(targets.price3) - 12}
                fill="#ffffff"
                fontSize="9.5"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {targets.timeLabel3}: {targets.price3.toFixed(3)}
              </text>
            </g>
          )}

          {/* Hover Crosshair and Time Indicator */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={indexToX(hoverIndex)}
                y1={paddingTop}
                x2={indexToX(hoverIndex)}
                y2={height - paddingBottom}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <rect
                x={indexToX(hoverIndex) - 24}
                y={height - paddingBottom + 4}
                width="48"
                height="16"
                rx="3"
                fill="#1e293b"
              />
              <text
                x={indexToX(hoverIndex)}
                y={height - paddingBottom + 16}
                fill="#e2e8f0"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {candles[hoverIndex].time}
              </text>
            </g>
          )}
        </svg>

        {/* Current Live Price Tag on Right Axis */}
        <div
          className="absolute right-0 flex items-center pr-1 pointer-events-none transition-all duration-300"
          style={{
            top: `${(priceToY(currentPrice) / height) * 100}%`,
            transform: 'translateY(-50%)',
          }}
        >
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500 text-slate-950 shadow-md">
            {currentPrice.toFixed(3)} ₽
          </span>
        </div>
      </div>

      {/* Chart Footer with Forecast Targets dynamically adapted to active timeframe */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block text-[10px] uppercase">{targets.label1}</span>
          <span className="text-base font-bold text-sky-400">{targets.price1.toFixed(3)} ₽</span>
        </div>
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block text-[10px] uppercase">{targets.label2}</span>
          <span className="text-base font-bold text-indigo-400">{targets.price2.toFixed(3)} ₽</span>
        </div>
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block text-[10px] uppercase">{targets.label3}</span>
          <span
            className={`text-base font-bold ${
              netImpactKopecks >= 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {targets.price3.toFixed(3)} ₽
          </span>
        </div>
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          <span className="text-slate-400 block text-[10px] uppercase">Вектор 4 факторов</span>
          <span
            className={`text-base font-bold ${
              netImpactKopecks >= 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {netImpactKopecks > 0 ? '+' : ''}
            {netImpactKopecks} коп. ({recommendation === 'BUY' ? 'CNY ↑' : recommendation === 'SELL' ? 'CNY ↓' : 'RANGE'})
          </span>
        </div>
      </div>

      {/* Window Bottom Timestamp Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span>Дата и время обновления котировок ({timeframe}):</span>
          <strong className="text-amber-300">{updatedAt}</strong>
        </span>
        <span className="text-slate-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Т-Банк Инвестиции API (FUTCNYRUBF00) • {targets.modeDescription}
        </span>
      </div>
    </div>
  );
};
