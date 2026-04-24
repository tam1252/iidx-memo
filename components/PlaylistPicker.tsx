"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import type { Difficulty } from "@/types";

interface Props {
  songId: string;
  availableDiffs: Difficulty[];
  onClose: () => void;
}

export default function PlaylistPicker({ songId, availableDiffs, onClose }: Props) {
  const { playlists, createPlaylist, addToPlaylist, removeFromPlaylist } = useAppStore();
  const [newName, setNewName] = useState("");

  const plMap = new Map(playlists.map((p) => [p.id, p]));
  const customPlaylists = playlists.filter((p) => !p.isFixed);

  const isIn = (playlistId: string, diff: Difficulty) =>
    plMap.get(playlistId)?.entries.some(
      (e) => e.songId === songId && e.difficulty === diff
    ) ?? false;

  const toggle = (playlistId: string, diff: Difficulty) => {
    if (isIn(playlistId, diff)) {
      removeFromPlaylist(playlistId, songId, diff);
    } else {
      addToPlaylist(playlistId, songId, diff);
    }
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const id = createPlaylist(name);
    const defaultDiff = availableDiffs[0];
    if (defaultDiff) addToPlaylist(id, songId, defaultDiff);
    setNewName("");
  };

  const DiffBadge = ({ playlistId, diff }: { playlistId: string; diff: Difficulty }) => {
    const checked = isIn(playlistId, diff);
    return (
      <button
        onClick={() => toggle(playlistId, diff)}
        className={`text-xs font-bold px-2 py-0.5 rounded transition-colors ${
          checked
            ? diff === "L"
              ? "bg-purple-800 text-purple-200"
              : "bg-red-800 text-red-200"
            : "border border-[var(--border)] text-[var(--fg-faint)]"
        }`}
      >
        {diff}
      </button>
    );
  };

  const CheckRow = ({ id, label, color }: { id: string; label: string; color?: string }) => {
    const pl = plMap.get(id);
    return (
      <div className="flex items-center gap-3 py-2.5">
        {color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
        <span className="text-[var(--fg)] text-sm text-left flex-1">{label}</span>
        <span className="text-[var(--fg-faint)] text-xs">{pl?.entries.length ?? 0}曲</span>
        <div className="flex gap-1">
          {availableDiffs.map((diff) => (
            <DiffBadge key={diff} playlistId={id} diff={diff} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-elevated)] rounded-t-2xl px-5 pt-4 pb-8 max-h-[80dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[var(--fg)] font-bold text-sm">プレイリストに追加</h3>
          <button onClick={onClose} className="text-[var(--fg-muted)] p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* カスタムセクション */}
        <div className="space-y-0">
          {customPlaylists.length === 0 && (
            <p className="text-[var(--fg-faint)] text-xs py-2">プレイリストがありません</p>
          )}
          {customPlaylists.map((pl) => (
            <CheckRow key={pl.id} id={pl.id} label={pl.name} />
          ))}

          <div className="flex gap-2 pt-3">
            <input
              type="text"
              placeholder="新規プレイリスト名"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1 bg-[var(--bg-input)] text-[var(--fg)] rounded-lg px-3 py-2 text-sm placeholder:text-[var(--fg-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="bg-[var(--accent)] disabled:opacity-40 text-white px-3 py-2 rounded-lg text-sm font-medium"
            >
              作成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
