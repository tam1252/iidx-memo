"use client";

import { useEffect, useState } from "react";

interface Props {
  onClose: () => void;
}

function renderMarkdown(md: string) {
  const sections: { heading: string; items: string[] }[] = [];
  let current: { heading: string; items: string[] } | null = null;

  for (const line of md.split("\n")) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { heading: line.slice(3).trim(), items: [] };
    } else if (line.startsWith("- ") && current) {
      current.items.push(line.slice(2).trim());
    }
  }
  if (current) sections.push(current);

  return sections.map(({ heading, items }) => (
    <div key={heading}>
      <p className="text-[var(--accent)] text-xs font-bold uppercase tracking-wide mb-1.5">
        {heading}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-[var(--fg-dim)]">
            <span className="text-[var(--fg-faint)] shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  ));
}

let cachedMd: string | null = null;

export default function HelpModal({ onClose }: Props) {
  const [md, setMd] = useState<string | null>(cachedMd);

  useEffect(() => {
    if (cachedMd) return;
    fetch("/help.md")
      .then((r) => r.text())
      .then((text) => {
        cachedMd = text;
        setMd(text);
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto backdrop-blur-xl"
      style={{ backgroundColor: "color-mix(in srgb, var(--bg-base) 65%, transparent)" }}
      onClick={onClose}
    >
      <div
        className="px-5 pt-5 pb-10 space-y-4 min-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[var(--fg)] font-bold text-base">使い方</h2>
          <button onClick={onClose} className="text-[var(--fg-muted)] p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {md ? renderMarkdown(md) : (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
