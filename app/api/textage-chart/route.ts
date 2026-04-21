import { NextRequest, NextResponse } from "next/server";
import { parseHtml } from "@/lib/textage-chart-parser";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const ver = searchParams.get("ver");
  const key = searchParams.get("key");
  const diff = (searchParams.get("diff") ?? "A").toUpperCase();

  if (!ver || !key) {
    return NextResponse.json({ error: "ver and key are required" }, { status: 400 });
  }

  // textage LeggendariaはURLパラメータがX
  const urlDiff = diff === "L" ? "X" : diff;
  const url = `https://textage.cc/score/${ver}/${key}.html?1${urlDiff}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://textage.cc/score/",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `textage fetch failed: ${res.status}` }, { status: 502 });
    }

    const html = await res.text();
    // parseHtml内のdifficultyはXがLeggendaria
    const data = parseHtml(html, urlDiff);

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
