(async () => {
  const url = "https://textage.cc/score/16/3y3s.html?1A";
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  const html = await res.text();

  // 全構造を表示
  console.log("=== FULL HTML ===");
  console.log(html);
})();
