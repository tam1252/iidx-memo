import { parseHtml } from "../lib/textage-chart-parser";

async function fetchChart(url: string, diff: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  const html = await res.text();
  const data = parseHtml(html, diff);
  return { total: data.total_notes, normal: data.notes.filter(n=>n.type==="normal").length, cn_start: data.notes.filter(n=>n.type==="cn_start").length, cn_end: data.notes.filter(n=>n.type==="cn_end").length };
}

async function main() {
  const br = await fetchChart("https://textage.cc/score/33/_beyondr.html?1A", "A");
  console.log("beyond reason A:", br, "(expected: 1988)");
  
  const tc = await fetchChart("https://textage.cc/score/30/_thechase.html?1A", "A");
  console.log("The Chase A:", tc, "(expected: 1148)");
}
main().catch(console.error);
