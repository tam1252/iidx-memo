"use client";

import { memo } from "react";
import Link from "next/link";
import type { SongEntry } from "@/types";
import type { BplCategory } from "@/lib/bpl";
import { BPL_COLORS } from "@/lib/bpl";
import DifficultyBadge from "./DifficultyBadge";
import { useAppStore } from "@/lib/store";

interface Props {
  entry: SongEntry;
  bplCategories?: BplCategory[];
}

const OPTION_COLORS: Record<string, string> = {
  正規: "bg-gray-600 text-gray-200",
  鏡:  "bg-blue-700 text-blue-100",
  乱:  "bg-orange-600 text-orange-100",
  R乱: "bg-red-700 text-red-100",
  S乱: "bg-purple-700 text-purple-100",
};

const SongCard = memo(function SongCard({ entry, bplCategories }: Props) {
  const { memos } = useAppStore();
  const { song, chart } = entry;

  const memo_ = memos[`${song.id}__${chart.difficulty}`];
  const options = memo_?.options ?? [];
  const hasNote = !!memo_?.note;

  return (
    <Link href={`/songs/${encodeURIComponent(song.id)}`}>
      <div className="bg-[var(--bg-elevated)] rounded-lg p-3 active:bg-[var(--bg-input)] transition-colors">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {options.map((op) => (
                <span key={op} className={`text-xs px-1.5 py-0.5 rounded font-medium ${OPTION_COLORS[op] ?? "bg-gray-600 text-gray-200"}`}>
                  {op}
                </span>
              ))}
              {hasNote && options.length === 0 && (
                <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded">MEMO</span>
              )}
              {hasNote && options.length > 0 && (
                <span className="text-xs text-[var(--fg-faint)]">✎</span>
              )}
            </div>
            <p className="text-[var(--fg)] font-medium text-sm mt-0.5 truncate">{song.title}</p>
            <p className="text-[var(--fg-muted)] text-xs truncate">{song.artist}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <DifficultyBadge difficulty={chart.difficulty} level={chart.level} />
            {chart.notes > 0 && (
              <span className="text-[var(--fg-dim)] text-xs font-medium">{chart.notes.toLocaleString()} Notes</span>
            )}
            <span className="text-[var(--fg-muted)] text-xs">BPM {song.bpm}</span>
            {bplCategories && bplCategories.length > 0 && (
              <div className="flex gap-0.5">
                {bplCategories.map((cat) => (
                  <span
                    key={cat}
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: BPL_COLORS[cat] }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});

export default SongCard;
