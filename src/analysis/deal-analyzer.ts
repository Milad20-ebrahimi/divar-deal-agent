import type { CandidateListing } from "../filtering/candidates.js";
import type { ProductMatch } from "../matching/product-matcher.js";

export interface DealAnalysis {
  listing: CandidateListing;
  referencePrice: number;
  minTorobPrice: number;
  comparableCount: number;
  discountAmount: number;
  discountPercent: number;
  isDeal: boolean;
  confidence: "low" | "medium" | "high";
  matches: ProductMatch[];
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function trimOutliers(values: number[]): number[] {
  if (values.length < 5) return values;
  const sorted = [...values].sort((a, b) => a - b);
  const low = sorted[Math.floor(sorted.length * 0.1)];
  const high = sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.9) - 1)];
  return sorted.filter((value) => value >= low && value <= high);
}

export function analyzeDeal(
  listing: CandidateListing,
  matches: ProductMatch[],
  minDiscountPercent = Number(process.env.MIN_DISCOUNT_PERCENT || 15),
): DealAnalysis | null {
  if (listing.price === null || !matches.length) return null;

  const cleanMatches = matches.filter((m) => !m.isBundle);
  if (!cleanMatches.length) return null;

  const prices = trimOutliers(cleanMatches.map((m) => m.price).filter((p) => Number.isFinite(p) && p > 0));
  if (!prices.length) return null;

  const referencePrice = median(prices);
  const discountAmount = referencePrice - listing.price;
  const discountPercent = referencePrice > 0 ? (discountAmount / referencePrice) * 100 : 0;
  const bestScore = Math.max(...cleanMatches.map((m) => m.matchScore));

  return {
    listing,
    referencePrice,
    minTorobPrice: Math.min(...prices),
    comparableCount: prices.length,
    discountAmount,
    discountPercent: Math.round(discountPercent * 10) / 10,
    isDeal: discountAmount > 0 && discountPercent >= minDiscountPercent && bestScore >= 65,
    confidence: bestScore >= 85 && prices.length >= 3 ? "high" : bestScore >= 65 ? "medium" : "low",
    matches: cleanMatches,
  };
}
