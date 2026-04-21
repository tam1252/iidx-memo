// textage_parser.py をTypeScriptに移植

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const LNDEF_DEFAULT = 384;

export type NoteType = "normal" | "cn_start" | "cn_end";

export interface Note {
  measure: number;
  pos: number;
  key: number; // 0=scratch, 1-7=keys
  type: NoteType;
}

export interface BpmChange {
  measure: number;
  pos: number;
  bpm: number;
}

export interface ChartData {
  title: string;
  notes: Note[];
  measure_lens: Record<number, number>;
  total_notes: number;
  bpm_base: string;
  bpm_changes: BpmChange[];
  lndef: number;
  measure_count: number;
}

function b64Find(c: string): number {
  const v = B64.indexOf(c);
  return v !== -1 ? v : 0;
}

function decodeHash(sdd: string, lnN: number): Array<{ pos: number; key: number }> {
  const notes: Array<{ pos: number; key: number }> = [];
  let sft = 1;
  let v2c = 0;

  while (sft < sdd.length) {
    const ch = sdd[sft];
    let v2s = 0, v2p = 0, v2t = 0;
    let v2o = "";
    const v2v = (v2c ? 1 : 3) * lnN / 6;

    if ("CcRrPp".includes(ch)) {
      if      (ch === "C") { v2s = 0;  v2p = 192; }
      else if (ch === "c") { v2s = 96; v2p = 192; }
      else if (ch === "R") { v2s = 0;  v2p = 96;  }
      else if (ch === "r") { v2s = 48; v2p = 96;  }
      else if (ch === "P") { v2s = 0;  v2p = 48;  }
      else if (ch === "p") { v2s = 24; v2p = 48;  }
      v2t = 0;
      if (!v2c) {
        sft += 1;
        v2o = sft < sdd.length ? sdd[sft] : "";
      }
      sft += 1;
    } else if ("BbQqOoXxZzSsTtUuVvWw".includes(ch)) {
      const MAP: Record<string, [number, number]> = {
        B: [0, 192], b: [96, 192], Q: [0, 96],  q: [48, 96],
        O: [0, 48],  o: [24, 48],  X: [0, 24],  x: [12, 24],
        Z: [0, 12],  z: [6,  12],  S: [0, 64],  s: [32, 64],
        T: [0, 32],  t: [16, 32],  U: [0, 16],  u: [8,  16],
        V: [0, 8],   v: [4,  8],   W: [0, 4],   w: [2,  4],
      };
      [v2s, v2p] = MAP[ch];
      v2t = 1;
      const v2b = Math.ceil(v2v / v2p) + 1;
      v2o = sdd.slice(sft + 1, sft + v2b);
      sft += v2b;
    } else if ("1234567".includes(ch)) {
      v2o = sdd.slice(sft, sft + 3);
      v2t = 2;
      sft += 3;
    } else if (ch === "8" || ch === "9") {
      if (ch === "9") {
        v2o = "1" + (sft + 2 < sdd.length ? sdd.slice(sft + 2, sft + 4) : "");
      } else {
        v2o = "";
      }
      const b64Val = sft + 1 < sdd.length ? b64Find(sdd[sft + 1]) : 0;
      for (let i2 = 0; i2 < 6; i2++) {
        if (b64Val & (1 << i2)) {
          v2o += String(i2 + 2) + (sft + 2 < sdd.length ? sdd.slice(sft + 2, sft + 4) : "");
        }
      }
      v2t = 2;
      sft += 4;
    } else if (ch === "-") {
      v2c = 1;
      sft += 1;
      continue;
    } else if (ch === "_") {
      v2o = sft === sdd.length - 1 ? "AA" : sdd.slice(sft + 1);
      v2c = 2;
      v2t = 2;
    } else {
      break;
    }

    if (sft > 0 && sft - 1 < sdd.length && sdd[sft - 1] === "-") {
      continue;
    }

    let v2k = "";
    if (v2t === 1) {
      for (const c2 of v2o) {
        const v2x = b64Find(c2);
        if (v2c === 0) {
          v2k += String(Math.floor(v2x / 8)) + String(v2x % 8);
        } else {
          for (let i3 = 5; i3 >= 0; i3--) {
            v2k += (v2x >> i3) & 1 ? "1" : "0";
          }
        }
      }
    } else if (v2t === 0) {
      let i2 = v2s;
      while (i2 < lnN) {
        v2k += v2c ? "1" : v2o;
        i2 += v2p;
      }
    }

    if (v2t !== 2) {
      let v2i = 0;
      let i2 = v2s;
      while (i2 < lnN) {
        const ob2 = v2i < v2k.length ? v2k[v2i] : "";
        if (ob2 && ob2 !== "0") {
          const keyVal = v2c ? 0 : (parseInt(ob2, 10) || 8);
          if (keyVal < 8) notes.push({ pos: i2, key: keyVal });
        }
        v2i++;
        i2 += v2p;
      }
    } else {
      let i2 = 0;
      while (i2 < v2o.length) {
        let ob2: string;
        if (v2c === 0) { ob2 = v2o[i2]; i2++; }
        else { ob2 = "0"; }
        const ch1 = i2 < v2o.length ? v2o[i2] : "";
        const ch2 = i2 + 1 < v2o.length ? v2o[i2 + 1] : "";
        if (ch1 && ch2) {
          const v2h = b64Find(ch1) * 64 + b64Find(ch2);
          const keyVal = v2c ? 0 : (parseInt(ob2, 10) || 8);
          if (keyVal < 8) notes.push({ pos: v2h, key: keyVal });
        }
        i2 += 2;
      }
    }

    if (v2c === 2) break;
  }

  return notes;
}

