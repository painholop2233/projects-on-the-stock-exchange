import React, { useState, useEffect } from 'react';
import {
  Sliders,
  RotateCcw,
  Zap,
  TrendingUp,
  TrendingDown,
  Percent,
  Calendar,
  X,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Landmark,
  Layers,
  ChevronDown,
  Flame,
  Check,
  Download,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { SimulationParams, PublicBenchmarkSources, OilFutureContract } from '../types/market';
import {
  BASELINE_SIMULATION,
  DEFAULT_PUBLIC_BENCHMARKS,
  DEFAULT_OIL_FUTURES,
} from '../services/marketModel';

interface WhatIfSimulatorProps {
  params: SimulationParams;
  onChangeParams: (newParams: SimulationParams) => void;
  onReset: () => void;
  netImpactKopecks: number;
  isOpen?: boolean;
  onClose?: () => void;
  updatedAt: string;
  benchmarks?: PublicBenchmarkSources;
  onSyncWithLive?: () => void;
  oilFutures?: OilFutureContract[];
  liveBrentPrice?: number;
  onSelectOilContract?: (contract: OilFutureContract) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  params,
  onChangeParams,
  onReset,
  netImpactKopecks,
  isOpen = true,
  onClose,
  updatedAt,
  benchmarks = DEFAULT_PUBLIC_BENCHMARKS,
  onSyncWithLive,
  oilFutures,
  liveBrentPrice,
  onSelectOilContract,
}) => {
  const [isOilFuturesOpen, setIsOilFuturesOpen] = useState(false);
  const [localOilFutures, setLocalOilFutures] = useState<OilFutureContract[]>(
    oilFutures && oilFutures.length > 0 ? oilFutures : DEFAULT_OIL_FUTURES
  );
  const [selectedContractTicker, setSelectedContractTicker] = useState<string>('BRZ6');
  const [isPullingOil, setIsPullingOil] = useState(false);
  const [isRefreshingFutures, setIsRefreshingFutures] = useState(false);
  const [pulledSuccessMsg, setPulledSuccessMsg] = useState<string | null>(null);
  const [futuresUpdatedAt, setFuturesUpdatedAt] = useState<string>(updatedAt);

  // Synchronize local contracts when props change
  useEffect(() => {
    if (oilFutures && oilFutures.length > 0) {
      setLocalOilFutures(oilFutures);
    }
  }, [oilFutures]);

  // Pull latest oil price from T-Investments
  const handlePullOilFromTinkoff = async () => {
    setIsPullingOil(true);
    try {
      const res = await fetch('/api/tinkoff/oil-futures');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.contracts) && data.contracts.length > 0) {
        setLocalOilFutures(data.contracts);
        const nearest = data.contracts.find((c: OilFutureContract) => c.isNearest) || data.contracts[0];
        updateParam('oilBrent', nearest.price);
        setSelectedContractTicker(nearest.ticker);
        if (data.updatedAt) setFuturesUpdatedAt(data.updatedAt);
        setPulledSuccessMsg(`Подтянуто: $${nearest.price.toFixed(2)} (${nearest.ticker} Т-Инвестиции)`);
      } else {
        const p = liveBrentPrice || (typeof benchmarks.brent.value === 'number' ? benchmarks.brent.value : 104.71);
        updateParam('oilBrent', Number(p));
        setPulledSuccessMsg(`Подтянуто: $${Number(p).toFixed(2)} (Т-Инвестиции)`);
      }
    } catch {
      const p = liveBrentPrice || (typeof benchmarks.brent.value === 'number' ? benchmarks.brent.value : 104.71);
      updateParam('oilBrent', Number(p));
      setPulledSuccessMsg(`Подтянуто: $${Number(p).toFixed(2)} (Т-Инвестиции)`);
    } finally {
      setIsPullingOil(false);
      setTimeout(() => setPulledSuccessMsg(null), 3500);
    }
  };

  // Refresh oil futures list from T-Investments
  const handleRefreshFuturesList = async () => {
    setIsRefreshingFutures(true);
    try {
      const res = await fetch('/api/tinkoff/oil-futures');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.contracts)) {
        setLocalOilFutures(data.contracts);
        if (data.updatedAt) setFuturesUpdatedAt(data.updatedAt);
      }
    } catch (err) {
      console.warn('Failed to refresh oil futures:', err);
    } finally {
      setIsRefreshingFutures(false);
    }
  };

  // Select contract from popup
  const handleSelectContract = (contract: OilFutureContract) => {
    updateParam('oilBrent', contract.price);
    setSelectedContractTicker(contract.ticker);
    setPulledSuccessMsg(`Выбран фьючерс ${contract.ticker}: $${contract.price.toFixed(2)}`);
    if (onSelectOilContract) onSelectOilContract(contract);
    setIsOilFuturesOpen(false);
    setTimeout(() => setPulledSuccessMsg(null), 3500);
  };
  const updateParam = <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => {
    onChangeParams({
      ...params,
      [key]: value,
    });
  };

  const applyPreset = (preset: 'baseline' | 'oil_slump' | 'oil_rally' | 'cb_pause' | 'sanctions_spike' | 'import_surge') => {
    switch (preset) {
      case 'baseline':
        if (onSyncWithLive) {
          onSyncWithLive();
        } else {
          onChangeParams(BASELINE_SIMULATION);
        }
        break;
      case 'oil_slump':
        onChangeParams({
          ...params,
          oilBrent: 85.0,
          oilUralsDiscount: 15.5,
          sanctionsScore: 72,
        });
        break;
      case 'oil_rally':
        onChangeParams({
          ...params,
          oilBrent: 132.0,
          oilUralsDiscount: 10.0,
          sanctionsScore: 55,
        });
        break;
      case 'cb_pause':
        onChangeParams({
          ...params,
          fiscalVolumeBln: 0.0, // ЦБ останавливает интервенции
          importDemandScore: 75,
        });
        break;
      case 'sanctions_spike':
        onChangeParams({
          ...params,
          sanctionsScore: 92,
          rusfarCnyRate: 16.5,
          importDemandScore: 60,
        });
        break;
      case 'import_surge':
        onChangeParams({
          ...params,
          importDemandScore: 94,
          rusfarCnyRate: 13.5,
          sanctionsScore: 70,
        });
        break;
    }
  };

  const uralsPrice = (params.oilBrent - params.oilUralsDiscount).toFixed(1);
  const isPositive = netImpactKopecks >= 0;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-sm relative space-y-3.5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-950 to-blue-900 border border-cyan-700/60 shadow-inner">
            <Sliders className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 font-mono">
                Стресс-тестирование & Симулятор сценариев
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Реальные данные Т-Инвестиций & ЦБ РФ
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Базовые уровни основаны на онлайн-котировках Т-Инвестиций и официальных публикациях регуляторов
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Net shift counter */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 font-mono text-xs shadow-inner">
            <span className="text-slate-400">Стресс-дельта:</span>
            <span
              className={`font-extrabold text-sm ${
                isPositive ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {netImpactKopecks > 0 ? '+' : ''}
              {netImpactKopecks} коп.
            </span>
          </div>

          {onSyncWithLive && (
            <button
              onClick={onSyncWithLive}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Синхронизировать базовые уровни стресс-теста с онлайн-котировками Т-Инвестиций"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Сброс к факту Т-Инвестиций</span>
            </button>
          )}

          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Сбросить параметры к базовому состоянию"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Official Data Grounding Strip */}
      <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/80 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <Landmark className="w-3.5 h-3.5 text-amber-400" />
          <span>Фактические бенчмарки на сайтах и в API:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px]">
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            Brent:{' '}
            <strong className="text-amber-300">
              ${typeof benchmarks.brent.value === 'number' ? benchmarks.brent.value.toFixed(2) : benchmarks.brent.value}
            </strong>{' '}
            <span className="text-slate-500">({benchmarks.brent.asOf})</span>
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            Бюджетное правило ЦБ:{' '}
            <strong className="text-cyan-300">{benchmarks.fiscalRule.value} млрд ₽/день</strong>{' '}
            <span className="text-slate-500">(cbr.ru)</span>
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            Дисконт Urals:{' '}
            <strong className="text-slate-200">${benchmarks.uralsDiscount.value}</strong>{' '}
            <span className="text-slate-500">(minfin.gov.ru)</span>
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            RUSFAR CNY:{' '}
            <strong className="text-emerald-300">{benchmarks.rusfarCny.value}%</strong>{' '}
            <span className="text-slate-500">(moex.com)</span>
          </span>
        </div>
      </div>

      {/* Quick Scenario Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
        <span className="text-slate-400 font-bold shrink-0 mr-1 flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Стресс-сценарии:
        </span>
        <button
          onClick={() => applyPreset('baseline')}
          className="px-2.5 py-1 rounded-md bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 shrink-0 font-bold transition-colors"
        >
          Фактический рынок (Т-Инвестиции)
        </button>
        <button
          onClick={() => applyPreset('oil_slump')}
          className="px-2.5 py-1 rounded-md bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 shrink-0 transition-colors"
        >
          Шок нефти: $85 (-27%)
        </button>
        <button
          onClick={() => applyPreset('cb_pause')}
          className="px-2.5 py-1 rounded-md bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 shrink-0 transition-colors"
        >
          Пауза ЦБ (0 млрд ₽)
        </button>
        <button
          onClick={() => applyPreset('sanctions_spike')}
          className="px-2.5 py-1 rounded-md bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60 shrink-0 transition-colors"
        >
          Блокада расчетов (Индекс 92)
        </button>
        <button
          onClick={() => applyPreset('import_surge')}
          className="px-2.5 py-1 rounded-md bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 shrink-0 transition-colors"
        >
          Всплеск импорта (+38%)
        </button>
        <button
          onClick={() => applyPreset('oil_rally')}
          className="px-2.5 py-1 rounded-md bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 shrink-0 transition-colors"
        >
          Ралли нефти: $132+
        </button>
      </div>

      {/* Sliders Grid with source metadata and current timestamps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1 font-mono text-xs">
        {/* Slider 1: Brent Oil (Selected Focus Element) */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2.5 flex flex-col justify-between relative group hover:border-amber-500/40 transition-colors">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span>1. Нефть Brent</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-xs">
                  ${params.oilBrent.toFixed(2)}/bbl
                </span>
              </div>
            </div>

            {/* Quick Action Buttons: Pull from T-Investments & Popup List of nearest futures */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={handlePullOilFromTinkoff}
                disabled={isPullingOil}
                className="flex-1 py-1 px-2 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-600/40 hover:border-amber-500 text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                title="Подтянуть текущую котировку нефти из Т-Инвестиций"
              >
                <Download className={`w-3 h-3 text-amber-400 ${isPullingOil ? 'animate-bounce' : ''}`} />
                <span>{isPullingOil ? 'Загрузка...' : 'Подтянуть из Т-Инвестиций'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOilFuturesOpen(true)}
                className="py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/60 text-slate-200 hover:text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95"
                title="Открыть всплывающий список ближайших фьючерсов на нефть Brent"
              >
                <Layers className="w-3 h-3 text-amber-400" />
                <span>Фьючерсы ({localOilFutures.length})</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            {/* Active contract indicator & Success confirmation badge */}
            {pulledSuccessMsg && (
              <div className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 rounded px-2 py-0.5 flex items-center gap-1 animate-in fade-in duration-200">
                <Check className="w-2.5 h-2.5 text-emerald-400" />
                <span>{pulledSuccessMsg}</span>
              </div>
            )}

            {/* Source & Date metadata */}
            <div className="text-[10px] text-slate-400 flex flex-col leading-tight pt-0.5">
              <span className="text-slate-300 flex items-center justify-between">
                <span>Источник: <strong>{benchmarks.brent.source}</strong></span>
                <span className="text-amber-400 font-semibold">{selectedContractTicker}</span>
              </span>
              <span className="text-amber-400/90">
                Актуально на: <strong>{benchmarks.brent.asOf}</strong>
              </span>
            </div>
          </div>

          <input
            type="range"
            min={65}
            max={145}
            step={0.5}
            value={params.oilBrent}
            onChange={(e) => updateParam('oilBrent', parseFloat(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg my-1"
          />

          <div className="flex justify-between text-[10px] text-slate-500">
            <span>$65</span>
            <span className="text-slate-300">Расчетная Urals: ${uralsPrice}</span>
            <span>$145</span>
          </div>
        </div>

        {/* Slider 2: Sanctions & Geopolitics Score */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-rose-400 font-bold">2. Индекс санкций</span>
              <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {params.sanctionsScore} / 100
              </span>
            </div>
            {/* Source & Date metadata */}
            <div className="text-[10px] text-slate-400 flex flex-col leading-tight">
              <span className="text-slate-300">
                Источник: <strong>{benchmarks.sanctionsScore.source}</strong>
              </span>
              <span className="text-rose-400/90">
                Актуально на: <strong>{benchmarks.sanctionsScore.asOf}</strong>
              </span>
            </div>
          </div>

          <input
            type="range"
            min={10}
            max={100}
            step={1}
            value={params.sanctionsScore}
            onChange={(e) => updateParam('sanctionsScore', parseInt(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg my-1"
          />

          <div className="flex justify-between text-[10px] text-slate-500">
            <span>10 (Мягко)</span>
            <span className="text-slate-400">Спред OTC/Биржа: +1.8%</span>
            <span>100 (Блокада)</span>
          </div>
        </div>

        {/* Slider 3: Fiscal Rule Interventions */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-cyan-400 font-bold">3. Бюджетное правило</span>
              <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {params.fiscalVolumeBln.toFixed(1)} млрд ₽/день
              </span>
            </div>
            {/* Source & Date metadata */}
            <div className="text-[10px] text-slate-400 flex flex-col leading-tight">
              <span className="text-slate-300">
                Источник: <strong>{benchmarks.fiscalRule.source}</strong>
              </span>
              <span className="text-cyan-400/90">
                Актуально на: <strong>{benchmarks.fiscalRule.asOf}</strong>
              </span>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={20}
            step={0.5}
            value={params.fiscalVolumeBln}
            onChange={(e) => updateParam('fiscalVolumeBln', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg my-1"
          />

          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0 (Пауза ЦБ)</span>
            <span className="text-slate-400">Норма: 8.4 млрд ₽</span>
            <span>20 млрд ₽</span>
          </div>
        </div>

        {/* Slider 4: Import Demand Score */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-emerald-400 font-bold">4. Импортный спрос</span>
              <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {params.importDemandScore} / 100
              </span>
            </div>
            {/* Source & Date metadata */}
            <div className="text-[10px] text-slate-400 flex flex-col leading-tight">
              <span className="text-slate-300">
                Источник: <strong>{benchmarks.importDemand.source}</strong>
              </span>
              <span className="text-emerald-400/90">
                Актуально на: <strong>{benchmarks.importDemand.asOf}</strong>
              </span>
            </div>
          </div>

          <input
            type="range"
            min={20}
            max={100}
            step={1}
            value={params.importDemandScore}
            onChange={(e) => updateParam('importDemandScore', parseInt(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg my-1"
          />

          <div className="flex justify-between text-[10px] text-slate-500">
            <span>20 (Низкий)</span>
            <span className="text-slate-400">Авто, ТНП, Компоненты</span>
            <span>100 (Пиковый)</span>
          </div>
        </div>

        {/* Setting 5: Tax Period Phase */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-indigo-400 font-bold">5. Налоговый период (НДПИ)</span>
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-[10px] text-slate-400 flex flex-col leading-tight">
              <span className="text-slate-300">
                Источник: <strong>{benchmarks.taxPeriod.source}</strong>
              </span>
              <span className="text-indigo-400/90">
                Актуально на: <strong>{benchmarks.taxPeriod.asOf}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 pt-1">
            <button
              onClick={() => updateParam('taxPeriodPhase', 'pre_tax')}
              className={`py-1 px-1.5 rounded text-[10px] font-mono border transition-all ${
                params.taxPeriodPhase === 'pre_tax'
                  ? 'bg-indigo-600 border-indigo-400 text-white font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              1-24 числа
            </button>
            <button
              onClick={() => updateParam('taxPeriodPhase', 'tax_peak')}
              className={`py-1 px-1.5 rounded text-[10px] font-mono border transition-all ${
                params.taxPeriodPhase === 'tax_peak'
                  ? 'bg-indigo-600 border-indigo-400 text-white font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              25-28 (Пик)
            </button>
            <button
              onClick={() => updateParam('taxPeriodPhase', 'post_tax')}
              className={`py-1 px-1.5 rounded text-[10px] font-mono border transition-all ${
                params.taxPeriodPhase === 'post_tax'
                  ? 'bg-indigo-600 border-indigo-400 text-white font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              29-31 числа
            </button>
          </div>
        </div>

        {/* Setting 6: RUSFAR CNY Rate */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-sky-400 font-bold">6. Ставка RUSFAR CNY</span>
              <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {params.rusfarCnyRate.toFixed(1)}% год.
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex flex-col leading-tight">
              <span className="text-slate-300">
                Источник: <strong>{benchmarks.rusfarCny.source}</strong>
              </span>
              <span className="text-sky-400/90">
                Актуально на: <strong>{benchmarks.rusfarCny.asOf}</strong>
              </span>
            </div>
          </div>

          <input
            type="range"
            min={4}
            max={22}
            step={0.2}
            value={params.rusfarCnyRate}
            onChange={(e) => updateParam('rusfarCnyRate', parseFloat(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg my-1"
          />

          <div className="flex justify-between text-[10px] text-slate-500">
            <span>4% (Профицит)</span>
            <span className="text-slate-400">Стоимость юаней</span>
            <span>22% (Дефицит)</span>
          </div>
        </div>
      </div>

      {/* Window Bottom Timestamp Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Дата и время актуальности данных стресс-теста:</span>
          <strong className="text-amber-300">{updatedAt}</strong>
        </span>
        <span className="text-slate-500">
          Источники: Т-Инвестиции API v2, Банк России (cbr.ru), Минфин РФ (minfin.gov.ru), ФТС России, Мосбиржа
        </span>
      </div>

      {/* Pop-up List of Nearest Oil Futures (Brent) */}
      {isOilFuturesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOilFuturesOpen(false)}
        >
          <div
            className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden font-mono flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Flame className="w-5 h-5 fill-amber-400/20" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white font-mono">
                      Ближайшие фьючерсы на нефть Brent
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Т-Инвестиции API
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Срочный рынок MOEX (SPBFUT) • Онлайн-котировки и кривая срочной структуры
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshFuturesList}
                  disabled={isRefreshingFutures}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Обновить котировки фьючерсов из Т-Инвестиций"
                >
                  <RefreshCw className={`w-4 h-4 text-amber-400 ${isRefreshingFutures ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOilFuturesOpen(false)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Term structure note & summary bar */}
            <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Форма кривой:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60">
                  Бэквордация (Backwardation)
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  (Дефицит ближних поставок, дальние контракты дешевле)
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Ближний контракт: <strong className="text-amber-300">${localOilFutures[0]?.price?.toFixed(2) || '104.71'}</strong>
              </div>
            </div>

            {/* List / Table of Futures */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              <div className="grid grid-cols-1 gap-2">
                {localOilFutures.map((contract) => {
                  const isSelected = selectedContractTicker === contract.ticker;
                  const isFrontMonth = contract.isNearest;
                  const spread = contract.spreadToSpot ?? 0;

                  return (
                    <div
                      key={contract.uid}
                      onClick={() => handleSelectContract(contract)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-amber-500/40 hover:bg-slate-950'
                      }`}
                    >
                      {/* Left: Ticker, Code, Expiration */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isFrontMonth
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-extrabold'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <Flame className="w-4 h-4" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">{contract.ticker}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-bold border border-slate-700">
                              {contract.code}
                            </span>
                            {isFrontMonth && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                Спот-прокси (Ближний)
                              </span>
                            )}
                            {isSelected && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> Выбран
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                            <span>{contract.name}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              Экспирация: <strong className="text-slate-300">{contract.expirationFormatted}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Price, Spread and Select Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="text-left sm:text-right">
                          <div className="text-base font-extrabold text-white">
                            ${contract.price.toFixed(2)}{' '}
                            <span className="text-[11px] font-normal text-slate-400">/bbl</span>
                          </div>
                          <div className="text-[11px] flex items-center justify-start sm:justify-end gap-1">
                            <span className="text-slate-500">Спред:</span>
                            <span
                              className={`font-bold ${
                                spread === 0
                                  ? 'text-slate-400'
                                  : spread < 0
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {spread > 0 ? `+${spread.toFixed(2)}` : spread === 0 ? '0.00' : spread.toFixed(2)} $
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectContract(contract);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                              : 'bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-200 border border-slate-700'
                          }`}
                        >
                          <span>{isSelected ? 'Активен' : 'Выбрать'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative footer card */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Влияние цен фьючерсов на вечный контракт CNYRUBF:</span>
                </div>
                <p>
                  Цена нефти транслируется в курс рубля через экспортную выручку нефтегазовых компаний и механизм
                  бюджетного правила Минфина и ЦБ. Выбор фьючерса на более дальний месяц позволяет моделировать
                  ожидания рынка по движению сырьевых цен в стресс-тесте.
                </p>
              </div>
            </div>

            {/* Modal Bottom Timestamp Bar */}
            <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Время актуальности котировок фьючерсов:</span>
                <strong className="text-amber-300">{futuresUpdatedAt}</strong>
              </span>
              <span className="text-slate-500">
                Источник: Т-Банк Инвестиции Open API v2 (MarketDataService)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
