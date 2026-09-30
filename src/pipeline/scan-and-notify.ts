import "dotenv/config";
import { fetchDivarListings, filterAffordableListings } from "../collectors/listings.js";
import { selectResaleCandidates } from "../filtering/candidates.js";
import { sendCandidateToTelegram, sendTelegramMessage } from "../notifications/telegram.js";

async function main() {
  const city = process.env.DIVAR_CITY || "tabriz";
  const maxPrice = Number(process.env.MAX_PRICE_TOMAN || 5_000_000);
  const minScore = Number(process.env.MIN_CANDIDATE_SCORE || 40);
  const maxAlerts = Number(process.env.MAX_TELEGRAM_ALERTS || 5);

  console.log(`Scanning ${city} and sending Telegram alerts...`);

  const all = await fetchDivarListings(city);
  const affordable = filterAffordableListings(all, maxPrice);
  const candidates = selectResaleCandidates(affordable)
    .filter((candidate) => candidate.candidateScore >= minScore)
    .slice(0, maxAlerts);

  console.log(`Listings: ${all.length}`);
  console.log(`Affordable: ${affordable.length}`);
  console.log(`Candidates selected for Telegram: ${candidates.length}`);

  if (!candidates.length) {
    console.log("No candidates matched the current filters.");
    return;
  }

  await sendTelegramMessage(
    `🤖 Divar Deal Agent\n${candidates.length} فرصت اولیه در ${city} پیدا شد.\n\nتوجه: هنوز قیمت بازار و سود نهایی تأیید نشده است.`,
  );

  for (const candidate of candidates) {
    await sendCandidateToTelegram(candidate);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("Telegram alerts sent successfully.");
}

main().catch((error) => {
  console.error("Scan/notify failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
