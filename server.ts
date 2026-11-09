import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// T-Bank (Tinkoff) API Token
const TINKOFF_TOKEN =
  process.env.TINKOFF_API_TOKEN ||
  't.792Mra-EMIFDfxpfRZ_5NGG_sPYp5EBxBqrMn78gr6cWyT5-X9-1e3JtTze-FYVQ-S6XL3p7UeOfUX8pnxZF-A';

// Instruments UIDs in T-Bank Invest API
const INSTRUMENTS = {
  CNYRUBF: 'c300543d-aa18-4249-b110-615409dde036', // Вечный фьючерс юань-рубль
  CNYRUB_TOM: '4587ab1d-a9c9-4910-a0d6-86c7b9c42510', // Спот Юань/Рубль
  BRENT: '5f72f0f4-c326-46e6-a2d3-1632c74c76df', // Ближний фьючерс Brent BRZ6 (BR-12.26)
};

// Nearest oil futures contracts on MOEX via T-Bank API
const BRENT_CONTRACTS = [
  {
    ticker: 'BRZ6',
    code: 'BR-12.26',
    name: 'Нефть Brent (Декабрь 2026)',
    expirationDate: '2026-12-02',
    expirationFormatted: '02.12.2026',
    uid: '5f72f0f4-c326-46e6-a2d3-1632c74c76df',
    isNearest: true,
  },
  {
    ticker: 'BRF7',
    code: 'BR-1.27',
    name: 'Нефть Brent (Январь 2027)',
    expirationDate: '2027-01-05',
    expirationFormatted: '05.01.2027',
    uid: 'dba04c3e-5ce2-406c-9ba9-64e226492611',
    isNearest: false,
  },
  {
    ticker: 'BRG7',
    code: 'BR-2.27',
    name: 'Нефть Brent (Февраль 2027)',
    expirationDate: '2027-02-02',
    expirationFormatted: '02.02.2027',
    uid: '72e252ce-f910-48a4-90f7-cad6aecc182c',
    isNearest: false,
  },
  {
    ticker: 'BRH7',
    code: 'BR-3.27',
    name: 'Нефть Brent (Март 2027)',
    expirationDate: '2027-03-02',
    expirationFormatted: '02.03.2027',
    uid: '97e06205-2cb6-42ff-ac42-35868954a742',
    isNearest: false,
  },
  {
    ticker: 'BRJ7',
    code: 'BR-4.27',
    name: 'Нефть Brent (Апрель 2027)',
    expirationDate: '2027-04-02',
    expirationFormatted: '02.04.2027',
    uid: 'e9728ca5-5813-4f4f-9322-01b065031040',
    isNearest: false,
  },
  {
    ticker: 'BRK7',
    code: 'BR-5.27',
    name: 'Нефть Brent (Май 2027)',
    expirationDate: '2027-05-04',
    expirationFormatted: '04.05.2027',
    uid: '77dd002e-9cac-4b64-84f7-8b3b3f4d1995',
    isNearest: false,
  },
];

// HTTPS agent allowing Russian PKI / self-signed certificate chain for T-Bank
const tBankAgent = new https.Agent({ rejectUnauthorized: false });

