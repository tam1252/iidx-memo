import type { Song, SongMemo, Difficulty } from "@/types";

const SONGS_KEY = "iidx_songs";
const SONGS_UPDATED_KEY = "iidx_songs_updated_at";
const MEMO_KEY = "iidx_memos";

export function saveSongs(songs: Song[]): void {
  localStorage.setItem(SONGS_KEY, JSON.stringify(songs));
  localStorage.setItem(SONGS_UPDATED_KEY, new Date().toISOString());
}

export function loadSongs(): Song[] | null {
  const raw = localStorage.getItem(SONGS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Song[];
  } catch {
    return null;
  }
}

export function getSongsUpdatedAt(): string | null {
  return localStorage.getItem(SONGS_UPDATED_KEY);
}

export function getMemoKey(songId: string, difficulty: Difficulty): string {
  return `${songId}__${difficulty}`;
}

export function saveMemo(memo: SongMemo): void {
  const all = loadAllMemos();
  const key = getMemoKey(memo.songId, memo.difficulty);
  all[key] = { ...memo, updatedAt: new Date().toISOString() };
  localStorage.setItem(MEMO_KEY, JSON.stringify(all));
}

export function loadMemo(songId: string, difficulty: Difficulty): SongMemo | null {
  const all = loadAllMemos();
  return all[getMemoKey(songId, difficulty)] ?? null;
}

export function loadAllMemos(): Record<string, SongMemo> {
  const raw = localStorage.getItem(MEMO_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, SongMemo>;
  } catch {
    return {};
  }
}
