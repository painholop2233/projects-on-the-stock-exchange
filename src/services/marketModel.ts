import {
  CandleData,
  FactorDetail,
  MarketTickerState,
  NewsItem,
  OrderBookRow,
  SimulationParams,
  AiForecastResult,
  PublicBenchmarkSources,
} from '../types/market';

export const DEFAULT_PUBLIC_BENCHMARKS: PublicBenchmarkSources = {
  brent: {
    title: 'Нефть Brent (фьючерс BRX6 MOEX)',
    source: 'Т-Инвестиции API (tinkoff.ru/invest)',
    value: 117.67,
    unit: '$/баррель',
    asOf: '31.10.2026, 12:47:34 МСК',
  },
  uralsDiscount: {
    title: 'Дисконт сорта Urals к Brent',
    source: 'Минфин России (minfin.gov.ru)',
    value: 12.2,
    unit: '$/баррель',
    asOf: '30.10.2026, 18:00 МСК',
  },
  fiscalRule: {
    title: 'Бюджетное правило (нетто-продажи ЦБ)',
    source: 'Банк России (cbr.ru)',
    value: 8.4,
    unit: 'млрд ₽/день',
    asOf: '31.10.2026, 10:00 МСК',
  },
  rusfarCny: {
    title: 'Ставка денежного рынка RUSFAR CNY',
    source: 'Московская Биржа (moex.com)',
    value: 9.4,
    unit: '% годовых',
    asOf: '31.10.2026, 12:57:00 МСК',
  },
  sanctionsScore: {
    title: 'Индекс санкционного давления на расчеты',
    source: 'Мониторинг расчетов ЦБ РФ / АРБ / Ведомости',
    value: 64,
    unit: '/ 100',
    asOf: '31.10.2026, 11:30 МСК',
  },
  importDemand: {
    title: 'Индекс спроса импортеров на юани',
    source: 'ФТС России & ЦМАКП (Оценка динамики импорта)',
    value: 68,
    unit: '/ 100',
    asOf: '31.10.2026, 09:00 МСК',
  },
  taxPeriod: {
    title: 'Календарь налогового периода (НДПИ / ЕНП)',
    source: 'ФНС России (nalog.gov.ru)',
    status: 'Пик выплат ЕНП / НДПИ (25-28 числа)',
    value: 'Активен',
    asOf: '31.10.2026',
  },
};

export const BASELINE_SIMULATION: SimulationParams = {
  oilBrent: 117.67,
  oilUralsDiscount: 12.2, // Urals = 105.47
  sanctionsScore: 64, // 0-100
  fiscalVolumeBln: 8.4, // млрд руб/день
  importDemandScore: 68, // 0-100
  taxPeriodPhase: 'tax_peak', // 'pre_tax' | 'tax_peak' | 'post_tax'
  rusfarCnyRate: 9.4, // %
};

