import * as cheerio from "cheerio";
import type { Song, Chart, Difficulty } from "@/types";

const NEW_SONGS_URL =
  "https://bemaniwiki.com/?beatmania+IIDX+33+Sparkle+Shower/%E6%96%B0%E6%9B%B2%E3%83%AA%E3%82%B9%E3%83%88";
const OLD_SONGS_URL =
  "https://bemaniwiki.com/?beatmania+IIDX+33+Sparkle+Shower/%E6%97%A7%E6%9B%B2%E3%83%AA%E3%82%B9%E3%83%88";

function cleanText(s: string): string {
  return s.replace(/\[.*?\]/g, "").replace(/\s+/g, " ").trim();
}

function parseLevel(s: string): number {
  const clean = cleanText(s);
  const n = parseInt(clean, 10);
  return isNaN(n) ? 0 : n;
}

function parseNotes(s: string): number {
  const clean = cleanText(s).replace(/,/g, "");
  const n = parseInt(clean, 10);
  return isNaN(n) ? 0 : n;
}

function generateId(title: string, version: string): string {
  // URLセーフなIDを生成
  return encodeURIComponent(`${version}__${title}`);
}

/**
 * 新曲リスト用パーサー
 * テーブル1: レベル (13カラム: SP-B, SP-N, SP-H, SP-A, SP-L, DP-N, ..., BPM, GENRE, TITLE, ARTIST)
 * テーブル2: ノーツ数 (TITLE, SP-B, SP-N, SP-H, SP-A, SP-L, ...)
 */
function parseNewSongs(html: string): Song[] {
  const $ = cheerio.load(html);
  const tables = $("table.style_table");

  if (tables.length < 2) return [];

  // テーブル2からノーツ数マップを構築 (title -> {N, H, A, L})
  const notesMap = new Map<string, Record<Difficulty, number>>();
  tables.eq(1).find("tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 6) return;
    const title = cleanText($(cells[0]).text());
    if (!title) return;
    notesMap.set(title, {
      N: parseNotes($(cells[2]).text()),
      H: parseNotes($(cells[3]).text()),
      A: parseNotes($(cells[4]).text()),
      L: parseNotes($(cells[5]).text()),
    });
  });

  const songs: Song[] = [];
  let currentVersion = "Sparkle Shower";

  tables.eq(0).find("tbody tr").each((_, row) => {
    const cells = $(row).find("td");

    // バージョングループ行（colspan付き、1セルのみ）
    if (cells.length === 1) {
      const text = cleanText($(cells[0]).text());
      if (text && !text.match(/^\s*$/)) {
        // 配信日グループ名から version を抽出
        currentVersion = text.replace(/\(.*?\)/g, "").trim() || "Sparkle Shower";
      }
      return;
    }

    if (cells.length < 13) return;

    const title = cleanText($(cells[11]).text());
    if (!title) return;

    const artist = cleanText($(cells[12]).text());
    const bpm = cleanText($(cells[9]).text());

    const charts: Chart[] = [];
    const notes = notesMap.get(title) ?? { N: 0, H: 0, A: 0, L: 0 };

    const diffMap: [number, Difficulty][] = [
      [1, "N"],
      [2, "H"],
      [3, "A"],
      [4, "L"],
    ];

    for (const [idx, diff] of diffMap) {
      const level = parseLevel($(cells[idx]).text());
      if (level > 0) {
        charts.push({ difficulty: diff, level, notes: notes[diff] });
      }
    }

    if (charts.length === 0) return;

    songs.push({
      id: generateId(title, currentVersion),
      title,
      artist,
      bpm,
      version: currentVersion,
      charts,
      isNew: true,
    });
  });

  return songs;
}

/**
 * 旧曲リスト用パーサー
 * テーブル2: レベル (13カラム: SP-B, SP-N, SP-H, SP-A, SP-L, DP-N, ..., BPM, GENRE, TITLE, ARTIST)
 * バージョングループ行: cells.length === 1
 */
function parseOldSongs(html: string): Song[] {
  const $ = cheerio.load(html);
  const tables = $("table.style_table");

  // 旧曲はテーブル2がメインデータ (テーブル1はバージョン一覧)
  const songTable = tables.length >= 2 ? tables.eq(1) : tables.eq(0);

  const songs: Song[] = [];
  let currentVersion = "";

  songTable.find("tbody tr").each((_, row) => {
    const cells = $(row).find("td");

    // バージョングループ行
    if (cells.length === 1) {
      const text = cleanText($(cells[0]).text());
      if (text && !text.match(/^\s*$/)) {
        // "beatmania IIDX ▼ △" → "beatmania IIDX"
        currentVersion = text.replace(/[▼△▲▽]/g, "").trim();
      }
      return;
    }

    if (cells.length < 13) return;

    const title = cleanText($(cells[11]).text());
    if (!title) return;

    const artist = cleanText($(cells[12]).text());
    const bpm = cleanText($(cells[9]).text());

    const charts: Chart[] = [];
    const diffMap: [number, Difficulty][] = [
      [1, "N"],
      [2, "H"],
      [3, "A"],
      [4, "L"],
    ];

    for (const [idx, diff] of diffMap) {
      const level = parseLevel($(cells[idx]).text());
      if (level > 0) {
        charts.push({ difficulty: diff, level, notes: 0 });
      }
    }

    if (charts.length === 0) return;

    songs.push({
      id: generateId(title, currentVersion),
      title,
      artist,
      bpm,
      version: currentVersion,
      charts,
      isNew: false,
    });
  });

  return songs;
}

export async function fetchSongsFromWiki(): Promise<Song[]> {
  const fetchPage = async (url: string): Promise<string> => {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IIDX-Memo-App/1.0)",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return res.text();
  };

  const [newHtml, oldHtml] = await Promise.all([
    fetchPage(NEW_SONGS_URL),
    fetchPage(OLD_SONGS_URL),
  ]);

  const newSongs = parseNewSongs(newHtml);
  const oldSongs = parseOldSongs(oldHtml);

  // IDの重複排除
  const seen = new Set<string>();
  const all: Song[] = [];
  for (const s of [...newSongs, ...oldSongs]) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      all.push(s);
    }
  }
  return all;
}
