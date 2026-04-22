import { parseHtml } from "../lib/textage-chart-parser";

async function fetchShiftJis(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  const buf = await res.arrayBuffer();
  return new TextDecoder("shift-jis").decode(buf);
}

async function findKey() {
  const js = await fetchShiftJis("https://textage.cc/score/titletbl.js");
  const re = /^'([^']+)'\s*:\s*\[([^\]]+)\]/gm;
  let m;
  while ((m = re.exec(js)) !== null) {
    const strs = [...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(x => x[1]);
    if (strs.length < 3) continue;
    const title = strs[2];
    if (title.toLowerCase().includes("relentless")) {
      const ver = parseInt(m[2].split(",")[0].trim());
      console.log(`key=${m[1]} ver=${ver} title="${title}"`);
    }
  }
}

async function testDiff(key: string, ver: number, diff: "A" | "X") {
  const url = `https://textage.cc/score/${ver}/${key}.html?1${diff}`;
  console.log(`\n=== ${diff} diff: ${url} ===`);
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  if (!res.ok) { console.log("fetch failed:", res.status); return null; }
  const html = await res.text();

  const data = parseHtml(html, diff);
  const types = {
    normal: data.notes.filter(n => n.type === "normal").length,
    cn_start: data.notes.filter(n => n.type === "cn_start").length,
    cn_end: data.notes.filter(n => n.type === "cn_end").length,
  };
  console.log("total_notes:", data.total_notes, "| types:", types);

  // kuro ブロックの内容を確認
  const kuroM = html.match(/if\s*\(\s*kuro\s*\)\s*\{([\s\S]*?)\}/);
  if (kuroM) {
    console.log("\nkuro block content (first 500 chars):");
    console.log(kuroM[0].slice(0, 500));
  } else {
    console.log("no kuro block found");
  }

  return data;
}

(async () => {
  console.log("=== Finding 'The Relentless' key ===");
  await findKey();

  const key = "_therele";
  const ver = 22;
  const dataA = await testDiff(key, ver, "A");
  const dataX = await testDiff(key, ver, "X");
  if (dataA && dataX) {
    console.log("\n=== Per-measure diff (A vs L) ===");
    const allMeasures = new Set([...dataA.notes.map(n => n.measure), ...dataX.notes.map(n => n.measure)]);
    for (const m of [...allMeasures].sort((a,b)=>a-b)) {
      const aNotes = dataA.notes.filter(n => n.measure === m);
      const xNotes = dataX.notes.filter(n => n.measure === m);
      if (aNotes.length !== xNotes.length) {
        console.log(`  measure ${m}: A=${aNotes.length}(${aNotes.map(n=>n.type[0]+n.key).join(",")}), L=${xNotes.length}(${xNotes.map(n=>n.type[0]+n.key).join(",")})`);
      }
    }
  }
})().catch(console.error);