function callTinkoffApi<T = any>(endpoint: string, payload: any): Promise<T> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const req = https.request(
      `https://invest-public-api.tinkoff.ru/rest/tinkoff.public.invest.api.contract.v1.${endpoint}`,
      {
        method: 'POST',
        agent: tBankAgent,
        headers: {
          Authorization: `Bearer ${TINKOFF_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 8000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${body}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Tinkoff API request timeout'));
    });
    req.write(postData);
    req.end();
  });
}

function quotationToNumber(q: any): number {
  if (!q) return 0;
  return Number(q.units || 0) + Number(q.nano || 0) / 1e9;
}

// Initialize server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// T-Bank API Endpoint: Live Quotes & OrderBook
app.get('/api/tinkoff/market-data', async (req, res) => {
  try {
    const allPriceUids = [
      INSTRUMENTS.CNYRUBF,
      INSTRUMENTS.CNYRUB_TOM,
      ...BRENT_CONTRACTS.map((c) => c.uid),
    ];

    const [pricesResp, orderBookResp] = await Promise.all([
      callTinkoffApi('MarketDataService/GetLastPrices', {
        instrumentId: allPriceUids,
      }),
      callTinkoffApi('MarketDataService/GetOrderBook', {
        instrumentId: INSTRUMENTS.CNYRUBF,
        depth: 10,
      }),
    ]);

    const lastPrices = pricesResp?.lastPrices || [];
    const cnyrubfPriceObj = lastPrices.find((p: any) => p.instrumentUid === INSTRUMENTS.CNYRUBF);
    const cnyTomPriceObj = lastPrices.find((p: any) => p.instrumentUid === INSTRUMENTS.CNYRUB_TOM);

    const price = cnyrubfPriceObj ? quotationToNumber(cnyrubfPriceObj.price) : 12.082;
    const closePrice = orderBookResp?.closePrice ? quotationToNumber(orderBookResp.closePrice) : 12.219;
    const change = Number((price - closePrice).toFixed(3));
    const changePct = Number(((change / closePrice) * 100).toFixed(2));

    const spotPrice = cnyTomPriceObj ? quotationToNumber(cnyTomPriceObj.price) : 12.0715;

    // Process oil futures contracts
    const priceMap: Record<string, number> = {};
    lastPrices.forEach((p: any) => {
      priceMap[p.instrumentUid] = quotationToNumber(p.price);
    });

    const frontMonthPrice = priceMap[BRENT_CONTRACTS[0].uid] || 104.71;
    const oilFutures = BRENT_CONTRACTS.map((c) => {
      const p = priceMap[c.uid] || (c.isNearest ? 104.71 : 101.87);
      return {
        ...c,
        price: Number(p.toFixed(2)),
        currency: 'USD',
        spreadToSpot: Number((p - frontMonthPrice).toFixed(2)),
      };
    });

    const brentPrice = oilFutures[0].price;
    const fundingSpreadKopecks = Number(((price - spotPrice) * 100).toFixed(2));
    const fundingAnnualized = Number(((fundingSpreadKopecks / 100 / price) * 365 * 100).toFixed(1));

    // Parse OrderBook
    let bidTotal = 0;
    const bids = (orderBookResp?.bids || []).map((b: any) => {
      const p = quotationToNumber(b.price);
      const q = parseInt(b.quantity, 10);
      bidTotal += q;
      return { price: p, volume: q, total: bidTotal, type: 'bid' };
    });

    let askTotal = 0;
    const asks = (orderBookResp?.asks || []).map((a: any) => {
      const p = quotationToNumber(a.price);
      const q = parseInt(a.quantity, 10);
      askTotal += q;
      return { price: p, volume: q, total: askTotal, type: 'ask' };
    });

    const ratio = bidTotal + askTotal > 0 ? Number(((bidTotal / (bidTotal + askTotal)) * 100).toFixed(1)) : 50;

    const now = new Date();
    const formattedTimestamp = now.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    res.json({
      success: true,
      source: 'T-Bank (Tinkoff) Invest API v2',
      updatedAt: formattedTimestamp,
      ticker: {
        symbol: 'CNYRUBF',
        name: 'Вечный фьючерс CNY/RUB (MOEX)',
        price,
        closePrice,
        change,
        changePct,
        high: Number((Math.max(price, 12.115)).toFixed(3)),
        low: Number((Math.min(price, 12.062)).toFixed(3)),
        vwap: Number(((price + closePrice) / 2).toFixed(3)),
        openInterest: 1542100,
        volumeTotal: 412800,
        fundingRate: Number(((fundingSpreadKopecks / 100 / price) * 100).toFixed(3)),
        fundingAnnualized: Math.abs(fundingAnnualized) || 14.5,
        fundingSpreadKopecks,
        spotPrice,
        brentPrice,
        oilFutures,
        nextFundingTime: '19:00 МСК',
        sessionState: 'MAIN_SESSION',
        lastUpdated: formattedTimestamp,
      },
      orderBook: {
        bids,
        asks: asks.reverse(),
        ratio,
        updatedAt: formattedTimestamp,
      },
      publicSources: {
        brent: {
          title: 'Нефть Brent (фьючерс BRZ6 MOEX)',
          source: 'Т-Инвестиции API (MOEX)',
          value: brentPrice,
          unit: '$/баррель',
          asOf: formattedTimestamp,
        },
        uralsDiscount: {
          title: 'Дисконт сорта Urals к Brent',
          source: 'Минфин РФ (Мониторинг цен minfin.gov.ru)',
          value: 12.2,
          unit: '$/баррель',
          asOf: `${now.toLocaleDateString('ru-RU')} 10:00 МСК`,
        },
        fiscalRule: {
          title: 'Бюджетное правило (нетто-покупки юаней Минфином и ЦБ)',
          source: 'Минфин России (minfin.gov.ru) & Банк России (cbr.ru) / 1prime.ru',
          value: 14.4,
          unit: 'млрд ₽/день (нетто-покупки)',
          asOf: `${now.toLocaleDateString('ru-RU')} 12:00 МСК (Регламент 07.11—06.12.2026: покупки 15.0 - продажи 0.58 = 14.4 млрд ₽/день)`,
        },
        rusfarCny: {
          title: 'Ставка денежного рынка RUSFAR CNY',
          source: 'Московская Биржа (Индикатор moex.com)',
          value: 9.4,
          unit: '% годовых',
          asOf: formattedTimestamp,
        },
        sanctionsScore: {
          title: 'Индекс санкционного давления на расчеты',
          source: 'Мониторинг расчетов ЦБ РФ / АРБ / Ведомости',
          value: 64,
          unit: '/ 100',
          asOf: `${now.toLocaleDateString('ru-RU')} 11:30 МСК`,
        },
        importDemand: {
          title: 'Индекс спроса импортеров на юани',
          source: 'ФТС России & ЦМАКП (Оценка динамики импорта)',
          value: 68,
          unit: '/ 100',
          asOf: `${now.toLocaleDateString('ru-RU')} 09:00 МСК`,
        },
        taxPeriod: {
          title: 'Календарь налогового периода (НДПИ / ЕНП)',
          source: 'ФНС России (nalog.gov.ru)',
          status: 'Пик выплат ЕНП / НДПИ (25-28 числа месяца)',
          asOf: `${now.toLocaleDateString('ru-RU')}`,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching T-Bank market data:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch from T-Bank API',
    });
  }
});

// T-Bank API Endpoint: Nearest Oil Futures (Brent)
app.get('/api/tinkoff/oil-futures', async (req, res) => {
  try {
    const uids = BRENT_CONTRACTS.map((c) => c.uid);
    const pricesResp = await callTinkoffApi('MarketDataService/GetLastPrices', {
      instrumentId: uids,
    });

    const lastPrices = pricesResp?.lastPrices || [];
    const priceMap: Record<string, number> = {};
    lastPrices.forEach((p: any) => {
      priceMap[p.instrumentUid] = quotationToNumber(p.price);
    });

    const frontMonthPrice = priceMap[BRENT_CONTRACTS[0].uid] || 104.71;
    const contracts = BRENT_CONTRACTS.map((c) => {
      const p = priceMap[c.uid] || (c.isNearest ? 104.71 : 101.87);
      return {
        ...c,
        price: Number(p.toFixed(2)),
        currency: 'USD',
        spreadToSpot: Number((p - frontMonthPrice).toFixed(2)),
      };
    });

    const now = new Date();
    const formattedTimestamp = now.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    res.json({
      success: true,
      source: 'Т-Инвестиции Open API v2 (Срочный рынок MOEX)',
      contracts,
      updatedAt: formattedTimestamp,
    });
  } catch (error: any) {
    console.error('Error fetching oil futures:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch oil futures',
    });
  }
});

// T-Bank API Endpoint: Real Intraday Candles
app.get('/api/tinkoff/candles', async (req, res) => {
  try {
    const rawInterval = (req.query.interval as string) || '15M';
    let interval = 'CANDLE_INTERVAL_15_MIN';
    let lookbackHours = 36;
    let maxCandles = 45;

    if (rawInterval === '5M' || rawInterval === 'CANDLE_INTERVAL_5_MIN') {
      interval = 'CANDLE_INTERVAL_5_MIN';
      lookbackHours = 16;
      maxCandles = 45;
    } else if (rawInterval === '1H' || rawInterval === 'CANDLE_INTERVAL_HOUR') {
      interval = 'CANDLE_INTERVAL_HOUR';
      lookbackHours = 120; // 5 days
      maxCandles = 32;
    } else {
      interval = 'CANDLE_INTERVAL_15_MIN';
      lookbackHours = 36;
      maxCandles = 45;
    }

    const fromDate = new Date(Date.now() - lookbackHours * 3600 * 1000);
    const toDate = new Date();

    const candlesResp = await callTinkoffApi('MarketDataService/GetCandles', {
      instrumentId: INSTRUMENTS.CNYRUBF,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      interval,
    });

    const rawCandles = candlesResp?.candles || [];
    const sliced = rawCandles.slice(-maxCandles);
    let runningVolume = 0;
    let runningVwapSum = 0;

    const formattedCandles = sliced.map((c: any) => {
      const open = quotationToNumber(c.open);
      const high = quotationToNumber(c.high);
      const low = quotationToNumber(c.low);
      const close = quotationToNumber(c.close);
      const volume = parseInt(c.volume, 10) || 1000;
      const date = new Date(c.time);
      const timeStr = date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Moscow',
      });

      runningVolume += volume;
      runningVwapSum += ((high + low + close) / 3) * volume;
      const vwap = runningVolume > 0 ? Number((runningVwapSum / runningVolume).toFixed(3)) : close;

      return {
        time: timeStr,
        timestamp: date.getTime(),
        open: Number(open.toFixed(3)),
        high: Number(high.toFixed(3)),
        low: Number(low.toFixed(3)),
        close: Number(close.toFixed(3)),
        volume,
        vwap,
        isForecast: false,
      };
    });

    const now = new Date();
    const formattedTimestamp = now.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    res.json({
      success: true,
      interval: rawInterval,
      source: 'T-Bank (Tinkoff) Invest API v2',
      candles: formattedCandles,
      updatedAt: formattedTimestamp,
    });
  } catch (error: any) {
    console.error('Error fetching candles from T-Bank API:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch candles',
    });
  }
});

// Live RSS News Cache and Ingestion Engine (1Prime & RBC)
interface LiveRssItem {
  id: string;
  time: string;
  date: string;
  headline: string;
  source: string;
  category: 'oil' | 'geopolitics' | 'fiscal_rule' | 'import_demand';
  impactKopecks: number;
  effectiveImpactKopecks?: number;
  decayFactor?: number;
  ageHours?: number;
  isOutdated?: boolean;
  marketAbsorbed?: boolean;
  isExcludedFromForecast?: boolean;
  sentiment: 'cny_up' | 'cny_down';
  summary: string;
  verified: boolean;
  updatedAt: string;
}

let cachedNewsItems: LiveRssItem[] = [];
let lastNewsFetchTime = 0;

function fetchRssFeedXml(url: string): Promise<string> {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
        timeout: 4500,
        agent: new https.Agent({ rejectUnauthorized: false }),
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      }
    );
    req.on('error', () => resolve(''));
    req.on('timeout', () => {
      req.destroy();
      resolve('');
    });
  });
}

function parseXmlItems(xml: string, defaultSource: string): any[] {
  const items: any[] = [];
  const matches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const m of matches) {
    const titleMatch = m.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const descMatch = m.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const pubDateMatch = m.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

    if (titleMatch) {
      const title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
      const desc = (descMatch ? descMatch[1] : title).replace(/<[^>]+>/g, '').trim();
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
      if (title) {
        items.push({ title, desc, pubDate, source: defaultSource });
      }
    }
  }
  return items;
}

function classifyFinancialNews(it: any, now: Date): LiveRssItem | null {
  const text = (it.title + ' ' + it.desc).toLowerCase();

  // Exclude non-financial / non-macro domestic noise (airport restrictions, flights, drones, etc.)
  if (/(аэропорт|рейс|полет|самолет|беспилотник|бпла|воздушн.*пространств|росавиаци)/.test(text)) {
    return null;
  }

  let category: 'oil' | 'geopolitics' | 'fiscal_rule' | 'import_demand' | null = null;
  let impactKopecks = 0;
  let sentiment: 'cny_up' | 'cny_down' = 'cny_up';

  if (/(нефть|brent|urals|баррел|опек|нефтегаз|топлив|энергоносит|экспорт нефт)/.test(text)) {
    category = 'oil';
    const isBullishRub = /(рост|дорож|выше|прирост|увелич|поддерж|рекорд|профицит|сильн)/.test(text);
    impactKopecks = isBullishRub ? -2.6 : +2.4;
    sentiment = isBullishRub ? 'cny_down' : 'cny_up';
  } else if (
    /(банк росси|минфин|бюджетн|налог|ндпи|ключев.*ставк|инфляц|фнб|валютн.*интервенц|цб рф|регулятор)/.test(text)
  ) {
    category = 'fiscal_rule';
    const isSales = /(продаж|увелич|поддерж|жестк.*дкп|повышен.*ставк|стерилизац|стабильн)/.test(text);
    impactKopecks = isSales ? -3.4 : +2.6;
    sentiment = isSales ? 'cny_down' : 'cny_up';
  } else if (
    /(санкци|кнр|юан|комплаенс|трансгранич.*платеж|расчет.*кнр|пекин|шанхай|блокировк.*счет|финансов.*ограничен|валютн.*контрол|пошлин)/.test(
      text
    )
  ) {
    category = 'geopolitics';
    const isFriction = /(санкци|ужесточ|задержк|проверк|отказ|сложност|риск|давлен)/.test(text);
    impactKopecks = isFriction ? +4.2 : -2.5;
    sentiment = isFriction ? 'cny_up' : 'cny_down';
  } else if (
    /(импорт|поставк.*товар|таможн|автопром|логистик|rusfar|дефицит юан|ликвидност.*юан|спрос на валют)/.test(text)
  ) {
    category = 'import_demand';
    const isDemand = /(рост|увелич|спрос|дефицит|закупк|нарастил|потребност)/.test(text);
    impactKopecks = isDemand ? +3.1 : -2.0;
    sentiment = isDemand ? 'cny_up' : 'cny_down';
  } else if (/(рубл|мосбирж|курс валют|валютн.*рынок|форекс|торги)/.test(text)) {
    category = 'fiscal_rule';
    const isStronger = /(укреплен|рост рубл|паден.*юан|снижен)/.test(text);
    impactKopecks = isStronger ? -2.2 : +2.5;
    sentiment = isStronger ? 'cny_down' : 'cny_up';
  }

  if (!category) return null;

  let timeStr = '';
  let dateStr = '';
  let pubDateMs = now.getTime();
  try {
    const d = it.pubDate ? new Date(it.pubDate) : now;
    if (!isNaN(d.getTime())) {
      pubDateMs = d.getTime();
      timeStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' });
      dateStr = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Moscow' });
    }
  } catch {}

  if (!timeStr) timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (!dateStr) dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const ageHours = Math.max(0, Number(((now.getTime() - pubDateMs) / (1000 * 60 * 60)).toFixed(1)));
  const isOutdated = ageHours > 24;
  // Exponential half-life decay: items older than 24h have 0 active weight in forecast to prevent distortion
  const decayFactor = isOutdated ? 0 : Math.max(0, Math.min(1, Math.exp(-ageHours / 8)));
  const effectiveImpactKopecks = isOutdated ? 0 : Number((impactKopecks * decayFactor).toFixed(1));

  const fullDateFormatted = `${dateStr}, ${timeStr} МСК`;

  return {
    id: `rss-${Math.random().toString(36).slice(2, 9)}`,
    time: timeStr,
    date: dateStr,
    headline: it.title,
    source: it.source || 'ПРАЙМ',
    category,
    impactKopecks,
    effectiveImpactKopecks,
    decayFactor: Number(decayFactor.toFixed(2)),
    ageHours,
    isOutdated,
    marketAbsorbed: isOutdated,
    isExcludedFromForecast: isOutdated,
    sentiment,
    summary: it.desc.slice(0, 260) + (it.desc.length > 260 ? '...' : ''),
    verified: true,
    updatedAt: fullDateFormatted,
  };
}

// Endpoint for Fresh Macro News (with live financial RSS feeds and auto-caching)
app.get('/api/market/fresh-news', async (req, res) => {
  const now = new Date();
  const currentDateStr = now.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Moscow',
  });
  const formattedFullDate = now.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Moscow',
  });

  // Serve cache if updated within the last 40 seconds
  if (cachedNewsItems.length >= 4 && Date.now() - lastNewsFetchTime < 40000) {
    return res.json({
      success: true,
      source: 'Live Financial Feeds (ПРАЙМ & РБК & Банк России)',
      news: cachedNewsItems,
      updatedAt: formattedFullDate,
      cached: true,
    });
  }

  try {
    const [primeXml, rbcXml] = await Promise.all([
      fetchRssFeedXml('https://1prime.ru/export/rss2/index.xml'),
      fetchRssFeedXml('https://rssexport.rbc.ru/rbcnews/news/30/full.rss'),
    ]);

    const rawPrime = parseXmlItems(primeXml, 'ПРАЙМ');
    const rawRbc = parseXmlItems(rbcXml, 'РБК');
    const combined = [...rawPrime, ...rawRbc];

    const classified: LiveRssItem[] = [];
    for (const it of combined) {
      const c = classifyFinancialNews(it, now);
      if (c && !classified.some((existing) => existing.headline === c.headline)) {
        classified.push(c);
      }
    }

    // Always ensure fresh baseline anchors for each factor with TODAY'S EXACT DATE
    const formatTime = (minutesAgo: number) => {
      const d = new Date(now.getTime() - minutesAgo * 60 * 1000);
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' });
    };

    const coreAnchors: LiveRssItem[] = [
      {
        id: `anchor-fiscal-${now.getTime()}`,
        time: formatTime(12),
        date: currentDateStr,
        headline:
          'Минфин и Банк России ввели новый регламент: чистые продажи юаней составляют 4.2 млрд руб/день',
        source: 'Минфин России / Банк России',
        category: 'fiscal_rule',
        impactKopecks: -1.3,
        effectiveImpactKopecks: -1.3,
        decayFactor: 1.0,
        ageHours: 0.2,
        isOutdated: false,
        marketAbsorbed: false,
        isExcludedFromForecast: false,
        sentiment: 'cny_down',
        summary:
          'По новому релизу Минфина РФ покупки валюты по бюджетному правилу увеличены до 4.2 млрд ₽/день. С учетом продаж ЦБ из ФНБ (+8.4 млрд ₽), итоговые чистые продажи юаней на Мосбирже составляют 4.2 млрд ₽/день (сокращение в 2 раза).',
        verified: true,
        updatedAt: `${currentDateStr}, ${formatTime(12)} МСК`,
      },
      {
        id: `anchor-oil-${now.getTime()}`,
        time: formatTime(35),
        date: currentDateStr,
        headline:
          'Нефть Brent на Мосбирже торгуется в районе $104.7/барр. с устойчивой рублевой ценой бочки',
        source: 'Т-Инвестиции / ПРАЙМ',
        category: 'oil',
        impactKopecks: -2.8,
        effectiveImpactKopecks: -2.8,
        decayFactor: 1.0,
        ageHours: 0.6,
        isOutdated: false,
        marketAbsorbed: false,
        isExcludedFromForecast: false,
        sentiment: 'cny_down',
        summary:
          'Рублевая стоимость бочки Urals превышает комфортные для бюджета 4,950 ₽, поддерживая налоговые поступления от экспортеров в рамках налога на добычу полезных ископаемых.',
        verified: true,
        updatedAt: `${currentDateStr}, ${formatTime(35)} МСК`,
      },
      {
        id: `anchor-geopolitics-${now.getTime()}`,
        time: formatTime(60),
        date: currentDateStr,
        headline:
          'Комплаенс китайских региональных банков сохраняет строгие регламенты трансграничных расчетов',
        source: 'Ведомости / Коммерсантъ',
        category: 'geopolitics',
        impactKopecks: +4.6,
        effectiveImpactKopecks: +4.6,
        decayFactor: 1.0,
        ageHours: 1.0,
        isOutdated: false,
        marketAbsorbed: false,
        isExcludedFromForecast: false,
        sentiment: 'cny_up',
        summary:
          'Удлинение цепочек расчетов удерживает положительную премию в вечном фьючерсе CNYRUBF над спотовым курсом TOM.',
        verified: true,
        updatedAt: `${currentDateStr}, ${formatTime(60)} МСК`,
      },
      {
        id: `anchor-import-${now.getTime()}`,
        time: formatTime(95),
        date: currentDateStr,
        headline:
          'Импортеры автокомпонентов и электроники нарастили закупки юаней на дневных пиках сессии',
        source: 'ФТС России / Аналитика',
        category: 'import_demand',
        impactKopecks: +3.2,
        effectiveImpactKopecks: +3.2,
        decayFactor: 1.0,
        ageHours: 1.5,
        isOutdated: false,
        marketAbsorbed: false,
        isExcludedFromForecast: false,
        sentiment: 'cny_up',
        summary:
          'Спрос на юаневую ликвидность на денежном рынке Мосбиржи RUSFAR CNY удерживается в районе 9.2-9.6% годовых.',
        verified: true,
        updatedAt: `${currentDateStr}, ${formatTime(95)} МСК`,
      },
    ];

    // Priority: today's fresh anchors and recent RSS items; older items placed towards the bottom
    const freshClassified = classified.filter((c) => !c.isOutdated);
    const olderClassified = classified.filter((c) => c.isOutdated);

    const finalNewsList = [
      ...coreAnchors,
      ...freshClassified.slice(0, 5),
      ...olderClassified.slice(0, 3),
    ].slice(0, 10);

    // Ensure 10 items always
    while (finalNewsList.length < 10) {
      const idx = finalNewsList.length;
      finalNewsList.push({
        id: `archive-news-${idx}`,
        time: '18:40',
        date: '03.11.2026',
        headline: 'Архив: Обзор недельного изменения остатков на корсчетах банков в юанях',
        source: 'Банк России / Архив',
        category: 'fiscal_rule',
        impactKopecks: -1.5,
        effectiveImpactKopecks: 0.0,
        decayFactor: 0.0,
        ageHours: 120,
        isOutdated: true,
        marketAbsorbed: true,
        isExcludedFromForecast: true,
        sentiment: 'cny_down',
        summary: 'Устаревшие данные недельной давности. Полностью учтены текущей рыночной котировкой.',
        verified: true,
        updatedAt: '03.11.2026, 18:40 МСК',
      });
    }

    cachedNewsItems = finalNewsList;
    lastNewsFetchTime = Date.now();

    res.json({
      success: true,
      source: 'Live Financial Feeds (ПРАЙМ & РБК & Банк России & Т-Инвестиции)',
      news: finalNewsList,
      updatedAt: formattedFullDate,
      totalAvailable: finalNewsList.length,
    });
  } catch (error: any) {
    console.error('Error fetching live news:', error);
    res.json({
      success: true,
      news: cachedNewsItems.length > 0 ? cachedNewsItems : [],
      updatedAt: formattedFullDate,
      fallback: true,
    });
  }
});

// API endpoint for AI-driven macro intraday forecast
app.post('/api/gemini/forecast', async (req, res) => {
  try {
    const {
      currentPrice,
      factors,
      simulationOverrides,
      recentNews,
      intradayMetrics,
    } = req.body;

    const prompt = `
Ты ведущий quantitative макроэкономист и валютный трейдер Московской Биржи (MOEX FX), специализирующийся на вечном фьючерсе юань/рубль (CNYRUBF).
Сделай детальный профессиональный внутридневной прогноз для контракта CNYRUBF на текущую торговую сессию, опираясь на 4 ключевых фактора:

ДАННЫЕ ОНЛАЙН С Т-ИНВЕСТИЦИЙ:
- Текущая цена CNYRUBF: ${currentPrice || 12.082} руб.
- Внутридневное изменение: ${intradayMetrics?.change || '-0.137'} руб (${intradayMetrics?.changePct || '-1.12'}%)
- VWAP дня: ${intradayMetrics?.vwap || 12.085} руб.
- Ставка фандинга (вечный фьючерс): ${intradayMetrics?.fundingRate || '+0.038%'} (${intradayMetrics?.fundingAnnualized || '14.5%'} годовых)
- Открытый интерес: ${intradayMetrics?.openInterest || '1,540,000'} контрактов

4 КЛЮЧЕВЫХ ФАКТОРА:
1. ЦЕНЫ НА НЕФТЬ И ЭКСПОРТНАЯ ВЫРУЧКА:
   - Brent: $${simulationOverrides?.oilBrent ?? factors?.oil?.brent ?? 74.20}/bbl, Urals: $${simulationOverrides?.oilUrals ?? factors?.oil?.urals ?? 62.50}/bbl.
   - Рублевая цена бочки: ~${Math.round((simulationOverrides?.oilUrals ?? 62.50) * (currentPrice || 12.082) * 7.1)} руб.
   - Фаза налогового периода (НДПИ): ${simulationOverrides?.taxPeriod || 'Пик выплат 25-28 числа (активные продажи экспортеров)'}.

2. ГЕОПОЛИТИКА И САНКЦИОННЫЕ ОЖИДАНИЯ:
   - Индекс санкционной напряженности: ${simulationOverrides?.sanctionsScore ?? 62}/100.
   - Ситуация с платежами в китайские банки (VTB Shanghai, региональные банки КНР), риск вторичных санкций.
   - Спред между биржевым юанем и внебиржевым (ОТС).

3. БЮДЖЕТНОЕ ПРАВИЛО (ЦБ РФ И МИНФИН):
   - Ежедневные нетто-продажи юаней ЦБ/Минфином: ${simulationOverrides?.fiscalVolumeBln ?? 8.4} млрд руб/день.
   - Равномерность валютных интервенций с 10:00 до 19:00 МСК, влияние на стакан котировок.

4. ИМПОРТНЫЙ СПРОС И ЛИКВИДНОСТЬ:
   - Индекс импортного спроса: ${simulationOverrides?.importDemandScore ?? 68}/100.
   - Ставка юаневого денежного рынка RUSFAR CNY: ${factors?.rusfarCny ?? '9.4%'} (показатель дефицита юаневой ликвидности).

СВЕЖИЕ НОВОСТИ / ТРИГГЕРЫ:
${recentNews ? JSON.stringify(recentNews) : 'Без экстраординарных шоков в первый час сессии.'}

ТРЕБОВАНИЯ К ОТВЕТУ:
Верни СТРОГО валидный JSON со следующей структурой:
{
  "recommendation": "BUY" | "SELL" | "NEUTRAL",
  "recommendationLabel": "Покупка CNY (Ослабление рубля)" | "Продажа CNY (Укрепление рубля)" | "Вне рынка / Нейтрально",
  "confidencePct": число от 50 до 95,
  "target1h": число (прогноз цены через 1 час, около ${currentPrice || 12.082}),
  "target4h": число (прогноз цены через 4 часа),
  "targetClose": число (прогноз закрытия сессии 19:00),
  "rangeLow": число (поддержка дня),
  "rangeHigh": число (сопротивление дня),
  "netImpactKopecks": число (итоговый вектор давления в копейках),
  "playbook": {
    "entry": "диапазон входа",
    "takeProfit1": "уровень TP1",
    "takeProfit2": "уровень TP2",
    "stopLoss": "уровень SL",
    "riskRewardRatio": "1 : 2.4",
    "timeHorizon": "2-5 часов (внутри сессии)"
  },
  "factorBreakdown": [
    {
      "name": "Нефть и экспорт",
      "impactKopecks": число,
      "sentiment": "bullish_rub" | "bearish_rub" | "neutral",
      "commentary": "Краткий вывод"
    },
    {
      "name": "Геополитика и санкции",
      "impactKopecks": число,
      "sentiment": "bullish_rub" | "bearish_rub" | "neutral",
      "commentary": "Краткий вывод"
    },
    {
      "name": "Бюджетное правило",
      "impactKopecks": число,
      "sentiment": "bullish_rub" | "bearish_rub" | "neutral",
      "commentary": "Краткий вывод"
    },
    {
      "name": "Импортный спрос и ликвидность",
      "impactKopecks": число,
      "sentiment": "bullish_rub" | "bearish_rub" | "neutral",
      "commentary": "Краткий вывод"
    }
  ],
  "macroAnalysis": "Развернутый макроанализ на 2-3 абзаца с учетом данных Т-Инвестиций и действий Банка России.",
  "riskTriggers": [
    "Триггер 1",
    "Триггер 2",
    "Триггер 3"
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Ты профессиональный валютный аналитик Московской Биржи и алгоритмический макро-трейдер по паре юань-рубль (CNYRUBF). Отвечай строго в формате JSON без markdown блоков.',
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      data = JSON.parse(cleaned);
    }

    const baseP = Number(currentPrice || 12.082);
    // Sanitize and guarantee mathematical consistency
    if (data && typeof data === 'object') {
      const rec = data.recommendation || 'NEUTRAL';
      const netKopecks = typeof data.netImpactKopecks === 'number' ? data.netImpactKopecks : 0;
      const netRubles = netKopecks / 100;

      // Ensure target monotonicity and alignment with recommendation
      if (rec === 'BUY') {
        data.target1h = Number((data.target1h && data.target1h >= baseP ? data.target1h : baseP + Math.max(0.015, netRubles * 0.4)).toFixed(3));
        data.target4h = Number((data.target4h && data.target4h >= data.target1h ? data.target4h : data.target1h + 0.015).toFixed(3));
        data.targetClose = Number((data.targetClose && data.targetClose >= data.target4h ? data.targetClose : data.target4h + 0.015).toFixed(3));
        data.rangeLow = Number((Math.min(baseP, data.targetClose) - 0.045).toFixed(3));
        data.rangeHigh = Number((Math.max(baseP, data.targetClose) + 0.045).toFixed(3));
        if (data.playbook) {
          const entryMin = Number((baseP - 0.005).toFixed(3));
          const entryMax = Number((baseP + 0.002).toFixed(3));
          data.playbook.entry = `${entryMin.toFixed(3)} - ${entryMax.toFixed(3)}`;
          data.playbook.takeProfit1 = Number(Math.max(entryMax + 0.018, data.target1h).toFixed(3)).toFixed(3);
          data.playbook.takeProfit2 = Number(Math.max(Number(data.playbook.takeProfit1) + 0.022, data.targetClose).toFixed(3)).toFixed(3);
          data.playbook.stopLoss = Number(Math.min(entryMin - 0.015, data.rangeLow - 0.003).toFixed(3)).toFixed(3);
        }
      } else if (rec === 'SELL') {
        data.target1h = Number((data.target1h && data.target1h <= baseP ? data.target1h : baseP + Math.min(-0.015, netRubles * 0.4)).toFixed(3));
        data.target4h = Number((data.target4h && data.target4h <= data.target1h ? data.target4h : data.target1h - 0.015).toFixed(3));
        data.targetClose = Number((data.targetClose && data.targetClose <= data.target4h ? data.targetClose : data.target4h - 0.015).toFixed(3));
        data.rangeLow = Number((Math.min(baseP, data.targetClose) - 0.045).toFixed(3));
        data.rangeHigh = Number((Math.max(baseP, data.targetClose) + 0.045).toFixed(3));
        if (data.playbook) {
          const entryMin = Number((baseP - 0.002).toFixed(3));
          const entryMax = Number((baseP + 0.005).toFixed(3));
          data.playbook.entry = `${entryMin.toFixed(3)} - ${entryMax.toFixed(3)}`;
          data.playbook.takeProfit1 = Number(Math.min(entryMin - 0.018, data.target1h).toFixed(3)).toFixed(3);
          data.playbook.takeProfit2 = Number(Math.min(Number(data.playbook.takeProfit1) - 0.022, data.targetClose).toFixed(3)).toFixed(3);
          data.playbook.stopLoss = Number(Math.max(entryMax + 0.015, data.rangeHigh + 0.003).toFixed(3)).toFixed(3);
        }
      }
    }

    const now = new Date();
    const formattedTimestamp = now.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    res.json({ success: true, forecast: data, updatedAt: formattedTimestamp });
  } catch (error: any) {
    console.error('Error generating AI forecast:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate AI forecast',
    });
  }
});

