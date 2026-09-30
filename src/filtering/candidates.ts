import type { DivarListing } from "../collectors/listings.js";

export interface CandidateListing extends DivarListing {
  categoryHint: string;
  candidateScore: number;
  reasons: string[];
}

const EXCLUDED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /اجاره|رهن|سوئیت|سوییت|منزل|آپارتمان|ویلا|ملک/i, reason: "service/real-estate listing" },
  { pattern: /استخدام|کاریابی|حقوق|درآمد/i, reason: "job listing" },
  { pattern: /تعمیر|نصب|آموزش|خدمات/i, reason: "service listing" },
  { pattern: /لوازم یدکی|قطعه|قطعات/i, reason: "ambiguous parts listing" },
  { pattern: /روغن موتور|روغن گیربکس/i, reason: "consumable with authenticity risk" },
  { pattern: /پاد|ویپ|سیگار|تنباکو|قلیان/i, reason: "age-restricted/nicotine product" },
];

const CATEGORY_HINTS: Array<{ pattern: RegExp; category: string; boost: number }> = [
  { pattern: /مودم|روتر|router|tp[- ]?link|d[- ]?link/i, category: "networking", boost: 25 },
  { pattern: /پاور ?بانک|power ?bank/i, category: "power-bank", boost: 25 },
  { pattern: /چراغ.*شارژ|چراغ.*اضطرار|لامپ.*شارژ/i, category: "emergency-light", boost: 22 },
  { pattern: /ups|یو ?پی ?اس/i, category: "ups", boost: 22 },
  { pattern: /هدفون|هندزفری|headphone|earbud/i, category: "audio", boost: 15 },
  { pattern: /کیبورد|ماوس|mouse|keyboard/i, category: "computer-accessory", boost: 15 },
  { pattern: /کنسول|playstation|ps4|xbox/i, category: "gaming", boost: 15 },
  { pattern: /مانیتور|monitor/i, category: "monitor", boost: 12 },
];

export function toCandidate(listing: DivarListing): CandidateListing | null {
  if (listing.price === null || listing.price <= 0) return null;

  for (const excluded of EXCLUDED_PATTERNS) {
    if (excluded.pattern.test(listing.title)) return null;
  }

  let categoryHint = "other";
  let candidateScore = 25;
  const reasons: string[] = ["physical priced item"];

  const category = CATEGORY_HINTS.find((item) => item.pattern.test(listing.title));
  if (category) {
    categoryHint = category.category;
    candidateScore += category.boost;
    reasons.push(`preferred category: ${category.category}`);
  }

  if (listing.price <= 3_000_000) {
    candidateScore += 15;
    reasons.push("low capital requirement");
  } else if (listing.price <= 5_000_000) {
    candidateScore += 8;
    reasons.push("within capital ceiling");
  }

  // Extremely low placeholder prices are common in classifieds and should not rank highly.
  if (listing.price < 50_000) {
    candidateScore -= 30;
    reasons.push("possible placeholder price");
  }

  return {
    ...listing,
    categoryHint,
    candidateScore: Math.max(0, Math.min(100, candidateScore)),
    reasons,
  };
}

export function selectResaleCandidates(listings: DivarListing[]): CandidateListing[] {
  return listings
    .map(toCandidate)
    .filter((item): item is CandidateListing => item !== null)
    .sort((a, b) => b.candidateScore - a.candidateScore || a.price! - b.price!);
}
