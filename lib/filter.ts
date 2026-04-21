import type { Song, FilterState, SortState } from "@/types";

export function filterAndSortSongs(
  songs: Song[],
  filter: FilterState,
  sort: SortState,
  selectedDifficulty: string
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

  // 難易度フィルタ
  if (filter.difficulties.length > 0) {
    result = result.filter((s) =>
      s.charts.some((c) => filter.difficulties.includes(c.difficulty))
    );
  }

  // レベルフィルタ
  if (filter.levels.length > 0) {
    result = result.filter((s) =>
      s.charts.some((c) => filter.levels.includes(c.level))
    );
  }

  // ソート
  result.sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sort.field) {
      case "title":
        aVal = a.title;
        bVal = b.title;
        break;
      case "bpm": {
        // BPMが "120-180" のような範囲の場合は最大値を使用
        const parseBpm = (bpm: string) => {
          const parts = bpm.replace(/\?/g, "0").split(/[-~]/);
          return Math.max(...parts.map((p) => parseInt(p, 10) || 0));
        };
        aVal = parseBpm(a.bpm);
        bVal = parseBpm(b.bpm);
        break;
      }
      case "notes": {
        const diff = selectedDifficulty;
        const getChart = (s: Song) =>
          s.charts.find((c) => c.difficulty === diff) ?? s.charts[s.charts.length - 1];
        aVal = getChart(a)?.notes ?? 0;
        bVal = getChart(b)?.notes ?? 0;
        break;
      }
      case "level": {
        const diff = selectedDifficulty;
        const getChart = (s: Song) =>
          s.charts.find((c) => c.difficulty === diff) ?? s.charts[s.charts.length - 1];
        aVal = getChart(a)?.level ?? 0;
        bVal = getChart(b)?.level ?? 0;
        break;
      }
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

export function getVersions(songs: Song[]): string[] {
  const set = new Set(songs.map((s) => s.version).filter(Boolean));
  return Array.from(set).sort();
}