const now = new Date();
const formattedInitialTimestamp = now.toLocaleString('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export const INITIAL_TICKER: MarketTickerState = {
  symbol: 'CNYRUBF',
  name: 'Вечный фьючерс CNY/RUB (MOEX)',
  price: 12.083,
  closePrice: 12.219,
  change: -0.136,
  changePct: -1.11,
  high: 12.115,
  low: 12.062,
  vwap: 12.085,
  openInterest: 1542100,
  volumeTotal: 412800, // контрактов
  fundingRate: 0.095, // % за день
  fundingAnnualized: 34.7, // % годовых
  fundingSpreadKopecks: 1.15,
  spotPrice: 12.0715,
  brentPrice: 117.61,
  nextFundingTime: '19:00 МСК',
  sessionState: 'MAIN_SESSION',
  lastUpdated: formattedInitialTimestamp,
  apiSource: 'T-Bank Invest API (FUTCNYRUBF00)',
};

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: 'n1',
    time: '14:25',
    headline: 'Минфин и Банк России подтвердили ежедневные продажи юаней на 8.4 млрд руб в рамках бюджетного правила',
    source: 'Интерфакс / Банк России',
    category: 'fiscal_rule',
    impactKopecks: -3.5,
    sentiment: 'cny_down',
    summary: 'Регулярные операции Минфина по базовым нефтегазовым доходам и зеркалирование инвестиций ФНБ обеспечивают непрерывное предложение валюты на бирже.',
    verified: true,
    updatedAt: formattedInitialTimestamp,
  },
  {
    id: 'n2',
    time: '13:50',
    headline: 'Нефть Brent на Мосбирже держится в районе ключевых уровней на фоне ближневосточной премии',
    source: 'T-Bank Рынки / Bloomberg',
    category: 'oil',
    impactKopecks: -2.8,
    sentiment: 'cny_down',
    summary: 'Рост рублевой бочки Urals выше 4,950 ₽ поддерживает платежный баланс и увеличивает прогнозируемые налоговые сборы от экспортеров.',
    verified: true,
    updatedAt: formattedInitialTimestamp,
  },
  {
    id: 'n3',
    time: '12:40',
    headline: 'Комплаенс китайских региональных банков сохраняет строгие проверки трансграничных расчетов',
    source: 'Коммерсантъ / Ведомости',
    category: 'geopolitics',
    impactKopecks: +4.8,
    sentiment: 'cny_up',
    summary: 'Опасения вторичных санкций США вынуждают китайские банки ужесточать комплаенс, удерживая положительную премию в вечном фьючерсе CNYRUBF над спотом.',
    verified: true,
    updatedAt: formattedInitialTimestamp,
  },
  {
    id: 'n4',
    time: '11:15',
    headline: 'Рост спроса импортеров на юани для контрактации потребительских товаров и автотехники',
    source: 'ФТС России',
    category: 'import_demand',
    impactKopecks: +3.2,
    sentiment: 'cny_up',
    summary: 'Активный импорт компонентов и подготовка к сезону стимулируют регулярные корпоративные заявки на покупку юаня на основной сессии.',
    verified: true,
    updatedAt: formattedInitialTimestamp,
  },
];

