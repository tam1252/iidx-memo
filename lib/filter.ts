import type { Song, FilterState, SortState } from "@/types";

// レベル・難易度フィルターはA/Lのみ対象
function getALChart(s: Song) {
  return (
    s.charts.find((c) => c.difficulty === "A") ??
    s.charts.find((c) => c.difficulty === "L")
  );
}

export function filterAndSortSongs(
  songs: Song[],
  filter: FilterState,
  sort: SortState
): Song[] {
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

  // 難易度フィルタ（A/Lのみ対象）
  if (filter.difficulties.length > 0) {
    result = result.filter((s) =>
      s.charts.some(
        (c) =>
          (c.difficulty === "A" || c.difficulty === "L") &&
          filter.difficulties.includes(c.difficulty)
      )
    );
  }

  // レベルフィルタ（A/Lチャートのみ対象）
  if (filter.levels.length > 0) {
    result = result.filter((s) =>
      s.charts.some(
        (c) =>
          (c.difficulty === "A" || c.difficulty === "L") &&
          filter.levels.includes(c.level)
      )
    );
  }

  // ソート（level/notesはA優先、なければL）
  result.sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sort.field) {
      case "title":
        aVal = a.title;
        bVal = b.title;
        break;
      case "bpm": {
        const parseBpm = (bpm: string) => {
          const parts = bpm.replace(/\?/g, "0").split(/[-~]/);
          return Math.max(...parts.map((p) => parseInt(p, 10) || 0));
        };
        aVal = parseBpm(a.bpm);
        bVal = parseBpm(b.bpm);
        break;
      }
      case "notes":
        aVal = getALChart(a)?.notes ?? 0;
        bVal = getALChart(b)?.notes ?? 0;
        break;
      case "level":
        aVal = getALChart(a)?.level ?? 0;
        bVal = getALChart(b)?.level ?? 0;
        break;
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      const cmp = aVal.localeCompare(bVal, "ja");
      return sort.order === "asc" ? cmp : -cmp;
    }
    const cmp = (aVal as number) - (bVal as number);
    return sort.order === "asc" ? cmp : -cmp;
  });

  return result;
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
