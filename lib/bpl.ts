import type { Playlist, PlaylistEntry, Song } from "@/types";
import { BPL_SONGS } from "./bpl-songs";

export const BPL_LEVELS = ["8-10", "11", "12"] as const;
export const BPL_CATEGORIES = ["NOTES", "CHORD", "PEAK", "CHARGE", "SCRATCH", "SOF-LAN"] as const;
export type BplLevel    = (typeof BPL_LEVELS)[number];
export type BplCategory = (typeof BPL_CATEGORIES)[number];

export const BPL_COLORS: Record<BplCategory, string> = {
  NOTES:     "#f9a8d4",
  CHORD:     "#86efac",
  PEAK:      "#fdba74",
  CHARGE:    "#c4b5fd",
  SCRATCH:   "#fca5a5",
  "SOF-LAN": "#93c5fd",
};

export function bplId(level: BplLevel, category: BplCategory): string {
  return `bpl__${level}__${category}`;
}

export function makeBplPlaylists(): Playlist[] {
  return BPL_LEVELS.flatMap((level) =>
    BPL_CATEGORIES.map((category) => ({
      id: bplId(level, category),
      name: `${category} / ${level}`,
      entries: [],
      createdAt: new Date(0).toISOString(),
      color: BPL_COLORS[category],
      isFixed: true,
    }))
  );
}

export function isBplPlaylist(id: string): boolean {
  return id.startsWith("bpl__");
}

function normalizeForMatch(t: string): string {
  return t
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"');
}

export function buildBplEntries(songs: Song[]): Record<string, PlaylistEntry[]> {
  const byTitle = new Map<string, Song[]>();
  for (const s of songs) {
    const key = normalizeForMatch(s.title);
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key)!.push(s);
  }

  const result: Record<string, PlaylistEntry[]> = {};

  for (const category of BPL_CATEGORIES) {
    for (const level of BPL_LEVELS) {
      const id = bplId(level, category);
      const entries: PlaylistEntry[] = [];

      for (const entry of BPL_SONGS[category][level]) {
        const key = normalizeForMatch(entry.title);
        const matched = byTitle.get(key);
        if (!matched) continue;
        for (const song of matched) {
          if (song.charts.some((c) => c.difficulty === entry.difficulty)) {
            entries.push({ songId: song.id, difficulty: entry.difficulty });
            break;
          }
        }
      }

      result[id] = entries;
    }
  }

  return result;
}