function decodeHex(sdd: string, lnN: number): Array<{ pos: number; key: number }> {
  const notes: Array<{ pos: number; key: number }> = [];
  const nbar = Math.ceil(lnN / 3);

  let sftLen: number, idx: number;
  if (sdd.startsWith("x")) {
    sftLen = parseInt(sdd.slice(1, 4), 16);
    idx = 4;
  } else {
    sftLen = sdd.length;
    idx = 0;
  }

  let div = 0;
  while (idx < sdd.length) {
    while (idx < sdd.length && sdd[idx] === "@") {
      div += parseInt(sdd.slice(idx + 1, idx + 3), 16) * 2;
      idx += 3;
    }
    if (idx >= sdd.length) break;
    if (idx + 2 <= sdd.length) {
      const y = parseInt(sdd.slice(idx, idx + 2), 16);
      if (!isNaN(y)) {
        const pos = Math.floor((nbar * div * 3) / sftLen);
        for (let j = 0; j <= 7; j++) {
          if ((y >> j) === 0) break;
          if ((y >> j) & 1) notes.push({ pos, key: j });
        }
      }
    }
    idx += 2;
    div += 2;
  }

  return notes;
}

function parseCnArrays(text: string): Record<"c1" | "c2", Record<number, Array<{ lane_raw: number; cnp: number; cnh: number; cnf: number }>>> {
  const result = { c1: {} as Record<number, Array<{ lane_raw: number; cnp: number; cnh: number; cnf: number }>>, c2: {} as Record<number, Array<{ lane_raw: number; cnp: number; cnh: number; cnf: number }>> };

  const pat = /c([12])\[(\d+)\]=((?:\[(?:\[[\s\S]*?\])\])+);/g;
  let m;
  while ((m = pat.exec(text)) !== null) {
    const side = ("c" + m[1]) as "c1" | "c2";
    const measure = parseInt(m[2]);
    if (!result[side][measure]) result[side][measure] = [];
    const entryPat = /\[(\d+(?:,\d+)*)\]/g;
    let e;
    while ((e = entryPat.exec(m[3])) !== null) {
      const vals = e[1].split(",").map(Number);
      result[side][measure].push({
        lane_raw: vals[0],
        cnp: vals[1] ?? 0,
        cnh: vals[2] ?? 30,
        cnf: vals[3] ?? 3,
      });
    }
  }

  const refPat = /c([12])\[(\d+)\]=c([12])\[(\d+)\];/g;
  while ((m = refPat.exec(text)) !== null) {
    const dst = ("c" + m[1]) as "c1" | "c2";
    const src = ("c" + m[3]) as "c1" | "c2";
    const dstN = parseInt(m[2]), srcN = parseInt(m[4]);
    if (!result[dst][dstN] && result[src][srcN]) {
      result[dst][dstN] = result[src][srcN].map((e) => ({ ...e }));
    }
  }

  return result;
}

function expandCnLanes(laneRaw: number): number[] {
  if (laneRaw === 0) return [0];
  if (laneRaw >= 1 && laneRaw <= 7) return [laneRaw];
  const lanes: number[] = [];
  let v = laneRaw;
  while (v >= 10) { lanes.push(v % 10); v = Math.floor(v / 10); }
  lanes.push(v);
  return [...new Set(lanes)].sort();
}

function buildMeasureAbsStarts(measureLens: Record<number, number>, maxMeasure: number, lndef: number): Record<number, number> {
  const absStarts: Record<number, number> = {};
  let current = 0;
  for (let m = 1; m <= maxMeasure + 2; m++) {
    absStarts[m] = current;
    current += measureLens[m] ?? lndef;
  }
  return absStarts;
}

