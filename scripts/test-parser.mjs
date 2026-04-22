// ESM形式のテストスクリプト - TypeScriptパーサーの動作検証
// Usage: node --experimental-vm-modules scripts/test-parser.mjs
// or: npx tsx scripts/test-parser.mjs

import { createRequire } from "module";
const require = createRequire(import.meta.url);

// TypeScriptソースを直接evalするのではなく、
// HTTPで取得してAPIルートを経由してテストする
(async () => {
  const url = "https://textage.cc/score/21/verflcht.html?1XC00";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": "https://textage.cc/score/",
    },
  });
  if (!res.ok) {
    console.error("fetch failed:", res.status);
    process.exit(1);
  }
  const html = await res.text();
  console.log("HTML length:", html.length);

  // inline the parse logic by importing the compiled module via tsx
  // Instead: print a snippet of the HTML around key JS patterns

  // Check LNDEF
  const lndefM = html.match(/\bLNDEF\s*=\s*(\d+)\s*;/);
  console.log("LNDEF:", lndefM ? lndefM[1] : "not found (default 384)");

  // Check measure count
  const measureM = html.match(/\bmeasure\s*=\s*(\d+)\s*;/);
  console.log("measure:", measureM ? measureM[1] : "not found");

  // Check title
  const titleM = html.match(/title\s*=\s*"([^"]+)"/);
  console.log("title:", titleM ? titleM[1] : "not found");

  // Check ln[] entries
  const lnMatches = [...html.matchAll(/ln\[(\d+)\]=(\d+);/g)];
  console.log("ln[] entries:", lnMatches.length);

  // Check if(a) block exists
  const ifAMatch = html.match(/if\s*\(\s*a\s*\)\s*\{/);
  console.log("if(a) block:", ifAMatch ? "found at pos " + ifAMatch.index : "not found");

  // Check if(kuro) block exists
  const ifKuroMatch = html.match(/if\s*\(\s*kuro\s*\)\s*\{/);
  console.log("if(kuro) block:", ifKuroMatch ? "found at pos " + ifKuroMatch.index : "not found");

  // Check sp= array or sp[] assignments
  const spArrayMatch = html.match(/sp\s*=\s*\[/);
  const spAssignMatches = [...html.matchAll(/sp\[\s*(\d+)\s*\]\s*=\s*"[^"]*";/g)];
  console.log("sp=[ found:", spArrayMatch ? "yes at " + spArrayMatch.index : "no");
  console.log("sp[n]='...' assignments:", spAssignMatches.length);

  // Check c1[] CN arrays
  const cnMatches = [...html.matchAll(/c1\[(\d+)\]=/g)];
  console.log("c1[n] assignments:", cnMatches.length);

  // Print first 200 chars after if(a){
  if (ifAMatch) {
    const start = ifAMatch.index + ifAMatch[0].length;
    console.log("\nif(a) block start (200 chars):");
    console.log(html.slice(start, start + 200));
  }
})();
