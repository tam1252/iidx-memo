"use client";

import { create } from "zustand";
import type { Song, SongMemo, FilterState, SortState, Difficulty, Playlist } from "@/types";
import { saveSongs, loadSongs, getSongsUpdatedAt, saveMemo, loadAllMemos, savePlaylists, loadPlaylists } from "./storage";

interface AppState {
  songs: Song[];
  memos: Record<string, SongMemo>;
  playlists: Playlist[];
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
  createPlaylist: (name: string) => string;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (playlistId: string, songId: string, difficulty: Difficulty) => void;
  removeFromPlaylist: (playlistId: string, songId: string, difficulty: Difficulty) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  songs: [],
  memos: {},
  playlists: [],
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
    const playlists = loadPlaylists();
    const songsUpdatedAt = getSongsUpdatedAt();
    if (songs) {
      set({ songs, memos, playlists, songsUpdatedAt });
    } else {
      set({ memos, playlists });
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

  createPlaylist: (name) => {
    const id = Date.now().toString();
    const pl: Playlist = { id, name, entries: [], createdAt: new Date().toISOString() };
    const playlists = [...get().playlists, pl];
    set({ playlists });
    savePlaylists(playlists);
    return id;
  },

  deletePlaylist: (id) => {
    const playlists = get().playlists.filter((p) => p.id !== id);
    set({ playlists });
    savePlaylists(playlists);
  },

  renamePlaylist: (id, name) => {
    const playlists = get().playlists.map((p) => (p.id === id ? { ...p, name } : p));
    set({ playlists });
    savePlaylists(playlists);
  },

  addToPlaylist: (playlistId, songId, difficulty) => {
    const playlists = get().playlists.map((p) => {
      if (p.id !== playlistId) return p;
      if (p.entries.some((e) => e.songId === songId && e.difficulty === difficulty)) return p;
      return { ...p, entries: [...p.entries, { songId, difficulty }] };
    });
    set({ playlists });
    savePlaylists(playlists);
  },

  removeFromPlaylist: (playlistId, songId, difficulty) => {
    const playlists = get().playlists.map((p) => {
      if (p.id !== playlistId) return p;
      return { ...p, entries: p.entries.filter((e) => !(e.songId === songId && e.difficulty === difficulty)) };
    });
    set({ playlists });
    savePlaylists(playlists);
  },
}));
