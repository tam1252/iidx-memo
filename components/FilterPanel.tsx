"use client";

import { useState } from "react";
import type { SortField } from "@/types";
import { useAppStore } from "@/lib/store";

const LEVELS = Array.from({ length: 12 }, (_, i) => i + 1);

interface Props {
  versions: string[];
}

export default function FilterPanel({ versions }: Props) {
  const { filter, sort, setFilter, setSort } = useAppStore();
  const [open, setOpen] = useState(false);

  const toggleLevel = (l: number) => {
    const next = filter.levels.includes(l)
      ? filter.levels.filter((x) => x !== l)
      : [...filter.levels, l];
    setFilter({ levels: next });
  };

  const toggleDifficulty = (d: "A" | "L") => {
    const next = filter.difficulties.includes(d)
      ? filter.difficulties.filter((x) => x !== d)
      : [...filter.difficulties, d];
    setFilter({ difficulties: next });
  };

  const toggleVersion = (v: string) => {
    const next = filter.versions.includes(v)
      ? filter.versions.filter((x) => x !== v)
      : [...filter.versions, v];
    setFilter({ versions: next });
  };

  const clearAll = () => {
    setFilter({ levels: [], difficulties: [], versions: [], searchText: "" });
  };

  const activeCount =
    filter.difficulties.length + filter.levels.length + filter.versions.length;

  return (
    <div className="bg-gray-900 sticky top-0 z-10">
      {/* 検索バー */}
      <div className="p-3 flex gap-2">
        <input
          type="search"
          placeholder="曲名・アーティスト検索"
          value={filter.searchText}
          onChange={(e) => setFilter({ searchText: e.target.value })}
          className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={() => setOpen(!open)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            open || activeCount > 0
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          フィルタ{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <select
            value={sort.field}
            onChange={(e) => setSort({ ...sort, field: e.target.value as SortField })}
            className="bg-gray-700 text-gray-300 text-xs rounded px-1.5 py-2 focus:outline-none"
          >
            <option value="title">タイトル</option>
            <option value="level">レベル</option>
            <option value="bpm">BPM</option>
            <option value="notes">ノーツ</option>
          </select>
          <button
            onClick={() => setSort({ ...sort, order: sort.order === "asc" ? "desc" : "asc" })}
            className="bg-gray-700 text-gray-300 text-xs rounded px-2 py-2"
          >
            {sort.order === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* 展開フィルタパネル */}
      {open && (
        <div className="border-t border-gray-700 px-3 pt-3 pb-4 space-y-3 bg-gray-900">
          {/* 難易度フィルタ（A/Lのみ） */}
          <div>
            <p className="text-gray-400 text-xs mb-1.5">難易度</p>
            <div className="flex gap-2">
              {(["A", "L"] as const).map((d) => {
                const colors = { A: "border-red-400 text-red-300 bg-red-950", L: "border-purple-400 text-purple-300 bg-purple-950" };
                return (
                  <button
                    key={d}
                    onClick={() => toggleDifficulty(d)}
                    className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
                      filter.difficulties.includes(d)
                        ? colors[d]
                        : "border-gray-600 text-gray-500"
                    }`}
                  >
                    {d === "A" ? "ANOTHER" : "LEGGENDARIA"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* レベルフィルタ */}
          <div>
            <p className="text-gray-400 text-xs mb-1.5">レベル</p>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => toggleLevel(l)}
                  className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
                    filter.levels.includes(l)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* バージョンフィルタ */}
          {versions.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs mb-1.5">バージョン</p>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {versions.map((v) => (
                  <button
                    key={v}
                    onClick={() => toggleVersion(v)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      filter.versions.includes(v)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-red-400 underline"
            >
              フィルタをすべてクリア
            </button>
          )}
        </div>
      )}
    </div>
  );
}
