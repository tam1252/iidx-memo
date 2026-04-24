"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";

interface Props {
  onClose: () => void;
}

export default function PlaylistModal({ onClose }: Props) {
  const { playlists, songs, createPlaylist, deletePlaylist, renamePlaylist } = useAppStore();
  const [newName, setNewName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const songMap = new Map(songs.map((s) => [s.id, s]));

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createPlaylist(name);
    setNewName("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col backdrop-blur-xl"
      style={{ backgroundColor: "color-mix(in srgb, var(--bg-base) 65%, transparent)" }}
      onClick={onClose}
    >
      <div className="flex flex-col h-full" onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between bg-[var(--bg-elevated)] border-b border-[var(--border)] shrink-0">
          <h2 className="text-[var(--fg)] font-bold text-base">プレイリスト</h2>
          <button onClick={onClose} className="text-[var(--fg-muted)] p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* 新規作成 */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="プレイリスト名"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1 bg-[var(--bg-input)] text-[var(--fg)] rounded-lg px-3 py-2 text-sm placeholder:text-[var(--fg-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="bg-[var(--accent)] disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              作成
            </button>
          </div>

          {playlists.length === 0 && (
            <p className="text-[var(--fg-faint)] text-sm text-center py-10">
              プレイリストがありません
            </p>
          )}

          {playlists.map((pl) => (
            <div key={pl.id} className="bg-[var(--bg-elevated)] rounded-lg overflow-hidden">
              <div className="flex items-center px-4 py-3 gap-3">
                {editingId === pl.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { renamePlaylist(pl.id, editName.trim() || pl.name); setEditingId(null); }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={() => { renamePlaylist(pl.id, editName.trim() || pl.name); setEditingId(null); }}
                    className="flex-1 bg-[var(--bg-input)] text-[var(--fg)] rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
                  />
                ) : (
                  <button
                    className="flex-1 text-left"
                    onClick={() => setExpandedId(expandedId === pl.id ? null : pl.id)}
                    onDoubleClick={() => { setEditingId(pl.id); setEditName(pl.name); }}
                  >
                    <span className="text-[var(--fg)] font-medium text-sm">{pl.name}</span>
                    <span className="text-[var(--fg-faint)] text-xs ml-2">{pl.entries.length}曲</span>
                  </button>
                )}
                <button
                  onClick={() => setDeletingId(pl.id)}
                  className="text-[var(--fg-faint)] p-1 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {expandedId === pl.id && (
                <div className="border-t border-[var(--border)] px-4 py-2 space-y-1.5">
                  {pl.entries.length === 0 ? (
                    <p className="text-[var(--fg-faint)] text-xs py-1">曲が追加されていません</p>
                  ) : (
                    pl.entries.map((e) => {
                      const s = songMap.get(e.songId);
                      return (
                        <div key={`${e.songId}__${e.difficulty}`} className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            e.difficulty === "L" ? "bg-purple-800 text-purple-200" : "bg-red-800 text-red-200"
                          }`}>
                            {e.difficulty}
                          </span>
                          <span className="text-[var(--fg-dim)] text-xs truncate">{s?.title ?? e.songId}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      {deletingId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setDeletingId(null)}
        >
          <div
            className="bg-[var(--bg-elevated)] rounded-xl p-5 w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[var(--fg)] font-medium text-sm mb-1">
              「{playlists.find((p) => p.id === deletingId)?.name}」を削除しますか？
            </p>
            <p className="text-[var(--fg-muted)] text-xs mb-4">この操作は取り消せません</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 rounded-lg text-sm text-[var(--fg-muted)] bg-[var(--bg-input)]"
              >
                キャンセル
              </button>
              <button
                onClick={() => { deletePlaylist(deletingId); setDeletingId(null); }}
                className="flex-1 py-2 rounded-lg text-sm text-white bg-red-600"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
