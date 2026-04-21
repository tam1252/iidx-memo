"use client";

import { useEffect, useRef } from "react";
import type { ChartData, Note } from "@/lib/textage-chart-parser";

interface Props {
  data: ChartData;
}

// IIDX SP レーン配色 (0=scratch, 1-7=keys)
const LANE_COLORS = ["#e74c3c", "#f5f5f5", "#5b9bd5", "#f5f5f5", "#f5f5f5", "#5b9bd5", "#f5f5f5", "#f5f5f5"];
const LANE_WIDTHS = [24, 18, 14, 18, 14, 18, 14, 18]; // scratch wider
const NOTE_HEIGHT = 5;
const MEASURE_HEIGHT = 192; // px per measure

function buildAbsStarts(measureLens: Record<number, number>, maxMeasure: number, lndef: number): Record<number, number> {
  const starts: Record<number, number> = {};
  let cur = 0;
  for (let m = 1; m <= maxMeasure + 1; m++) {
    starts[m] = cur;
    cur += measureLens[m] ?? lndef;
  }
  return starts;
}

function noteToY(measure: number, pos: number, lnN: number, absStarts: Record<number, number>, totalHeight: number): number {
  const absPos = (absStarts[measure] ?? 0) + pos;
  const totalUnits = absStarts[Object.keys(absStarts).length] ?? 1;
  // top = measure 1 (start), bottom = last measure
  return (absPos / totalUnits) * totalHeight;
}

export default function TextageChart({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const totalWidth = LANE_WIDTHS.reduce((a, b) => a + b, 0) + 2; // +2 for borders
  const maxMeasure = data.measure_count || Math.max(...data.notes.map((n) => n.measure), 1);
  const totalHeight = maxMeasure * MEASURE_HEIGHT;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    const absStarts = buildAbsStarts(data.measure_lens, maxMeasure, data.lndef);
    const totalUnits = (absStarts[maxMeasure] ?? 0) + (data.measure_lens[maxMeasure] ?? data.lndef);

    const notePosToY = (measure: number, pos: number) => {
      const absPos = (absStarts[measure] ?? 0) + pos;
      return (absPos / totalUnits) * totalHeight;
    };

    // Background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Measure lines & numbers
    for (let m = 1; m <= maxMeasure + 1; m++) {
      const y = ((absStarts[m] ?? 0) / totalUnits) * totalHeight;
      ctx.strokeStyle = m % 4 === 1 ? "#555" : "#333";
      ctx.lineWidth = m % 4 === 1 ? 1.5 : 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(totalWidth, y);
      ctx.stroke();
      if (m % 4 === 1 && m <= maxMeasure) {
        ctx.fillStyle = "#666";
        ctx.font = "8px monospace";
        ctx.fillText(String(m), 1, y + 9);
      }
    }

    // Lane dividers
    let xOff = 0;
    for (let i = 0; i < LANE_WIDTHS.length; i++) {
      ctx.strokeStyle = "#444";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(xOff, 0);
      ctx.lineTo(xOff, totalHeight);
      ctx.stroke();
      xOff += LANE_WIDTHS[i];
    }

    // BPM changes
    for (const bc of data.bpm_changes) {
      const y = notePosToY(bc.measure, bc.pos);
      ctx.strokeStyle = "#f39c1230";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(totalWidth, y);
      ctx.stroke();
    }

    // Notes
    const cnStarts = new Map<string, number>(); // "measure_pos_key" → y

    for (const note of data.notes) {
      const y = notePosToY(note.measure, note.pos);
      let laneIdx = note.key; // 0=scratch, 1-7
      let xPos = LANE_WIDTHS.slice(0, laneIdx).reduce((a, b) => a + b, 0);
      const w = LANE_WIDTHS[laneIdx] - 1;

      if (note.type === "cn_start") {
        cnStarts.set(`${note.measure}_${note.pos}_${note.key}`, y);
        ctx.fillStyle = LANE_COLORS[laneIdx] + "cc";
        ctx.fillRect(xPos + 1, y, w, NOTE_HEIGHT);
      } else if (note.type === "cn_end") {
        // Find matching start and draw the hold body
        // (simplified: just draw end note)
        ctx.fillStyle = LANE_COLORS[laneIdx] + "88";
        ctx.fillRect(xPos + 1, y, w, NOTE_HEIGHT);
      } else {
        ctx.fillStyle = LANE_COLORS[laneIdx];
        ctx.fillRect(xPos + 1, y, w, NOTE_HEIGHT);
      }
    }

  }, [data, maxMeasure, totalHeight, totalWidth]);

  return (
    <div
      className="overflow-y-auto overflow-x-hidden bg-gray-950 rounded-lg"
      style={{ maxHeight: "60vh" }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: totalWidth, height: totalHeight, display: "block", margin: "0 auto" }}
      />
    </div>
  );
}
