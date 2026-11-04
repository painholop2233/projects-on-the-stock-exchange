import {
  CandleData,
  FactorDetail,
  MarketTickerState,
  NewsItem,
  OrderBookRow,
  SimulationParams,
  AiForecastResult,
  PublicBenchmarkSources,
  OilFutureContract,
} from '../types/market';

export const DEFAULT_OIL_FUTURES: OilFutureContract[] = [
  {
    ticker: 'BRZ6',
    code: 'BR-12.26',
    name: 'Нефть Brent (Декабрь 2026)',
    expirationDate: '2026-12-02',
    expirationFormatted: '02.12.2026',
    uid: '5f72f0f4-c326-46e6-a2d3-1632c74c76df',
    isNearest: true,
    price: 104.71,
    currency: 'USD',
    spreadToSpot: 0,
  },
  {
    ticker: 'BRF7',
    code: 'BR-1.27',
    name: 'Нефть Brent (Январь 2027)',
    expirationDate: '2027-01-05',
    expirationFormatted: '05.01.2027',
    uid: 'dba04c3e-5ce2-406c-9ba9-64e226492611',
    isNearest: false,
    price: 101.87,
    currency: 'USD',
    spreadToSpot: -2.84,
  },
  {
    ticker: 'BRG7',
    code: 'BR-2.27',
    name: 'Нефть Brent (Февраль 2027)',
    expirationDate: '2027-02-02',
    expirationFormatted: '02.02.2027',
    uid: '72e252ce-f910-48a4-90f7-cad6aecc182c',
    isNearest: false,
    price: 99.24,
    currency: 'USD',
    spreadToSpot: -5.47,
  },
  {
    ticker: 'BRH7',
    code: 'BR-3.27',
    name: 'Нефть Brent (Март 2027)',
    expirationDate: '2027-03-02',
    expirationFormatted: '02.03.2027',
    uid: '97e06205-2cb6-42ff-ac42-35868954a742',
    isNearest: false,
    price: 97.15,
    currency: 'USD',
    spreadToSpot: -7.56,
  },
  {
    ticker: 'BRJ7',
    code: 'BR-4.27',
    name: 'Нефть Brent (Апрель 2027)',
    expirationDate: '2027-04-02',
    expirationFormatted: '02.04.2027',
    uid: 'e9728ca5-5813-4f4f-9322-01b065031040',
    isNearest: false,
    price: 95.85,
    currency: 'USD',
    spreadToSpot: -8.86,
  },
  {
    ticker: 'BRK7',
    code: 'BR-5.27',
    name: 'Нефть Brent (Май 2027)',
    expirationDate: '2027-05-04',
    expirationFormatted: '04.05.2027',
    uid: '77dd002e-9cac-4b64-84f7-8b3b3f4d1995',
    isNearest: false,
    price: 95.42,
    currency: 'USD',
    spreadToSpot: -9.29,
  },
];

export const DEFAULT_PUBLIC_BENCHMARKS: PublicBenchmarkSources = {
  brent: {
    title: 'Нефть Brent (фьючерс BRZ6 MOEX)',
    source: 'Т-Инвестиции API (tinkoff.ru/invest)',
    value: 104.71,
    unit: '$/баррель',
    asOf: '03.11.2026, 20:49:59 МСК',
  },
  uralsDiscount: {
    title: 'Дисконт сорта Urals к Brent',
    source: 'Минфин России (minfin.gov.ru)',
    value: 12.2,
    unit: '$/баррель',
    asOf: '03.11.2026, 18:00 МСК',
  },
  fiscalRule: {
    title: 'Бюджетное правило (нетто-продажи ЦБ)',
    source: 'Банк России (cbr.ru)',
    value: 8.4,
    unit: 'млрд ₽/день',
    asOf: '03.11.2026, 10:00 МСК',
  },
  rusfarCny: {
    title: 'Ставка денежного рынка RUSFAR CNY',
    source: 'Московская Биржа (moex.com)',
    value: 9.4,
    unit: '% годовых',
    asOf: '03.11.2026, 12:57:00 МСК',
  },
  sanctionsScore: {
    title: 'Индекс санкционного давления на расчеты',
    source: 'Мониторинг расчетов ЦБ РФ / АРБ / Ведомости',
    value: 64,
    unit: '/ 100',
    asOf: '03.11.2026, 11:30 МСК',
  },
  importDemand: {
    title: 'Индекс спроса импортеров на юани',
    source: 'ФТС России & ЦМАКП (Оценка динамики импорта)',
    value: 68,
    unit: '/ 100',
    asOf: '03.11.2026, 09:00 МСК',
  },
  taxPeriod: {
    title: 'Календарь налогового периода (НДПИ / ЕНП)',
    source: 'ФНС России (nalog.gov.ru)',
    status: 'Пик выплат ЕНП / НДПИ (25-28 числа)',
    value: 'Активен',
    asOf: '03.11.2026',
  },
};

