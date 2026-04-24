"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { filterAndSortSongs, getVersions } from "@/lib/filter";
import FilterPanel from "@/components/FilterPanel";
import SongCard from "@/components/SongCard";
import PlaylistModal from "@/components/PlaylistModal";
import HelpModal from "@/components/HelpModal";

const CARD_SLOT_H = 82;
const PAGINATION_H = 57;
const LIST_PADDING_TOP = 12;
const SWIPE_THRESHOLD = 50;

export default function HomePage() {
  const { songs, isLoading, error, songsUpdatedAt, fetchSongs, filter, sort, initSongs, listPage, setListPage } =
    useAppStore();
  const [pageSize, setPageSize] = useState(5);
  const [showHelp, setShowHelp] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ x: number; y: number; locked: boolean } | null>(null);
  const containerWidthRef = useRef(0);
  const settleToPageRef = useRef<number | null>(null);
  const isSettlingRef = useRef(false);
  const currentPageRef = useRef(0);
  const totalPagesRef = useRef(1);
  const dragDxRef = useRef(0);

  // transform を React を通さず直接 DOM に書く → touchmove で再レンダリングしない
  const setCarouselTransform = (dx: number, withTransition = false) => {
    const el = carouselRef.current;
    if (!el) return;
    el.style.transition = withTransition ? "transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)" : "none";
    el.style.transform = `translateX(calc(-33.333% + ${dx}px))`;
    dragDxRef.current = dx;
  };

  useEffect(() => {
    initSongs();
  }, [initSongs]);

  useEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;
    const calc = (h: number) => {
      const usable = h - PAGINATION_H - LIST_PADDING_TOP;
      setPageSize(Math.max(3, Math.floor(usable / CARD_SLOT_H)));
    };
    containerWidthRef.current = el.clientWidth;
    calc(el.clientHeight);
    const ro = new ResizeObserver(([entry]) => {
      containerWidthRef.current = el.clientWidth;
      calc(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Non-passive touchmove: 横スワイプ確定後に縦スクロールを止める
  useEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;
    const onMove = (e: TouchEvent) => {
      const t = touchRef.current;
      if (!t) return;
      const dx = e.touches[0].clientX - t.x;
      const dy = e.touches[0].clientY - t.y;
      if (!t.locked) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        if (Math.abs(dy) >= Math.abs(dx)) { touchRef.current = null; return; }
        t.locked = true;
      }
      e.preventDefault();
      const cp = currentPageRef.current;
      const tp = totalPagesRef.current;
      const raw = dx < 0
        ? (cp < tp - 1 ? dx : dx * 0.2)
        : (cp > 0 ? dx : dx * 0.2);
      setCarouselTransform(raw); // state 更新なし → 再レンダリングしない
    };
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => el.removeEventListener("touchmove", onMove);
  }, []);

  const versions    = useMemo(() => getVersions(songs), [songs]);
  const filtered    = useMemo(() => filterAndSortSongs(songs, filter, sort), [songs, filter, sort]);
  const totalPages  = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize]);
  const currentPage = Math.min(listPage, totalPages - 1);
  const pageItems      = useMemo(() => filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize), [filtered, currentPage, pageSize]);
  const prevPageItems  = useMemo(() =>
    currentPage > 0 ? filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize) : [],
    [filtered, currentPage, pageSize]);
  const nextPageItems  = useMemo(() =>
    currentPage < totalPages - 1 ? filtered.slice((currentPage + 1) * pageSize, (currentPage + 2) * pageSize) : [],
    [filtered, currentPage, totalPages, pageSize]);

  // ページ変更後、ブラウザのペイント前に transform をリセット（チラつきなし）
  useLayoutEffect(() => {
    setCarouselTransform(0, false);
    isSettlingRef.current = false;
  }, [currentPage]);

  currentPageRef.current = currentPage;
  totalPagesRef.current = totalPages;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSettlingRef.current) return;
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, locked: false };
  };

  const handleTouchEnd = () => {
    touchRef.current = null;
    const dx = dragDxRef.current;
    const w = containerWidthRef.current || 375;
    const cp = currentPageRef.current;
    const tp = totalPagesRef.current;

    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      if (dx < 0 && cp < tp - 1) {
        settleToPageRef.current = cp + 1;
        setCarouselTransform(-w, true);
        isSettlingRef.current = true;
        return;
      }
      if (dx > 0 && cp > 0) {
        settleToPageRef.current = cp - 1;
        setCarouselTransform(w, true);
        isSettlingRef.current = true;
        return;
      }
    }
    // スワイプ不成立: 元位置に戻す
    settleToPageRef.current = null;
    setCarouselTransform(0, true);
    isSettlingRef.current = true;
  };

  const handleTouchCancel = () => {
    touchRef.current = null;
    settleToPageRef.current = null;
    setCarouselTransform(0, true);
    isSettlingRef.current = true;
  };

  const handleTransitionEnd = () => {
    const targetPage = settleToPageRef.current;
    settleToPageRef.current = null;
    if (targetPage !== null) {
      setListPage(targetPage); // → useLayoutEffect でリセット
    } else {
      isSettlingRef.current = false;
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderSlot = (items: typeof pageItems) =>
    items.map((entry) => (
      <SongCard key={`${entry.song.id}__${entry.chart.difficulty}`} entry={entry} />
    ));

  return (
    <div className="flex flex-col h-dvh">
      {/* ヘッダー */}
      <div className="bg-[var(--bg-elevated)] px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
        <div>
          <h1 className="text-[var(--fg)] font-bold text-lg">IIDX Memo</h1>
          {songsUpdatedAt && (
            <p className="text-[var(--fg-muted)] text-xs">更新: {formatDate(songsUpdatedAt)}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPlaylists(true)}
            className="p-1.5 text-[var(--fg-muted)] active:text-[var(--fg)]"
            aria-label="プレイリスト"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="p-1.5 text-[var(--fg-muted)] active:text-[var(--fg)]"
            aria-label="使い方"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <Link href="/settings" className="p-1.5 text-[var(--fg-muted)] active:text-[var(--fg)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <button
            onClick={fetchSongs}
            disabled={isLoading}
            className="bg-[var(--accent)] disabled:bg-[var(--bg-input)] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
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
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <p className="text-[var(--fg-muted)] text-sm">BEMANI Wikiから曲データを取得中...</p>
          </div>
        ) : songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3">
            <p className="text-[var(--fg-muted)] text-sm">曲データがありません</p>
            <button onClick={fetchSongs} className="text-[var(--accent)] text-sm underline">
              取得する
            </button>
          </div>
        ) : (
          <>
            {/* スワイプ可能エリア */}
            <div
              className="flex-1 overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
            >
              {filtered.length === 0 ? (
                <p className="text-[var(--fg-muted)] text-sm text-center py-8">該当する曲がありません</p>
              ) : (
                <div
                  ref={carouselRef}
                  className="flex h-full"
                  style={{ width: "300%", willChange: "transform", transform: "translateX(-33.333%)" }}
                  onTransitionEnd={handleTransitionEnd}
                >
                  <div className="p-3 space-y-2" style={{ width: "33.333%" }}>
                    {renderSlot(prevPageItems)}
                  </div>
                  <div className="p-3 space-y-2" style={{ width: "33.333%" }}>
                    {renderSlot(pageItems)}
                  </div>
                  <div className="p-3 space-y-2" style={{ width: "33.333%" }}>
                    {renderSlot(nextPageItems)}
                  </div>
                </div>
              )}
            </div>

            {/* ページネーション */}
            {filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-base)] shrink-0">
                <button
                  onClick={() => setListPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="p-2 rounded-lg disabled:opacity-30 text-[var(--fg-dim)] active:bg-[var(--bg-input)]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-[var(--fg-muted)] text-sm">
                  {currentPage + 1} / {totalPages}
                  <span className="text-[var(--fg-faint)] text-xs ml-2">({filtered.length} 件)</span>
                </span>
                <button
                  onClick={() => setListPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-2 rounded-lg disabled:opacity-30 text-[var(--fg-dim)] active:bg-[var(--bg-input)]"
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
      {showPlaylists && <PlaylistModal onClose={() => setShowPlaylists(false)} />}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