// Calculate factor decomposition and net price impact in kopecks
export function calculateFactorImpacts(
  params: SimulationParams,
  currentPrice: number = 12.083
): {
  factors: FactorDetail[];
  netImpactKopecks: number;
  recommendation: 'BUY' | 'SELL' | 'NEUTRAL';
  confidencePct: number;
  target1h: number;
  target4h: number;
  targetClose: number;
  rangeLow: number;
  rangeHigh: number;
} {
  const uralsPrice = params.oilBrent - params.oilUralsDiscount;
  const benchmarkUrals = 117.67 - 12.2; // 105.47
  const uralsDelta = uralsPrice - benchmarkUrals;
  let taxMultiplier = 1.0;
  if (params.taxPeriodPhase === 'tax_peak') taxMultiplier = 1.6;
  if (params.taxPeriodPhase === 'post_tax') taxMultiplier = 0.6;

  // 1. Oil impact (elasticity from real Urals benchmark)
  const oilImpactKopecks = Number((-uralsDelta * 0.35 * taxMultiplier - 2.6).toFixed(1));

  // 2. Geopolitics & Sanctions (benchmark score 64)
  const sanctionsDelta = (params.sanctionsScore - 64) / 10;
  const sanctionsImpactKopecks = Number((sanctionsDelta * 1.35 + 2.4).toFixed(1));

  // 3. Fiscal Rule (benchmark 8.4 bln/day)
  const fiscalDelta = params.fiscalVolumeBln - 8.4;
  const fiscalImpactKopecks = Number((-fiscalDelta * 0.55 - 3.2).toFixed(1));

  // 4. Import Demand & Liquidity (benchmark score 68, rusfar 9.4%)
  const importDelta = (params.importDemandScore - 68) / 10;
  const rusfarPremium = (params.rusfarCnyRate - 9.4) * 0.35;
  const importImpactKopecks = Number((importDelta * 1.1 + rusfarPremium + 2.2).toFixed(1));

  const netImpactKopecks = Number(
    (oilImpactKopecks + sanctionsImpactKopecks + fiscalImpactKopecks + importImpactKopecks).toFixed(1)
  );

  const basePrice = currentPrice;
  const netShiftRubles = netImpactKopecks / 100; // convert kopecks to rubles

  const target1h = Number((basePrice + netShiftRubles * 0.35).toFixed(3));
  const target4h = Number((basePrice + netShiftRubles * 0.75).toFixed(3));
  const targetClose = Number((basePrice + netShiftRubles * 1.0).toFixed(3));

  const volatilityBuffer = 0.045;
  const rangeLow = Number((Math.min(basePrice, targetClose) - volatilityBuffer).toFixed(3));
  const rangeHigh = Number((Math.max(basePrice, targetClose) + volatilityBuffer).toFixed(3));

  let recommendation: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  if (netImpactKopecks >= 2.0) recommendation = 'BUY';
  else if (netImpactKopecks <= -2.0) recommendation = 'SELL';

  const confidencePct = Math.min(92, Math.max(55, Math.round(65 + Math.abs(netImpactKopecks) * 2.8)));

  const factors: FactorDetail[] = [
    {
      id: 'oil',
      name: 'Цены на нефть и выручка экспортеров',
      shortTitle: 'Нефть & Экспорт',
      currentValueDisplay: `Brent $${params.oilBrent.toFixed(1)} / Urals $${uralsPrice.toFixed(1)}`,
      subMetric: `Рублевая бочка: ${(uralsPrice * basePrice * 7.1).toFixed(0)} ₽ | Налоги: ${
        params.taxPeriodPhase === 'tax_peak' ? 'Пик НДПИ (макс. продажи)' : 'Стандартный режим'
      }`,
      sentiment: oilImpactKopecks <= 0 ? 'bullish_rub' : 'bearish_rub',
      impactKopecks: oilImpactKopecks,
      weightPct: 30,
      description:
        'Экспортная выручка и обязательные продажи валюты крупнейшими нефтегазовыми компаниями РФ под налог на добычу полезных ископаемых (НДПИ).',
      transmissionChannel:
        'Рост котировок Urals увеличивает объем валютной выручки и предложение юаней на Мосбирже через 2-3 недели (лаг оплаты). В пик налогов влияние мгновенное.',
      historicalCorrelation: '-0.74 с курсом CNY/RUB',
    },
    {
      id: 'geopolitics',
      name: 'Геополитика и санкционные ожидания',
      shortTitle: 'Геополитика & Санкции',
      currentValueDisplay: `Индекс риска: ${params.sanctionsScore}/100`,
      subMetric: 'Комплаенс банков КНР: Жесткий | Спред OTC/Биржа: +1.5%',
      sentiment: sanctionsImpactKopecks >= 0 ? 'bearish_rub' : 'bullish_rub',
      impactKopecks: sanctionsImpactKopecks,
      weightPct: 25,
      description:
        'Риски вторичных санкций на платежные цепочки, филиал ВТБ в Шанхае и региональные финансовые институты Китая, задержки клиринга.',
      transmissionChannel:
        'Ужесточение комплаенса китайских банков тормозит расчеты, стимулируя бизнес скупать биржевой юань с премией для страхования обязательств.',
      historicalCorrelation: '+0.68 с волатильностью CNYRUBF',
    },
    {
      id: 'fiscal_rule',
      name: 'Бюджетное правило (Минфин & Банк России)',
      shortTitle: 'Бюджетное правило',
      currentValueDisplay: `Продажи: ${params.fiscalVolumeBln.toFixed(1)} млрд ₽/день`,
      subMetric: 'Стерилизация: 10:00-19:00 МСК равномерно | Операции ФНБ: Активны',
      sentiment: fiscalImpactKopecks <= 0 ? 'bullish_rub' : 'bearish_rub',
      impactKopecks: fiscalImpactKopecks,
      weightPct: 25,
      description:
        'Регулярные ежедневные валютные интервенции ЦБ РФ в счет зеркалирования расходов ФНБ и покупок/продаж валюты Минфином РФ.',
      transmissionChannel:
        'Постоянная продажа юаней ЦБ в биржевой стакан с 10:00 до 19:00 создает стабильную подушку предложения валюты, гася спекулятивные всплески.',
      historicalCorrelation: '-0.81 со спредом закрытия сессии',
    },
    {
      id: 'import_demand',
      name: 'Импортный спрос и валютная ликвидность',
      shortTitle: 'Импорт & Ликвидность',
      currentValueDisplay: `Спрос: ${params.importDemandScore}/100 | RUSFAR: ${params.rusfarCnyRate.toFixed(1)}%`,
      subMetric: 'Потребность в юанях: Автопром, ТНП, Оборудование',
      sentiment: importImpactKopecks >= 0 ? 'bearish_rub' : 'bullish_rub',
      impactKopecks: importImpactKopecks,
      weightPct: 20,
      description:
        'Потребность российского бизнеса в юанях для оплаты китайского импорта, дефицит свободной ликвидности в юанях в банковском секторе РФ.',
      transmissionChannel:
        'Импортеры выставляют крупные рыночные и лимитные ордера на покупку юаней на пиках торговой активности (11:00-12:30 и 14:30-16:00).',
      historicalCorrelation: '+0.62 с дневным объемом торгов',
    },
  ];

  return {
    factors,
    netImpactKopecks,
    recommendation,
    confidencePct,
    target1h,
    target4h,
    targetClose,
    rangeLow,
    rangeHigh,
  };
}