export const BASELINE_SIMULATION: SimulationParams = {
  oilBrent: 104.71,
  oilUralsDiscount: 12.2, // Urals = 92.51
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
  brentPrice: 104.71,
  oilFutures: DEFAULT_OIL_FUTURES,
  high: 12.115,
  low: 12.062,
  vwap: 12.085,
  openInterest: 1542100,
  volumeTotal: 412800, // контрактов
  fundingRate: 0.095, // % за день
  fundingAnnualized: 34.7, // % годовых
  fundingSpreadKopecks: 1.15,
  spotPrice: 12.0715,
  nextFundingTime: '19:00 МСК',
  sessionState: 'MAIN_SESSION',
  lastUpdated: formattedInitialTimestamp,
  apiSource: 'T-Bank Invest API (FUTCNYRUBF00)',
};

const formattedInitialDate = now.toLocaleDateString('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: 'n1',
    time: '14:25',
    date: formattedInitialDate,
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
    date: formattedInitialDate,
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
    date: formattedInitialDate,
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
    date: formattedInitialDate,
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
  let taxMultiplier = 1.0;
  if (params.taxPeriodPhase === 'tax_peak') taxMultiplier = 1.6;
  if (params.taxPeriodPhase === 'post_tax') taxMultiplier = 0.6;

  // 1. Oil impact (Brent baseline $104.71, Urals baseline $92.51)
  // At $104.71 Brent, high oil prices and Urals well above the Russian budget benchmark of $60/bbl
  // generate robust FX export revenue, supporting the ruble (pushing CNY down by -2.8 kopecks base).
  const brentDelta = params.oilBrent - 104.71;
  const oilImpactKopecks = Number((-2.8 - brentDelta * 0.22 * taxMultiplier).toFixed(1));

  // 2. Geopolitics & Sanctions (benchmark score 64)
  // Compliance frictions and cross-border payment risks create a positive premium on perpetual CNY.
  const sanctionsDelta = (params.sanctionsScore - 64) / 10;
  const sanctionsImpactKopecks = Number((sanctionsDelta * 1.35 + 2.4).toFixed(1));

  // 3. Fiscal Rule (benchmark 8.4 bln/day)
  // Daily regular FX interventions by CBR/Minfin provide reliable supply, strengthening the ruble.
  const fiscalDelta = params.fiscalVolumeBln - 8.4;
  const fiscalImpactKopecks = Number((-3.2 - fiscalDelta * 0.45).toFixed(1));

  // 4. Import Demand & Liquidity (benchmark score 68, rusfar 9.4%)
  // Corporate import purchasing and higher RUSFAR CNY interest rates raise demand for CNY.
  const importDelta = (params.importDemandScore - 68) / 10;
  const rusfarPremium = (params.rusfarCnyRate - 9.4) * 0.35;
  const importImpactKopecks = Number((2.2 + importDelta * 1.1 + rusfarPremium).toFixed(1));

  const netImpactKopecks = Number(
    (oilImpactKopecks + sanctionsImpactKopecks + fiscalImpactKopecks + importImpactKopecks).toFixed(1)
  );

  const basePrice = currentPrice;
  const netShiftRubles = netImpactKopecks / 100; // convert kopecks to rubles

  // Strictly order targets according to the net vector
  const target1h = Number((basePrice + netShiftRubles * 0.40).toFixed(3));
  const target4h = Number((basePrice + netShiftRubles * 0.75).toFixed(3));
  const targetClose = Number((basePrice + netShiftRubles * 1.00).toFixed(3));

  const volatilityBuffer = 0.045;
  const rangeLow = Number((Math.min(basePrice, targetClose) - volatilityBuffer).toFixed(3));
  const rangeHigh = Number((Math.max(basePrice, targetClose) + volatilityBuffer).toFixed(3));

  let recommendation: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  if (netImpactKopecks >= 1.5) recommendation = 'BUY';
  else if (netImpactKopecks <= -1.5) recommendation = 'SELL';

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
        'Высокая цена Urals (>4,950 ₽ за бочку) увеличивает валютный приток экспортеров, создавая навес предложения юаня на споте и фьючерсах.',
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

// Helper to construct a strictly mathematically coherent Tactical Playbook
export function buildPlaybook(
  recommendation: 'BUY' | 'SELL' | 'NEUTRAL',
  currentPrice: number,
  target1h: number,
  targetClose: number,
  rangeLow: number,
  rangeHigh: number
): {
  entry: string;
  takeProfit1: string;
  takeProfit2: string;
  stopLoss: string;
  riskRewardRatio: string;
  timeHorizon: string;
  directionLabel: string;
} {
  if (recommendation === 'BUY') {
    // LONG strategy: Buy on minor pullbacks, TP above entry, SL below support
    const entryMin = Number((currentPrice - 0.005).toFixed(3));
    const entryMax = Number((currentPrice + 0.002).toFixed(3));
    const tp1 = Number(Math.max(entryMax + 0.018, target1h).toFixed(3));
    const tp2 = Number(Math.max(tp1 + 0.022, targetClose).toFixed(3));
    const sl = Number(Math.min(entryMin - 0.015, rangeLow - 0.003).toFixed(3));
    const risk = Math.max(0.008, Number((entryMin - sl).toFixed(3)));
    const avgReward = ((tp1 - entryMax) + (tp2 - entryMax)) / 2;
    const rr = (avgReward / risk).toFixed(1);

    return {
      entry: `${entryMin.toFixed(3)} - ${entryMax.toFixed(3)}`,
      takeProfit1: tp1.toFixed(3),
      takeProfit2: tp2.toFixed(3),
      stopLoss: sl.toFixed(3),
      riskRewardRatio: `1 : ${rr}`,
      timeHorizon: '2-4 часа (внутри сессии)',
      directionLabel: 'LONG (Покупка фьючерса)',
    };
  } else if (recommendation === 'SELL') {
    // SHORT strategy: Sell on minor rallies, TP below entry, SL above resistance
    const entryMin = Number((currentPrice - 0.002).toFixed(3));
    const entryMax = Number((currentPrice + 0.005).toFixed(3));
    const tp1 = Number(Math.min(entryMin - 0.018, target1h).toFixed(3));
    const tp2 = Number(Math.min(tp1 - 0.022, targetClose).toFixed(3));
    const sl = Number(Math.max(entryMax + 0.015, rangeHigh + 0.003).toFixed(3));
    const risk = Math.max(0.008, Number((sl - entryMax).toFixed(3)));
    const avgReward = ((entryMin - tp1) + (entryMin - tp2)) / 2;
    const rr = (avgReward / risk).toFixed(1);

    return {
      entry: `${entryMin.toFixed(3)} - ${entryMax.toFixed(3)}`,
      takeProfit1: tp1.toFixed(3),
      takeProfit2: tp2.toFixed(3),
      stopLoss: sl.toFixed(3),
      riskRewardRatio: `1 : ${rr}`,
      timeHorizon: '2-4 часа (внутри сессии)',
      directionLabel: 'SHORT (Продажа фьючерса)',
    };
  } else {
    // RANGE strategy: trade edges
    const entryMin = Number((rangeLow + 0.005).toFixed(3));
    const entryMax = Number((rangeHigh - 0.005).toFixed(3));
    const tp1 = Number((rangeHigh - 0.002).toFixed(3));
    const tp2 = Number((rangeHigh + 0.008).toFixed(3));
    const sl = Number((rangeLow - 0.015).toFixed(3));

    return {
      entry: `${entryMin.toFixed(3)} - ${entryMax.toFixed(3)}`,
      takeProfit1: tp1.toFixed(3),
      takeProfit2: tp2.toFixed(3),
      stopLoss: sl.toFixed(3),
      riskRewardRatio: '1 : 2.0',
      timeHorizon: 'Торговля в канале',
      directionLabel: 'RANGE (Работа от границ)',
    };
  }
}

// Helper to construct macro analysis and risk triggers matching the forecast direction
export function buildMacroAnalysisAndRisks(
  params: SimulationParams,
  currentPrice: number,
  recommendation: 'BUY' | 'SELL' | 'NEUTRAL',
  netImpactKopecks: number,
  targetClose: number,
  rangeLow: number,
  rangeHigh: number
): { macroAnalysis: string; riskTriggers: string[] } {
  const uralsPrice = (params.oilBrent - params.oilUralsDiscount).toFixed(1);
  const rubleBarrel = Math.round((params.oilBrent - params.oilUralsDiscount) * currentPrice * 7.1);

  if (recommendation === 'BUY') {
    return {
      macroAnalysis: `Вектор давления направлен в сторону роста курса юаня (+${netImpactKopecks} коп.). Ключевым драйвером выступают санкционные трения в трансграничных расчетах с банками КНР (индекс риска ${params.sanctionsScore}/100) и сохраняющийся корпоративный спрос импортеров на юани (${params.importDemandScore}/100). Несмотря на регулярные валютные интервенции Банка России (${params.fiscalVolumeBln} млрд ₽/день), дефицит биржевого юаня формирует премию вечного контракта над спотом с расчетной целью закрытия ${targetClose.toFixed(3)} ₽.`,
      riskTriggers: [
        `Резкий взлет нефти Brent выше $${(params.oilBrent + 5).toFixed(1)}/bbl усилит валютную выручку экспортеров и сломает восходящий импульс.`,
        `Внеплановое увеличение ежедневных продаж юаней Банком России свыше 14.0 млрд ₽/день.`,
        `Пробой вниз ключевой поддержки ${rangeLow.toFixed(3)} ₽ с фиксацией длинных позиций.`,
      ],
    };
  } else if (recommendation === 'SELL') {
    return {
      macroAnalysis: `Баланс сил складывается в пользу укрепления рубля и коррекции фьючерса (${netImpactKopecks} коп.). Поддержку национальной валюте оказывает высокая рублевая бочка Urals (~${rubleBarrel} ₽ при Brent $${params.oilBrent.toFixed(1)}) и обязательные продажи юаней экспортерами под налог на добычу полезных ископаемых (НДПИ). Совокупное предложение валюты от экспортеров и ЦБ РФ (${params.fiscalVolumeBln} млрд ₽/день) полностью перекрывает импортные заявки, направляя котировки к целевому ориентиру ${targetClose.toFixed(3)} ₽.`,
      riskTriggers: [
        `Падение котировок Brent ниже $${(params.oilBrent - 6).toFixed(1)}/bbl или расширение дисконта Urals свыше $16/bbl.`,
        `Введение новых блокирующих санкций против банков-корреспондентов или ухудшение трансграничного клиринга.`,
        `Пробой вверх локального сопротивления ${rangeHigh.toFixed(3)} ₽ на фоне всплеска заявок импортеров.`,
      ],
    };
  } else {
    return {
      macroAnalysis: `На рынке сохраняется динамический паритет сил (нетто-сдвиг ${netImpactKopecks > 0 ? '+' : ''}${netImpactKopecks} коп.). Ежедневные валютные интервенции Банка России (${params.fiscalVolumeBln} млрд ₽/день) и экспортная выручка (Brent $${params.oilBrent.toFixed(1)}) компенсируются корпоративными закупками импортеров (${params.importDemandScore}/100). Котировки CNYRUBF консолидируются в коридоре ${rangeLow.toFixed(3)} – ${rangeHigh.toFixed(3)} ₽ без выраженного направленного импульса.`,
      riskTriggers: [
        `Выход цены из консолидационного диапазона ${rangeLow.toFixed(3)} – ${rangeHigh.toFixed(3)} ₽ на объеме свыше 15,000 контрактов.`,
        `Скачок ставки юаневого денежного рынка RUSFAR CNY выше 12.0% годовых.`,
        `Внезапное изменение параметров бюджетного правила Минфина на предстоящий месяц.`,
      ],
    };
  }
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

  const playbook = buildPlaybook(
    rec,
    currentPrice,
    impact.target1h,
    impact.targetClose,
    impact.rangeLow,
    impact.rangeHigh
  );

  const { macroAnalysis, riskTriggers } = buildMacroAnalysisAndRisks(
    params,
    currentPrice,
    rec,
    net,
    impact.targetClose,
    impact.rangeLow,
    impact.rangeHigh
  );

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
    playbook,
    factorBreakdown: impact.factors.map((f) => ({
      name: f.name,
      impactKopecks: f.impactKopecks,
      sentiment: f.sentiment,
      commentary: `${f.shortTitle}: расчетное отклонение ${f.impactKopecks > 0 ? '+' : ''}${f.impactKopecks} коп. ${
        f.sentiment === 'bullish_rub' ? 'Поддержка курса рубля.' : 'Давление в сторону роста юаня.'
      }`,
    })),
    macroAnalysis,
    riskTriggers,
    updatedAt: formattedTimestamp,
  };
}
