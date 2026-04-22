"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const THEMES = [
  { id: "ocean",   name: "Ocean",   accent: "#2563eb" },
  { id: "violet",  name: "Violet",  accent: "#7c3aed" },
  { id: "crimson", name: "Crimson", accent: "#dc2626" },
  { id: "emerald", name: "Emerald", accent: "#059669" },
  { id: "amber",   name: "Amber",   accent: "#d97706" },
  { id: "rose",    name: "Rose",    accent: "#e11d48" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

export default function SettingsPage() {
  const router = useRouter();
  const [current, setCurrent] = useState<ThemeId>("ocean");

  useEffect(() => {
    const saved = localStorage.getItem("iidx-theme") as ThemeId | null;
    if (saved) setCurrent(saved);
  }, []);

  const applyTheme = (id: ThemeId) => {
    setCurrent(id);
    localStorage.setItem("iidx-theme", id);
    document.documentElement.setAttribute("data-theme", id);
  };

  return (
    <div className="flex flex-col h-dvh">
      <div className="bg-gray-800 px-4 py-3 flex items-center gap-3 border-b border-gray-700">
        <button onClick={() => router.back()} className="text-gray-400 p-1 -ml-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white font-bold text-base">設定</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <p className="text-gray-400 text-sm mb-3">カラーテーマ</p>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((theme) => {
              const selected = current === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => applyTheme(theme.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    selected
                      ? "border-white bg-gray-700"
                      : "border-gray-700 bg-gray-800 active:bg-gray-700"
                  }`}
                >
                  <span
                    className="w-10 h-10 rounded-full"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <span className={`text-xs font-medium ${selected ? "text-white" : "text-gray-400"}`}>
                    {theme.name}
                  </span>
                  {selected && (
                    <span className="text-[10px] text-gray-400">選択中</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
