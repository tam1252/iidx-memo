/**
 * textage HTML内の notes=xxx (公式値) とパーサー出力を比較する
 */
import { parseHtml } from "../lib/textage-chart-parser";

interface Target { title: string; ver: number; key: string; diffs: Array<"A" | "L">; }

const TARGETS: Target[] = [
  { title: "3y3s",              ver: 16, key: "3y3s",      diffs: ["A"] },
  { title: "Verflucht",         ver: 21, key: "verflcht",  diffs: ["A", "L"] },
  { title: "The Relentless",    ver: 22, key: "_therele",  diffs: ["A", "L"] },
];

async function fetchHtml(ver: number, key: string, urlDiff: string): Promise<string> {
  const url = `https://textage.cc/score/${ver}/${key}.html?1${urlDiff}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

function balancedEnd(html: string, start: number): number {
  let depth = 0;
  for (let i = start; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") { depth--; if (depth === 0) return i + 1; }
  }
  return html.length;
}

function getHtmlNotes(html: string, diff: "A" | "L"): number | null {
  // if(k) が if(kuro) を内包する場合 (The Relentless 型):
  //   A → if(k) 内の if(a) の notes= (kuro 適用前)
  //   L → if(k) 内の if(kuro) の notes= (kuro 適用後)
  const kM = /if\s*\(\s*k\s*\)\s*\{/.exec(html);
  const kuroFirstM = /if\s*\(\s*kuro\s*\)\s*\{/.exec(html);
  if (kM && kuroFirstM && kM.index < kuroFirstM.index) {
    const kEnd = balancedEnd(html, kM.index);
    if (kuroFirstM.index < kEnd) {
      const kBlock = html.slice(kM.index, kEnd);
      if (diff === "A") {
        const m = /if\s*\(\s*a\s*\)\s*\{notes=(\d+);/.exec(kBlock);
        return m ? parseInt(m[1]) : null;
      } else {
        // L: kuro ブロック内の notes=
        const kuroInBlock = /if\s*\(\s*kuro\s*\)\s*\{notes=(\d+)/.exec(kBlock);
        return kuroInBlock ? parseInt(kuroInBlock[1]) : null;
      }
    }
  }

  // 通常パス
  const kuroM2 = /if\s*\(\s*kuro\s*\)\s*\{/.exec(html);
  const ke = kuroM2 ? balancedEnd(html, kuroM2.index) : 0;

  if (diff === "L") {
    if (ke === 0) return null;
    const kuroBlock = html.slice(0, ke);
    const m = /if\s*\(\s*a\s*\)\s*\{notes=(\d+);/.exec(kuroBlock);
    return m ? parseInt(m[1]) : null;
  } else {
    if (ke > 0) {
      const m = /if\s*\(\s*a\s*\)\s*\{notes=(\d+);/.exec(html.slice(ke));
      if (m) return parseInt(m[1]);
    }
    const m2 = /if\s*\(\s*a\s*\)\s*\{notes=(\d+);/.exec(html);
    return m2 ? parseInt(m2[1]) : null;
  }
}

async function main() {
  console.log(["曲名", "diff", "HTML公式", "パーサー", "差", "N", "CN_s", "CN_e"].join("\t"));
  console.log("-".repeat(90));

  for (const { title, ver, key, diffs } of TARGETS) {
    for (const diff of diffs) {
      const urlDiff = diff === "L" ? "X" : diff;
      try {
        const html = await fetchHtml(ver, key, urlDiff);
        const data = parseHtml(html, urlDiff);
        const htmlNotes = getHtmlNotes(html, diff);
        const delta = htmlNotes !== null ? data.total_notes - htmlNotes : null;
        const status = delta === 0 ? "✓" : delta !== null ? `✗ (${delta > 0 ? "+" : ""}${delta})` : "?";
        const N = data.notes.filter(n => n.type === "normal").length;
        const cs = data.notes.filter(n => n.type === "cn_start").length;
        const ce = data.notes.filter(n => n.type === "cn_end").length;
        console.log([title, diff, htmlNotes ?? "?", data.total_notes, status, N, cs, ce].join("\t"));
      } catch (e) {
        console.log([title, diff, "ERR", "ERR", "ERR", "", "", ""].join("\t") + ` (${e})`);
      }
      await new Promise(r => setTimeout(r, 400));
    }
  }
}

main().catch(console.error);
