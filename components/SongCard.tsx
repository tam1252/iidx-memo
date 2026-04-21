"use client";

import Link from "next/link";
import type { SongEntry } from "@/types";
import DifficultyBadge from "./DifficultyBadge";
import { useAppStore } from "@/lib/store";

interface Props {
  entry: SongEntry;
}

const TEXTAGE_DIFF: Record<string, string> = { A: "1A00", L: "1L00" };

function textageUrl(key: string, diff: string): string {
  const anchor = TEXTAGE_DIFF[diff] ?? "1A00";
  return `https://textage.cc/score/${key}.html#${anchor}`;
}

export default function SongCard({ entry }: Props) {
  const { memos } = useAppStore();
  const { song, chart } = entry;

  const memo = memos[`${song.id}__${chart.difficulty}`];
  const hasMemo = memo && (memo.options?.length > 0 || memo.note);

  const otherCharts = song.charts.filter((c) => c.difficulty !== chart.difficulty);

  return (
    <div className="bg-gray-800 rounded-lg p-3 active:bg-gray-700 transition-colors">
      <div className="flex items-start gap-2">
        <Link href={`/songs/${encodeURIComponent(song.id)}`} className="min-w-0 flex-1">
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
        </Link>
        <div className="flex items-start gap-2 shrink-0">
          <div className="flex flex-col items-end gap-1">
            <DifficultyBadge difficulty={chart.difficulty} level={chart.level} />
            {chart.notes > 0 && (
              <span className="text-gray-300 text-xs font-medium">{chart.notes.toLocaleString()}</span>
            )}
            <span className="text-gray-400 text-xs">BPM {song.bpm}</span>
          </div>
          {song.textageKey && (
            <a
              href={textageUrl(song.textageKey, chart.difficulty)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 text-gray-500 active:text-blue-400 transition-colors p-1 -mr-1"
              aria-label="textageで見る"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
      {otherCharts.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {otherCharts.map((c) => (
            <DifficultyBadge key={c.difficulty} difficulty={c.difficulty} level={c.level} />
          ))}
        </div>
      )}
    </div>
  );
}
