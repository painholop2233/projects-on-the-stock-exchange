import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sparkles,
  Clock,
  Activity,
  SlidersHorizontal,
  FileDown,
  Radio,
  CheckCircle2,
  Cloud,
} from 'lucide-react';
import { MarketTickerState } from '../types/market';

interface HeaderProps {
  ticker: MarketTickerState;
  isAiLoading: boolean;
  onRefreshAi: () => void;
  onRefreshLive: () => void;
  isPolling: boolean;
  onResetParams: () => void;
  onOpenWhatIf: () => void;
  onOpenExport: () => void;
  onOpenGoogleDrive?: () => void;
  isDriveConnected?: boolean;
  isLiveTick: boolean;
  onToggleLiveTick: () => void;
  updatedAt: string;
}

export const Header: React.FC<HeaderProps> = ({
  ticker,
  isAiLoading,
  onRefreshAi,
  onRefreshLive,
  isPolling,
  onResetParams,
  onOpenWhatIf,
  onOpenExport,
  onOpenGoogleDrive,
  isDriveConnected = false,
  isLiveTick,
  onToggleLiveTick,
  updatedAt,
}) => {
  const isPositive = ticker.change >= 0;

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md sticky top-0 z-30 shadow-2xl">
      {/* Top micro ticker strip */}
      <div className="bg-slate-900/80 border-b border-slate-800/60 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400 font-mono overflow-x-auto gap-6">
        <div className="flex items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400">Т-ИНВЕСТИЦИИ API ОНЛАЙН</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Обновлено: <span className="text-amber-300 font-bold">{updatedAt}</span>
          </span>
          <span className="text-slate-600">|</span>
          <span>
            Клиринг / Фандинг: <span className="text-amber-300 font-semibold">{ticker.nextFundingTime}</span>
          </span>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          {ticker.spotPrice && (
            <div>
              Спот CNY/RUB (TOM):{' '}
              <span className="text-slate-200 font-bold">{ticker.spotPrice.toFixed(4)} ₽</span>
              {ticker.fundingSpreadKopecks !== undefined && (
                <span className="text-cyan-400 ml-1 text-[11px]">
                  (Спред: {ticker.fundingSpreadKopecks > 0 ? '+' : ''}{ticker.fundingSpreadKopecks} коп)
                </span>
              )}
            </div>
          )}
          <span className="text-slate-600">|</span>
          {ticker.brentPrice && (
            <div>
              Нефть Brent (BR):{' '}
              <span className="text-amber-300 font-bold">${ticker.brentPrice.toFixed(2)}</span>
            </div>
          )}
          <span className="text-slate-600">|</span>
          <div>
            Фандинг (вечный):{' '}
            <span className="text-cyan-300 font-semibold">
              +{ticker.fundingRate}% ({ticker.fundingAnnualized}% год.)
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div>
            Открытый интерес:{' '}
            <span className="text-slate-200 font-semibold">
              {(ticker.openInterest).toLocaleString('ru-RU')} контр.
            </span>
          </div>
        </div>
      </div>

      {/* Main Terminal Header Bar */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Symbol & Price badge */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 via-cyan-600/30 to-blue-600/20 border border-yellow-500/40 flex items-center justify-center font-bold text-yellow-300 text-lg shadow-inner shadow-yellow-500/10">
              T
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight font-mono">
                  {ticker.symbol}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE API
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                  Т-Банк Инвестиции
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Московская Биржа (SPBFUT) • Онлайн котировки и внутридневной прогноз
              </p>
            </div>
          </div>

          {/* Large Price Display */}
          <div className="pl-4 border-l border-slate-800 flex items-baseline gap-3">
            <div className="text-3xl font-extrabold font-mono tracking-tight text-white drop-shadow-sm">
              {ticker.price.toFixed(3)}
              <span className="text-sm font-normal text-slate-400 ml-1">₽</span>
            </div>
            <div
              className={`flex items-center gap-1 font-mono text-sm font-bold px-2.5 py-1 rounded-lg ${
                isPositive
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {isPositive ? '+' : ''}
              {ticker.change.toFixed(3)} ({isPositive ? '+' : ''}
              {ticker.changePct}%)
            </div>
            <div className="hidden xl:flex flex-col text-[11px] font-mono text-slate-400 leading-tight">
              <span>
                Дневной High: <strong className="text-slate-200">{ticker.high.toFixed(3)}</strong>
              </span>
              <span>
                Дневной Low: <strong className="text-slate-200">{ticker.low.toFixed(3)}</strong>
              </span>
              <span>
                VWAP: <strong className="text-cyan-300">{ticker.vwap.toFixed(3)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Sync Button */}
          <button
            onClick={onRefreshLive}
            disabled={isPolling}
            className="px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5 transition-all shadow-sm"
            title="Запросить свежие котировки из T-Bank Invest API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
            <span>{isPolling ? 'Синхронизация...' : 'Синхронизировать T-Bank'}</span>
          </button>

          {/* Live Tick Toggle */}
          <button
            onClick={onToggleLiveTick}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              isLiveTick
                ? 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Автоматический опрос онлайн котировок каждые 4 секунды"
          >
            <Activity className={`w-3.5 h-3.5 ${isLiveTick ? 'animate-pulse text-cyan-400' : ''}`} />
            {isLiveTick ? 'Авто-обновление ВКЛ' : 'Авто-обновление ПАУЗА'}
          </button>

          {/* What-If Simulator Trigger */}
          <button
            onClick={onOpenWhatIf}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Стресс-тест</span>
          </button>

          {/* AI Forecast Generate button */}
          <button
            onClick={onRefreshAi}
            disabled={isAiLoading}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 border border-cyan-400/40 text-xs font-semibold text-white flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isAiLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>{isAiLoading ? 'Расчет Gemini...' : 'Обновить AI Прогноз'}</span>
          </button>

          {/* Reset button */}
          <button
            onClick={onResetParams}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Сбросить факторы к рыночному бенчмарку"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Google Drive Button */}
          {onOpenGoogleDrive && (
            <button
              onClick={onOpenGoogleDrive}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm ${
                isDriveConnected
                  ? 'bg-blue-950/70 border-blue-500/60 text-blue-300 hover:bg-blue-900/80 shadow-blue-950/40'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
              }`}
              title="Интеграция с Google Диском: экспорт отчетов и управление файлами"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Диск</span>
              {isDriveConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>
          )}

          {/* Export button */}
          <button
            onClick={onOpenExport}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Экспорт торгового брифа и параметров"
          >
            <FileDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
