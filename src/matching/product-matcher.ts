import type { TorobPricePoint } from "../pricing/torob.js";

export interface ProductMatch extends TorobPricePoint {
  matchScore: number;
  matchedTokens: string[];
  modelMatches: string[];
  isBundle: boolean;
  bundleReasons: string[];
}

const STOP_WORDS = new Set([
  "مدل","ظرفیت","ساعت","میلی","آمپر","وات","اصل","اورجینال","نو","درحدنو","فوری","فروش",
  "با","و","برای","از","the","a","an","model"
]);

const BUNDLE_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /به همراه/i, reason: "به همراه کالای اضافه" },
  { pattern: /همراه\s+(?:شارژر|کابل|آداپتور|کیف|کاور|هدیه)/i, reason: "لوازم جانبی همراه" },
  { pattern: /\+\s*(?:شارژر|کابل|آداپتور|کیف|کاور|هدیه)/i, reason: "باندل با لوازم جانبی" },
  { pattern: /پک\s+(?:کامل|همراه|ویژه)/i, reason: "پک/باندل" },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[‌_\-\/]+/g, " ")
    .replace(/[^\p{L}\p{N}.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string): string[] {
  return [...new Set(normalize(value).split(" ").filter((t) => t.length >= 2 && !STOP_WORDS.has(t)))];
}

function modelTokens(value: string): string[] {
  return tokens(value).filter((t) => /[a-z]/i.test(t) && /\d/.test(t) && t.length >= 4);
}

function detectBundle(title: string): string[] {
  return BUNDLE_PATTERNS.filter((item) => item.pattern.test(title)).map((item) => item.reason);
}

export function rankTorobMatches(query: string, points: TorobPricePoint[]): ProductMatch[] {
  const qTokens = tokens(query);
  const qModels = modelTokens(query);

  return points.map((point) => {
    const titleTokens = new Set(tokens(point.title));
    const matchedTokens = qTokens.filter((t) => titleTokens.has(t));
    const modelMatches = qModels.filter((t) => titleTokens.has(t));
    const bundleReasons = detectBundle(point.title);

    const coverage = qTokens.length ? matchedTokens.length / qTokens.length : 0;
    let score = Math.round(coverage * 70);
    if (modelMatches.length) score += 30;
    if (qModels.length && !modelMatches.length) score -= 35;
    if (bundleReasons.length) score -= 25;

    return {
      ...point,
      matchScore: Math.max(0, Math.min(100, score)),
      matchedTokens,
      modelMatches,
      isBundle: bundleReasons.length > 0,
      bundleReasons,
    };
  }).sort((a, b) => b.matchScore - a.matchScore || a.price - b.price);
}

export function selectComparableMatches(query: string, points: TorobPricePoint[], minScore = 55): ProductMatch[] {
  const ranked = rankTorobMatches(query, points);
  if (!ranked.length) return [];

  const nonBundles = ranked.filter((item) => !item.isBundle);
  const pool = nonBundles.length ? nonBundles : ranked;
  const qModels = modelTokens(query);

  if (qModels.length) {
    const exactModel = pool.filter((item) => item.modelMatches.length > 0 && item.matchScore >= minScore);
    if (exactModel.length) return exactModel;
  }

  const best = pool[0]?.matchScore ?? 0;
  return pool.filter((item) => item.matchScore >= minScore && item.matchScore >= best - 10);
}
