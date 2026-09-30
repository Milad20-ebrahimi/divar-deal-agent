import axios from "axios";
import * as cheerio from "cheerio";

export interface TorobPricePoint {
  title: string;
  price: number;
  priceText: string;
  url?: string;
}

export interface TorobPriceResult {
  query: string;
  sourceUrl: string;
  prices: TorobPricePoint[];
  minPrice: number | null;
  medianPrice: number | null;
}

const faDigits = "۰۱۲۳۴۵۶۷۸۹";
const arDigits = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(faDigits.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(arDigits.indexOf(d)));
}

function parseToman(text: string): number | null {
  const normalized = normalizeDigits(text).replace(/[٬,]/g, "");
  const matches = normalized.match(/\d{3,}/g);
  if (!matches?.length) return null;
  const value = Number(matches[matches.length - 1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export async function searchTorob(query: string): Promise<TorobPriceResult> {
  const sourceUrl = `https://torob.com/search/?query=${encodeURIComponent(query)}`;
  const response = await axios.get<string>(sourceUrl, {
    timeout: 15_000,
    responseType: "text",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8",
    },
  });

  const $ = cheerio.load(response.data);
  const points: TorobPricePoint[] = [];
  const seen = new Set<string>();

  // Torob can change its markup. This intentionally uses broad public-page parsing
  // and fails safely rather than attempting to bypass access controls.
  $("a").each((_index, element) => {
    const node = $(element);
    const text = node.text().replace(/\s+/g, " ").trim();
    if (!text || !/تومان/.test(text)) return;

    const price = parseToman(text);
    if (!price) return;

    const href = node.attr("href");
    const key = `${price}:${text.slice(0, 100)}`;
    if (seen.has(key)) return;
    seen.add(key);

    points.push({
      title: text.slice(0, 250),
      price,
      priceText: `${price.toLocaleString("en-US")} تومان`,
      url: href ? new URL(href, "https://torob.com").toString() : undefined,
    });
  });

  // Remove obvious outliers before calculating a reference median.
  const rawPrices = points.map((point) => point.price).sort((a, b) => a - b);
  let usable = rawPrices;
  if (rawPrices.length >= 5) {
    const low = rawPrices[Math.floor(rawPrices.length * 0.1)];
    const high = rawPrices[Math.min(rawPrices.length - 1, Math.ceil(rawPrices.length * 0.9) - 1)];
    usable = rawPrices.filter((price) => price >= low && price <= high);
  }

  return {
    query,
    sourceUrl,
    prices: points.slice(0, 50),
    minPrice: usable.length ? Math.min(...usable) : null,
    medianPrice: median(usable),
  };
}
