import { parseHtml } from "../lib/textage-chart-parser";

// パーサー内部をデバッグするため、extractDifficultyBlock相当の処理を直接実行
async function main() {
  const url = "https://textage.cc/score/16/3y3s.html?1A";
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://textage.cc/score/" },
  });
  const html = await res.text();

  // if(k) ブロックの sp=[] を手動で探す
  const spArrayMatches = [...html.matchAll(/sp\s*=\s*\[/g)];
  console.log("All sp=[ positions:", spArrayMatches.map(m => m.index));

  // if(a) ブロックの開始位置を探す
  const ifAMatches = [...html.matchAll(/if\s*\(\s*a\s*\)\s*\{/g)];
  console.log("if(a) positions:", ifAMatches.map(m => m.index));

  // 最初の if(a) ブロック (notes=1871) の直前の sp=[]
  const ifAPos = ifAMatches[0].index!;
  console.log("\nif(a) at pos:", ifAPos);

  // preceding の中の最後の sp=[
  const preceding = html.slice(0, ifAPos);
  const precSpMatches = [...preceding.matchAll(/sp\s*=\s*\[/g)];
  console.log("sp=[ positions before if(a):", precSpMatches.map(m => m.index));

  if (precSpMatches.length > 0) {
    const lastSpPos = precSpMatches[precSpMatches.length - 1].index!;
    const spEnd = html.indexOf("];", lastSpPos);
    console.log("Last sp=[ at:", lastSpPos, "ends at:", spEnd);

    // parentSp のサイズを確認
    const parentBlock = html.slice(lastSpPos, spEnd + 2);
    // split by comma outside quotes to count entries
    const entries = parentBlock.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    console.log("Parent sp=[] entries count:", entries.length);

    // sp[56..63], sp[71..74] が入っているか確認
    for (const idx of [20, 28, 56, 57, 58, 59, 60, 61, 62, 63, 71, 72, 73, 74]) {
      const entry = entries[idx];
      console.log(`  parentSp[${idx}]:`, entry ? entry.trim() : "(empty/undefined)");
    }
  }

  // if(k)ブロックの直後から if(a) 直前までの個別代入を探す
  console.log("\nIndividual sp[n]=sp[m] assignments before if(a):");
  const chainedAssigns = [...preceding.matchAll(/sp\[\s*(\d+)\s*\]\s*=\s*sp\[\s*(\d+)\s*\];/g)];
  for (const m of chainedAssigns.slice(-10)) {
    console.log(`  sp[${m[1]}]=sp[${m[2]}] at pos ${m.index}`);
  }

  // 実際のパース結果
  const data = parseHtml(html, "A");
  const perMeasure: Record<number, number> = {};
  for (const n of data.notes) perMeasure[n.measure] = (perMeasure[n.measure] ?? 0) + 1;

  console.log("\nActual parse: total_notes =", data.total_notes);
  console.log("Missing from 1871:", 1871 - data.total_notes, "notes");

  // 空の小節（譜面データのはずなのに0）
  const maxMeasure = data.measure_count || 94;
  const emptyMeasures = [];
  for (let m = 1; m <= maxMeasure; m++) {
    if (!perMeasure[m]) emptyMeasures.push(m);
  }
  console.log("Measures with 0 notes (first 20):", emptyMeasures.slice(0, 20));
}

main().catch(console.error);
