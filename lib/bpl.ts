import type { Playlist } from "@/types";

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
