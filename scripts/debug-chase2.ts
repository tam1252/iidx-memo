import { parseHtml } from "../lib/textage-chart-parser";

async function main() {
  const res = await fetch("https://textage.cc/score/30/_thechase.html?1A", {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  const html = await res.text();
  
  // Find if(a) block
  const aIdx = html.search(/if\s*\(\s*a\s*\)/);
  console.log("if(a) found at:", aIdx);
  if (aIdx !== -1) {
    console.log("Context:", html.slice(Math.max(0, aIdx-50), aIdx+300));
  }
  
  const data = parseHtml(html, "A");
  console.log("total_notes:", data.total_notes);
  console.log("spRaw empty?", Object.keys(data.measure_lens).length);
}
main().catch(console.error);
