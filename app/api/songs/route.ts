import { NextResponse } from "next/server";
import { fetchSongsFromWiki } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const songs = await fetchSongsFromWiki();
    return NextResponse.json({ songs, fetchedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Failed to fetch songs from wiki:", error);
    return NextResponse.json(
      { error: "曲データの取得に失敗しました。しばらく待ってから再試行してください。" },
      { status: 500 }
    );
  }
}
