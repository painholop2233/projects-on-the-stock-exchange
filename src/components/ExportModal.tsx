import React, { useState } from 'react';
import { X, Copy, Check, FileText, Download, Landmark, Cloud } from 'lucide-react';
import {
  MarketTickerState,
  SimulationParams,
  AiForecastResult,
  FactorDetail,
  PublicBenchmarkSources,
} from '../types/market';
import { DEFAULT_PUBLIC_BENCHMARKS } from '../services/marketModel';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: MarketTickerState;
  params: SimulationParams;
  forecast: AiForecastResult;
  factors: FactorDetail[];
  benchmarks?: PublicBenchmarkSources;
  onOpenGoogleDrive?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  ticker,
  params,
  forecast,
  factors,
  benchmarks = DEFAULT_PUBLIC_BENCHMARKS,
  onOpenGoogleDrive,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const reportText = `=====================================================
АНАЛИТИЧЕСКИЙ БРИФ: ВНУТРИДНЕВНОЙ ПРОГНОЗ CNYRUBF
Дата и время формирования: ${new Date().toLocaleString('ru-RU')}
Инструмент: Вечный фьючерс CNY/RUB (MOEX / SPBFUT)
Источник котировок: Т-Банк Инвестиции Open API v2
=====================================================

1. ОНЛАЙН-КОТИРОВКИ И МИКРОСТРУКТУРА:
- Текущая цена: ${ticker.price.toFixed(3)} ₽ (${ticker.change >= 0 ? '+' : ''}${ticker.change.toFixed(3)} ₽ / ${ticker.changePct}%)
- Спот CNY/RUB (TOM): ${ticker.spotPrice ? ticker.spotPrice.toFixed(4) + ' ₽' : '12.0715 ₽'}
- Спред фандинга (вечный к споту): ${ticker.fundingSpreadKopecks !== undefined ? ticker.fundingSpreadKopecks + ' коп.' : '+1.15 коп.'}
- Дневной диапазон: ${ticker.low.toFixed(3)} – ${ticker.high.toFixed(3)} ₽
- VWAP дня: ${ticker.vwap.toFixed(3)} ₽
- Ставка фандинга: +${ticker.fundingRate}% (+${ticker.fundingAnnualized}% годовых)
- Открытый интерес (OI): ${ticker.openInterest.toLocaleString('ru-RU')} контрактов

2. ФАКТИЧЕСКИЕ БЕНЧМАРКИ НА САЙТАХ И В API:
• Нефть Brent: $${params.oilBrent.toFixed(2)}/bbl
  Источник: ${benchmarks.brent.source}
  Актуально на: ${benchmarks.brent.asOf}

• Дисконт сорта Urals: $${params.oilUralsDiscount.toFixed(1)}/bbl (Расчетная Urals: $${(params.oilBrent - params.oilUralsDiscount).toFixed(1)})
  Источник: ${benchmarks.uralsDiscount.source}
  Актуально на: ${benchmarks.uralsDiscount.asOf}

• Бюджетное правило: ${params.fiscalVolumeBln.toFixed(1)} млрд ₽/день (нетто-продажи валюты ЦБ)
  Источник: ${benchmarks.fiscalRule.source}
  Актуально на: ${benchmarks.fiscalRule.asOf}

• Ставка RUSFAR CNY: ${params.rusfarCnyRate.toFixed(1)}% годовых
  Источник: ${benchmarks.rusfarCny.source}
  Актуально на: ${benchmarks.rusfarCny.asOf}

• Индекс санкционного давления: ${params.sanctionsScore}/100
  Источник: ${benchmarks.sanctionsScore.source}
  Актуально на: ${benchmarks.sanctionsScore.asOf}

• Товарный спрос импортеров: ${params.importDemandScore}/100
  Источник: ${benchmarks.importDemand.source}
  Актуально на: ${benchmarks.importDemand.asOf}

• Налоговый период (НДПИ): ${params.taxPeriodPhase === 'tax_peak' ? 'Пик конверсии выручки (25-28 числа)' : 'Стандартный режим'}
  Источник: ${benchmarks.taxPeriod.source}
  Актуально на: ${benchmarks.taxPeriod.asOf}

3. ВНУТРИДНЕВНЫЕ ПРОГНОЗНЫЕ ЦЕЛИ:
- Рекомендация: ${forecast.recommendationLabel} (Уверенность: ${forecast.confidencePct}%)
- Цель через 1 час (Т+1ч): ${forecast.target1h.toFixed(3)} ₽
- Цель через 4 часа (Т+4ч): ${forecast.target4h.toFixed(3)} ₽
- Целевое закрытие сессии (19:00): ${forecast.targetClose.toFixed(3)} ₽
- Диапазон дня: ${forecast.rangeLow.toFixed(3)} – ${forecast.rangeHigh.toFixed(3)} ₽

4. ТАКТИЧЕСКИЙ ТРЕЙДИНГ ПЛАН:
- Зона входа: ${forecast.playbook?.entry || 'По рынку'}
- Тейк-Профит 1: ${forecast.playbook?.takeProfit1 || '-'} ₽
- Тейк-Профит 2: ${forecast.playbook?.takeProfit2 || '-'} ₽
- Стоп-Лосс: ${forecast.playbook?.stopLoss || '-'} ₽
- Соотношение Risk / Reward: ${forecast.playbook?.riskRewardRatio || '1:2.4'}
- Горизонт: ${forecast.playbook?.timeHorizon || '2-4 часа'}

5. ДЕКОМПОЗИЦИЯ 4 КЛЮЧЕВЫХ ФАКТОРОВ:
${factors
  .map(
    (f) =>
      `• ${f.name.toUpperCase()}:
   Влияние на курс: ${f.impactKopecks > 0 ? '+' : ''}${f.impactKopecks} коп. (${
        f.sentiment === 'bullish_rub' ? 'В пользу Рубля' : 'В пользу Юаня'
      })
   Показатели: ${f.currentValueDisplay}
   Трансмиссия: ${f.transmissionChannel}`
  )
  .join('\n\n')}

6. МАКРОЭКОНОМИЧЕСКИЙ ВЕРДИКТ (GEMINI AI):
${forecast.macroAnalysis}

7. ТРИГГЕРЫ ОТМЕНЫ СЦЕНАРИЯ:
${forecast.riskTriggers?.map((t, idx) => `${idx + 1}. ${t}`).join('\n') || 'Следить за нефтью и ставками RUSFAR'}
=====================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CNYRUBF_Intraday_Brief_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white font-mono">
              Экспорт Аналитического Брифа CNYRUBF
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
            {reportText}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-end gap-3 font-mono text-xs">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center gap-2 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Скопировано в буфер</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Скопировать текст</span>
              </>
            )}
          </button>

          {onOpenGoogleDrive && (
            <button
              onClick={() => {
                onClose();
                onOpenGoogleDrive();
              }}
              className="px-4 py-2 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white font-semibold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-colors"
            >
              <Cloud className="w-4 h-4 text-blue-200" />
              <span>Сохранить в Google Диск</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-2 shadow-md shadow-cyan-600/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Скачать .TXT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
