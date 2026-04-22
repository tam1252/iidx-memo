import { parseHtml } from "../lib/textage-chart-parser";

async function main() {
  const url = "https://textage.cc/score/22/_therele.html?1A";
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  const html = await res.text();

  // 全 notes= 宣言を表示
  const notesMatches = [...html.matchAll(/notes\s*=\s*(\d+)\s*;/g)];
  console.log("=== notes= 宣言 ===");
  for (const m of notesMatches) {
    const ctx = html.slice(Math.max(0, m.index! - 40), m.index! + 40);
    console.log(`  value=${m[1]}  context: ...${ctx.replace(/\n/g, "\\n")}...`);
  }

  // if(a){} ブロック内を確認
  const data = parseHtml(html, "A");
  console.log("\n=== A parse result ===");
  console.log("total_notes:", data.total_notes);
  console.log("normal:", data.notes.filter(n=>n.type==="normal").length);
  console.log("cn_start:", data.notes.filter(n=>n.type==="cn_start").length);
  console.log("cn_end:", data.notes.filter(n=>n.type==="cn_end").length);

  // if(a){} ブロックの先頭部分を表示
  const ifA = html.match(/if\s*\(\s*a\s*\)\s*\{/);
  if (ifA) {
    console.log("\n=== if(a) block start ===");
    console.log(html.slice(ifA.index!, ifA.index! + 600));
  }

  // kuro ブロックの中に c1 以外に何があるか
  const kuroMatch = /if\s*\(\s*kuro\s*\)\s*\{/.exec(html);
  if (kuroMatch) {
    let depth = 0, end = kuroMatch.index;
    for (let i = kuroMatch.index; i < html.length; i++) {
      if (html[i] === "{") depth++;
      else if (html[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    const kuro = html.slice(kuroMatch.index, end + 1);
    console.log("\n=== kuro block (first 1000 chars) ===");
    console.log(kuro.slice(0, 1000));
  }
}

main().catch(console.error);
