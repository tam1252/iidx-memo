"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import type { Difficulty, OptionType, SongMemo } from "@/types";
import type { ChartData } from "@/lib/textage-chart-parser";
import DifficultyBadge from "@/components/DifficultyBadge";
import PlaylistPicker from "@/components/PlaylistPicker";

const TextageChart = lazy(() => import("@/components/TextageChart"));

const OPTIONS: OptionType[] = ["正規", "鏡", "乱", "R乱", "S乱"];

const OPTION_COLORS: Record<OptionType, string> = {
  正規: "bg-rose-300",
  鏡: "bg-sky-300",
  乱: "bg-amber-300",
  R乱: "bg-emerald-300",
  S乱: "bg-violet-300",
};

const MEMO_DIFFS: Difficulty[] = ["A", "L"];

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const songId = decodeURIComponent(params.id as string);

  const { songs, getMemo, updateMemo, initSongs, playlists } = useAppStore();
  const [activeDiff, setActiveDiff] = useState<Difficulty>("A");
  const [showPicker, setShowPicker] = useState(false);
  const [localMemo, setLocalMemo] = useState<Partial<SongMemo>>({});
  const [saved, setSaved] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    if (songs.length === 0) initSongs();
  }, [songs.length, initSongs]);

  const song = songs.find((s) => s.id === songId);

  useEffect(() => {
    if (!song) return;
    const defaultDiff: Difficulty =
      song.charts.find((c) => c.difficulty === "A") ? "A" :
      song.charts.find((c) => c.difficulty === "L") ? "L" : "A";
    setActiveDiff(defaultDiff);
  }, [song]);

  useEffect(() => {
    if (!song) return;
    const memo = getMemo(songId, activeDiff);
    setLocalMemo(memo ?? { options: [], note: "" });
    setSaved(false);
    setChartData(null);
    setShowChart(false);
    setChartError(null);
  }, [songId, activeDiff, getMemo, song]);

  const handleSave = () => {
    if (!song) return;
    updateMemo({
      songId,
      difficulty: activeDiff,
      options: (localMemo.options as OptionType[]) ?? [],
      note: localMemo.note ?? "",
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleToggleChart = async () => {
    if (showChart) { setShowChart(false); return; }
    if (chartData) { setShowChart(true); return; }
    if (!song?.textageKey || song.textageVer === undefined) return;

    setChartLoading(true);
    setChartError(null);
    try {
      const res = await fetch(
        `/api/textage-chart?ver=${song.textageVer}&key=${encodeURIComponent(song.textageKey)}&diff=${activeDiff}`
      );
      if (!res.ok) throw new Error((await res.json()).error ?? "取得失敗");
      const data: ChartData = await res.json();
      setChartData(data);
      setShowChart(true);
    } catch (e) {
      setChartError(e instanceof Error ? e.message : "エラー");
    } finally {
      setChartLoading(false);
    }
  };

  if (songs.length === 0) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-4">
        <p className="text-[var(--fg-muted)]">曲が見つかりません</p>
        <button onClick={() => router.back()} className="text-[var(--accent)] underline text-sm">戻る</button>
      </div>
    );
  }

  const activeChart = song.charts.find((c) => c.difficulty === activeDiff);
  const memoDiffCharts = song.charts.filter((c) => MEMO_DIFFS.includes(c.difficulty));
  const hasTextage = !!(song.textageKey && song.textageVer !== undefined);
  const textageUrl = hasTextage
    ? `https://textage.cc/score/${song.textageVer}/${song.textageKey}.html?1${activeDiff === "L" ? "X" : activeDiff}`
    : null;

  return (
    <div className="flex flex-col h-dvh">
      {/* ヘッダー */}
      <div className="bg-[var(--bg-elevated)] px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[var(--fg-muted)] p-1 -ml-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {song.isNew && (
                <span className="text-xs bg-[var(--accent)] text-white px-1.5 py-0.5 rounded font-bold shrink-0">NEW</span>
              )}
              <h1 className="text-[var(--fg)] font-bold text-base truncate">{song.title}</h1>
            </div>
            <p className="text-[var(--fg-muted)] text-xs truncate">{song.artist}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 曲情報 */}
        <div className="bg-[var(--bg-elevated)] rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[var(--fg-muted)] text-sm">BPM</span>
            <span className="text-[var(--fg)] font-bold">{song.bpm}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[var(--fg-muted)] text-sm">バージョン</span>
            <span className="text-[var(--fg)] text-sm">{song.version}</span>
          </div>
          <div className="border-t border-[var(--border)] pt-3 mt-2">
            <div className="flex gap-2 flex-wrap">
              {song.charts.map((c) => (
                <div key={c.difficulty} className="flex items-center gap-1">
                  <DifficultyBadge difficulty={c.difficulty} level={c.level} />
                  {(c.difficulty === "A" || c.difficulty === "L") && c.notes > 0 && (
                    <span className="text-[var(--fg-muted)] text-xs">{c.notes.toLocaleString()}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* メモエリア（A/Lのみ） */}
        {memoDiffCharts.length > 0 && (
          <div className="bg-[var(--bg-elevated)] rounded-lg p-4 space-y-4">
            {/* 難易度切り替えタブ */}
            {memoDiffCharts.length > 1 && (
              <div className="flex gap-2">
                {memoDiffCharts.map((c) => (
                  <button key={c.difficulty} onClick={() => setActiveDiff(c.difficulty)}>
                    <DifficultyBadge difficulty={c.difficulty} level={c.level} selected={activeDiff === c.difficulty} />
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DifficultyBadge difficulty={activeDiff} level={activeChart?.level} />
                <span className="text-[var(--fg)] font-medium text-sm">メモ</span>
              </div>
              <div className="flex items-center gap-2">
                {/* ハートボタン: プレイリスト追加 */}
                {(() => {
                  const inAny = playlists.some((pl) =>
                    pl.entries.some((e) => e.songId === songId && e.difficulty === activeDiff)
                  );
                  return (
                    <button
                      onClick={() => setShowPicker(true)}
                      className="p-1 text-[var(--fg-muted)]"
                      aria-label="プレイリストに追加"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={inAny ? "currentColor" : "none"} stroke="currentColor"
                        style={{ color: inAny ? "#f43f5e" : undefined }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  );
                })()}
              {hasTextage && (
                <>
                  <button
                    onClick={handleToggleChart}
                    disabled={chartLoading}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                      showChart
                        ? "bg-[var(--accent)] text-white border-transparent"
                        : "bg-transparent text-[var(--fg-muted)] border-[var(--border)]"
                    }`}
                  >
                    {chartLoading
                      ? <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                    }
                    譜面
                  </button>
                  <a
                    href={textageUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--fg-muted)] border border-[var(--border)]"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    textage
                  </a>
                </>
              )}
              </div>
            </div>

            {chartError && (
              <p className="text-red-400 text-xs">{chartError}</p>
            )}
            {showChart && chartData && (
              <Suspense fallback={<div className="h-48 bg-[var(--bg-base)] rounded animate-pulse" />}>
                <TextageChart data={chartData} />
              </Suspense>
            )}

            {/* オプション選択 */}
            <div>
              <p className="text-[var(--fg-muted)] text-xs mb-2">オプション</p>
              <div className="flex flex-wrap gap-2">
                {OPTIONS.map((opt) => {
                  const selected = (localMemo.options ?? []).includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() =>
                        setLocalMemo((m) => {
                          const cur = m.options ?? [];
                          return { ...m, options: selected ? cur.filter((o) => o !== opt) : [...cur, opt] };
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                        selected
                          ? `${OPTION_COLORS[opt]} text-gray-900 border-transparent`
                          : "bg-transparent text-[var(--fg-muted)] border-[var(--border)]"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 備考 */}
            <div>
              <p className="text-[var(--fg-muted)] text-xs mb-2">備考 / ソフランメモ</p>
              <textarea
                value={localMemo.note ?? ""}
                onChange={(e) => setLocalMemo((m) => ({ ...m, note: e.target.value }))}
                placeholder="ソフランのタイミング、緑数字の設定など..."
                rows={4}
                className="w-full bg-[var(--bg-input)] text-[var(--fg)] rounded-lg px-3 py-2.5 text-sm placeholder:text-[var(--fg-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)] resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 保存ボタン */}
      {memoDiffCharts.length > 0 && (
        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-base)]">
          <button
            onClick={handleSave}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
              saved ? "bg-green-600 text-white" : "bg-[var(--accent)] active:bg-[var(--accent-dark)] text-white"
            }`}
          >
            {saved ? "保存しました" : "保存"}
          </button>
        </div>
      )}

      {showPicker && (
        <PlaylistPicker
          songId={songId}
          availableDiffs={memoDiffCharts.map((c) => c.difficulty)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
