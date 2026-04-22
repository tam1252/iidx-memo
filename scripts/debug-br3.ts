async function main() {
  const res = await fetch("https://textage.cc/score/33/_beyondr.html?1A", {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  const html = await res.text();
  
  // Look for declared note count in HTML
  const notesMatch = html.match(/total[_\s]*notes?\s*[=:]\s*(\d+)/i) 
    || html.match(/notes?\s*=\s*(\d+)/i)
    || html.match(/cn\s*=\s*(\d+)/i);
  console.log("declared notes match:", notesMatch?.[0]);
  
  // Look for 'notes' variable or any count declaration
  const lines = html.split("\n").filter(l => 
    l.includes("notes") || l.includes("total") || l.includes("count")
  );
  console.log("\nRelevant lines:");
  lines.slice(0,20).forEach(l => console.log(" ", l.trim()));
  
  // Look for n1=... n2=... patterns (note array size)
  const nMatches = html.match(/\bn\d+\s*=/g) ?? [];
  console.log("\nn-var assignments count:", nMatches.length);
  
  // Show the if(a){ block's first 50 chars
  const aIdx = html.search(/if\s*\(\s*a\s*\)/);
  if (aIdx !== -1) {
    console.log("\nif(a) block start:", html.slice(aIdx, aIdx+200));
  }
}
main().catch(console.error);
