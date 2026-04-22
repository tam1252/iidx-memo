import { parseHtml } from "../lib/textage-chart-parser";

async function main() {
  const res = await fetch("https://textage.cc/score/25/thechase.html?1A", {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  console.log("status:", res.status);
  const html = await res.text();
  
  const kIdx = html.search(/if\s*\(\s*k\s*\)/);
  const aIdx = html.search(/if\s*\(\s*a\s*\)/);
  console.log("if(k) at:", kIdx, "if(a) at:", aIdx);
  if (aIdx !== -1) {
    console.log("A block:", html.slice(aIdx, aIdx+200));
    console.log("c1=[] in A block:", /c1\s*=\s*\[\s*\]/.test(html.slice(aIdx, aIdx+2000)));
  }
  
  const data = parseHtml(html, "A");
  console.log("total_notes:", data.total_notes, "(expected: 1148)");
  console.log("normal:", data.notes.filter(n=>n.type==="normal").length);
  console.log("cn_start:", data.notes.filter(n=>n.type==="cn_start").length);
  console.log("cn_end:", data.notes.filter(n=>n.type==="cn_end").length);
}
main().catch(console.error);
