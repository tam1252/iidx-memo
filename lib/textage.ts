// datatbl インデックス
// [SBo, SB, SN, SH, SA(=4), SX(=5), DP-B, DP-N, DP-H, DP-A, DP-X, BPM]
const NOTES_A_IDX = 4;
const NOTES_L_IDX = 5;

const TITLETBL_URL = "https://textage.cc/score/titletbl.js";
const DATATBL_URL  = "https://textage.cc/score/datatbl.js";

async function fetchTbl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": "https://textage.cc/score/",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`textage fetch failed: ${url} ${res.status}`);
  return res.text();
}

/** datatbl.js をパース → key → [数値配列] */
function parseDatatbl(js: string): Map<string, number[]> {
  const map = new Map<string, number[]>();
  const re = /^'([^']+)'\s*:\s*\[([^\]]+)\]/gm;
  const HEX: Record<string, number> = { A:10, B:11, C:12, D:13, E:14, F:15 };
  let m;
  while ((m = re.exec(js)) !== null) {
    const nums = m[2].split(",").map((v) => {
      v = v.trim();
      if (v.startsWith('"')) return 0;
      return HEX[v] ?? (parseInt(v, 10) || 0);
    });
    map.set(m[1], nums);
  }
  return map;
}

/** titletbl.js をパース → key → title（index5の文字列） */
function parseTitletbl(js: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /^'([^']+)'\s*:\s*\[([^\]]+)\]/gm;
  let m;
  while ((m = re.exec(js)) !== null) {
    // 配列内の文字列リテラルを順番に抽出（0=GENRE, 1=ARTIST, 2=TITLE）
    const strs = [...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)];
    if (strs.length >= 3) {
      map.set(m[1], strs[2][1]); // TITLE
    }
  }
  return map;
}

function normalize(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\s　]+/g, " ")
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .trim();
}

export interface TextageNotes {
  notesA: number;
  notesL: number;
}

/** textage から SP-A / SP-L のノーツ数マップを取得 */
export async function fetchTextageNotes(): Promise<Map<string, TextageNotes>> {
  const [titleJs, dataJs] = await Promise.all([
    fetchTbl(TITLETBL_URL),
    fetchTbl(DATATBL_URL),
  ]);

  const titleMap = parseTitletbl(titleJs);  // key → title
  const dataMap  = parseDatatbl(dataJs);    // key → numbers

  // normalized title → {notesA, notesL}
  const result = new Map<string, TextageNotes>();

  for (const [key, title] of titleMap) {
    const nums = dataMap.get(key);
    if (!nums) continue;
    const notesA = nums[NOTES_A_IDX] ?? 0;
    const notesL = nums[NOTES_L_IDX] ?? 0;
    if (notesA === 0 && notesL === 0) continue;
    result.set(normalize(title), { notesA, notesL });
  }

  return result;
}
