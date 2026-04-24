"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import type { Difficulty } from "@/types";

interface Props {
  songId: string;
  difficulty: Difficulty;
  onClose: () => void;
}

export default function PlaylistPicker({ songId, difficulty, onClose }: Props) {
  const { playlists, createPlaylist, addToPlaylist, removeFromPlaylist } = useAppStore();
  const [newName, setNewName] = useState("");

  const isInPlaylist = (playlistId: string) =>
    playlists.find((p) => p.id === playlistId)?.entries.some(
      (e) => e.songId === songId && e.difficulty === difficulty
    ) ?? false;

  const toggle = (playlistId: string) => {
    if (isInPlaylist(playlistId)) {
      removeFromPlaylist(playlistId, songId, difficulty);
    } else {
      addToPlaylist(playlistId, songId, difficulty);
    }
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const id = createPlaylist(name);
    addToPlaylist(id, songId, difficulty);
    setNewName("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-elevated)] rounded-t-2xl px-5 pt-4 pb-8 space-y-1 max-h-[70dvh] overflow-y-auto"
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

        {playlists.length === 0 && (
          <p className="text-[var(--fg-faint)] text-xs text-center py-3">
            プレイリストがまだありません
          </p>
        )}

        {playlists.map((pl) => {
          const checked = isInPlaylist(pl.id);
          return (
            <button
              key={pl.id}
              onClick={() => toggle(pl.id)}
              className="w-full flex items-center gap-3 py-2.5"
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                checked ? "bg-[var(--accent)] border-[var(--accent)]" : "border-[var(--border)]"
              }`}>
                {checked && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-[var(--fg)] text-sm text-left flex-1">{pl.name}</span>
              <span className="text-[var(--fg-faint)] text-xs">{pl.entries.length}曲</span>
            </button>
          );
        })}

        <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
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
  );
}
