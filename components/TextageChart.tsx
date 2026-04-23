"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ChartData } from "@/lib/textage-chart-parser";

interface Props {
  data: ChartData;
}

const LANE_COLORS = ["#e84040", "#e8e8e8", "#4a8fd9", "#e8e8e8", "#4a8fd9", "#e8e8e8", "#4a8fd9", "#e8e8e8"];
const CN_COLORS   = ["#c03030", "#b8b8b8", "#2a6fb0", "#b8b8b8", "#2a6fb0", "#b8b8b8", "#2a6fb0", "#b8b8b8"];
const LANE_WIDTHS = [22, 17, 13, 17, 13, 17, 13, 17];
const NOTE_H      = 5;
const BPM_COLOR   = "#a3e635";

const IDENTITY = [0, 1, 2, 3, 4, 5, 6, 7];
const MIRROR   = [0, 7, 6, 5, 4, 3, 2, 1];

type OptionMode = "normal" | "mirror" | "random" | "rran" | "sran";

function buildRranLaneMap(shift: number): number[] {
  return [0, ...Array.from({ length: 7 }, (_, i) => ((i + shift) % 7) + 1)];
}

function buildSranMap(notes: ChartData["notes"]): Map<string, number> {
  const map = new Map<string, number>();
  // CN: start/end ペアで同じレーンを割り当てる
  const cnAssigned = new Map<number, number>(); // originalKey -> assignedLane

  for (const note of notes) {
    if (note.key === 0) continue; // scratch は固定

    const noteKey = `${note.measure}_${note.pos}_${note.key}`;
    if (note.type === "cn_start") {
      const lane = Math.floor(Math.random() * 7) + 1;
      cnAssigned.set(note.key, lane);
      map.set(noteKey, lane);
    } else if (note.type === "cn_end") {
      const lane = cnAssigned.get(note.key) ?? Math.floor(Math.random() * 7) + 1;
      map.set(noteKey, lane);
      cnAssigned.delete(note.key);
    } else {
      map.set(noteKey, Math.floor(Math.random() * 7) + 1);
    }
  }
  return map;
}

function shuffleRandom(): number[] {
  const lanes = [1, 2, 3, 4, 5, 6, 7];
  for (let i = lanes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
  }
  return [0, ...lanes];
}

function parseCustomLane(input: string): number[] | null {
  const digits = input.replace(/\s/g, "");
  if (digits.length !== 7) return null;
  const nums = [...digits].map(Number);
  if (nums.some((n) => n < 1 || n > 7)) return null;
  if (new Set(nums).size !== 7) return null;
  return [0, ...nums];
}

function buildAbsStarts(measureLens: Record<number, number>, max: number, lndef: number): Record<number, number> {
  const s: Record<number, number> = {};
  let cur = 0;
  for (let m = 1; m <= max + 2; m++) {
    s[m] = cur;
    cur += measureLens[m] ?? lndef;
  }
  return s;
}

