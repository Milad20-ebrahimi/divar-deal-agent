import "dotenv/config";
import { fetchDivarListings, filterAffordableListings } from "../collectors/listings.js";
import { selectResaleCandidates } from "../filtering/candidates.js";

async function main() {
  const city = process.env.DIVAR_CITY || "tabriz";
  const maxPrice = Number(process.env.MAX_PRICE_TOMAN || 5_000_000);

  console.log(`Scanning ${city} for resale candidates <= ${maxPrice.toLocaleString("en-US")} toman...`);

  const all = await fetchDivarListings(city);
  const affordable = filterAffordableListings(all, maxPrice);
  const candidates = selectResaleCandidates(affordable);

  console.log(`Listings: ${all.length}`);
  console.log(`Affordable: ${affordable.length}`);
  console.log(`Resale candidates after safety/noise filters: ${candidates.length}`);
  console.log(JSON.stringify(candidates.slice(0, 30), null, 2));
}

main().catch((error) => {
  console.error("Candidate scan failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
