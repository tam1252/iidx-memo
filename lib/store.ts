"use client";

import { create } from "zustand";
import type { Song, SongMemo, FilterState, SortState, Difficulty } from "@/types";
import { saveSongs, loadSongs, getSongsUpdatedAt, saveMemo, loadAllMemos } from "./storage";

interface AppState {
  songs: Song[];
  memos: Record<string, SongMemo>;
  isLoading: boolean;
  error: string | null;
  songsUpdatedAt: string | null;
  filter: FilterState;
  sort: SortState;
  listPage: number;

  initSongs: () => void;
  fetchSongs: () => Promise<void>;
  getMemo: (songId: string, difficulty: Difficulty) => SongMemo | null;
  updateMemo: (memo: SongMemo) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  setSort: (sort: SortState) => void;
  setListPage: (page: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  songs: [],
  memos: {},
  isLoading: false,
  error: null,
  songsUpdatedAt: null,
  filter: {
    levels: [],
    difficulties: [],
    versions: [],
    searchText: "",
  },
  sort: {
    field: "title",
    order: "asc",
  },
  listPage: 0,

  initSongs: () => {
    const songs = loadSongs();
    const memos = loadAllMemos();
    const songsUpdatedAt = getSongsUpdatedAt();
    if (songs) {
      set({ songs, memos, songsUpdatedAt });
    } else {
      set({ memos });
      get().fetchSongs();
    }
  },

  fetchSongs: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/songs");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "取得失敗");
      }
      const data = await res.json();
      saveSongs(data.songs);
      set({
        songs: data.songs,
        songsUpdatedAt: data.fetchedAt,
        isLoading: false,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "不明なエラー",
        isLoading: false,
      });
    }
  },

  getMemo: (songId, difficulty) => {
    return get().memos[`${songId}__${difficulty}`] ?? null;
  },

  updateMemo: (memo) => {
    saveMemo(memo);
    set((s) => ({
      memos: { ...s.memos, [`${memo.songId}__${memo.difficulty}`]: memo },
    }));
  },

  setFilter: (filter) => {
    set((s) => ({ filter: { ...s.filter, ...filter }, listPage: 0 }));
  },

  setSort: (sort) => {
    set({ sort, listPage: 0 });
  },

  setListPage: (page) => {
    set({ listPage: page });
  },
}));
