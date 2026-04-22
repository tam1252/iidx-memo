async function main() {
  const res = await fetch("https://textage.cc/score/30/_thechase.html?1A", {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  const html = await res.text();
  console.log("HTML length:", html.length);
  console.log("First 500:", html.slice(0, 500));
  console.log("\nLast 200:", html.slice(-200));
  // search for sp= or c1[
  const spIdx = html.search(/\bsp\s*=/);
  console.log("sp= at:", spIdx);
  if (spIdx !== -1) console.log("sp= context:", html.slice(spIdx, spIdx+100));
}
main().catch(console.error);
