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

const HTML_NAMED_ENTITIES: Record<string, string> = {
  AElig: "Æ", Eacute: "É", Euml: "Ë", Oslash: "Ø", Uuml: "Ü",
  aelig: "æ", atilde: "ã", auml: "ä", eacute: "é", ecirc: "ê",
  hearts: "♥", iexcl: "¡", oslash: "ø", ouml: "ö",
  amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'",
};

function normalize(title: string): string {
  return title
    // HTMLタグを除去（<div class=ltmodel>...</div>, <br> など）
    .replace(/<[^>]+>/g, "")
    // HTMLエンティティをデコード（数値・16進・名前付き）
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => HTML_NAMED_ENTITIES[name] ?? m)
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

// スペースも除去（textage のサブタイトルにスペースが含まれる場合の照合用）
// 例: textage "それが、ボクの使命 ~レスキュー隊長 メンキュー~" vs wiki "それが、ボクの使命~レスキュー隊長メンキュー~"
function normalizeStrip(title: string): string {
  return normalizeLoose(title).replace(/\s/g, "");
}

export interface TextageNotes {
  notesA: number;
  notesL: number;
  key: string;
  ver: number;
}

// タイトルの不一致が大きく自動照合できないケースの手動マッピング
// [wiki上のタイトル, textage key]
const MANUAL_KEY_TITLES: Array<[string, string]> = [
  ["CROSSROAD ～Left Story～",           "crosroad"],   // textage側にサブタイトルなし＋typo
  ["DENIMDENIMDENIM (ELECTRO MIX)",      "denim"],      // textage側にサブタイトルなし
  ["X-DEN",                              "_kai_den"],   // textage側はΧ-DEN(ギリシャ文字)
  ["FiZZλ_PØT!0И",                      "fizzyptn"],   // 0(数字)とO(文字)の違い
  ["chaplet -IIDX re:build-",           "chaplet"],    // textage側にサブタイトルなし
  ["A MINSTREL ～ ver. short-scape ～",  "a_minstr"],   // textage側のsubtitleがCSSカラーコード
  ["crewcrew",                           "crew"],       // textage keyが略称
];

/** textage から SP-A / SP-L のノーツ数マップを取得 */
export async function fetchTextageNotes(): Promise<Map<string, TextageNotes>> {
  const [titleJs, dataJs] = await Promise.all([
    fetchTblShiftJis(TITLETBL_URL),
    fetchTblShiftJis(DATATBL_URL),
  ]);

  const dataMap = parseDatatbl(dataJs);

  // key → ver の逆引き（手動マッピングのver解決に使用）
  const keyToVer = new Map<string, number>();

  // normalizedTitle → [{key, ver}, ...] (全候補を収集、best-wins で選択)
  type Entry = { key: string; ver: number };
  const normToEntries  = new Map<string, Entry[]>();
  const looseToEntries = new Map<string, Entry[]>();
  const stripToEntries = new Map<string, Entry[]>();

  function addEntry(map: Map<string, Entry[]>, k: string, entry: Entry) {
    const arr = map.get(k);
    if (arr) arr.push(entry);
    else map.set(k, [entry]);
  }

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

    keyToVer.set(key, ver);

    const entry: Entry = { key, ver };

    const nt = normalize(title);
    addEntry(normToEntries, nt, entry);
    const lt = normalizeLoose(title);
    if (lt !== nt) addEntry(looseToEntries, lt, entry);
    const st = normalizeStrip(title);
    if (st !== lt) addEntry(stripToEntries, st, entry);

    if (subtitle) {
      const nf = normalize(title + " " + subtitle);
      if (nf !== nt) addEntry(normToEntries, nf, entry);
      const lf = normalizeLoose(title + " " + subtitle);
      if (lf !== nf && lf !== lt) addEntry(looseToEntries, lf, entry);
      const sf = normalizeStrip(title + subtitle);
      if (sf !== lf && sf !== st) addEntry(stripToEntries, sf, entry);
    }
  }

  const makeEntry = (key: string, ver: number): TextageNotes | null => {
    const nums = dataMap.get(key);
    if (!nums) return null;
    const notesA = nums[NOTES_A_IDX] ?? 0;
    const notesL = nums[NOTES_L_IDX] ?? 0;
    // notesA/notesL が 0,0 でも有効（textageKey だけ使いたいケースがある）
    return { notesA, notesL, key, ver };
  };

  // 複数候補から最良を選択（notesA>0 or notesL>0 を優先）
  const pickBest = (entries: Entry[]): TextageNotes | null => {
    let fallback: TextageNotes | null = null;
    for (const { key, ver } of entries) {
      const e = makeEntry(key, ver);
      if (!e) continue;
      if (e.notesA > 0 || e.notesL > 0) return e;
      if (!fallback) fallback = e;
    }
    return fallback;
  };

  const result = new Map<string, TextageNotes>();

  for (const [normTitle, entries] of normToEntries) {
    const entry = pickBest(entries);
    if (entry) result.set(normTitle, entry);
  }

  for (const [looseTitle, entries] of looseToEntries) {
    if (!result.has(looseTitle)) {
      const entry = pickBest(entries);
      if (entry) result.set(looseTitle, entry);
    }
  }

  for (const [stripTitle, entries] of stripToEntries) {
    if (!result.has(stripTitle)) {
      const entry = pickBest(entries);
      if (entry) result.set(stripTitle, entry);
    }
  }

  // 手動マッピングを適用（自動照合できなかった曲を補完）
  for (const [wikiTitle, key] of MANUAL_KEY_TITLES) {
    const ver   = keyToVer.get(key) ?? 0;
    const entry = makeEntry(key, ver);
    if (!entry) continue;
    for (const nk of [normalize(wikiTitle), normalizeLoose(wikiTitle), normalizeStrip(wikiTitle)]) {
      if (!result.has(nk)) result.set(nk, entry);
    }
  }

  return result;
}

export { normalize, normalizeLoose, normalizeStrip };
