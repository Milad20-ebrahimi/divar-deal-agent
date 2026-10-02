import axios from "axios";
import type { CandidateListing } from "../filtering/candidates.js";
import type { DealAnalysis } from "../analysis/deal-analyzer.js";
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
function requireTelegramConfig(){const token=process.env.TELEGRAM_BOT_TOKEN?.trim();const chatId=process.env.TELEGRAM_CHAT_ID?.trim();if(!token)throw new Error("TELEGRAM_BOT_TOKEN is missing in .env");if(!chatId)throw new Error("TELEGRAM_CHAT_ID is missing in .env");return{token,chatId};}
export async function sendTelegramMessage(text:string):Promise<void>{const{token,chatId}=requireTelegramConfig();const url=`https://api.telegram.org/bot${token}/sendMessage`;let last:unknown;
 for(let attempt=1;attempt<=3;attempt++){try{await axios.post(url,{chat_id:chatId,text,disable_web_page_preview:true},{timeout:25_000});return;}catch(e){last=e;if(attempt<3)await sleep(attempt*1500);}}
 throw last instanceof Error?last:new Error("Telegram request failed");
}
export function formatCandidateMessage(candidate:CandidateListing){const price=candidate.price?.toLocaleString("en-US")??"unknown";return["🔎 فرصت اولیه دیوار","",candidate.title,`💰 قیمت آگهی: ${price} تومان`,`📦 دسته اولیه: ${candidate.categoryHint}`,`📊 امتیاز اولیه: ${candidate.candidateScore}/100`,"","⚠️ هنوز قیمت بازار و سود این آگهی تأیید نشده است.",candidate.url].join("\n");}
export async function sendCandidateToTelegram(candidate:CandidateListing){await sendTelegramMessage(formatCandidateMessage(candidate));}
export function formatDealMessage(deal:DealAnalysis){const divarPrice=deal.listing.price?.toLocaleString("en-US")??"unknown";const reference=deal.referencePrice.toLocaleString("en-US");const difference=deal.discountAmount.toLocaleString("en-US");const torobUrl=deal.matches[0]?.url;return["🔥 فرصت خرید تأییدشده","",deal.listing.title,`💰 دیوار: ${divarPrice} تومان`,`🏷️ مرجع ترب: ${reference} تومان`,`📉 اختلاف: ${difference} تومان (${deal.discountPercent}% زیر مرجع)`,`🔎 نمونه مرجع: ${deal.comparableCount}`,`✅ اطمینان: ${deal.confidence}`,"",`دیوار: ${deal.listing.url}`,...(torobUrl?[`ترب: ${torobUrl}`]:[]),"","⚠️ قبل از خرید، اصالت، سلامت و وضعیت واقعی کالا را حضوری بررسی کن."].join("\n");}
export async function sendDealToTelegram(deal:DealAnalysis){await sendTelegramMessage(formatDealMessage(deal));}
