import "dotenv/config";
import { searchTorob } from "./torob.js";

async function main() {
  const query = process.argv.slice(2).join(" ").trim() || "پاوربانک شیائومی 20000";
  console.log(`Searching Torob for: ${query}`);
  const result = await searchTorob(query);
  console.log(`Source: ${result.sourceUrl}`);
  console.log("Diagnostics:", JSON.stringify(result.diagnostics));
  console.log(`Price points found: ${result.prices.length}`);
  console.log(`Min usable price: ${result.minPrice?.toLocaleString("en-US") ?? "N/A"} toman`);
  console.log(`Median usable price: ${result.medianPrice?.toLocaleString("en-US") ?? "N/A"} toman`);
  console.log(JSON.stringify(result.prices.slice(0, 10), null, 2));
}

main().catch((error: any) => {
  console.error("Torob test failed:", error?.message ?? error);
  process.exitCode = 1;
});