// Generate intraday candle series with forecast projection (integrating real candles from T-Bank API)
export function generateIntradayCandles(
  params: SimulationParams,
  currentPrice: number = 12.083,
  realCandles?: CandleData[],
  timeframeMinutes: number = 15
): { historical: CandleData[]; forecast: CandleData[]; all: CandleData[] } {
  const result = calculateFactorImpacts(params, currentPrice);
  const netDeltaRubles = result.netImpactKopecks / 100;

  let historical: CandleData[] = [];

  if (realCandles && realCandles.length > 0) {
    // Take real candles from T-Bank API
    historical = realCandles.map((c) => ({
      ...c,
      isForecast: false,
    }));
  } else {
    // Fallback realistic historical candles
    const startHour = 9;
    const currentHour = 14;
    const currentMinute = 30;
    const totalHistoricalSteps = Math.floor(((currentHour - startHour) * 60 + currentMinute) / timeframeMinutes);
    const dateToday = new Date();

    let runningVolume = 0;
    let runningVwapSum = 0;
    const baseP = currentPrice + 0.05;

    for (let i = 0; i <= totalHistoricalSteps; i++) {
      const totalMinutesFromStart = i * timeframeMinutes;
      const h = startHour + Math.floor(totalMinutesFromStart / 60);
      const m = totalMinutesFromStart % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      const drift = -0.05 * (i / totalHistoricalSteps) + Math.sin(i * 0.7) * 0.008;
      const close = Number((baseP + drift).toFixed(3));
      const open = Number((close - (Math.random() - 0.5) * 0.008).toFixed(3));
      const high = Number((Math.max(open, close) + 0.004).toFixed(3));
      const low = Number((Math.min(open, close) - 0.004).toFixed(3));
      const volume = Math.round(18000 + Math.random() * 12000);

      runningVolume += volume;
      runningVwapSum += ((high + low + close) / 3) * volume;
      const vwap = Number((runningVwapSum / runningVolume).toFixed(3));

      historical.push({
        time: timeStr,
        timestamp: dateToday.setHours(h, m, 0, 0),
        open,
        high,
        low,
        close,
        volume,
        vwap,
        isForecast: false,
      });
    }
  }

  // Ensure last historical candle closes at currentPrice
  const lastHistorical = historical[historical.length - 1] || {
    close: currentPrice,
    vwap: currentPrice,
    time: '14:30',
    timestamp: Date.now(),
  };
  const lastPrice = lastHistorical.close;
  const lastTimeMs = lastHistorical.timestamp || Date.now();

  // Determine forecast configuration adapted to the selected timeframe
  let forecastSteps = 14;
  let coneScale = 0.012;
  let driftPower = 0.85;
  let driftMultiplier = 0.85;

  if (timeframeMinutes === 5) {
    forecastSteps = 12; // 12 * 5m = 60 minutes forward
    coneScale = 0.006;
    driftPower = 0.95;
    driftMultiplier = 0.55;
  } else if (timeframeMinutes === 60) {
    forecastSteps = 8; // 8 * 1h = 8 hours forward
    coneScale = 0.022;
    driftPower = 0.75;
    driftMultiplier = 1.25;
  } else {
    // 15 minutes
    forecastSteps = 14; // 14 * 15m = 3.5 hours forward
    coneScale = 0.012;
    driftPower = 0.85;
    driftMultiplier = 0.85;
  }

  const forecastCandles: CandleData[] = [];
  let prevClose = lastPrice;

  for (let j = 1; j <= forecastSteps; j++) {
    const candleMs = lastTimeMs + j * timeframeMinutes * 60 * 1000;
    const d = new Date(candleMs);
    const timeStr = d.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    });

    const progress = j / forecastSteps;
    const expectedDrift = netDeltaRubles * driftMultiplier * Math.pow(progress, driftPower);
    const randomWiggle = Math.sin(j * 0.75) * (timeframeMinutes === 5 ? 0.002 : timeframeMinutes === 60 ? 0.007 : 0.004) * (1 - progress * 0.25);
    const predictedBase = Number((lastPrice + expectedDrift + randomWiggle).toFixed(3));

    const coneStdDev = coneScale * Math.sqrt(j);
    const predictedHigh = Number((predictedBase + coneStdDev + (netDeltaRubles > 0 ? 0.008 * progress : 0.003)).toFixed(3));
    const predictedLow = Number((predictedBase - coneStdDev - (netDeltaRubles < 0 ? 0.008 * progress : 0.003)).toFixed(3));

    const open = prevClose;
    const close = predictedBase;
    const high = Math.max(open, close, predictedHigh - 0.002);
    const low = Math.min(open, close, predictedLow + 0.002);
    prevClose = close;

    forecastCandles.push({
      time: timeStr,
      timestamp: candleMs,
      open: Number(open.toFixed(3)),
      high: Number(high.toFixed(3)),
      low: Number(low.toFixed(3)),
      close: Number(close.toFixed(3)),
      volume: Math.round(
        (timeframeMinutes === 5 ? 4500 : timeframeMinutes === 60 ? 42000 : 14000) *
          (0.85 + Math.random() * 0.3)
      ),
      vwap: Number(((lastHistorical.vwap + close) / 2).toFixed(3)),
      isForecast: true,
      predictedBase,
      predictedHigh,
      predictedLow,
    });
  }

  return {
    historical,
    forecast: forecastCandles,
    all: [...historical, ...forecastCandles],
  };
}

