async function fetchShiftJis(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" } });
  const buf = await res.arrayBuffer();
  return new TextDecoder("shift-jis").decode(buf);
}
async function main() {
  const js = await fetchShiftJis("https://textage.cc/score/titletbl.js");
  const re = /^'([^']+)'\s*:\s*\[([^\]]+)\]/gm;
  let m;
  while ((m = re.exec(js)) !== null) {
    const strs = [...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(x => x[1]);
    const title = (strs[2] ?? "").toLowerCase();
    if (title.includes("chase")) {
      console.log(`key=${m[1]} ver=${m[2].split(",")[0].trim()} title=${JSON.stringify(strs[2])}`);
    }
  }
}
main().catch(console.error);