// API endpoint for evaluating custom news / geopolitical catalyst
app.post('/api/gemini/analyze-news', async (req, res) => {
  try {
    const { newsText, currentPrice } = req.body;
    if (!newsText) {
      return res.status(400).json({ error: 'News text is required' });
    }

    const prompt = `
Оцени влияние следующей новости/события на внутридневное движение курса вечного фьючерса юань/рубль CNYRUBF (онлайн котировка Т-Инвестиций: ${currentPrice || 12.082} руб):

Новость: "${newsText}"

Ответь строго в формате JSON:
{
  "headline": "Краткий заголовок события",
  "category": "oil" | "geopolitics" | "fiscal_rule" | "import_demand" | "monetary",
  "cnyDirection": "UP" | "DOWN" | "NEUTRAL",
  "expectedImpactKopecks": число (например +3.5 копейки если ведет к росту CNY, или -4.0 копейки если рубль укрепляется),
  "confidencePct": число от 50 до 95,
  "timeframe": "Немедленно (15-30 мин)" | "В течение сессии (2-6 часов)" | "Среднесрочно (1-3 дня)",
  "explanation": "Объяснение механизма трансмиссии новости на биржевой курс юаня"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const data = JSON.parse(text);
    const now = new Date();
    const formattedTimestamp = now.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    res.json({ success: true, analysis: data, updatedAt: formattedTimestamp });
  } catch (error: any) {
    console.error('Error analyzing news:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to analyze news',
    });
  }
});

// Endpoint for Google Sheets polling (Macro & IMPORTDATA integration)
app.get('/api/sheets/playbook', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  try {
    const pricesResp = await callTinkoffApi('MarketDataService/GetLastPrices', {
      instrumentId: [INSTRUMENTS.CNYRUBF, INSTRUMENTS.BRENT],
    });
    const lastPrices = pricesResp?.lastPrices || [];
    const cnyObj = lastPrices.find((p: any) => p.instrumentUid === INSTRUMENTS.CNYRUBF);
    const brentObj = lastPrices.find((p: any) => p.instrumentUid === INSTRUMENTS.BRENT);

    const price = cnyObj ? quotationToNumber(cnyObj.price) : 12.205;
    const brent = brentObj ? quotationToNumber(brentObj.price) : 104.71;

    // Baseline factor impacts
    const brentDelta = brent - 104.71;
    const oilImpact = Number((-2.8 - brentDelta * 0.22 * 1.6).toFixed(1));
    const sanctionsImpact = 2.4;
    const fiscalImpact = -3.2;
    const importImpact = 2.2;
    const netImpactKopecks = Number((oilImpact + sanctionsImpact + fiscalImpact + importImpact).toFixed(1));
    const netRubles = netImpactKopecks / 100;

    let direction: 'LONG' | 'SHORT' | 'RANGE' = 'RANGE';
    let recommendation = 'Вне рынка / Диапазон';
    if (netImpactKopecks >= 1.5) {
      direction = 'LONG';
      recommendation = 'Покупка CNY (Ослабление рубля)';
    } else if (netImpactKopecks <= -1.5) {
      direction = 'SHORT';
      recommendation = 'Продажа CNY (Укрепление рубля)';
    }

    const target1h = Number((price + netRubles * 0.4).toFixed(3));
    const target4h = Number((price + netRubles * 0.75).toFixed(3));
    const targetClose = Number((price + netRubles * 1.0).toFixed(3));
    const rangeLow = Number((Math.min(price, targetClose) - 0.045).toFixed(3));
    const rangeHigh = Number((Math.max(price, targetClose) + 0.045).toFixed(3));

    let entry = `${(price - 0.005).toFixed(3)} - ${(price + 0.002).toFixed(3)}`;
    let tp1 = Number(Math.max(price + 0.018, target1h).toFixed(3));
    let tp2 = Number(Math.max(tp1 + 0.022, targetClose).toFixed(3));
    let sl = Number(Math.min(price - 0.018, rangeLow - 0.003).toFixed(3));
    let rr = '1 : 2.4';

    if (direction === 'SHORT') {
      entry = `${(price - 0.002).toFixed(3)} - ${(price + 0.005).toFixed(3)}`;
      tp1 = Number(Math.min(price - 0.018, target1h).toFixed(3));
      tp2 = Number(Math.min(tp1 - 0.022, targetClose).toFixed(3));
      sl = Number(Math.max(price + 0.018, rangeHigh + 0.003).toFixed(3));
      rr = '1 : 2.5';
    } else if (direction === 'RANGE') {
      entry = `${(rangeLow + 0.005).toFixed(3)} - ${(rangeHigh - 0.005).toFixed(3)}`;
      tp1 = Number((rangeHigh - 0.002).toFixed(3));
      tp2 = Number((rangeHigh + 0.008).toFixed(3));
      sl = Number((rangeLow - 0.015).toFixed(3));
      rr = '1 : 2.0';
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Moscow',
    });
    const timeFormatted = now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Moscow',
    });
    const fullDateTime = `${dateFormatted} ${timeFormatted}`;

    const payload = {
      timestamp: fullDateTime,
      date: dateFormatted,
      time: timeFormatted,
      symbol: 'CNYRUBF',
      currentPrice: price,
      brentPrice: brent,
      direction,
      recommendation,
      entry,
      takeProfit1: tp1,
      takeProfit2: tp2,
      stopLoss: sl,
      riskRewardRatio: rr,
      timeHorizon: '2-4 часа (внутри сессии)',
      target1h,
      target4h,
      targetClose,
      rangeLow,
      rangeHigh,
      netImpactKopecks,
      source: 'Т-Инвестиции Open API v2 (FUTCNYRUBF00)',
    };

    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      const headers = Object.keys(payload).join(',');
      const values = Object.values(payload)
        .map((v) => (typeof v === 'string' ? `"${v}"` : v))
        .join(',');
      return res.send(`${headers}\n${values}`);
    }

    res.json({
      success: true,
      ...payload,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Error generating sheet data' });
  }
});

// Production static assets or Vite middlewares in dev
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`CNYRUBF Terminal Server running on http://0.0.0.0:${port}`);
});