export interface TimeframeTargetInfo {
  label1: string;
  timeLabel1: string;
  price1: number;
  label2: string;
  timeLabel2: string;
  price2: number;
  label3: string;
  timeLabel3: string;
  price3: number;
  modeLabel: string;
  modeDescription: string;
}

export function getTimeframeTargetLevels(
  currentPrice: number,
  netImpactKopecks: number,
  timeframe: '5M' | '15M' | '1H'
): TimeframeTargetInfo {
  const netRubles = netImpactKopecks / 100;
  if (timeframe === '5M') {
    return {
      label1: 'Т+15м (Микро-цель)',
      timeLabel1: 'Т+15м',
      price1: Number((currentPrice + netRubles * 0.22).toFixed(3)),
      label2: 'Т+30м (Скальпинг)',
      timeLabel2: 'Т+30м',
      price2: Number((currentPrice + netRubles * 0.42).toFixed(3)),
      label3: 'Т+1ч (Импульс)',
      timeLabel3: 'Т+1ч',
      price3: Number((currentPrice + netRubles * 0.65).toFixed(3)),
      modeLabel: 'Скальпинг / 5-минутный импульс',
      modeDescription: 'Анализ микроструктуры стакана и краткосрочного потока ордеров',
    };
  } else if (timeframe === '1H') {
    return {
      label1: 'Т+2ч (Дневной тренд)',
      timeLabel1: 'Т+2ч',
      price1: Number((currentPrice + netRubles * 0.55).toFixed(3)),
      label2: 'Закрытие (19:00 МСК)',
      timeLabel2: '19:00',
      price2: Number((currentPrice + netRubles * 1.0).toFixed(3)),
      label3: 'Клиринг (23:50 МСК)',
      timeLabel3: '23:50',
      price3: Number((currentPrice + netRubles * 1.25).toFixed(3)),
      modeLabel: 'Сессионный макро-тренд (1 час)',
      modeDescription: 'Оценка влияния бюджетного правила ЦБ и суточной экспортной выручки',
    };
  } else {
    // 15M standard
    return {
      label1: 'Т+1ч (Ближняя цель)',
      timeLabel1: 'Т+1ч',
      price1: Number((currentPrice + netRubles * 0.35).toFixed(3)),
      label2: 'Т+4ч (Свинг сессии)',
      timeLabel2: 'Т+4ч',
      price2: Number((currentPrice + netRubles * 0.75).toFixed(3)),
      label3: 'Закрытие (19:00 МСК)',
      timeLabel3: '19:00',
      price3: Number((currentPrice + netRubles * 1.0).toFixed(3)),
      modeLabel: 'Внутридневной свинг (15 минут)',
      modeDescription: 'Баланс операций Минфина, экспортеров и импортного спроса',
    };
  }
}

