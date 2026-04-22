(async () => {
  const url = "https://textage.cc/score/21/verflcht.html?1XC00";
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  const html = await res.text();

  // if(kuro)とif(a)の周辺を表示
  console.log("=== pos 280-600 ===");
  console.log(JSON.stringify(html.slice(280, 600)));

  console.log("\n=== full HTML ===");
  console.log(html);
})();
