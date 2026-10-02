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

export function analyzeDeal(
  listing: CandidateListing,
  matches: ProductMatch[],
  minDiscountPercent = Number(process.env.MIN_DISCOUNT_PERCENT || 15),
): DealAnalysis | null {
  if (listing.price === null || !matches.length) return null;

  const prices = matches.map((m) => m.price).filter((p) => Number.isFinite(p) && p > 0);
  if (!prices.length) return null;

  const referencePrice = median(prices);
  const discountAmount = referencePrice - listing.price;
  const discountPercent = referencePrice > 0 ? (discountAmount / referencePrice) * 100 : 0;
  const bestScore = Math.max(...matches.map((m) => m.matchScore));

  return {
    listing,
    referencePrice,
    minTorobPrice: Math.min(...prices),
    comparableCount: prices.length,
    discountAmount,
    discountPercent: Math.round(discountPercent * 10) / 10,
    isDeal: discountAmount > 0 && discountPercent >= minDiscountPercent,
    confidence: bestScore >= 85 ? "high" : bestScore >= 65 ? "medium" : "low",
    matches,
  };
}
