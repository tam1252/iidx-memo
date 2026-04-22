async function main() {
  const res = await fetch("https://textage.cc/score/30/_thechase.html?1A", {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  const html = await res.text();
  
  // Find if(k) block context
  const kIdx = html.search(/if\s*\(\s*k\s*\)/);
  console.log("if(k) at:", kIdx);
  if (kIdx !== -1) {
    console.log(html.slice(kIdx, kIdx+600));
  }
}
main().catch(console.error);
