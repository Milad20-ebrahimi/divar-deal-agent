import "dotenv/config";
import axios from "axios";

interface TelegramUpdate {
  update_id: number;
  message?: {
    chat?: {
      id: number;
      type?: string;
      first_name?: string;
      username?: string;
      title?: string;
    };
    text?: string;
  };
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is missing in .env");

  const url = `https://api.telegram.org/bot${token}/getUpdates`;
  const response = await axios.get<{ ok: boolean; result: TelegramUpdate[] }>(url, {
    timeout: 15_000,
  });

  const chats = new Map<number, TelegramUpdate["message"] extends infer _T ? any : never>();
  for (const update of response.data.result ?? []) {
    const chat = update.message?.chat;
    if (chat?.id) chats.set(chat.id, chat);
  }

  if (!chats.size) {
    console.log("No Telegram chats found.");
    console.log("Open your bot in Telegram, press Start, send /start or any message, then run this command again.");
    return;
  }

  console.log("Telegram chat(s) found:");
  for (const chat of chats.values()) {
    console.log(`CHAT_ID=${chat.id} | type=${chat.type ?? "unknown"} | name=${chat.first_name ?? chat.title ?? "unknown"} | username=${chat.username ?? "-"}`);
  }
  console.log("\nCopy your CHAT_ID number into TELEGRAM_CHAT_ID in .env.");
}

main().catch((error) => {
  if (axios.isAxiosError(error)) {
    console.error("Telegram API error:", error.response?.status, error.response?.data ?? error.message);
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
});
