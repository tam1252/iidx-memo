"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { filterAndSortSongs, getVersions } from "@/lib/filter";
import FilterPanel from "@/components/FilterPanel";
import SongCard from "@/components/SongCard";

export default function HomePage() {
  const { songs, isLoading, error, songsUpdatedAt, fetchSongs, filter, sort, initSongs } =
    useAppStore();

  useEffect(() => {
    initSongs();
  }, [initSongs]);

  const versions = getVersions(songs);
  const filtered = filterAndSortSongs(songs, filter, sort);

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-dvh">
      {/* ヘッダー */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div>
          <h1 className="text-white font-bold text-lg">IIDX Memo</h1>
          {songsUpdatedAt && (
            <p className="text-gray-400 text-xs">更新: {formatDate(songsUpdatedAt)}</p>
          )}
        </div>
        <button
          onClick={fetchSongs}
          disabled={isLoading}
          className="bg-blue-600 disabled:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          {isLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {isLoading ? "取得中..." : "更新"}
        </button>
      </div>

      {/* エラー */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* フィルタ */}
      <FilterPanel versions={versions} />

      {/* 曲一覧 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">BEMANI Wikiから曲データを取得中...</p>
          </div>
        ) : songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-gray-400 text-sm">曲データがありません</p>
            <button onClick={fetchSongs} className="text-blue-400 text-sm underline">
              取得する
            </button>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            <p className="text-gray-500 text-xs text-right">{filtered.length} / {songs.length} 曲</p>
            {filtered.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">該当する曲がありません</p>
            ) : (
              filtered.map((song) => (
                <SongCard key={song.id} song={song} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