function decodeTextageNotes(
  spRaw: Record<number, string>,
  measureLens: Record<number, number>,
  cnArrays: ReturnType<typeof parseCnArrays>,
  lndef: number,
): Note[] {
  const notes: Note[] = [];

  // Normal notes
  for (const [mStr, sdd] of Object.entries(spRaw)) {
    const measure = parseInt(mStr);
    if (!sdd || sdd === "00") continue;
    const lnN = measureLens[measure] ?? lndef;
    const raw = sdd.startsWith("#") ? decodeHash(sdd, lnN) : decodeHex(sdd, lnN);
    const seen = new Set<string>();
    for (const n of raw) {
      const k = `${n.pos}_${n.key}`;
      if (!seen.has(k)) {
        seen.add(k);
        notes.push({ measure, pos: n.pos, key: n.key, type: "normal" });
      }
    }
  }

  // CN notes
  const maxMeasure = Math.max(...Object.keys(spRaw).map(Number), 1);
  const absStarts = buildMeasureAbsStarts(measureLens, maxMeasure + 10, lndef);
  const boundaries = Object.entries(absStarts).map(([m, s]) => [parseInt(m), s] as [number, number]).sort((a, b) => a[0] - b[0]);

  const absToMeasurePos = (absPos: number): [number, number] => {
    for (let i = 0; i < boundaries.length - 1; i++) {
      const [m, start] = boundaries[i];
      const [, nextStart] = boundaries[i + 1];
      if (start <= absPos && absPos < nextStart) return [m, absPos - start];
    }
    const [m, start] = boundaries[boundaries.length - 1];
    return [m, absPos - start];
  };

  for (const [defMStr, entries] of Object.entries(cnArrays.c1)) {
    const defMeasure = parseInt(defMStr);
    const absMeasureStart = absStarts[defMeasure] ?? 0;
    for (const e of entries) {
      const lanes = expandCnLanes(e.lane_raw);
      const startAbs = absMeasureStart + e.cnp * 3;
      const endAbs = absMeasureStart + (e.cnp + e.cnh) * 3;
      for (const lane of lanes) {
        if (e.cnf & 1) {
          const [sm, sp] = absToMeasurePos(startAbs);
          notes.push({ measure: sm, pos: sp, key: lane, type: "cn_start" });
        }
        if (e.cnf & 2) {
          const [em, ep] = absToMeasurePos(endAbs);
          notes.push({ measure: em, pos: ep, key: lane, type: "cn_end" });
        }
      }
    }
  }

  return notes;
}

function parseBpmChanges(html: string): BpmChange[] {
  const changes: BpmChange[] = [];
  const pat = /tc\[(\d+)\]\s*=\s*\[([^\]]+)\];/g;
  let m;
  while ((m = pat.exec(html)) !== null) {
    const measure = parseInt(m[1]);
    const entries = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    for (const entry of entries) {
      const bpm = parseInt(entry.slice(0, 3).trim());
      const pos = entry.length > 3 ? parseInt(entry.slice(3).trim() || "0") * 3 : 0;
      if (!isNaN(bpm)) changes.push({ measure, pos, bpm });
    }
  }
  return changes.sort((a, b) => a.measure - b.measure || a.pos - b.pos);
}

function extractBalancedBlock(text: string, searchStart: number): [number, number] | null {
  const bracePos = text.indexOf("{", searchStart);
  if (bracePos === -1) return null;
  let depth = 0;
  for (let i = bracePos; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") { depth--; if (depth === 0) return [bracePos, i]; }
  }
  return null;
}

function extractDifficultyBlock(html: string, difficulty: string): string {
  const varMap: Record<string, string> = { X: "a", A: "a", L: "l", N: "n", H: "h", P: "p" };
  const v = varMap[difficulty.toUpperCase()] ?? "a";
  const pat = new RegExp(`if\\s*\\(\\s*${v}\\s*\\)\\s*\\{`);
  const m = pat.exec(html);
  if (!m) return html;
  const coords = extractBalancedBlock(html, m.index);
  if (!coords) return html;
  return html.slice(coords[0], coords[1] + 1);
}