// Generate realistic live order book DOM for CNYRUBF
export function generateOrderBook(currentPrice: number): { bids: OrderBookRow[]; asks: OrderBookRow[]; ratio: number } {
  const step = 0.001;
  const bids: OrderBookRow[] = [];
  const asks: OrderBookRow[] = [];

  let bidTotal = 0;
  let askTotal = 0;

  for (let i = 1; i <= 10; i++) {
    const askPrice = Number((currentPrice + i * step).toFixed(3));
    const askVol = Math.round(450 + Math.random() * 1800 + (i === 4 ? 3200 : 0));
    askTotal += askVol;
    asks.push({
      price: askPrice,
      volume: askVol,
      total: askTotal,
      type: 'ask',
    });

    const bidPrice = Number((currentPrice - i * step).toFixed(3));
    const bidVol = Math.round(520 + Math.random() * 2100 + (i === 3 ? 4100 : 0));
    bidTotal += bidVol;
    bids.push({
      price: bidPrice,
      volume: bidVol,
      total: bidTotal,
      type: 'bid',
    });
  }

  const ratio = Number(((bidTotal / (bidTotal + askTotal)) * 100).toFixed(1));
  return { bids, asks: asks.reverse(), ratio };
}

// Fallback AI heuristic forecast when offline or pending
export function generateOfflineAiForecast(params: SimulationParams, currentPrice: number = 12.083): AiForecastResult {
  const impact = calculateFactorImpacts(params, currentPrice);
  const net = impact.netImpactKopecks;

  const rec = impact.recommendation;
  const label =
    rec === 'BUY'
      ? 'Покупка CNY (Ослабление рубля)'
      : rec === 'SELL'
      ? 'Продажа CNY (Укрепление рубля)'
      : 'Вне рынка / Диапазон';

  const entry = `${(currentPrice - 0.008).toFixed(3)} - ${(currentPrice + 0.004).toFixed(3)}`;
  const tp1 = (currentPrice + (net >= 0 ? 0.045 : -0.045)).toFixed(3);
  const tp2 = (currentPrice + (net >= 0 ? 0.085 : -0.085)).toFixed(3);
  const sl = (currentPrice + (net >= 0 ? -0.025 : 0.025)).toFixed(3);

  const now = new Date();
  const formattedTimestamp = now.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return {
    recommendation: rec,
    recommendationLabel: label,
    confidencePct: impact.confidencePct,
    target1h: impact.target1h,
    target4h: impact.target4h,
    targetClose: impact.targetClose,
    rangeLow: impact.rangeLow,
    rangeHigh: impact.rangeHigh,
    netImpactKopecks: net,
    playbook: {
      entry,
      takeProfit1: tp1,
      takeProfit2: tp2,
      stopLoss: sl,
      riskRewardRatio: '1 : 2.4',
      timeHorizon: '2-4 часа (внутри сессии)',
    },
    factorBreakdown: impact.factors.map((f) => ({
      name: f.name,
      impactKopecks: f.impactKopecks,
      sentiment: f.sentiment,
      commentary: `${f.shortTitle}: расчетное отклонение ${f.impactKopecks > 0 ? '+' : ''}${f.impactKopecks} коп. ${
        f.sentiment === 'bullish_rub' ? 'Поддержка курса рубля.' : 'Давление в сторону роста юаня.'
      }`,
    })),
    macroAnalysis: `Внутридневной баланс на Мосбирже формируется под воздействием регулярных валютных интервенций Банка России (${params.fiscalVolumeBln} млрд ₽/день) и повышенного импортного спроса (${params.importDemandScore}/100). При текущей рублевой цене Urals ~${Math.round((params.oilBrent - params.oilUralsDiscount) * currentPrice * 7.1)} ₽ экспортеры продолжают равномерную конверсию выручки, однако напряженность в расчетах с региональными банками Китая удерживает премию за биржевой юань.`,
    riskTriggers: [
      `Внезапный сброс нефти Brent ниже $${(params.oilBrent - 4).toFixed(1)} сломает поддержку рубля.`,
      'Публикация внеплановых разъяснений Банка России по юаневому свопу RUSFAR.',
      'Резкое расширение спреда между спотовым курсом ЦБ и вечным фьючерсом CNYRUBF свыше 25 коп.',
    ],
    updatedAt: formattedTimestamp,
  };
}
