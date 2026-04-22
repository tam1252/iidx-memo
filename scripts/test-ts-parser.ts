import { parseHtml } from "../lib/textage-chart-parser";

async function main() {
  const url = "https://textage.cc/score/21/verflcht.html?1XC00";
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  const html = await res.text();

  const data = parseHtml(html, "X");

  console.log("title:", data.title);
  console.log("total_notes:", data.total_notes);
  console.log("measure_count:", data.measure_count);
  console.log("note types:", {
    normal: data.notes.filter((n) => n.type === "normal").length,
    cn_start: data.notes.filter((n) => n.type === "cn_start").length,
    cn_end: data.notes.filter((n) => n.type === "cn_end").length,
    total_all: data.notes.length,
  });

  // Per-measure (all note types like Python)
  const perMeasure: Record<number, number> = {};
  for (const n of data.notes) {
    perMeasure[n.measure] = (perMeasure[n.measure] ?? 0) + 1;
  }
  console.log("\nMeasure | Notes");
  console.log("--------|------");
  const measures = Object.keys(perMeasure).map(Number).sort((a, b) => a - b);
  let total = 0;
  for (const m of measures) {
    console.log(`${m.toString().padStart(7)} | ${perMeasure[m].toString().padStart(5)}`);
    total += perMeasure[m];
  }
  console.log("--------|------");
  console.log(`Total   | ${total.toString().padStart(5)}`);
}

main().catch(console.error);
