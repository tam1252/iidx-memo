"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { filterAndSortSongs, getVersions } from "@/lib/filter";
import FilterPanel from "@/components/FilterPanel";
import SongCard from "@/components/SongCard";

// カード1枚 + gap の高さ(px) — SongCard の p-3 + 2行テキスト + space-y-2
const CARD_SLOT_H = 82;
// ページネーションバーの高さ(px)
const PAGINATION_H = 57;
// リストエリア上部 padding(px) — p-3
const LIST_PADDING_TOP = 12;

export default function HomePage() {
  const { songs, isLoading, error, songsUpdatedAt, fetchSongs, filter, sort, initSongs, listPage, setListPage } =
    useAppStore();
  const [pageSize, setPageSize] = useState(5);
  const listContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initSongs();
  }, [initSongs]);

  // コンテナの高さからページサイズを計算
  useEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;
    const calc = (h: number) => {
      const usable = h - PAGINATION_H - LIST_PADDING_TOP;
      setPageSize(Math.max(3, Math.floor(usable / CARD_SLOT_H)));
    };
    calc(el.clientHeight);
    const ro = new ResizeObserver(([entry]) => calc(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const versions = getVersions(songs);
  const filtered = filterAndSortSongs(songs, filter, sort);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(listPage, totalPages - 1);
  const pageItems = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

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
        <div className="flex items-center gap-2">
        <Link href="/settings" className="p-1.5 text-gray-400 active:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
        <button
          onClick={fetchSongs}
          disabled={isLoading}
          className="bg-[var(--accent)] disabled:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
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
      <div ref={listContainerRef} className="flex-1 flex flex-col min-h-0">
        {isLoading && songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">BEMANI Wikiから曲データを取得中...</p>
          </div>
        ) : songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3">
            <p className="text-gray-400 text-sm">曲データがありません</p>
            <button onClick={fetchSongs} className="text-blue-400 text-sm underline">
              取得する
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 p-3 space-y-2">
              {filtered.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">該当する曲がありません</p>
              ) : (
                pageItems.map((entry) => (
                  <SongCard key={`${entry.song.id}__${entry.chart.difficulty}`} entry={entry} />
                ))
              )}
            </div>

            {/* ページネーション */}
            {filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between bg-gray-900 shrink-0">
                <button
                  onClick={() => setListPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="p-2 rounded-lg disabled:opacity-30 text-gray-300 active:bg-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-gray-400 text-sm">
                  {currentPage + 1} / {totalPages}
                  <span className="text-gray-600 text-xs ml-2">({filtered.length} 件)</span>
                </span>
                <button
                  onClick={() => setListPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-2 rounded-lg disabled:opacity-30 text-gray-300 active:bg-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
