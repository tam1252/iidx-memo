async function main() {
  // beyond reason A block (resets c1)
  const res1 = await fetch("https://textage.cc/score/33/_beyondr.html?1A", {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  const br = await res1.text();
  const brABlock = br.match(/if\s*\(\s*a\s*\)\s*\{[^]*?(?=\}else\{|\}if\s*\()/)?.[0] ?? "";
  console.log("=== beyond reason if(a) start ===");
  console.log(brABlock.slice(0, 200));
  console.log("c1=[] in block:", /c1\s*=\s*\[\s*\]/.test(brABlock));

  // The Chase A block
  const res2 = await fetch("https://textage.cc/score/30/_thechase.html?1A", {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  const tc = await res2.text();
  const tcABlock = tc.match(/if\s*\(\s*a\s*\)\s*\{[^]*?(?=\}else\{|\}if\s*\()/)?.[0] ?? "";
  console.log("\n=== The Chase if(a) start ===");
  console.log(tcABlock.slice(0, 200));
  console.log("c1=[] in block:", /c1\s*=\s*\[\s*\]/.test(tcABlock));
}
main().catch(console.error);
