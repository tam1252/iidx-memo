import type { Song, SongEntry, FilterState, SortState } from "@/types";

function parseBpm(bpm: string): number {
  const parts = bpm.replace(/\?/g, "0").split(/[-~]/);
  return Math.max(...parts.map((p) => parseInt(p, 10) || 0));
}

export function filterAndSortSongs(
  songs: Song[],
  filter: FilterState,
  sort: SortState
): SongEntry[] {
  let result = [...songs];

  // テキスト検索
  if (filter.searchText) {
    const q = filter.searchText.toLowerCase();
    result = result.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q)
    );
  }

  // バージョンフィルタ
  if (filter.versions.length > 0) {
    result = result.filter((s) => filter.versions.includes(s.version));
  }

  // 曲をA/Lエントリに展開
  let entries: SongEntry[] = [];
  for (const song of result) {
    for (const chart of song.charts) {
      if (chart.difficulty === "A" || chart.difficulty === "L") {
        entries.push({ song, chart });
      }
    }
  }

  // 難易度フィルタ
  if (filter.difficulties.length > 0) {
    entries = entries.filter((e) => filter.difficulties.includes(e.chart.difficulty));
  }

  // レベルフィルタ
  if (filter.levels.length > 0) {
    entries = entries.filter((e) => filter.levels.includes(e.chart.level));
  }

  // ソート
  entries.sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sort.field) {
      case "title":
        aVal = a.song.title;
        bVal = b.song.title;
        break;
      case "bpm":
        aVal = parseBpm(a.song.bpm);
        bVal = parseBpm(b.song.bpm);
        break;
      case "notes":
        aVal = a.chart.notes;
        bVal = b.chart.notes;
        break;
      case "level":
        aVal = a.chart.level;
        bVal = b.chart.level;
        break;
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      const cmp = aVal.localeCompare(bVal, "ja");
      return sort.order === "asc" ? cmp : -cmp;
    }
    const cmp = (aVal as number) - (bVal as number);
    return sort.order === "asc" ? cmp : -cmp;
  });

  return entries;
}

// 正規バージョン名の順序定義
const VERSION_ORDER = [
  "beatmania IIDX",
  "beatmania IIDX substream",
  "beatmania IIDX 2nd style",
  "beatmania IIDX 3rd style",
  "beatmania IIDX 4th style",
  "beatmania IIDX 5th style",
  "beatmania IIDX 6th style",
  "beatmania IIDX 7th style",
  "beatmania IIDX 8th style",
  "beatmania IIDX 9th style",
  "beatmania IIDX 10th style",
  "IIDX RED",
  "HAPPY SKY",
  "DistorteD",
  "GOLD",
  "DJ TROOPERS",
  "EMPRESS",
  "SIRIUS",
  "Resort Anthem",
  "Lincle",
  "tricoro",
  "SPADA",
  "PENDUAL",
  "copula",
  "SINOBUZ",
  "CANNON BALLERS",
  "Rootage",
  "HEROIC VERSE",
  "BISTROVER",
  "CastHour",
  "RESIDENT",
  "EPOLIS",
  "Pinky Crush",
  "Sparkle Shower",
];

export function getVersions(songs: Song[]): string[] {
  const set = new Set(songs.map((s) => s.version).filter(Boolean));
  const known = VERSION_ORDER.filter((v) => set.has(v));
  const others = Array.from(set)
    .filter((v) => !VERSION_ORDER.includes(v))
    .sort();
  return [...known, ...others];
}
