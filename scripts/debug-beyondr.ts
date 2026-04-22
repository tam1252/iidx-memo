import { normalize, normalizeLoose } from "../lib/textage";
import { parseHtml } from "../lib/textage-chart-parser";

const WIKI_TITLE = "⁽⁽ ≀ ˙꒳˙ ≀ ⁾⁾ beyond reason";

async function fetchShiftJis(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  const buf = await res.arrayBuffer();
  return new TextDecoder("shift-jis").decode(buf);
}

async function main() {
  console.log("=== Wiki title normalization ===");
  console.log("original :", JSON.stringify(WIKI_TITLE));
  console.log("normalize:", JSON.stringify(normalize(WIKI_TITLE)));
  console.log("normalizeLoose:", JSON.stringify(normalizeLoose(WIKI_TITLE)));

  console.log("\n=== Searching titletbl.js for '_beyondr' ===");
  const js = await fetchShiftJis("https://textage.cc/score/titletbl.js");
  const re = /^'([^']+)'\s*:\s*\[([^\]]+)\]/gm;
  let found: { key: string; ver: number; title: string; normTitle: string; looseTitle: string } | null = null;
  let m;
  while ((m = re.exec(js)) !== null) {
    const key = m[1];
    if (!key.includes("beyond")) continue; // fast filter
    const nums = m[2].split(",");
    const ver = parseInt(nums[0].trim(), 10) || 0;
    const strs = [...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(x => x[1]);
    if (strs.length < 3) continue;
    const title = strs[2];
    console.log(`key=${key} ver=${ver} title=${JSON.stringify(title)}`);
    console.log(`  normalize:     ${JSON.stringify(normalize(title))}`);
    console.log(`  normalizeLoose:${JSON.stringify(normalizeLoose(title))}`);
    found = { key, ver, title, normTitle: normalize(title), looseTitle: normalizeLoose(title) };
  }

  // Wiki側のnormとtextage側のnormを比較
  if (found) {
    const wikiNorm  = normalize(WIKI_TITLE);
    const wikiLoose = normalizeLoose(WIKI_TITLE);
    console.log("\n=== Match check ===");
    console.log("norm match  :", wikiNorm  === found.normTitle,  `("${wikiNorm}" vs "${found.normTitle}")`);
    console.log("loose match :", wikiLoose === found.looseTitle, `("${wikiLoose}" vs "${found.looseTitle}")`);

    // 譜面取得テスト
    console.log(`\n=== Chart fetch: ver=${found.ver} key=${found.key} ===`);
    const url = `https://textage.cc/score/${found.ver}/${found.key}.html?1A`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" } });
    console.log("HTTP status:", res.status);
    if (res.ok) {
      const html = await res.text();
      const data = parseHtml(html, "A");
      console.log("total_notes:", data.total_notes);
      console.log("note types:", {
        normal: data.notes.filter(n => n.type === "normal").length,
        cn_start: data.notes.filter(n => n.type === "cn_start").length,
        cn_end: data.notes.filter(n => n.type === "cn_end").length,
      });
    }
  } else {
    console.log("'_beyondr' not found in titletbl.js — scanning for 'beyond'...");
    re.lastIndex = 0;
    while ((m = re.exec(js)) !== null) {
      const strs = [...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(x => x[1]);
      if (strs.length < 3) continue;
      const title = strs[2] + (strs[3] ?? "");
      if (title.toLowerCase().includes("beyond")) {
        console.log(`key=${m[1]} title=${JSON.stringify(strs[2])} sub=${JSON.stringify(strs[3] ?? "")}`);
      }
    }
  }
}

main().catch(console.error);
