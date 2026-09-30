import axios from "axios";
import type { CandidateListing } from "../filtering/candidates.js";

function requireTelegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is missing in .env");
  if (!chatId) throw new Error("TELEGRAM_CHAT_ID is missing in .env");

  return { token, chatId };
}

export async function sendTelegramMessage(text: string): Promise<void> {
  const { token, chatId } = requireTelegramConfig();
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  await axios.post(url, {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  }, { timeout: 15_000 });
}

export function formatCandidateMessage(candidate: CandidateListing): string {
  const price = candidate.price?.toLocaleString("en-US") ?? "unknown";
  return [
    "🔎 فرصت اولیه دیوار",
    "",
    candidate.title,
    `💰 قیمت آگهی: ${price} تومان`,
    `📦 دسته اولیه: ${candidate.categoryHint}`,
    `📊 امتیاز اولیه: ${candidate.candidateScore}/100`,
    "",
    "⚠️ هنوز قیمت بازار و سود این آگهی تأیید نشده است.",
    candidate.url,
  ].join("\n");
}

export async function sendCandidateToTelegram(candidate: CandidateListing): Promise<void> {
  await sendTelegramMessage(formatCandidateMessage(candidate));
}
