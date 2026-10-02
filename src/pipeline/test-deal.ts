import "dotenv/config";
import { searchTorob } from "../pricing/torob.js";
import { selectComparableMatches } from "../matching/product-matcher.js";
import { analyzeDeal } from "../analysis/deal-analyzer.js";
import type { CandidateListing } from "../filtering/candidates.js";

async function main() {
  const title = process.argv.slice(2, -1).join(" ").trim() || "پاوربانک شیائومی مدل PB200LZM ظرفیت 20000";
  const last = process.argv.at(-1) ?? "";
  const price = /^\d+$/.test(last) ? Number(last) : 1_300_000;

  console.log(`Product: ${title}`);
  console.log(`Divar price: ${price.toLocaleString("en-US")} toman`);

  const torob = await searchTorob(title);
  const matches = selectComparableMatches(title, torob.prices);

  const listing: CandidateListing = {
    token: "manual-test",
    title,
    price,
    priceText: `${price.toLocaleString("en-US")} تومان`,
    url: "https://divar.ir/",
    categoryHint: "test",
    candidateScore: 100,
    reasons: ["manual deal test"],
  };

  const analysis = analyzeDeal(listing, matches);
  console.log(`Torob search results: ${torob.prices.length}`);
  console.log(`Comparable matches: ${matches.length}`);

  if (!analysis) {
    console.log("No reliable comparable Torob product found.");
    return;
  }

  console.log(`Reference Torob price: ${analysis.referencePrice.toLocaleString("en-US")} toman`);
  console.log(`Lowest matched Torob price: ${analysis.minTorobPrice.toLocaleString("en-US")} toman`);
  console.log(`Difference: ${analysis.discountAmount.toLocaleString("en-US")} toman`);
  console.log(`Below Torob reference: ${analysis.discountPercent}%`);
  console.log(`Confidence: ${analysis.confidence}`);
  console.log(`Deal: ${analysis.isDeal ? "YES" : "NO"}`);
  console.log(JSON.stringify(matches.slice(0, 10), null, 2));
}

main().catch((error) => {
  console.error("Deal test failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
