import { parseHtml } from "../lib/textage-chart-parser";

async function main() {
  const res = await fetch("https://textage.cc/score/33/_beyondr.html?1A", {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  const html = await res.text();
  
  const data = parseHtml(html, "A");
  console.log("total_notes:", data.total_notes);
  console.log("normal:", data.notes.filter(n => n.type === "normal").length);
  console.log("cn_start:", data.notes.filter(n => n.type === "cn_start").length);
  console.log("cn_end:", data.notes.filter(n => n.type === "cn_end").length);
  
  // Measures with CNs
  const byMeasure: Record<number, {normal: number, cn_start: number, cn_end: number}> = {};
  for (const note of data.notes) {
    if (!byMeasure[note.measure]) byMeasure[note.measure] = {normal:0, cn_start:0, cn_end:0};
    byMeasure[note.measure][note.type]++;
  }
  for (const [m, counts] of Object.entries(byMeasure)) {
    if (counts.cn_start > 0 || counts.cn_end > 0) {
      console.log(`  measure ${m}: normal=${counts.normal} cn_start=${counts.cn_start} cn_end=${counts.cn_end}`);
    }
  }
  
  // Duplicate check
  const seen = new Map<string, number>();
  for (const note of data.notes) {
    const key = `${note.measure}:${note.pos}:${note.key}:${note.type}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const dups = [...seen.entries()].filter(([,count]) => count > 1);
  if (dups.length > 0) {
    console.log("\nDuplicate notes:");
    for (const [k, count] of dups) console.log(`  ${k} x${count}`);
  } else {
    console.log("\nNo duplicates.");
  }
}

main().catch(console.error);
