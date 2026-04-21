"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import type { Difficulty, OptionType, SongMemo } from "@/types";
import DifficultyBadge from "@/components/DifficultyBadge";

const OPTIONS: OptionType[] = ["正規", "鏡", "乱", "R乱", "S乱"];

const OPTION_COLORS: Record<OptionType, string> = {
  正規: "bg-gray-600",
  鏡: "bg-blue-700",
  乱: "bg-orange-700",
  R乱: "bg-red-700",
  S乱: "bg-purple-700",
};

// オプション・メモ登録対象の難易度
const MEMO_DIFFS: Difficulty[] = ["A", "L"];

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const songId = decodeURIComponent(params.id as string);

  const { songs, getMemo, updateMemo, initSongs } = useAppStore();
  const [activeDiff, setActiveDiff] = useState<Difficulty>("A");
  const [localMemo, setLocalMemo] = useState<Partial<SongMemo>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (songs.length === 0) initSongs();
  }, [songs.length, initSongs]);

  const song = songs.find((s) => s.id === songId);

  useEffect(() => {
    if (!song) return;
    // A優先、なければL
    const defaultDiff: Difficulty =
      song.charts.find((c) => c.difficulty === "A") ? "A" :
      song.charts.find((c) => c.difficulty === "L") ? "L" : "A";
    setActiveDiff(defaultDiff);
  }, [song]);

  useEffect(() => {
    if (!song) return;
    const memo = getMemo(songId, activeDiff);
    setLocalMemo(memo ?? { option: null, note: "" });
    setSaved(false);
  }, [songId, activeDiff, getMemo, song]);

  const handleSave = () => {
    if (!song) return;
    updateMemo({
      songId,
      difficulty: activeDiff,
      option: (localMemo.option as OptionType) ?? null,
      note: localMemo.note ?? "",
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (songs.length === 0) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-4">
        <p className="text-gray-400">曲が見つかりません</p>
        <button onClick={() => router.back()} className="text-blue-400 underline text-sm">
          戻る
        </button>
      </div>
    );
  }

  const activeChart = song.charts.find((c) => c.difficulty === activeDiff);
  const memoDiffCharts = song.charts.filter((c) => MEMO_DIFFS.includes(c.difficulty));
  const infoCharts = song.charts.filter((c) => !MEMO_DIFFS.includes(c.difficulty));

  return (
    <div className="flex flex-col h-dvh">
      {/* ヘッダー */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 p-1 -ml-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {song.isNew && (
                <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold shrink-0">NEW</span>
              )}
              <h1 className="text-white font-bold text-base truncate">{song.title}</h1>
            </div>
            <p className="text-gray-400 text-xs truncate">{song.artist}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* 曲情報 */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm">BPM</span>
            <span className="text-white font-bold">{song.bpm}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm">バージョン</span>
            <span className="text-white text-sm">{song.version}</span>
          </div>
          {/* 全難易度表示（情報のみ） */}
          <div className="border-t border-gray-700 pt-3 mt-3">
            <div className="flex gap-2 flex-wrap">
              {song.charts.map((c) => (
                <DifficultyBadge key={c.difficulty} difficulty={c.difficulty} level={c.level} />
              ))}
            </div>
          </div>
        </div>

        {/* メモエリア（A/Lのみ） */}
        {memoDiffCharts.length > 0 && (
          <div>
            {/* 難易度切り替えタブ */}
            {memoDiffCharts.length > 1 && (
              <div className="flex gap-2 mb-4">
                {memoDiffCharts.map((c) => (
                  <button
                    key={c.difficulty}
                    onClick={() => setActiveDiff(c.difficulty)}
                    className="flex items-center gap-1"
                  >
                    <DifficultyBadge
                      difficulty={c.difficulty}
                      level={c.level}
                      selected={activeDiff === c.difficulty}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <DifficultyBadge difficulty={activeDiff} level={activeChart?.level} />
              <span className="text-white font-medium text-sm">メモ</span>
            </div>

            {/* オプション選択 */}
            <div className="mb-4">
              <p className="text-gray-400 text-xs mb-2">オプション</p>
              <div className="flex flex-wrap gap-2">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() =>
                      setLocalMemo((m) => ({
                        ...m,
                        option: m.option === opt ? null : opt,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      localMemo.option === opt
                        ? `${OPTION_COLORS[opt]} text-white border-transparent`
                        : "bg-transparent text-gray-400 border-gray-600"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* 備考 */}
            <div>
              <p className="text-gray-400 text-xs mb-2">備考 / ソフランメモ</p>
              <textarea
                value={localMemo.note ?? ""}
                onChange={(e) => setLocalMemo((m) => ({ ...m, note: e.target.value }))}
                placeholder="ソフランのタイミング、緑数字の設定など..."
                rows={5}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 保存ボタン */}
      {memoDiffCharts.length > 0 && (
        <div className="p-4 border-t border-gray-700 bg-gray-900">
          <button
            onClick={handleSave}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
              saved
                ? "bg-green-600 text-white"
                : "bg-blue-600 active:bg-blue-700 text-white"
            }`}
          >
            {saved ? "保存しました" : "保存"}
          </button>
        </div>
      )}
    </div>
  );
}
