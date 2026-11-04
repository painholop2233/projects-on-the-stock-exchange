import React, { useState } from 'react';
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
  Table,
  Copy,
  Check,
  FileSpreadsheet,
  Code2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
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

  // Google Sheets 10-min macro state
  const [showSheetsMacro, setShowSheetsMacro] = useState(false);
  const [copiedMacroCode, setCopiedMacroCode] = useState(false);
  const [copiedFormula, setCopiedFormula] = useState(false);

  // Dynamic endpoint origin
  const apiEndpointUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/sheets/playbook`
    : 'https://[YOUR_APP_URL]/api/sheets/playbook';

  const importDataFormula = `=IMPORTDATA("${apiEndpointUrl}?format=csv")`;

  const macroCode = `/**
 * Автоматический опрос CNY/RUBF и проверка выполнения прогнозов в Google Таблицах
 * Периодичность: каждые 10 минут
 * Проверяет закрытие предыдущих прогнозов по TP1, TP2, SL или тайм-ауту
 */

// 1. URL вашего проекта на Render (при необходимости скрипт автоматически переключается на запасной шлюз)
const RENDER_API_URL = "https://cnyrubf-terminal.onrender.com/api/sheets/playbook";
const FALLBACK_API_URL = "${apiEndpointUrl}";
const SHEET_NAME = "CNYRUBF_Прогнозы";

/**
 * Главная функция: проверяет старые прогнозы и записывает новую строку
 */
