"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const THEMES = [
  { id: "ocean",   name: "Ocean",   accent: "#2563eb", accentLight: "#1d4ed8" },
  { id: "violet",  name: "Violet",  accent: "#7c3aed", accentLight: "#6d28d9" },
  { id: "crimson", name: "Crimson", accent: "#dc2626", accentLight: "#b91c1c" },
  { id: "emerald", name: "Emerald", accent: "#059669", accentLight: "#047857" },
  { id: "amber",   name: "Amber",   accent: "#d97706", accentLight: "#b45309" },
  { id: "rose",    name: "Rose",    accent: "#e11d48", accentLight: "#be123c" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];
type Mode = "dark" | "light";

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeId>("ocean");
  const [mode, setMode] = useState<Mode>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("iidx-theme") as ThemeId | null;
    const savedMode  = localStorage.getItem("iidx-mode")  as Mode    | null;
    if (savedTheme) setTheme(savedTheme);
    if (savedMode)  setMode(savedMode);
  }, []);

  const applyTheme = (id: ThemeId) => {
    setTheme(id);
    localStorage.setItem("iidx-theme", id);
    document.documentElement.setAttribute("data-theme", id);
  };

  const applyMode = (m: Mode) => {
    setMode(m);
    localStorage.setItem("iidx-mode", m);
    document.documentElement.setAttribute("data-mode", m);
  };

  return (
    <div className="flex flex-col h-dvh">
      <div className="bg-[var(--bg-elevated)] px-4 py-3 flex items-center gap-3 border-b border-[var(--border)]">
        <button onClick={() => router.back()} className="text-[var(--fg-muted)] p-1 -ml-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[var(--fg)] font-bold text-base">設定</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* ダーク / ライト切り替え */}
        <div>
          <p className="text-[var(--fg-muted)] text-sm mb-3">モード</p>
          <div className="flex gap-1 p-1 bg-[var(--bg-input)] rounded-xl">
            {(["dark", "light"] as const).map((m) => (
              <button
                key={m}
                onClick={() => applyMode(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  mode === m
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "text-[var(--fg-muted)]"
                }`}
              >
                {m === "dark" ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" />
                  </svg>
                )}
                {m === "dark" ? "ダーク" : "ライト"}
              </button>
            ))}
          </div>
        </div>

        {/* カラーテーマ */}
        <div>
          <p className="text-[var(--fg-muted)] text-sm mb-3">カラーテーマ</p>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((t) => {
              const selected = theme === t.id;
              const swatchColor = mode === "light" ? t.accentLight : t.accent;
              return (
                <button
                  key={t.id}
                  onClick={() => applyTheme(t.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    selected
                      ? "border-[var(--accent)] bg-[var(--bg-input)]"
                      : "border-[var(--border)] bg-[var(--bg-elevated)] active:bg-[var(--bg-input)]"
                  }`}
                >
                  <span
                    className="w-10 h-10 rounded-full shadow-sm"
                    style={{ backgroundColor: swatchColor }}
                  />
                  <span className={`text-xs font-medium ${selected ? "text-[var(--fg)]" : "text-[var(--fg-muted)]"}`}>
                    {t.name}
                  </span>
                  {selected && (
                    <span className="text-[10px] text-[var(--fg-faint)]">選択中</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* クレジット */}
        <div className="pt-2 border-t border-[var(--border)]">
          <p className="text-[var(--fg-muted)] text-sm mb-3">クレジット</p>
          <div className="space-y-2 text-xs text-[var(--fg-faint)]">
            <div className="flex justify-between">
              <span>曲データ</span>
              <a
                href="https://bemaniwiki.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] underline-offset-2 underline"
              >
                BEMANI Wiki
              </a>
            </div>
            <div className="flex justify-between">
              <span>譜面データ</span>
              <a
                href="https://textage.cc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] underline-offset-2 underline"
              >
                textage.cc
              </a>
            </div>
            <div className="flex justify-between">
              <span>BPL課題曲</span>
              <a
                href="https://p.eagate.573.jp/game/bpl/season5/2dx/about/music/final/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] underline-offset-2 underline"
              >
                BEMANI PRO LEAGUE S5
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
