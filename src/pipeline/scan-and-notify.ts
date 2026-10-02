import "dotenv/config";
import { fetchDivarListings, filterAffordableListings } from "../collectors/listings.js";
import { selectResaleCandidates } from "../filtering/candidates.js";
import { searchTorob } from "../pricing/torob.js";
import { selectComparableMatches } from "../matching/product-matcher.js";
import { analyzeDeal } from "../analysis/deal-analyzer.js";
import { sendDealToTelegram, sendTelegramMessage } from "../notifications/telegram.js";
import type { DealAnalysis } from "../analysis/deal-analyzer.js";
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
async function main(){
 const city=process.env.DIVAR_CITY||"tabriz",maxPrice=Number(process.env.MAX_PRICE_TOMAN||5_000_000),minScore=Number(process.env.MIN_CANDIDATE_SCORE||40),maxChecks=Number(process.env.MAX_TOROB_CHECKS||8),maxAlerts=Number(process.env.MAX_TELEGRAM_ALERTS||5);
 console.log(`Scanning ${city}, checking Torob, and sending confirmed deals...`);
 const all=await fetchDivarListings(city),affordable=filterAffordableListings(all,maxPrice),candidates=selectResaleCandidates(affordable).filter(c=>c.candidateScore>=minScore).slice(0,maxChecks);
 console.log(`Listings: ${all.length}`);console.log(`Affordable: ${affordable.length}`);console.log(`Candidates to price-check: ${candidates.length}`);
 const deals:DealAnalysis[]=[];
 for(const candidate of candidates){try{console.log(`Checking Torob: ${candidate.title}`);const torob=await searchTorob(candidate.title);const matches=selectComparableMatches(candidate.title,torob.prices);const analysis=analyzeDeal(candidate,matches);if(analysis?.isDeal&&analysis.confidence!=="low")deals.push(analysis);}catch(error){console.warn(`Skipped ${candidate.token}: ${error instanceof Error?error.message:error}`);}await sleep(800);}
 deals.sort((a,b)=>b.discountPercent-a.discountPercent||b.discountAmount-a.discountAmount);const selected=deals.slice(0,maxAlerts);console.log(`Confirmed deals: ${deals.length}`);if(!selected.length){console.log("No confirmed deals met the current threshold.");return;}
 try{await sendTelegramMessage(`🔥 Divar Deal Agent\n${selected.length} فرصت تأییدشده با مقایسه ترب پیدا شد.`);}catch(e){console.warn(`Telegram header failed: ${e instanceof Error?e.message:e}`);}
 let sent=0;for(const deal of selected){try{await sendDealToTelegram(deal);sent++;console.log(`Telegram sent: ${deal.listing.title}`);}catch(e){console.warn(`Telegram failed for ${deal.listing.token}: ${e instanceof Error?e.message:e}`);}await sleep(800);}
 console.log(`Telegram alerts sent: ${sent}/${selected.length}`);
}
main().catch(error=>{console.error("Scan/notify failed:",error instanceof Error?error.message:error);process.exitCode=1;});
