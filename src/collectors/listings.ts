import axios from "axios";
import * as cheerio from "cheerio";

export interface DivarListing { token:string; title:string; price:number|null; priceText:string|null; url:string; }

const FA_TO_EN: Record<string,string>={"۰":"0","۱":"1","۲":"2","۳":"3","۴":"4","۵":"5","۶":"6","۷":"7","۸":"8","۹":"9","٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9"};
function normalizeDigits(value:string){return value.replace(/[۰-۹٠-٩]/g,d=>FA_TO_EN[d]??d);}
export function parseTomanPrice(text:string):number|null{
 const normalized=normalizeDigits(text).replace(/[٬,]/g,""); if(/توافقی|مجانی|رایگان/i.test(normalized))return null;
 const matches=[...normalized.matchAll(/(\d[\d\s.]*)\s*(هزار|میلیون|میلیارد)?\s*تومان/gi)]; if(!matches.length)return null;
 const match=matches[matches.length-1]; const number=Number(match[1].replace(/[\s.]/g,"")); if(!Number.isFinite(number))return null;
 const unit=match[2]?.toLowerCase(); if(unit==="هزار")return number*1_000;if(unit==="میلیون")return number*1_000_000;if(unit==="میلیارد")return number*1_000_000_000;return number;
}
function cleanText(value:string){return value.replace(/\s+/g," ").trim();}

export async function fetchDivarListings(city=process.env.DIVAR_CITY||"tabriz"):Promise<DivarListing[]>{
 const url=`https://divar.ir/s/${encodeURIComponent(city)}`;
 const response=await axios.get<string>(url,{timeout:15_000,headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",Accept:"text/html,application/xhtml+xml","Accept-Language":"fa-IR,fa;q=0.9,en;q=0.8"},responseType:"text"});
 const $=cheerio.load(response.data); const byToken=new Map<string,DivarListing>();
 $('a[href^="/v/"]').each((_index,element)=>{const href=$(element).attr("href");if(!href)return;const token=href.split("?")[0].split("/").filter(Boolean).pop();if(!token||byToken.has(token))return;
 const text=cleanText($(element).text());if(!text)return;const price=parseTomanPrice(text);const priceMatch=text.match(/(?:[۰-۹٠-٩\d][۰-۹٠-٩\d٬,.\s]*(?:هزار|میلیون|میلیارد)?\s*تومان|توافقی)/i);const priceText=priceMatch?cleanText(priceMatch[0]):null;
 let title=cleanText($(element).find("h2").first().text());if(!title)title=cleanText($(element).find("[class*=title]").first().text());if(!title)title=text.slice(0,120);
 byToken.set(token,{token,title,price,priceText,url:new URL(href,"https://divar.ir").toString()});});
 return [...byToken.values()];
}
export function filterAffordableListings(listings:DivarListing[],maxPrice=Number(process.env.MAX_PRICE_TOMAN||5_000_000)){return listings.filter(l=>l.price!==null&&l.price<=maxPrice);}
