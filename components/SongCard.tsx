"use client";

import Link from "next/link";
import type { Song } from "@/types";
import DifficultyBadge from "./DifficultyBadge";
import { useAppStore } from "@/lib/store";

interface Props {
  song: Song;
}

export default function SongCard({ song }: Props) {
  const { memos } = useAppStore();

  // 表示優先: A > L > H > N
  const displayChart =
    song.charts.find((c) => c.difficulty === "A") ??
    song.charts.find((c) => c.difficulty === "L") ??
    song.charts[song.charts.length - 1];

  // A/Lにメモがあるかチェック
  const hasMemo = song.charts
    .filter((c) => c.difficulty === "A" || c.difficulty === "L")
    .some((c) => {
      const memo = memos[`${song.id}__${c.difficulty}`];
      return memo && (memo.option || memo.note);
    });

  return (
    <Link href={`/songs/${encodeURIComponent(song.id)}`}>
      <div className="bg-gray-800 rounded-lg p-3 active:bg-gray-700 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {song.isNew && (
                <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">NEW</span>
              )}
              {hasMemo && (
                <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded">MEMO</span>
              )}
            </div>
            <p className="text-white font-medium text-sm mt-0.5 truncate">{song.title}</p>
            <p className="text-gray-400 text-xs truncate">{song.artist}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <DifficultyBadge difficulty={displayChart.difficulty} level={displayChart.level} />
            <span className="text-gray-400 text-xs">BPM {song.bpm}</span>
            {displayChart.notes > 0 && (
              <span className="text-gray-400 text-xs">{displayChart.notes.toLocaleString()} notes</span>
            )}
          </div>
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          {song.charts.map((c) => (
            <DifficultyBadge key={c.difficulty} difficulty={c.difficulty} level={c.level} />
          ))}
        </div>
      </div>
    </Link>
  );
}
