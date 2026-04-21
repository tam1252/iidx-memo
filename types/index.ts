export type Difficulty = "N" | "H" | "A" | "L";

export type OptionType = "正規" | "鏡" | "乱" | "R乱" | "S乱";

export interface Chart {
  difficulty: Difficulty;
  level: number;
  notes: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: string;
  version: string;
  charts: Chart[];
  isNew: boolean;
  textageKey?: string;
}

export interface SongEntry {
  song: Song;
  chart: Chart;
}

export interface SongMemo {
  songId: string;
  difficulty: Difficulty;
  options: OptionType[];
  note: string;
  updatedAt: string;
}

export type SortField = "title" | "bpm" | "notes" | "level";
export type SortOrder = "asc" | "desc";

export interface FilterState {
  levels: number[];
  difficulties: Difficulty[];
  versions: string[];
  searchText: string;
}

export interface SortState {
  field: SortField;
  order: SortOrder;
}
