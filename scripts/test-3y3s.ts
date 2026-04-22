import { parseHtml } from "../lib/textage-chart-parser";

async function testSong(key: string, ver: number, diff: "A" | "X") {
  const urlDiff = diff === "X" ? "X" : "A";
  const url = `https://textage.cc/score/${ver}/${key}.html?1${urlDiff}`;
  console.log("URL:", url);
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  if (!res.ok) { console.error("fetch failed:", res.status); return; }
  const html = await res.text();

  // HTMLの構造確認
  const ifKuroM = html.match(/if\s*\(\s*kuro\s*\)\s*\{/);
  const ifAMatches = [...html.matchAll(/if\s*\(\s*a\s*\)\s*\{/g)];
  const notesM = [...html.matchAll(/notes=(\d+);/g)];

  console.log("\n--- HTML structure ---");
  console.log("if(kuro):", ifKuroM ? `pos ${ifKuroM.index}` : "not found");
  console.log("if(a) occurrences:", ifAMatches.map(m => m.index));
  console.log("notes= values:", notesM.map(m => m[1]));

  // 周辺150文字を表示
  if (ifAMatches.length > 0) {
    const pos = ifAMatches[0].index!;
    console.log("\nFirst if(a) context (±80 chars):");
    console.log(html.slice(Math.max(0, pos - 80), pos + 80));
  }

  const data = parseHtml(html, urlDiff);
  console.log("\n--- Parse result ---");
  console.log("title:", data.title);
  console.log("total_notes:", data.total_notes);
  console.log("notes.length:", data.notes.length);
  console.log("note types:", {
    normal: data.notes.filter(n => n.type === "normal").length,
    cn_start: data.notes.filter(n => n.type === "cn_start").length,
    cn_end: data.notes.filter(n => n.type === "cn_end").length,
  });

  const perMeasure: Record<number, number> = {};
  for (const n of data.notes) perMeasure[n.measure] = (perMeasure[n.measure] ?? 0) + 1;
  const total = Object.values(perMeasure).reduce((a, b) => a + b, 0);
  console.log("per-measure total:", total);
}

(async () => {
  await testSong("3y3s", 16, "A");
})().catch(console.error);