function parseSpBlock(block: string, parentSp: Record<number, string> = {}): Record<number, string> {
  const sp: Record<number, string> = {};

  const arrayMatch = /sp\s*=\s*\[([\s\S]*?)\];/.exec(block);
  if (arrayMatch) {
    const parts = arrayMatch[1].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i].trim();
      if (p.startsWith('"')) { sp[i] = p.replace(/^"|"$/g, ""); }
      else if (p.startsWith("sp[")) {
        const refM = /\d+/.exec(p);
        if (refM) { const ref = parseInt(refM[0]); sp[i] = sp[ref] ?? parentSp[ref] ?? ""; }
      }
    }
  } else {
    for (const m of block.matchAll(/sp\[\s*(\d+)\s*\]\s*=\s*"([^"]*)";/g)) sp[parseInt(m[1])] = m[2];
    for (const m of block.matchAll(/sp\[\s*(\d+)\s*\]\s*=\s*sp\[\s*(\d+)\s*\];/g)) {
      const [dst, src] = [parseInt(m[1]), parseInt(m[2])];
      sp[dst] = sp[src] ?? parentSp[src] ?? "";
    }
  }

  return sp;
}

function extractKuroOverrides(block: string): Record<number, string> {
  const overrides: Record<number, string> = {};
  const km = /if\s*\(\s*kuro\s*\)\s*\{/.exec(block);
  if (!km) return overrides;
  const coords = extractBalancedBlock(block, km.index);
  if (!coords) return overrides;
  const content = block.slice(coords[0] + 1, coords[1]);
  for (const m of content.matchAll(/sp\[(\d+)\]\s*=\s*"([^"]*)";/g)) overrides[parseInt(m[1])] = m[2];
  for (const m of content.matchAll(/sp\[(\d+)\]\s*=\s*sp\[(\d+)\];/g)) {
    const [dst, src] = [parseInt(m[1]), parseInt(m[2])];
    if (src in overrides) overrides[dst] = overrides[src];
  }
  return overrides;
}

export function parseHtml(html: string, difficulty: string = "A"): ChartData {
  const measureLens: Record<number, number> = {};
  for (const m of html.matchAll(/ln\[(\d+)\]=(\d+);/g)) measureLens[parseInt(m[1])] = parseInt(m[2]);

  const lndefM = /\bLNDEF\s*=\s*(\d+)\s*;/.exec(html);
  const lndef = lndefM ? parseInt(lndefM[1]) : LNDEF_DEFAULT;

  const titleM = /title\s*=\s*"([^"]+)"/.exec(html);
  const title = titleM ? titleM[1] : "";

  const measureCountM = /\bmeasure\s*=\s*(\d+)\s*;/.exec(html);
  const measureCount = measureCountM ? parseInt(measureCountM[1]) : 0;

  const bpmM = /\bbpm\s*=\s*"([^"]+)"/.exec(html);
  const bpmBase = bpmM ? bpmM[1] : "";

  const bpmChanges = parseBpmChanges(html);

  let block = extractDifficultyBlock(html, difficulty);

  // Strip kuro sub-block for base parse
  const kuroM = /if\s*\(\s*kuro\s*\)\s*\{/.exec(block);
  let blockBase = block;
  if (kuroM) {
    const coords = extractBalancedBlock(block, kuroM.index);
    if (coords) {
      blockBase = block.slice(0, kuroM.index) + " ".repeat(coords[1] - kuroM.index + 1) + block.slice(coords[1] + 1);
    }
  }

  // Find parent sp
  const blockStart = html.indexOf(block.slice(0, 80));
  let parentSp: Record<number, string> = {};
  if (blockStart > 0) {
    const preceding = html.slice(0, blockStart);
    const spMatches = [...preceding.matchAll(/sp\s*=\s*\[/g)];
    if (spMatches.length > 0) {
      const lastSpPos = spMatches[spMatches.length - 1].index!;
      const spEnd = html.indexOf("];", lastSpPos);
      if (spEnd > 0) {
        parentSp = parseSpBlock(html.slice(lastSpPos, spEnd + 2));
      }
    }
  }

  let spRaw = parseSpBlock(blockBase, parentSp);

  if (difficulty.toUpperCase() === "X") {
    const kuroOverrides = extractKuroOverrides(block);
    spRaw = { ...spRaw, ...kuroOverrides };
  }

  if (Object.keys(spRaw).length === 0) {
    return { title, notes: [], measure_lens: measureLens, total_notes: 0, bpm_base: bpmBase, bpm_changes: bpmChanges, lndef, measure_count: measureCount };
  }

  const cnBlock = difficulty.toUpperCase() === "X" ? block : blockBase;
  const cnArrays = parseCnArrays(cnBlock);
  const notes = decodeTextageNotes(spRaw, measureLens, cnArrays, lndef);

  return { title, notes, measure_lens: measureLens, total_notes: notes.filter((n) => n.type !== "cn_end").length, bpm_base: bpmBase, bpm_changes: bpmChanges, lndef, measure_count: measureCount };
}
