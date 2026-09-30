import "dotenv/config";
import { sendTelegramMessage } from "./telegram.js";

async function main() {
  await sendTelegramMessage(
    "✅ اتصال Divar Deal Agent به تلگرام با موفقیت انجام شد.\n\nاز این به بعد فرصت‌های تأییدشده می‌توانند اینجا ارسال شوند.",
  );
  console.log("Telegram test message sent successfully.");
}

main().catch((error) => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as any).response;
    console.error("Telegram API error:", response?.status, response?.data ?? "");
  } else {
    console.error("Telegram test failed:", error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
});
