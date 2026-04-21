"use client";

import Link from "next/link";
import type { SongEntry } from "@/types";
import DifficultyBadge from "./DifficultyBadge";
import { useAppStore } from "@/lib/store";

interface Props {
  entry: SongEntry;
}

export default function SongCard({ entry }: Props) {
  const { memos } = useAppStore();
  const { song, chart } = entry;

  const memo = memos[`${song.id}__${chart.difficulty}`];
  const hasMemo = memo && (memo.options?.length > 0 || memo.note);

  return (
    <Link href={`/songs/${encodeURIComponent(song.id)}`}>
      <div className="bg-gray-800 rounded-lg p-3 active:bg-gray-700 transition-colors">
        <div className="flex items-start gap-2">
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
            {chart.notes > 0 && (
              <span className="text-gray-300 text-xs font-medium">{chart.notes.toLocaleString()}</span>
            )}
            <span className="text-gray-400 text-xs">BPM {song.bpm}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