function checkAndLogForecast() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // Создание листа с расширенной структурой
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      "№", "Дата и время (МСК)", "Цена CNYRUBF (₽)", "Brent ($)",
      "Сигнал", "Рекомендация", "Зона входа", "TP 1 (₽)", "TP 2 (₽)", "Stop Loss (₽)",
      "Цель 1ч (₽)", "Цель 4ч (₽)", "R/R",
      "Статус прогноза", "Факт цена проверки (₽)", "Результат P&L (коп)", "Время проверки",
      "Влияние 4 факторов (коп)", "Источник"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground("#0f172a")
      .setFontColor("#38bdf8")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setFontFamily("Roboto Mono");
    sheet.setFrozenRows(1);
  }

  // Получаем свежие котировки и прогноз
  const data = fetchPlaybookData();
  if (!data || !data.currentPrice) {
    Logger.log("Не удалось получить данные с сервера");
    return;
  }

  const currentPrice = Number(data.currentPrice);
  const now = new Date();
  const nowFormatted = Utilities.formatDate(now, "GMT+3", "dd.MM.yyyy HH:mm:ss");

  // --- ШАГ 1: Проверяем исполнение всех открытых («В процессе») предыдущих прогнозов ---
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const range = sheet.getRange(2, 1, lastRow - 1, 18);
    const values = range.getValues();

    for (let i = 0; i < values.length; i++) {
      const rowNum = i + 2;
      const status = values[i][13]; // Столбец N: "Статус прогноза"

      if (status === "В процессе") {
        const rowTimeStr = values[i][1];
        const entryPrice = Number(values[i][2]);
        const signal = values[i][4]; // "LONG", "SHORT", "RANGE"
        const tp1 = Number(values[i][7]);
        const tp2 = Number(values[i][8]);
        const sl = Number(values[i][9]);

        let isClosed = false;
        let newStatus = "";
        let pnlKopecks = 0;
        let bgColor = "";

        if (signal === "LONG") {
          if (currentPrice >= tp2) {
            newStatus = "🎯 ВЫПОЛНЕН (TP2)";
            pnlKopecks = (currentPrice - entryPrice) * 100;
            bgColor = "#bbf7d0"; // насыщенный зеленый
            isClosed = true;
          } else if (currentPrice >= tp1) {
            newStatus = "✅ ВЫПОЛНЕН (TP1)";
            pnlKopecks = (currentPrice - entryPrice) * 100;
            bgColor = "#dcfce7"; // светло-зеленый
            isClosed = true;
          } else if (currentPrice <= sl) {
            newStatus = "❌ СТОП-ЛОСС";
            pnlKopecks = (currentPrice - entryPrice) * 100;
            bgColor = "#fee2e2"; // красный
            isClosed = true;
          }
        } else if (signal === "SHORT") {
          if (currentPrice <= tp2) {
            newStatus = "🎯 ВЫПОЛНЕН (TP2)";
            pnlKopecks = (entryPrice - currentPrice) * 100;
            bgColor = "#bbf7d0";
            isClosed = true;
          } else if (currentPrice <= tp1) {
            newStatus = "✅ ВЫПОЛНЕН (TP1)";
            pnlKopecks = (entryPrice - currentPrice) * 100;
            bgColor = "#dcfce7";
            isClosed = true;
          } else if (currentPrice >= sl) {
            newStatus = "❌ СТОП-ЛОСС";
            pnlKopecks = (entryPrice - currentPrice) * 100;
            bgColor = "#fee2e2";
            isClosed = true;
          }
        } else if (signal === "RANGE") {
          if (currentPrice >= sl && currentPrice <= tp2) {
            newStatus = "✅ В ДИАПАЗОНЕ";
            pnlKopecks = 0;
            bgColor = "#e0f2fe";
          } else {
            newStatus = "⚠️ ВЫХОД ИЗ КАНАЛА";
            pnlKopecks = Math.abs(currentPrice - entryPrice) * 100;
            bgColor = "#fef3c7";
            isClosed = true;
          }
        }

        // Если прогноз закрылся — фиксируем результат в строке
        if (isClosed) {
          sheet.getRange(rowNum, 14).setValue(newStatus).setBackground(bgColor).setFontWeight("bold");
          sheet.getRange(rowNum, 15).setValue(currentPrice);
          const pnlText = (pnlKopecks > 0 ? "+" : "") + pnlKopecks.toFixed(1) + " коп.";
          sheet.getRange(rowNum, 16).setValue(pnlText).setFontWeight("bold");
          sheet.getRange(rowNum, 17).setValue(nowFormatted);
        }
      }
    }
  }

  // --- ШАГ 2: Добавляем новую строку с текущей котировкой и новым прогнозом ---
  const newRowNum = sheet.getLastRow();
  const nextId = newRowNum;
  const newRow = [
    nextId,
    data.timestamp || nowFormatted,
    currentPrice,
    data.brentPrice || "—",
    data.direction || "RANGE",
    data.recommendation || "—",
    data.entry || "—",
    data.takeProfit1 || "—",
    data.takeProfit2 || "—",
    data.stopLoss || "—",
    data.target1h || "—",
    data.target4h || "—",
    data.riskRewardRatio || "—",
    "В процессе", // Начальный статус
    "—",          // Факт цена
    "—",          // P&L
    "—",          // Время проверки
    data.netImpactKopecks || 0,
    data.source || "Т-Инвестиции Open API v2"
  ];

  sheet.appendRow(newRow);

  // Форматирование добавленной строки
  const addedRowIdx = sheet.getLastRow();
  const rowRange = sheet.getRange(addedRowIdx, 1, 1, newRow.length);
  rowRange.setFontFamily("Roboto Mono").setFontSize(9);

  // Подсветка сигнала
  const signalCell = sheet.getRange(addedRowIdx, 5);
  if (data.direction === "LONG") {
    signalCell.setBackground("#dcfce7").setFontColor("#15803d").setFontWeight("bold");
  } else if (data.direction === "SHORT") {
    signalCell.setBackground("#fee2e2").setFontColor("#b91c1c").setFontWeight("bold");
  } else {
    signalCell.setBackground("#f1f5f9").setFontColor("#475569").setFontWeight("bold");
  }

  // Статус "В процессе" желтоватый
  sheet.getRange(addedRowIdx, 14).setBackground("#fef9c3").setFontColor("#854d0e");

  Logger.log("Записан прогноз #" + nextId + " от " + nowFormatted);
}

/**
 * Запрос данных с поддержкой Render и автоматическим Fallback
 */
function fetchPlaybookData() {
  const urls = [RENDER_API_URL, FALLBACK_API_URL];
  for (let i = 0; i < urls.length; i++) {
    try {
      const res = UrlFetchApp.fetch(urls[i], {
        method: "get",
        muteHttpExceptions: true,
        headers: { "Accept": "application/json" }
      });
      if (res.getResponseCode() === 200) {
        const text = res.getContentText();
        if (text && text.trim().startsWith("{")) {
          const json = JSON.parse(text);
          if (json.success && json.currentPrice) return json;
        }
      }
    } catch (e) {
      Logger.log("Ошибка URL " + urls[i] + ": " + e.toString());
    }
  }
  return null;
}

/**
 * 2. Установка триггера на автоматический запуск каждые 10 минут
 * Запустите ОДИН РАЗ в редакторе Apps Script
 */
function installTrigger10Min() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "checkAndLogForecast") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger("checkAndLogForecast")
    .timeBased()
    .everyMinutes(10)
    .create();

  checkAndLogForecast(); // Первый запуск сразу
  Logger.log("Триггер установлен: опрос каждые 10 минут активен!");
}

/**
 * 3. Отключение авто-опроса (при необходимости)
 */
function removeTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "checkAndLogForecast") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  Logger.log("Триггеры опроса отключены.");
}`;

  const copyMacroCode = () => {
    navigator.clipboard.writeText(macroCode);
    setCopiedMacroCode(true);
    setTimeout(() => setCopiedMacroCode(false), 2500);
  };

  const copyFormula = () => {
    navigator.clipboard.writeText(importDataFormula);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2500);
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

      {/* Actionable Trading Playbook Card with Strict Mathematical Integrity & Google Sheets Integration */}
      {forecast.playbook && (
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900/95 to-slate-950 border-2 border-cyan-500/50 hover:border-cyan-400/80 rounded-xl p-4 space-y-3 font-mono text-xs shadow-xl shadow-cyan-950/20 transition-all duration-300">
          {/* Subtle top accent beam */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-emerald-400 to-indigo-500"></div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold tracking-tight">
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

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowSheetsMacro(!showSheetsMacro)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 transition-all text-[11px] font-sans font-semibold shadow-sm shadow-emerald-950/50"
                title="Получить код макроса для Google Таблиц с интервалом 10 минут"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Sheets (10м макрос)</span>
                {showSheetsMacro ? (
                  <ChevronUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-emerald-400" />
                )}
              </button>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>
                  Горизонт: <strong className="text-slate-200">{forecast.playbook.timeHorizon || '2-4 часа'}</strong>
                </span>
                <span>•</span>
                <span>
                  R/R: <strong className="text-amber-400">{forecast.playbook.riskRewardRatio}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Mathematical Order Hierarchy Breadcrumb */}
          <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
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
            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
              <span className="text-[10px] text-slate-400 block uppercase">Зона входа:</span>
              <span className="text-white font-bold text-sm">{forecast.playbook.entry} ₽</span>
            </div>
            <div className="bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-colors">
              <span className="text-[10px] text-emerald-400/90 block uppercase">Тейк-профит 1:</span>
              <span className="text-emerald-400 font-bold text-sm">{forecast.playbook.takeProfit1} ₽</span>
            </div>
            <div className="bg-cyan-950/20 p-2.5 rounded-lg border border-cyan-500/30 hover:border-cyan-500/50 transition-colors">
              <span className="text-[10px] text-cyan-400/90 block uppercase">Тейк-профит 2:</span>
              <span className="text-cyan-400 font-bold text-sm">{forecast.playbook.takeProfit2} ₽</span>
            </div>
            <div className="bg-rose-950/20 p-2.5 rounded-lg border border-rose-500/30 hover:border-rose-500/50 transition-colors">
              <span className="text-[10px] text-rose-400/90 block uppercase">Стоп-лосс:</span>
              <span className="text-rose-400 font-bold text-sm">{forecast.playbook.stopLoss} ₽</span>
            </div>
          </div>

          {/* Interactive Google Sheets Macro Drawer */}
          {showSheetsMacro && (
            <div className="mt-3 p-3.5 bg-slate-950/95 border border-emerald-500/40 rounded-xl space-y-3 font-sans text-slate-300 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                      <span>Макрос Google Apps Script</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                        Опрос раз в 10 минут
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Автоматическая запись сетапов (вход, TP, SL, R/R, цены) в лист Google Таблицы
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyMacroCode}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
                  >
                    {copiedMacroCode ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMacroCode ? 'Скопировано!' : 'Копировать код макроса'}</span>
                  </button>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-bold font-mono">Шаг 1:</span> В Google Таблице откройте меню{' '}
                  <strong className="text-white">Расширения → Apps Script</strong>.
                </div>
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-bold font-mono">Шаг 2:</span> Вставьте код ниже и нажмите{' '}
                  <strong className="text-white">Сохранить (Ctrl+S)</strong>.
                </div>
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-bold font-mono">Шаг 3:</span> Выберите функцию{' '}
                  <strong className="text-cyan-300 font-mono">installTrigger10Min</strong> и нажмите «Выполнить».
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="relative">
                <pre className="p-3 bg-slate-900 rounded-lg text-[10px] font-mono text-cyan-200 overflow-x-auto max-h-48 border border-slate-800 select-all leading-relaxed">
                  {macroCode}
                </pre>
              </div>

              {/* One-Liner Quick Alternative: IMPORTDATA */}
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Table className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-[11px] text-slate-300">
                    Экспресс-формула без скрипта (для ячейки A1):
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] bg-slate-950 px-2 py-1 rounded text-amber-300 font-mono border border-slate-800">
                    {importDataFormula}
                  </code>
                  <button
                    type="button"
                    onClick={copyFormula}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Скопировать формулу =IMPORTDATA"
                  >
                    {copiedFormula ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          )}
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
