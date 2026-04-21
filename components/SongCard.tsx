"use client";

import Link from "next/link";
import type { Song } from "@/types";
import type { Difficulty } from "@/types";
import DifficultyBadge from "./DifficultyBadge";
import { useAppStore } from "@/lib/store";

interface Props {
  song: Song;
  activeDifficulty: Difficulty;
}

export default function SongCard({ song, activeDifficulty }: Props) {
  const { memos } = useAppStore();
  const chart = song.charts.find((c) => c.difficulty === activeDifficulty) ?? song.charts[song.charts.length - 1];

  // メモがあるかチェック
  const hasMemo = song.charts.some((c) => {
    const key = `${song.id}__${c.difficulty}`;
    const memo = memos[key];
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
            <DifficultyBadge difficulty={chart.difficulty} level={chart.level} />
            <span className="text-gray-400 text-xs">BPM {song.bpm}</span>
            {chart.notes > 0 && (
              <span className="text-gray-400 text-xs">{chart.notes.toLocaleString()} notes</span>
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
