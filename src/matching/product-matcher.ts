import type { TorobPricePoint } from "../pricing/torob.js";

export interface ProductMatch extends TorobPricePoint {
  matchScore: number;
  matchedTokens: string[];
  modelMatches: string[];
}

const STOP_WORDS = new Set([
  "مدل","ظرفیت","ساعت","میلی","آمپر","وات","اصل","اورجینال","نو","درحدنو","فوری","فروش",
  "با","و","برای","از","the","a","an","model"
]);

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

export function rankTorobMatches(query: string, points: TorobPricePoint[]): ProductMatch[] {
  const qTokens = tokens(query);
  const qModels = modelTokens(query);

  return points.map((point) => {
    const titleTokens = new Set(tokens(point.title));
    const matchedTokens = qTokens.filter((t) => titleTokens.has(t));
    const modelMatches = qModels.filter((t) => titleTokens.has(t));

    const coverage = qTokens.length ? matchedTokens.length / qTokens.length : 0;
    let score = Math.round(coverage * 70);
    if (modelMatches.length) score += 30;
    if (qModels.length && !modelMatches.length) score -= 35;

    return {
      ...point,
      matchScore: Math.max(0, Math.min(100, score)),
      matchedTokens,
      modelMatches,
    };
  }).sort((a, b) => b.matchScore - a.matchScore || a.price - b.price);
}

export function selectComparableMatches(query: string, points: TorobPricePoint[], minScore = 55): ProductMatch[] {
  const ranked = rankTorobMatches(query, points);
  if (!ranked.length) return [];

  const qModels = modelTokens(query);
  if (qModels.length) {
    const exactModel = ranked.filter((item) => item.modelMatches.length > 0 && item.matchScore >= minScore);
    if (exactModel.length) return exactModel;
  }

  const best = ranked[0].matchScore;
  return ranked.filter((item) => item.matchScore >= minScore && item.matchScore >= best - 10);
}
