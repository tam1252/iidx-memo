// datatbl インデックス (SBo=0, SB=1, SN=2, SH=3, SA=4, SX=5, DP-B=6, ...)
const NOTES_A_IDX = 4;
const NOTES_L_IDX = 5;

const TITLETBL_URL = "https://textage.cc/score/titletbl.js";
const DATATBL_URL  = "https://textage.cc/score/datatbl.js";

async function fetchTblShiftJis(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": "https://textage.cc/score/",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`textage fetch failed: ${url} ${res.status}`);
  // textage.cc は Shift-JIS なので ArrayBuffer で受け取って変換
  const buf = await res.arrayBuffer();
  const decoder = new TextDecoder("shift-jis");
  return decoder.decode(buf);
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

/**
 * titletbl.js をパース
 * 配列構造: [ver, id, opt, "GENRE", "ARTIST", "TITLE", "SUBTITLE"(optional)]
 * → normalized(title) と normalized(title+subtitle) の両方をキーに登録
 */
function parseTitletbl(js: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /^'([^']+)'\s*:\s*\[([^\]]+)\]/gm;
  let m;
  while ((m = re.exec(js)) !== null) {
    const key = m[1];
    const strs = [...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1]);
    if (strs.length < 3) continue;
    // strs[0]=GENRE, [1]=ARTIST, [2]=TITLE, [3]=SUBTITLE(あれば)
    const title    = strs[2];
    const subtitle = strs[3] ?? "";

    map.set(key, title);

    // サブタイトルなしのタイトルをnormalizedキーで登録
    const normTitle = normalize(title);
    if (!map.has(normTitle)) map.set(normTitle, key);

    // サブタイトル付きフルタイトルも登録
    if (subtitle) {
      // HTMLタグを除去したサブタイトル
      const cleanSub = subtitle.replace(/<[^>]+>/g, "").trim();
      const full = normalize(title + cleanSub);
      if (!map.has(full)) map.set(full, key);
    }
  }
  return map;
}

function normalize(title: string): string {
  return title
    // HTML数値エンティティをデコード（titletbl.js が &#8317; 等で格納する曲名に対応）
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    // 互換文字を正規形に変換（⁽⁾→() など上付き括弧も処理）
    .normalize("NFKC")
    .toLowerCase()
    // 全角英数記号→半角
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    // 全角チルダ・波ダッシュ→~
    .replace(/[～〜]/g, "~")
    // 三点リーダー→...
    .replace(/[…‥]/g, "...")
    // 中黒→.
    .replace(/・/g, ".")
    // & の前後スペースを除去（Jam & Marmalade → jam&marmalade）
    .replace(/\s*&\s*/g, "&")
    // バックスラッシュエスケープを除去（MOVIN\' → movin'）
    .replace(/\\(.)/g, "$1")
    // 空白正規化
    .replace(/[\s　]+/g, " ")
    .trim();
}

// 英数字・スペース・CJK文字のみ残すフォールバック用正規化（記号・装飾文字を除去）
// 例: ⁽⁽ ≀ ˙꒳˙ ≀ ⁾⁾ beyond reason → "beyond reason"
//     &#8317;&#8317;&#2840;( ˙꒳˙ )&#2835;&#8318;&#8318; beyond reason → "beyond reason"
function normalizeLoose(title: string): string {
  return normalize(title)
    .replace(/[^a-z0-9 　-鿿＀-￯]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface TextageNotes {
  notesA: number;
  notesL: number;
  key: string;
  ver: number;
}

/** textage から SP-A / SP-L のノーツ数マップを取得 */
export async function fetchTextageNotes(): Promise<Map<string, TextageNotes>> {
  const [titleJs, dataJs] = await Promise.all([
    fetchTblShiftJis(TITLETBL_URL),
    fetchTblShiftJis(DATATBL_URL),
  ]);

  // normalizedTitle → {key, ver} の逆引きマップ（通常 + ルーズ）
  const normToEntry  = new Map<string, { key: string; ver: number }>();
  const looseToEntry = new Map<string, { key: string; ver: number }>();

  const re = /^'([^']+)'\s*:\s*\[([^\]]+)\]/gm;
  let m;
  while ((m = re.exec(titleJs)) !== null) {
    const key  = m[1];
    const nums = m[2].split(",");
    const ver  = parseInt(nums[0].trim(), 10) || 0;
    const strs = [...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1]);
    if (strs.length < 3) continue;
    const title    = strs[2];
    const subtitle = strs[3] ? strs[3].replace(/<[^>]+>/g, "").trim() : "";

    const entry = { key, ver };

    // normalized title → entry（先勝ち）
    const nt = normalize(title);
    if (!normToEntry.has(nt)) normToEntry.set(nt, entry);
    const lt = normalizeLoose(title);
    if (lt !== nt && !looseToEntry.has(lt)) looseToEntry.set(lt, entry);

    // normalized "title subtitle"（スペース区切り）も登録
    if (subtitle) {
      const nf = normalize(title + " " + subtitle);
      if (!normToEntry.has(nf)) normToEntry.set(nf, entry);
      const lf = normalizeLoose(title + " " + subtitle);
      if (lf !== nf && !looseToEntry.has(lf)) looseToEntry.set(lf, entry);
    }
  }

  const dataMap = parseDatatbl(dataJs);

  const makeEntry = (key: string, ver: number): TextageNotes | null => {
    const nums = dataMap.get(key);
    if (!nums) return null;
    const notesA = nums[NOTES_A_IDX] ?? 0;
    const notesL = nums[NOTES_L_IDX] ?? 0;
    if (notesA === 0 && notesL === 0) return null;
    return { notesA, notesL, key, ver };
  };

  // normalized wiki title → {notesA, notesL, key, ver} を構築
  const result = new Map<string, TextageNotes>();

  for (const [normTitle, { key, ver }] of normToEntry) {
    const entry = makeEntry(key, ver);
    if (entry) result.set(normTitle, entry);
  }

  // ルーズ正規化でしか一致しないタイトルをフォールバックとして追加
  for (const [looseTitle, { key, ver }] of looseToEntry) {
    if (!result.has(looseTitle)) {
      const entry = makeEntry(key, ver);
      if (entry) result.set(looseTitle, entry);
    }
  }

  return result;
}

export { normalize, normalizeLoose };