export default function TextageChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);

  const [mode, setMode]               = useState<OptionMode>("normal");
  const [laneMap, setLaneMap]         = useState<number[]>(IDENTITY);
  const [rranShift, setRranShift]     = useState(0);
  const [sranMap, setSranMap]         = useState<Map<string, number>>(() => new Map());
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState("");
  const [jumpInput, setJumpInput]     = useState("");

  const maxMeasure = data.measure_count || Math.max(...data.notes.map((n) => n.measure), 1);
  const totalWidth = LANE_WIDTHS.reduce((a, b) => a + b, 0);
  const MEASURE_PX = 192;
  const totalHeight = maxMeasure * MEASURE_PX;

  const absStartsRef  = useRef<Record<number, number>>({});
  const totalUnitsRef = useRef(1);

  const getDisplayLane = useCallback((note: ChartData["notes"][number]): number => {
    if (note.key === 0) return 0;
    if (mode === "sran") {
      const k = `${note.measure}_${note.pos}_${note.key}`;
      return sranMap.get(k) ?? note.key;
    }
    return laneMap[note.key] ?? note.key;
  }, [mode, laneMap, sranMap]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = totalWidth;
    canvas.height = totalHeight;

    const absStarts = buildAbsStarts(data.measure_lens, maxMeasure, data.lndef);
    const totalUnits = (absStarts[maxMeasure] ?? 0) + (data.measure_lens[maxMeasure] ?? data.lndef);
    absStartsRef.current  = absStarts;
    totalUnitsRef.current = totalUnits;

    const toY = (measure: number, pos: number): number => {
      const absPos = (absStarts[measure] ?? 0) + pos;
      return totalHeight * (1 - absPos / totalUnits);
    };

    const bgChart = (typeof window !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue("--bg-chart").trim()
      : "") || "#0d1117";
    ctx.fillStyle = bgChart;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // 1/16グリッド線 (1小節 = 192 units = 4拍 = 16分音符)
    for (let m = 1; m <= maxMeasure; m++) {
      const beatLen = (data.measure_lens[m] ?? data.lndef) / 4;
      const sixteenthLen = beatLen / 4;
      for (let sub = 0; sub < 16; sub++) {
        if (sub % 4 === 0) continue; // 小節線・拍線と重複を避ける
        const pos = sub * sixteenthLen;
        const y = toY(m, pos);
        ctx.strokeStyle = "rgba(255,255,255,0.20)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(totalWidth, y);
        ctx.stroke();
      }
    }

    // 1/4拍線 (各小節を4分割)
    for (let m = 1; m <= maxMeasure; m++) {
      const beatLen = (data.measure_lens[m] ?? data.lndef) / 4;
      for (let beat = 1; beat < 4; beat++) {
        const y = toY(m, beat * beatLen);
        ctx.strokeStyle = "rgba(255,255,255,0.38)";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(totalWidth, y);
        ctx.stroke();
      }
    }

    // 小節線 (強め)
    for (let m = 1; m <= maxMeasure + 1; m++) {
      const y = ((absStarts[m] ?? 0) / totalUnits) * totalHeight;
      const flippedY = totalHeight - y;
      const isBeat1 = m % 4 === 1;
      ctx.strokeStyle = isBeat1 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.32)";
      ctx.lineWidth   = isBeat1 ? 1.2 : 0.7;
      ctx.beginPath();
      ctx.moveTo(0, flippedY);
      ctx.lineTo(totalWidth, flippedY);
      ctx.stroke();
      if (m <= maxMeasure) {
        ctx.fillStyle = isBeat1 ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.40)";
        ctx.font = "7px monospace";
        ctx.fillText(String(m), 1, flippedY - 2);
      }
    }

    // レーン区切り線
    let xOff = 0;
    for (let i = 0; i < LANE_WIDTHS.length; i++) {
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(xOff, 0);
      ctx.lineTo(xOff, totalHeight);
      ctx.stroke();
      xOff += LANE_WIDTHS[i];
    }

    // BPMライン
    const initialBpmChange = data.bpm_changes.find((bc) => bc.measure === 1 && bc.pos === 0);
    const initialBpmText = initialBpmChange ? String(initialBpmChange.bpm) : data.bpm_base || "";
    if (initialBpmText) {
      const y = toY(1, 0);
      ctx.strokeStyle = BPM_COLOR + "70";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(totalWidth, y); ctx.stroke();
      ctx.fillStyle = BPM_COLOR;
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "right";
      ctx.fillText(initialBpmText, totalWidth - 2, y - 2);
      ctx.textAlign = "left";
    }
    for (const bc of data.bpm_changes) {
      if (bc.measure === 1 && bc.pos === 0) continue;
      const y = toY(bc.measure, bc.pos);
      ctx.strokeStyle = BPM_COLOR + "70";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(totalWidth, y); ctx.stroke();
      ctx.fillStyle = BPM_COLOR;
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "right";
      ctx.fillText(String(bc.bpm), totalWidth - 2, y - 2);
      ctx.textAlign = "left";
    }

    // CNペアリング
    const cnPairs: Array<{ topY: number; bottomY: number; x: number; w: number; lane: number }> = [];
    const cnStartMap = new Map<string, { y: number; lane: number; x: number; w: number }>();

    const sortedNotes = [...data.notes].sort((a, b) => {
      const aAbs = (absStarts[a.measure] ?? 0) + a.pos;
      const bAbs = (absStarts[b.measure] ?? 0) + b.pos;
      return aAbs - bAbs;
    });

    for (const note of sortedNotes) {
      if (note.type !== "cn_start" && note.type !== "cn_end") continue;
      const displayLane = getDisplayLane(note);
      const x = LANE_WIDTHS.slice(0, displayLane).reduce((a, b) => a + b, 0);
      const w = LANE_WIDTHS[displayLane] - 1;
      const y = toY(note.measure, note.pos);
      const mapKey = `${note.key}`;
      if (note.type === "cn_start") {
        cnStartMap.set(mapKey, { y, lane: displayLane, x, w });
      } else {
        const start = cnStartMap.get(mapKey);
        if (start) {
          cnPairs.push({ topY: y, bottomY: start.y, x: start.x, w: start.w, lane: start.lane });
          cnStartMap.delete(mapKey);
        }
      }
    }

    for (const { topY, bottomY, x, w, lane } of cnPairs) {
      ctx.fillStyle = CN_COLORS[lane];
      ctx.fillRect(x + 1, topY, w, bottomY - topY);
    }

    for (const note of sortedNotes) {
      if (note.type === "cn_end") continue;
      const displayLane = getDisplayLane(note);
      const x = LANE_WIDTHS.slice(0, displayLane).reduce((a, b) => a + b, 0);
      const w = LANE_WIDTHS[displayLane] - 1;
      const y = toY(note.measure, note.pos) - NOTE_H;
      ctx.fillStyle = LANE_COLORS[displayLane];
      ctx.fillRect(x + 1, y, w, NOTE_H);
    }
  }, [data, getDisplayLane, maxMeasure, totalHeight, totalWidth]);

  useEffect(() => {
    draw();
    const container = containerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [draw]);

  // モード変更ハンドラ
  const applyNormal  = () => { setMode("normal"); setLaneMap(IDENTITY); };
  const applyMirror  = () => { setMode("mirror"); setLaneMap(MIRROR); };
  const applyRandom  = () => { setMode("random"); setLaneMap(shuffleRandom()); };
  const applyRran    = (shift: number) => {
    const s = ((shift % 7) + 7) % 7;
    setRranShift(s);
    setMode("rran");
    setLaneMap(buildRranLaneMap(s));
  };
  const applySran    = () => { setMode("sran"); setSranMap(buildSranMap(data.notes)); };
  const reshuffleSran = () => setSranMap(buildSranMap(data.notes));

  const handleCustomApply = () => {
    const map = parseCustomLane(customInput);
    if (!map) {
      setCustomError("1〜7の数字を7桁で重複なく入力してください (例: 3521764)");
      return;
    }
    setCustomError("");
    setMode("random");
    setLaneMap(map);
  };

  const handleJump = () => {
    const m = parseInt(jumpInput);
    if (isNaN(m) || m < 1 || m > maxMeasure) return;
    const absStarts = absStartsRef.current;
    const totalUnits = totalUnitsRef.current;
    const absPos = absStarts[m] ?? 0;
    const y = totalHeight * (1 - absPos / totalUnits);
    const container = containerRef.current;
    if (!container) return;
    const targetScroll = y - container.clientHeight + 40;
    container.scrollTop = Math.max(0, Math.min(container.scrollHeight - container.clientHeight, targetScroll));
  };

  const OPTION_BTNS: { key: OptionMode; label: string }[] = [
    { key: "normal", label: "正規" },
    { key: "mirror", label: "鏡"   },
    { key: "random", label: "乱"   },
    { key: "rran",   label: "R乱"  },
    { key: "sran",   label: "S乱"  },
  ];

  const BTN_ACTIVE: Record<OptionMode, string> = {
    normal: "bg-rose-400/70 text-white border-transparent",
    mirror: "bg-sky-400/70 text-white border-transparent",
    random: "bg-amber-400/70 text-gray-900 border-transparent",
    rran:   "bg-emerald-400/70 text-white border-transparent",
    sran:   "bg-violet-400/70 text-white border-transparent",
  };
  const BTN_INACTIVE = "bg-transparent text-[var(--fg-muted)] border-[var(--border)]";

  return (
    <div className="space-y-2">
      {/* Row1: オプションボタン */}
      <div className="flex flex-wrap gap-1.5">
        {OPTION_BTNS.map((btn) => (
          <button
            key={btn.key}
            onClick={() => {
              if (btn.key === "normal")      applyNormal();
              else if (btn.key === "mirror") applyMirror();
              else if (btn.key === "random") applyRandom();
              else if (btn.key === "rran")   applyRran(rranShift);
              else if (btn.key === "sran")   applySran();
            }}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              mode === btn.key ? BTN_ACTIVE[btn.key] : BTN_INACTIVE
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Row2: オプション別コントロール */}
      {mode === "random" && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={applyRandom}
              className="px-2 py-1 rounded text-xs text-[var(--fg-muted)] border border-[var(--border)]"
            >
              再シャッフル
            </button>
            <span className="text-[var(--fg-faint)] text-xs font-mono tracking-widest">
              {laneMap.slice(1).join("")}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value.replace(/[^1-7]/g, "").slice(0, 7))}
              placeholder="直接指定 例: 3521764"
              maxLength={7}
              className="flex-1 bg-[var(--bg-input)] text-[var(--fg)] rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
            />
            <button
              onClick={handleCustomApply}
              className="px-3 py-1 bg-[var(--accent)] text-white rounded text-xs font-medium"
            >
              適用
            </button>
          </div>
          {customError && <p className="text-red-400 text-xs">{customError}</p>}
        </div>
      )}

      {mode === "rran" && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => applyRran(rranShift - 1)}
            className="px-2.5 py-1 rounded text-xs border border-[var(--border)] text-[var(--fg-muted)]"
          >
            ◀
          </button>
          <span className="text-xs font-mono tracking-widest text-[var(--fg-dim)]">
            {laneMap.slice(1).join("")}
          </span>
          <button
            onClick={() => applyRran(rranShift + 1)}
            className="px-2.5 py-1 rounded text-xs border border-[var(--border)] text-[var(--fg-muted)]"
          >
            ▶
          </button>
        </div>
      )}

      {mode === "sran" && (
        <div>
          <button
            onClick={reshuffleSran}
            className="px-2 py-1 rounded text-xs text-[var(--fg-muted)] border border-[var(--border)]"
          >
            再シャッフル
          </button>
        </div>
      )}

      {/* 小節ジャンプ */}
      <div className="flex items-center gap-2">
        <span className="text-[var(--fg-faint)] text-xs">小節移動:</span>
        <input
          type="number"
          value={jumpInput}
          onChange={(e) => setJumpInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleJump()}
          min={1}
          max={maxMeasure}
          placeholder={`1–${maxMeasure}`}
          className="w-20 bg-[var(--bg-input)] text-[var(--fg)] rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent-ring)]"
        />
        <button
          onClick={handleJump}
          className="px-2.5 py-1 bg-[var(--bg-input)] text-[var(--fg-dim)] rounded text-xs"
        >
          移動
        </button>
        <span className="text-[var(--fg-faint)] text-xs ml-auto">{data.total_notes} notes</span>
      </div>

      {/* 譜面キャンバス */}
      <div
        ref={containerRef}
        className="overflow-y-auto overflow-x-hidden bg-[var(--bg-chart)] rounded-lg"
        style={{ maxHeight: "60vh" }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: totalWidth, height: totalHeight, display: "block", margin: "0 auto" }}
        />
      </div>
    </div>
  );
}
